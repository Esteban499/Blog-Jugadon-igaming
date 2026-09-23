import type { Author, Category, Media, Post } from '@/payload-types'
import { relacion } from '@/utilidades/payload'
import { DESCRIPCION, REDES, SITIO, urlAbsoluta } from '@/utilidades/sitio'

/**
 * Los datos estructurados (schema.org) del sitio.
 *
 * La organizacion se declara una sola vez con un `@id`, y el resto la nombra
 * por ese id: es lo que le dice a Google que el editor del sitio, el autor de
 * respaldo de las notas y la cuenta de cada red son la misma entidad.
 */

const ID_ORGANIZACION = `${SITIO}/#organizacion`
const ID_SITIO = `${SITIO}/#sitio`

/**
 * La ficha azul y no el wordmark de la barra: Google muestra el logo sobre
 * fondo blanco, y ahi "JUGADON" en blanco desaparece. Mide 715x714, por encima
 * del minimo de 112 que pide.
 */
const LOGO = {
  '@type': 'ImageObject',
  url: urlAbsoluta('/marca/Jugadon_Logos_favicon-n-12.png'),
  width: 715,
  height: 714,
}

const organizacion = {
  '@type': 'Organization',
  '@id': ID_ORGANIZACION,
  name: 'Jugadon',
  url: urlAbsoluta('/'),
  logo: LOGO,
  sameAs: REDES.map((red) => red.href),
}

/** La portada: quien publica el sitio y el sitio en si. */
export const datosDePortada = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    organizacion,
    {
      '@type': 'WebSite',
      '@id': ID_SITIO,
      name: 'Blog Jugadon',
      url: urlAbsoluta('/'),
      description: DESCRIPCION,
      inLanguage: 'es-AR',
      publisher: { '@id': ID_ORGANIZACION },
    },
  ],
})

/**
 * Las URLs de la portada de una nota, de la mas grande a la mas chica.
 *
 * Google pide imagenes de al menos 50.000 pixeles y agradece varias medidas
 * para elegir segun donde la muestre. `hero` (1600 de ancho) y `og` (1200x630)
 * alcanzan; el original va solo si no se generaron los tamanos.
 */
const imagenesDe = (portada?: Media): string[] => {
  if (!portada) return []

  const urls = [portada.sizes?.hero?.url, portada.sizes?.og?.url].filter(
    (url): url is string => Boolean(url),
  )
  const lista = urls.length > 0 ? urls : portada.url ? [portada.url] : []

  return lista.map(urlAbsoluta)
}

/**
 * Una nota del blog.
 *
 * La organizacion viaja en el mismo grafo porque la nota la nombra como
 * editora, y un `@id` que no esta en la pagina no le dice nada a Google.
 */
export const datosDeEntrada = (entrada: Post, url: string) => {
  const autor = relacion<Author>(entrada.autor)
  const categoria = relacion<Category>(entrada.categoria)
  const enlacesDelAutor = (autor?.enlaces ?? []).map((enlace) => enlace.url)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizacion,
      {
        '@type': 'BlogPosting',
        headline: entrada.titulo,
        description: entrada.resumen,
        url,
        mainEntityOfPage: url,
        image: imagenesDe(relacion<Media>(entrada.portada)),
        datePublished: entrada.publicadoEn ?? entrada.createdAt,
        // `actualizadoEn` es la fecha que marketing declara en el panel;
        // `updatedAt` se mueve con cualquier guardado, incluso un typo.
        dateModified: entrada.actualizadoEn ?? entrada.publicadoEn ?? entrada.updatedAt,
        articleSection: categoria?.nombre,
        inLanguage: 'es-AR',
        author: autor
          ? {
              '@type': 'Person',
              name: autor.nombre,
              jobTitle: autor.cargo ?? undefined,
              sameAs: enlacesDelAutor.length > 0 ? enlacesDelAutor : undefined,
            }
          : { '@id': ID_ORGANIZACION },
        publisher: { '@id': ID_ORGANIZACION },
      },
    ],
  }
}
