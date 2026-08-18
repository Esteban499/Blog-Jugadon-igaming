/**
 * =========================================================================
 * PLANTILLAS — el esqueleto visual de una pantalla, sin datos.
 *
 * Reciben nodos por props y los acomodan. **No consultan a Payload ni conocen
 * la forma de un documento**: una plantilla de listado no sabe si adentro hay
 * notas o bonos, y por eso las dos pantallas de listado del sitio comparten
 * una sola.
 *
 * Aca viven las cuentas de maqueta que no pueden estar en dos lugares a la vez
 * —el solapamiento de la portada anclada, el ancho de la columna de lectura—.
 *
 * Quien las llena es `page.tsx`, que obtiene los datos y le pasa organismos.
 * =========================================================================
 */

export { PlantillaDeArticulo, type PlantillaDeArticuloProps } from './PlantillaDeArticulo'
export { PlantillaDeListado, type PlantillaDeListadoProps } from './PlantillaDeListado'
export { PlantillaDePortada, type PlantillaDePortadaProps } from './PlantillaDePortada'
export { PlantillaDelSitio, type PlantillaDelSitioProps } from './PlantillaDelSitio'

/* Las variantes en carga, que consumen los `loading.tsx` de cada ruta. */
export {
  PlantillaDeArticuloCargando,
  type PlantillaDeArticuloCargandoProps,
} from './PlantillaDeArticuloCargando'
export {
  PlantillaDeListadoCargando,
  type PlantillaDeListadoCargandoProps,
} from './PlantillaDeListadoCargando'
export {
  PlantillaDeMapaCargando,
  type PlantillaDeMapaCargandoProps,
} from './PlantillaDeMapaCargando'
