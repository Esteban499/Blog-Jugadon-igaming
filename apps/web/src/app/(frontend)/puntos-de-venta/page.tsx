import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

import { EstadoVacio } from '@/components/molecules'
import {
  FiltrosDePuntosDeVenta,
  MapaDePuntosDeVenta,
  type PuntoEnMapa,
} from '@/components/organisms'
import { PlantillaDeListado } from '@/components/templates'
import { urlDeUpload } from '@/utilidades/payload'
import {
  ETIQUETA_DE_CACHE_DE_PUNTOS,
  ETIQUETAS_DE_PROVINCIA,
  ETIQUETAS_DE_TIPO_DE_PUNTO_SINGULAR,
  esProvincia,
  esTipoDePunto,
  type Provincia,
  PROVINCIAS,
} from '@/utilidades/puntos-de-venta'
import { rutaDePuntosDeVenta } from '@/utilidades/rutas'

/**
 * Un punto ya listo para el mapa, junto con la clave de su provincia.
 *
 * La clave va aparte y no dentro del punto porque solo sirve para filtrar aca:
 * al cliente viaja la etiqueta traducida, que es lo que se muestra.
 */
interface PuntoCacheado {
  punto: PuntoEnMapa
  provincia: Provincia
}

/**
 * El directorio entero, cacheado entre visitas.
 *
 * Es lo que hace que la pantalla no tarde. Los filtros entran por la URL, y
 * leer `searchParams` obliga a armar la pagina en cada visita: el `revalidate`
 * de la ruta no llegaba a cachear nada, y cada visita disparaba dos consultas
 * de mil cuatrocientas filas, con la foto de cada local resuelta aparte. Ahora
 * la consulta es una sola —todos los activos, sin filtrar— y se guarda; el
 * tipo y la provincia se aplican despues sobre el resultado, que es un
 * `filter` sobre un arreglo en memoria y no un viaje a la base.
 *
 * Una hora, como el resto del sitio, y la coleccion la invalida apenas alguien
 * guarda un punto en el panel (`revalidarRutas` en `PuntosDeVenta.ts`). Lo que
 * no la invalida es `pnpm importar-puntos`: corre fuera de Next, asi que una
 * importacion aparece en el mapa dentro de la hora.
 *
 * `unstable_cache` y no `'use cache'`: la directiva pide prender Cache
 * Components en todo el sitio, que cambia como se renderiza cada pantalla.
 */
const traerPuntos = unstable_cache(
  async (): Promise<PuntoCacheado[]> => {
    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'puntos-de-venta',
      depth: 1,
      /*
       * Todos de una: el mapa los dibuja juntos y no hay paginacion que pueda
       * partirlos sin dejar medio pais afuera del encuadre. Son mil
       * cuatrocientos y el tope esta bien arriba para que agregar una provincia
       * no los empiece a cortar en silencio; lo que evita que la respuesta
       * crezca sin control es que la coleccion es un directorio cerrado —los
       * locales de la marca—, no contenido que se publique todos los dias.
       */
      limit: 2000,
      sort: ['provincia', 'localidad', 'nombre'],
      where: { activo: { equals: true } },
    })

    /*
     * De documento de Payload a las props del mapa. El organismo es cliente,
     * asi que lo que cruza tiene que ser serializable y ya resuelto: las
     * etiquetas traducidas y la URL de la foto se calculan aca, no alla. Y como
     * esto es lo que se guarda en el cache, se guarda ya traducido.
     */
    return (
      docs
        // Sin par de coordenadas no hay marcador que dibujar. Los dos campos
        // son obligatorios en la coleccion, asi que esto solo alcanza a las
        // filas que hayan quedado a medias de una carga anterior.
        .filter((doc) => typeof doc.latitud === 'number' && typeof doc.longitud === 'number')
        .map((doc) => ({
          provincia: doc.provincia,
          punto: {
            id: doc.id,
            nombre: doc.nombre,
            tipo: doc.tipo,
            etiquetaDeTipo: ETIQUETAS_DE_TIPO_DE_PUNTO_SINGULAR[doc.tipo],
            direccion: doc.direccion,
            localidad: doc.localidad,
            provincia: ETIQUETAS_DE_PROVINCIA[doc.provincia],
            telefono: doc.telefono,
            horarios: doc.horarios,
            fotoUrl: urlDeUpload(doc.foto),
            latitud: doc.latitud,
            longitud: doc.longitud,
          },
        }))
    )
  },
  ['puntos-de-venta'],
  { revalidate: 3600, tags: [ETIQUETA_DE_CACHE_DE_PUNTOS] },
)

interface PuntosDeVentaPageProps {
  searchParams: Promise<{ tipo?: string; provincia?: string }>
}

/**
 * La canonica sale de los filtros ya validados: un `?provincia=cualquiera` no
 * filtra, asi que su canonica es la del mapa entero.
 */
export async function generateMetadata({
  searchParams,
}: PuntosDeVentaPageProps): Promise<Metadata> {
  const { provincia, tipo } = await searchParams

  return {
    // La marca la agrega la plantilla de titulo del layout.
    title: 'Puntos de Venta',
    description:
      'Dónde quedan las salas, agencias y puntos de pago de Jugadon: mapa, direcciones y horarios.',
    alternates: {
      canonical: rutaDePuntosDeVenta({
        provincia: esProvincia(provincia) ? provincia : undefined,
        tipo: esTipoDePunto(tipo) ? tipo : undefined,
      }),
    },
  }
}

export default async function PuntosDeVentaPage({ searchParams }: PuntosDeVentaPageProps) {
  const { provincia: provinciaCruda, tipo: tipoCrudo } = await searchParams

  /*
   * Los dos filtros entran por la URL y se validan antes de usarse: con la
   * guarda, un `?provincia=cualquiera` simplemente no filtra, en vez de dejar
   * el mapa vacio. Es la misma guarda que usa el vertical en `/promociones`.
   */
  const tipo = esTipoDePunto(tipoCrudo) ? tipoCrudo : undefined
  const provincia = esProvincia(provinciaCruda) ? provinciaCruda : undefined

  const todos = await traerPuntos()
  const delTipo = tipo ? todos.filter(({ punto }) => punto.tipo === tipo) : todos

  /**
   * Las provincias que ofrece el filtro salen de los puntos cargados, no de las
   * veinticuatro: un chip que devuelve cero resultados no es un filtro.
   *
   * Se calculan con el filtro de tipo puesto pero no el de provincia: si no,
   * elegir una provincia dejaria en pantalla un unico chip —el que ya esta
   * puesto— y ninguna forma de saltar a otra. Se recorre `PROVINCIAS` y no los
   * puntos para que la fila salga siempre en el mismo orden, el alfabetico.
   */
  const conPuntos = new Set(delTipo.map((cacheado) => cacheado.provincia))
  const provinciasDisponibles = PROVINCIAS.filter((p) => conPuntos.has(p))

  const puntos: PuntoEnMapa[] = (
    provincia ? delTipo.filter((cacheado) => cacheado.provincia === provincia) : delTipo
  ).map(({ punto }) => punto)

  return (
    <PlantillaDeListado
      bajada="Encontrá la sala, la agencia o el punto de pago más cercano. Buscalo por su nombre o tocá un punto del mapa para ver su dirección, su horario y cómo llegar."
      filtros={
        <FiltrosDePuntosDeVenta provincias={provinciasDisponibles} seleccion={{ provincia, tipo }} />
      }
      titulo="Puntos de Venta"
    >
      {puntos.length === 0 ? (
        <EstadoVacio titulo="No hay locales que coincidan.">
          <p>Probá con otra provincia, o quitando algún filtro.</p>
        </EstadoVacio>
      ) : (
        <MapaDePuntosDeVenta
          puntos={puntos}
          urlDeGlifos={process.env.NEXT_PUBLIC_MAPA_GLIFOS_URL}
          urlDeTiles={process.env.NEXT_PUBLIC_MAPA_TILES_URL}
        />
      )}
    </PlantillaDeListado>
  )
}
