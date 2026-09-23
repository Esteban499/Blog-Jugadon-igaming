import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

import { urlAbsoluta } from '@/utilidades/sitio'

/**
 * Se regenera cada hora, igual que las paginas que lista: una nota publicada
 * entra al sitemap a lo sumo una hora despues.
 */
export const revalidate = 3600

const PUBLICADO = { _status: { equals: 'published' } } as const

/** La fecha mas nueva de una lista, para los listados que la resumen. */
const ultima = (fechas: string[]): string | undefined =>
  fechas.reduce<string | undefined>((max, f) => (!max || f > max ? f : max), undefined)

/**
 * Las paginas que Google tiene que conocer: las cuatro secciones, cada nota y
 * cada promocion publicadas.
 *
 * Los filtros (`?categoria=`, `?plataforma=`) no van: son variantes de los
 * listados, y Google llega a ellos por los chips de cada uno.
 *
 * Las promociones vencidas siguen: su pagina se sirve avisando que ya no esta
 * vigente, justamente para no perder la URL indexada.
 *
 * `lastModified` es `updatedAt` y no la fecha de actualizacion del panel: al
 * sitemap le importa cuando cambio la pagina, y esa fecha solo se mueve cuando
 * marketing decide anunciarlo.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })

  const [{ docs: entradas }, { docs: promociones }] = await Promise.all([
    payload.find({
      collection: 'posts',
      depth: 0,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: PUBLICADO,
    }),
    payload.find({
      collection: 'promociones',
      depth: 0,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: PUBLICADO,
    }),
  ])

  const ultimaEntrada = ultima(entradas.map((e) => e.updatedAt))

  return [
    { url: urlAbsoluta('/'), lastModified: ultimaEntrada, changeFrequency: 'daily', priority: 1 },
    { url: urlAbsoluta('/blog'), lastModified: ultimaEntrada, changeFrequency: 'daily' },
    {
      url: urlAbsoluta('/promociones'),
      lastModified: ultima(promociones.map((p) => p.updatedAt)),
      changeFrequency: 'daily',
    },
    { url: urlAbsoluta('/puntos-de-venta'), changeFrequency: 'monthly' },
    ...entradas
      .filter((e) => e.slug)
      .map((e) => ({ url: urlAbsoluta(`/blog/${e.slug}`), lastModified: e.updatedAt })),
    ...promociones
      .filter((p) => p.slug)
      .map((p) => ({ url: urlAbsoluta(`/promociones/${p.slug}`), lastModified: p.updatedAt })),
  ]
}
