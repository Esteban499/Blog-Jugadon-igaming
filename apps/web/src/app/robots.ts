import type { MetadataRoute } from 'next'

import { SITIO } from '@/utilidades/sitio'

/**
 * Vive en la raiz de `app/` y no en `(frontend)` porque Next solo lo busca
 * aca: es un archivo del sitio entero, panel incluido.
 *
 * `/api/` se cierra entero salvo `/api/media/file/`, que es de donde salen las
 * imagenes de las notas: cerrado, Google no podria leer las portadas ni para
 * el buscador de imagenes ni para los resultados enriquecidos. Entre dos
 * reglas que coinciden gana la mas larga, asi que el `allow` le gana al
 * `disallow`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/media/file/'],
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${SITIO}/sitemap.xml`,
  }
}
