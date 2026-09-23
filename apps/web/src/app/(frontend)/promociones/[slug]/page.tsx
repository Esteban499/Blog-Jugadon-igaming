import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { CierreDePromocion, FichaDePromocion } from '@/components/organisms'
import { PlantillaDeArticulo } from '@/components/templates'
import type { Media, Promocion } from '@/payload-types'
import { relacion } from '@/utilidades/payload'
import { imagenParaCompartir, OPEN_GRAPH_BASE } from '@/utilidades/sitio'

/**
 * Cinco minutos, no una hora como el resto del sitio.
 *
 * Una promocion deja de ser vigente en un instante exacto, y quien decide si se
 * muestra es la consulta, no la corrida del bot. El cache es lo unico que puede
 * dejar en pantalla un bono vencido, asi que aca la ventana se acota.
 */
export const revalidate = 300

interface PromocionPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Se buscan tambien las expiradas, a proposito.
 *
 * Cuando una promocion desaparece de la plataforma no se borra: su URL puede
 * estar indexada o compartida, y devolver un 404 tira ese trabajo. Se sirve la
 * pagina, avisando que ya no esta vigente y sin el boton para reclamarla.
 */
const buscarPromocion = async (slug: string): Promise<Promocion | undefined> => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'promociones',
    depth: 1,
    limit: 1,
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
  })
  return docs[0]
}

export async function generateMetadata({ params }: PromocionPageProps): Promise<Metadata> {
  const { slug } = await params
  const promo = await buscarPromocion(slug)
  if (!promo) return { title: 'Promoción no encontrada' }

  return {
    // Sin marca: la agrega la plantilla de titulo del layout. Escrita aca daba
    // "Titulo | Blog iGaming | Jugadon".
    title: promo.meta?.title ?? promo.titulo,
    description: promo.meta?.description ?? promo.resumen ?? promo.oferta ?? undefined,
    alternates: { canonical: `/promociones/${promo.slug ?? slug}` },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: 'website',
      images: [
        imagenParaCompartir(relacion<Media>(promo.meta?.image) ?? relacion<Media>(promo.portada)),
      ],
    },
  }
}

export default async function PromocionPage({ params }: PromocionPageProps) {
  const { slug } = await params
  const promo = await buscarPromocion(slug)

  if (!promo) notFound()

  // Sin hero: la ficha arranca directo en la columna de lectura.
  return (
    <PlantillaDeArticulo cierre={<CierreDePromocion promo={promo} />}>
      <FichaDePromocion promo={promo} />
    </PlantillaDeArticulo>
  )
}
