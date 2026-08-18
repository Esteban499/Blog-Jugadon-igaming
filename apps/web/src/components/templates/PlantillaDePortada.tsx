import type { ReactNode } from 'react'

/**
 * La maqueta de la home: portada anclada con una seccion que le trepa encima.
 *
 * El espaciador mide una vista mas el solapamiento; adentro, la portada mide
 * exactamente una vista y va en `sticky top-0`. Esa diferencia de alto es todo
 * el recorrido durante el cual la portada se queda quieta mientras la pagina
 * sigue subiendo. Al final, el contenido se descuenta ese mismo solapamiento y
 * trepa por encima.
 *
 * Los dos numeros salen del mismo token `--solapamiento`: escritos por
 * separado, cualquier retoque deja un hueco entre la portada y las tarjetas, o
 * un salto. Que la cuenta viva en un solo archivo es la razon de ser de esta
 * plantilla; estaba escrita dentro de `page.tsx`, donde nada impedia que la
 * proxima pantalla anclada la copiara con otro numero.
 *
 * Es agnostica del dato: no sabe que la portada es un video ni que lo que trepa
 * son noticias.
 */

export interface PlantillaDePortadaProps {
  /** Lo que se queda anclado ocupando la vista entera. */
  portada: ReactNode
  /**
   * Titulo de la seccion que trepa. Va oculto para lectores de pantalla: en la
   * portada las tarjetas salen directo sobre el video y son ellas las que
   * anuncian la seccion, pero quien no la ve necesita saber que empieza otra
   * cosa.
   */
  tituloDeSeccion: string
  children: ReactNode
}

export function PlantillaDePortada({
  children,
  portada,
  tituloDeSeccion,
}: PlantillaDePortadaProps) {
  return (
    <>
      {/*
       * El margen negativo de la barra mete la portada por debajo del
       * encabezado, que al tope es transparente. El `z-0` la deja por detras
       * del contenido sin sacarla de abajo de la barra, que va en `z-50`.
       */}
      <div
        className="-mt-[var(--alto-barra)]"
        style={{ height: 'calc(100dvh + var(--solapamiento))' }}
      >
        <div className="sticky top-0 z-0 h-dvh">{portada}</div>
      </div>

      <section
        aria-labelledby="titulo-portada"
        className="relative z-10 -mt-[var(--solapamiento)] pb-18 md:pb-32"
        id="noticias"
      >
        <h1 className="sr-only" id="titulo-portada">
          {tituloDeSeccion}
        </h1>

        {children}
      </section>
    </>
  )
}
