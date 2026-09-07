import type { Metadata } from 'next'
import { getPayload, type Where } from 'payload'
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
  ETIQUETAS_DE_PROVINCIA,
  ETIQUETAS_DE_TIPO_DE_PUNTO_SINGULAR,
  esProvincia,
  esTipoDePunto,
  PROVINCIAS,
} from '@/utilidades/puntos-de-venta'

/**
 * Una hora, como el resto del sitio. Un local no abre ni cierra de un momento
 * para el otro, y el hook `afterChange` de la coleccion revalida esta ruta
 * apenas alguien toca un punto en el panel: el cache nunca queda mostrando algo
 * que se corrigio hace un rato.
 */
export const revalidate = 3600

export const metadata: Metadata = {
  // La marca la agrega la plantilla de titulo del layout.
  title: 'Puntos de Venta',
  description:
    'Dónde quedan las salas, agencias y puntos de pago de Jugadon: mapa, direcciones y horarios.',
}

interface PuntosDeVentaPageProps {
  searchParams: Promise<{ tipo?: string; provincia?: string }>
}

export default async function PuntosDeVentaPage({ searchParams }: PuntosDeVentaPageProps) {
  const { provincia: provinciaCruda, tipo: tipoCrudo } = await searchParams
  const payload = await getPayload({ config })

  /*
   * Los dos filtros entran por la URL y se validan antes de la consulta: son
   * enums en Postgres, y un valor que no este en la lista hace fallar la query
   * entera en vez de devolver cero resultados. Es la misma guarda que usa el
   * vertical en `/promociones`.
   */
  const tipo = esTipoDePunto(tipoCrudo) ? tipoCrudo : undefined
  const provincia = esProvincia(provinciaCruda) ? provinciaCruda : undefined

  const where: Where = {
    and: [
      { activo: { equals: true } },
      ...(tipo ? [{ tipo: { equals: tipo } }] : []),
      ...(provincia ? [{ provincia: { equals: provincia } }] : []),
    ],
  }

  const { docs } = await payload.find({
    collection: 'puntos-de-venta',
    depth: 1,
    /*
     * Todos de una: el mapa los dibuja juntos y no hay paginacion que pueda
     * partirlos sin dejar medio pais afuera del encuadre. Son mil cuatrocientos
     * y el tope esta bien arriba para que agregar una provincia no los empiece
     * a cortar en silencio; lo que evita que la respuesta crezca sin control es
     * que la coleccion es un directorio cerrado —los locales de la marca—, no
     * contenido que se publique todos los dias.
     *
     * Del lado del cliente eso no se traduce en mil cuatrocientas fichas: el
     * mapa agrupa los marcadores y la lista solo dibuja lo que hay en pantalla.
     */
    limit: 2000,
    sort: ['provincia', 'localidad', 'nombre'],
    where,
  })

  /**
   * Las provincias que ofrece el filtro salen de los puntos cargados, no de las
   * veinticuatro: un chip que devuelve cero resultados no es un filtro.
   *
   * Se consultan aparte y sin el filtro de provincia puesto —solo el de tipo—
   * porque si se derivaran de `docs`, elegir una provincia dejaria en pantalla
   * un unico chip: el que ya esta puesto, y sin forma de saltar a otra.
   */
  const { docs: paraElFiltro } = await payload.find({
    collection: 'puntos-de-venta',
    depth: 0,
    limit: 2000,
    // Solo interesa la columna `provincia`, pero la Local API no proyecta
    // columnas sueltas; `depth: 0` al menos evita traer las relaciones.
    where: { and: [{ activo: { equals: true } }, ...(tipo ? [{ tipo: { equals: tipo } }] : [])] },
  })

  // Se recorre `PROVINCIAS` y no el resultado de la consulta para que la fila
  // salga siempre en el mismo orden, que es el alfabetico de la lista.
  const conPuntos = new Set(paraElFiltro.map((punto) => punto.provincia))
  const provinciasDisponibles = PROVINCIAS.filter((p) => conPuntos.has(p))

  /*
   * De documento de Payload a las props del mapa. El organismo es cliente, asi
   * que lo que cruza tiene que ser serializable y ya resuelto: las etiquetas
   * traducidas y la URL de la foto se calculan aca, no alla.
   */
  const puntos: PuntoEnMapa[] = docs
    // Sin par de coordenadas no hay marcador que dibujar. Los dos campos son
    // obligatorios en la coleccion, asi que esto solo alcanza a las filas que
    // hayan quedado a medias de una carga anterior.
    .filter((punto) => typeof punto.latitud === 'number' && typeof punto.longitud === 'number')
    .map((punto) => ({
      id: punto.id,
      nombre: punto.nombre,
      tipo: punto.tipo,
      etiquetaDeTipo: ETIQUETAS_DE_TIPO_DE_PUNTO_SINGULAR[punto.tipo],
      direccion: punto.direccion,
      localidad: punto.localidad,
      provincia: ETIQUETAS_DE_PROVINCIA[punto.provincia],
      telefono: punto.telefono,
      horarios: punto.horarios,
      fotoUrl: urlDeUpload(punto.foto),
      latitud: punto.latitud,
      longitud: punto.longitud,
    }))

  return (
    <PlantillaDeListado
      bajada="Encontrá la sala, la agencia o el punto de pago más cercano. Tocá un punto del mapa para ver su dirección, su horario y cómo llegar."
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
