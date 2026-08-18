import { PlantillaDeArticuloCargando } from '@/components/templates'

/**
 * Se ve en la primera visita a una nota que ISR todavia no genero. A partir de
 * ahi la pagina queda en cache y la transicion es inmediata.
 */
export default function NotaCargando() {
  return <PlantillaDeArticuloCargando conHero />
}
