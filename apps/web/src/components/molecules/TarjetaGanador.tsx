import Image from 'next/image'

// Archivos directos y no barril: esta tarjeta se dibuja dentro del arbol
// cliente de la seccion de ganadores. Ver `atoms/index.ts`.
import { SinPortada } from '@/components/atoms/SinPortada'
import { Tag } from '@/components/atoms/Tag'

/**
 * Un premio de la pista de ultimos ganadores: del segundo al trigesimo.
 *
 * Lleva los cuatro datos y ni uno mas —imagen del juego, premio, jugador
 * ofuscado y jurisdiccion—, en ese orden de peso. El nombre del juego no se
 * escribe: la imagen ya lo dice, y una cuarta linea empujaria la pista a mas de
 * la mitad de la ventana. Quien no ve la imagen lo recibe igual, por el `alt`.
 *
 * La imagen es la CUADRADA del catalogo, no la apaisada recortada: son dos
 * recortes distintos hechos por la plataforma, y el arte del cuadrado esta
 * compuesto para esa caja. Recortar el apaisado a 1:1 se come el titulo del
 * juego y el logo del proveedor, que es lo que hace reconocible la miniatura a
 * este tamano.
 *
 * El premio va en la display y en el blanco de tinta porque es el unico dato
 * que la seccion existe para mostrar; el resto baja a parrafo y a la pildora
 * azul. Nada va en naranja: el acento ya lo tienen los eyebrows de las
 * noticias, un poco mas arriba en la misma pantalla (§2).
 *
 * Recibe primitivas, como todas las moleculas: el monto llega ya escrito en
 * pesos desde el servidor y el nombre ya llega tapado. Esta tarjeta no sabe
 * formatear ni ofuscar, y sobre todo nunca ve un nombre de usuario real.
 *
 * Con `onSeleccionar` toda la tarjeta se vuelve tocable, y ahi deja de ser un
 * Server Component: la excepcion a la regla del barril de `molecules`. El
 * disparador real es un boton chico sobre el monto, con el `::after` estirado
 * sobre la tarjeta entera; es el mismo truco de `TarjetaNoticia`, y sirve para
 * lo mismo: quien navega con lector de pantalla escucha el premio y no "boton,
 * imagen".
 */

export interface TarjetaGanadorProps {
  /** El premio ya formateado en pesos, del tipo `$1.836.113`. */
  premio: string
  /**
   * Que hacer al tocar la tarjeta. Sin esto queda como ficha muerta, que es lo
   * que corresponde si algun dia se lista en un contexto sin modal.
   */
  onSeleccionar?: () => void
  /** El nombre ya ofuscado, del tipo `JE****82`. */
  jugador: string
  /** Nombre del juego. No se dibuja: es el texto alternativo de la imagen. */
  juego: string
  jurisdiccion: string
  imagenUrl?: string | null
}

export function TarjetaGanador({
  imagenUrl,
  juego,
  jugador,
  jurisdiccion,
  onSeleccionar,
  premio,
}: TarjetaGanadorProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-caja border border-transparent bg-superficie transition-colors duration-250 ease-marca hover:border-accion-contorno hover:bg-elevada">
      {/*
       * La imagen crece, el texto no. Las dos filas de la pista miden lo mismo
       * y el bloque de texto siempre ocupa igual, asi que sin esto la tarjeta
       * reparte el alto sobrante como espacio vacio debajo de la pildora.
       *
       * `basis` iguala al ancho de columna que fija la pista (10.4rem), o sea
       * que el punto de partida es el 1:1 exacto para el que fue dibujado el
       * cuadrado. De ahi solo sube, y lo que sube es el sobrante de la fila.
       */}
      <div className="relative min-h-0 w-full flex-1 basis-[10.4rem] overflow-hidden">
        {imagenUrl ? (
          <Image
            alt={juego}
            className="object-cover"
            fill
            /*
             * La pista vive debajo de la portada a pantalla completa y de las
             * noticias: no hay ninguna de estas imagenes visible al cargar, asi
             * que ninguna lleva `priority`.
             */
            sizes="167px"
            src={imagenUrl}
          />
        ) : (
          <SinPortada className="absolute inset-0" />
        )}
      </div>

      <div className="flex shrink-0 flex-col items-start gap-2 p-4">
        <p className="font-display text-card text-tinta">
          {onSeleccionar ? (
            /*
             * El `aria-label` repite lo que la tarjeta ya muestra porque el
             * boton solo envuelve el monto: sin el, en una pista de
             * veintinueve, el lector de pantalla anunciaria nada mas que una
             * cifra suelta sin decir de donde salio ni que pasa al tocarla.
             */
            <button
              aria-label={`Premio de ${premio} en ${jurisdiccion}. Ver dónde jugar`}
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

        {/*
         * El nombre tapado va en la utilitaria en mayusculas, que es como el
         * sistema escribe los metadatos. Ademas es la familia que mejor sostiene
         * los cuatro asteriscos sin que parezcan un error de carga.
         */}
        <p className="font-util text-meta text-parrafo uppercase">{jugador}</p>

        {/* Sin `href`: informa de donde salio el premio, no filtra nada. */}
        <div className="pt-1">
          <Tag>{jurisdiccion}</Tag>
        </div>
      </div>
    </article>
  )
}
