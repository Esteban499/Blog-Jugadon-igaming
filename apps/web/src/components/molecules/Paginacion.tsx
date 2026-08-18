import { Boton } from '@/components/atoms/Boton'

/**
 * Anterior / posicion / siguiente.
 *
 * Botones terciarios: la paginacion es navegacion de servicio, no la accion de
 * la pantalla. El deshabilitado se marca con `aria-disabled` y no sacando el
 * enlace, para que el foco de teclado no salte de lugar al llegar al borde.
 *
 * `hrefDePagina` lo arma la ruta, que es la unica que sabe que otros filtros
 * hay puestos y tiene que conservar.
 */

export interface PaginacionProps {
  pagina: number
  totalPaginas: number
  hrefDePagina: (pagina: number) => string
}

export function Paginacion({ hrefDePagina, pagina, totalPaginas }: PaginacionProps) {
  if (totalPaginas <= 1) return null

  return (
    <nav
      aria-label="Paginación"
      className="contenedor mt-12 flex items-center justify-between gap-4"
    >
      <Boton aria-disabled={pagina <= 1} href={hrefDePagina(pagina - 1)} variante="terciaria">
        Anterior
      </Boton>

      <p className="font-util text-meta text-apagado uppercase">
        Página {pagina} de {totalPaginas}
      </p>

      <Boton
        aria-disabled={pagina >= totalPaginas}
        href={hrefDePagina(pagina + 1)}
        variante="terciaria"
      >
        Siguiente
      </Boton>
    </nav>
  )
}
