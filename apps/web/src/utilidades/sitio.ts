import type { Media } from '@/payload-types'

/**
 * Lo que el sitio dice de si mismo hacia afuera: donde vive, como se describe,
 * con que imagen se comparte y cuales son sus cuentas oficiales.
 *
 * Lo leen piezas que no se conocen entre si —el layout, el sitemap, el robots,
 * los datos estructurados y el footer—, y cada una lo escribia por su lado. La
 * direccion base, sobre todo: si una la normaliza y otra no, el sitemap y la
 * canonica terminan apuntando a dos URLs distintas para la misma pagina.
 */

/**
 * La direccion publica, sin barra final: las rutas se le pegan con la suya.
 *
 * Sale de `NEXT_PUBLIC_SERVER_URL`, asi que en produccion tiene que ser el
 * dominio real. Con el valor de ejemplo de `deploy/produccion.env` el sitemap,
 * las canonicas y las imagenes para redes apuntan a un dominio que no existe.
 */
export const SITIO = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
)

/**
 * Una ruta del sitio escrita entera. Una URL que ya es absoluta —una imagen en
 * otro dominio— vuelve tal cual.
 */
export const urlAbsoluta = (ruta: string): string => new URL(ruta, SITIO).toString()

/**
 * La descripcion de la portada, y la de cualquier pagina que no traiga la suya.
 * Entre 140 y 160 caracteres: mas corta desperdicia el renglon del resultado, y
 * mas larga Google la corta.
 */
export const DESCRIPCION =
  'Blog oficial de Jugadon: noticias, guías y tutoriales de casino online, apuestas deportivas y promociones vigentes en Argentina. Jugá con responsabilidad.'

/**
 * La imagen con la que se comparte una pagina que no tiene una propia.
 *
 * Lleva el logo y la franja legal del footer —sello +18 y el texto de juego
 * responsable— porque una pieza de la marca que circula suelta por WhatsApp o
 * X tiene que llevarla igual que el sitio. Mide 1200x630, la medida que piden
 * todas las redes. Es provisoria hasta que diseno entregue la definitiva: se
 * reemplaza el archivo con el mismo nombre y la misma medida.
 */
export const IMAGEN_SOCIAL = {
  url: '/imagen-social.jpg',
  width: 1200,
  height: 630,
  alt: 'Blog Jugadon: noticias, guías y tutoriales de casino online y apuestas deportivas',
} as const

/**
 * La imagen con la que se comparte un documento: la que se eligio en la pestana
 * SEO del panel o, si no hay, su portada. Siempre en el tamano `og` (1200x630):
 * el original puede venir vertical o cuadrado, y cada red lo recorta a su
 * manera. Sin ninguna de las dos, la de la marca.
 */
export const imagenParaCompartir = (media?: Media) => {
  const og = media?.sizes?.og

  if (media && og?.url) {
    return { url: og.url, width: og.width ?? 1200, height: og.height ?? 630, alt: media.alt }
  }
  if (media?.url) {
    return {
      url: media.url,
      width: media.width ?? undefined,
      height: media.height ?? undefined,
      alt: media.alt,
    }
  }
  return IMAGEN_SOCIAL
}

/**
 * Lo que toda pagina repite en su `openGraph`.
 *
 * Next no combina el `openGraph` de una pagina con el del layout: lo reemplaza
 * entero. Una pagina que pone su imagen perderia el nombre del sitio y el
 * idioma si no los vuelve a escribir, y esta es la forma de que no se olviden.
 *
 * Titulo y descripcion no van: si faltan, Next los completa con los de la
 * pagina, que es exactamente lo que se quiere. Fijarlos aca hacia que todas
 * las notas se compartieran con el titulo "Jugadon".
 */
export const OPEN_GRAPH_BASE = { locale: 'es_AR', siteName: 'Jugadon' } as const

export interface Red {
  nombre: string
  icono: string
  href: string
}

/**
 * Las cuentas nacionales. Las dibuja el footer y las declara la portada en sus
 * datos estructurados, que es como Google sabe que son de la marca.
 */
export const REDES: readonly Red[] = [
  { nombre: 'X (Twitter)', icono: '/redes/twitter.svg', href: 'https://x.com/jugadon_arg' },
  {
    nombre: 'Instagram',
    icono: '/redes/instagram.svg',
    href: 'https://www.instagram.com/jugadon_arg/',
  },
  { nombre: 'YouTube', icono: '/redes/youtube.svg', href: 'https://www.youtube.com/@jugadon_arg' },
  { nombre: 'TikTok', icono: '/redes/tiktok.svg', href: 'https://www.tiktok.com/@jugadon.ok' },
  {
    nombre: 'Spotify',
    icono: '/redes/spotify.svg',
    href: 'https://open.spotify.com/user/317gntai2wlxn4tdon7du6lisemu',
  },
  { nombre: 'Twitch', icono: '/redes/twitch.svg', href: 'https://www.twitch.tv/jugadon_arg' },
]
