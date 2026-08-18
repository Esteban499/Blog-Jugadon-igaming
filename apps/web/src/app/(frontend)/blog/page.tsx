import type { Metadata } from 'next'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'

import { EstadoVacio, Paginacion } from '@/components/molecules'
import { FiltrosDeCategoria, GrillaDeNoticias } from '@/components/organisms'
import { PlantillaDeListado } from '@/components/templates'
import { rutaDeBlog } from '@/utilidades/rutas'

export const revalidate = 3600

export const metadata: Metadata = {
  // La marca la agrega la plantilla de titulo del layout.
  title: 'Noticias',
  description: 'Guías, tutoriales y contenido informativo sobre juego.',
}

/** Doce por pagina: cuatro filas completas en la grilla de tres columnas. */
const POR_PAGINA = 12

const BAJADA =
  'Guías, análisis y tutoriales para entender cómo funciona cada plataforma antes de jugar.'

interface BlogPageProps {
  searchParams: Promise<{ categoria?: string; pagina?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { categoria: slugCategoria, pagina: paginaCruda } = await searchParams
  const payload = await getPayload({ config })

  const { docs: categorias } = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 50,
    sort: 'nombre',
  })

  const elegida = categorias.find((c) => c.slug === slugCategoria)

  /*
   * La pagina entra por la URL, asi que se sanea antes de llegar a la
   * consulta: un `?pagina=0` o un `?pagina=abc` le pasaria a Payload un offset
   * invalido en lugar de devolver la primera pagina.
   */
  const numero = Number.parseInt(paginaCruda ?? '1', 10)
  const pagina = Number.isFinite(numero) && numero > 0 ? numero : 1

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
