import type { ReactNode } from 'react'

import { IconoAlerta } from '@/components/atoms/iconos/IconoAlerta'
import { IconoInfo } from '@/components/atoms/iconos/IconoInfo'

/**
 * Caja de aviso: icono, rotulo y cuerpo.
 *
 * Los cuatro tipos de aviso del articulo y el cartel de "promocion vencida" son
 * la misma pieza, y estaban escritos dos veces con el SVG pegado a mano en cada
 * lugar.
 *
 * Se resuelven con el naranja mas iconografia y texto, nunca con verdes ni
 * rojos: el sistema no incorpora colores ajenos a la paleta, ni siquiera para
 * estados (§2.3.4). Lo que distingue un consejo de una advertencia es el rotulo
 * y el icono, no el color de fondo.
 */

export interface AvisoEnLineaProps {
  rotulo: string
  /** Advertencia: triangulo y rotulo en naranja. Si no, circulo en secundario. */
  alerta?: boolean
  children: ReactNode
  /** Solo para el margen: el aviso no decide donde cae en el flujo. */
  className?: string
}

export function AvisoEnLinea({
  alerta = false,
  children,
  className = '',
  rotulo,
}: AvisoEnLineaProps) {
  const Icono = alerta ? IconoAlerta : IconoInfo

  return (
    /*
     * Superficie sin borde: se separa del fondo por elevacion, que es una de
     * las dos formas que admite el sistema, y no por las dos a la vez (§9).
     */
    <aside className={`rounded-caja bg-superficie p-6 ${className}`.trim()}>
      <p
        className={`flex items-center gap-2 font-util text-eyebrow uppercase ${
          alerta ? 'text-accion' : 'text-apagado'
        }`}
      >
        <Icono className="mt-0.5 size-5 shrink-0" />
        {rotulo}
      </p>

      {/* El ultimo parrafo del cuerpo no arrastra su margen contra el borde. */}
      <div className="mt-3 text-cuerpo text-parrafo [&>*:last-child]:mb-0">{children}</div>
    </aside>
  )
}
