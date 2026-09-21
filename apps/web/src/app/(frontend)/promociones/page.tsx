import type { Metadata } from 'next'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'

import { EstadoVacio } from '@/components/molecules'
import {
  BannersDePromociones,
  FiltrosDePromociones,
  GrillaDePromociones,
} from '@/components/organisms'
import { PlantillaDeListado } from '@/components/templates'
import {
  TIPOS_DE_PROMOCION,
  type TipoDePromocion,
  VERTICALES,
  type Vertical,
} from '@/scrapers/tipos'
import { idDeRelacion } from '@/utilidades/payload'
import { PLATAFORMA_POR_DEFECTO } from '@/utilidades/rutas'

/**
 * Cinco minutos, no una hora como el resto del sitio: lo que decide si un bono
 * se muestra es su fecha de vigencia, evaluada en la consulta, y el cache es lo
 * unico que puede dejar uno vencido en pantalla. Ademas el hook afterChange de
 * `promociones` revalida la ruta apenas el bot escribe.
 */
export const revalidate = 300

export const metadata: Metadata = {
  // La marca la agrega la plantilla de titulo del layout; repetirla aca daba
  // "Promociones y Bonos | Blog iGaming | Jugadon".
  title: 'Promociones y Bonos',
  description: 'Bonos de bienvenida, recargas y promociones vigentes de las plataformas.',
}

/**
 * El filtro por vertical entra por la URL, asi que se valida antes de llegar a
 * la consulta. No es solo higiene: `verticales` es un enum en Postgres, y un
 * valor que no este en la lista hace fallar la query entera en vez de devolver
 * cero resultados. Con la guarda, un `?vertical=cualquiera` simplemente no
 * filtra.
 */
const esTipo = (valor?: string): valor is TipoDePromocion =>
  typeof valor === 'string' && (TIPOS_DE_PROMOCION as readonly string[]).includes(valor)

const esVertical = (valor?: string): valor is Vertical =>
  typeof valor === 'string' && (VERTICALES as readonly string[]).includes(valor)

interface PromocionesPageProps {
  searchParams: Promise<{ plataforma?: string; tipo?: string; vertical?: string }>
}

export default async function PromocionesPage({ searchParams }: PromocionesPageProps) {
  const { plataforma: slugPlataforma, tipo: tipoCrudo, vertical: verticalCrudo } = await searchParams
  const payload = await getPayload({ config })

  /*
   * En paralelo: las dos consultas son independientes y las dos hacen falta
   * para armar el `where` de la grilla, asi que encadenarlas seria un viaje a
   * la base de mas antes de poder empezar a buscar promociones.
   *
   * Los banners vienen todos y se filtran por plataforma mas abajo, en memoria:
   * son un punado, y preguntarle a la base por "los que no tienen ninguna
   * plataforma puesta o tienen esta" cuesta un `exists` sobre una relacion
   * `hasMany`, que es mas condicion de la que este volumen justifica.
   */
  const [{ docs: plataformas }, { docs: todosLosBanners }] = await Promise.all([
    payload.find({
      collection: 'plataformas',
      depth: 0,
      limit: 50,
      sort: 'nombre',
    }),
    payload.find({
      collection: 'banners',
      // Uno, para que `imagenEscritorio` e `imagenTelefono` lleguen con su URL
      // y su medida: sin eso no se puede armar el `srcSet`.
      depth: 1,
      limit: 50,
      sort: 'orden',
      where: { activo: { equals: true } },
    }),
  ])

  /**
   * Siempre hay una plataforma puesta. Las cinco jurisdicciones publican casi
   * los mismos bonos, asi que el listado sin filtrar era la misma promocion
   * repetida cinco veces con otra marca: mas ruido que oferta. Sin `?plataforma`
   * —o con una que no existe— se cae a la de por defecto.
   *
   * El ultimo `??` cubre el caso en que esa plataforma no este cargada: antes
   * que una pantalla vacia, se listan todas.
   */
  const elegida =
    plataformas.find((p) => p.slug === slugPlataforma) ??
    plataformas.find((p) => p.slug === PLATAFORMA_POR_DEFECTO)

  const tipo = esTipo(tipoCrudo) ? tipoCrudo : undefined
  const vertical = esVertical(verticalCrudo) ? verticalCrudo : undefined

  /*
   * Un banner sin plataformas puestas va en todas. Es lo que evita cargar cinco
   * veces la misma pieza: hoy cada campania tiene una version generica y otra
   * para Santa Fe, que no tiene casino y por eso su arte dice otra cosa.
   */
  const banners = todosLosBanners.filter((banner) => {
    const suyas = (banner.plataformas ?? [])
      .map(idDeRelacion)
      .filter((id): id is number => id !== undefined)

    return suyas.length === 0 || (elegida ? suyas.includes(elegida.id) : true)
  })

  /*
   * Las promociones que los banners de esta pantalla ya estan mostrando. Salen
   * de la grilla para no decir dos veces lo mismo, y salen solo si su banner se
   * ve: apagar el banner desde el panel devuelve su promocion al listado sin
   * tocar codigo.
   */
  const cubiertasPorLosBanners = banners.flatMap((banner) =>
    (banner.promocionesQueCubre ?? [])
      .map(idDeRelacion)
      .filter((id): id is number => id !== undefined),
  )

  /**
   * Tres condiciones, y las tres importan:
   *
   * - `published`, o se filtrarian los borradores que todavia no aprobo nadie.
   * - `activa`, que es lo que el bot apaga cuando la promocion desaparece del
   *   origen.
   * - la fecha de corte. El bot corre una vez por dia, asi que entre corrida y
   *   corrida puede haber promociones vencidas marcadas como activas. Publicar
   *   un bono que ya vencio es exactamente lo que no se puede hacer, y filtrar
   *   por fecha lo cubre sin depender de cuando corrio el bot por ultima vez.
   */
  const condicionesBase: Where[] = [
    { _status: { equals: 'published' } },
    { estado: { equals: 'activa' } },
    {
      or: [
        { vigenciaHasta: { exists: false } },
        { vigenciaHasta: { greater_than: new Date().toISOString() } },
      ],
    },
    // Lo que ya esta dibujado en los banners de arriba no se repite abajo.
    ...(cubiertasPorLosBanners.length > 0 ? [{ id: { not_in: cubiertasPorLosBanners } }] : []),
    ...(elegida ? [{ plataforma: { equals: elegida.id } }] : []),
  ]

  const where: Where = {
    and: [
      ...condicionesBase,
      ...(tipo ? [{ tipo: { equals: tipo } }] : []),
      // `in` sobre un `hasMany` es "alguno de sus verticales es este". Las
      // promociones cargadas a mano suelen no tener ninguno, y con el filtro
      // puesto quedan afuera: es lo correcto, porque el filtro pregunta donde
      // se usa el bono y de esas no se sabe.
      ...(vertical ? [{ verticales: { in: [vertical] } }] : []),
    ],
  }

  const [{ docs: promociones }, { docs: candidatas }] = await Promise.all([
    payload.find({
      collection: 'promociones',
      depth: 1,
      limit: 50,
      sort: ['-destacada', 'vigenciaHasta'],
      where,
    }),
    /*
     * Las de la plataforma sin los filtros del panel, y solo con los dos campos
     * que el panel filtra. De aca sale que chips vale la pena mostrar: uno que
     * lleva a una grilla vacia es un callejon, y no era un caso raro. El bono
     * de bienvenida y el de primer deposito salen en los banners, asi que sus
     * chips no encontraban nunca nada. Son una docena por plataforma.
     */
    payload.find({
      collection: 'promociones',
      depth: 0,
      pagination: false,
      select: { tipo: true, verticales: true },
      where: { and: condicionesBase },
    }),
  ])

  return (
    <PlantillaDeListado
      filtros={
        <FiltrosDePromociones
          candidatas={candidatas}
          plataformas={plataformas}
          seleccion={{ plataforma: elegida?.slug ?? undefined, tipo, vertical }}
        />
      }
      sobreElTitulo={<BannersDePromociones banners={banners} />}
      titulo="Promociones y Bonos"
    >
      {promociones.length === 0 ? (
        <EstadoVacio titulo="No hay promociones que coincidan.">
          {/*
           * Sin el enlace al panel: es una pantalla publica, y mandaba al
           * visitante a una direccion del CMS que no le corresponde. Lo que se
           * dice aca es lo unico que quien mira puede hacer.
           */}
          <p>Probá con otra plataforma, o quitando algún filtro.</p>
        </EstadoVacio>
      ) : (
        <GrillaDePromociones promociones={promociones} />
      )}
    </PlantillaDeListado>
  )
}
