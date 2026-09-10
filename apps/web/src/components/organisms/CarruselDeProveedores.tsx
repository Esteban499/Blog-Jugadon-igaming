import Image from 'next/image'

/**
 * La cinta infinita de proveedores de juego, debajo de las noticias.
 *
 * No es un carrusel operable como el de noticias: aca no hay nada que elegir
 * ni adonde ir, es una prueba de respaldo. Por eso no lleva flechas ni snap y
 * se mueve sola, y por eso tambien es Server Component: todo el movimiento es
 * CSS —`.marquesina` en `styles.css`— y la home conserva un unico archivo
 * cliente.
 *
 * El truco del bucle esta en el markup: la lista va DOS veces. La primera es
 * la real; la segunda es una copia decorativa, marcada `aria-hidden` para que
 * un lector de pantalla no lea catorce marcas repetidas. La animacion corre
 * cada grupo `-100%` de su propio ancho, asi que cuando el original termina de
 * salir por la izquierda la copia esta exactamente donde el original arrancaba
 * y el ciclo no tiene costura.
 */

/**
 * Los archivos de `public/providers`, con el nombre de marca que corresponde a
 * cada logo y no el del archivo: varios vienen mal escritos de origen
 * (`pregmatic`) o abreviados (`ct_games`, que en el logo dice CT Interactive),
 * y ese texto es el que escucha quien no ve las imagenes.
 *
 * Todos los originales miden 300x150 y estan pensados para verse dentro de esa
 * caja: el que se recorte a su contenido —un logo circular contra uno
 * apaisado— rompe el equilibrio optico con el que fueron preparados. Por eso
 * el ancho y el alto son los mismos para los catorce y no hay medidas por
 * logo.
 */
const PROVEEDORES = [
  { nombre: 'Ainsworth', imagen: '/providers/ainsworth.png' },
  { nombre: 'Belatra Games', imagen: '/providers/belatra_games.png' },
  { nombre: 'Big Time Gaming', imagen: '/providers/big_time_games.png' },
  { nombre: 'CT Interactive', imagen: '/providers/ct_games.png' },
  { nombre: 'Endorphina', imagen: '/providers/endorphina.png' },
  { nombre: 'Evolution', imagen: '/providers/evolution.png' },
  { nombre: 'Mascot Gaming', imagen: '/providers/mascot_gaming.png' },
  { nombre: 'NetEnt', imagen: '/providers/netent.png' },
  { nombre: 'Nolimit City', imagen: '/providers/nolimit_city.png' },
  { nombre: 'Pragmatic Live', imagen: '/providers/pregmatic_live.png' },
  { nombre: 'Pragmatic Play', imagen: '/providers/pregmatic_play.png' },
  { nombre: 'Red Tiger', imagen: '/providers/red_tiger.png' },
  { nombre: 'Vibra Gaming', imagen: '/providers/vibra_gaming.png' },
  { nombre: 'Wizard Games', imagen: '/providers/wizard_games.png' },
] as const

/** Mitad del original: la caja de 2:1 en la que se dibujo cada logo. */
const ANCHO = 150
const ALTO = 75

/**
 * Un pase completo de la lista.
 *
 * `copia` marca al grupo decorativo: el atributo no es solo semantico, la
 * regla de `prefers-reduced-motion` lo usa como selector para esconderlo
 * cuando la cinta deja de moverse.
 */
function Grupo({ copia = false }: { copia?: boolean }) {
  return (
    <ul aria-hidden={copia || undefined} className="marquesina-grupo">
      {PROVEEDORES.map((proveedor) => (
        <li className="shrink-0" key={proveedor.nombre}>
          <Image
            /*
             * En la copia el alt va vacio: el grupo entero ya esta fuera del
             * arbol de accesibilidad, y un alt con texto ahi solo seria ruido
             * si alguna vez se saca el `aria-hidden`.
             */
            alt={copia ? '' : proveedor.nombre}
            /*
             * Los logos vienen en color y asi se quedan: son marcas de
             * terceros y aplanarlas a blanco —lo que si se hace con los
             * reguladores del pie (§5.9)— seria alterar una identidad ajena.
             * El 75% de opacidad es lo que evita que catorce paletas distintas
             * le griten mas fuerte que las noticias de arriba; al pasar el
             * mouse la cinta se frena y el logo apuntado vuelve a su color
             * pleno.
             */
            className="h-auto w-[120px] opacity-75 transition-opacity duration-150 ease-marca hover:opacity-100 md:w-[150px]"
            height={ALTO}
            /*
             * Sin `priority` y sin excepciones: esta franja vive debajo de la
             * portada a pantalla completa y de las noticias, asi que no hay
             * ningun logo visible al cargar.
             */
            src={proveedor.imagen}
            width={ANCHO}
          />
        </li>
      ))}
    </ul>
  )
}

export function CarruselDeProveedores() {
  return (
    <section aria-labelledby="titulo-proveedores" className="pb-18 md:pb-32">
      {/*
       * Rotulo en la utilitaria a 12px, igual que el "Seguinos en" del pie:
       * esto es una firma de respaldo, no una seccion editorial, y un titulo
       * de seccion en la display competiria con las noticias de arriba.
       */}
      <h2
        className="contenedor font-util text-legal text-apagado uppercase"
        id="titulo-proveedores"
      >
        Nuestros proveedores
      </h2>

      {/*
       * La cinta va a sangre —no entra en el contenedor— porque solo asi se
       * lee como algo que sigue mas alla de la ventana. El desvanecido de los
       * bordes lo pone `.marquesina`.
       */}
      <div className="marquesina mt-6 md:mt-8">
        <Grupo />
        <Grupo copia />
      </div>
    </section>
  )
}
