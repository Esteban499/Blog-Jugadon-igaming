'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

// Archivos directos y no barril: este componente es cliente. Ver `atoms/index.ts`.
import { ModalDePlataformas } from '@/components/organisms/ModalDePlataformas'

/**
 * El carrusel de banners de campania, arriba de todo en `/promociones`.
 *
 * No es una pista que se arrastra como los otros tres carruseles del sitio, y
 * la diferencia es de contenido: ahi hay una lista que se recorre —noticias,
 * premios— y aca hay dos piezas de arte que dicen lo mismo de dos maneras. No
 * se comparan entre si, se turnan. Por eso una tapa a la otra con un fundido en
 * lugar de correrse de costado, y por eso avanza sola.
 *
 * Todo el banner es un boton, y lo unico que hace es abrir el selector de
 * jurisdiccion: los dos bonos se reclaman creando la cuenta, y las cuentas son
 * de cada plataforma y no del blog. Es el mismo modal que los botones de la
 * navbar, con el mismo motivo (§`ModalDePlataformas`).
 *
 * Un solo boton para los dos banners, y no uno por diapositiva: con las dos
 * montadas a la vez —hace falta para el fundido— dos botones significan un
 * foco de teclado escondido detras de una imagen invisible. El boton es la
 * caja, y lo que cambia con la diapositiva es su etiqueta.
 */

export interface DiapositivaDeBanner {
  clave: string
  /** Lo que dice el arte, para el nombre accesible del boton. */
  etiqueta: string
  /** El `<picture>` ya resuelto en el servidor. */
  imagen: ReactNode
}

/**
 * Cuanto queda cada banner antes de pasar al siguiente.
 *
 * Seis segundos: alcanza para leer un titular de cinco palabras y un monto sin
 * apuro, y no tanto como para que quien mira crea que la pieza es fija.
 */
const ESPERA = 6000

export interface CarruselDeBannersProps {
  diapositivas: DiapositivaDeBanner[]
}

export function CarruselDeBanners({ diapositivas }: CarruselDeBannersProps) {
  const [actual, setActual] = useState(0)
  /**
   * Si el avance automatico esta frenado.
   *
   * Se frena con el mouse encima y con el foco adentro, que es lo que pide un
   * contenido que se mueve solo: sin eso, leer el segundo banner o tabular
   * hasta el boton es una carrera contra el reloj.
   */
  const [frenado, setFrenado] = useState(false)
  const [motivo, setMotivo] = useState<'registro' | null>(null)
  /*
   * Cada interaccion manual reinicia la cuenta. Sin esto, tocar un punto podia
   * dejar el banner elegido a la vista medio segundo antes de que el turno que
   * ya venia corriendo lo pasara de largo.
   *
   * Es estado y no una ref porque tiene que volver a disparar el efecto: una
   * ref cambia sin avisarle a React, asi que como dependencia no serviria.
   */
  const [reinicio, setReinicio] = useState(0)

  const total = diapositivas.length

  useEffect(() => {
    // Con una sola pieza no hay nada que turnar.
    if (total < 2 || frenado) return

    /*
     * Quien pidio menos movimiento no recibe un carrusel que se mueve solo. La
     * pieza queda fija en la primera y los puntos siguen estando para pasar a
     * mano, que es el mismo contenido sin la animacion.
     */
    const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (menosMovimiento.matches) return

    const turno = setInterval(() => setActual((i) => (i + 1) % total), ESPERA)
    return () => clearInterval(turno)
  }, [frenado, total, reinicio])

  const ir = (indice: number) => {
    setActual(indice)
    setReinicio((n) => n + 1)
  }

  const etiquetaActual = diapositivas[actual]?.etiqueta ?? ''

  return (
    <div className="contenedor">
      <div
        aria-roledescription="carrusel"
        className="relative mx-auto max-w-[1350px]"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFrenado(false)
        }}
        onFocus={() => setFrenado(true)}
        onMouseEnter={() => setFrenado(true)}
        onMouseLeave={() => setFrenado(false)}
      >
        {/*
         * La caja fija el alto antes de que baje ninguna imagen. Importa mas
         * que de costumbre porque el carrusel va arriba del `h1`: sin esto, al
         * cargar los banners la pagina entera salta hacia abajo.
         *
         * Las dos proporciones son las medidas exactas del arte —800x400 en
         * telefono, 1350x260 de `md` para arriba— y el corte coincide con el
         * `media` del `<picture>` que arma `BannersDePromociones`.
         */}
        <div className="relative aspect-[800/400] w-full overflow-hidden rounded-caja md:aspect-[1350/260]">
          {diapositivas.map((diapositiva, i) => (
            <div
              aria-hidden={i !== actual}
              className={`absolute inset-0 transition-opacity duration-700 ease-marca ${
                i === actual ? 'opacity-100' : 'opacity-0'
              }`}
              key={diapositiva.clave}
            >
              {diapositiva.imagen}
            </div>
          ))}

          {/*
           * El boton cubre el banner entero. Va despues de las imagenes para
           * quedar por encima sin necesidad de z-index, y es transparente: lo
           * que se ve es el arte.
           */}
          <button
            aria-label={`${etiquetaActual}. Crear cuenta`}
            className="absolute inset-0 size-full cursor-pointer rounded-caja focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accion"
            onClick={() => setMotivo('registro')}
            type="button"
          />
        </div>

        {total > 1 ? (
          /*
           * Puntos y no flechas: con dos piezas, "anterior" y "siguiente"
           * llevan las dos al mismo lado. El punto ademas dice cuantas hay y en
           * cual se esta, que es lo unico que se necesita saber aca.
           */
          <div className="mt-4 flex items-center justify-center gap-2">
            {diapositivas.map((diapositiva, i) => (
              <button
                aria-current={i === actual ? 'true' : undefined}
                aria-label={diapositiva.etiqueta}
                className={`h-2 cursor-pointer rounded-full transition-all duration-250 ease-marca focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accion ${
                  i === actual ? 'w-6 bg-accion' : 'w-2 bg-contorno hover:bg-parrafo'
                }`}
                key={diapositiva.clave}
                onClick={() => ir(i)}
                type="button"
              />
            ))}
          </div>
        ) : null}
      </div>

      {/*
       * Montado solo cuando hay un motivo —y no escondido con CSS— igual que en
       * la navbar: asi el modal entra con el foco limpio cada vez.
       */}
      {motivo ? (
        <ModalDePlataformas motivo={{ tipo: motivo }} onCerrar={() => setMotivo(null)} />
      ) : null}
    </div>
  )
}
