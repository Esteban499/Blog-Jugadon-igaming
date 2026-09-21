// Con extension: ver la nota en `jobs/scrapear-promociones.ts`.
import { interioresDe, puntosDeLista, sinClase } from './html.ts'
import type { Adaptador, PromocionCruda, TipoDePromocion, Vertical } from './tipos'

/**
 * Lector del segundo origen de promociones de las plataformas Jugadon.
 *
 * Las cinco publican por dos vias distintas, y hasta ahora el blog leia una
 * sola. `bonus-engine` tiene los bonos: cosas con rollover, deposito minimo y
 * reglas de emision, que la plataforma liquida sola. `sircms` tiene lo otro,
 * torneos y promos de casino, que son piezas de marketing con bases redactadas
 * a mano y sin ninguna mecanica que el sistema calcule.
 *
 * Por eso este adaptador llena bastante menos campos que el de campanias, y no
 * es una carencia a corregir: no existe un rollover que leer. Lo que devuelve
 * es titulo, gancho, vigencia, imagen y en que vertical corre.
 *
 * El resumen se saca por estructura, no por marcador, y esa es la diferencia
 * importante con el adaptador de campanias. Ver `extraerResumen`.
 */

type PromoDeSircms = {
  title?: string
  subtitle?: string
  etiqueta_premio?: string | null
  slug?: string
  category_name?: string
  image?: string
  date_start?: string
  date_end?: string
  /** Las bases completas. Vienen dos veces, casi iguales; alcanza con una. */
  terms?: string
  termsHtml?: string
}

/**
 * `success` con la lista, o `error` con el motivo. No hay un `success: []`:
 * cuando no hay nada, contesta `error: "no_promotions"`.
 */
type RespuestaDeSircms = {
  success?: PromoDeSircms[]
  error?: string
}

const texto = (valor: unknown): string | undefined => {
  if (typeof valor !== 'string') return undefined
  const limpio = valor.trim()
  return limpio.length > 0 ? limpio : undefined
}

/**
 * Las marcas vienen sin zona: "2026-08-14 02:59:00".
 *
 * Son UTC. Se ve en que los valores se repiten en `02:59:00` y `03:00:00`, que
 * son las 23:59 y las 00:00 de Argentina; leerlas como hora local correria
 * todas las vigencias tres horas. Es ademas la misma convencion que usa
 * `bonus-engine`, que si declara la Z.
 */
const fechaUtc = (valor: unknown): string | undefined => {
  const crudo = texto(valor)
  if (!crudo) return undefined
  const ms = Date.parse(`${crudo.replace(' ', 'T')}Z`)
  return Number.isNaN(ms) ? undefined : new Date(ms).toISOString()
}

const VERTICAL_POR_CATEGORIA: Record<string, Vertical> = {
  casino: 'casino',
  'casino live': 'casino-en-vivo',
  'casino en vivo': 'casino-en-vivo',
  deportes: 'deportes',
  sports: 'deportes',
  esports: 'esports',
  virtuales: 'virtuales',
}

/**
 * De que se trata, deducido del titulo.
 *
 * Es lo unico que este adaptador adivina, y adivina poco a proposito: sin las
 * reglas de una campania no hay de donde deducir la mecanica. `tipo` es un
 * campo deducido, asi que el runner lo escribe solo al crear y la correccion
 * de un editor sobrevive a las corridas siguientes.
 */
const deducirTipo = (p: PromoDeSircms): TipoDePromocion =>
  /\btorneo\b/i.test(p.title ?? '') ? 'torneo' : 'otro'

/**
 * El resumen redactado, que en estas bases es la primera lista SIN clase.
 *
 * No hay marcador. El `div.jgd-summary` que busca el adaptador de campanias
 * aparece en estas bases solo dentro del `<style>`, como CSS heredado de la
 * plantilla, sin un solo elemento que lo use. Lo que si hay es una regularidad
 * de la plantilla: el resumen es la unica lista suelta, y TODAS las demas
 * llevan una clase que dice que son (`jgd-steps`, `jgd-list-plain`,
 * `jgd-scales`, `jgd-rules`). Asi que la regla no mira el contenido de las
 * listas para adivinar cual es el resumen, mira cual es la que no se declaro
 * como otra cosa.
 *
 * Es mas fragil que el marcador explicito de los bonos y conviene saberlo: si
 * la plantilla cambia y a esa lista le ponen una clase, esto deja de encontrar
 * el resumen y la promocion se publica sin puntos, que es la falla suave. La
 * dura seria que le saquen la clase a la lista de terminos, y ahi se publicaria
 * letra chica como si fuera el resumen. Por eso el aviso de mas abajo cuando no
 * aparece: es la seniál de que la plantilla se movio.
 *
 * El arreglo de fondo sigue siendo que la plataforma envuelva el bloque en
 * `jgd-summary`, como ya hace en las bases de los bonos. Ahi esto se vuelve
 * innecesario.
 */
const extraerResumen = (html: string): string[] => {
  // Sin el <style>: ahi esta el CSS que define .jgd-summary y no hay markup.
  const cuerpo = html.replace(/<style[\s\S]*?<\/style>/gi, ' ')

  // La primera CON contenido, no la primera a secas: "Drops and Wins" arrastra
  // una lista suelta vacia antes de las suyas, y quedarse con esa taparia el
  // resumen el dia que se lo agreguen.
  for (const bloque of interioresDe(cuerpo, 'ul', sinClase)) {
    const puntos = puntosDeLista(bloque)
    if (puntos.length > 0) return puntos
  }

  return []
}

export const jugadonSircms: Adaptador = async ({ url, urlApi, plataforma }) => {
  const avisos: string[] = []

  if (!urlApi) {
    throw new Error(
      `${plataforma} no tiene cargada la base de la API. Sale del PROXY_URL que declara el sitio.`,
    )
  }

  const sitio = new URL(url).origin
  const endpoint = `${urlApi.replace(/\/+$/, '')}/sircms/promotions`

  const respuesta = await fetch(endpoint, {
    headers: { Accept: 'application/json', Origin: sitio, Referer: `${sitio}/` },
    signal: AbortSignal.timeout(30_000),
  })

  if (!respuesta.ok) {
    throw new Error(`${endpoint} respondió ${respuesta.status} ${respuesta.statusText}`)
  }

  const tipoDeContenido = respuesta.headers.get('content-type') ?? ''
  if (!tipoDeContenido.includes('json')) {
    // El SPA contesta su propio HTML a cualquier ruta que no reconoce, asi que
    // un 200 con text/html es la firma de una URL de API equivocada.
    throw new Error(`${endpoint} devolvió ${tipoDeContenido || 'contenido sin tipo'}, no JSON.`)
  }

  const cuerpo = (await respuesta.json()) as RespuestaDeSircms

  /**
   * "Sin promociones" llega como error, y hay que separarlo de un error de
   * verdad.
   *
   * Confundirlos es la peor falla posible de este archivo. La regla 3 del
   * runner aborta la plataforma cuando un adaptador devuelve cero teniendo
   * activas guardadas, justamente para no vaciar la seccion cuando el origen
   * se rompe; pero si este adaptador tradujera cualquier error a lista vacia,
   * el runner recibiria un cero legitimo y expiraria todo lo que hay.
   */
  if (cuerpo.error) {
    if (cuerpo.error === 'no_promotions') return { promociones: [], avisos }
    throw new Error(`${endpoint} respondió el error "${cuerpo.error}".`)
  }

  if (!Array.isArray(cuerpo.success)) {
    throw new Error(`${endpoint} no devolvió ni "success" ni "error": cambió la forma del JSON.`)
  }

  const ahora = Date.now()
  const promociones: PromocionCruda[] = []

  for (const p of cuerpo.success) {
    const slug = texto(p.slug)
    if (!slug) {
      avisos.push('Una promoción vino sin slug y se salteó: sin clave estable no se puede seguir.')
      continue
    }

    const titulo = texto(p.title)
    if (!titulo) {
      avisos.push(`La promoción ${slug} no tiene título y se salteó.`)
      continue
    }

    const vigenciaHasta = fechaUtc(p.date_end)

    // Una vencida se saltea y el runner la marca expirada al no verla.
    if (vigenciaHasta && Date.parse(vigenciaHasta) < ahora) continue

    const puntosClave = extraerResumen(texto(p.termsHtml) ?? texto(p.terms) ?? '')
    if (puntosClave.length === 0) {
      avisos.push(
        `"${titulo}" no trae resumen en sus bases: se publica solo con la bajada. Envolver los ` +
          'puntos en un `div.jgd-summary`, como ya se hace en las bases de los bonos, es lo que ' +
          'lo destraba.',
      )
    }

    const categoria = texto(p.category_name)?.toLowerCase()
    const vertical = categoria ? VERTICAL_POR_CATEGORIA[categoria] : undefined
    if (categoria && !vertical) {
      avisos.push(
        `"${titulo}" viene en la categoría "${categoria}", que no está mapeada a ningún ` +
          'vertical: la promoción se publica igual, pero no va a aparecer con el filtro puesto.',
      )
    }

    promociones.push({
      // Con prefijo: esta clave convive en la misma plataforma con las de
      // `bonus-engine`, y el runner las busca en un unico mapa. Hoy no podrian
      // chocar (aquellas son hex de 24), pero el prefijo lo garantiza y de paso
      // deja ver en el panel de donde salio cada promocion.
      claveExterna: `sircms:${slug}`,
      titulo,
      tipo: deducirTipo(p),
      // El gancho que redacta la plataforma. Solo algunas lo traen.
      oferta: texto(p.etiqueta_premio),
      resumen: texto(p.subtitle)?.slice(0, 300),
      puntosClave,
      verticales: vertical ? [vertical] : undefined,
      vigenciaDesde: fechaUtc(p.date_start),
      vigenciaHasta,
      /**
       * El listado de bonos de la plataforma, no una ficha propia: estas
       * promociones no tienen URL publica individual. Probado contra
       * `/promotion/<slug>`, `/promotions/<slug>` y `/promotion/detail/<slug>`,
       * las tres dan 404. Se manda a `/bonus-campaign/`, que es donde la
       * plataforma quiere que se canjeen.
       */
      urlDestino: `${sitio}/bonus-campaign/`,
      imagen: texto(p.image),
    })
  }

  return { promociones, avisos }
}
