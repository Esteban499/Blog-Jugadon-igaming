import Image from 'next/image'

/**
 * Tamano real del PNG. Viene recortado al borde del wordmark, sin transparencia
 * alrededor: si se reemplaza el archivo, hay que recortarlo igual o el logo
 * queda chico y flotando dentro de su caja.
 */
const ANCHO_ORIGINAL = 699
const ALTO_ORIGINAL = 103

/**
 * Vive en `atoms/marca/` y no suelto en `atoms/` porque no es agnostico del
 * dominio: es el wordmark de Jugadon. Sigue siendo indivisible —no compone
 * ningun otro atomo—, asi que el nivel es el correcto; la subcarpeta es lo que
 * mantiene honesta la regla de que un atomo suelto no conoce la marca.
 */
export interface LogoJugadonProps {
  /**
   * Ancho del logo. 200 en la navbar y en el footer. El alto sale de la
   * proporcion del PNG, asi que no se declara.
   */
  ancho: number
  /**
   * Ancho en clases, para los tamanos que cambian con el ancho de pantalla.
   *
   * Cuando viene, reemplaza al ancho en linea en lugar de sumarse: una regla en
   * linea le gana a cualquier clase, asi que conviviendo las dos el `lg:` no
   * cambiaria nada. `ancho` sigue haciendo falta —es el mayor de los
   * declarados, del que sale el `sizes` del `next/image`—.
   */
  clasesDeCaja?: string
  /** La navbar esta arriba de todo: su logo entra en el LCP. */
  prioridad?: boolean
}

export function LogoJugadon({ ancho, clasesDeCaja, prioridad = false }: LogoJugadonProps) {
  return (
    <Image
      alt="Jugadon"
      className={`block h-auto ${clasesDeCaja ?? ''}`.trim()}
      height={ALTO_ORIGINAL}
      priority={prioridad}
      sizes={`${ancho}px`}
      src="/marca/logo-jugadon.png"
      style={clasesDeCaja ? undefined : { width: ancho }}
      width={ANCHO_ORIGINAL}
    />
  )
}
