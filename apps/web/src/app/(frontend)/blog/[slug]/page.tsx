import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { DatosEstructurados } from '@/components/atoms'
import { CierreDeArticulo, Contenido, HeroDeArticulo } from '@/components/organisms'
import { PlantillaDeArticulo } from '@/components/templates'
import type { Category, Media, Post } from '@/payload-types'
import { datosDeEntrada } from '@/utilidades/datos-estructurados'
import { relacion } from '@/utilidades/payload'
import { imagenParaCompartir, OPEN_GRAPH_BASE, urlAbsoluta } from '@/utilidades/sitio'
import { fechaLarga } from '@/utilidades/texto'

export const revalidate = 3600

interface PostPageProps {
  params: Promise<{ slug: string }>
}

const buscarEntrada = async (slug: string): Promise<Post | undefined> => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: 1,
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
  })
  return docs[0]
}

const rutaDe = (entrada: Post): string => `/blog/${entrada.slug ?? ''}`

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const entrada = await buscarEntrada(slug)
  if (!entrada) return { title: 'Entrada no encontrada' }

  return {
    title: entrada.meta?.title ?? entrada.titulo,
    description: entrada.meta?.description ?? entrada.resumen,
    alternates: { canonical: rutaDe(entrada) },
    // Titulo y descripcion los completa Next con los de arriba.
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: 'article',
      publishedTime: entrada.publicadoEn ?? undefined,
      modifiedTime: entrada.actualizadoEn ?? undefined,
      section: relacion<Category>(entrada.categoria)?.nombre,
      images: [
        imagenParaCompartir(
          relacion<Media>(entrada.meta?.image) ?? relacion<Media>(entrada.portada),
        ),
      ],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const entrada = await buscarEntrada(slug)

  if (!entrada) notFound()

  return (
    <>
      <DatosEstructurados dato={datosDeEntrada(entrada, urlAbsoluta(rutaDe(entrada)))} />

      <PlantillaDeArticulo
        cierre={<CierreDeArticulo contenido={entrada.contenido} />}
        hero={<HeroDeArticulo entrada={entrada} />}
      >
        <Contenido data={entrada.contenido} />

        {entrada.actualizadoEn ? (
          <p className="mt-12 font-util text-meta text-apagado">
            Actualizado el{' '}
            <time dateTime={entrada.actualizadoEn}>{fechaLarga(entrada.actualizadoEn)}</time>.
          </p>
        ) : null}
      </PlantillaDeArticulo>
    </>
  )
}
