import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Convierte los bloques `comparativa` que quedaron en el contenido a tablas
 * nativas del editor.
 *
 * El bloque viejo guardaba la tabla como tres arrays anidados
 * (columnas -> filas -> celdas). La tabla nativa la guarda como nodos
 * `table > tablerow > tablecell`, que es lo que el editor sabe manipular con
 * Tab, con el `+` al pasar el mouse y con el menu contextual.
 *
 * El `titulo` del bloque no tiene equivalente en una tabla nativa, asi que sale
 * como un `h2` justo antes. Es lo mismo que se ve publicado.
 *
 * Se lee el JSON directo de la base porque el bloque `comparativa` ya no esta
 * declarado en la config: preguntarselo a Payload por la Local API seria
 * pedirle que arme un bloque que ya no conoce.
 *
 * Uso: pnpm migrar-comparativas
 */

type Nodo = Record<string, any>

const texto = (valor: unknown) => ({
  type: 'text',
  text: typeof valor === 'string' ? valor : '',
  format: 0,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
})

const parrafo = (valor: unknown): Nodo => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  children: [texto(valor)],
})

const encabezado = (valor: unknown): Nodo => ({
  type: 'heading',
  tag: 'h2',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [texto(valor)],
})

/**
 * `headerState` decide la etiqueta al publicar: > 0 sale como `th`, 0 como `td`.
 * 1 es la fila de encabezado.
 */
const celda = (valor: unknown, esEncabezado: boolean): Nodo => ({
  type: 'tablecell',
  headerState: esEncabezado ? 1 : 0,
  colSpan: 1,
  rowSpan: 1,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [parrafo(valor)],
})

const fila = (valores: unknown[], esEncabezado: boolean): Nodo => ({
  type: 'tablerow',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: valores.map((v) => celda(v, esEncabezado)),
})

const tabla = (filas: Nodo[]): Nodo => ({
  type: 'table',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: filas,
})

/** Devuelve los nodos que reemplazan a un bloque `comparativa`. */
const convertir = (campos: Nodo): Nodo[] => {
  const columnas: Array<{ encabezado?: string }> = campos.columnas ?? []
  const filas: Array<{ celdas?: Array<{ valor?: string }> }> = campos.filas ?? []

  if (columnas.length === 0) return []

  const salida: Nodo[] = []
  if (typeof campos.titulo === 'string' && campos.titulo.trim() !== '') {
    salida.push(encabezado(campos.titulo))
  }

  const cuerpo = [
    fila(
      columnas.map((c) => c.encabezado ?? ''),
      true,
    ),
    // Se recorre por columna, no por celda: si a una fila le faltaban celdas
    // (el bloque viejo no lo impedia), la tabla igual sale rectangular.
    ...filas.map((f) => fila(columnas.map((_, i) => f.celdas?.[i]?.valor ?? ''), false)),
  ]

  salida.push(tabla(cuerpo))
  return salida
}

const migrar = async () => {
  const payload = await getPayload({ config })

  const { rows } = (await payload.db.drizzle.execute(
    `SELECT _parent_id, _locale, contenido FROM posts_locales WHERE contenido::text LIKE '%"comparativa"%'`,
  )) as { rows: Array<{ _parent_id: number; _locale: string; contenido: Nodo }> }

  if (rows.length === 0) {
    payload.logger.info('No quedan bloques comparativa. Nada que migrar.')
    return
  }

  for (const row of rows) {
    const hijos: Nodo[] = row.contenido?.root?.children ?? []
    let convertidos = 0

    const nuevos = hijos.flatMap((nodo) => {
      if (nodo?.type !== 'block' || nodo?.fields?.blockType !== 'comparativa') return [nodo]
      convertidos += 1
      return convertir(nodo.fields)
    })

    await payload.update({
      collection: 'posts',
      id: row._parent_id,
      locale: row._locale as 'es',
      data: { contenido: { ...row.contenido, root: { ...row.contenido.root, children: nuevos } } } as never,
    })

    payload.logger.info(
      `Entrada ${row._parent_id} (${row._locale}): ${convertidos} comparativa(s) -> tabla nativa`,
    )
  }

  payload.logger.info(`Migradas ${rows.length} filas.`)
}

await migrar()
process.exit(0)
