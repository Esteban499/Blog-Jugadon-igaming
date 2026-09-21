import { withPayload } from '@payloadcms/next/withPayload'

/*
 * Cabeceras de seguridad para todas las respuestas, sitio y panel.
 *
 * - `frame-ancestors 'self'` y `X-Frame-Options`: nadie puede meter el panel ni
 *   el sitio en un iframe ajeno para hacerle clickjacking a una sesion abierta.
 *   `'self'` y no `'none'` porque la vista previa en vivo del panel dibuja el
 *   sitio adentro de un iframe del mismo origen.
 * - La CSP es solo eso, no una politica completa: una de scripts rompe MapLibre
 *   (workers en `blob:`), el editor del panel (Monaco) y los embeds, y pide
 *   probarse pantalla por pantalla. Queda anotada como pendiente en el README.
 * - HSTS no va aca: lo pone el Nginx de aaPanel, que termina TLS (ver
 *   `deploy/nginx-aapanel.conf`),
 *   que es el unico que sabe si la conexion vino por HTTPS.
 */
const CABECERAS_DE_SEGURIDAD = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), usb=()' },
]

/*
 * El bucket como origen de imagenes remotas, armado desde la misma variable que
 * usa el reenvio de `/mapa/*`. Antes estaba escrito a mano como
 * `http://localhost:9000`, que en produccion era un patron muerto en el mejor
 * caso y, en el peor, el optimizador de imagenes pidiendole cosas a lo que
 * escuche en ese puerto de la VM.
 */
const patronDelBucket = () => {
  const crudo = process.env.NEXT_PUBLIC_S3_PUBLIC_URL
  if (!crudo) return []
  try {
    const url = new URL(crudo)
    return [
      {
        protocol: url.protocol.replace(':', ''),
        hostname: url.hostname,
        port: url.port,
        pathname: `${url.pathname.replace(/\/+$/, '')}/**`,
      },
    ]
  } catch {
    return []
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * `standalone` solo para la imagen de Docker, que lo pide con
   * `NEXT_OUTPUT=standalone`. Con la salida standalone `next start` avisa que
   * no corresponde y no copia `public/` ni `.next/static`, asi que dejarla fija
   * rompia `pnpm build && pnpm start` en la compu de desarrollo.
   */
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // No anunciar el framework en cada respuesta.
  poweredByHeader: false,
  /*
   * Los layouts viven dentro de grupos de rutas, asi que ninguno es el layout
   * raiz y Next no tiene con que componer un 404 para las URLs que no coinciden
   * con nada. Esto habilita `src/app/global-not-found.tsx`.
   */
  experimental: {
    globalNotFound: true,
  },
  /*
   * Para probar el sitio desde el celular con `pnpm dev`, abriendolo por la IP
   * de la compu en la red. Next 16 rechaza con 403 los pedidos a `/_next/*` y el
   * websocket de recarga que llegan desde un origen que no sea `localhost`.
   * Solo aplica al servidor de desarrollo; en produccion no existe.
   */
  allowedDevOrigins: ['10.*.*.*', '172.*.*.*', '192.168.*.*'],
  async headers() {
    return [{ source: '/:path*', headers: CABECERAS_DE_SEGURIDAD }]
  },
  /*
   * El `.pmtiles` del mapa sale por el mismo host que el sitio. En desarrollo
   * `NEXT_PUBLIC_MAPA_TILES_URL` es `/mapa/jurisdicciones.pmtiles` y esto lo
   * reenvia a MinIO: con `http://localhost:9000` en la variable, el celular le
   * pedia el archivo a si mismo y el mapa no aparecia. Next reenvia el header
   * `Range` y devuelve el 206 tal cual, que es lo que necesita pmtiles.
   *
   * En produccion `NEXT_PUBLIC_MAPA_TILES_URL` es la URL absoluta de R2 y el
   * navegador lee el archivo directo de ahi, asi que esto no se usa: 100 MB
   * por rangos es trafico que conviene que no pase por el proceso de Node.
   */
  async rewrites() {
    const bucket = process.env.NEXT_PUBLIC_S3_PUBLIC_URL
    if (!bucket) return []
    return [{ source: '/mapa/:archivo', destination: `${bucket}/mapa/:archivo` }]
  },
  images: {
    /*
     * Declarar `localPatterns` apaga el permiso por defecto para todo lo que
     * sale de `public/`: lo que no este listado aca deja de optimizarse y
     * responde 400. Por eso estan tambien los assets de marca, no solo el
     * media de Payload.
     */
    localPatterns: [
      { pathname: '/marca/**', search: '' },
      { pathname: '/redes/**', search: '' },
      { pathname: '/loterias/**', search: '' },
      { pathname: '/iconos/**', search: '' },
      { pathname: '/providers/**', search: '' },
      { pathname: '/banners/**', search: '' },
      /*
       * Las portadas no salen del bucket directo: Payload las sirve por su
       * propia ruta y le agrega el prefijo de la coleccion como query. Sin
       * este patron `next/image` las rechaza por venir con query string.
       */
      { pathname: '/api/media/file/**', search: '?prefix=media' },
    ],
    remotePatterns: [
      ...patronDelBucket(),
      /*
       * Las miniaturas de los juegos de la seccion de ultimos ganadores. No son
       * media de Payload: las sirve el CDN de la plataforma de casino, que es
       * de donde salen tambien en el lobby de cada jurisdiccion. El `pathname`
       * las acota a la carpeta de contextos de casino y no deja el dominio
       * abierto entero.
       */
      {
        protocol: 'https',
        hostname: 'd2i3l2m8dk0scd.cloudfront.net',
        pathname: '/platform/contexts/**',
      },
      /*
       * Las miniaturas de los shorts del canal de YouTube. El feed las reporta
       * indistintamente en `i.ytimg.com`, `i1`, `i2`, `i3` e `i4`; para no
       * declarar cinco patrones ni abrir el dominio con comodin, la URL se
       * reconstruye a partir del id del video y sale siempre de este host. Ver
       * `miniaturaDe` en `utilidades/shorts`.
       */
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/vi/**',
      },
    ],
  },
}

export default withPayload(nextConfig)
