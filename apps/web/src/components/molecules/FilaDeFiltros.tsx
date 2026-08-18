import type { ReactNode } from 'react'

import { Tag } from '@/components/atoms/Tag'

/**
 * Una fila de chips de filtro.
 *
 * Los filtros son enlaces y no botones: cada combinacion es una URL propia que
 * se puede compartir e indexar, y ademas eso los deja funcionando sin JS. El
 * seleccionado es el unico naranja de su fila.
 *
 * `/blog` la usa una vez sin rotulo y `/promociones` una vez con el boton que
 * abre el resto de los filtros adelante; antes eran dos bloques de markup
 * distintos que hacian lo mismo.
 */

export interface OpcionDeFiltro {
  /** Clave de React. El id del documento o el valor del enum. */
  clave: string | number
  nombre: string
  href: string
  activa: boolean
}

export interface FilaDeFiltrosProps {
  /** "Plataforma", "Tipo de bono". Se omite cuando la fila es la unica. */
  etiqueta?: string
  opciones: readonly OpcionDeFiltro[]
  /**
   * Lo que abre la fila, dentro de la misma lista: hoy, el boton que despliega
   * el resto de los filtros de `/promociones`. Va adentro del `<ul>` y no al
   * lado para que comparta el `flex-wrap` de los chips; puesto afuera, al
   * saltar de linea quedaba desalineado con ellos.
   */
  antes?: ReactNode
}

export function FilaDeFiltros({ antes, etiqueta, opciones }: FilaDeFiltrosProps) {
  if (opciones.length === 0 && !antes) return null

  return (
    <div>
      {etiqueta ? <p className="font-util text-meta text-apagado uppercase">{etiqueta}</p> : null}

      <ul className={`flex flex-wrap items-center gap-3 ${etiqueta ? 'mt-3' : ''}`.trim()}>
        {antes ? <li>{antes}</li> : null}

        {opciones.map((opcion) => (
          <li key={opcion.clave}>
            <Tag href={opcion.href} seleccionado={opcion.activa}>
              {opcion.nombre}
            </Tag>
          </li>
        ))}
      </ul>
    </div>
  )
}
