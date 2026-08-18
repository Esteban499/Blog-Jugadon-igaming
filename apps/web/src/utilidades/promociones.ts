import type { Promocion } from '@/payload-types'

/**
 * Si una promocion se puede reclamar ahora mismo.
 *
 * Son dos condiciones y las dos importan: `estado` es lo que el bot apaga
 * cuando la promocion desaparece del origen, y la fecha de corte cubre el hueco
 * entre corrida y corrida —el bot pasa una vez por dia, asi que puede haber
 * bonos vencidos todavia marcados como activos—.
 *
 * Lo consultan la ficha (para el cartel de "ya no esta vigente") y el cierre
 * (para no ofrecer el boton de reclamarla). Escrito por separado, alcanzaba con
 * tocar uno para que la pagina se contradijera a si misma.
 */
export const estaVigente = (promo: Pick<Promocion, 'estado' | 'vigenciaHasta'>): boolean => {
  const vencida = Boolean(promo.vigenciaHasta && new Date(promo.vigenciaHasta) < new Date())
  return promo.estado === 'activa' && !vencida
}
