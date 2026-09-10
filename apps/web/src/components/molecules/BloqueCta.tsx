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
 *
 * Lleva a algun lado con `href` o dispara algo con `onClick`, nunca las dos
 * cosas. La segunda forma existe porque en la portada el cierre de los
 * ganadores no navega: abre el `ModalDePlataformas`, que es como se crea una
 * cuenta en este sitio. La eleccion se delega tal cual al `Boton`, que ya
 * distingue enlace de boton por la presencia de `href`.
 */

/** Lo que el bloque dice, sea cual sea la forma de su boton. */
interface BloqueCtaBaseProps {
  titulo: string
  children?: ReactNode
  etiqueta: string
}

/** Con `href`: el boton es un enlace. */
export type BloqueCtaComoEnlaceProps = BloqueCtaBaseProps & {
  href: string
  /** Los enlaces a plataformas van con `rel="nofollow sponsored"`. */
  rel?: string
  target?: string
  onClick?: undefined
}

/** Sin `href`: el boton es un `<button>` y avisa al que lo monto. */
export type BloqueCtaComoBotonProps = BloqueCtaBaseProps & {
  href?: undefined
  rel?: undefined
  target?: undefined
  onClick: () => void
}

export type BloqueCtaProps = BloqueCtaComoEnlaceProps | BloqueCtaComoBotonProps

export function BloqueCta({ children, etiqueta, titulo, ...accion }: BloqueCtaProps) {
  return (
    <aside className="degradado-marca rounded-caja px-6 py-12 text-center md:px-12">
      <h2 className="font-display text-h2 text-tinta text-balance">{titulo}</h2>

      {children ? (
        <div className="mx-auto mt-4 max-w-[60ch] text-cuerpo text-parrafo text-pretty">
          {children}
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        {accion.href === undefined ? (
          <Boton onClick={accion.onClick} tamano="grande" variante="primaria">
            {etiqueta}
          </Boton>
        ) : (
          <Boton
            href={accion.href}
            rel={accion.rel}
            tamano="grande"
            target={accion.target}
            variante="primaria"
          >
            {etiqueta}
          </Boton>
        )}
      </div>
    </aside>
  )
}
