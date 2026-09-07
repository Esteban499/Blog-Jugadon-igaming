import { Esqueleto } from '@/components/atoms/Esqueleto'
import { EsqueletoDeTarjeta } from '@/components/molecules/EsqueletoDeTarjeta'

/**
 * Lo que se ve mientras un listado busca sus datos.
 *
 * Es la misma maqueta que `PlantillaDeListado` con esqueletos en lugar de
 * contenido: carrusel de banners, encabezado, fila de filtros y grilla de tres
 * columnas. Al llegar los datos nada cambia de lugar.
 *
 * Lo comparten `/blog` y `/promociones`, que es tambien la razon por la que
 * tiene sentido que exista: dos `loading.tsx` que hubieran maquetado esto por
 * separado son dos maquetas mas para mantener sincronizadas con la de verdad.
 */

export interface PlantillaDeListadoCargandoProps {
  /** Cuantas filas de chips dibujar. `/blog` y `/promociones` tienen una. */
  filasDeFiltros?: number
  /**
   * El carrusel de banners que va por encima del titulo. Solo `/promociones`:
   * sin el hueco reservado, el `h1` y todo lo que sigue saltan hacia abajo
   * cuando bajan las imagenes.
   */
  sobreElTitulo?: boolean
  /** `/promociones` no lleva bajada, y su esqueleto tampoco puede llevarla. */
  bajada?: boolean
  tarjetas?: number
}

export function PlantillaDeListadoCargando({
  bajada = true,
  filasDeFiltros = 1,
  sobreElTitulo = false,
  tarjetas = 6,
}: PlantillaDeListadoCargandoProps) {
  return (
    <div className="ritmo">
      {sobreElTitulo ? (
        // Mismas proporciones y mismo tope de ancho que el carrusel de verdad
        // —800x400 en telefono, 1350x260 de `md` para arriba—, o el hueco
        // reservado no serviria de nada.
        <div className="contenedor mb-10 md:mb-14">
          <div className="mx-auto max-w-[1350px]">
            <Esqueleto className="aspect-[800/400] w-full rounded-caja md:aspect-[1350/260]" />
            <div className="mt-4 flex items-center justify-center gap-2">
              <Esqueleto className="h-2 w-6 rounded-full" />
              <Esqueleto className="h-2 w-2 rounded-full" />
            </div>
          </div>
        </div>
      ) : null}

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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: tarjetas }, (_, i) => (
            <EsqueletoDeTarjeta key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
