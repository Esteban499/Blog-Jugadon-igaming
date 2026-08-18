import { FilaDeFiltros, type OpcionDeFiltro } from '@/components/molecules/FilaDeFiltros'
import { PanelDeFiltros, type GrupoDeFiltros } from '@/components/organisms/PanelDeFiltros'
import type { Plataforma } from '@/payload-types'
import {
  ETIQUETAS_DE_TIPO,
  ETIQUETAS_DE_VERTICAL,
  TIPOS_DE_PROMOCION,
  type TipoDePromocion,
  VERTICALES,
  type Vertical,
} from '@/scrapers/tipos'
import { rutaDePromociones } from '@/utilidades/rutas'

/**
 * Los filtros de `/promociones`: la fila de plataformas, y detras de un boton,
 * el tipo de bono y donde se usa.
 *
 * A la vista queda una sola pregunta, y es la que el visitante ya trae
 * contestada: en que provincia juega. Las cinco plataformas ofrecen casi los
 * mismos bonos, asi que sin plataforma elegida la grilla mostraba cinco veces
 * la misma promocion; por eso siempre hay una puesta y la fila no tiene un
 * "todas".
 *
 * El resto de los filtros va adentro del panel. Volver a tocar uno ya puesto lo
 * saca, que es como se espera que funcione un chip; el de plataforma es la
 * excepcion, porque ahi no existe el estado "sin plataforma".
 */

export interface SeleccionDePromociones {
  /** Slug de la plataforma, ya resuelto: nunca viene vacio. */
  plataforma?: string
  tipo?: TipoDePromocion
  vertical?: Vertical
}

export interface FiltrosDePromocionesProps {
  plataformas: Plataforma[]
  seleccion: SeleccionDePromociones
}

export function FiltrosDePromociones({ plataformas, seleccion }: FiltrosDePromocionesProps) {
  const { plataforma, tipo, vertical } = seleccion

  const opcionesDePlataforma: OpcionDeFiltro[] = plataformas.map((p) => ({
    clave: p.id,
    nombre: p.nombre,
    // Sin toggle: la plataforma no se saca, se cambia por otra.
    href: rutaDePromociones({ plataforma: p.slug ?? undefined, tipo, vertical }),
    activa: p.slug === plataforma,
  }))

  const grupos: GrupoDeFiltros[] = [
    {
      etiqueta: 'Tipo de bono',
      opciones: TIPOS_DE_PROMOCION.map((t) => ({
        clave: t,
        nombre: ETIQUETAS_DE_TIPO[t],
        href: rutaDePromociones({ plataforma, tipo: tipo === t ? undefined : t, vertical }),
        activa: tipo === t,
      })),
    },
    {
      etiqueta: 'Dónde se usa',
      opciones: VERTICALES.map((v) => ({
        clave: v,
        nombre: ETIQUETAS_DE_VERTICAL[v],
        href: rutaDePromociones({ plataforma, tipo, vertical: vertical === v ? undefined : v }),
        activa: vertical === v,
      })),
    },
  ]

  return (
    <nav aria-label="Filtrar promociones" className="contenedor">
      <FilaDeFiltros
        antes={
          <PanelDeFiltros
            grupos={grupos}
            hrefLimpiar={rutaDePromociones({ plataforma })}
          />
        }
        etiqueta="Plataforma"
        opciones={opcionesDePlataforma}
      />
    </nav>
  )
}
