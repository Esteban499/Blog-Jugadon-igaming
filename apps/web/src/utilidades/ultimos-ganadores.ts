/**
 * Los ultimos premios pagados por las cuatro plataformas de Jugadon.
 *
 * Cada jurisdiccion expone su propia lista en `PROXY_URL/matchcasino/last-winners`,
 * el mismo endpoint publico que consume el lobby de casino de cada sitio. Aca se
 * piden las cuatro, se marcan con la provincia de origen, se juntan en una sola
 * lista y se dejan los treinta premios mas altos.
 *
 * Todo esto corre en el servidor —lo llama el route handler de
 * `/datos/ultimos-ganadores`— y por eso puede permitirse cuatro peticiones
 * salientes: al navegador le llega una sola respuesta ya consolidada, ya
 * ofuscada y ya formateada. Del lado del cliente no queda ni un nombre completo
 * ni una decision de locale.
 */

import { type Jurisdiccion, JURISDICCIONES } from './jurisdicciones'

/**
 * Un registro tal como lo devuelve la API. Los nombres de campo son de una
 * letra porque vienen del catalogo de juegos de la plataforma, que los comparte
 * con el lobby; los unicos que agrega el endpoint de ganadores son los cuatro
 * del final.
 */
type GanadorCrudo = {
  /** Codigo del juego. */
  c?: string | null
  /** Nombre visible del juego. */
  d?: string | null
  /** Id del juego. Igual a `c` en todos los registros observados. */
  i?: string | null
  images?: { url?: string | null; tag?: string | null }[] | null
  /** El usuario, sin ofuscar. Nunca sale de este modulo tal como llega. */
  userLogin?: string | null
  /** El premio, en pesos. Puede traer decimales. */
  amount?: number | null
  /** `CASINO`, `CASINOLIVE` o `ESPORT`. */
  context?: string | null
  eventDate?: string | null
}

/** Un ganador ya listo para dibujar: sin datos personales y sin numeros crudos. */
export type Ganador = {
  /** Clave estable para React. Un mismo usuario puede ganar dos veces. */
  id: string
  /** El nombre ofuscado, del tipo `CA****TO`. */
  jugador: string
  /** El premio ya escrito en pesos argentinos. */
  premio: string
  /** El monto en limpio. Es lo que ordena la lista. */
  monto: number
  juego: string
  /**
   * Las dos miniaturas que publica la plataforma para el mismo juego, cada una
   * dibujada para su proporcion. Van las dos y no una elegida en el servidor
   * porque quien sabe que forma tiene el hueco es la tarjeta, no el dato: la
   * vertical es para el premio mayor y la cuadrada para la pista.
   *
   * La tercera variante del catalogo, `rectangulars` (320x210), no se expone:
   * no hay en la seccion ningun hueco mas ancho que alto donde luzca, y un
   * campo que nadie lee es un campo que despues nadie sabe si se puede sacar.
   * Queda igual como respaldo de las otras dos.
   */
  imagenVertical: string | null
  imagenCuadrada: string | null
  jurisdiccion: string
}

/** Cuantos premios entran en la seccion: el mayor mas los veintinueve de la pista. */
const CUANTOS = 30

/**
 * Lo que se espera a cada jurisdiccion antes de seguir sin ella.
 *
 * Las cuatro van en paralelo, asi que este numero es lo que puede tardar la
 * respuesta entera: la mas lenta manda. Y del otro lado hay alguien mirando un
 * esqueleto.
 *
 * Seis segundos y no diez porque las que contestan lo hacen bien debajo de dos,
 * y La Rioja —la que viene sin datos— o corta con un 204 al instante o se
 * queda colgada hasta el timeout. Alargarlo no recupera ninguna jurisdiccion
 * mas: solo estira el esqueleto.
 */
const ESPERA_MS = 6_000

/**
 * El `Accept` exacto que manda el axios del lobby.
 *
 * No es cosmetico y no se toca: el endpoint negocia contenido con esta cadena
 * literal. Con `application/json` a secas, con el comodin a secas o sin
 * cabecera contesta **204 sin cuerpo**, que es un exito vacio y no un error —o
 * sea que ningun `respuesta.ok` lo delata—. Fue exactamente lo que hizo parecer
 * que la API no tenia datos.
 */
const ACCEPT = 'application/json, text/plain, */*'

/** Pesos argentinos sin centavos: los premios se leen redondos. */
const pesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

/**
 * Tapa el nombre del ganador: dos letras, cuatro asteriscos y dos letras.
 *
 * Los usuarios cortos son el caso que hay que cuidar: con cuatro caracteres,
 * "dos primeras + dos ultimas" no tapa absolutamente nada y publicaria el
 * usuario entero. Ahi se deja solo la inicial.
 *
 * Va en mayusculas porque asi se dibuja en la tarjeta, y hacerlo aca evita que
 * el anonimato dependa de un `text-transform` de la maqueta.
 */
export const ofuscarJugador = (nombre: string | null | undefined): string => {
  const limpio = (nombre ?? '').trim()
  if (limpio.length === 0) return 'JUGADOR'
  if (limpio.length <= 4) return `${limpio.slice(0, 1).toUpperCase()}****`
  return `${limpio.slice(0, 2)}****${limpio.slice(-2)}`.toUpperCase()
}

/** El CDN por el que la plataforma sirve las miniaturas de sus juegos. */
const CDN = 'd2i3l2m8dk0scd.cloudfront.net'

/**
 * El bucket que ese CDN tiene detras.
 *
 * Unos pocos registros —tres de noventa en la muestra— traen la URL del bucket
 * en vez de la del CDN, con el mismo path y el mismo archivo byte por byte. Se
 * reescriben al CDN en lugar de habilitar el segundo dominio: sirve desde el
 * borde en vez de desde eu-west-3, y deja una sola entrada en `next.config`.
 */
const ORIGEN = 'sirplay-amazon.s3.eu-west-3.amazonaws.com'

/**
 * Deja la URL apuntando al CDN, o la descarta.
 *
 * El descarte importa: `next/image` **tira una excepcion** ante un `src` de un
 * dominio que no este en `remotePatterns`, y como la seccion se dibuja del lado
 * del cliente esa excepcion se lleva puesta la pantalla entera. Un host nuevo
 * que aparezca en la API tiene que degradar a `SinPortada`, no romper la home.
 */
const normalizarImagen = (url: string): string | null => {
  let direccion: URL
  try {
    direccion = new URL(url)
  } catch {
    return null
  }

  if (direccion.host === ORIGEN) direccion.host = CDN
  return direccion.host === CDN ? direccion.toString() : null
}

/**
 * Las miniaturas del juego, una por proporcion.
 *
 * Cada `tag` es un recorte distinto hecho por la plataforma, no la misma imagen
 * escalada: el arte del juego esta compuesto para esa caja, con el titulo y el
 * logo del proveedor donde entran. Por eso la tarjeta pide la que le
 * corresponde en vez de recortar una a la forma de la otra, que es justo lo que
 * se lleva puestos esos dos elementos.
 *
 * Las medidas del catalogo son `vertical` 420x588, `square` 420x420 y
 * `rectangulars` 320x210.
 *
 * Cada una cae a las otras si falta: mas vale un recorte raro que un hueco. Un
 * registro sin `images` es poco frecuente pero pasa —se vio uno en Cordoba—, y
 * ahi la tarjeta termina en `SinPortada`.
 */
const imagenesDelJuego = (
  crudo: GanadorCrudo,
): { vertical: string | null; cuadrada: string | null } => {
  const imagenes = (crudo.images ?? []).filter(
    (imagen): imagen is { url: string; tag?: string | null } => typeof imagen?.url === 'string',
  )
  const buscar = (tag: string) => imagenes.find((imagen) => imagen.tag === tag)?.url

  /*
   * Se prueban en orden de preferencia y gana la primera servible. El descarte
   * por host importa aca: si el apaisado viniera de un dominio desconocido,
   * todavia queda el cuadrado en vez de quedarse sin imagen.
   */
  const primeraServible = (candidatas: (string | undefined)[]): string | null => {
    for (const candidata of candidatas) {
      if (!candidata) continue
      const servible = normalizarImagen(candidata)
      if (servible) return servible
    }
    return null
  }

  const vertical = buscar('vertical')
  const cuadrado = buscar('square')
  const apaisado = buscar('rectangulars')
  const suelta = imagenes[0]?.url

  /*
   * El orden de respaldo va de la forma mas parecida a la mas distinta: para el
   * hueco alto, antes el cuadrado que el apaisado; para el cuadrado, al reves.
   */
  return {
    vertical: primeraServible([vertical, cuadrado, apaisado, suelta]),
    cuadrada: primeraServible([cuadrado, apaisado, vertical, suelta]),
  }
}

/**
 * Pide una jurisdiccion. Devuelve lista vacia si no hay nada que mostrar.
 *
 * El 204 no se trata como falla: es la respuesta normal de una plataforma que
 * todavia no pago ningun premio en la ventana que mira el endpoint. La Rioja
 * contesta asi de forma sostenida, y esa jurisdiccion simplemente no aporta
 * registros a la lista consolidada.
 */
const pedirJurisdiccion = async (jurisdiccion: Jurisdiccion): Promise<Ganador[]> => {
  const endpoint = `${jurisdiccion.api}/matchcasino/last-winners`

  const respuesta = await fetch(endpoint, {
    headers: { Accept: ACCEPT, Referer: `${jurisdiccion.sitio}/` },
    // La lista se renueva sola: se guarda un minuto y se sirve rancia mientras
    // se revalida, asi una jurisdiccion lenta no frena a las otras tres.
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(ESPERA_MS),
  })

  if (respuesta.status === 204) return []

  if (!respuesta.ok) {
    throw new Error(`${endpoint} respondió ${respuesta.status} ${respuesta.statusText}`)
  }

  const cuerpo: unknown = await respuesta.json()
  if (!Array.isArray(cuerpo)) return []

  return (cuerpo as GanadorCrudo[]).flatMap((crudo, indice) => {
    const monto =
      typeof crudo.amount === 'number' && Number.isFinite(crudo.amount) ? crudo.amount : 0

    // Un premio en cero no es un ganador: no tiene nada que anunciar y ademas
    // se colaria al fondo del ranking desplazando a uno real.
    if (monto <= 0) return []

    const imagenes = imagenesDelJuego(crudo)

    return [
      {
        id: `${jurisdiccion.nombre}-${crudo.eventDate ?? indice}-${crudo.c ?? indice}-${indice}`,
        imagenCuadrada: imagenes.cuadrada,
        imagenVertical: imagenes.vertical,
        juego: (crudo.d ?? '').trim() || 'Juego de casino',
        jugador: ofuscarJugador(crudo.userLogin),
        jurisdiccion: jurisdiccion.nombre,
        monto,
        premio: pesos.format(monto),
      },
    ]
  })
}

/**
 * Las cuatro jurisdicciones consolidadas, de mayor a menor premio.
 *
 * Va con `allSettled` a proposito: que un proxy este caido no puede dejar la
 * seccion sin premios, porque los otros tres siguen teniendo para mostrar. Lo
 * que falla se anota en el log del servidor y se sigue.
 */
export const obtenerUltimosGanadores = async (): Promise<Ganador[]> => {
  const respuestas = await Promise.allSettled(JURISDICCIONES.map(pedirJurisdiccion))

  const ganadores = respuestas.flatMap((respuesta, indice) => {
    if (respuesta.status === 'fulfilled') return respuesta.value

    console.error(
      `[ultimos-ganadores] ${JURISDICCIONES[indice].nombre} no respondió:`,
      respuesta.reason,
    )
    return []
  })

  return ganadores.sort((a, b) => b.monto - a.monto).slice(0, CUANTOS)
}
