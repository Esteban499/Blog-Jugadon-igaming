import { getImageProps } from 'next/image'

import {
  CarruselDeBanners,
  type DiapositivaDeBanner,
} from '@/components/organisms/CarruselDeBanners'
import type { Banner, Media } from '@/payload-types'
import { relacion } from '@/utilidades/payload'

/**
 * Los banners de campania que abren `/promociones`, por encima del `h1`.
 *
 * Lo que se dibuja aca es la campania; el catalogo es la grilla de abajo. Por
 * eso los banners salen de su propia coleccion y no de `promociones`: son una
 * pieza de arte con el monto ya dibujado adentro, no un bono con campos que se
 * comparan. Quien los carga y los apaga es marketing, desde el panel.
 *
 * Dos artes por banner y no una escalada: la faja de escritorio y el rectangulo
 * de telefono no son el mismo dibujo recortado —cambia la composicion, el texto
 * se reacomoda— asi que se sirven como art direction con `<picture>`, que
 * ademas baja una sola de las dos.
 *
 * Es Server Component: `getImageProps` arma aca los `srcSet` optimizados y al
 * cliente viaja nada mas que el `<picture>` ya resuelto.
 */

/**
 * El tope al que se sirve la imagen de escritorio.
 *
 * Es el ancho del arte de hoy. Sirve de tope y no de medida: un banner cargado
 * mas grande se sigue sirviendo hasta aca, que es lo ancho que puede llegar a
 * dibujarse la caja.
 */
const ANCHO_MAXIMO = 1350

/**
 * El corte entre el arte de telefono y el de escritorio.
 *
 * Es el `md` del sistema. Tiene que coincidir con el `md:` que cambia la
 * proporcion de la caja en `CarruselDeBanners`: si se separan, en la franja
 * entre un valor y el otro la imagen no llena su caja.
 */
const CORTE = '(min-width: 768px)'

export interface BannersDePromocionesProps {
  /** Los banners activos que le tocan a esta pantalla, ya en orden. */
  banners: Banner[]
}

export function BannersDePromociones({ banners }: BannersDePromocionesProps) {
  const diapositivas = banners.flatMap((banner): DiapositivaDeBanner[] => {
    const escritorio = relacion<Media>(banner.imagenEscritorio)
    const telefono = relacion<Media>(banner.imagenTelefono)

    /*
     * Sin las dos imagenes no hay diapositiva. Los dos campos son obligatorios
     * en la coleccion, asi que esto solo pasa si un archivo se borro del media
     * despues de cargarse el banner: antes que romper la pantalla entera, se
     * cae ese banner y los demas siguen.
     */
    if (!escritorio?.url || !escritorio.width || !escritorio.height) return []
    if (!telefono?.url || !telefono.width || !telefono.height) return []

    /*
     * El `sizes` declara el ancho real de la caja, no el del arte: de `md` para
     * arriba el banner ocupa el contenedor menos su gutter, y recien pasados
     * los ~1400px de ventana llega al tope. Declarar el tope a secas haria que
     * una ventana de 900px se baje igual la version mas grande.
     */
    const comun = {
      alt: '',
      priority: true,
      sizes: `${CORTE} min(100vw - 48px, ${ANCHO_MAXIMO}px), 100vw`,
    }

    const {
      props: { srcSet: srcSetEscritorio },
    } = getImageProps({
      ...comun,
      height: escritorio.height,
      src: escritorio.url,
      width: escritorio.width,
    })

    const {
      props: { srcSet: srcSetTelefono, ...resto },
    } = getImageProps({
      ...comun,
      height: telefono.height,
      src: telefono.url,
      width: telefono.width,
    })

    return [
      {
        clave: String(banner.id),
        etiqueta: banner.mensaje,
        imagen: (
          <picture>
            <source media={CORTE} srcSet={srcSetEscritorio} />
            {/*
             * `alt` vacio y no el mensaje: el texto ya esta dibujado dentro de
             * la imagen y el nombre accesible lo pone el boton que la cubre.
             * Repetirlo aca haria que un lector de pantalla lea la campania dos
             * veces seguidas.
             *
             * `object-cover` sin recorte real mientras el arte tenga la
             * proporcion de su caja. Esta para que una pieza cargada con otra
             * medida entre prolija en lugar de deformarse.
             */}
            <img {...resto} className="size-full object-cover" srcSet={srcSetTelefono} />
          </picture>
        ),
      },
    ]
  })

  // Sin banners cargados —o con todos apagados— la pantalla arranca en su `h1`.
  if (diapositivas.length === 0) return null

  return <CarruselDeBanners diapositivas={diapositivas} />
}
