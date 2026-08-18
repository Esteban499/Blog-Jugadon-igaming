import { Ficha } from '@/components/atoms/Ficha'

/**
 * Divisor de seccion: hairline, ficha centrada, hairline.
 *
 * Como maximo dos por articulo. Es una molecula y no un atomo porque compone
 * la `Ficha` con dos reglas: la unidad que se lee es "corte de seccion", no
 * "anillo naranja".
 */

export interface DivisorProps {
  className?: string
}

export function Divisor({ className = '' }: DivisorProps) {
  return (
    <div aria-hidden className={`flex items-center gap-4 ${className}`.trim()}>
      <span className="h-px flex-1 bg-contorno" />
      <Ficha />
      <span className="h-px flex-1 bg-contorno" />
    </div>
  )
}
