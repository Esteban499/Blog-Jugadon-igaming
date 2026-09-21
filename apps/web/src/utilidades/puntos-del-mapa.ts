import type { FilterSpecification } from 'maplibre-gl'

/**
 * Lo liviano del mapa: los nombres de la fuente y de las capas, los filtros del
 * punto elegido y las dos cosas que se arman a mano, el enlace para llegar y el
 * encuadre de arranque.
 *
 * Vive aparte de `utilidades/mapa.ts` por el peso, no por el tema. Aquel
 * archivo importa `@protomaps/basemaps` para armar el estilo, y el componente
 * lo pide con `import()` recien cuando va a crear el mapa, junto con MapLibre:
 * son los kilobytes que no hacen falta para mostrar el buscador y la ficha.
 * Esto, en cambio, el componente lo necesita desde el primer render, y si
 * viviera alla arrastraria el estilo entero al bundle inicial.
 *
 * Del paquete de MapLibre solo se importan tipos, que no llegan al bundle.
 */

/* ========================================================================= */
/* LA FUENTE Y LAS CAPAS                                                     */
/* ========================================================================= */

/**
 * Los mil cuatrocientos puntos son una fuente GeoJSON, no mil cuatrocientos
 * marcadores.
 *
 * La version anterior de esta pantalla dibujaba un `<button>` por local y
 * andaba bien, porque habia catorce. Con el listado entero eso son mil
 * cuatrocientos nodos del DOM que el navegador tiene que reposicionar en cada
 * cuadro de un arrastre: el mapa deja de seguir al dedo. Pasados a una fuente,
 * los dibuja la GPU junto con el resto del mapa, y arrastrar cuesta lo mismo
 * con catorce que con mil cuatrocientos.
 *
 * Lo que se pierde es que el marcador ya no es un elemento de verdad: no entra
 * en el orden de tabulacion ni lo anuncia el lector de pantalla. **Ese trabajo
 * pasa al buscador**, que alcanza cualquier local por su nombre con el teclado,
 * y a la ficha del elegido, que dice lo mismo que diria el marcador.
 */
export const ID_FUENTE_DE_PUNTOS = 'puntos-de-venta'

export const CAPAS = {
  puntos: 'puntos-sueltos',
  elegido: 'punto-elegido',
} as const

/**
 * **Sin agrupamiento, a proposito.** La fuente lleva `cluster: false` y no hay
 * capa de cumulos: cada local es su propio circulo en todos los zooms.
 *
 * Lo contrario —juntar los cercanos en una burbuja con el total adentro— es lo
 * que hace cualquier mapa con esta cantidad de puntos, y es lo que estuvo un
 * rato aca. Se saco porque cambia lo que la pantalla es: con cumulos, el
 * encuadre de arranque muestra doce burbujas con numeros y hay que ir abriendo
 * hasta llegar a un local; sin ellos, se ve de una donde hay locales y donde no,
 * que es la pregunta con la que alguien entra.
 *
 * El costo esta a la vista y se acepta: en el encuadre de pais, los cuatrocientos
 * de CABA y los seiscientos de Cordoba son dos manchas azules donde no se
 * distingue uno del otro. La salida es acercar el mapa, usar los filtros o
 * buscar el local por su nombre.
 *
 * Lo que **no** cambia es que los puntos siguen siendo una fuente GeoJSON y no
 * marcadores: eso es lo que hace que arrastrar el mapa cueste lo mismo con
 * catorce que con mil cuatrocientos, y no tiene nada que ver con agrupar.
 */

/** El filtro de la capa del elegido cuando no hay ninguno: no matchea nada. */
export const SIN_ELEGIDO: FilterSpecification = ['==', ['get', 'id'], -1]

/** Y cuando si lo hay. */
export const filtroDelElegido = (id: number): FilterSpecification => ['==', ['get', 'id'], id]

/* ========================================================================= */
/* ENLACES Y ENCUADRE                                                        */
/* ========================================================================= */

export interface Coordenada {
  lat: number
  lng: number
}

/**
 * "Como llegar", contra las coordenadas y no contra el nombre del local.
 *
 * Sigue apuntando a Google Maps aunque el mapa del sitio ya no sea de Google:
 * es un enlace a una app que la gente tiene instalada y sabe usar, no una
 * llamada a una API, asi que no cuesta nada ni ata el sitio a nada.
 */
export const urlDeComoLlegar = ({ lat, lng }: Coordenada): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

/**
 * El centro y el zoom de arranque, para cuando no hay ningun punto que encuadrar.
 *
 * Con puntos cargados nunca se usa: el mapa hace `fitBounds` sobre ellos.
 *
 * Ojo con el orden: MapLibre trabaja en `[lng, lat]`, al reves que Google. Es la
 * fuente de error mas comun al portar codigo de una API a la otra —un punto en
 * Argentina cae en el Indico— y por eso el centro se declara aca una vez.
 */
export const ENCUADRE_ARGENTINA = {
  centro: [-63.6167, -38.4161] as [number, number],
  zoom: 3.4,
} as const
