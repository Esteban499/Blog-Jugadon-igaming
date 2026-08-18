import { Esqueleto } from '@/components/atoms/Esqueleto'

/**
 * Lo que se ve mientras `/puntos-de-venta` busca sus datos.
 *
 * No reusa `PlantillaDeListadoCargando` porque esta pantalla no es una grilla:
 * es un recuadro grande al lado de una columna de fichas. El esqueleto de
 * listado dibuja tres columnas de tarjetas, y al llegar los datos todo se
 * reacomodaba —que es exactamente lo que un esqueleto existe para evitar—.
 *
 * El encabezado y las filas de chips si son los mismos: en esa parte las dos
 * pantallas coinciden, y las medidas salen de `PlantillaDeListado`.
 */

export interface PlantillaDeMapaCargandoProps {
  /** Cuantas filas de chips dibujar. `/puntos-de-venta` tiene dos. */
  filasDeFiltros?: number
  fichas?: number
}

export function PlantillaDeMapaCargando({
  fichas = 4,
  filasDeFiltros = 2,
}: PlantillaDeMapaCargandoProps) {
  return (
    <div className="ritmo">
      <header className="contenedor">
        <Esqueleto className="h-10 w-64 max-w-full rounded-caja md:h-14" />
        <Esqueleto className="mt-6 h-4 w-[46ch] max-w-full rounded-full" />
      </header>

      <div className="contenedor mt-8 flex flex-col gap-6 md:mt-12">
        {Array.from({ length: filasDeFiltros }, (_, fila) => (
          <div className="flex flex-wrap gap-3" key={fila}>
            {Array.from({ length: 5 }, (_, chip) => (
              <Esqueleto className="h-7 w-24 rounded-full" key={chip} />
            ))}
          </div>
        ))}
      </div>

      {/* Las mismas medidas que `MapaDePuntosDeVenta`: si una cambia, cambian las dos. */}
      <div className="contenedor mt-8 md:mt-12">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <Esqueleto className="h-[clamp(360px,60vh,640px)] w-full rounded-caja" />

          <div className="flex flex-col gap-3">
            {Array.from({ length: fichas }, (_, i) => (
              <Esqueleto className="h-40 w-full rounded-caja" key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
