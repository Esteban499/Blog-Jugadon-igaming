import Image from 'next/image'
import Link from 'next/link'

import { FirmaAutor } from '@/components/molecules/FirmaAutor'
import type { Author, Category, Media, Post } from '@/payload-types'
import { relacion } from '@/utilidades/payload'
import { rutaDeBlog } from '@/utilidades/rutas'
import { tiempoDeLectura } from '@/utilidades/texto'

/**
 * Hero del articulo (§5.4).
 *
 * Imagen a sangre con el velo encima, o gradiente profundo si no hay imagen. El
 * contenido se ancla abajo a la izquierda dentro del contenedor.
 *
 * El alto no supera el 70% de la vista: el primer parrafo tiene que asomar. El
 * `min-h` y no un `h` fijo es lo que evita que un titulo de tres lineas en un
 * telefono angosto se recorte contra el borde.
 *
 * El margen negativo lo mete por debajo de la barra, transparente al tope, y el
 * `padding-top` devuelve ese espacio adentro para que el contenido no quede
 * nunca tapado por ella.
 */

export interface HeroDeArticuloProps {
  entrada: Post
}

export function HeroDeArticulo({ entrada }: HeroDeArticuloProps) {
  const portada = relacion<Media>(entrada.portada)
  const categoria = relacion<Category>(entrada.categoria)
  const autor = relacion<Author>(entrada.autor)
  const foto = relacion<Media>(autor?.foto)

  return (
    <header className="relative -mt-[var(--alto-barra)] flex min-h-[min(70dvh,640px)] flex-col justify-end overflow-hidden pt-[var(--alto-barra)]">
      {portada?.url ? (
        <>
          <Image
            alt={portada.alt ?? ''}
            className="object-cover"
            fill
            priority
            sizes="100vw"
            src={portada.url}
          />
          {/* Unica forma autorizada de poner texto sobre una fotografia. */}
          <div aria-hidden className="velo absolute inset-0" />
        </>
      ) : (
        <div aria-hidden className="degradado-profundo absolute inset-0" />
      )}

      <div className="contenedor relative pt-16 pb-12 md:pb-16">
        {categoria ? (
          <p className="font-util text-eyebrow uppercase">
            {/*
             * La categoria es un enlace al listado filtrado: es el unico camino
             * de vuelta que la nota necesita, y dice mas que un "volver"
             * generico.
             */}
            <Link
              className="text-accion transition-colors duration-150 ease-marca hover:text-tinta"
              href={rutaDeBlog({ categoria: categoria.slug ?? undefined })}
            >
              {categoria.nombre}
            </Link>
          </p>
        ) : null}

        {/* Hasta tres lineas: el `line-clamp` es el que hace cumplir el limite
            cuando el titulo cargado en el panel es largo. */}
        <h1 className="mt-5 line-clamp-3 max-w-[20ch] font-display text-h1 text-tinta text-balance">
          {entrada.titulo}
        </h1>

        {entrada.resumen ? (
          <p className="mt-6 line-clamp-2 max-w-[60ch] text-bajada text-parrafo text-pretty">
            {entrada.resumen}
          </p>
        ) : null}

        {autor?.nombre ? (
          <div className="mt-8">
            <FirmaAutor
              cargo={autor.cargo}
              fotoUrl={foto?.url}
              minutos={tiempoDeLectura(entrada.contenido)}
              nombre={autor.nombre}
              publicadoEn={entrada.publicadoEn}
            />
          </div>
        ) : null}
      </div>
    </header>
  )
}
