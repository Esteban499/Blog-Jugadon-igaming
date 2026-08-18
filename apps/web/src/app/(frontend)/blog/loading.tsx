import { PlantillaDeListadoCargando } from '@/components/templates'

/**
 * El listado se sirve estatico y regenerado por ISR, asi que en el caso normal
 * esto casi no se ve. Aparece cuando el visitante cambia de filtro o de pagina:
 * ahi la ruta vuelve a consultar y sin esto la pantalla quedaba con la anterior
 * congelada, sin ninguna senal de que algo estaba pasando.
 */
export default function BlogCargando() {
  return <PlantillaDeListadoCargando tarjetas={6} />
}
