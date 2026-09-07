/**
 * Los ultimos shorts del canal de YouTube de Jugadon.
 *
 * Salen del feed publico del canal —`youtube.com/feeds/videos.xml`—, que es la
 * unica via que devuelve los videos recientes SIN clave de API: no hay proyecto
 * de Google Cloud que mantener, no hay cuota diaria que se pueda agotar un
 * viernes a la noche y no hay un secreto mas en el `.env` de produccion. El
 * precio de esa simplicidad esta abajo, en `FUENTES`.
 *
 * Todo esto corre en el servidor: lo llama `ShortsDeYoutube`, que es Server
 * Component. Al navegador le llega la seccion ya dibujada y ni un byte de XML.
 *
 * A diferencia de `ultimos-ganadores`, esto NO tiene su propia ruta en
 * `/datos`. La diferencia es cada cuanto cambia el dato: una lista que se llama
 * "ultimos ganadores" con una hora de atraso deja de ser cierta, pero un canal
 * que publica algunos shorts por semana esta perfectamente descripto por la
 * revalidacion horaria que ya tiene la portada. Sin necesidad de frescura al
 * minuto no hace falta pedirlo desde el cliente, y por lo tanto no hace falta
 * ni el route handler, ni el esqueleto, ni el estado de carga.
 */

/**
 * El canal, en formato `UC…` (24 caracteres).
 *
 * No sirve el arroba del canal: el feed solo entiende el id. Se saca del codigo
 * fuente de la pagina del canal buscando `externalId`, o de
 * `youtube.com/account_advanced` con la cuenta del canal abierta.
 *
 * Sin la variable puesta, `obtenerShorts` devuelve una lista vacia y la seccion
 * no se dibuja. Es a proposito: el sitio compila y anda igual, asi que el dia
 * que se mueva el canal a otra cuenta lo que pasa es que desaparece un carrusel
 * de la portada, no que se cae el build.
 */
const CANAL = process.env.YOUTUBE_CANAL_ID

/** Cuantos shorts pide la seccion. El feed devuelve como maximo quince. */
const CUANTOS = 15

/**
 * Las dos fuentes posibles, en orden de preferencia.
 *
 * **El feed no dice cual video es un short.** No hay campo de duracion, ni de
 * proporcion, ni una marca de formato: un short y una nota de veinte minutos
 * llegan con exactamente la misma forma. Y eso importa, porque una tarjeta 9:16
 * con el recorte central de un video apaisado se ve mal.
 *
 * De ahi las dos URLs. La primera es la playlist automatica de shorts del
 * canal: el mismo id con `UC` cambiado por `UUSH`, que es como YouTube nombra
 * internamente sus playlists derivadas (`UULF` es la de videos largos). Cuando
 * responde, devuelve shorts y nada mas, que es exactamente lo que se busca.
 *
 * No esta documentada, asi que puede dejar de funcionar sin aviso, y por eso
 * existe la segunda: el feed del canal, que es API publica de siempre. Devuelve
 * las ultimas quince subidas MEZCLADAS. Se usa solo si la primera no contesta
 * —asi la seccion nunca queda vacia por un cambio del lado de YouTube—, pero
 * cuando eso pasa se avisa por consola: no es lo mismo mostrar quince shorts
 * que mostrar quince videos en tarjeta de short, y esa degradacion tiene que
 * quedar a la vista de quien lee los logs.
 */
const FUENTES = CANAL
  ? [
      {
        clase: 'shorts' as const,
        url: `https://www.youtube.com/feeds/videos.xml?playlist_id=UUSH${CANAL.slice(2)}`,
      },
      {
        clase: 'canal' as const,
        url: `https://www.youtube.com/feeds/videos.xml?channel_id=${CANAL}`,
      },
    ]
  : []

/**
 * Cuanto vale la respuesta antes de volver a pedirla, en segundos.
 *
 * Seis horas y no la hora de la portada: el feed cambia cuando el canal publica
 * —algunas veces por semana—, asi que revalidarlo cada hora seria pedir seis
 * veces el mismo XML por cada vez que cambia. La portada sigue regenerandose
 * cada hora; lo que se cachea aparte es este pedido saliente.
 */
const FRESCURA = 21_600

/**
 * Un short listo para dibujar.
 *
 * El feed trae ademas la fecha de publicacion y el contador de vistas, y no se
 * exponen. Las vistas llegaron a estar y se sacaron: en un canal que publica
 * seguido, la mayoria de los shorts recientes tiene numeros de dos o tres
 * cifras, y una pastilla que dice "3 vistas" en la portada no informa nada y se
 * lee como que el canal no anda. Un campo que nadie dibuja es un campo que
 * despues nadie sabe si se puede sacar, asi que no queda en el tipo.
 */
export type Short = {
  /** El id de once caracteres del video. Clave de React y de las dos URLs. */
  id: string
  titulo: string
  /** La miniatura, ya normalizada. Ver `miniaturaDe`. */
  miniatura: string
}

/**
 * Las cinco entidades XML que aparecen en un titulo de YouTube.
 *
 * El feed escapa el texto, asi que un titulo con un `&` llega como `&amp;` y
 * dibujado en la tarjeta se veria tal cual. No se usa un parser de XML entero
 * —seria una dependencia nueva para leer cinco campos— ni `DOMParser`, que en
 * Node no existe.
 */
const ENTIDADES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
}

/** Devuelve el texto con las entidades XML resueltas. */
function desescapar(texto: string): string {
  return texto.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (completa, cuerpo: string) => {
    if (cuerpo.toLowerCase().startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(cuerpo.slice(2), 16))
    }
    if (cuerpo.startsWith('#')) return String.fromCodePoint(Number(cuerpo.slice(1)))

    return ENTIDADES[cuerpo.toLowerCase()] ?? completa
  })
}

/** El contenido de una etiqueta dentro de un bloque, o `null` si no esta. */
function contenidoDe(bloque: string, etiqueta: string): string | null {
  const encontrado = new RegExp(`<${etiqueta}[^>]*>([\\s\\S]*?)</${etiqueta}>`).exec(bloque)

  return encontrado ? desescapar(encontrado[1].trim()) : null
}

/**
 * La miniatura del short, en la mejor variante que exista para ese video.
 *
 * El feed trae una `<media:thumbnail>` con su propia URL, pero se descarta a
 * proposito por dos razones. Una es el host, que rota entre `i.ytimg.com`,
 * `i1`, `i2`, `i3` e `i4`: cada uno seria un `remotePattern` mas en
 * `next.config.mjs`, o peor, un dominio abierto con comodin. La otra es la
 * calidad, que es el punto de esta funcion.
 *
 * Lo que publica el feed es `hqdefault`, o sea 480x360. Para un video apaisado
 * esta bien; para un short es el cuadro vertical metido en una caja 4:3 con dos
 * franjas negras a los costados, y al recortarlo al 9:16 de la tarjeta
 * sobreviven 203x360 pixeles reales. La tarjeta mide 208x370 CSS, que en una
 * pantalla retina son 416x740: se veia todo el tiempo un agrandado de mas del
 * doble. De ahi que se viera borroso.
 *
 * `oar2` es la respuesta. Es el fotograma en su proporcion original —"original
 * aspect ratio"— y para un short viene en 1080x1920: nueve por dieciseis
 * exacto, sin franjas, sin recorte y con pixel de sobra para cualquier pantalla.
 *
 * No esta documentada y no existe para todos los videos, asi que se pregunta
 * antes de usarla. Sobre los quince shorts del canal aparecio en catorce; el
 * que faltaba, y cualquiera que falte en el futuro, cae en `maxresdefault`, que
 * es 1280x720 y deja 405x720 utiles tras el recorte. Eso ya es el doble de lo
 * que daba `hqdefault`, asi que hasta el peor caso mejora.
 *
 * La pregunta es un `HEAD`, no un `GET`: alcanza el codigo de estado y no hay
 * que bajar una imagen de 1080x1920 para saber si esta. Next no cachea los
 * `HEAD`, asi que estas quince preguntas salen cada vez que se regenera la
 * portada —una vez por hora— en vez de seguir el cache de seis horas del feed.
 * Son quince respuestas de un par de cientos de bytes, en paralelo, contra un
 * CDN: no justifica montarle un cache propio.
 */
async function miniaturaDe(id: string): Promise<string> {
  const vertical = `https://i.ytimg.com/vi/${id}/oar2.jpg`

  try {
    const respuesta = await fetch(vertical, { method: 'HEAD' })
    if (respuesta.ok) return vertical
  } catch (error) {
    console.error(`[shorts] no se pudo consultar la miniatura vertical de ${id}:`, error)
  }

  return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
}

/**
 * Parte el feed en entradas. Devuelve lista vacia si el XML no tiene ninguna.
 *
 * Se queda en el id y el titulo —lo que el XML trae— y no arma el `Short`
 * entero: la miniatura no sale del feed sino de preguntarle al CDN cual
 * variante existe, que es una operacion de red y no de parseo. Mezclarlas
 * obligaria a que esta funcion fuera `async` para leer un string que ya tiene
 * entero en la mano.
 */
function leerFeed(xml: string): { id: string; titulo: string }[] {
  const entradas: { id: string; titulo: string }[] = []

  for (const [bloque] of xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)) {
    const id = contenidoDe(bloque, 'yt:videoId')
    const titulo = contenidoDe(bloque, 'title')

    /*
     * Sin id no hay URL ni miniatura, y sin titulo no hay nombre accesible para
     * el boton de la tarjeta. Una entrada asi se saltea entera.
     */
    if (!id || !titulo) continue

    entradas.push({ id, titulo })

    if (entradas.length === CUANTOS) break
  }

  return entradas
}

/**
 * Trae los ultimos shorts del canal.
 *
 * Devuelve lista vacia —y no lanza— cuando no hay canal configurado, cuando
 * YouTube no contesta y cuando el feed llega sin entradas. Quien la llama trata
 * los tres casos igual: no dibuja la seccion. Un carrusel vacio bajo un titulo
 * es peor que no tener el carrusel, que es el mismo criterio con el que
 * `UltimosGanadores` se borra de la pantalla.
 */
export async function obtenerShorts(): Promise<Short[]> {
  if (FUENTES.length === 0) {
    console.warn('[shorts] falta YOUTUBE_CANAL_ID: la sección de shorts no se dibuja')

    return []
  }

  for (const fuente of FUENTES) {
    try {
      const respuesta = await fetch(fuente.url, { next: { revalidate: FRESCURA } })
      if (!respuesta.ok) throw new Error(`respondió ${respuesta.status}`)

      const entradas = leerFeed(await respuesta.text())
      if (entradas.length === 0) throw new Error('el feed llegó sin entradas')

      /*
       * Las quince preguntas por la miniatura salen juntas y no una detras de
       * otra: son independientes entre si y encadenadas sumarian quince viajes
       * de ida y vuelta al render de la portada.
       */
      const shorts = await Promise.all(
        entradas.map(async (entrada) => ({
          ...entrada,
          miniatura: await miniaturaDe(entrada.id),
        })),
      )

      if (fuente.clase === 'canal') {
        console.warn(
          '[shorts] la playlist de shorts no respondió: se usan las últimas subidas del ' +
            'canal, que pueden incluir videos que no son shorts',
        )
      }

      return shorts
    } catch (error) {
      console.error(`[shorts] no se pudo leer ${fuente.clase}:`, error)
    }
  }

  return []
}

/**
 * El canal en YouTube, para el boton que cierra la seccion, o `null` sin canal
 * configurado.
 *
 * Cuelga de `/shorts` y no de la portada del canal: quien toca ese boton viene
 * de recorrer un carrusel de shorts, y la pestania de shorts del canal es la
 * continuacion literal de eso.
 */
export const URL_DEL_CANAL = CANAL ? `https://www.youtube.com/channel/${CANAL}/shorts` : null
