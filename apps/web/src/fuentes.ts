import { Archivo, Archivo_Narrow, Outfit } from 'next/font/google'

/**
 * =========================================================================
 * TIPOGRAFIA (§3.1)
 *
 * El sistema pide tres familias con tres trabajos distintos: una display que
 * carga la identidad, una utilitaria condensada para etiquetas en mayusculas
 * y una grotesca neutral que sostenga 1.500 palabras de lectura.
 *
 * Dos de las tres del manual —Pacaembu y NV Gourd— no estan en Google Fonts
 * y todavia no hay licencia web confirmada, asi que van SUPLENTES elegidas
 * por parecido estructural:
 *
 *   Pacaembu (display 700)  -> Outfit 700, geometrica y de peso alto.
 *   NV Gourd (utilitaria)   -> Archivo Narrow, condensada de la misma
 *                              superfamilia que la cuerpo, asi que convive
 *                              sin friccion con ella.
 *   Archivo (cuerpo)        -> Archivo. Esta si es la del sistema.
 *
 * Cambiar una familia es cambiar una de estas tres declaraciones: el resto
 * del sitio consume `--fuente-*` a traves de los tokens `--font-*`, y ningun
 * componente nombra jamas una familia.
 *
 * Viven en su propio modulo porque los carga tanto el layout del frontend
 * como `global-not-found.tsx`, que al no heredar ningun layout tiene que
 * devolver el documento entero. Declaradas dos veces, `next/font` genera dos
 * juegos de `@font-face` y el 404 descarga fuentes que ya estaban.
 *
 * `next/font` las auto-hospeda: no sale ningun pedido a Google desde el
 * navegador del visitante.
 * =========================================================================
 */

/** SUPLENTE de Pacaembu. Reemplazar por `next/font/local` al tener la licencia. */
export const display = Outfit({
  display: 'swap',
  subsets: ['latin'],
  variable: '--fuente-display',
  weight: ['700'],
})

/** SUPLENTE de NV Gourd. Reemplazar por `next/font/local` al tener la licencia. */
export const utilitaria = Archivo_Narrow({
  display: 'swap',
  subsets: ['latin'],
  variable: '--fuente-util',
  weight: ['400', '700'],
})

/** La cuerpo del sistema. Tres pesos, mas la italica que piden las citas. */
export const cuerpo = Archivo({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--fuente-cuerpo',
  weight: ['400', '500', '600'],
})

/** Las tres variables juntas, para el `className` del `<html>`. */
export const CLASES_DE_FUENTE = `${display.variable} ${utilitaria.variable} ${cuerpo.variable}`
