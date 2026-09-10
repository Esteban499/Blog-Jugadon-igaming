'use client'

import { useEffect, useId, useRef } from 'react'

/*
 * Imports a archivo y no al barril de `atoms`: este componente es cliente, y en
 * App Router importar un barril desde el lado cliente arrastra al bundle todo
 * lo que ese barril toca. Es la regla que documenta `atoms/index.ts`.
 */
import { IconoCerrar } from '@/components/atoms/iconos/IconoCerrar'
import { IconoFlecha } from '@/components/atoms/iconos/IconoFlecha'
import { dominioDe, PLATAFORMAS } from '@/utilidades/jurisdicciones'

/**
 * El selector de plataforma: la unica pantalla que manda afuera del blog.
 *
 * Nacio para la tarjeta de ganador, que prometia algo que no cumplia: un premio
 * con monto, juego y provincia se lee como algo en lo que se puede participar,
 * y tocarlo no hacia nada. Hoy atiende ademas a los dos botones de cuenta de la
 * navbar, y es el mismo componente a proposito: **el blog no tiene cuentas**.
 * Iniciar sesion y crear cuenta pasan las dos por elegir jurisdiccion, porque
 * las cuentas son de cada plataforma y no del sitio. Un modal por motivo serian
 * tres copias de la misma lista con tres titulos distintos.
 *
 * **No lleva a ningun juego puntual.** Seria lo esperable, pero la ruta de
 * lanzamiento (`/launch/<id>`) pide sesion iniciada, asi que mandaria a quien
 * toca a un login sin contexto. El destino es la portada de la plataforma, que
 * es adonde hay que llegar igual.
 *
 * Salen las cinco y no solo la del premio: quien mira un premio de CABA puede
 * jugar en San Luis, y esconderle su plataforma para destacar la otra seria
 * ordenar la pantalla en contra de para que la abrio. La del premio va primera
 * en jerarquia visual —es la unica pintada de azul marca lleno—, no en orden:
 * la lista conserva siempre el mismo, asi no baila entre una tarjeta y otra.
 *
 * Cinco y no cuatro: la lista sale de `PLATAFORMAS` y no de `JURISDICCIONES`.
 * Santa Fe no publica ganadores, asi que no aporta premios a la portada, pero
 * se juega igual y hay que poder elegirla. Este modal pregunta adonde ir, no de
 * donde salio el dato: la lista correcta es la de destinos.
 *
 * **Cada fila dice una sola cosa: "Jugadon <jurisdiccion>".** Antes cargaba
 * ademas el dominio y, en una de las cuatro, un tag: cuatro filas de dos lineas
 * con una distinta obligan a leer una lista donde solo hay que elegir. El
 * dominio no se perdio, se movio al nombre accesible del enlace —sigue estando
 * para quien navega a ciegas, que es quien mas lo necesitaba—, y lo que el tag
 * decia lo dice ahora el relleno azul y la bajada del encabezado.
 *
 * El azul de marca es el material de la lista y no un acento: encabezado
 * velado, filas veladas, y el hover las lleva al azul lleno. El naranja de
 * accion no aparece —el manual da un solo elemento de accion por pantalla y
 * aca las acciones son cuatro y equivalentes—.
 *
 * La maqueta sigue al `PanelDeFiltros`, que es el otro dialogo del sitio: velo
 * que tambien cierra, `Escape`, scroll del fondo bloqueado y foco adentro.
 */

/**
 * Por que se abrio el modal. Es lo unico que cambia entre un caso y otro: el
 * encabezado y si hay una jurisdiccion marcada. La lista y los destinos son
 * siempre los mismos.
 */
export type MotivoDePlataformas =
  /** Se toco una tarjeta de ganador. */
  | {
      tipo: 'premio'
      /** El premio que se toco, ya escrito en pesos. Es el contexto del titulo. */
      premio: string
      /**
       * La jurisdiccion del premio, para marcarla en la lista. Si no coincide
       * con ninguna —una provincia nueva en la API— no se marca ninguna y el
       * modal sigue sirviendo igual.
       */
      jurisdiccion: string
    }
  /** Boton "Iniciar sesion" de la navbar. */
  | { tipo: 'ingresar' }
  /** Boton "Crear cuenta" de la navbar. */
  | { tipo: 'registro' }

/** El encabezado que le corresponde a cada motivo. */
const ENCABEZADOS: Record<MotivoDePlataformas['tipo'], { titulo: string }> = {
  premio: { titulo: 'Dónde jugar' },
  ingresar: { titulo: 'Iniciar sesión' },
  registro: { titulo: 'Crear cuenta' },
}

export interface ModalDePlataformasProps {
  motivo: MotivoDePlataformas
  onCerrar: () => void
}

export function ModalDePlataformas({ motivo, onCerrar }: ModalDePlataformasProps) {
  const panel = useRef<HTMLDivElement>(null)
  const idTitulo = useId()
  const idDescripcion = useId()

  /*
   * Solo el premio lleva bajada, y por eso se calcula aca: `aria-describedby`
   * apuntando a un id que no existe en el DOM no describe nada, y algunos
   * lectores anuncian el hueco. Sin bajada, el dialogo se describe solo con su
   * titulo.
   */
  const hayBajada = motivo.tipo === 'premio'

  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
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
     * pagina entera para volver a la tarjeta que acaba de tocar —y la pista
     * tiene veintinueve—.
     */
    const disparador = document.activeElement

    // El foco entra al panel para que Escape y el tabulado empiecen adentro.
    panel.current?.focus()

    return () => {
      document.body.style.overflow = desbordeAnterior
      window.removeEventListener('keydown', alTeclear)
      if (disparador instanceof HTMLElement) disparador.focus()
    }
  }, [onCerrar])

  return (
    <div
      aria-describedby={hayBajada ? idDescripcion : undefined}
      aria-labelledby={idTitulo}
      aria-modal
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
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
       * `focus:outline-none` solo sobre este contenedor, y no es una excepcion a
       * la regla de foco visible del sistema (§11): esto no es un control, es el
       * punto de entrada al que se manda el foco al abrir para que `Escape` y el
       * tabulado empiecen adentro. Sin esto el anillo naranja rodea el modal
       * entero, que no señala nada que se pueda accionar. Los controles reales
       * de adentro —cerrar y las cuatro plataformas— conservan el suyo, que es
       * lo que el teclado necesita ver.
       */}
      <div
        className="relative flex max-h-[90dvh] w-full flex-col border border-azul-contorno bg-superficie focus:outline-none md:max-h-[80dvh] md:max-w-[520px] md:rounded-caja"
        ref={panel}
        tabIndex={-1}
      >
        {/*
         * Centrado de verdad: el boton de cerrar sale del flujo y el mismo
         * hueco queda reservado a los dos lados, asi el titulo cae en el eje
         * del panel y no corrido a la izquierda. El hueco es el ancho que ocupa
         * el boton (20px de icono + 16px de area tactil) mas su separacion del
         * borde, y por eso crece con el `px` del panel en escritorio.
         */}
        <header className="relative border-b border-azul-contorno bg-azul-velo px-12 py-5 text-center md:px-14">
          <h2 className="font-util text-menu text-tinta uppercase" id={idTitulo}>
            {ENCABEZADOS[motivo.tipo].titulo}
          </h2>

          {/*
           * La bajada quedo solo para el premio, que es el unico caso donde
           * dice algo que la pantalla no muestra: nombra la tarjeta que se
           * acaba de tocar, para que el modal no se lea como un menu suelto.
           *
           * En los dos botones de cuenta se fue. Explicaba que la cuenta es de
           * cada plataforma y no del blog, pero eso ya lo dice la lista misma:
           * bajo el titulo "Crear cuenta" hay cuatro plataformas y ningun campo
           * de registro. Dos renglones para adelantar lo que se ve un centimetro
           * mas abajo son dos renglones que se leen antes de poder elegir.
           */}
          {hayBajada ? (
            <p className="mt-2 text-legal text-parrafo" id={idDescripcion}>
              El premio de {motivo.premio} se pagó en Jugadon {motivo.jurisdiccion}.
            </p>
          ) : null}

          <button
            aria-label="Cerrar"
            /*
             * `top-2` y no centrado a mano: deja el icono a la altura de la
             * linea del titulo, que es donde el ojo lo busca. Centrarlo en el
             * alto del header lo bajaria cuando aparece la bajada del premio y
             * quedaria flotando al lado de un renglon que no es el suyo.
             */
            className="absolute top-2 right-2 cursor-pointer p-2 text-parrafo transition-colors duration-150 ease-marca hover:text-tinta md:right-4"
            onClick={onCerrar}
            type="button"
          >
            <IconoCerrar className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
          <ul className="flex flex-col gap-2">
            {PLATAFORMAS.map((plataforma) => {
              const esLaDelPremio =
                motivo.tipo === 'premio' && plataforma.nombre === motivo.jurisdiccion

              return (
                <li key={plataforma.nombre}>
                  <a
                    /*
                     * El dominio vive aca y no en pantalla. Sigue siendo un
                     * salto afuera del blog y a una plataforma de dinero real,
                     * asi que decir adonde va no es opcional; lo que cambio es
                     * que dejo de ser un renglon gris debajo de cada nombre
                     * —cuatro dominios que solo se diferencian en una palabra—
                     * para ser el nombre accesible del enlace.
                     */
                    aria-label={`Jugadon ${plataforma.nombre}. Abre ${dominioDe(plataforma)} en una pestaña nueva.`}
                    className={`group flex items-center justify-between gap-4 rounded-caja border px-4 py-3.5 no-underline transition-colors duration-150 ease-marca ${
                      esLaDelPremio
                        ? 'border-marca bg-marca hover:border-marca-hover hover:bg-marca-hover'
                        : 'border-azul-contorno bg-azul-velo hover:border-marca hover:bg-marca'
                    }`}
                    href={plataforma.sitio}
                    /*
                     * `sponsored` porque apunta a la plataforma que comercializa
                     * el juego, y `noopener` porque abre en otra pestania. Es el
                     * mismo `rel` con el que salen los enlaces de promociones.
                     */
                    rel="nofollow sponsored noopener"
                    target="_blank"
                  >
                    <span className="min-w-0 truncate font-display text-card text-tinta">
                      Jugadon {plataforma.nombre}
                    </span>

                    <IconoFlecha
                      className={`size-5 shrink-0 transition-colors duration-150 ease-marca group-hover:text-tinta ${
                        esLaDelPremio ? 'text-tinta' : 'text-parrafo'
                      }`}
                    />
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        {/*
         * La misma linea con la que cierra cualquier pantalla del sitio que
         * mande a una plataforma. No es una formula: este modal es,
         * literalmente, el paso previo a ir a jugar con dinero real.
         */}
        <footer className="border-t border-azul-contorno px-4 py-4 md:px-6">
          <p className="font-util text-legal text-apagado">
            Solo para mayores de 18 años. Jugá de forma responsable.
          </p>
        </footer>
      </div>
    </div>
  )
}
