'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

// Archivo directo y no barril: este componente es cliente. Ver `atoms/index.ts`.
import { Boton } from '@/components/atoms/Boton'
import { IconoFlecha } from '@/components/atoms/iconos/IconoFlecha'

/**
 * La pista deslizante del carrusel de la portada.
 *
 * Es el unico organismo de la home que viaja al cliente, y solo lleva la
 * logica de desplazamiento: las tarjetas llegan ya renderizadas desde el
 * servidor como `children`. Quien las arma es `NoticiasDestacadas`, que si es
 * Server Component y por eso los datos de Payload nunca entran al bundle.
 */

export interface CarruselNoticiasProps {
  /** Las `<li>` con las tarjetas, renderizadas en el servidor. */
  children: ReactNode
  hrefVerTodas: string
}

export function CarruselNoticias({ children, hrefVerTodas }: CarruselNoticiasProps) {
  const pista = useRef<HTMLUListElement>(null)
  const [aLaVista, setALaVista] = useState(false)
  /*
   * Si hay mas contenido hacia cada lado. Apaga la flecha que no lleva a
   * ningun lado, que es la unica senal de posicion que necesita el carrusel:
   * la barra de progreso que habia aca era un elemento mas —y uno naranja— y
   * no se extrana.
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
    const observadorDeTamano = new ResizeObserver(medir)
    observadorDeTamano.observe(nodo)

    /*
     * La entrada corre una sola vez (§6): al cruzar el umbral se desconecta el
     * observador. Antes era reversible y se rebobinaba en cada pasada, que es
     * justo el movimiento que se nota.
     */
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setALaVista(true)
          observador.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )
    observador.observe(nodo)

    return () => {
      nodo.removeEventListener('scroll', medir)
      observadorDeTamano.disconnect()
      observador.disconnect()
    }
  }, [])

  /**
   * Salta a la tarjeta siguiente o a la anterior.
   *
   * No se puede desplazar un paso fijo: la pista mezcla dos anchos de tarjeta,
   * asi que "el ancho de la primera mas el gap" solo acierta en el primer
   * salto y despues va quedando corrido. Se busca la tarjeta que sigue en la
   * direccion pedida y se la lleva al borde.
   *
   * Las posiciones se miden con `getBoundingClientRect` y no con `offsetLeft`:
   * `offsetLeft` es relativo al ancestro posicionado mas cercano, que en la
   * portada es la seccion —lleva `relative` para montarse sobre el video—, no
   * la pista. Comparado contra `scrollLeft` daria siempre corrido.
   *
   * Y el salto se hace con `scrollTo` sobre la pista en lugar de con
   * `scrollIntoView`: este ultimo tambien desplaza a los ancestros, y con las
   * tarjetas trepando por encima de la portada eso puede llevarse puesto el
   * scroll vertical de la pagina.
   */
  const desplazar = (sentido: 1 | -1) => {
    const nodo = pista.current
    if (!nodo) return

    const tarjetas = Array.from(nodo.children).filter(
      (hijo): hijo is HTMLElement => hijo instanceof HTMLElement,
    )

    // El borde contra el que se alinean las tarjetas al hacer snap: el de la
    // pista mas su sangria. Los 4px absorben el redondeo del scroll, que no
    // siempre cae en un entero.
    const sangria = Number.parseFloat(getComputedStyle(nodo).paddingLeft) || 0
    const borde = nodo.getBoundingClientRect().left + sangria

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
   * con el dedo sin errarle. El hover enciende el borde en naranja y aclara el
   * icono, igual que cualquier terciario del sistema.
   */
  const claseFlecha =
    'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-contorno text-parrafo transition-colors duration-150 ease-marca hover:border-accion hover:text-tinta disabled:pointer-events-none disabled:opacity-40'

  return (
    <div>
      {/*
       * Sin JavaScript el observador no dispara nunca y las tarjetas se
       * quedarian invisibles para siempre. Esto las devuelve a su sitio.
       */}
      <noscript>
        <style>{'.revelar { opacity: 1 !important; transform: none !important; }'}</style>
      </noscript>

      <ul
        className={`pista sin-barra flex snap-x snap-mandatory gap-6 overflow-x-auto ${
          aLaVista ? 'revelar-visible' : 'revelar'
        }`}
        id="pista-noticias"
        ref={pista}
      >
        {children}
      </ul>

      {/*
       * Los controles vuelven al contenedor: la pista sangra, la fila de
       * botones no. El hairline los separa de las tarjetas —es la misma linea
       * que usa la referencia— y ademas cierra el bloque contra el video que
       * pasa por detras.
       */}
      <div className="contenedor mt-8 border-t border-hairline pt-6">
        <div className="flex items-center gap-3">
          <button
            aria-controls="pista-noticias"
            aria-label="Ver noticias anteriores"
            className={claseFlecha}
            disabled={!puede.izq}
            onClick={() => desplazar(-1)}
            type="button"
          >
            <IconoFlecha sentido="izquierda" />
          </button>

          <button
            aria-controls="pista-noticias"
            aria-label="Ver noticias siguientes"
            className={claseFlecha}
            disabled={!puede.der}
            onClick={() => desplazar(1)}
            type="button"
          >
            <IconoFlecha sentido="derecha" />
          </button>

          {/*
           * Navegacion destacada, asi que boton secundario azul. El naranja de
           * la vista ya lo tienen los eyebrows de las tarjetas.
           */}
          <Boton className="ml-auto" href={hrefVerTodas} variante="secundaria">
            Ver todas
          </Boton>
        </div>
      </div>
    </div>
  )
}
