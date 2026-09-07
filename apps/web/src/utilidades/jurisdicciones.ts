/**
 * Las cuatro plataformas de Jugadon que publican sus ultimos ganadores.
 *
 * Vive aparte de `ultimos-ganadores.ts` porque lo leen los dos lados: el
 * servidor arma con `api` la peticion al endpoint de premios, y el modal que se
 * abre al tocar una tarjeta arma con `sitio` el enlace para ir a jugar. Escrito
 * en los dos lugares, cambiar un dominio dejaria la seccion pidiendole premios
 * a una plataforma y mandando visitas a otra.
 *
 * Es un modulo puro a proposito —solo datos, sin `fetch` ni nada de Node—: es
 * lo que deja que un componente cliente lo importe sin arrastrarse al bundle la
 * logica del servidor.
 *
 * Ojo, son cuatro y no cinco: Santa Fe es una plataforma de Jugadon y sale en
 * `/promociones`, pero no expone `matchcasino/last-winners`, asi que no tiene
 * premios que aportar ni lugar en este modulo.
 */

export type Jurisdiccion = {
  /** Como se nombra en pantalla. */
  nombre: string
  /**
   * El proxy contra el que pega su API.
   *
   * San Luis rompe el patron `proxy<provincia>` y usa `proxy2`: es la misma
   * excepcion que ya documenta `scripts/cargar-plataformas.ts`, y sale del
   * `PROXY_URL` que cada sitio declara en su runtime config.
   */
  api: string
  /**
   * El sitio publico donde se juega.
   *
   * Los hosts van en minuscula, que es su forma canonica y la que ya usa
   * `cargar-plataformas.ts`: `larioja`, no `LaRioja`.
   */
  sitio: string
}

export const JURISDICCIONES = [
  {
    nombre: 'San Luis',
    api: 'https://proxy2.jugadon.bet.ar',
    sitio: 'https://sanluis.jugadon.bet.ar',
  },
  {
    nombre: 'Córdoba',
    api: 'https://proxycordoba.jugadon.bet.ar',
    sitio: 'https://cordoba.jugadon.bet.ar',
  },
  {
    nombre: 'La Rioja',
    api: 'https://proxylarioja.jugadon.bet.ar',
    sitio: 'https://larioja.jugadon.bet.ar',
  },
  {
    nombre: 'CABA',
    api: 'https://proxycaba.jugadon.bet.ar',
    sitio: 'https://caba.jugadon.bet.ar',
  },
] as const satisfies readonly Jurisdiccion[]

/** El dominio pelado, para mostrarle a quien va a salir del blog adonde va. */
export const dominioDe = (jurisdiccion: Jurisdiccion): string =>
  jurisdiccion.sitio.replace(/^https?:\/\//, '').replace(/\/+$/, '')
