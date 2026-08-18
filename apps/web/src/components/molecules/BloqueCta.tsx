import type { ReactNode } from 'react'

import { Boton } from '@/components/atoms/Boton'

/**
 * Bloque de CTA (§5.7).
 *
 * Gradiente de marca, radio 4px y padding generoso: 48px verticales. Titulo
 * en la display en blanco, apoyo en cuerpo y boton primario naranja.
 *
 * **Uno solo por pagina, al final.** Es tambien el unico naranja de la vista
 * en la que aparece: si el color de accion compite consigo mismo deja de
 * indicar accion.
 */

export interface BloqueCtaProps {
  titulo: string
  children?: ReactNode
  etiqueta: string
  href: string
  /** Los enlaces a plataformas van con `rel="nofollow sponsored"`. */
  rel?: string
  target?: string
}

export function BloqueCta({ children, etiqueta, href, rel, target, titulo }: BloqueCtaProps) {
  return (
    <aside className="degradado-marca rounded-caja px-6 py-12 text-center md:px-12">
      <h2 className="font-display text-h2 text-tinta text-balance">{titulo}</h2>

      {children ? (
        <div className="mx-auto mt-4 max-w-[60ch] text-cuerpo text-parrafo text-pretty">
          {children}
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <Boton href={href} rel={rel} tamano="grande" target={target} variante="primaria">
          {etiqueta}
        </Boton>
      </div>
    </aside>
  )
}
