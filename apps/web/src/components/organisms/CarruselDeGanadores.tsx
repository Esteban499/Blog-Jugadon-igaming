'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

// Archivo directo y no barril: este componente es cliente. Ver `atoms/index.ts`.
import { IconoFlecha } from '@/components/atoms/iconos/IconoFlecha'

/**
 * La pista de premios que acompana al premio mayor: dos filas por N columnas.
 *
 * El ancho de columna —10.4rem, el 80% de los 13rem originales— no es un
 * numero suelto: es lo que hace que el alto total de la pista coincida con lo
 * que el premio mayor necesita para dibujar su imagen vertical en su proporcion
 * nativa. Dos filas de tarjeta cuadrada de 166px mas los controles dan ~677px,
 * y una 420x588 sobre los ~324px de esa columna pide ~454 de imagen mas ~200
 * de texto. Por eso la columna del premio mayor se achico en la misma
 * proporcion (ver `UltimosGanadores`): tocar uno sin el otro empieza a recortar
 * la imagen de la tarjeta grande, que es el efecto que no se ve venir desde aca.
 *
 * La diferencia con `CarruselNoticias` no es cosmetica y es la razon de que
 * sean dos archivos: aca la pista es una grilla con `grid-flow-col`, o sea que
 * el orden del DOM baja por la columna antes de saltar a la siguiente. Eso es
 * lo que hace que el premio 2 y el 3 queden uno encima del otro y que un
 * click de flecha avance de a dos premios en vez de uno. Con `flex-wrap` no se
 * puede: envolver necesita un alto fijo y ademas ordena por fila, que leido en
 * un carrusel horizontal desordena el ranking.
 *
 * Todas las columnas miden lo mismo, asi que el salto podria ser un numero
 * fijo. No lo es a proposito: se busca la primera tarjeta que empieza despues
 * del borde y se la trae. Asi el dia que una columna cambie de ancho —o que se
 * agregue una tercera fila— el control sigue cayendo parado.
 */

export interface CarruselDeGanadoresProps {
  /** Las `<li>` con las tarjetas, en orden de premio descendente. */
  children: ReactNode
}

export function CarruselDeGanadores({ children }: CarruselDeGanadoresProps) {
  const pista = useRef<HTMLUListElement>(null)
  /*
   * Si hay mas premios hacia cada lado. Apaga la flecha que no lleva a ningun
   * lado, que es la unica senal de posicion que lleva la pista.
   */
  const [puede, setPuede] = useState({ izq: false, der: true })

  useEffect(() => {
    const nodo = pista.current
    if (!nodo) return

    const medir = () => {
      const maximo = nodo.scrollWidth - nodo.clientWidth
      setPuede({ izq: nodo.scrollLeft > 4, der: nodo.scrollLeft < maximo - 4 })
    }

    medir()
    nodo.addEventListener('scroll', medir, { passive: true })
    /*
     * Las tarjetas llegan despues que el componente: la seccion pide los
     * premios al montar y hasta entonces la pista esta vacia, con lo cual la
     * primera medicion diria que no hay nada hacia la derecha. El observador
     * vuelve a medir cuando el contenido cambia de ancho.
     */
    const observadorDeTamano = new ResizeObserver(medir)
    observadorDeTamano.observe(nodo)
    for (const hijo of nodo.children) observadorDeTamano.observe(hijo)

    return () => {
      nodo.removeEventListener('scroll', medir)
      observadorDeTamano.disconnect()
    }
  }, [children])

  /**
   * Salta a la columna siguiente o a la anterior.
   *
   * Las posiciones se miden con `getBoundingClientRect` y no con `offsetLeft`:
   * `offsetLeft` es relativo al ancestro posicionado mas cercano, que no tiene
   * por que ser la pista. Comparado contra `scrollLeft` daria siempre corrido.
   *
   * Las dos tarjetas de una misma columna comparten borde izquierdo, asi que
   * la busqueda encuentra siempre la de arriba y el salto es de una columna
   * entera.
   */
  const desplazar = (sentido: 1 | -1) => {
    const nodo = pista.current
    if (!nodo) return

    const tarjetas = Array.from(nodo.children).filter(
      (hijo): hijo is HTMLElement => hijo instanceof HTMLElement,
    )

    // Los 4px absorben el redondeo del scroll, que no siempre cae en un entero.
    const borde = nodo.getBoundingClientRect().left

    const objetivo =
      sentido === 1
        ? tarjetas.find((tarjeta) => tarjeta.getBoundingClientRect().left > borde + 4)
        : tarjetas.findLast((tarjeta) => tarjeta.getBoundingClientRect().left < borde - 4)

    if (!objetivo) return

    const delta = objetivo.getBoundingClientRect().left - borde
    nodo.scrollTo({ behavior: 'smooth', left: nodo.scrollLeft + delta })
  }

  /*
   * Flecha en boton terciario circular de 44px: el minimo que se puede tocar
   * con el dedo sin errarle. Mismas clases que el carrusel de noticias.
   */
  const claseFlecha =
    'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-contorno text-parrafo transition-colors duration-150 ease-marca hover:border-accion hover:text-tinta disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="flex min-w-0 flex-col">
      <ul
        className="sin-barra desvanecer grid snap-x snap-mandatory grid-flow-col grid-rows-2 gap-4 overflow-x-auto pb-1 md:gap-6 [grid-auto-columns:10.4rem]"
        id="pista-ganadores"
        ref={pista}
      >
        {children}
      </ul>

      {/*
       * El hairline cierra el bloque por abajo y deja los controles separados
       * de las tarjetas, igual que en el carrusel de noticias. Los botones van
       * a la derecha: a la izquierda quedarian pegados al premio mayor, que ya
       * es el elemento pesado de la fila.
       */}
      <div className="mt-4 flex items-center justify-end gap-3 border-t border-hairline pt-4">
        <button
          aria-controls="pista-ganadores"
          aria-label="Ver premios anteriores"
          className={claseFlecha}
          disabled={!puede.izq}
          onClick={() => desplazar(-1)}
          type="button"
        >
          <IconoFlecha sentido="izquierda" />
        </button>

        <button
          aria-controls="pista-ganadores"
          aria-label="Ver más premios"
          className={claseFlecha}
          disabled={!puede.der}
          onClick={() => desplazar(1)}
          type="button"
        >
          <IconoFlecha sentido="derecha" />
        </button>
      </div>
    </div>
  )
}
