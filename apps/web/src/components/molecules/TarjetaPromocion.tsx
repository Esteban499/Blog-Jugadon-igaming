import Link from 'next/link'

import { SinPortada } from '@/components/atoms/SinPortada'
import { fechaCorta } from '@/utilidades/texto'

/**
 * Card de promocion.
 *
 * Misma anatomia que la card de articulo (§5.3) —imagen 16:9, eyebrow,
 * titulo de hasta dos lineas y metadato— porque son la misma pieza con otro
 * dato adentro: si se vieran distintas, el sitio tendria dos sistemas de card.
 *
 * La imagen viene de la plataforma de origen, no del panel, asi que se dibuja
 * con `<img>` y no con `next/image`: son dominios externos que no estan en la
 * lista de `next.config`, y optimizarlas exigiria autorizar cada uno.
 */

export interface TarjetaPromocionProps {
  titulo: string
  slug: string
  plataforma?: string | null
  tipo?: string | null
  /** El gancho que publica la plataforma. */
  oferta?: string | null
  vigenciaHasta?: string | null
  imagenUrl?: string | null
}

export function TarjetaPromocion({
  imagenUrl,
  oferta,
  plataforma,
  slug,
  tipo,
  titulo,
  vigenciaHasta,
}: TarjetaPromocionProps) {
  const hasta = fechaCorta(vigenciaHasta)

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-caja border border-transparent bg-superficie transition-colors duration-250 ease-marca hover:border-accion-contorno hover:bg-elevada">
      <div className="relative aspect-video w-full overflow-hidden">
        {imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="size-full object-cover transition-transform duration-250 ease-marca group-hover:scale-[1.02]"
            src={imagenUrl}
          />
        ) : (
          <SinPortada className="absolute inset-0" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        {/*
         * Sin eyebrow naranja, a diferencia de la card de nota.
         *
         * El listado muestra decenas de promociones a la vez, y en esa grilla
         * la plataforma como eyebrow naranja daba cincuenta acentos repetidos:
         * el color de accion compitiendo consigo mismo deja de indicar accion
         * (§2.3.3). En esta pantalla el naranja es del filtro seleccionado, que
         * es lo unico que se opera, y la plataforma baja a la linea de
         * metadatos junto al tipo y la vigencia.
         */}
        <h3 className="line-clamp-2 font-display text-card text-tinta text-pretty">
          <Link
            className="after:absolute after:inset-0 after:content-['']"
            href={`/promociones/${slug}`}
          >
            {titulo}
          </Link>
        </h3>

        {/* Varias campanias repiten el titulo como texto de promo. */}
        {oferta && oferta !== titulo ? (
          <p className="line-clamp-2 text-cuerpo text-parrafo text-pretty">{oferta}</p>
        ) : null}

        <p className="mt-auto font-util text-meta text-apagado uppercase">
          {[plataforma, tipo].filter(Boolean).join(' · ')}
          {(plataforma || tipo) && hasta ? ' · ' : null}
          {hasta ? (
            <>
              Hasta <time dateTime={vigenciaHasta ?? ''}>{hasta}</time>
            </>
          ) : null}
        </p>
      </div>
    </article>
  )
}
