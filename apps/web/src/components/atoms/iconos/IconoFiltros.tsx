import type { IconoProps } from './tipos'

/**
 * Los dos deslizadores que abren el panel de filtros.
 *
 * Es el mismo signo que usan las casas de juego para "afinar la busqueda", y
 * por eso se reconoce sin rotulo; aca igual va acompanado del texto "Filtros".
 */
export function IconoFiltros({ className = 'size-6' }: IconoProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path d="M9 4v6M9 16v4M15 4v4M15 14v6" />
      <circle cx="9" cy="13" r="2.5" />
      <circle cx="15" cy="11" r="2.5" />
    </svg>
  )
}
