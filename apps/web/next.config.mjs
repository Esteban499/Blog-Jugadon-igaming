import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * Los layouts viven dentro de grupos de rutas, asi que ninguno es el layout
   * raiz y Next no tiene con que componer un 404 para las URLs que no coinciden
   * con nada. Esto habilita `src/app/global-not-found.tsx`.
   */
  experimental: {
    globalNotFound: true,
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
      // MinIO local. En produccion se reemplaza por el dominio publico de R2.
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/blog-media/**',
      },
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
