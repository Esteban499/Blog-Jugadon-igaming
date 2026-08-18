import type { Metadata } from 'next'

import './(frontend)/styles.css'
import { NoEncontrada } from '@/components/organisms'
import { PlantillaDelSitio } from '@/components/templates'

export const metadata: Metadata = { title: 'Página no encontrada | Jugadon' }

/**
 * 404 de las URLs que no coinciden con ninguna ruta del sitio.
 *
 * Hace falta aparte de `not-found.tsx` porque los layouts viven dentro de
 * grupos de rutas —`(frontend)` y `(payload)`—, y un layout dentro de un grupo
 * no es el layout raiz: sin uno que componer, Next devolvia su 404 gris.
 *
 * Este si devuelve el documento HTML entero, con sus fuentes y sus estilos,
 * porque no hereda nada. Eso es exactamente lo que dibuja `PlantillaDelSitio`,
 * asi que la maqueta es la misma que la del resto del sitio y no una copia que
 * se va quedando atras. Se activa con `experimental.globalNotFound`.
 */
export default function NoEncontradaGlobal() {
  return (
    <PlantillaDelSitio>
      <NoEncontrada />
    </PlantillaDelSitio>
  )
}
