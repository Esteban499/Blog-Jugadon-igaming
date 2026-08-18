import type { IconoProps } from './tipos'

/**
 * Chevron de 20px. Lo usa el `summary` de cada pregunta frecuente, que lo gira
 * 90 grados al abrir con `group-open:rotate-90`.
 *
 * Es distinto de `IconoFlecha`: la flecha lleva asta y dice "ir a", el chevron
 * es solo la punta y dice "se despliega".
 */
export function IconoChevron({ className = 'size-5' }: IconoProps) {
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
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  )
}
