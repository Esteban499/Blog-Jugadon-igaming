/**
 * Las plataformas de Jugadon: adonde se manda a jugar y a cuales se les piden
 * premios. **No son la misma lista, y esa es la razon de ser de este modulo.**
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
 * SON CINCO PLATAFORMAS Y CUATRO FUENTES DE PREMIOS. Santa Fe no tiene casino
 * —por eso tiene su propio arte de banner, ver `cargar-banners.ts`— y no expone
 * `matchcasino/last-winners`. Es una plataforma real igual: se puede abrir
 * cuenta y jugar, y sale en `/promociones`. Por eso esta en `PLATAFORMAS`, que
 * es la lista de destinos, y no en `JURISDICCIONES`, que es la lista de fuentes:
 * meterla en la segunda haria que cada carga de la portada pidiera premios a un
 * endpoint que no existe y anotara un error por cada visita.
 *
 * La regla para lo que venga: si aparece una plataforma nueva, va en
 * `PLATAFORMAS`; solo pasa ademas a `JURISDICCIONES` si responde el endpoint de
 * ganadores.
 */

/** Una plataforma adonde se puede mandar a alguien a jugar. */
export type Plataforma = {
  /** Como se nombra en pantalla. */
  nombre: string
  /**
   * El sitio publico donde se juega.
   *
   * Los hosts van en minuscula, que es su forma canonica y la que ya usa
   * `cargar-plataformas.ts`: `larioja`, no `LaRioja`.
   */
  sitio: string
}

/** Una plataforma que ademas publica sus ultimos ganadores. */
export type Jurisdiccion = Plataforma & {
  /**
   * El proxy contra el que pega su API.
   *
   * San Luis rompe el patron `proxy<provincia>` y usa `proxy2`: es la misma
   * excepcion que ya documenta `scripts/cargar-plataformas.ts`, y sale del
   * `PROXY_URL` que cada sitio declara en su runtime config.
   */
  api: string
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

/**
 * Santa Fe, que juega pero no reporta.
 *
 * Sin `api` porque no tiene endpoint de ganadores que poner ahi, y el tipo lo
 * dice: es una `Plataforma`, no una `Jurisdiccion`. Esa diferencia es la que
 * impide que entre por accidente al `Promise.allSettled` de la portada.
 */
const SANTA_FE = {
  nombre: 'Santa Fe',
  sitio: 'https://santafe.jugadon.bet.ar',
} as const satisfies Plataforma

/**
 * Las cinco plataformas, para elegir adonde ir a jugar.
 *
 * Se arma con las cuatro de arriba mas Santa Fe en lugar de repetir la lista:
 * escrita dos veces, cambiar el dominio de Cordoba lo cambiaria en la seccion
 * de premios y no en el modal que manda a jugar, que es exactamente el error
 * que este modulo existe para evitar.
 *
 * Santa Fe va ultima y no primera para no mover de lugar a las cuatro que ya
 * estaban: el modal promete que la lista no baila entre una tarjeta y otra.
 */
export const PLATAFORMAS = [...JURISDICCIONES, SANTA_FE] as const satisfies readonly Plataforma[]

/** El dominio del que cuelgan todas las plataformas y sus APIs. */
export const DOMINIO_DE_PLATAFORMAS = 'jugadon.bet.ar'

/**
 * `true` si la URL es https y cuelga de `DOMINIO_DE_PLATAFORMAS`.
 *
 * Es la guarda contra SSRF del bot de promociones. `urlApi` y `urlPromociones`
 * se editan desde el panel y el servidor les hace `fetch`: sin esto, una cuenta
 * de editor podria apuntar el bot a cualquier servicio de la red de la VM —la
 * base, el bucket, un panel interno— con la identidad del servidor.
 *
 * Tampoco se aceptan puerto, usuario, query ni fragmento. Con un `?` al final,
 * el sufijo que agrega el adaptador (`/bonus-engine/api/...`) quedaria
 * convertido en un parametro y la ruta la elegiria quien cargo la URL.
 */
export const esUrlDePlataforma = (valor: string | null | undefined): boolean => {
  if (!valor) return false
  try {
    const url = new URL(valor)
    return (
      url.protocol === 'https:' &&
      (url.hostname === DOMINIO_DE_PLATAFORMAS ||
        url.hostname.endsWith(`.${DOMINIO_DE_PLATAFORMAS}`)) &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
}

/** El dominio pelado, para mostrarle a quien va a salir del blog adonde va. */
export const dominioDe = (plataforma: Plataforma): string =>
  plataforma.sitio.replace(/^https?:\/\//, '').replace(/\/+$/, '')
