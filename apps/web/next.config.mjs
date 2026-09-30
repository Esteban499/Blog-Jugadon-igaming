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
       * Las portadas las sirve Payload por su propia ruta, leyendo del disco
       * de la VM (ver `staticDir` en la coleccion Media). Van sin query: el
       * `?prefix=media` que habia aca lo agregaba el adaptador de S3, y con
       * ese `search` declarado `next/image` rechaza con 400 las URLs actuales.
       */
      { pathname: '/api/media/file/**', search: '' },
    ],
    remotePatterns: [
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
