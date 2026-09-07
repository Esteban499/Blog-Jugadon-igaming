import Image from 'next/image'

/*
 * Archivos directos y no barril: esta tarjeta se dibuja dentro del arbol
 * cliente del carrusel de shorts. Ver `atoms/index.ts`.
 */
import { IconoPlay } from '@/components/atoms/iconos/IconoPlay'

/**
 * Un short del canal: miniatura vertical y titulo, y nada mas.
 *
 * **No monta el reproductor.** Quince `<iframe>` de YouTube en la portada son
 * quince documentos con su propio JavaScript y sus propias cookies de terceros,
 * varios megas antes de que nadie toque nada, en una pantalla donde ademas ya
 * hay un video de fondo. Lo que se dibuja aca es la fachada —imagen y boton— y
 * el reproductor real lo monta `CarruselDeShorts` recien cuando se elige uno,
 * en un modal y de a uno por vez. El costo de la seccion pasa a ser una imagen
 * por tarjeta.
 *
 * La caja es 9:16 y la imagen entra con `object-cover`, que en el caso normal
 * no recorta nada: `utilidades/shorts` entrega el fotograma en su proporcion
 * nativa —1080x1920— siempre que YouTube lo tenga. El `object-cover` esta por
 * el caso de reserva, que es un 1280x720 apaisado con el cuadro vertical en el
 * centro: ahi el recorte se come las franjas de los costados y deja a la vista
 * el cuadro original. Ver `miniaturaDe`.
 *
 * El disparador real es un boton chico sobre el titulo, con el `::after`
 * estirado sobre la tarjeta entera: es el mismo truco de `TarjetaNoticia` y de
 * `TarjetaGanador`, y sirve para lo mismo, que quien navega con lector de
 * pantalla escuche el titulo del short y no "boton, imagen".
 *
 * Con `onSeleccionar` puesta deja de ser un Server Component, como las dos
 * tarjetas de ganadores. Sin ella queda como ficha muerta, que es lo que
 * corresponde el dia que se liste un short en un contexto sin modal.
 */

export interface TarjetaShortProps {
  titulo: string
  /** La URL de la miniatura, ya normalizada por `utilidades/shorts`. */
  miniatura: string
  /** Que hacer al tocar la tarjeta. Sin esto queda como ficha muerta. */
  onSeleccionar?: () => void
}

export function TarjetaShort({ miniatura, onSeleccionar, titulo }: TarjetaShortProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-caja border border-transparent bg-superficie transition-colors duration-250 ease-marca hover:border-accion-contorno hover:bg-elevada">
      <div className="relative aspect-[9/16] w-full overflow-hidden">
        {/*
         * Sin condicional ni `SinPortada` detras: la miniatura no es un campo
         * que el origen pueda no traer, es una URL que `utilidades/shorts` arma
         * a partir del id, asi que siempre hay una. El caso vacio que cubren las
         * otras tarjetas del sistema —una nota publicada sin portada— aca no
         * existe, y dejar la rama igual seria codigo que nadie puede alcanzar.
         */}
        <Image
          alt=""
          className="object-cover transition-transform duration-250 ease-marca group-hover:scale-[1.03]"
          fill
          /*
           * La seccion vive debajo de la portada a pantalla completa, de las
           * noticias y de los ultimos ganadores: no hay ninguna de estas
           * imagenes visible al cargar, asi que ninguna lleva `priority`.
           *
           * El `alt` va vacio a proposito: el titulo esta escrito abajo, en
           * texto, y repetirlo aca haria que el lector de pantalla lo lea dos
           * veces por tarjeta.
           */
          sizes="208px"
          src={miniatura}
        />

        {/*
         * El velo sube con el hover y no esta siempre: apagado, la miniatura se
         * ve como la publico el canal; encendido, sostiene el contraste de la
         * pastilla contra un fotograma claro.
         */}
        <span
          aria-hidden
          className="absolute inset-0 bg-fondo/0 transition-colors duration-250 ease-marca group-hover:bg-fondo/30"
        />

        {/*
         * La pastilla de play es lo unico naranja de la tarjeta, y es el unico
         * elemento de accion que tiene (§2). Vive sobre la imagen, centrada,
         * porque es la convencion de todo reproductor y no hay nada que ganar
         * inventando otra.
         */}
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accion text-fondo transition-colors duration-250 ease-marca group-hover:bg-accion-hover"
        >
          <IconoPlay className="size-6" />
        </span>

      </div>

      <div className="flex shrink-0 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-card text-tinta text-pretty">
          {onSeleccionar ? (
            <button
              aria-label={`Reproducir el short: ${titulo}`}
              className="cursor-pointer text-left after:absolute after:inset-0 after:content-['']"
              onClick={onSeleccionar}
              type="button"
            >
              {titulo}
            </button>
          ) : (
            titulo
          )}
        </h3>
      </div>
    </article>
  )
}
