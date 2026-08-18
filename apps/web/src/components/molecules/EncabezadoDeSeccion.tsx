import type { ReactNode } from 'react'

/**
 * Titulo de pantalla mas su bajada.
 *
 * Estaba escrito identico en `/blog` y en `/promociones`, y con el filtro de
 * categoria puesto el titulo del listado cambia por el de la categoria: dos
 * copias del mismo bloque que se tenian que mover juntas. Aca es una sola.
 *
 * El `h1` va en `text-h1-seccion`, que es un escalon por debajo del `text-h1`
 * del articulo: la nota es la pieza que carga la voz de la marca, el listado
 * es la puerta.
 */

export interface EncabezadoDeSeccionProps {
  titulo: string
  bajada?: ReactNode
}

export function EncabezadoDeSeccion({ bajada, titulo }: EncabezadoDeSeccionProps) {
  return (
    <header className="contenedor">
      <h1 className="font-display text-h1-seccion text-tinta text-balance">{titulo}</h1>

      {bajada ? (
        <p className="mt-4 max-w-[60ch] text-bajada text-parrafo text-pretty">{bajada}</p>
      ) : null}
    </header>
  )
}
