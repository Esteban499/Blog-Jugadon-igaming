/**
 * Formato de fechas y tiempo de lectura.
 *
 * Viven juntos porque los consume la misma linea: el metadato de la card y de
 * la firma del articulo es "12 AGO 2026 · 6 MIN" (§5.3, §5.6), y hasta ahora
 * cada pantalla se armaba su propio `toLocaleDateString` con opciones
 * distintas. El mismo dato salia en tres formatos segun donde cayera.
 */

/** "12 AGO 2026". El formato del metadato de card y firma. */
export const fechaCorta = (valor?: string | null): string => {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''

  return fecha
    .toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
    // `es-AR` devuelve "12 ago 2026" y en algunos runtimes "12 de ago de 2026".
    .replace(/ de /g, ' ')
    .replace(/\./g, '')
    .toUpperCase()
}

/** "12 de agosto de 2026". Para el cuerpo del articulo y las fichas legales. */
export const fechaLarga = (valor?: string | null): string => {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''

  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Junta todo el texto de un documento Lexical.
 *
 * Recorre el arbol entero, incluidos los bloques propios: un aviso o una FAQ
 * son texto que el visitante lee, asi que cuentan para el tiempo de lectura.
 * Se protege de ciclos con un `Set` porque los nodos de relacion pueden
 * apuntar a documentos ya visitados.
 */
const textoPlano = (nodo: unknown, vistos = new WeakSet<object>()): string => {
  if (typeof nodo === 'string') return nodo
  if (typeof nodo !== 'object' || nodo === null) return ''
  if (vistos.has(nodo)) return ''
  vistos.add(nodo)

  if (Array.isArray(nodo)) {
    return nodo.map((hijo) => textoPlano(hijo, vistos)).join(' ')
  }

  const registro = nodo as Record<string, unknown>
  const propio = typeof registro.text === 'string' ? registro.text : ''
  const resto = ['root', 'children', 'fields', 'texto', 'preguntas']
    .map((clave) => (clave in registro ? textoPlano(registro[clave], vistos) : ''))
    .join(' ')

  return `${propio} ${resto}`
}

/**
 * Si el cuerpo ya trae un bloque de CTA cargado desde el panel.
 *
 * El manual admite **un solo bloque de CTA por pagina** (§5.7). La nota cierra
 * con uno generico, y este es el que lo apaga cuando el equipo ya puso el
 * suyo: sin esto, una nota con CTA propio terminaria con dos bloques naranjas
 * compitiendo, que es justo lo que la regla evita.
 */
export const tieneBloqueCta = (contenido: unknown): boolean => {
  const buscar = (nodo: unknown, vistos = new WeakSet<object>()): boolean => {
    if (typeof nodo !== 'object' || nodo === null) return false
    if (vistos.has(nodo)) return false
    vistos.add(nodo)

    if (Array.isArray(nodo)) return nodo.some((hijo) => buscar(hijo, vistos))

    const registro = nodo as Record<string, unknown>
    const campos = registro.fields as Record<string, unknown> | undefined
    if (campos?.blockType === 'cta') return true

    return ['root', 'children'].some((clave) => buscar(registro[clave], vistos))
  }

  return buscar(contenido)
}

/** Palabras por minuto. 200 es el promedio de lectura en pantalla en castellano. */
const RITMO = 200

/**
 * Minutos de lectura de un documento Lexical, redondeado hacia arriba y con
 * un minimo de 1: una nota corta que dijera "0 min" leeria como un error.
 */
export const tiempoDeLectura = (contenido: unknown): number => {
  const palabras = textoPlano(contenido).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(palabras / RITMO))
}
