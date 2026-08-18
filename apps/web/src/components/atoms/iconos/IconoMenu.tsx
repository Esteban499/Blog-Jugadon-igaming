import type { IconoProps } from './tipos'

/** Hamburguesa de la navbar. 24px, trazo 1.5px (§7). */
export function IconoMenu({ className = 'size-6' }: IconoProps) {
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
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}
