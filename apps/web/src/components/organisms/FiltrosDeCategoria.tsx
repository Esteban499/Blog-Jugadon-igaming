import { FilaDeFiltros, type OpcionDeFiltro } from '@/components/molecules/FilaDeFiltros'
import type { Category } from '@/payload-types'
import { rutaDeBlog } from '@/utilidades/rutas'

/**
 * Los chips de categoria de `/blog`.
 *
 * Cambiar de filtro vuelve siempre a la pagina 1: la pagina 4 de "Todas" no
 * tiene por que existir dentro de una categoria con seis notas, y quedarse en
 * ella devolveria un listado vacio.
 */

export interface FiltrosDeCategoriaProps {
  categorias: Category[]
  /** El slug que vino por la URL, ya validado contra las categorias que hay. */
  slugElegido?: string
}

export function FiltrosDeCategoria({ categorias, slugElegido }: FiltrosDeCategoriaProps) {
  if (categorias.length === 0) return null

  const opciones: OpcionDeFiltro[] = [
    { clave: 'todas', nombre: 'Todas', href: rutaDeBlog(), activa: !slugElegido },
    ...categorias.map((categoria) => ({
      clave: categoria.id,
      nombre: categoria.nombre,
      href: rutaDeBlog({ categoria: categoria.slug ?? undefined }),
      activa: categoria.slug === slugElegido,
    })),
  ]

  return (
    <nav aria-label="Filtrar por categoría" className="contenedor">
      <FilaDeFiltros opciones={opciones} />
    </nav>
  )
}
