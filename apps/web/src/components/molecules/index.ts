/**
 * =========================================================================
 * MOLECULAS — dos o mas atomos que se leen como una sola unidad.
 *
 * No hablan con Payload: reciben primitivas (`string`, `number`, `boolean`) y
 * las dibujan. Quien traduce un documento de Payload a estas props es el
 * organismo que las agrupa. Esa frontera es lo que deja probar una tarjeta sin
 * levantar la base.
 *
 * Todas son Server Components. Vale la misma regla del barril que en `atoms`:
 * desde un archivo con `'use client'` se importa el archivo directo, nunca este
 * index.
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
export { TarjetaNoticia, type TarjetaNoticiaProps } from './TarjetaNoticia'
export { TarjetaPromocion, type TarjetaPromocionProps } from './TarjetaPromocion'
export { TarjetaPuntoDeVenta, type TarjetaPuntoDeVentaProps } from './TarjetaPuntoDeVenta'
