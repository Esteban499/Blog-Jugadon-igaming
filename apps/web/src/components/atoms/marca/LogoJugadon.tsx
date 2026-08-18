import Image from 'next/image'

/** Tamano real del PNG exportado desde Figma. */
const ANCHO_ORIGINAL = 1352
const ALTO_ORIGINAL = 463

/**
 * Vive en `atoms/marca/` y no suelto en `atoms/` porque no es agnostico del
 * dominio: es el wordmark de Jugadon. Sigue siendo indivisible —no compone
 * ningun otro atomo—, asi que el nivel es el correcto; la subcarpeta es lo que
 * mantiene honesta la regla de que un atomo suelto no conoce la marca.
 */
export interface LogoJugadonProps {
  /** Ancho de la caja del logo. 120 en la navbar, 150 en el footer. */
  ancho: number
  alto: number
  /** La navbar esta arriba de todo: su logo entra en el LCP. */
  prioridad?: boolean
}

/**
 * El PNG exportado trae bastante transparencia alrededor del wordmark, asi que
 * dibujarlo tal cual dentro de la caja del diseno lo deja chico y flotando.
 * El prototipo lo resuelve recortando: escala la imagen al 139.51% x 168.25% de
 * la caja y la corre, dejando visible solo el wordmark. Al ser todo porcentajes
 * el mismo encuadre sirve para los dos tamanos.
 */
export function LogoJugadon({ ancho, alto, prioridad = false }: LogoJugadonProps) {
  return (
    <span className="relative block overflow-hidden" style={{ width: ancho, height: alto }}>
      <Image
        alt="Jugadon"
        className="absolute top-[-36.3%] left-[-20.99%] h-[168.25%] w-[139.51%] max-w-none"
        height={ALTO_ORIGINAL}
        priority={prioridad}
        sizes={`${Math.round(ancho * 1.4)}px`}
        src="/marca/logo-jugadon.png"
        width={ANCHO_ORIGINAL}
      />
    </span>
  )
}
