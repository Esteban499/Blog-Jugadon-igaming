/**
 * =========================================================================
 * MOLECULAS — dos o mas atomos que se leen como una sola unidad.
 *
 * No hablan con Payload: reciben primitivas (`string`, `number`, `boolean`) y
 * las dibujan. Quien traduce un documento de Payload a estas props es el
 * organismo que las agrupa. Esa frontera es lo que deja probar una tarjeta sin
 * levantar la base.
 *
 * Todas son Server Components, con una excepcion: `TarjetaGanador`,
 * `TarjetaPremioMayor` y `TarjetaShort` reciben un `onSeleccionar` opcional —el
 * que abre el modal de plataformas en las dos primeras y el reproductor en la
 * tercera— y con esa prop puesta solo pueden dibujarse dentro de un arbol
 * cliente. Sin ella siguen siendo fichas muertas y sirven en el servidor.
 *
 * Vale la misma regla del barril que en `atoms`: desde un archivo con
 * `'use client'` se importa el archivo directo, nunca este index.
 * =========================================================================
 */

export { AvisoEnLinea, type AvisoEnLineaProps } from './AvisoEnLinea'
export { BloqueCta, type BloqueCtaProps } from './BloqueCta'
export { Divisor, type DivisorProps } from './Divisor'
export { EncabezadoDeSeccion, type EncabezadoDeSeccionProps } from './EncabezadoDeSeccion'
export { EsqueletoDeTarjeta } from './EsqueletoDeTarjeta'
export { EstadoVacio, type EstadoVacioProps } from './EstadoVacio'
export { FilaDeFiltros, type FilaDeFiltrosProps, type OpcionDeFiltro } from './FilaDeFiltros'
export { FirmaAutor, type FirmaAutorProps } from './FirmaAutor'
export { Paginacion, type PaginacionProps } from './Paginacion'
export { TarjetaGanador, type TarjetaGanadorProps } from './TarjetaGanador'
export { TarjetaNoticia, type TarjetaNoticiaProps } from './TarjetaNoticia'
export { TarjetaPremioMayor, type TarjetaPremioMayorProps } from './TarjetaPremioMayor'
export { TarjetaPromocion, type TarjetaPromocionProps } from './TarjetaPromocion'
export { TarjetaPuntoDeVenta, type TarjetaPuntoDeVentaProps } from './TarjetaPuntoDeVenta'
export { TarjetaShort, type TarjetaShortProps } from './TarjetaShort'
