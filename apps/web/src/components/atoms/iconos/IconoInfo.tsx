import type { IconoProps } from './tipos'

/** Circulo informativo. Lo usan los avisos de "informacion" y "consejo". */
export function IconoInfo({ className = 'size-5' }: IconoProps) {
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
      <circle cx="10" cy="10" r="7.75" />
      <path d="M10 9v5M10 6.25h.01" />
    </svg>
  )
}
