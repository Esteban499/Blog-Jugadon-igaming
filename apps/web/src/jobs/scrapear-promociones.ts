import type { TaskHandler } from 'payload'
import { correrScrapeo } from '../scrapers/correr.ts'

/**
 * La corrida diaria, como tarea del Jobs Queue.
 *
 * Vive en su propio archivo y la config la referencia por RUTA, no importando
 * esta funcion. El motivo es que `payload.config.ts` tambien se empaqueta para
 * el navegador: importar el handler desde ahi arrastraria el scraper entero al
 * bundle del panel. Payload acepta `handler` como string justamente para esto.
 *
 * El handler no envuelve nada en try/catch: si la corrida falla, conviene que
 * el job quede marcado como fallido y se reintente, en lugar de terminar "bien"
 * sin haber traido nada.
 *
 * Los imports relativos de este archivo, y los de todo lo que arrastra, llevan
 * la extension `.ts` escrita. No es un detalle de estilo: como Payload carga
 * este modulo por ruta, lo importa Node y no el bundler de Next, y el ESM de
 * Node exige el especificador completo. Sin la extension la corrida programada
 * muere antes de empezar, con un "Cannot find module" que no aparece en ningun
 * lado salvo en el campo `error` del job.
 *
 * Por ese mismo motivo, en desarrollo el scraper NO tiene hot reload. Node
 * cachea el modulo por lo que dure el proceso, asi que tocar este archivo o
 * cualquiera de `scrapers/` pide reiniciar `pnpm dev` para que la corrida use
 * el codigo nuevo. Sintoma tipico: se corrige algo, el error no cambia, y el
 * mensaje sigue citando una linea que ya no existe.
 */
export const scrapearPromociones: TaskHandler<'scrapearPromociones'> = async ({ req }) => {
  const resumenes = await correrScrapeo(req.payload)

  return {
    output: {
      plataformas: resumenes.length,
      creadas: resumenes.reduce((n, r) => n + r.creadas, 0),
      actualizadas: resumenes.reduce((n, r) => n + r.actualizadas, 0),
      expiradas: resumenes.reduce((n, r) => n + r.expiradas, 0),
      avisos: resumenes.flatMap((r) => r.avisos.map((a) => `${r.plataforma}: ${a}`)),
    },
  }
}
