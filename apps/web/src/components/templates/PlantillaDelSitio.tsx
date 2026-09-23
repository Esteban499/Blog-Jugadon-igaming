import type { ReactNode } from 'react'

import { Footer } from '@/components/organisms/Footer'
import { Navbar } from '@/components/organisms/Navbar'
import { CLASES_DE_FUENTE } from '@/fuentes'

/**
 * El documento entero del sitio publico: fuentes, salto al contenido, barra,
 * cuerpo y pie.
 *
 * Devuelve `<html>` y `<body>` porque lo consumen dos archivos que necesitan el
 * documento completo y que hasta ahora lo escribian por separado: el layout de
 * `(frontend)` y `global-not-found.tsx`, que al no heredar ningun layout tiene
 * que traer el suyo. Las dos copias ya diferian —el 404 global se habia quedado
 * sin el enlace de "saltar al contenido"—, que es exactamente lo que pasa
 * cuando la misma maqueta vive en dos lugares.
 */

export interface PlantillaDelSitioProps {
  children: ReactNode
}

export function PlantillaDelSitio({ children }: PlantillaDelSitioProps) {
  return (
    // `es-AR` y no `es`: el sitio escribe en voseo y habla de jurisdicciones
    // argentinas, y es la misma region que declaran `og:locale` y los datos
    // estructurados.
    <html className={CLASES_DE_FUENTE} lang="es-AR">
      {/*
       * `dvh` y no `vh`: en el navegador del telefono la barra de direcciones
       * se esconde al bajar y `vh` no lo acompana, asi que la pagina pega un
       * salto. `dvh` sigue el alto real de la ventana.
       *
       * `suppressHydrationWarning`: hay extensiones del navegador (ColorZilla,
       * Grammarly, gestores de contrasenas) que le agregan atributos al `<body>`
       * antes de que React hidrate, y eso dispara un error de hidratacion que no
       * es nuestro. Solo silencia los atributos de este elemento; los hijos se
       * siguen comparando normalmente.
       */}
      <body className="flex min-h-dvh flex-col" suppressHydrationWarning>
        {/*
         * Primer elemento enfocable de la pagina: quien navega con teclado
         * puede saltear la navbar entera en lugar de tabular por cada seccion
         * en cada pagina que visita.
         *
         * Boton primario, con la misma regla que el resto: texto en el azul de
         * fondo, nunca blanco sobre naranja.
         */}
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-60 focus:flex focus:h-11 focus:items-center focus:rounded-full focus:bg-accion focus:px-7 focus:font-util focus:text-boton focus:uppercase focus:text-fondo"
          href="#contenido"
        >
          Saltar al contenido
        </a>

        <Navbar />
        <main className="flex-1" id="contenido">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
