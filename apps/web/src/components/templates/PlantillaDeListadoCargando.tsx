import { Esqueleto } from '@/components/atoms/Esqueleto'
import { EsqueletoDeTarjeta } from '@/components/molecules/EsqueletoDeTarjeta'

/**
 * Lo que se ve mientras un listado busca sus datos.
 *
 * Es la misma maqueta que `PlantillaDeListado` con esqueletos en lugar de
 * contenido: encabezado, fila de filtros y grilla de tres columnas. Al llegar
 * los datos nada cambia de lugar.
 *
 * Lo comparten `/blog` y `/promociones`, que es tambien la razon por la que
 * tiene sentido que exista: dos `loading.tsx` que hubieran maquetado esto por
 * separado son dos maquetas mas para mantener sincronizadas con la de verdad.
 */

export interface PlantillaDeListadoCargandoProps {
  /** Cuantas filas de chips dibujar. `/blog` y `/promociones` tienen una. */
  filasDeFiltros?: number
  /** `/promociones` no lleva bajada, y su esqueleto tampoco puede llevarla. */
  bajada?: boolean
  tarjetas?: number
}

export function PlantillaDeListadoCargando({
  bajada = true,
  filasDeFiltros = 1,
  tarjetas = 6,
}: PlantillaDeListadoCargandoProps) {
  return (
    <div className="ritmo">
      <header className="contenedor">
        <Esqueleto className="h-10 w-64 max-w-full rounded-caja md:h-14" />
        {bajada ? <Esqueleto className="mt-6 h-4 w-[46ch] max-w-full rounded-full" /> : null}
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

      <div className="contenedor mt-8 md:mt-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: tarjetas }, (_, i) => (
            <EsqueletoDeTarjeta key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
