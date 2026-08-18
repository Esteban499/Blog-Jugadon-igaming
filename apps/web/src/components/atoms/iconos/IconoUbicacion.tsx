import type { IconoProps } from './tipos'

/**
 * Pin de mapa. Lo usan la ficha de un punto de venta y el estado vacio del
 * mapa, que es donde hay que decir "no hay locales acá" sin dibujar un mapa.
 */
export function IconoUbicacion({ className = 'size-5' }: IconoProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 20 20"
    >
      <path d="M10 18.25s5.75-5.9 5.75-10.25a5.75 5.75 0 1 0-11.5 0C4.25 12.35 10 18.25 10 18.25z" />
      <circle cx="10" cy="8" r="2.25" />
    </svg>
  )
}
