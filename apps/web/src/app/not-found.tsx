import type { Metadata } from 'next'

import { NoEncontrada } from '@/components/organisms'

export const metadata: Metadata = { title: 'Página no encontrada' }

/**
 * 404 de una ruta que existe pero cuyo contenido no esta: una nota borrada o
 * todavia en borrador, que hace que la pagina llame a `notFound()`.
 *
 * No devuelve `<html>` ni `<body>`: Next ya lo envuelve en un layout, y
 * anidarle otro documento provocaba un desajuste de hidratacion.
 *
 * Las URLs que no coinciden con ninguna ruta las atiende
 * `global-not-found.tsx`, que si tiene que traer el documento entero.
 */
export default function NoEncontradaEnRuta() {
  return <NoEncontrada />
}
