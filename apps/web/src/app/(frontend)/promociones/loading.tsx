import { PlantillaDeListadoCargando } from '@/components/templates'

/**
 * Sin bajada y con una sola fila de chips: el boton de filtros y las
 * plataformas. Con `sobreElTitulo`, que es el carrusel de banners de campania.
 */
export default function PromocionesCargando() {
  return <PlantillaDeListadoCargando bajada={false} filasDeFiltros={1} sobreElTitulo tarjetas={6} />
}
