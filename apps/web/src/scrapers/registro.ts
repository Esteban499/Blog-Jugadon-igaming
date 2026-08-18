// Con extension: ver la nota en `jobs/scrapear-promociones.ts`.
import { jugadonBonusEngine } from './jugadon-bonus-engine.ts'
import { jugadonSircms } from './jugadon-sircms.ts'
import type { Adaptador, SlugDeAdaptador } from './tipos'

/**
 * Corre varios adaptadores sobre la misma plataforma y junta lo que traen.
 *
 * Existe porque una plataforma publica por dos APIs distintas y el panel le
 * deja elegir un solo adaptador. Componer aca sale mas barato que volver
 * `adaptador` un campo de multiples valores: eso pedia migrar una columna enum
 * a tabla, con las cinco plataformas cargadas.
 *
 * Si UNO falla, falla todo, y es deliberado. `Promise.all` rechaza con el
 * primer error en lugar de devolver lo que si se pudo leer, porque un
 * resultado parcial es indistinguible de "estas promociones ya no estan": el
 * runner expiraria todo lo del origen caido. Es la misma prudencia de la regla
 * 3, aplicada un escalon mas arriba.
 */
const combinar =
  (...partes: Adaptador[]): Adaptador =>
  async (contexto) => {
    const resultados = await Promise.all(partes.map((parte) => parte(contexto)))
    return {
      promociones: resultados.flatMap((r) => r.promociones),
      avisos: resultados.flatMap((r) => r.avisos),
    }
  }

/**
 * De que slug de adaptador sale que implementacion.
 *
 * Este archivo lo importa el runner, nunca la config de Payload: aca si se
 * importan modulos que solo corren en Node. La lista de slugs que ve el panel
 * vive aparte, en `tipos.ts`, por ese mismo motivo.
 *
 * Hoy las cinco plataformas comparten adaptador porque comparten plataforma:
 * son el mismo Nuxt con las mismas dos APIs detras, cambiando el dominio. Los
 * dos slugs sueltos quedan para poder aislar un origen sin tocar codigo, que
 * sirve cuando uno de los dos se rompe y conviene seguir leyendo el otro.
 */
export const adaptadores: Partial<Record<SlugDeAdaptador, Adaptador>> = {
  jugadon: combinar(jugadonBonusEngine, jugadonSircms),
  'jugadon-bonus-engine': jugadonBonusEngine,
  'jugadon-sircms': jugadonSircms,
}
