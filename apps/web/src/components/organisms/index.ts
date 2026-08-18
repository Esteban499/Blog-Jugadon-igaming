/**
 * =========================================================================
 * ORGANISMOS — secciones completas de la interfaz.
 *
 * Es el primer nivel que puede conocer el dominio: aca se traducen los
 * documentos de Payload (`Post`, `Promocion`, `Category`) a las props de las
 * moleculas, y aca vive el estado local de lo que se opera con el mouse.
 *
 * Cinco llevan `'use client'` —`Navbar`, `CarruselNoticias`, `VideoHero`,
 * `PanelDeFiltros` y `MapaDePuntosDeVenta`— y son los unicos del sitio junto
 * con el boton del panel. Todos los demas se renderizan en el servidor.
 *
 * REGLA DEL BARRIL: este index lo consumen rutas y plantillas, que son Server
 * Components. Un archivo con `'use client'` no debe importarlo: desde el lado
 * cliente se importa siempre el archivo directo.
 *
 * `admin/BotonScrapear` no se exporta aca a proposito: no es parte del sitio
 * publico y Payload lo carga por ruta desde su import map, no por import.
 * =========================================================================
 */

export { CarruselNoticias, type CarruselNoticiasProps } from './CarruselNoticias'
export { CierreDeArticulo, type CierreDeArticuloProps } from './CierreDeArticulo'
export { CierreDePromocion, type CierreDePromocionProps } from './CierreDePromocion'
export { CondicionesDePromocion, type CondicionesDePromocionProps } from './CondicionesDePromocion'
export { Contenido, type ContenidoProps } from './Contenido'
export { FichaDePromocion, type FichaDePromocionProps } from './FichaDePromocion'
export { FiltrosDeCategoria, type FiltrosDeCategoriaProps } from './FiltrosDeCategoria'
export {
  FiltrosDePromociones,
  type FiltrosDePromocionesProps,
  type SeleccionDePromociones,
} from './FiltrosDePromociones'
export {
  FiltrosDePuntosDeVenta,
  type FiltrosDePuntosDeVentaProps,
  type SeleccionDePuntos,
} from './FiltrosDePuntosDeVenta'
export { Footer } from './Footer'
export { GrillaDeNoticias, type GrillaDeNoticiasProps } from './GrillaDeNoticias'
export { GrillaDePromociones, type GrillaDePromocionesProps } from './GrillaDePromociones'
export { HeroDeArticulo, type HeroDeArticuloProps } from './HeroDeArticulo'
export {
  MapaDePuntosDeVenta,
  type MapaDePuntosDeVentaProps,
  type PuntoEnMapa,
} from './MapaDePuntosDeVenta'
export { Navbar } from './Navbar'
export { NoEncontrada } from './NoEncontrada'
export { NoticiasDestacadas, type NoticiasDestacadasProps } from './NoticiasDestacadas'
export { type GrupoDeFiltros, PanelDeFiltros, type PanelDeFiltrosProps } from './PanelDeFiltros'
export { VideoHero } from './VideoHero'

export { SECCIONES, type Seccion } from './secciones'
