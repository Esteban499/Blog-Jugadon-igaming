import { BloqueCta } from '@/components/molecules/BloqueCta'
import { Divisor } from '@/components/molecules/Divisor'
import { tieneBloqueCta } from '@/utilidades/texto'

/**
 * El cierre generico de una nota: divisor y CTA a promociones.
 *
 * El manual admite **un solo bloque de CTA por pagina** (§5.7). Este se apaga
 * cuando la nota ya trae uno propio cargado desde el panel: dos bloques
 * naranjas compitiendo es exactamente lo que la regla evita.
 *
 * La deteccion vive aca y no en la ruta porque es la condicion de existencia de
 * este bloque, no una decision de la pagina.
 */

export interface CierreDeArticuloProps {
  /** El documento Lexical de la nota, para saber si ya trae un CTA propio. */
  contenido: unknown
}

export function CierreDeArticulo({ contenido }: CierreDeArticuloProps) {
  if (tieneBloqueCta(contenido)) return null

  return (
    <>
      {/* Divisor de seccion: hairline, ficha, hairline. Como maximo dos por
          articulo, y este es el que cierra el cuerpo. */}
      <Divisor className="mt-16" />

      <div className="mt-16">
        <BloqueCta
          etiqueta="Ver promociones"
          href="/promociones"
          titulo="Todas las promociones vigentes, en un solo lugar"
        >
          Bonos de bienvenida, recargas y promociones de las plataformas, con sus condiciones a la
          vista y la fecha hasta la que se pueden reclamar.
        </BloqueCta>
      </div>
    </>
  )
}
