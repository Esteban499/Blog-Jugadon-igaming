/**
 * Bloque gris que ocupa el lugar de algo que todavia esta cargando.
 *
 * Lo usan los `loading.tsx` de las rutas. Va en superficie —el mismo fondo que
 * las tarjetas— y no en un gris ajeno a la paleta: mientras carga, la pantalla
 * ya tiene que parecerse a la que va a quedar.
 *
 * El pulso se apaga solo con `prefers-reduced-motion`: la regla global de
 * styles.css alcanza cualquier animacion del sitio, incluida esta (§6).
 */

export interface EsqueletoProps {
  /** Clases de tamano y forma. El color y el pulso los pone el componente. */
  className?: string
}

export function Esqueleto({ className = '' }: EsqueletoProps) {
  return <span aria-hidden className={`block animate-pulse bg-superficie ${className}`.trim()} />
}
