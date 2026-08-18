/**
 * La ficha de poker de la "o" del logotipo (§1).
 *
 * Es el unico ornamento del sistema y tiene exactamente tres lugares donde
 * puede aparecer: el bullet de las listas del articulo (resuelto en CSS,
 * porque el contenido sale de Lexical y no puede llevar componentes), la
 * marca central del divisor de seccion y el hueco de una portada que no
 * existe. En ningun otro lado.
 *
 * Es un atomo: un anillo, sin nada adentro. El divisor que la centra entre dos
 * hairlines es una molecula y vive en `molecules/Divisor`.
 */

export interface FichaProps {
  /** Lado del anillo en px. */
  tamano?: number
  className?: string
}

/** Anillo naranja de 2px con el centro transparente. */
export function Ficha({ tamano = 12, className = '' }: FichaProps) {
  return (
    <span
      aria-hidden
      className={`block shrink-0 rounded-full border-2 border-accion ${className}`.trim()}
      style={{ height: tamano, width: tamano }}
    />
  )
}
