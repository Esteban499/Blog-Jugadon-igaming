'use client'

import { useEffect, useId, useRef } from 'react'

/*
 * Imports a archivo y no al barril de `atoms`: este componente es cliente, y en
 * App Router importar un barril desde el lado cliente arrastra al bundle todo
 * lo que ese barril toca. Es la regla que documenta `atoms/index.ts`.
 */
import { IconoCerrar } from '@/components/atoms/iconos/IconoCerrar'
import { IconoFlecha } from '@/components/atoms/iconos/IconoFlecha'
import { Tag } from '@/components/atoms/Tag'
import { dominioDe, JURISDICCIONES } from '@/utilidades/jurisdicciones'

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
 * Salen las cuatro y no solo la del premio: quien mira un premio de CABA puede
 * jugar en San Luis, y esconderle su plataforma para destacar la otra seria
 * ordenar la pantalla en contra de para que la abrio. La del premio va primera
 * en jerarquia visual —marcada y con el borde encendido—, no en orden: la lista
 * conserva siempre el mismo, asi no baila entre una tarjeta y otra.
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
      aria-describedby={idDescripcion}
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
        className="relative flex max-h-[90dvh] w-full flex-col border border-hairline bg-superficie focus:outline-none md:max-h-[80dvh] md:max-w-[520px] md:rounded-caja"
        ref={panel}
        tabIndex={-1}
      >
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-4 py-4 md:px-6">
          <div>
            <h2 className="font-util text-menu text-tinta uppercase" id={idTitulo}>
              {ENCABEZADOS[motivo.tipo].titulo}
            </h2>

            {/*
             * La bajada no es decorativa en ninguno de los tres casos. Con un
             * premio, lo nombra para que el modal no se lea como un menu
             * suelto: quien lo abrio venia mirando una tarjeta puntual y tiene
             * que reconocerla aca adentro. Con los botones de cuenta, avisa lo
             * que no se ve venir —que la cuenta no es del blog sino de cada
             * plataforma— antes de que alguien busque su usuario donde no esta.
             */}
            <p className="mt-2 text-legal text-parrafo" id={idDescripcion}>
              {motivo.tipo === 'premio' ? (
                <>
                  El premio de {motivo.premio} se pagó en Jugadon {motivo.jurisdiccion}. Elegí en
                  qué plataforma querés jugar.
                </>
              ) : motivo.tipo === 'ingresar' ? (
                'Tu cuenta es de la plataforma donde te registraste, no del blog. Elegí la jurisdicción para entrar.'
              ) : (
                'Cada jurisdicción tiene su propia plataforma y su propia cuenta. Elegí dónde querés registrarte.'
              )}
            </p>
          </div>

          <button
            aria-label="Cerrar"
            className="-mt-1 -mr-2 shrink-0 cursor-pointer p-2 text-parrafo transition-colors duration-150 ease-marca hover:text-tinta"
            onClick={onCerrar}
            type="button"
          >
            <IconoCerrar className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
          <ul className="flex flex-col gap-3">
            {JURISDICCIONES.map((jurisdiccion) => {
              const esLaDelPremio =
                motivo.tipo === 'premio' && jurisdiccion.nombre === motivo.jurisdiccion

              return (
                <li key={jurisdiccion.nombre}>
                  <a
                    className={`group flex items-center gap-4 rounded-caja border px-4 py-3 no-underline transition-colors duration-150 ease-marca hover:border-accion hover:bg-elevada ${
                      esLaDelPremio
                        ? 'border-accion-contorno bg-elevada'
                        : 'border-hairline bg-transparent'
                    }`}
                    href={jurisdiccion.sitio}
                    /*
                     * `sponsored` porque apunta a la plataforma que comercializa
                     * el juego, y `noopener` porque abre en otra pestania. Es el
                     * mismo `rel` con el que salen los enlaces de promociones.
                     */
                    rel="nofollow sponsored noopener"
                    target="_blank"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-card text-tinta">
                          Jugadon {jurisdiccion.nombre}
                        </span>

                        {/*
                         * Sin `href`: es una etiqueta que dice de donde salio el
                         * premio, no un filtro que lleve a ningun lado.
                         */}
                        {esLaDelPremio ? <Tag>Este premio</Tag> : null}
                      </span>

                      {/*
                       * El dominio a la vista: es un salto afuera del blog y a
                       * una plataforma de dinero real. Que se vea adonde va
                       * antes de tocar es lo minimo.
                       */}
                      <span className="mt-1 block truncate font-util text-meta text-apagado">
                        {dominioDe(jurisdiccion)}
                      </span>
                    </span>

                    <IconoFlecha className="size-5 shrink-0 text-parrafo transition-colors duration-150 ease-marca group-hover:text-accion" />
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
        <footer className="border-t border-hairline px-4 py-4 md:px-6">
          <p className="font-util text-legal text-apagado">
            Solo para mayores de 18 años. Jugá de forma responsable.
          </p>
        </footer>
      </div>
    </div>
  )
}
