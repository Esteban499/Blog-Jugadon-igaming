import { PlantillaDeListadoCargando } from '@/components/templates'

/** Sin bajada y con una sola fila de chips: el boton de filtros y las plataformas. */
export default function PromocionesCargando() {
  return <PlantillaDeListadoCargando bajada={false} filasDeFiltros={1} tarjetas={6} />
}
