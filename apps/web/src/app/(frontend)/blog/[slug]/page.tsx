import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { CierreDeArticulo, Contenido, HeroDeArticulo } from '@/components/organisms'
import { PlantillaDeArticulo } from '@/components/templates'
import type { Post } from '@/payload-types'
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

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const entrada = await buscarEntrada(slug)
  if (!entrada) return { title: 'Entrada no encontrada' }

  return {
    title: entrada.meta?.title ?? entrada.titulo,
    description: entrada.meta?.description ?? entrada.resumen,
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const entrada = await buscarEntrada(slug)

  if (!entrada) notFound()

  return (
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
  )
}
