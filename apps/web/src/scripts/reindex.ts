import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Vuelve a sincronizar todas las entradas contra el indice de busqueda.
 * Hace falta cada vez que cambia `beforeSync` en payload.config.ts, porque el
 * indice solo se actualiza al guardar cada documento.
 *
 * Uso: pnpm reindex
 */
const reindexar = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 1000,
    pagination: false,
  })

  for (const entrada of docs) {
    // Guardar sin cambios dispara el hook de sincronizacion del plugin.
    await payload.update({
      collection: 'posts',
      id: entrada.id,
      data: {},
    })
  }

  payload.logger.info(`Reindexadas ${docs.length} entradas.`)
}

await reindexar()
process.exit(0)
