import { type Flavor, LIGHT, layers } from '@protomaps/basemaps'
import type { MapOptions } from 'maplibre-gl'

/**
 * Todo lo que el mapa necesita saber de MapLibre y Protomaps.
 *
 * Son tres cosas que no tienen por que vivir dentro del componente: la
 * traduccion de la paleta del mapa al formato de estilos de MapLibre, el armado
 * del estilo completo, y las dos URLs que se arman a mano.
 *
 * **Por que no hay tipos propios de la API aca.** La version anterior de este
 * archivo declaraba a mano la superficie de Google Maps, porque esa API llega
 * por un `<script>` y no trae tipos. MapLibre es una dependencia de npm: los
 * tipos vienen con el paquete y se importan.
 *
 * El mapa se sirve de un unico archivo `.pmtiles` en el bucket propio, leido por
 * rangos HTTP. No hay clave, ni cuota, ni facturacion: el costo es el storage
 * del archivo, que en R2 no paga egress.
 */

/* ========================================================================= */
/* EL SABOR: LA UNICA PANTALLA QUE NO VA EN LA PALETA DEL SITIO              */
/* ========================================================================= */

/**
 * Lee un token del mapa tal como lo resolvio el navegador.
 *
 * Los `--mapa-*` viven en el bloque MAPA de `styles.css`, aparte de los
 * `--color-*` del sistema y a proposito: el basemap es una excepcion pedida al
 * manual de marca, y tenerlos separados es lo que evita que la excepcion se
 * filtre al resto del sitio. El comentario largo de esa seccion cuenta por que.
 *
 * Que se lean del CSS en vez de escribirse aca sigue siendo por lo de siempre:
 * un color, un solo lugar. `styles.css` los usa para la atribucion y los
 * controles de MapLibre, este archivo para las capas del mapa, y los dos miran
 * la misma linea.
 *
 * MapLibre acepta cualquier color CSS valido y no solo hex, asi que un token en
 * `rgba()` tambien sirve, sin tener que inventarle un equivalente opaco.
 */
export const leerToken = (nombre: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()

/**
 * La paleta del mapa, en el formato que espera Protomaps.
 *
 * Un "flavor" son los ~70 colores con los que Protomaps arma sus capas. Se parte
 * del claro que trae el paquete y se pisan los que se ven; el resto —tipos de
 * suelo que en las cinco jurisdicciones del archivo casi no aparecen— queda en
 * su valor de fabrica, que ya es claro y no desentona.
 *
 * **El objetivo es que se lea como Google Maps**, que es el mapa que la gente ya
 * sabe leer: tierra gris muy clara, agua celeste, calles blancas con contorno
 * gris, autopistas amarillas y verdes pastel para los parques. La jerarquia es
 * la de cualquier mapa de calles y no la del sistema de diseno: aca el color
 * separa *tipos de cosa* —agua, verde, asfalto—, no niveles de superficie.
 *
 * Se construye en el navegador, despues del montaje, porque `getComputedStyle`
 * necesita el documento. Por eso es una funcion y no una constante.
 */
export const saborGoogle = (): Flavor => {
  const fuera = leerToken('--mapa-fuera')
  const tierra = leerToken('--mapa-tierra')
  const agua = leerToken('--mapa-agua')
  const verde = leerToken('--mapa-verde')
  const verdeFuerte = leerToken('--mapa-verde-fuerte')
  const arena = leerToken('--mapa-arena')
  const edificio = leerToken('--mapa-edificio')
  const recinto = leerToken('--mapa-recinto')
  const recintoCalido = leerToken('--mapa-recinto-calido')
  const salud = leerToken('--mapa-salud')
  const aeropuerto = leerToken('--mapa-aeropuerto')
  const calle = leerToken('--mapa-calle')
  const calleBorde = leerToken('--mapa-calle-borde')
  const calleBordeFuerte = leerToken('--mapa-calle-borde-fuerte')
  const autopista = leerToken('--mapa-autopista')
  const autopistaBorde = leerToken('--mapa-autopista-borde')
  const riel = leerToken('--mapa-riel')
  const limite = leerToken('--mapa-limite')
  const rotulo = leerToken('--mapa-rotulo')
  const rotuloSuave = leerToken('--mapa-rotulo-suave')
  const rotuloTenue = leerToken('--mapa-rotulo-tenue')
  const rotuloAgua = leerToken('--mapa-rotulo-agua')
  const halo = leerToken('--mapa-halo')

  return {
    ...LIGHT,

    /*
     * `background` es lo que se ve donde no hay datos, y no es lo mismo que la
     * tierra: el archivo cubre cinco jurisdicciones y no el pais, asi que ese
     * gris un punto mas oscuro es el borde real del mapa y conviene que se note.
     */
    background: fuera,
    earth: tierra,
    water: agua,

    /*
     * Verde en dos tonos —el claro para las manchas chicas, el fuerte para las
     * grandes— y no uno solo: es lo que hace que una plaza de barrio y una
     * reserva no pesen igual, que es justo lo que hace Google.
     */
    park_a: verde,
    park_b: verdeFuerte,
    wood_a: verde,
    wood_b: verdeFuerte,
    scrub_a: verde,
    scrub_b: verde,
    zoo: verde,

    sand: arena,
    beach: arena,
    /* No hay glaciares en CABA, Cordoba, La Rioja, San Luis ni Santa Fe. */
    glacier: tierra,

    /*
     * Predios con nombre. El rosa de salud y el tostado de las escuelas son los
     * dos unicos usos de suelo que Google se molesta en distinguir por color;
     * el resto va al mismo gris y se lee por el rotulo.
     */
    hospital: salud,
    school: recintoCalido,
    pedestrian: recintoCalido,
    industrial: recinto,
    military: recinto,
    aerodrome: aeropuerto,
    runway: calle,
    pier: calle,
    buildings: edificio,

    /*
     * Calles: blancas, con el contorno gris haciendo todo el trabajo de
     * separarlas. La jerarquia no la da el relleno sino el ancho —eso lo pone
     * Protomaps— y el contorno, que en las importantes es un punto mas marcado.
     * Lo unico con color propio son las autopistas, en el amarillo de Google.
     */
    other: calle,
    minor_service: calle,
    minor_a: calle,
    minor_b: calle,
    major: calle,
    link: autopista,
    highway: autopista,
    minor_service_casing: calleBorde,
    minor_casing: calleBorde,
    link_casing: autopistaBorde,
    major_casing_early: calleBordeFuerte,
    major_casing_late: calleBordeFuerte,
    highway_casing_early: autopistaBorde,
    highway_casing_late: autopistaBorde,

    /*
     * Los tuneles van en gris: es la forma de decir "esto pasa por abajo" sin
     * tener que sacarlos del mapa.
     */
    tunnel_other: calleBorde,
    tunnel_minor: calleBorde,
    tunnel_link: calleBorde,
    tunnel_major: calleBorde,
    tunnel_highway: calleBorde,
    tunnel_other_casing: calleBordeFuerte,
    tunnel_minor_casing: calleBordeFuerte,
    tunnel_link_casing: calleBordeFuerte,
    tunnel_major_casing: calleBordeFuerte,
    tunnel_highway_casing: calleBordeFuerte,

    /*
     * Los puentes son la calle de siempre con el contorno fuerte, que es lo que
     * los despega de aquello que cruzan.
     */
    bridges_other: calle,
    bridges_minor: calle,
    bridges_major: calle,
    bridges_link: autopista,
    bridges_highway: autopista,
    bridges_other_casing: calleBordeFuerte,
    bridges_minor_casing: calleBordeFuerte,
    bridges_major_casing: calleBordeFuerte,
    bridges_link_casing: autopistaBorde,
    bridges_highway_casing: autopistaBorde,

    railway: riel,
    boundaries: limite,

    /*
     * Rotulos: tres grises, del mas oscuro para las ciudades al mas tenue para
     * las alturas. El halo siempre blanco, que es lo que los deja leer cuando
     * caen sobre una calle o sobre el agua.
     */
    city_label: rotulo,
    city_label_halo: halo,
    country_label: rotulo,
    state_label: rotuloSuave,
    state_label_halo: halo,
    subplace_label: rotuloSuave,
    subplace_label_halo: halo,
    roads_label_major: rotuloSuave,
    roads_label_major_halo: halo,
    roads_label_minor: rotuloTenue,
    roads_label_minor_halo: halo,
    address_label: rotuloTenue,
    address_label_halo: halo,
    ocean_label: rotuloAgua,

    /*
     * El manto de baja resolucion, que es lo unico que se ve en el encuadre de
     * arranque. Casi todo en tierra a proposito: a esa distancia Google es un
     * pais gris claro con manchas verdes donde de verdad hay monte, y no un
     * tablero de colores.
     */
    landcover: {
      urban_area: edificio,
      forest: verde,
      grassland: tierra,
      farmland: tierra,
      scrub: tierra,
      barren: tierra,
      glacier: tierra,
    },
  }
}

/* ========================================================================= */
/* EL ESTILO COMPLETO                                                        */
/* ========================================================================= */

/**
 * La atribucion. **No es opcional ni decorativa.**
 *
 * Los datos son de OpenStreetMap, que se licencia bajo ODbL: mostrar el credito
 * es una condicion de uso, no una cortesia. MapLibre la dibuja sola a partir de
 * este campo; lo unico que se hace en `styles.css` es llevarla a la paleta del
 * sitio, nunca esconderla.
 */
export const ATRIBUCION =
  '<a href="https://github.com/protomaps/basemaps" rel="noopener" target="_blank">Protomaps</a> © <a href="https://osm.org/copyright" rel="noopener" target="_blank">OpenStreetMap</a>'

export interface OpcionesDeEstilo {
  /** La URL publica del `.pmtiles`, sin el prefijo `pmtiles://`. */
  urlDelArchivo: string
  /** De donde salen las tipografias de los rotulos. */
  urlDeGlifos: string
}

/**
 * El estilo que consume MapLibre: fuentes de datos, capas y tipografias.
 *
 * **Sin sprite, y por eso se filtran las capas con icono.** El sprite es la
 * lamina de iconitos que Protomaps usa para los puntos de interes y las flechas
 * de sentido unico. Se descarta por la misma razon por la que antes se apagaban
 * los POI de Google: la pantalla existe para encontrar una sala de Jugadon, y un
 * mapa lleno de restaurantes y estaciones de servicio compite con los
 * marcadores. Sacar esas capas ademas evita una segunda descarga externa: sin
 * ellas, el unico pedido a un tercero son los glifos.
 */
export const estiloDelMapa = ({
  urlDeGlifos,
  urlDelArchivo,
}: OpcionesDeEstilo): NonNullable<MapOptions['style']> => ({
  version: 8,
  glyphs: urlDeGlifos,
  sources: {
    protomaps: {
      type: 'vector',
      url: `pmtiles://${urlDelArchivo}`,
      attribution: ATRIBUCION,
    },
  },
  layers: layers('protomaps', saborGoogle(), { lang: 'es' }).filter(
    (capa) => !('layout' in capa && capa.layout && 'icon-image' in capa.layout),
  ),
})

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
