import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Deja cargadas las cinco plataformas de Jugadon con su configuracion de lectura.
 *
 * Uso: pnpm cargar-plataformas
 *
 * Es idempotente y se puede correr cuantas veces haga falta: busca por slug y
 * actualiza en lugar de duplicar. No pisa `scrapeoActivo`, que es una decision
 * de operacion y no de configuracion: si alguien apago una plataforma desde el
 * panel, correr esto no se la vuelve a prender.
 *
 * El dato que justifica que esto exista es `urlApi`. Cuatro plataformas usan
 * `proxy<provincia>.jugadon.bet.ar`, pero San Luis pega contra `proxy2`. Es el
 * tipo de excepcion que se descubre una vez y despues nadie recuerda: sale del
 * `PROXY_URL` que cada sitio declara en su runtime config.
 */
const PLATAFORMAS = [
  { slug: 'santafe', nombre: 'Jugadon Santa Fe', host: 'santafe', api: 'proxysantafe' },
  { slug: 'sanluis', nombre: 'Jugadon San Luis', host: 'sanluis', api: 'proxy2' },
  { slug: 'cordoba', nombre: 'Jugadon Córdoba', host: 'cordoba', api: 'proxycordoba' },
  { slug: 'caba', nombre: 'Jugadon CABA', host: 'caba', api: 'proxycaba' },
  { slug: 'larioja', nombre: 'Jugadon La Rioja', host: 'larioja', api: 'proxylarioja' },
] as const

const cargar = async () => {
  const payload = await getPayload({ config })

  for (const p of PLATAFORMAS) {
    const datos = {
      nombre: p.nombre,
      slug: p.slug,
      urlSitio: `https://${p.host}.jugadon.bet.ar`,
      urlPromociones: `https://${p.host}.jugadon.bet.ar/bonus-campaign/`,
      urlApi: `https://${p.api}.jugadon.bet.ar`,
      adaptador: 'jugadon-bonus-engine' as const,
    }

    const { docs } = await payload.find({
      collection: 'plataformas',
      where: { slug: { equals: p.slug } },
      depth: 0,
      limit: 1,
    })

    if (docs[0]) {
      await payload.update({ collection: 'plataformas', id: docs[0].id, data: datos })
      payload.logger.info(`Actualizada: ${p.nombre}`)
    } else {
      await payload.create({
        collection: 'plataformas',
        data: { ...datos, scrapeoActivo: true },
      })
      payload.logger.info(`Creada: ${p.nombre}`)
    }
  }
}

await cargar()
process.exit(0)
