import type { IconoProps } from './tipos'

/**
 * Triangulo de advertencia. Lo usan el aviso de "atencion" y el de "juego
 * responsable" dentro del articulo, y la ficha de una promocion vencida.
 *
 * Va siempre en el naranja de accion, nunca en rojo: el sistema no incorpora
 * colores de alerta ajenos a la paleta, ni siquiera para estados (§2.3.4). Lo
 * que distingue una advertencia de un dato es este icono mas el rotulo.
 */
export function IconoAlerta({ className = 'size-5' }: IconoProps) {
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
      <path d="M10 2.5 1.75 17h16.5L10 2.5Z" />
      <path d="M10 8v3.5M10 14.25h.01" />
    </svg>
  )
}
