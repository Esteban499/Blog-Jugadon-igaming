import { Esqueleto } from '@/components/atoms/Esqueleto'

/**
 * Lo que se ve mientras `/puntos-de-venta` busca sus datos.
 *
 * No reusa `PlantillaDeListadoCargando` porque esta pantalla no es una grilla:
 * es un recuadro grande con el buscador y la ficha al costado. El esqueleto de
 * listado dibuja tres columnas de tarjetas, y al llegar los datos todo se
 * reacomodaba —que es exactamente lo que un esqueleto existe para evitar—.
 *
 * El encabezado y las filas de chips si son los mismos: en esa parte las dos
 * pantallas coinciden, y las medidas salen de `PlantillaDeListado`.
 */

export interface PlantillaDeMapaCargandoProps {
  /** Cuantas filas de chips dibujar. `/puntos-de-venta` tiene dos. */
  filasDeFiltros?: number
}

export function PlantillaDeMapaCargando({ filasDeFiltros = 2 }: PlantillaDeMapaCargandoProps) {
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
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-6">
          <Esqueleto className="h-14 w-full rounded-caja lg:col-start-2 lg:row-start-1" />
          <Esqueleto className="h-[clamp(360px,60vh,640px)] w-full rounded-caja lg:col-start-1 lg:row-span-2 lg:row-start-1" />
          <Esqueleto className="h-4 w-3/4 rounded-full lg:col-start-2 lg:row-start-2" />
        </div>
      </div>
    </div>
  )
}
