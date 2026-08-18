import { Esqueleto } from '@/components/atoms/Esqueleto'

/**
 * El hueco de una tarjeta que todavia no llego.
 *
 * Reproduce la anatomia de `TarjetaNoticia` —imagen 16:9, eyebrow, dos lineas
 * de titulo y metadato— para que al llegar los datos nada se corra de lugar.
 * Ese salto es lo que el manual llama movimiento que anuncia en vez de
 * confirmar (§6).
 */
export function EsqueletoDeTarjeta() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col overflow-hidden rounded-caja bg-superficie"
    >
      <Esqueleto className="aspect-video w-full bg-elevada" />

      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <Esqueleto className="h-3 w-20 rounded-full bg-elevada" />
        <Esqueleto className="h-5 w-full rounded-full bg-elevada" />
        <Esqueleto className="h-5 w-3/5 rounded-full bg-elevada" />
        <Esqueleto className="mt-auto h-3 w-32 rounded-full bg-elevada" />
      </div>
    </div>
  )
}
