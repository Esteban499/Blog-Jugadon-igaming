/**
 * El lugar de una portada que no se cargo (§7): gradiente profundo con la
 * ficha centrada al 10% de opacidad. Nunca un gris plano ni un icono de
 * placeholder generico.
 *
 * Dibuja el anillo por su cuenta en vez de componer `Ficha` a proposito: asi
 * sigue siendo un atomo y las tarjetas —que son moleculas— pueden usarlo sin
 * anidar una molecula dentro de otra.
 */

export interface SinPortadaProps {
  className?: string
}

export function SinPortada({ className = '' }: SinPortadaProps) {
  return (
    <div
      aria-hidden
      className={`degradado-profundo flex items-center justify-center ${className}`.trim()}
    >
      <span className="block size-16 rounded-full border-2 border-accion opacity-10" />
    </div>
  )
}
