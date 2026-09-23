import type { Metadata } from 'next'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'

import { EstadoVacio, Paginacion } from '@/components/molecules'
import { FiltrosDeCategoria, GrillaDeNoticias } from '@/components/organisms'
import { PlantillaDeListado } from '@/components/templates'
import { rutaDeBlog } from '@/utilidades/rutas'

export const revalidate = 3600

/** Doce por pagina: cuatro filas completas en la grilla de tres columnas. */
const POR_PAGINA = 12

const BAJADA =
  'Guías, análisis y tutoriales para entender cómo funciona cada plataforma antes de jugar.'

const DESCRIPCION = 'Guías, tutoriales y contenido informativo sobre juego.'

interface BlogPageProps {
  searchParams: Promise<{ categoria?: string; pagina?: string }>
}

const buscarCategorias = async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 50,
    sort: 'nombre',
  })
  return docs
}

/**
 * La pagina entra por la URL, asi que se sanea antes de llegar a la consulta:
 * un `?pagina=0` o un `?pagina=abc` le pasaria a Payload un offset invalido en
 * lugar de devolver la primera pagina.
 */
const leerPagina = (cruda?: string): number => {
  const numero = Number.parseInt(cruda ?? '1', 10)
  return Number.isFinite(numero) && numero > 0 ? numero : 1
}

/**
 * Cada categoria es una pagina propia —su URL se comparte y se indexa—, asi
 * que lleva su titulo y su descripcion, los mismos que ya muestra el `h1`. La
 * canonica sale de los filtros ya validados: una categoria que no existe
 * muestra el listado completo, y su canonica es la de `/blog`.
 */
export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const { categoria: slugCategoria, pagina: paginaCruda } = await searchParams
  const elegida = (await buscarCategorias()).find((c) => c.slug === slugCategoria)

  return {
    // La marca la agrega la plantilla de titulo del layout.
    title: elegida ? (elegida.meta?.title ?? elegida.nombre) : 'Noticias',
    description: elegida
      ? (elegida.meta?.description ?? elegida.descripcion ?? DESCRIPCION)
      : DESCRIPCION,
    alternates: {
      canonical: rutaDeBlog({
        categoria: elegida?.slug ?? undefined,
        pagina: leerPagina(paginaCruda),
      }),
    },
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { categoria: slugCategoria, pagina: paginaCruda } = await searchParams
  const payload = await getPayload({ config })

  const categorias = await buscarCategorias()
  const elegida = categorias.find((c) => c.slug === slugCategoria)
  const pagina = leerPagina(paginaCruda)

  const where: Where = {
    and: [
      { _status: { equals: 'published' } },
      ...(elegida ? [{ categoria: { equals: elegida.id } }] : []),
    ],
  }

  const { docs: entradas, totalPages } = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: POR_PAGINA,
    page: pagina,
    sort: ['-destacado', '-publicadoEn'],
    where,
  })

  return (
    <PlantillaDeListado
      bajada={elegida?.descripcion ?? BAJADA}
      filtros={<FiltrosDeCategoria categorias={categorias} slugElegido={elegida?.slug ?? undefined} />}
      paginacion={
        <Paginacion
          hrefDePagina={(n) => rutaDeBlog({ categoria: elegida?.slug ?? undefined, pagina: n })}
          pagina={pagina}
          totalPaginas={totalPages}
        />
      }
      titulo={elegida ? elegida.nombre : 'Noticias'}
    >
      {entradas.length === 0 ? (
        <EstadoVacio>No hay entradas publicadas en esta categoría todavía.</EstadoVacio>
      ) : (
        // Las tres de la primera fila entran en el LCP.
        <GrillaDeNoticias entradas={entradas} prioritarias={3} />
      )}
    </PlantillaDeListado>
  )
}
