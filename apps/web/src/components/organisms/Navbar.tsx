'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/*
 * Imports a archivo y no al barril de `atoms`: este componente es cliente, y
 * en App Router importar un barril desde el lado cliente arrastra al bundle
 * todo lo que ese barril toca. Es la regla que documenta `atoms/index.ts`.
 */
import { IconoCerrar } from '@/components/atoms/iconos/IconoCerrar'
import { IconoFlecha } from '@/components/atoms/iconos/IconoFlecha'
import { IconoMenu } from '@/components/atoms/iconos/IconoMenu'
import { LogoJugadon } from '@/components/atoms/marca/LogoJugadon'
import { Boton } from '@/components/atoms/Boton'

import { ModalDePlataformas, type MotivoDePlataformas } from './ModalDePlataformas'
import { SECCIONES } from './secciones'

/*
 * Navegacion (§5.8).
 *
 * Barra de 72px —el alto sale de `--alto-barra`, que es tambien el que usa el
 * hero para calcular el suyo—, transparente al tope y con el fondo del sitio
 * al 85% mas desenfoque al scrollear. El hairline inferior aparece junto con
 * el fondo, no antes: al tope no hay nada que separar.
 *
 * Los items van en la utilitaria en mayusculas y el activo pasa a blanco.
 * **Sin subrayado ni indicador de color**: el cambio de peso visual alcanza, y
 * el subrayado naranja que habia aca era un elemento de acento gastado en
 * senalar donde ya estas parado.
 *
 * A la derecha de las secciones va el bloque de cuenta: ingresar en terciaria
 * y crear cuenta en primaria. Es la unica primaria del chrome y por eso no
 * compite con nada: el resto de la barra es texto. Ninguno de los dos navega
 * dentro del sitio —el blog no tiene cuentas—, abren el selector de
 * plataforma, que es donde las cuentas realmente viven. Ver
 * `ModalDePlataformas`.
 */

const BASE_ENLACE = 'font-util text-menu uppercase transition-colors duration-150 ease-marca'

export function Navbar() {
  const [abierto, setAbierto] = useState(false)
  const [scrolleada, setScrolleada] = useState(false)
  /*
   * Que boton de cuenta se toco, o `null` si ninguno. Guarda el motivo entero
   * y no un booleano porque es lo que el modal necesita para titularse.
   */
  const [acceso, setAcceso] = useState<MotivoDePlataformas | null>(null)
  const ruta = usePathname()

  const secciones = SECCIONES.map((seccion) => ({
    ...seccion,
    /*
     * Una nota de `/blog/algo` deja activa la seccion `/blog`. La portada es
     * el caso aparte: como prefijo, `/` cubriria todo el sitio y quedaria
     * siempre activa, asi que solo coincide consigo misma.
     */
    activa:
      seccion.href !== null &&
      (seccion.href === '/'
        ? ruta === '/'
        : ruta === seccion.href || ruta.startsWith(`${seccion.href}/`)),
  }))

  /*
   * El bloque de cuenta se dibuja dos veces —telefono y escritorio— con la
   * misma accion detras, asi que la accion se escribe una sola vez. Cierra el
   * panel ademas de abrir el modal: en telefono los botones estan en la barra,
   * que sigue a la vista con el menu abierto, y sin esto el menu quedaria
   * debajo del dialogo y reaparecerian las secciones al cerrarlo.
   */
  const abrirAcceso = (motivo: MotivoDePlataformas) => () => {
    setAbierto(false)
    setAcceso(motivo)
  }

  // El menu se cierra al cambiar de pagina: si no, queda abierto tapando la
  // pantalla a la que se acaba de navegar.
  useEffect(() => setAbierto(false), [ruta])

  useEffect(() => {
    const alScrollear = () => setScrolleada(window.scrollY > 8)
    alScrollear()
    window.addEventListener('scroll', alScrollear, { passive: true })
    return () => window.removeEventListener('scroll', alScrollear)
  }, [])

  useEffect(() => {
    if (!abierto) return

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false)
    }

    /*
     * El panel es `lg:hidden`, asi que al agrandar la ventana desaparece de la
     * vista pero el estado seguiria abierto y el scroll del cuerpo, bloqueado.
     */
    const escritorio = window.matchMedia('(min-width: 64rem)')
    const alCambiarAncho = () => {
      if (escritorio.matches) setAbierto(false)
    }

    const desbordeAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', alTeclear)
    escritorio.addEventListener('change', alCambiarAncho)

    return () => {
      document.body.style.overflow = desbordeAnterior
      window.removeEventListener('keydown', alTeclear)
      escritorio.removeEventListener('change', alCambiarAncho)
    }
  }, [abierto])

  /*
   * El `sticky` va en el `header`: un elemento pegajoso solo se desplaza
   * dentro de su bloque contenedor, y sobre el unico hijo en flujo tendria
   * cero recorrido.
   *
   * `backdrop-filter` no puede subir hasta aca: convierte al elemento en
   * bloque contenedor de sus descendientes `fixed`, y el panel del menu de
   * telefono es uno. Por eso el desenfoque vive en el div de la barra.
   */
  const fondoDeBarra =
    scrolleada || abierto
      ? 'border-hairline bg-fondo/85 backdrop-blur-md'
      : 'border-transparent bg-transparent'

  return (
    <header className="sticky top-0 z-50">
      <div className={`border-b transition-colors duration-150 ease-marca ${fondoDeBarra}`}>
        {/* `gap-2` en telefono: con 24px entre cuatro elementos, el logo y los
            dos botones de cuenta no entran en los 328px utiles de una pantalla
            de 360. Desde `lg` sobra lugar y vuelve el ritmo del sistema. */}
        <div className="contenedor flex h-[var(--alto-barra)] items-center gap-2 lg:gap-6">
          <button
            aria-controls="menu-secciones"
            aria-expanded={abierto}
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            className="-ml-2 flex shrink-0 cursor-pointer items-center justify-center p-2 text-tinta lg:hidden"
            onClick={() => setAbierto((estaAbierto) => !estaAbierto)}
            type="button"
          >
            {abierto ? <IconoCerrar /> : <IconoMenu />}
          </button>

          <Link aria-label="Jugadon — Inicio" className="shrink-0" href="/">
            {/* 80px en telefono contra los 120 de siempre: es lo que hay que
                ceder para que los botones de cuenta entren en la barra sin
                bajar de los 44px de area de toque. La caja recorta el mismo
                encuadre en los dos tamanos, asi que no hay version aparte. */}
            <LogoJugadon
              alto={34}
              ancho={120}
              clasesDeCaja="h-[23px] w-[80px] lg:h-[34px] lg:w-[120px]"
              prioridad
            />
          </Link>

          {/* La marca de un lado y la navegacion del otro: la barra tiene dos
              anclas y se lee de una. */}
          <nav aria-label="Secciones" className="ml-auto hidden items-center gap-8 lg:flex">
            {secciones.map((seccion) =>
              seccion.href === null ? (
                // Sin pagina todavia: se muestra, pero no finge ser un enlace.
                <span
                  aria-disabled
                  className={`${BASE_ENLACE} cursor-not-allowed text-apagado`}
                  key={seccion.etiqueta}
                  title="Sección en preparación"
                >
                  {seccion.etiqueta}
                </span>
              ) : (
                <Link
                  aria-current={seccion.activa ? 'page' : undefined}
                  className={`${BASE_ENLACE} ${
                    seccion.activa ? 'text-tinta' : 'text-parrafo hover:text-tinta'
                  }`}
                  href={seccion.href}
                  key={seccion.etiqueta}
                >
                  {seccion.etiqueta}
                </Link>
              ),
            )}
          </nav>

          {/*
           * El bloque de cuenta, en dos versiones. No es una duplicacion por
           * comodidad: en telefono y en escritorio cambian la etiqueta, el
           * cuerpo de letra y la forma del secundario, o sea todo menos la
           * accion —que por eso se escribe una vez, arriba—.
           *
           * La cuenta de la barra de 360px, con 328px utiles: boton de menu 32,
           * logo 80, "Ingresar" 60, "Crear cuenta" 118 y tres huecos de 8 dan
           * 314. Los 14 que sobran son todo el margen que hay, y es la razon de
           * cada una de las decisiones de abajo.
           *
           * Version telefono. "Ingresar" y no "Iniciar sesion" porque la
           * etiqueta larga se lleva 90px de los 328, y va sin pildora porque el
           * contorno de la terciaria es la parte de ella que menos informa: si
           * hay que elegir entre el borde y la palabra, se va el borde. Sigue
           * midiendo 44px de alto, que es lo que se toca.
           */}
          <div className="ml-auto flex shrink-0 items-center gap-2 lg:hidden">
            <button
              className="flex h-11 cursor-pointer items-center px-1 font-util text-tag text-parrafo uppercase transition-colors duration-150 ease-marca hover:text-tinta"
              onClick={abrirAcceso({ tipo: 'ingresar' })}
              type="button"
            >
              Ingresar
            </button>

            <Boton
              onClick={abrirAcceso({ tipo: 'registro' })}
              tamano="compacto"
              variante="primaria"
            >
              Crear cuenta
            </Boton>
          </div>

          {/*
           * Version escritorio. Sin `ml-auto` propio: el que empuja a la derecha
           * es el `nav`, y dos margenes automaticos se reparten el hueco entre
           * si —dejarian a las secciones flotando en el medio de la barra—.
           */}
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Boton onClick={abrirAcceso({ tipo: 'ingresar' })} variante="terciaria">
              Iniciar sesión
            </Boton>

            <Boton onClick={abrirAcceso({ tipo: 'registro' })} variante="primaria">
              Crear cuenta
            </Boton>
          </div>
        </div>
      </div>

      {abierto ? (
        /*
         * Panel a pantalla completa por debajo de la barra. Sin cajas ni
         * tarjetas: cada seccion es una fila separada por un hairline. Va en
         * la utilitaria y no en la display porque cuatro titulos en la voz de
         * la marca serian cuatro apariciones en una pantalla, y el limite son
         * tres (§3.3).
         */
        <div
          className="fixed inset-x-0 top-[var(--alto-barra)] bottom-0 z-40 overflow-y-auto bg-fondo/95 backdrop-blur-md lg:hidden"
          id="menu-secciones"
        >
          <nav aria-label="Secciones" className="contenedor py-8">
            {/* Sin botones de cuenta aca: viven en la barra, que sigue a la
                vista con el panel abierto. Repetidos serian el mismo par de
                acciones dos veces en la misma pantalla. */}
            <ul>
              {secciones.map((seccion) => {
                const claseFila =
                  'flex items-center justify-between gap-4 py-5 font-util text-h3 uppercase'

                return (
                  <li className="border-b border-hairline" key={seccion.etiqueta}>
                    {seccion.href === null ? (
                      <span aria-disabled className={`${claseFila} text-apagado`}>
                        {seccion.etiqueta}
                        <span className="font-util text-tag uppercase">Pronto</span>
                      </span>
                    ) : (
                      <Link
                        aria-current={seccion.activa ? 'page' : undefined}
                        className={`${claseFila} transition-colors duration-150 ease-marca ${
                          seccion.activa ? 'text-tinta' : 'text-parrafo hover:text-tinta'
                        }`}
                        href={seccion.href}
                        onClick={() => setAbierto(false)}
                      >
                        {seccion.etiqueta}
                        <IconoFlecha className="size-5 shrink-0" />
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>

            <p className="mt-8 font-util text-legal text-apagado uppercase">
              +18 · Jugá responsablemente
            </p>
          </nav>
        </div>
      ) : null}

      {/*
       * Montado solo cuando hay un motivo —y no escondido con CSS— para que el
       * efecto del modal, que bloquea el scroll del fondo y devuelve el foco al
       * boton que lo abrio, corra al abrir y al cerrar. Es lo mismo que hace
       * `UltimosGanadores`, el otro lugar desde donde se abre.
       */}
      {acceso ? <ModalDePlataformas motivo={acceso} onCerrar={() => setAcceso(null)} /> : null}
    </header>
  )
}
