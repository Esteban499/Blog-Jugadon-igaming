import type { IconoProps } from './tipos'

export interface IconoFlechaProps extends IconoProps {
  sentido?: 'derecha' | 'izquierda'
}

/**
 * Flecha de 20px, trazo 1.5px. Sin relleno ni circulo propio: cuando va dentro
 * de un control, el circulo lo pone el boton terciario que la contiene.
 *
 * La usan los dos controles del carrusel y el chevron de cada fila del menu de
 * telefono.
 */
export function IconoFlecha({ className = 'size-5', sentido = 'derecha' }: IconoFlechaProps) {
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
      {sentido === 'derecha' ? <path d="M4 10h12M11 5l5 5-5 5" /> : <path d="M16 10H4M9 5l-5 5 5 5" />}
    </svg>
  )
}
