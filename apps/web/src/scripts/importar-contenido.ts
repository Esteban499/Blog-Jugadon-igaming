import { getPayload } from 'payload'
import config from '@payload-config'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * Segunda mitad de la migracion del campo `contenido`, de `blocks` a `richText`.
 * Lee lo que dejo `exportar-contenido.ts` y lo reescribe como documento Lexical.
 *
 * La equivalencia entre un formato y el otro:
 *
 *   bloque "Texto"  ->  sus parrafos pasan a ser el documento mismo. Ese bloque
 *                       deja de existir: dentro de un richText seria un parrafo
 *                       adentro de un documento de parrafos.
 *   los demas       ->  un nodo `block`, que es como Lexical guarda un bloque de
 *                       Payload incrustado en el texto.
 *
 * Uso: pnpm importar-contenido [ruta.json]
 */
const origen = path.resolve(
  process.argv[2] ?? path.resolve(process.cwd(), 'contenido-exportado.json'),
)

type BloqueViejo = Record<string, unknown> & { blockType: string }

/**
 * Un bloque de Payload dentro de Lexical es un nodo `block` cuyo `fields` es el
 * bloque entero. `version: 2` es el formato actual: la 1 envolvia los campos en
 * un `data` intermedio y el editor la convierte al abrir.
 */
const nodoDeBloque = (bloque: BloqueViejo) => {
  const { blockName, ...campos } = bloque
  return {
    type: 'block',
    format: '',
    version: 2,
    fields: {
      ...campos,
      blockName: typeof blockName === 'string' ? blockName : '',
    },
  }
}

const parrafoVacio = () => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  children: [],
})

const documentoLexical = (bloques: BloqueViejo[]) => {
  const children: Array<Record<string, unknown>> = []

  for (const bloque of bloques) {
    if (bloque.blockType === 'contenido') {
      const hijos = (bloque.texto as { root?: { children?: unknown[] } })?.root?.children
      if (Array.isArray(hijos)) children.push(...(hijos as Array<Record<string, unknown>>))
      continue
    }
    children.push(nodoDeBloque(bloque))
  }

  // Un documento que termina en un bloque no deja lugar donde pararse a
  // escribir debajo: el cursor no tiene donde entrar.
  if (children.length === 0 || children[children.length - 1]?.type === 'block') {
    children.push(parrafoVacio())
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  }
}

const importar = async () => {
  const payload = await getPayload({ config })

  const entradas = JSON.parse(readFileSync(origen, 'utf8')) as Array<{
    id: number
    slug?: string
    contenido?: BloqueViejo[]
  }>

  for (const entrada of entradas) {
    if (!Array.isArray(entrada.contenido)) {
      payload.logger.warn(`Sin contenido, se saltea: ${entrada.slug ?? entrada.id}`)
      continue
    }

    const documento = documentoLexical(entrada.contenido)

    await payload.update({
      collection: 'posts',
      id: entrada.id,
      locale: 'es',
      data: { contenido: documento } as never,
    })

    const bloques = documento.root.children.filter((n) => n.type === 'block').length
    payload.logger.info(
      `${entrada.slug ?? entrada.id}: ${documento.root.children.length} nodos (${bloques} bloques)`,
    )
  }

  payload.logger.info(`Importadas ${entradas.length} entradas desde ${origen}`)
}

await importar()
process.exit(0)
