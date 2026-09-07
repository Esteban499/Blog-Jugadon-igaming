import Image from 'next/image'
import Link from 'next/link'

import { SinPortada } from '@/components/atoms/SinPortada'
import { fechaCorta } from '@/utilidades/texto'

/**
 * Card de articulo (§5.3).
 *
 * Imagen 16:9, categoria, titulo de hasta dos lineas y metadato. **Sin
 * bajada**: los tres datos alcanzan, y la bajada agrega ruido y obliga a un
 * recorte mas.
 *
 * En reposo la card se separa del fondo por elevacion y no lleva borde: el
 * manual rechaza en revision las cards con borde y fondo diferenciado a la
 * vez (§9). El borde transparente existe solo para que el hover pueda
 * encenderlo sin mover un pixel de la maqueta.
 *
 * Toda la card es clickeable, pero el enlace real es el titulo: el `::after`
 * del enlace se estira sobre la card entera, asi que quien navega con lector
 * de pantalla escucha el titulo y no "enlace, imagen".
 *
 * Recibe primitivas y no un `Post`: la molecula no conoce la forma que tienen
 * los datos en Payload. Quien traduce el documento a estas props es el
 * organismo que la agrupa (`GrillaDeNoticias`, `NoticiasDestacadas`).
 */

export interface TarjetaNoticiaProps {
  titulo: string
  slug: string
  categoria?: string | null
  publicadoEn?: string | null
  /** Minutos de lectura, calculados sobre el contenido de la entrada. */
  minutos?: number | null
  portadaUrl?: string | null
  portadaAlt?: string | null
  /** Tamanos de la imagen segun donde viva la card. */
  sizes?: string
  /** La primera card de la portada entra en el LCP. */
  prioridad?: boolean
}

export function TarjetaNoticia({
  categoria,
  minutos,
  portadaAlt,
  portadaUrl,
  prioridad = false,
  publicadoEn,
  sizes = '(min-width: 1536px) 407px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
  slug,
  titulo,
}: TarjetaNoticiaProps) {
  const fecha = fechaCorta(publicadoEn)

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-caja border border-transparent bg-superficie transition-colors duration-250 ease-marca hover:border-accion-contorno hover:bg-elevada">
      <div className="relative aspect-video w-full overflow-hidden">
        {portadaUrl ? (
          <Image
            alt={portadaAlt ?? ''}
            className="object-cover transition-transform duration-250 ease-marca group-hover:scale-[1.02]"
            fill
            priority={prioridad}
            sizes={sizes}
            src={portadaUrl}
          />
        ) : (
          <SinPortada className="absolute inset-0" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        {categoria ? (
          <p className="font-util text-eyebrow text-accion uppercase">{categoria}</p>
        ) : null}

        {/*
         * El recorte a dos lineas vive en el `h3` y el estirado del enlace en
         * el `Link`. Al reves —los dos sobre el mismo elemento— el
         * `-webkit-box` que necesita `line-clamp` y el `::after` absoluto se
         * pelean, y segun el navegador el area clickeable se queda en el ancho
         * del texto.
         */}
        <h3 className="line-clamp-2 font-display text-card text-tinta text-pretty">
          <Link className="after:absolute after:inset-0 after:content-['']" href={`/blog/${slug}`}>
            {titulo}
          </Link>
        </h3>

        {fecha || minutos ? (
          <p className="mt-auto font-util text-meta text-apagado uppercase">
            {fecha ? <time dateTime={publicadoEn ?? ''}>{fecha}</time> : null}
            {fecha && minutos ? ' · ' : null}
            {minutos ? `${minutos} min` : null}
          </p>
        ) : null}
      </div>
    </article>
  )
}
