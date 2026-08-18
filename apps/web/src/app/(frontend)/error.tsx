'use client'

import { useEffect } from 'react'

// Archivo directo y no barril: este componente es cliente. Ver `atoms/index.ts`.
import { Boton } from '@/components/atoms/Boton'

interface ErrorDelSitioProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorDelSitio({ error, reset }: ErrorDelSitioProps) {
  useEffect(() => {
    // En produccion el mensaje se sanea y solo queda el `digest`, que es lo que
    // permite cruzar lo que vio el visitante con el log del servidor.
    console.error(error)
  }, [error])

  return (
    <div className="contenedor ritmo">
      <p className="font-util text-eyebrow text-apagado uppercase">Error</p>

      <h1 className="mt-5 max-w-[16ch] font-display text-h1 text-tinta text-balance">
        No pudimos cargar esta página
      </h1>

      <p className="mt-6 max-w-[60ch] text-bajada text-parrafo text-pretty">
        Fue un problema de nuestro lado. Probá de nuevo; si vuelve a pasar, escribinos y pasanos
        el código de abajo.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <Boton onClick={reset} variante="primaria">
          Reintentar
        </Boton>
        <Boton href="/" variante="terciaria">
          Volver al inicio
        </Boton>
      </div>

      {error.digest ? (
        <p className="mt-10 font-util text-meta text-apagado">Código: {error.digest}</p>
      ) : null}
    </div>
  )
}
