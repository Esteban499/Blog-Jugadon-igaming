import { getPayload } from 'payload'
import config from '@payload-config'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'

/**
 * Vuelca el cuerpo de las entradas a un JSON, tal como esta guardado hoy.
 *
 * Existe para la migracion del campo `contenido` de `blocks` a `richText`:
 * ese cambio hace que Payload borre las tablas `posts_blocks_*`, asi que hay
 * que sacar el contenido ANTES de tocar el campo. El paso inverso lo hace
 * `importar-contenido.ts`, ya con el esquema nuevo.
 *
 * Uso: pnpm exportar-contenido [ruta.json]
 */
const destino = path.resolve(
  process.argv[2] ?? path.resolve(process.cwd(), 'contenido-exportado.json'),
)

const exportar = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'posts',
    // Sin resolver relaciones: se guardan los ids, que es lo que hay que
    // volver a escribir del otro lado.
    depth: 0,
    limit: 1000,
    pagination: false,
    // La ultima version, este publicada o no.
    draft: true,
    locale: 'es',
  })

  const entradas = docs.map((doc) => {
    const d = doc as unknown as Record<string, unknown>
    return {
      id: d.id,
      slug: d.slug,
      titulo: d.titulo,
      contenido: d.contenido,
    }
  })

  mkdirSync(path.dirname(destino), { recursive: true })
  writeFileSync(destino, JSON.stringify(entradas, null, 2), 'utf8')

  const bloques = entradas.reduce(
    (total, e) => total + (Array.isArray(e.contenido) ? e.contenido.length : 0),
    0,
  )
  payload.logger.info(`Exportadas ${entradas.length} entradas (${bloques} bloques) -> ${destino}`)
}

await exportar()
process.exit(0)
