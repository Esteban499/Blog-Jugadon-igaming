/**
 * =========================================================================
 * ATOMOS — piezas indivisibles del sistema visual.
 *
 * No componen ningun otro componente, no conocen la forma de los datos de
 * Payload y no traen estado. Todos son Server Components: **ningun archivo de
 * este nivel lleva `'use client'`**, y esa es la razon por la que el barril es
 * seguro.
 *
 * REGLA DEL BARRIL: un archivo con `'use client'` no debe importar desde este
 * index ni desde ningun otro barril. En App Router, importar un barril desde
 * el lado cliente arrastra al bundle todo lo que el barril toca. Desde un
 * componente cliente se importa siempre el archivo directo:
 *
 *     import { Boton } from '@/components/atoms/Boton'   // ✅ desde 'use client'
 *     import { Boton } from '@/components/atoms'         // ✅ solo desde servidor
 * =========================================================================
 */

export { Boton, clasesDeBoton } from './Boton'
export type {
  BotonBaseProps,
  BotonComoBotonProps,
  BotonComoEnlaceProps,
  BotonProps,
  TamanoDeBoton,
  VarianteDeBoton,
} from './Boton'

export { Esqueleto, type EsqueletoProps } from './Esqueleto'
export { Ficha, type FichaProps } from './Ficha'
export { SinPortada, type SinPortadaProps } from './SinPortada'
export { clasesDeTag, Tag, type TagProps } from './Tag'

export { LogoJugadon, type LogoJugadonProps } from './marca/LogoJugadon'

export * from './iconos'
