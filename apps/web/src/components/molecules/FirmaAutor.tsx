import Image from 'next/image'

import { fechaCorta } from '@/utilidades/texto'

/**
 * Firma de autor (§5.6).
 *
 * Avatar circular de 40px con borde hairline, nombre en cuerpo 600 blanco y
 * rol en la utilitaria en mayusculas a 12px secundario. La fecha y el tiempo
 * de lectura van en la misma linea que el rol, separados por punto medio.
 *
 * Sin foto no se dibuja ningun sustituto: unas iniciales en un circulo serian
 * un patron nuevo para tapar un dato que falta, y el nombre solo se sostiene
 * perfectamente.
 */

export interface FirmaAutorProps {
  nombre: string
  cargo?: string | null
  fotoUrl?: string | null
  publicadoEn?: string | null
  /** Minutos de lectura, calculados sobre el contenido de la entrada. */
  minutos?: number | null
}

export function FirmaAutor({ cargo, fotoUrl, minutos, nombre, publicadoEn }: FirmaAutorProps) {
  const fecha = fechaCorta(publicadoEn)

  /*
   * La linea se arma como piezas y no como texto unido porque la fecha tiene
   * que salir dentro de un `<time>` con su `datetime`: es lo que la vuelve
   * legible para un buscador, que no sabe interpretar "12 AGO 2026".
   */
  const piezas = [
    cargo ? <span key="cargo">{cargo}</span> : null,
    fecha ? (
      <time dateTime={publicadoEn ?? ''} key="fecha">
        {fecha}
      </time>
    ) : null,
    minutos ? <span key="minutos">{minutos} min</span> : null,
  ].filter(Boolean)

  return (
    <div className="flex items-center gap-3">
      {fotoUrl ? (
        <Image
          alt=""
          className="size-10 shrink-0 rounded-full border border-contorno object-cover"
          height={40}
          src={fotoUrl}
          width={40}
        />
      ) : null}

      <div className="min-w-0">
        <p className="text-cuerpo font-semibold text-tinta">{nombre}</p>
        {piezas.length > 0 ? (
          <p className="font-util text-tag text-apagado uppercase">
            {piezas.map((pieza, indice) => (
              <span key={indice}>
                {indice > 0 ? ' · ' : null}
                {pieza}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </div>
  )
}
