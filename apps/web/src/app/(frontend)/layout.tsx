import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './styles.css'
import { PlantillaDelSitio } from '@/components/templates'

const SITIO = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
const DESCRIPCION = 'Guías, tutoriales y contenido informativo sobre juego.'

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
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Jugadon',
    title: 'Jugadon',
    description: DESCRIPCION,
    // El mismo cuadro que hace de poster de la portada: trae el logo y la
    // leyenda legal, y ya esta en 1920x1080, la medida que piden las redes.
    images: [{ url: '/video-hero-poster.jpg', width: 1920, height: 1080, alt: 'Jugadon' }],
  },
  twitter: { card: 'summary_large_image', title: 'Jugadon', description: DESCRIPCION },
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return <PlantillaDelSitio>{children}</PlantillaDelSitio>
}
