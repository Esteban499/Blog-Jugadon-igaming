import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
// Con extension: este modulo lo carga Node por el Jobs Queue, no el bundler.
// Ver la nota en `jobs/scrapear-promociones.ts`.
import { slugify } from '../fields/slug.ts'
import { DOMINIO_DE_PLATAFORMAS, esUrlDePlataforma } from '../utilidades/jurisdicciones.ts'
import { adaptadores } from './registro.ts'
import type { PromocionCruda, SlugDeAdaptador } from './tipos'

/**
 * El bot: recorre las plataformas activas, lee sus promociones y las deja en el
 * panel para que un editor las apruebe.
 *
 * Se corre de dos maneras, y las dos entran por aca: a mano con
 * `pnpm scrapear-promos`, y todos los dias por el Jobs Queue de Payload.
 *
 * Publica y expira solo, sin aprobacion de por medio. Lo que sostiene eso no es
 * el bot sino de donde sale el texto: lo que se publica es el resumen que el
 * equipo de plataforma escribe en las bases de cada bono, ya revisado del otro
 * lado. El bot copia y ordena; no interpreta prosa.
 *
 * Tres reglas gobiernan todo lo que hay aca abajo:
 *
 * 1. Publica lo vigente. El adaptador descarta las vencidas antes de devolver,
 *    asi que lo que llega hasta aca esta en fecha.
 * 2. No borra. Lo que desaparece del origen, o pasa su fecha de corte, va a
 *    `expirada`: sale del sitio pero la URL sobrevive y no se pierde lo que ya
 *    estaba indexado.
 * 3. Ante la duda, no toca nada. Si un adaptador falla o devuelve cero teniendo
 *    promociones activas guardadas, la corrida de esa plataforma se aborta con
 *    un aviso. Es el caso tipico de "rediseniaron la pagina", y confundirlo con
 *    "se terminaron todas las promociones" vaciaria la seccion de golpe. Esta
 *    regla es mas importante ahora que no hay nadie revisando cada cambio.
 */

export type Resumen = {
  plataforma: string
  creadas: number
  actualizadas: number
  expiradas: number
  sinCambios: number
  avisos: string[]
}

/**
 * Hash de lo que trajo el scraper. Es lo que distingue "esta promocion cambio"
 * de "esta promocion sigue igual", y sin eso una corrida diaria generaria una
 * version nueva por dia de cada documento: con `maxPerDoc` en 25, en menos de
 * un mes el historial de versiones no tendria mas que pasadas del bot y se
 * habria comido las ediciones de las personas.
 */
const huellaDe = (p: PromocionCruda): string =>
  createHash('sha256')
    .update(
      JSON.stringify([
        // Solo lo que viene literal del origen: `tipo` y `resumen` los deduce
        // el adaptador y no se reescriben, asi que no deben mover la huella.
        p.titulo,
        p.oferta ?? '',
        p.rollover ?? '',
        p.depositoMinimo ?? '',
        p.codigo ?? '',
        p.vigenciaDesde ?? '',
        p.vigenciaHasta ?? '',
        p.urlDestino,
        (p.puntosClave ?? []).join('\n'),
        p.imagen ?? '',
        p.topeDeConversion ?? '',
        p.usosPorUsuario ?? '',
        p.diasParaCumplir ?? '',
        p.cuotaMinima ?? '',
        p.combinable ?? '',
        (p.verticales ?? []).join(','),
        p.juegosHabilitados ?? '',
        p.activacion ?? '',
      ]),
    )
    .digest('hex')

/**
 * El slug lleva el prefijo de la plataforma porque es unico en toda la
 * coleccion y "bono-de-bienvenida" lo van a querer las cinco. Si aun asi choca
 * (dos promociones con el mismo titulo en la misma plataforma), desempata un
 * trozo de la clave externa, que si es unica en el origen.
 */
const slugParaPromocion = async (
  payload: Payload,
  prefijo: string,
  titulo: string,
  claveExterna: string,
): Promise<string> => {
  const base = `${prefijo}-${slugify(titulo)}`
  const { totalDocs } = await payload.count({
    collection: 'promociones',
    where: { slug: { equals: base } },
  })
  if (totalDocs === 0) return base
  return `${base}-${createHash('sha256').update(claveExterna).digest('hex').slice(0, 6)}`
}

/**
 * Lo que viene literal de la plataforma. La plataforma es la fuente de verdad,
 * asi que esto se sobreescribe en cada cambio del origen.
 */
const camposDelOrigen = (p: PromocionCruda) => ({
  titulo: p.titulo,
  oferta: p.oferta,
  rollover: p.rollover,
  depositoMinimo: p.depositoMinimo,
  codigo: p.codigo,
  vigenciaDesde: p.vigenciaDesde,
  vigenciaHasta: p.vigenciaHasta,
  urlDestino: p.urlDestino,
  puntosClave: (p.puntosClave ?? []).join('\n'),
  imagenOrigen: p.imagen,
  topeDeConversion: p.topeDeConversion,
  usosPorUsuario: p.usosPorUsuario,
  diasParaCumplir: p.diasParaCumplir,
  cuotaMinima: p.cuotaMinima,
  // El booleano se guarda como select para poder distinguir "no se combina" de
  // "la plataforma no lo dice". Ver el campo en la coleccion.
  combinable: p.combinable === undefined ? undefined : p.combinable ? ('si' as const) : ('no' as const),
  verticales: p.verticales,
  juegosHabilitados: p.juegosHabilitados,
  activacion: p.activacion,
})

/**
 * Lo que el adaptador dedujo. Se escribe solo al crear: si un editor
 * recategoriza un bono o le reescribe el resumen para buscadores, la corrida
 * siguiente no se lo pisa.
 */
const camposDeducidos = (p: PromocionCruda) => ({
  tipo: p.tipo,
  resumen: p.resumen,
})

/**
 * Expirar no tiene que despublicar.
 *
 * Con `drafts: true`, un `payload.update` que no manda `_status` cae en 'draft'
 * por defecto. Una promocion expirada terminaba asi despublicada, y como la
 * pagina de detalle exige `published`, su URL pasaba a devolver 404: lo
 * contrario de lo que busca la regla 2, que la promocion salga del listado pero
 * la direccion siga viva para lo que ya estaba indexado o compartido.
 *
 * Se repite el estado que el documento ya tenia en lugar de forzar 'published',
 * que ademas seria un problema aparte en el barrido por fecha: ahi entran las
 * cargadas a mano, y publicar de prepo el borrador de un editor por haberle
 * vencido la fecha seria peor que el 404.
 */
const sinCambiarLaPublicacion = (doc: { _status?: 'draft' | 'published' | null }) => ({
  _status: doc._status ?? 'published',
})

export const correrScrapeo = async (payload: Payload): Promise<Resumen[]> => {
  const ahora = new Date().toISOString()
  const resumenes: Resumen[] = []

  const { docs: plataformas } = await payload.find({
    collection: 'plataformas',
    where: { scrapeoActivo: { equals: true } },
    depth: 0,
    limit: 100,
    pagination: false,
  })

  if (plataformas.length === 0) {
    payload.logger.warn('No hay ninguna plataforma con el scrapeo activo.')
    return resumenes
  }

  for (const plataforma of plataformas) {
    const resumen: Resumen = {
      plataforma: plataforma.nombre,
      creadas: 0,
      actualizadas: 0,
      expiradas: 0,
      sinCambios: 0,
      avisos: [],
    }
    resumenes.push(resumen)

    /** Deja el resultado a la vista en el panel, no solo en la salida del proceso. */
    const registrar = async (texto: string) => {
      await payload.update({
        collection: 'plataformas',
        id: plataforma.id,
        data: { ultimaCorrida: ahora, ultimoResultado: texto },
      })
    }

    /** Un problema: ademas de quedar en el panel, sale como warning al cerrar. */
    const anotar = async (texto: string) => {
      resumen.avisos.push(texto)
      await registrar(texto)
    }

    const adaptador = adaptadores[plataforma.adaptador as SlugDeAdaptador]
    if (!adaptador) {
      await anotar(`No hay adaptador implementado para "${plataforma.adaptador}".`)
      continue
    }

    /*
     * La misma regla que valida los campos en el panel, repetida aca porque la
     * validacion solo corre al guardar: una fila cargada antes de que existiera,
     * o escrita directo en la base, llegaria igual. Estas URLs las pide el
     * servidor, asi que no sale ningun pedido que no vaya a un dominio de Jugadon.
     */
    if (
      !esUrlDePlataforma(plataforma.urlPromociones) ||
      (plataforma.urlApi && !esUrlDePlataforma(plataforma.urlApi))
    ) {
      await anotar(
        `La página de promociones o la base de la API no es una dirección https de ` +
          `${DOMINIO_DE_PLATAFORMAS}: no se lee. Corregirla en la plataforma.`,
      )
      continue
    }

    let promociones: PromocionCruda[]
    try {
      const resultado = await adaptador({
        url: plataforma.urlPromociones,
        urlApi: plataforma.urlApi,
        plataforma: plataforma.nombre,
      })
      promociones = resultado.promociones
      resumen.avisos.push(...resultado.avisos)
    } catch (error) {
      await anotar(`Falló la lectura: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }

    // Lo que el bot cargo antes para esta plataforma. Lo que cargo una persona
    // no entra: el bot no lo actualiza ni lo expira.
    const { docs: guardadas } = await payload.find({
      collection: 'promociones',
      where: {
        and: [{ plataforma: { equals: plataforma.id } }, { origen: { equals: 'scraper' } }],
      },
      depth: 0,
      limit: 500,
      pagination: false,
      draft: true,
    })

    const activas = guardadas.filter((g) => g.estado === 'activa')

    if (promociones.length === 0 && activas.length > 0) {
      await anotar(
        `El adaptador no devolvió ninguna promoción y hay ${activas.length} activas guardadas. ` +
          'No se tocó nada: probablemente cambió la maqueta de la página.',
      )
      continue
    }

    const porClave = new Map(guardadas.map((g) => [g.claveExterna, g]))
    const vistas = new Set<string>()

    for (const cruda of promociones) {
      vistas.add(cruda.claveExterna)
      const guardada = porClave.get(cruda.claveExterna)
      const huella = huellaDe(cruda)

      if (!guardada) {
        await payload.create({
          collection: 'promociones',
          data: {
            // Se publica sola. El adaptador ya descarto las vencidas, asi que
            // todo lo que llega hasta aca esta vigente.
            _status: 'published',
            ...camposDelOrigen(cruda),
            ...camposDeducidos(cruda),
            plataforma: plataforma.id,
            slug: await slugParaPromocion(
              payload,
              plataforma.slug ?? slugify(plataforma.nombre),
              cruda.titulo,
              cruda.claveExterna,
            ),
            estado: 'activa',
            origen: 'scraper',
            claveExterna: cruda.claveExterna,
            huella,
            vistoPorUltimaVez: ahora,
          },
        })
        resumen.creadas += 1
        continue
      }

      if (guardada.huella === huella && guardada.estado === 'activa') {
        // Nada cambio en el origen. Se registra que se la vio, y nada mas: pasar
        // por `payload.update` acumularia una version por dia sin contenido nuevo.
        await payload.db.updateOne({
          collection: 'promociones',
          id: guardada.id,
          data: { vistoPorUltimaVez: ahora },
        })
        resumen.sinCambios += 1
        continue
      }

      // Cambio en el origen: se reescribe y sale publicado. La version anterior
      // queda en el historial, que es donde se audita que toco el bot.
      await payload.update({
        collection: 'promociones',
        id: guardada.id,
        data: {
          ...camposDelOrigen(cruda),
          _status: 'published',
          estado: 'activa',
          huella,
          vistoPorUltimaVez: ahora,
        },
      })
      resumen.actualizadas += 1
    }

    // Lo que ya no aparece en el origen.
    for (const guardada of activas) {
      if (vistas.has(guardada.claveExterna ?? '')) continue
      await payload.update({
        collection: 'promociones',
        id: guardada.id,
        data: { estado: 'expirada', ...sinCambiarLaPublicacion(guardada) },
      })
      resumen.expiradas += 1
    }

    await registrar(
      `${resumen.creadas} nuevas, ${resumen.actualizadas} actualizadas, ` +
        `${resumen.expiradas} expiradas, ${resumen.sinCambios} sin cambios.`,
    )
  }

  /**
   * Barrido final de vencidas por fecha, aparte del recorrido por plataforma.
   *
   * La vigencia no depende de que el origen conteste: una promocion que vencio
   * a las tres de la maniana tiene que salir del sitio igual, aunque hoy su
   * plataforma falle, aunque el adaptador se haya roto, o aunque la promocion
   * se siga listando en el origen despues de su fecha de corte.
   *
   * Entran tambien las cargadas a mano. No es una excepcion a "el bot no toca
   * lo manual": expirar por `vigenciaHasta` es cumplir la fecha que puso el
   * editor, no pisarla.
   */
  const { docs: vencidas } = await payload.find({
    collection: 'promociones',
    where: {
      and: [{ estado: { equals: 'activa' } }, { vigenciaHasta: { less_than: ahora } }],
    },
    depth: 0,
    limit: 500,
    pagination: false,
  })

  for (const vencida of vencidas) {
    await payload.update({
      collection: 'promociones',
      id: vencida.id,
      data: { estado: 'expirada', ...sinCambiarLaPublicacion(vencida) },
    })
  }

  if (vencidas.length > 0) {
    payload.logger.info(`${vencidas.length} promociones expiradas por fecha de vigencia.`)
  }

  for (const r of resumenes) {
    payload.logger.info(
      `${r.plataforma}: ${r.creadas} nuevas, ${r.actualizadas} actualizadas, ` +
        `${r.expiradas} expiradas, ${r.sinCambios} sin cambios.`,
    )
    for (const aviso of r.avisos) payload.logger.warn(`${r.plataforma}: ${aviso}`)
  }

  const publicadas = resumenes.reduce((n, r) => n + r.creadas + r.actualizadas, 0)
  if (publicadas > 0) {
    payload.logger.info(`${publicadas} promociones publicadas o actualizadas en el sitio.`)
  }

  return resumenes
}
