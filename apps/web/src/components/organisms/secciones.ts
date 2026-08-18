export interface Seccion {
  etiqueta: string
  /**
   * `null` mientras la seccion no tenga pagina. Se dibuja apagada y sin enlace
   * en lugar de apuntar a `#`: un enlace que no lleva a ningun lado promete
   * algo que no cumple, y en un menu se nota mas que la seccion falte.
   */
  href: string | null
}

/**
 * Las secciones del prototipo. Las usan la navbar y el footer, que son los dos
 * organismos del chrome del sitio.
 *
 * No es un componente: es el dato que comparten dos organismos, y por eso vive
 * al lado de ellos y no en `atoms`.
 *
 * `Inicio` va explicito aunque el logo de la navbar ya lleve a la portada: el
 * logo como unica vuelta al inicio es una convencion, no una senalizacion, y
 * en el footer el logo ni siquiera es un enlace.
 */
export const SECCIONES: readonly Seccion[] = [
  { etiqueta: 'Inicio', href: '/' },
  { etiqueta: 'Promociones', href: '/promociones' },
  { etiqueta: 'Puntos de venta', href: '/puntos-de-venta' },
  { etiqueta: 'Afiliados', href: null },
  { etiqueta: 'Videos deportivos', href: null },
]
