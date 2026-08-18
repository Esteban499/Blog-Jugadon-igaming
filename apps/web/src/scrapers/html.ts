/**
 * Lo minimo para sacar texto de las bases que publican las plataformas.
 *
 * Vive aparte porque los dos adaptadores de Jugadon leen el mismo HTML con las
 * mismas dos operaciones, y de las dos la de contar anidacion es lo bastante
 * sutil como para que dos copias terminen difiriendo justo cuando importa.
 *
 * No pretende ser un parser: no hay arbol, no se validan etiquetas mal cerradas
 * y no se resuelve todo el juego de entidades. Alcanza porque el HTML que llega
 * lo genera siempre la misma plantilla.
 */

export const aTextoPlano = (html: string): string =>
  html
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * El interior de la primera etiqueta `<nombre>` cuyos atributos acepte `acepta`,
 * contando la anidacion.
 *
 * Una expresion regular sola no alcanza: los bloques que interesan tienen
 * etiquetas del mismo nombre adentro, y cualquier `.*?</div>` corta en el primer
 * cierre, que suele ser el de un hijo. Esto abre en la etiqueta encontrada y
 * avanza sumando y restando hasta cerrar la que abrio.
 *
 * Se recorren todas las aperturas y no solo la primera porque hay un caso que
 * lo pide: buscar la lista que NO tiene clase, salteando las que si la tienen.
 */
export const interioresDe = (
  html: string,
  nombre: string,
  acepta: (atributos: string) => boolean,
): string[] => {
  const bloques: string[] = []

  for (const apertura of html.matchAll(new RegExp(`<${nombre}\\b([^>]*)>`, 'gi'))) {
    if (!acepta(apertura[1] ?? '')) continue

    const desde = (apertura.index ?? 0) + apertura[0].length
    let profundidad = 1

    for (const etiqueta of html.slice(desde).matchAll(new RegExp(`<(/?)${nombre}\\b[^>]*>`, 'gi'))) {
      profundidad += etiqueta[1] ? -1 : 1
      if (profundidad === 0) {
        bloques.push(html.slice(desde, desde + (etiqueta.index ?? 0)))
        break
      }
    }
  }

  return bloques
}

/** El primero, para cuando alcanza con eso. */
export const interiorDelPrimero = (
  html: string,
  nombre: string,
  acepta: (atributos: string) => boolean,
): string | undefined => interioresDe(html, nombre, acepta)[0]

/** Los `<li>` de un bloque, ya como texto y sin los vacios. */
export const puntosDeLista = (bloque: string): string[] =>
  [...bloque.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => aTextoPlano(m[1]))
    .filter((punto) => punto.length > 0)

/** `true` si la etiqueta lleva esa clase. */
export const tieneClase = (atributos: string, clase: string): boolean =>
  new RegExp(`class="[^"]*\\b${clase}\\b[^"]*"`, 'i').test(atributos)

/** `true` si la etiqueta no declara ninguna clase. */
export const sinClase = (atributos: string): boolean => !/\bclass\s*=/i.test(atributos)
