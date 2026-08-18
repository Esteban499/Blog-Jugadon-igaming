import type { ReactNode } from 'react'

/**
 * La caja que ocupa el lugar de una lista sin resultados.
 *
 * Estaba repetida en cuatro pantallas con tres variantes distintas de padding
 * y de jerarquia de texto. Superficie sin borde, que es como se separa del
 * fondo cualquier caja del sistema (§9): elevacion o borde, nunca las dos.
 *
 * El `titulo` es opcional porque hay dos casos distintos: "no hay nada todavia"
 * se dice en una linea, y "no hay nada que coincida con tus filtros" necesita
 * primero decir que paso y despues que hacer.
 */

export interface EstadoVacioProps {
  titulo?: string
  children: ReactNode
}

export function EstadoVacio({ children, titulo }: EstadoVacioProps) {
  return (
    <div className="rounded-caja bg-superficie px-6 py-12">
      {titulo ? <p className="text-cuerpo text-tinta">{titulo}</p> : null}

      <div className={`max-w-[60ch] text-cuerpo text-parrafo ${titulo ? 'mt-3' : ''}`.trim()}>
        {children}
      </div>
    </div>
  )
}
