import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './styles.css'
import { PlantillaDelSitio } from '@/components/templates'
import { DESCRIPCION, IMAGEN_SOCIAL, OPEN_GRAPH_BASE, SITIO } from '@/utilidades/sitio'

export const metadata: Metadata = {
  // Sin esto, las rutas relativas de las imagenes sociales no resuelven y las
  // tarjetas de WhatsApp o X salen sin imagen.
  metadataBase: new URL(SITIO),
  title: {
    default: 'Jugadon',
    // Cada pagina pone su titulo y la marca se agrega sola.
    template: '%s | Jugadon',
  },
  description: DESCRIPCION,
  /*
   * Sin titulo ni descripcion a proposito: Next los completa con los de cada
   * pagina. Ver `OPEN_GRAPH_BASE`. X toma titulo, descripcion e imagen de aca
   * cuando no tiene los suyos, asi que de `twitter` solo hace falta el formato.
   */
  openGraph: { ...OPEN_GRAPH_BASE, type: 'website', images: [IMAGEN_SOCIAL] },
  twitter: { card: 'summary_large_image' },
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return <PlantillaDelSitio>{children}</PlantillaDelSitio>
}
