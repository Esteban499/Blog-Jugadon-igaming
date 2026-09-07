import type { IconoProps } from './tipos'

/**
 * Triangulo de reproduccion de 20px, trazo 1.5px.
 *
 * Es el unico icono del set que va relleno, y no es una excepcion caprichosa:
 * se dibuja sobre la miniatura de un short —una foto, no una superficie del
 * sistema—, y ahi un triangulo de contorno de 1.5px se pierde contra cualquier
 * fotograma claro. El relleno es `currentColor`, asi que sigue tomando el color
 * de quien lo contiene como todos los demas.
 *
 * El circulo tampoco lo pone el icono: lo pone la pastilla de `TarjetaShort`,
 * igual que el boton terciario le pone el suyo a `IconoFlecha`.
 *
 * El vertice esta corrido dos decimas a la derecha del centro geometrico. Un
 * triangulo centrado por su caja se lee siempre desplazado hacia la izquierda,
 * porque el peso visual esta en el lado plano; esto lo compensa.
 */
export function IconoPlay({ className = 'size-5' }: IconoProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      strokeLinejoin="round"
      viewBox="0 0 20 20"
    >
      <path d="M7 4.5l9 5.5-9 5.5z" />
    </svg>
  )
}
