import type { IconoProps } from './tipos'

/** La cruz que reemplaza a la hamburguesa con el menu abierto. */
export function IconoCerrar({ className = 'size-6' }: IconoProps) {
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
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
