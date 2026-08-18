import { getPayload } from 'payload'
import config from '@payload-config'
import { correrScrapeo } from '../scrapers/correr'

/**
 * Corre el bot a mano, sin esperar a la corrida programada.
 *
 * Uso: pnpm scrapear-promos
 *
 * La logica no esta aca sino en `src/scrapers/correr.ts`, porque la comparte
 * con la tarea del Jobs Queue: si viviera en el script, la version programada
 * seria una copia que se desincroniza a la primera correccion.
 */
await correrScrapeo(await getPayload({ config }))
process.exit(0)
