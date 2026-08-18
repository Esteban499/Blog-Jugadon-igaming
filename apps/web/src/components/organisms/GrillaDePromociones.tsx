import { TarjetaPromocion } from '@/components/molecules/TarjetaPromocion'
import type { Plataforma, Promocion } from '@/payload-types'
import { ETIQUETAS_DE_TIPO, type TipoDePromocion } from '@/scrapers/tipos'
import { relacion } from '@/utilidades/payload'

/**
 * La grilla de bonos vigentes. Misma maqueta que `GrillaDeNoticias`, porque son
 * la misma pieza con otro dato adentro: si se vieran distintas, el sitio
 * tendria dos sistemas de listado.
 */

export interface GrillaDePromocionesProps {
  promociones: Promocion[]
}

export function GrillaDePromociones({ promociones }: GrillaDePromocionesProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {promociones.map((promo) => (
        <li key={promo.id}>
          <TarjetaPromocion
            imagenUrl={promo.imagenOrigen}
            oferta={promo.oferta}
            plataforma={relacion<Plataforma>(promo.plataforma)?.nombre}
            slug={promo.slug ?? ''}
            tipo={ETIQUETAS_DE_TIPO[promo.tipo as TipoDePromocion]}
            titulo={promo.titulo}
            vigenciaHasta={promo.vigenciaHasta}
          />
        </li>
      ))}
    </ul>
  )
}
