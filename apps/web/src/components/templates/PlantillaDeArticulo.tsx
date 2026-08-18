import type { ReactNode } from 'react'

/**
 * La maqueta de una pagina de lectura: hero opcional y columna de 720px
 * centrada. **Sin sidebar** — el manual no lo contempla en ningun ancho.
 *
 * El hero es opcional porque las dos pantallas de lectura del sitio no lo
 * necesitan igual: una nota abre con su portada a sangre, y la ficha de una
 * promocion arranca directo en la columna. Es la misma maqueta con el hero
 * puesto o sacado, no dos plantillas.
 *
 * Es agnostica del dato: no sabe si adentro hay un documento de Lexical o una
 * tabla de condiciones.
 */

export interface PlantillaDeArticuloProps {
  /** El hero a sangre. Sin el, la columna arranca contra la barra. */
  hero?: ReactNode
  children: ReactNode
  /** El bloque de cierre: divisor, CTA, nota legal. */
  cierre?: ReactNode
}

export function PlantillaDeArticulo({ cierre, children, hero }: PlantillaDeArticuloProps) {
  return (
    <article>
      {hero}

      <div className="columna py-16 md:py-24">
        {children}
        {cierre}
      </div>
    </article>
  )
}
