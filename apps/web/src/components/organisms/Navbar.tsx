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
 */

const BASE_ENLACE = 'font-util text-menu uppercase transition-colors duration-150 ease-marca'

export function Navbar() {
  const [abierto, setAbierto] = useState(false)
  const [scrolleada, setScrolleada] = useState(false)
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
        <div className="contenedor flex h-[var(--alto-barra)] items-center gap-6">
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
            <LogoJugadon alto={34} ancho={120} prioridad />
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
    </header>
  )
}
