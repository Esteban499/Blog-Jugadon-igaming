import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

/**
 * Botones (§5.1).
 *
 * Pildora, etiqueta en la utilitaria en mayusculas, 44px de alto (48 en la
 * variante grande) y 28px de padding lateral. El hover cambia color, no
 * geometria: sin desplazamientos, sin escalas, sin sombras de color.
 */

export type VarianteDeBoton = 'primaria' | 'secundaria' | 'terciaria'

export type TamanoDeBoton = 'normal' | 'grande'

/*
 * `no-underline` no es decorativo: dentro del articulo, `.prosa a` subraya
 * todo enlace, y un boton subrayado deja de leerse como boton.
 */
const BASE =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-util text-boton whitespace-nowrap uppercase no-underline transition-colors duration-150 ease-marca'

/** Deshabilitado: 40% de opacidad y sin respuesta al hover. */
const APAGADO =
  'disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40'

const VARIANTES: Record<VarianteDeBoton, string> = {
  /*
   * Una por pantalla: registro, suscripcion. El texto va en el azul de fondo
   * y nunca en blanco —blanco sobre naranja da 2.2:1, ilegible en pantalla—.
   */
  primaria: 'bg-accion text-fondo hover:bg-accion-hover',
  /** Navegacion destacada. */
  secundaria: 'bg-marca text-tinta hover:bg-marca-hover',
  /** "Cargar mas", filtros. Transparente con contorno al 24%. */
  terciaria: 'border border-contorno text-parrafo hover:border-accion hover:text-tinta',
}

const TAMANOS: Record<TamanoDeBoton, string> = {
  normal: 'h-11 px-7',
  grande: 'h-12 px-7',
}

/** Lo que comparten las dos formas del boton, sea `<a>`, `<Link>` o `<button>`. */
export interface BotonBaseProps {
  children: ReactNode
  variante?: VarianteDeBoton
  tamano?: TamanoDeBoton
  className?: string
}

/**
 * Devuelve las clases del boton sin el componente.
 *
 * Lo necesitan los pocos casos en los que el elemento ya viene dado y no se
 * puede envolver: el enlace patrocinado de una promocion, que lleva sus
 * propios `rel`, o un `<a>` que sale del contenido cargado en el panel.
 */
export const clasesDeBoton = ({
  variante = 'primaria',
  tamano = 'normal',
  className = '',
}: Omit<BotonBaseProps, 'children'> = {}): string =>
  `${BASE} ${APAGADO} ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`.trim()

/** Con `href`: se dibuja como enlace. */
export type BotonComoEnlaceProps = BotonBaseProps & { href: string } & Omit<
    ComponentProps<typeof Link>,
    'href' | 'className' | 'children'
  >

/** Sin `href`: se dibuja como `<button type="button">`. */
export type BotonComoBotonProps = BotonBaseProps & { href?: undefined } & Omit<
    ComponentProps<'button'>,
    'className' | 'children'
  >

export type BotonProps = BotonComoEnlaceProps | BotonComoBotonProps

export function Boton(props: BotonComoEnlaceProps): React.JSX.Element
export function Boton(props: BotonComoBotonProps): React.JSX.Element
export function Boton({ children, className, tamano, variante, ...resto }: BotonProps) {
  const clases = clasesDeBoton({ className, tamano, variante })

  if (typeof resto.href === 'string') {
    const { href, ...propsDelEnlace } = resto as BotonComoEnlaceProps
    /*
     * Los enlaces externos salen como `<a>` y no como `Link`: el prefetch del
     * router no sirve fuera del sitio y `Link` termina renderizando lo mismo.
     */
    return /^https?:\/\//.test(href) ? (
      <a className={clases} href={href} {...(propsDelEnlace as ComponentProps<'a'>)}>
        {children}
      </a>
    ) : (
      <Link className={clases} href={href} {...propsDelEnlace}>
        {children}
      </Link>
    )
  }

  const { href: _sinUsar, ...propsDelBoton } = resto as BotonComoBotonProps

  return (
    <button className={clases} type="button" {...propsDelBoton}>
      {children}
    </button>
  )
}
