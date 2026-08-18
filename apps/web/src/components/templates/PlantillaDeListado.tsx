import type { ReactNode } from 'react'

import { EncabezadoDeSeccion } from '@/components/molecules/EncabezadoDeSeccion'

/**
 * La maqueta de cualquier listado del sitio: encabezado, filtros, resultados y
 * paginacion.
 *
 * `/blog` y `/promociones` tenian este esqueleto escrito dos veces, con los
 * mismos `contenedor mt-8 md:mt-12` copiados y ya empezando a divergir. Aca es
 * uno solo, y una tercera pantalla de listado sale sin volver a maquetar nada.
 *
 * Es agnostica del dato: recibe nodos ya armados y no sabe si adentro hay notas
 * o bonos. Los slots son opcionales porque no todo listado filtra ni pagina.
 */

export interface PlantillaDeListadoProps {
  titulo: string
  bajada?: ReactNode
  /** La fila —o las filas— de chips. */
  filtros?: ReactNode
  /** La grilla de resultados, o el estado vacio si no hay ninguno. */
  children: ReactNode
  paginacion?: ReactNode
}

export function PlantillaDeListado({
  bajada,
  children,
  filtros,
  paginacion,
  titulo,
}: PlantillaDeListadoProps) {
  return (
    <div className="ritmo">
      <EncabezadoDeSeccion bajada={bajada} titulo={titulo} />

      {filtros ? <div className="mt-8 md:mt-12">{filtros}</div> : null}

      <div className="contenedor mt-8 md:mt-12">{children}</div>

      {paginacion}
    </div>
  )
}
