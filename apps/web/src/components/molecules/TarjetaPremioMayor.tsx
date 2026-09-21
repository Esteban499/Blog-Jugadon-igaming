import Image from 'next/image'

// Archivos directos y no barril: esta tarjeta se dibuja dentro del arbol
// cliente de la seccion de ganadores. Ver `atoms/index.ts`.
import { SinPortada } from '@/components/atoms/SinPortada'
import { Tag } from '@/components/atoms/Tag'

/**
 * El premio mas alto de las cuatro jurisdicciones, en su propio bloque.
 *
 * Es la misma tarjeta que las de la pista con la escala corrida un escalon:
 * el monto sube de `text-card` a `text-h2` y aparece el eyebrow naranja, que
 * es lo unico que distingue al primero del resto. No cambia de color de fondo
 * ni se le agrega un borde permanente: el manual rechaza las cards con borde y
 * fondo diferenciado a la vez (§9), y el tamano ya alcanza para que se lea
 * primero.
 *
 * Igual que `TarjetaGanador`, con `onSeleccionar` toda la tarjeta se vuelve
 * tocable y deja de ser un Server Component; el disparador es un boton sobre el
 * monto con el `::after` estirado.
 *
 * Aca si se escribe el nombre del juego —a diferencia de `TarjetaGanador`—
 * porque el alto sobrante existe: la tarjeta se estira hasta igualar las dos
 * filas de la pista, y ese aire hay que llenarlo con contenido y no con
 * espacio muerto.
 *
 * La imagen es la VERTICAL del catalogo (420x588), al reves que en la pista,
 * que usa la cuadrada. Es la que le corresponde a la forma del hueco: esta
 * tarjeta se estira hasta igualar las dos filas de la pista, o sea que es mucho
 * mas alta que ancha, y un original apaisado ahi solo se puede resolver
 * agrandandolo y comiendose los costados. El retrato entra casi entero.
 */

export interface TarjetaPremioMayorProps {
  /** El premio ya formateado en pesos, del tipo `$1.836.113`. */
  premio: string
  /**
   * Que hacer al tocar la tarjeta. Sin esto queda como ficha muerta, que es lo
   * que corresponde si algun dia se dibuja en un contexto sin modal.
   */
  onSeleccionar?: () => void
  /** El nombre ya ofuscado, del tipo `JE****82`. */
  jugador: string
  juego: string
  jurisdiccion: string
  imagenUrl?: string | null
}

export function TarjetaPremioMayor({
  imagenUrl,
  juego,
  jugador,
  jurisdiccion,
  onSeleccionar,
  premio,
}: TarjetaPremioMayorProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-caja border border-transparent bg-superficie transition-colors duration-250 ease-marca hover:border-accion-contorno hover:bg-elevada">
      {/*
       * Dos regimenes, uno por breakpoint, y el corte es `lg` porque es donde
       * la seccion pasa a dos columnas y esta tarjeta empieza a estirarse.
       *
       * Debajo de `lg` la tarjeta mide lo que mide su contenido, asi que la
       * imagen se queda con la proporcion exacta del original —420x588— y no se
       * recorta ni un pixel.
       *
       * De `lg` para arriba manda la grilla: `flex-1` le da a la imagen todo lo
       * que sobra despues del texto. Cae en torno a 324x475, casi la proporcion
       * del original, con un recorte minimo de los costados. Ya no hace falta
       * ningun techo: el problema que lo pedia era estirar un apaisado a un
       * hueco alto, y el retrato no lo tiene.
       */}
      <div className="relative aspect-[420/588] w-full overflow-hidden lg:aspect-auto lg:min-h-0 lg:flex-1 lg:basis-0">
        {imagenUrl ? (
          <Image
            alt={juego}
            className="object-cover"
            fill
            /*
             * Sin `priority`, igual que las de la pista: al cargar la pagina
             * esto esta muy por debajo de la portada a pantalla completa.
             */
            sizes="(min-width: 1024px) 326px, 100vw"
            src={imagenUrl}
          />
        ) : (
          <SinPortada className="absolute inset-0" />
        )}
      </div>

      {/*
       * El texto no se estira: `shrink-0` y punto. Todo el sobrante se lo lleva
       * la imagen de arriba, que es la que sabe que hacer con el.
       */}
      <div className="flex shrink-0 flex-col items-start gap-3 p-5 md:p-6">
        {/*
         * El unico naranja de la seccion, y el unico elemento que dice que
         * esta tarjeta es el numero uno. Sin medalla, sin "#1" y sin corona:
         * el eyebrow es como el sistema rotula jerarquia (§5.3).
         */}
        <p className="font-util text-eyebrow text-accion uppercase">Premio mayor</p>

        {/*
         * `text-h2` es fluido y ya baja solo en pantallas chicas, asi que un
         * monto de siete cifras no rompe la tarjeta cuando pasa a ancho
         * completo en el telefono.
         */}
        <p className="font-display text-h2 text-tinta">
          {onSeleccionar ? (
            <button
              aria-label={`Premio mayor de ${premio} en ${jurisdiccion}. Ver dónde jugar`}
              className="cursor-pointer text-left after:absolute after:inset-0 after:content-['']"
              onClick={onSeleccionar}
              type="button"
            >
              {premio}
            </button>
          ) : (
            premio
          )}
        </p>

        <p className="font-util text-meta text-parrafo uppercase">{jugador}</p>

        <p className="line-clamp-2 text-legal text-apagado text-pretty">{juego}</p>

        {/* Sin `href`: informa de donde salio el premio, no filtra nada. */}
        <div className="pt-1">
          <Tag>{jurisdiccion}</Tag>
        </div>
      </div>
    </article>
  )
}
