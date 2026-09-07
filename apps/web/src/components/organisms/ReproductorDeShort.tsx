'use client'

import { useEffect, useId, useRef } from 'react'

/*
 * Imports a archivo y no al barril de `atoms`: este componente es cliente. Ver
 * `atoms/index.ts`.
 */
import { IconoCerrar } from '@/components/atoms/iconos/IconoCerrar'
import { IconoFlecha } from '@/components/atoms/iconos/IconoFlecha'
import type { Short } from '@/utilidades/shorts'

/**
 * El short elegido, a pantalla, sobre el resto de la portada.
 *
 * Es el unico lugar del sitio donde se monta un `<iframe>` de YouTube, y se
 * monta de a uno: la pista dibuja fachadas —imagen y boton— y el reproductor
 * real aparece recien cuando alguien elige un short. Ver `TarjetaShort`.
 *
 * En modal y no dentro de la tarjeta porque un short es vertical: reproducido
 * en su lugar de la pista mediria 208px de ancho, que es menos de lo que mide
 * en un telefono. Aca ocupa el alto de la ventana y sale en su proporcion.
 *
 * El dominio es `youtube-nocookie.com`, que es el mismo reproductor sin las
 * cookies de seguimiento que YouTube deja antes de que nadie le de play. En un
 * sitio de juego online eso no es un detalle de privacidad y ya: es un tercero
 * menos que perfila a alguien que todavia no decidio nada.
 *
 * La maqueta sigue a `ModalDePlataformas`, que es el dialogo del sistema: velo
 * que tambien cierra, `Escape`, scroll del fondo bloqueado y foco adentro. Lo
 * unico que agrega son las flechas: la pista tiene quince shorts y quien abrio
 * uno los quiere ver en fila, no cerrar y volver a apuntar a la tarjeta de al
 * lado quince veces.
 */

export interface ReproductorDeShortProps {
  short: Short
  onCerrar: () => void
  /**
   * Ir al short anterior o al siguiente. Vienen en `null` en las dos puntas de
   * la pista, y ahi la flecha se apaga en lugar de desaparecer: una fila de
   * controles que cambia de ancho segun donde este parado se lee como un error.
   */
  onAnterior: (() => void) | null
  onSiguiente: (() => void) | null
  /** Que numero de short es y cuantos hay, para el rotulo de posicion. */
  posicion: { actual: number; total: number }
}

export function ReproductorDeShort({
  onAnterior,
  onCerrar,
  onSiguiente,
  posicion,
  short,
}: ReproductorDeShortProps) {
  const panel = useRef<HTMLDivElement>(null)
  const idTitulo = useId()

  /*
   * Los tres controles en ref: el listener de teclado se registra una sola vez
   * —no depende del short— y necesita leer el valor del momento en que se
   * dispara, no el que habia cuando se suscribio. Sin esto, las flechas del
   * teclado se quedarian pegadas al primer short que se abrio.
   */
  const controles = useRef({ onAnterior, onCerrar, onSiguiente })
  useEffect(() => {
    controles.current = { onAnterior, onCerrar, onSiguiente }
  }, [onAnterior, onCerrar, onSiguiente])

  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') controles.current.onCerrar()
      if (evento.key === 'ArrowRight') controles.current.onSiguiente?.()
      if (evento.key === 'ArrowLeft') controles.current.onAnterior?.()
    }

    /*
     * El modal tapa la pantalla: sin esto el fondo sigue scrolleando debajo y,
     * en telefono, el gesto se lo lleva la pagina en lugar del modal.
     */
    const desbordeAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', alTeclear)

    /*
     * De donde se vino, para volver ahi al cerrar. Sin esto el foco cae al
     * principio del documento y quien navega con teclado tiene que recorrer la
     * pagina entera para volver a la tarjeta que acaba de tocar.
     */
    const disparador = document.activeElement

    // El foco entra al panel para que Escape y el tabulado empiecen adentro.
    panel.current?.focus()

    return () => {
      document.body.style.overflow = desbordeAnterior
      window.removeEventListener('keydown', alTeclear)
      if (disparador instanceof HTMLElement) disparador.focus()
    }
  }, [])

  /*
   * Flecha en boton terciario circular de 44px: el minimo que se puede tocar
   * con el dedo sin errarle. Es la misma clase que usan los dos carruseles de
   * la portada.
   */
  const claseFlecha =
    'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-contorno text-parrafo transition-colors duration-150 ease-marca hover:border-accion hover:text-tinta disabled:pointer-events-none disabled:opacity-40'

  return (
    <div
      aria-labelledby={idTitulo}
      aria-modal
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      {/* El velo tambien cierra. Es un boton y no un div con `onClick` para que
          exista para el teclado y para el lector de pantalla. */}
      <button
        aria-label="Cerrar"
        className="absolute inset-0 cursor-default bg-fondo/85 backdrop-blur-md"
        onClick={onCerrar}
        tabIndex={-1}
        type="button"
      />

      {/*
       * `focus:outline-none` solo sobre este contenedor, y por la misma razon
       * que en `ModalDePlataformas`: no es un control, es el punto de entrada al
       * que se manda el foco al abrir. Los controles reales conservan el suyo.
       *
       * El ancho se fija ACA y no en el reproductor, aunque sea el reproductor
       * quien lo determina. Puesto abajo, el panel quedaba con ancho automatico
       * y por lo tanto tan ancho como su hijo mas ancho, que es el titulo: un
       * short con nombre largo estiraba la columna mucho mas alla del video y
       * dejaba el titulo y los controles flotando a los costados. Fijado aca, el
       * video, el encabezado y la fila de flechas miden todos lo mismo y el
       * bloque se lee como una sola pieza.
       *
       * De donde sale el numero: lo que se fija es el ANCHO y el alto sale de la
       * proporcion, que suena al reves de lo que pide un video vertical. Esa fue
       * la primera version —`aspect-[9/16]` con un `max-height`— y no funciona:
       * el unico contenido del reproductor es un iframe posicionado en absoluto,
       * que no cuenta para el tamano, asi que su ancho intrinseco es cero, y con
       * `aspect-ratio` sobre un ancho cero el alto tambien da cero.
       *
       * Con el ancho definido el problema se da vuelta y las dos pantallas se
       * resuelven de una, porque el `min` toma la primera que aprieta:
       *
       * - el alto de la ventana menos el espacio del titulo y los controles,
       *   convertido a ancho por la proporcion. Es el limite en escritorio,
       *   donde sobra ancho y falta alto.
       * - 31.5rem, para que en un monitor alto no crezca hasta parecer un
       *   cartel: un short en 504x896 ya es mas grande que en un telefono.
       * - el 100%, que es el limite en telefono, donde sobra alto y falta ancho.
       *
       * `dvh` y no `vh` porque en el navegador de un telefono la barra de
       * direcciones se esconde al scrollear: con `vh` el reproductor queda
       * calculado contra un alto que en ese momento no existe.
       */}
      <div
        className="relative flex max-h-full w-[min(calc((100dvh-11rem)*9/16),31.5rem,100%)] flex-col gap-4 focus:outline-none"
        ref={panel}
        tabIndex={-1}
      >
        <div className="flex w-full items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="line-clamp-2 font-display text-card text-tinta text-pretty" id={idTitulo}>
              {short.titulo}
            </h2>

            {/*
             * El rotulo de posicion es la unica senal de cuanto queda: el modal
             * tapa la pista, asi que adentro no hay forma de ver que este es el
             * tercero de quince.
             */}
            <p className="mt-1 font-util text-meta text-apagado uppercase">
              {posicion.actual} de {posicion.total}
            </p>
          </div>

          <button
            aria-label="Cerrar"
            className="-mt-1 -mr-1 shrink-0 cursor-pointer p-2 text-parrafo transition-colors duration-150 ease-marca hover:text-tinta"
            onClick={onCerrar}
            type="button"
          >
            <IconoCerrar className="size-5" />
          </button>
        </div>

        {/*
         * El ancho lo pone el panel; aca solo la proporcion. Ver el comentario
         * de arriba para por que el orden es ese y no al reves.
         *
         * La `key` es el id del video y no un detalle: sin ella React reusa el
         * mismo `<iframe>` al pasar de un short al siguiente, y cambiarle el
         * `src` a un iframe montado apila una entrada en el historial del
         * navegador por cada salto. Con quince shorts eso son quince toques de
         * "atras" para salir de la portada. Remontandolo, no queda ninguna.
         */}
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-caja bg-superficie">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
            key={short.id}
            /*
             * Sin esto el reproductor puede cargar y contestar "Error 153 —
             * error de configuracion del reproductor". No es un problema de
             * permisos ni de red: el iframe carga bien, y el que se planta es
             * YouTube, que desde fines de 2025 exige el header `Referer` para
             * saber que sitio lo esta embebiendo y se niega a armar el
             * reproductor si no le llega.
             *
             * El valor es el mismo que el navegador usa por defecto, asi que en
             * el caso normal no cambia nada. Esta escrito igual porque el
             * defecto no es una garantia: alcanza con que alguien agregue un
             * `Referrer-Policy: same-origin` en la capa de headers —una linea
             * que en cualquier repaso de seguridad parece obviamente correcta—
             * para que este reproductor deje de andar sin que nadie relacione
             * las dos cosas. Declarado sobre el iframe, la politica de la
             * pagina no lo puede romper.
             */
            referrerPolicy="strict-origin-when-cross-origin"
            /*
             * `autoplay` es legitimo aca y no una molestia: no arranca al cargar
             * la pagina sino despues de que alguien toco una tarjeta para ver
             * justamente este video.
             */
            src={`https://www.youtube-nocookie.com/embed/${short.id}?autoplay=1&rel=0&playsinline=1`}
            title={short.titulo}
          />
        </div>

        <div className="flex w-full items-center gap-3">
          <button
            aria-label="Ver el short anterior"
            className={claseFlecha}
            disabled={!onAnterior}
            onClick={() => onAnterior?.()}
            type="button"
          >
            <IconoFlecha sentido="izquierda" />
          </button>

          <button
            aria-label="Ver el short siguiente"
            className={claseFlecha}
            disabled={!onSiguiente}
            onClick={() => onSiguiente?.()}
            type="button"
          >
            <IconoFlecha sentido="derecha" />
          </button>

          {/*
           * Enlace y no boton secundario: es una salida del sitio, y como
           * cualquier salto afuera va con `noopener`. Sin `sponsored` —a
           * diferencia de los enlaces a plataformas— porque el canal es del
           * mismo anunciante, no de un tercero que paga por estar ahi.
           */}
          <a
            className="ml-auto font-util text-meta text-enlace uppercase transition-colors duration-150 ease-marca hover:text-accion"
            href={`https://www.youtube.com/shorts/${short.id}`}
            rel="noopener"
            target="_blank"
          >
            Ver en YouTube
          </a>
        </div>
      </div>
    </div>
  )
}
