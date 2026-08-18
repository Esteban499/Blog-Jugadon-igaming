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
    ],
  },
}

export default withPayload(nextConfig)
