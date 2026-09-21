import { FilaDeFiltros, type OpcionDeFiltro } from '@/components/molecules/FilaDeFiltros'
import { PanelDeFiltros, type GrupoDeFiltros } from '@/components/organisms/PanelDeFiltros'
import type { Plataforma, Promocion } from '@/payload-types'
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
 *
 * En el panel solo aparecen las opciones que dejan algo en la grilla, contando
 * lo que ya esta puesto: con "Deportes" elegido, "Cashback" se va si ningun
 * cashback corre en deportes. Dos excepciones, a proposito:
 *
 * - La opcion puesta se ve siempre, aunque no tenga resultados. Es la unica
 *   forma de sacarla, y puede llegar asi por un enlace viejo o compartido.
 * - La fila de plataformas no se filtra. Es la eleccion principal, y esconder
 *   una provincia por un filtro secundario dejaria a quien juega ahi sin forma
 *   de llegar a sus bonos sin antes limpiar.
 */

export interface SeleccionDePromociones {
  /** Slug de la plataforma, ya resuelto: nunca viene vacio. */
  plataforma?: string
  tipo?: TipoDePromocion
  vertical?: Vertical
}

/** Lo minimo de cada promocion para saber que opciones llevan a algun lado. */
export type PromocionCandidata = Pick<Promocion, 'tipo' | 'verticales'>

export interface FiltrosDePromocionesProps {
  /**
   * Las promociones de la plataforma elegida sin los filtros del panel. Son
   * las mismas que puede mostrar la grilla: vigentes y sin las que ya salen en
   * los banners.
   */
  candidatas: readonly PromocionCandidata[]
  plataformas: Plataforma[]
  seleccion: SeleccionDePromociones
}

export function FiltrosDePromociones({
  candidatas,
  plataformas,
  seleccion,
}: FiltrosDePromocionesProps) {
  const { plataforma, tipo, vertical } = seleccion

  /** `true` si con este tipo y este vertical queda al menos una en la grilla. */
  const dejaResultados = (t?: TipoDePromocion, v?: Vertical): boolean =>
    candidatas.some(
      (promo) => (!t || promo.tipo === t) && (!v || (promo.verticales ?? []).includes(v)),
    )

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
      opciones: TIPOS_DE_PROMOCION.filter((t) => t === tipo || dejaResultados(t, vertical)).map(
        (t) => ({
          clave: t,
          nombre: ETIQUETAS_DE_TIPO[t],
          href: rutaDePromociones({ plataforma, tipo: tipo === t ? undefined : t, vertical }),
          activa: tipo === t,
        }),
      ),
    },
    {
      etiqueta: 'Dónde se usa',
      opciones: VERTICALES.filter((v) => v === vertical || dejaResultados(tipo, v)).map((v) => ({
        clave: v,
        nombre: ETIQUETAS_DE_VERTICAL[v],
        href: rutaDePromociones({ plataforma, tipo, vertical: vertical === v ? undefined : v }),
        activa: vertical === v,
      })),
    },
  ].filter((grupo) => grupo.opciones.length > 0)

  return (
    <nav aria-label="Filtrar promociones" className="contenedor">
      <FilaDeFiltros
        // Sin ninguna opcion que ofrecer, el boton abriria un panel vacio.
        antes={
          grupos.length > 0 ? (
            <PanelDeFiltros grupos={grupos} hrefLimpiar={rutaDePromociones({ plataforma })} />
          ) : undefined
        }
        etiqueta="Plataforma"
        opciones={opcionesDePlataforma}
      />
    </nav>
  )
}
