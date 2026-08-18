// Con extension: ver la nota en `jobs/scrapear-promociones.ts`.
import { interiorDelPrimero, puntosDeLista, tieneClase } from './html.ts'
import type {
  Adaptador,
  FormaDeActivacion,
  PromocionCruda,
  TipoDePromocion,
  Vertical,
} from './tipos'

/**
 * Lector de promociones de las plataformas Jugadon.
 *
 * Estrictamente no scrapea: las cinco corren la misma app en Nuxt, que pide las
 * campañas a `PROXY_URL/bonus-engine/api/campaigns`. Ese endpoint devuelve JSON
 * y no pide autenticacion, asi que en lugar de leer el HTML renderizado se
 * consume la misma API que consume el sitio.
 *
 * La diferencia no es de estilo. El HTML de esa pagina lo pinta JavaScript
 * despues de hidratar, o sea que scrapearlo pediria un Chromium headless; y aun
 * teniendolo, el rollover habria que sacarlo de un texto tipo "35x" en vez de
 * leer `rolloverValue: 35`. Por la API los numeros llegan como numeros.
 *
 * Lo que hay que vigilar es la forma del JSON, no la maqueta: si el equipo de
 * plataforma cambia el modelo de campañas, lo que se rompe es el mapeo de aca
 * abajo.
 */

type Regla = {
  id?: string
  module?: string
  enabled?: boolean
  config?: Record<string, unknown>
}

type Campania = {
  _id?: string
  status?: string
  startDate?: string
  endDate?: string
  code?: { value?: string } | null
  freespins?: { enabled?: boolean } | null
  smartType?: string[] | null
  limits?: { maxAmount?: number; maxUsagePerUser?: number } | null
  rules?: { triggers?: Regla[]; conditions?: Regla[]; actions?: Regla[] } | null
  details?: Record<string, Detalle | undefined> | null
  /** Donde corre el bono, partido en `_BET` y `_WIN`. Ver `VERTICALES`. */
  allowedContexts?: string[] | null
  /** `auto` si cae solo, `manual` si hay que reclamarlo. */
  subscription?: string
  /** `true` cuando el bono NO se puede combinar con otro. */
  nonCumulative?: boolean
  /** El plazo para cumplir el rollover, en dias. */
  rollbackDeadline?: { enabled?: boolean; days?: number } | null
}

type Detalle = {
  title?: string
  promoText?: string
  etiquetaPremio?: string
  termsAndConditions?: string
  image?: string
}

const pesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const numero = (valor: unknown): number | undefined =>
  typeof valor === 'number' && Number.isFinite(valor) ? valor : undefined

const texto = (valor: unknown): string | undefined => {
  if (typeof valor !== 'string') return undefined
  const limpio = valor.trim()
  return limpio.length > 0 ? limpio : undefined
}

const reglas = (c: Campania, grupo: 'triggers' | 'conditions' | 'actions'): Regla[] =>
  (c.rules?.[grupo] ?? []).filter((r) => r?.enabled !== false)

const buscarModulo = (c: Campania, grupo: 'triggers' | 'conditions' | 'actions', modulo: string) =>
  reglas(c, grupo).find((r) => r.module === modulo)

/**
 * Los puntos del resumen que el equipo de plataforma escribe en las bases de
 * cada bono, dentro de un `div.jgd-summary`.
 *
 * Es contenido redactado por una persona y revisado del lado de la plataforma,
 * no algo que el bot deduzca, y por eso es lo que se publica. Se descartan los
 * `<li>` vacios y el titulo "Resumen", que es del recuadro y no un punto.
 */
const extraerPuntosClave = (html: string): string[] => {
  const bloque = interiorDelPrimero(html, 'div', (attrs) => tieneClase(attrs, 'jgd-summary'))
  return bloque ? puntosDeLista(bloque) : []
}

/**
 * De que se trata el bono, deducido de como esta armado y no del titulo.
 *
 * Es lo unico que este adaptador adivina, y por eso el runner lo escribe solo
 * al crear: un editor que lo corrija manda por encima del bot.
 */
const deducirTipo = (c: Campania): TipoDePromocion => {
  const smart = (c.smartType ?? []).map((s) => s.toUpperCase())
  if (smart.includes('CASHBACK') || buscarModulo(c, 'conditions', 'CASHBACK')) return 'cashback'
  if (c.freespins?.enabled) return 'giros-gratis'
  if (buscarModulo(c, 'triggers', 'FIRST_DEPOSIT') || buscarModulo(c, 'triggers', 'DEPOSIT')) {
    return 'recarga'
  }
  if (buscarModulo(c, 'triggers', 'USER_REGISTRATION')) return 'bienvenida'
  return 'otro'
}

/** "100% hasta $500.000" o "$25.000", segun como se emita el bono. */
const describirOferta = (c: Campania): string | undefined => {
  const accion = buscarModulo(c, 'actions', 'issue_bonus')
  const config = accion?.config
  if (!config) return undefined

  const tope = numero(config.maxAmount) ?? numero(c.limits?.maxAmount)
  const porcentaje = numero(config.percentage)
  if (config.bonusType === 'percentage' && porcentaje !== undefined) {
    return tope !== undefined ? `${porcentaje}% hasta ${pesos.format(tope)}` : `${porcentaje}%`
  }

  const monto = numero(config.amount)
  if (monto !== undefined) return pesos.format(monto)
  return undefined
}

const SOBRE_QUE_APLICA: Record<string, string> = {
  BONUS: 'sobre el bono',
  DEPOSIT: 'sobre el depósito',
  FIRST_DEPOSIT: 'sobre el primer depósito',
  deposit_only: 'sobre el depósito',
  first_deposit_only: 'sobre el primer depósito',
}

/**
 * "35x sobre el primer depósito".
 *
 * El `35` es exacto: viene como numero. Lo que hay que traducir es sobre que se
 * calcula, y ahi la plataforma tiene un caso indirecto: cuando la base dice
 * `CALCULATION_RULE`, el dato real esta en el `calculationRule` de la accion
 * que emite el bono. Si aparece un valor que no esta en la tabla se devuelve
 * solo el multiplicador, que es incompleto pero no es falso.
 */
const describirRollover = (c: Campania): string | undefined => {
  const config = buscarModulo(c, 'conditions', 'ROLLOVER')?.config
  const valor = numero(config?.rolloverValue)
  if (valor === undefined) return undefined

  const base = texto(config?.rollover)
  const clave =
    base === 'CALCULATION_RULE'
      ? texto(buscarModulo(c, 'actions', 'issue_bonus')?.config?.calculationRule)
      : base

  const objetivo = clave ? SOBRE_QUE_APLICA[clave] : undefined
  return objetivo ? `${valor}x ${objetivo}` : `${valor}x`
}

const describirDepositoMinimo = (c: Campania): string | undefined => {
  const trigger = buscarModulo(c, 'triggers', 'FIRST_DEPOSIT') ?? buscarModulo(c, 'triggers', 'DEPOSIT')
  const minimo = numero(trigger?.config?.minAmount)
  return minimo === undefined ? undefined : pesos.format(minimo)
}

/**
 * El tope de conversion a saldo real, salvo cuando ya se dijo arriba.
 *
 * `limits.maxAmount` cumple dos papeles segun como se emita el bono. En los de
 * porcentaje es el techo, y ahi `describirOferta` ya lo muestra dentro de la
 * oferta ("100% hasta $100.000"); volver a publicarlo abajo como "tope de
 * conversion" hace leer dos limites donde hay uno. En los de monto fijo la
 * oferta no lo usa ($25.000 de bono con tope de $40.000), y ahi el dato es
 * nuevo y vale publicarlo.
 *
 * La comparacion es contra el numero que efectivamente salio en la oferta, no
 * contra el tipo de bono: cuando la accion trae su propio `maxAmount`, el techo
 * de la oferta es ese y puede diferir del limite de la campania, y en ese caso
 * los dos numeros son distintos y los dos importan.
 */
const describirTope = (c: Campania): string | undefined => {
  const tope = numero(c.limits?.maxAmount)
  if (tope === undefined) return undefined

  const config = buscarModulo(c, 'actions', 'issue_bonus')?.config
  const esPorcentaje = config?.bonusType === 'percentage' && numero(config?.percentage) !== undefined
  const techoDeLaOferta = esPorcentaje ? (numero(config?.maxAmount) ?? tope) : undefined

  return techoDeLaOferta === tope ? undefined : pesos.format(tope)
}

/** Los dias para cumplir el rollover, cuando la campania pone plazo. */
const describirPlazo = (c: Campania): number | undefined =>
  c.rollbackDeadline?.enabled ? numero(c.rollbackDeadline?.days) : undefined

const VERTICAL_POR_CONTEXTO: Record<string, Vertical> = {
  CASINO: 'casino',
  CASINOLIVE: 'casino-en-vivo',
  SPORT: 'deportes',
  ESPORT: 'esports',
  VIRTUAL: 'virtuales',
}

/**
 * Los verticales donde corre el bono, sin el sufijo `_BET` / `_WIN`.
 *
 * Un contexto desconocido se ignora en silencio en vez de avisar: la lista de
 * arriba es de las cinco que la plataforma ofrece hoy, y que maniana aparezca
 * un vertical nuevo no es un problema de esta promocion ni algo que quien lee
 * el resumen de la corrida pueda arreglar. Lo que no se hace es inventarle una
 * etiqueta.
 */
const describirVerticales = (c: Campania): Vertical[] | undefined => {
  const vistos = new Set<Vertical>()
  for (const contexto of c.allowedContexts ?? []) {
    const vertical = VERTICAL_POR_CONTEXTO[contexto.replace(/_(BET|WIN)$/, '')]
    if (vertical) vistos.add(vertical)
  }
  return vistos.size > 0 ? [...vistos] : undefined
}

/**
 * Cuantos juegos habilita la campania.
 *
 * Solo cuando hay lista. Una condicion de casino SIN `allowedGames` no es un
 * bono sin juegos: es un bono que vale para todo el casino, y devolver 0 ahi
 * publicaria lo contrario de lo que dice el origen.
 */
const contarJuegos = (c: Campania): number | undefined => {
  const juegos = buscarModulo(c, 'conditions', 'CASINO')?.config?.allowedGames
  return Array.isArray(juegos) && juegos.length > 0 ? juegos.length : undefined
}

/** La cuota minima que tiene que tener la apuesta. Solo en los de deportes. */
const describirCuotaMinima = (c: Campania): number | undefined =>
  numero(buscarModulo(c, 'conditions', 'SPORT')?.config?.minDecimalOdds)

const describirActivacion = (c: Campania): FormaDeActivacion | undefined => {
  if (c.subscription === 'auto') return 'automatica'
  if (c.subscription === 'manual') return 'a-pedido'
  return undefined
}

/**
 * Los puntos armados con las reglas de la campania, para las promociones que no
 * traen `jgd-summary`.
 *
 * Las bases viejas son un texto legal corrido, sin recuadro de resumen y sin
 * una sola clase en el HTML: no hay de donde sacar el resumen redactado. Estos
 * puntos salen de los mismos numeros con los que la plataforma liquida el bono,
 * asi que son exactos, pero dicen menos que los escritos a mano.
 */
const puntosDeRespaldo = (c: Campania): string[] => {
  const oferta = describirOferta(c)
  const rollover = describirRollover(c)
  const minimo = describirDepositoMinimo(c)
  const tope = numero(c.limits?.maxAmount)
  const codigo = texto(c.code?.value)

  return [
    oferta ? `Bono de ${oferta}.` : undefined,
    codigo ? `Código: ${codigo}.` : undefined,
    rollover ? `Rollover ${rollover}.` : undefined,
    minimo ? `Depósito mínimo: ${minimo}.` : undefined,
    tope !== undefined ? `Tope de conversión a saldo real: ${pesos.format(tope)}.` : undefined,
  ].filter((punto): punto is string => Boolean(punto))
}

/** Una linea con los datos duros, para el listado y la meta descripcion. */
const componerResumen = (partes: (string | undefined)[]): string | undefined => {
  const linea = partes.filter(Boolean).join(' · ')
  return linea.length > 0 ? linea.slice(0, 300) : undefined
}

export const jugadonBonusEngine: Adaptador = async ({ url, urlApi, plataforma }) => {
  const avisos: string[] = []

  if (!urlApi) {
    throw new Error(
      `${plataforma} no tiene cargada la base de la API. Sale del PROXY_URL que declara el sitio.`,
    )
  }

  // El host publico, para armar los enlaces a cada promocion.
  const sitio = new URL(url).origin
  const base = urlApi.replace(/\/+$/, '')

  const campanias: Campania[] = []
  let pagina = 1
  let paginas = 1

  do {
    const endpoint = `${base}/bonus-engine/api/campaigns?status=active&page=${pagina}`
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

    const cuerpo = (await respuesta.json()) as {
      campaigns?: Campania[]
      pagination?: { pages?: number }
    }
    campanias.push(...(cuerpo.campaigns ?? []))
    paginas = numero(cuerpo.pagination?.pages) ?? 1
    pagina += 1
  } while (pagina <= paginas && pagina <= 20)

  const ahora = Date.now()
  const promociones: PromocionCruda[] = []

  for (const c of campanias) {
    const id = texto(c._id)
    if (!id) {
      avisos.push('Una campaña vino sin _id y se salteó: sin clave estable no se puede seguir.')
      continue
    }

    if (c.status !== 'active') continue

    // Una campaña vencida se saltea y el runner la marca expirada al no verla.
    if (c.endDate && Date.parse(c.endDate) < ahora) continue

    const detalle = c.details?.es
    const titulo = texto(detalle?.title)
    if (!titulo) {
      // Pasa de verdad: hay campañas cargadas sin la ficha en español.
      avisos.push(`La campaña ${id} no tiene título en español y se salteó.`)
      continue
    }

    const oferta = texto(detalle?.promoText) ?? describirOferta(c)
    const rollover = describirRollover(c)
    const depositoMinimo = describirDepositoMinimo(c)

    const bases = texto(detalle?.termsAndConditions) ?? ''
    let puntosClave = extraerPuntosClave(bases)

    if (puntosClave.length === 0) {
      puntosClave = puntosDeRespaldo(c)
      avisos.push(
        `"${titulo}" no trae el recuadro jgd-summary en sus bases: se publicaron los puntos ` +
          'armados con las reglas de la campaña. Agregar el resumen del lado de la plataforma ' +
          'mejora lo que se ve en el blog.',
      )
    }

    promociones.push({
      claveExterna: id,
      titulo,
      tipo: deducirTipo(c),
      oferta,
      resumen: componerResumen([
        describirOferta(c),
        rollover ? `Rollover ${rollover}` : undefined,
        depositoMinimo ? `Depósito mínimo ${depositoMinimo}` : undefined,
      ]),
      rollover,
      depositoMinimo,
      codigo: texto(c.code?.value),
      topeDeConversion: describirTope(c),
      usosPorUsuario: numero(c.limits?.maxUsagePerUser),
      diasParaCumplir: describirPlazo(c),
      cuotaMinima: describirCuotaMinima(c),
      // `nonCumulative` viene como booleano o no viene: `undefined` es "no lo
      // dice", y no se traduce a "no se combina".
      combinable: typeof c.nonCumulative === 'boolean' ? !c.nonCumulative : undefined,
      verticales: describirVerticales(c),
      juegosHabilitados: contarJuegos(c),
      activacion: describirActivacion(c),
      vigenciaDesde: texto(c.startDate),
      vigenciaHasta: texto(c.endDate),
      urlDestino: `${sitio}/bonus-campaign/detail-bonus/${id}`,
      puntosClave,
      imagen: texto(detalle?.image),
    })
  }

  return { promociones, avisos }
}
