/**
 * El set de iconos del sistema (§7): 24px o 20px segun el `viewBox`, trazo
 * 1.5px, sin relleno, sin circulo propio y sin emojis. El color sale siempre
 * de `currentColor`, asi que lo decide quien los contiene.
 *
 * Hasta ahora cada uno vivia inline dentro del organismo que lo usaba —la
 * hamburguesa en la navbar, la flecha en el carrusel, el triangulo en dos
 * lugares distintos—, lo que hacia que "el set" no existiera en ningun lado.
 */
export interface IconoProps {
  /** Sobrescribe el tamano por defecto del icono. */
  className?: string
}
