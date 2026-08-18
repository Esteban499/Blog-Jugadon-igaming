import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Tag de categoria (§5.2).
 *
 * Pildora chica en la utilitaria, 12px en mayusculas con tracking +0.08em y
 * padding de 4x12. En reposo es azul —fondo al 18%, texto claro, borde al
 * 35%—; seleccionado pasa a naranja con texto en el azul de fondo.
 *
 * Es tambien el filtro de los listados: al ser cada combinacion una URL
 * propia se dibuja como enlace y no como boton, asi se puede compartir e
 * indexar. Sin `href` queda como etiqueta muerta, que es lo que corresponde
 * cuando solo informa la categoria de una entrada.
 */

const BASE =
  'inline-flex items-center rounded-full px-3 py-1 font-util text-tag uppercase no-underline transition-colors duration-150 ease-marca'

const REPOSO = 'border border-azul-contorno bg-azul-velo text-enlace'
const SELECCIONADO = 'border border-accion bg-accion text-fondo'

/**
 * Devuelve las clases del tag sin el componente.
 *
 * Lo necesita el boton que abre el panel de filtros de `/promociones`: es un
 * `<button>` y no un enlace —no navega, despliega—, pero comparte fila con los
 * chips y tiene que medir y pesar exactamente igual que ellos.
 */
export const clasesDeTag = ({ seleccionado = false }: { seleccionado?: boolean } = {}): string =>
  `${BASE} ${seleccionado ? SELECCIONADO : `${REPOSO} hover:border-accion hover:text-tinta`}`

export interface TagProps {
  children: ReactNode
  /** Sin `href` queda como etiqueta muerta, no como filtro. */
  href?: string
  seleccionado?: boolean
}

export function Tag({ children, href, seleccionado = false }: TagProps) {
  if (!href) {
    return <span className={`${BASE} ${seleccionado ? SELECCIONADO : REPOSO}`}>{children}</span>
  }

  return (
    <Link
      aria-current={seleccionado ? 'true' : undefined}
      className={clasesDeTag({ seleccionado })}
      href={href}
    >
      {children}
    </Link>
  )
}
