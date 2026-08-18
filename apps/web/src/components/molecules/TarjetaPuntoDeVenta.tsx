import Image from 'next/image'

import { Boton, clasesDeBoton } from '@/components/atoms/Boton'

/**
 * Ficha de una sala o agencia, en la lista que acompana al mapa.
 *
 * Es la contraparte del marcador: lo que en el mapa es un punto, aca son los
 * datos con los que se decide ir —direccion, horario, telefono— y las dos
 * acciones que siguen, llamar y arrancar el navegador.
 *
 * La card entera selecciona el punto en el mapa, con el mismo `::after`
 * estirado que usan las cards de nota y de promocion. La diferencia es que aca
 * el elemento estirado es un `<button>` y no un enlace —no navega a ningun
 * lado, mueve el mapa—, y que por primera vez la card tiene acciones propias
 * adentro: por eso la fila de abajo va con `relative z-10`, que es lo que la
 * deja por encima del `::after` y hace que "Cómo llegar" abra el navegador en
 * lugar de centrar el mapa.
 *
 * Sin eyebrow naranja, por la misma razon que la card de promocion: la lista
 * muestra decenas de puntos a la vez y serian decenas de acentos repetidos. En
 * esta pantalla el naranja es del punto seleccionado —el borde de la card y su
 * marcador—, que es lo unico que esta pasando.
 *
 * Recibe primitivas, no un `PuntoDeVenta`: el tipo y la provincia llegan ya
 * traducidos a la etiqueta que se muestra. Quien traduce el documento es el
 * organismo que la agrupa.
 */

export interface TarjetaPuntoDeVentaProps {
  nombre: string
  /** "Sala" o "Agencia", ya traducido. */
  tipo: string
  direccion: string
  localidad: string
  /** El nombre de la provincia, ya traducido. */
  provincia: string
  telefono?: string | null
  horarios?: string | null
  fotoUrl?: string | null
  /** A Google Maps, con las coordenadas del punto como destino. */
  urlComoLlegar: string
  seleccionada?: boolean
  /** Centra el mapa en este punto. Sin handler, la card es solo informativa. */
  alSeleccionar?: () => void
}

export function TarjetaPuntoDeVenta({
  alSeleccionar,
  direccion,
  fotoUrl,
  horarios,
  localidad,
  nombre,
  provincia,
  seleccionada = false,
  telefono,
  tipo,
  urlComoLlegar,
}: TarjetaPuntoDeVentaProps) {
  return (
    <article
      className={`relative rounded-caja border bg-superficie p-5 transition-colors duration-250 ease-marca ${
        seleccionada
          ? 'border-accion bg-elevada'
          : 'border-transparent hover:border-accion-contorno hover:bg-elevada'
      }`}
    >
      <div className="flex gap-4">
        {fotoUrl ? (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-caja">
            <Image alt="" className="object-cover" fill sizes="80px" src={fotoUrl} />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-card text-tinta text-pretty">
            {alSeleccionar ? (
              <button
                aria-label={`${nombre} — ver en el mapa`}
                className="cursor-pointer text-left after:absolute after:inset-0 after:content-['']"
                onClick={alSeleccionar}
                type="button"
              >
                {nombre}
              </button>
            ) : (
              nombre
            )}
          </h3>

          <p className="mt-2 text-cuerpo text-parrafo text-pretty">{direccion}</p>

          <p className="mt-1 font-util text-meta text-apagado uppercase">
            {tipo} · {localidad} · {provincia}
          </p>
        </div>
      </div>

      {horarios ? (
        <p className="mt-4 whitespace-pre-line text-cuerpo text-parrafo">{horarios}</p>
      ) : null}

      {/*
       * Por encima del `::after` que estira el boton del titulo. Sin el `z-10`
       * la card entera se queda con los clicks y estas dos acciones no llegan
       * a recibir ninguno.
       */}
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-3">
        {telefono ? (
          /*
           * `<a>` a mano y no `Boton`: `Boton` manda todo lo que no empiece con
           * http a `next/link`, y un `tel:` no es una ruta del sitio. Las clases
           * son las mismas, que es para lo que existe `clasesDeBoton`.
           */
          <a className={clasesDeBoton({ variante: 'terciaria' })} href={`tel:${telefono}`}>
            {telefono}
          </a>
        ) : null}

        <Boton href={urlComoLlegar} rel="noopener" target="_blank" variante="terciaria">
          Cómo llegar
        </Boton>
      </div>
    </article>
  )
}
