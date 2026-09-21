'use client'

import { useEffect, useRef, useState } from 'react'

/*
 * Archivos directos y no barril: este componente es cliente. Ver
 * `atoms/index.ts`.
 */
import { Boton } from '@/components/atoms/Boton'
import { IconoFlecha } from '@/components/atoms/iconos/IconoFlecha'
import { TarjetaShort } from '@/components/molecules/TarjetaShort'
import type { Short } from '@/utilidades/shorts'

import { ReproductorDeShort } from './ReproductorDeShort'

/**
 * La pista de shorts de la portada, y quien sabe cual se esta mirando.
 *
 * Recibe los shorts ya resueltos en vez de `children` con las tarjetas ya
 * dibujadas, que es como trabajan los otros dos carruseles del sitio. La
 * diferencia esta forzada por el modal: cada tarjeta necesita un `onClick`, y
 * un Server Component no puede pasar una funcion. La contrapartida es que
 * `utilidades/shorts` no viaja al navegador igual, porque de `Short` solo se
 * importa el tipo y TypeScript lo borra al compilar.
 *
 * El estado de cual short esta abierto vive aca y no en cada tarjeta: con
 * quince tarjetas, un `abierto` por tarjeta serian quince estados que pueden
 * quedar abiertos a la vez; con uno solo, elegir otro reemplaza el reproductor
 * en lugar de apilarlo. Es la misma decision que toma `UltimosGanadores` con su
 * modal de plataformas.
 *
 * Se guarda el INDICE y no el short: el reproductor tiene flechas para pasar al
 * siguiente sin cerrar, y para eso hay que saber en que posicion de la pista
 * esta parado. Con el objeto habria que buscarlo cada vez.
 */

export interface CarruselDeShortsProps {
  shorts: Short[]
  /** El canal en YouTube, para el boton de cierre. Sin canal, no hay boton. */
  hrefCanal: string | null
}

export function CarruselDeShorts({ hrefCanal, shorts }: CarruselDeShortsProps) {
  const pista = useRef<HTMLUListElement>(null)
  /** El indice del short abierto, o `null` con el reproductor cerrado. */
  const [abierto, setAbierto] = useState<number | null>(null)
  /*
   * Si hay mas contenido hacia cada lado. Apaga la flecha que no lleva a ningun
   * lado, que es la unica senal de posicion que lleva la pista.
   */
  const [puede, setPuede] = useState({ izq: false, der: true })

  useEffect(() => {
    const nodo = pista.current
    if (!nodo) return

    const medir = () => {
      const maximo = nodo.scrollWidth - nodo.clientWidth
      setPuede({ der: nodo.scrollLeft < maximo - 4, izq: nodo.scrollLeft > 4 })
    }

    medir()
    nodo.addEventListener('scroll', medir, { passive: true })
    /*
     * Las tarjetas llegan del servidor ya renderizadas, pero las miniaturas no:
     * hasta que carga la primera imagen la pista puede medir distinto. El
     * observador vuelve a medir cuando el contenido cambia de ancho.
     */
    const observadorDeTamano = new ResizeObserver(medir)
    observadorDeTamano.observe(nodo)

    return () => {
      nodo.removeEventListener('scroll', medir)
      observadorDeTamano.disconnect()
    }
  }, [shorts])

  /**
   * Salta a la tarjeta siguiente o a la anterior.
   *
   * Todas las tarjetas miden lo mismo, asi que el salto podria ser un numero
   * fijo. No lo es a proposito: se busca la primera tarjeta que empieza despues
   * del borde y se la trae. Asi el dia que cambie el ancho de la tarjeta el
   * control sigue cayendo parado, que es el mismo criterio de los otros dos
   * carruseles.
   *
   * Las posiciones se miden con `getBoundingClientRect` y no con `offsetLeft`:
   * `offsetLeft` es relativo al ancestro posicionado mas cercano, que no tiene
   * por que ser la pista. Comparado contra `scrollLeft` daria siempre corrido.
   */
  const desplazar = (sentido: 1 | -1) => {
    const nodo = pista.current
    if (!nodo) return

    const tarjetas = Array.from(nodo.children).filter(
      (hijo): hijo is HTMLElement => hijo instanceof HTMLElement,
    )

    /*
     * El borde contra el que se alinean las tarjetas al hacer snap. Hoy esta
     * pista no lleva sangria propia —la sangria la pone el `contenedor` de la
     * seccion, que esta afuera—, asi que esto da cero y el borde es el del
     * elemento. Se lee igual en vez de asumirlo: el dia que la pista vuelva a
     * sangrar, el calculo sigue en pie.
     *
     * Los 4px absorben el redondeo del scroll, que no siempre cae en un entero.
     */
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
   * con el dedo sin errarle. Es la misma clase de los otros dos carruseles.
   */
  const claseFlecha =
    'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-contorno text-parrafo transition-colors duration-150 ease-marca hover:border-accion hover:text-tinta disabled:pointer-events-none disabled:opacity-40'

  return (
    <div>
      {/*
       * Sin `pista`, que es la utilidad de sangrado a pantalla completa: alinea
       * el arranque de las tarjetas con el contenedor pero suelta el borde
       * derecho contra la ventana. Con el ancho de sitio en 1200 eso era el look
       * del carrusel; con 1700 centrado deja de serlo, porque la fila se escapa
       * de la columna por la derecha y se lee como que no termina nunca.
       *
       * Esta pista se queda adentro del `contenedor` que le pone la seccion, y
       * por lo tanto empieza y TERMINA donde termina todo lo demas de la
       * pagina. Es la regla que fija el bloque de layout de `styles.css`:
       * ninguna pantalla define su propio maximo.
       *
       * Es lo mismo que ya hace la pista de ultimos ganadores, que es la
       * seccion de al lado: cuando el ancho de sitio paso a 1700 dejo de abrir
       * su borde derecho y volvio al `contenedor`. Las dos vitrinas de la
       * portada terminan en la misma linea vertical, que es de lo que se trata
       * el estandar.
       */}
      <ul
        className="sin-barra desvanecer flex snap-x snap-mandatory gap-4 overflow-x-auto md:gap-6"
        id="pista-shorts"
        ref={pista}
      >
        {shorts.map((short, indice) => (
          /*
           * Los 13rem son el ancho de columna de la pista de ultimos ganadores,
           * que es la seccion de al lado. No es una coincidencia que valga
           * reproducir: las dos pistas arrancan en la misma sangria izquierda y
           * quedar a distinto paso se lee como un error de maquetado.
           */
          <li className="w-[13rem] shrink-0 snap-start" key={short.id}>
            <TarjetaShort
              miniatura={short.miniatura}
              onSeleccionar={() => setAbierto(indice)}
              titulo={short.titulo}
            />
          </li>
        ))}
      </ul>

      {/*
       * Sin `contenedor` propio: el que manda ya lo pone la seccion, y anidar
       * uno adentro de otro sumaria una segunda sangria y volveria a centrar
       * sobre un ancho menor. El hairline separa los controles de las tarjetas,
       * igual que en el carrusel de noticias.
       */}
      <div className="mt-8 border-t border-hairline pt-6">
        <div className="flex items-center gap-3">
          <button
            aria-controls="pista-shorts"
            aria-label="Ver shorts anteriores"
            className={claseFlecha}
            disabled={!puede.izq}
            onClick={() => desplazar(-1)}
            type="button"
          >
            <IconoFlecha sentido="izquierda" />
          </button>

          <button
            aria-controls="pista-shorts"
            aria-label="Ver shorts siguientes"
            className={claseFlecha}
            disabled={!puede.der}
            onClick={() => desplazar(1)}
            type="button"
          >
            <IconoFlecha sentido="derecha" />
          </button>

          {/*
           * Navegacion destacada, asi que boton secundario azul, como el "Ver
           * todas" de las noticias. Manda afuera del sitio, de ahi el `rel` y el
           * `target`.
           */}
          {hrefCanal ? (
            <Boton
              className="ml-auto"
              href={hrefCanal}
              rel="noopener"
              target="_blank"
              variante="secundaria"
            >
              Ver el canal
            </Boton>
          ) : null}
        </div>
      </div>

      {/*
       * Montado solo cuando hay algo elegido —y no escondido con CSS— para que
       * el efecto que bloquea el scroll del fondo y devuelve el foco corra al
       * abrir y al cerrar, que es justo lo que hace montar y desmontar. Ademas,
       * desmontado no hay `<iframe>` de YouTube en el documento.
       */}
      {abierto !== null ? (
        <ReproductorDeShort
          onAnterior={abierto > 0 ? () => setAbierto(abierto - 1) : null}
          onCerrar={() => setAbierto(null)}
          onSiguiente={abierto < shorts.length - 1 ? () => setAbierto(abierto + 1) : null}
          posicion={{ actual: abierto + 1, total: shorts.length }}
          short={shorts[abierto]}
        />
      ) : null}
    </div>
  )
}
