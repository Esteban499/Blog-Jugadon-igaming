import { TarjetaNoticia } from '@/components/molecules/TarjetaNoticia'
import type { Category, Media, Post } from '@/payload-types'
import { relacion } from '@/utilidades/payload'
import { tiempoDeLectura } from '@/utilidades/texto'

import { CarruselNoticias } from './CarruselNoticias'

/**
 * Las noticias de la portada, en pista deslizante.
 *
 * Este organismo corre en el servidor: arma las tarjetas y se las pasa como
 * `children` a `CarruselNoticias`, que es el unico archivo cliente de la home.
 * Gracias a eso las portadas se optimizan en el servidor y ni los documentos de
 * Payload ni `tiempoDeLectura` viajan al navegador.
 */

export interface NoticiasDestacadasProps {
  entradas: Post[]
  hrefVerTodas: string
}

export function NoticiasDestacadas({ entradas, hrefVerTodas }: NoticiasDestacadasProps) {
  return (
    <CarruselNoticias hrefVerTodas={hrefVerTodas}>
      {entradas.map((entrada) => {
        const portada = relacion<Media>(entrada.portada)
        const categoria = relacion<Category>(entrada.categoria)

        /*
         * Dos anchos en la misma pista, como la referencia. Pero el ancho no
         * alterna por posicion sino que lo decide `destacado`, que es el campo
         * con el que marketing ya dice cual nota importa mas: el ritmo visual
         * termina significando algo en vez de ser decorado.
         */
        const destacada = entrada.destacado === true

        return (
          <li
            className={`shrink-0 snap-start ${
              destacada ? 'w-[92%] sm:w-card-ancha' : 'w-[82%] sm:w-card'
            }`}
            key={entrada.id}
          >
            <TarjetaNoticia
              categoria={categoria?.nombre}
              minutos={tiempoDeLectura(entrada.contenido)}
              portadaAlt={portada?.alt}
              portadaUrl={portada?.url}
              /*
               * Ninguna lleva `priority`: con la portada ocupando la vista
               * entera no hay tarjeta visible al cargar, y adelantar sus
               * imagenes solo le robaria ancho de banda al video, que es el
               * LCP real de esta pantalla.
               */
              publicadoEn={entrada.publicadoEn}
              sizes={
                destacada ? '(min-width: 640px) 592px, 92vw' : '(min-width: 640px) 384px, 82vw'
              }
              slug={entrada.slug ?? ''}
              titulo={entrada.titulo}
            />
          </li>
        )
      })}
    </CarruselNoticias>
  )
}
