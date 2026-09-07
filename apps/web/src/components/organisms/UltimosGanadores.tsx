'use client'

import { useEffect, useRef, useState } from 'react'

// Archivos directos y no barril: este componente es cliente. Ver `atoms/index.ts`.
import { Esqueleto } from '@/components/atoms/Esqueleto'
import { TarjetaGanador } from '@/components/molecules/TarjetaGanador'
import { TarjetaPremioMayor } from '@/components/molecules/TarjetaPremioMayor'
import type { Ganador } from '@/utilidades/ultimos-ganadores'

import { CarruselDeGanadores } from './CarruselDeGanadores'
import { ModalDePlataformas } from './ModalDePlataformas'

/**
 * Los treinta premios mas altos de las cuatro plataformas, arriba de la cinta
 * de proveedores.
 *
 * A diferencia del resto de la portada, esta seccion pide sus datos desde el
 * cliente. La razon es el ISR: la home se regenera cada hora porque las
 * noticias salen de Payload y no cambian mas seguido que eso, pero una lista
 * que se llama "ultimos ganadores" con una hora de atraso deja de ser cierta.
 * Pidiendola aparte, los premios se renuevan cada minuto y las noticias siguen
 * sirviendose estaticas.
 *
 * Y no se leen una sola vez: la seccion vuelve a pedirlos cuando la pestania
 * recupera el foco, que es cuando la lista importa —quien vuelve despues de un
 * rato espera ver premios de ahora, no los de cuando abrio—. Nunca con el modal
 * abierto y nunca antes del minuto que dura el cache. Ver `alVolverALaPestania`.
 *
 * Lo que llega por la red ya viene resuelto: consolidado, ordenado, ofuscado y
 * escrito en pesos por `/datos/ultimos-ganadores`. Este archivo no conoce las
 * jurisdicciones ni los nombres de usuario reales; solo reparte el primer
 * premio a su tarjeta grande y los otros veintinueve a la pista.
 *
 * Del `import type` de `Ganador` no queda nada en el bundle —TypeScript lo
 * borra al compilar—, asi que el modulo del servidor, con sus cuatro URLs y su
 * logica de ofuscacion, no viaja al navegador.
 *
 * Tambien es quien sabe que tarjeta se toco: el estado del modal vive aca y no
 * en cada tarjeta. Con treinta tarjetas, un `abierto` por tarjeta serian treinta
 * estados que pueden quedar abiertos a la vez; con uno solo, elegir otra tarjeta
 * reemplaza el modal en lugar de apilarlo.
 */

/** Cuantas columnas dibuja el esqueleto mientras llegan los premios. */
const COLUMNAS_FANTASMA = 4

/**
 * Lo minimo que tiene que pasar entre dos lecturas.
 *
 * Es el mismo minuto que dura el cache de `/datos/ultimos-ganadores`: pedir
 * antes devuelve byte por byte lo mismo, asi que seria una peticion regalada.
 */
const MINIMO_ENTRE_LECTURAS_MS = 60_000

type Estado =
  | { fase: 'cargando' }
  | { fase: 'listo'; ganadores: Ganador[] }
  /** Ni datos ni forma de conseguirlos: la seccion se borra de la pantalla. */
  | { fase: 'sin-datos' }

/**
 * El hueco de la seccion mientras viaja la peticion.
 *
 * Reproduce la anatomia real —tarjeta grande a la izquierda, dos filas de
 * tarjetas a la derecha— para que al llegar los premios nada se corra de lugar.
 * Ese salto es lo que el manual llama movimiento que anuncia en vez de
 * confirmar (§6).
 */
function EsqueletoDeGanadores() {
  return (
    <div aria-hidden className="grid gap-6 lg:grid-cols-[var(--container-card)_minmax(0,1fr)]">
      <div className="flex flex-col overflow-hidden rounded-caja bg-superficie">
        <Esqueleto className="aspect-[420/588] w-full bg-elevada lg:aspect-auto lg:min-h-0 lg:flex-1 lg:basis-0" />
        <div className="flex shrink-0 flex-col gap-3 p-5 md:p-6">
          <Esqueleto className="h-3 w-24 rounded-full bg-elevada" />
          <Esqueleto className="h-8 w-40 rounded-full bg-elevada" />
          <Esqueleto className="h-3 w-28 rounded-full bg-elevada" />
          <Esqueleto className="h-6 w-24 rounded-full bg-elevada" />
        </div>
      </div>

      <div className="grid min-w-0 grid-flow-col grid-rows-2 gap-4 overflow-hidden md:gap-6 [grid-auto-columns:13rem]">
        {Array.from({ length: COLUMNAS_FANTASMA * 2 }, (unused, indice) => (
          <div
            className="flex flex-col overflow-hidden rounded-caja bg-superficie"
            key={indice}
          >
            <Esqueleto className="min-h-0 w-full flex-1 basis-[13rem] bg-elevada" />
            <div className="flex shrink-0 flex-col gap-2 p-4">
              <Esqueleto className="h-5 w-28 rounded-full bg-elevada" />
              <Esqueleto className="h-3 w-20 rounded-full bg-elevada" />
              <Esqueleto className="h-6 w-20 rounded-full bg-elevada" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UltimosGanadores() {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })
  /** El premio cuya tarjeta se toco, o `null` con el modal cerrado. */
  const [seleccionado, setSeleccionado] = useState<Ganador | null>(null)

  /** Cuando se leyo por ultima vez, para no repetir antes de tiempo. */
  const ultimaLectura = useRef(0)

  /*
   * El mismo dato que `seleccionado`, pero en ref: el listener de visibilidad
   * se registra una sola vez y necesita leer el valor del momento en que se
   * dispara, no el que habia cuando se suscribio.
   */
  const hayModalAbierto = useRef(false)
  useEffect(() => {
    hayModalAbierto.current = seleccionado !== null
  }, [seleccionado])

  useEffect(() => {
    const controlador = new AbortController()

    /**
     * Trae los premios.
     *
     * `inicial` decide que pasa cuando sale mal, y es toda la diferencia entre
     * las dos lecturas. En la primera, quedarse sin premios significa que no
     * hay seccion. En un refresco no: ahi ya hay treinta tarjetas en pantalla,
     * y borrarlas porque una relectura fallo seria hacer desaparecer contenido
     * bueno delante de quien lo estaba mirando. Si el refresco falla, se queda
     * lo que habia.
     */
    const traer = async ({ inicial }: { inicial: boolean }) => {
      ultimaLectura.current = Date.now()

      try {
        const respuesta = await fetch('/datos/ultimos-ganadores', {
          signal: controlador.signal,
        })
        if (!respuesta.ok) throw new Error(`respondió ${respuesta.status}`)

        const ganadores = (await respuesta.json()) as Ganador[]

        if (ganadores.length > 0) {
          setEstado({ fase: 'listo', ganadores })
        } else if (inicial) {
          setEstado({ fase: 'sin-datos' })
        }
      } catch (error) {
        // El aborto es el desmontaje, no una falla: pasa siempre en desarrollo
        // por el doble montaje de StrictMode, y ahi el estado ya no importa.
        if (controlador.signal.aborted) return

        console.error('[ultimos-ganadores] no se pudieron traer los premios:', error)
        if (inicial) setEstado({ fase: 'sin-datos' })
      }
    }

    void traer({ inicial: true })

    /**
     * Vuelve a leer al volver a la pestania, si corresponde.
     *
     * Se elige `visibilitychange` y no un intervalo porque el momento en que la
     * lista importa es exactamente ese: quien vuelve despues de un rato espera
     * ver premios de ahora. Un intervalo, en cambio, reordenaria las tarjetas
     * mientras alguien las esta recorriendo —la pista es un carrusel, y
     * moverle el contenido debajo del dedo es peor que mostrarlo un minuto
     * viejo— y ademas seguiria pidiendo con la pestania de fondo, que es
     * trabajo que nadie ve.
     *
     * Tres condiciones, y las tres importan:
     */
    const alVolverALaPestania = () => {
      // Solo al volver, no al irse: el evento dispara en los dos sentidos.
      if (document.visibilityState !== 'visible') return

      // Con el modal abierto no se toca nada. La tarjeta que lo abrio quedo
      // guardada aparte y seguiria siendo valida, pero cambiar la lista debajo
      // mientras alguien decide a que plataforma ir no le suma nada.
      if (hayModalAbierto.current) return

      // La respuesta se cachea un minuto, asi que pedirla antes devuelve
      // exactamente lo mismo. Sin esto, alternar entre dos pestanias dispara
      // una peticion por cambio.
      if (Date.now() - ultimaLectura.current < MINIMO_ENTRE_LECTURAS_MS) return

      void traer({ inicial: false })
    }

    document.addEventListener('visibilitychange', alVolverALaPestania)

    return () => {
      controlador.abort()
      document.removeEventListener('visibilitychange', alVolverALaPestania)
    }
  }, [])

  /*
   * Sin premios no hay seccion. Las cuatro plataformas pueden estar sin pagar
   * nada en la ventana que mira la API —La Rioja contesta asi de forma
   * sostenida—, y en ese caso la portada tiene que quedar exactamente como
   * estaba: un titulo sobre un hueco vacio seria peor que no tener la seccion.
   */
  if (estado.fase === 'sin-datos') return null

  const [mayor, ...resto] = estado.fase === 'listo' ? estado.ganadores : []

  return (
    <section aria-labelledby="titulo-ganadores" className="pb-18 md:pb-32">
      <div className="contenedor">
        {/*
         * Titulo de seccion sin adorno: el aire de arriba ya establece la
         * jerarquia. Va un escalon por debajo de un H2 de articulo —esto es
         * una vitrina, no una nota— y por encima del rotulo de proveedores,
         * que es una firma de respaldo.
         */}
        <h2 className="font-display text-h3 text-tinta" id="titulo-ganadores">
          Últimos ganadores
        </h2>

        <div className="mt-6 md:mt-8">
          {estado.fase === 'cargando' ? (
            <EsqueletoDeGanadores />
          ) : (
            /*
             * `var(--container-card)` es el ancho de card del sistema, el mismo
             * que usa una nota en la grilla de tres columnas. La tarjeta grande
             * mide fijo eso y la pista se queda con el resto; el alto no se
             * escribe en ningun lado: la grilla estira la tarjeta grande hasta
             * igualar las dos filas de la derecha.
             */
            <div className="grid gap-6 lg:grid-cols-[var(--container-card)_minmax(0,1fr)]">
              {mayor ? (
                <TarjetaPremioMayor
                  imagenUrl={mayor.imagenVertical}
                  juego={mayor.juego}
                  jugador={mayor.jugador}
                  jurisdiccion={mayor.jurisdiccion}
                  onSeleccionar={() => setSeleccionado(mayor)}
                  premio={mayor.premio}
                />
              ) : null}

              <CarruselDeGanadores>
                {resto.map((ganador) => (
                  <li className="snap-start" key={ganador.id}>
                    <TarjetaGanador
                      imagenUrl={ganador.imagenCuadrada}
                      juego={ganador.juego}
                      jugador={ganador.jugador}
                      jurisdiccion={ganador.jurisdiccion}
                      onSeleccionar={() => setSeleccionado(ganador)}
                      premio={ganador.premio}
                    />
                  </li>
                ))}
              </CarruselDeGanadores>
            </div>
          )}
        </div>
      </div>

      {/*
       * Fuera del contenedor porque no participa de su ancho: se posiciona
       * contra la ventana. Montado solo cuando hay algo elegido —y no escondido
       * con CSS— para que el efecto que bloquea el scroll del fondo y devuelve
       * el foco corra al abrir y al cerrar, que es justo lo que hace montar y
       * desmontar.
       */}
      {seleccionado ? (
        <ModalDePlataformas
          motivo={{
            tipo: 'premio',
            jurisdiccion: seleccionado.jurisdiccion,
            premio: seleccionado.premio,
          }}
          onCerrar={() => setSeleccionado(null)}
        />
      ) : null}
    </section>
  )
}
