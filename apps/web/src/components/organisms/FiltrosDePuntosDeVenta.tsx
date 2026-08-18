import { FilaDeFiltros, type OpcionDeFiltro } from '@/components/molecules/FilaDeFiltros'
import {
  ETIQUETAS_DE_PROVINCIA,
  ETIQUETAS_DE_TIPO_DE_PUNTO,
  type Provincia,
  TIPOS_DE_PUNTO,
  type TipoDePunto,
} from '@/utilidades/puntos-de-venta'
import { rutaDePuntosDeVenta } from '@/utilidades/rutas'

/**
 * Los filtros de `/puntos-de-venta`: que tipo de local y en que provincia.
 *
 * Las dos filas quedan a la vista, sin el panel plegable de `/promociones`. Ahi
 * los filtros son cuatro grupos y esconderlos ordena la pantalla; aca son dos
 * preguntas, y las dos son la primera que trae quien entra a buscar un local.
 *
 * Volver a tocar un chip puesto lo saca, que es como se espera que funcione un
 * chip. No hay opcion "todas" justamente por eso: seria un segundo control para
 * lo que el propio chip ya hace, y sin filtros puestos el mapa muestra el pais
 * entero, que es lo correcto al entrar.
 *
 * La fila de provincias se arma con las que tienen puntos cargados y no con las
 * veinticuatro: un chip que devuelve cero resultados no es un filtro, es un
 * error que se ofrece.
 */

export interface SeleccionDePuntos {
  tipo?: TipoDePunto
  provincia?: Provincia
}

export interface FiltrosDePuntosDeVentaProps {
  /** Las que tienen al menos un punto activo, ya ordenadas por nombre. */
  provincias: readonly Provincia[]
  seleccion: SeleccionDePuntos
}

export function FiltrosDePuntosDeVenta({ provincias, seleccion }: FiltrosDePuntosDeVentaProps) {
  const { provincia, tipo } = seleccion

  const opcionesDeTipo: OpcionDeFiltro[] = TIPOS_DE_PUNTO.map((t) => ({
    clave: t,
    nombre: ETIQUETAS_DE_TIPO_DE_PUNTO[t],
    href: rutaDePuntosDeVenta({ provincia, tipo: tipo === t ? undefined : t }),
    activa: tipo === t,
  }))

  const opcionesDeProvincia: OpcionDeFiltro[] = provincias.map((p) => ({
    clave: p,
    nombre: ETIQUETAS_DE_PROVINCIA[p],
    href: rutaDePuntosDeVenta({ provincia: provincia === p ? undefined : p, tipo }),
    activa: provincia === p,
  }))

  return (
    <nav aria-label="Filtrar puntos de venta" className="contenedor flex flex-col gap-6">
      <FilaDeFiltros etiqueta="Tipo" opciones={opcionesDeTipo} />
      <FilaDeFiltros etiqueta="Provincia" opciones={opcionesDeProvincia} />
    </nav>
  )
}
