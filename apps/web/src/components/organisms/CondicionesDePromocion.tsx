import type { Promocion } from '@/payload-types'
import {
  ETIQUETAS_DE_ACTIVACION,
  ETIQUETAS_DE_VERTICAL,
  type FormaDeActivacion,
  type Vertical,
} from '@/scrapers/tipos'
import { fechaLarga } from '@/utilidades/texto'

/**
 * La tabla de condiciones del bono: rollover, deposito minimo, plazos, codigo.
 *
 * Usa la columna entera y no los 68ch del texto corrido, igual que cualquier
 * tabla dentro de `.prosa`.
 */

/**
 * Las filas numericas, con la unidad y en singular cuando toca.
 *
 * Devuelve `null` para 0 ademas de para vacio, y no por cosmetica: los campos
 * que cuentan cosas ("juegos habilitados") vienen vacios cuando la promocion no
 * limita nada, y un "0 juegos" en pantalla diria lo contrario de lo que dice el
 * origen. Ninguno de estos campos tiene un cero que signifique algo.
 */
const cantidad = (valor: number | null | undefined, singular: string, plural: string) =>
  valor ? `${valor} ${valor === 1 ? singular : plural}` : null

/** El select se guarda en minuscula; en la ficha se lee como una respuesta. */
const SE_COMBINA: Record<string, string> = { si: 'Sí', no: 'No' }

export interface CondicionesDePromocionProps {
  promo: Promocion
}

export function CondicionesDePromocion({ promo }: CondicionesDePromocionProps) {
  const verticales = (promo.verticales ?? []).map((v) => ETIQUETAS_DE_VERTICAL[v as Vertical])

  const condiciones = (
    [
      ['Rollover', promo.rollover],
      ['Plazo para cumplirlo', cantidad(promo.diasParaCumplir, 'día', 'días')],
      ['Depósito mínimo', promo.depositoMinimo],
      // Con coma decimal: una cuota se lee "1,50", no "1.50".
      ['Cuota mínima', promo.cuotaMinima?.toLocaleString('es-AR', { minimumFractionDigits: 2 })],
      ['Tope de conversión', promo.topeDeConversion],
      ['Usos por persona', cantidad(promo.usosPorUsuario, 'vez', 'veces')],
      // El vacio se omite solo, que es lo correcto: la plataforma no lo dice.
      ['Se combina con otros bonos', promo.combinable ? SE_COMBINA[promo.combinable] : null],
      [
        'Cómo se activa',
        promo.activacion ? ETIQUETAS_DE_ACTIVACION[promo.activacion as FormaDeActivacion] : null,
      ],
      ['Código', promo.codigo],
      ['Dónde se usa', verticales.join(', ')],
      ['Juegos habilitados', cantidad(promo.juegosHabilitados, 'juego', 'juegos')],
      ['Vigente desde', fechaLarga(promo.vigenciaDesde)],
      ['Vigente hasta', fechaLarga(promo.vigenciaHasta)],
    ] satisfies [string, string | null | undefined][]
  ).filter((fila): fila is [string, string] => Boolean(fila[1]))

  if (condiciones.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="font-display text-h2 text-tinta text-balance">Condiciones</h2>
      <div className="prosa mt-6">
        <div className="tabla-scroll">
          <table>
            <tbody>
              {condiciones.map(([etiqueta, valor]) => (
                <tr key={etiqueta}>
                  <th scope="row">{etiqueta}</th>
                  <td>{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
