/**
 * Las URLs de los listados, armadas en un solo lugar.
 *
 * Los filtros del sitio son enlaces y no botones: cada combinacion es una URL
 * propia que se puede compartir e indexar, y ademas funciona sin JavaScript.
 * Eso significa que la misma URL la tienen que saber armar dos piezas —la fila
 * de chips y la paginacion—, y estaban escritas por separado en cada pagina.
 *
 * Un parametro vacio nunca se escribe: `/blog` y `/blog?categoria=` serian dos
 * direcciones distintas para la misma pantalla.
 */

const conParametros = (base: string, params: Record<string, string | undefined>): string => {
  const q = new URLSearchParams()

  for (const [clave, valor] of Object.entries(params)) {
    if (valor) q.set(clave, valor)
  }

  const cadena = q.toString()
  return cadena ? `${base}?${cadena}` : base
}

export interface FiltrosDeBlog {
  categoria?: string
  pagina?: number
}

/** La pagina 1 no se escribe: es la misma pantalla que `/blog`. */
export const rutaDeBlog = ({ categoria, pagina }: FiltrosDeBlog = {}): string =>
  conParametros('/blog', {
    categoria,
    pagina: pagina && pagina > 1 ? String(pagina) : undefined,
  })

export interface FiltrosDePromociones {
  plataforma?: string
  tipo?: string
  vertical?: string
}

/**
 * La plataforma que se muestra cuando la URL no pide ninguna.
 *
 * `/promociones` sin filtro listaba las cinco jurisdicciones a la vez, y como
 * ofrecen casi los mismos bonos, la grilla repetia cada promocion cinco veces
 * cambiando solo la marca. Con una puesta por defecto lo primero que se ve es
 * un listado que se puede leer; las otras cuatro estan a un chip de distancia.
 */
export const PLATAFORMA_POR_DEFECTO = 'sanluis'

/**
 * La plataforma por defecto no se escribe, igual que la pagina 1 de `/blog`:
 * `/promociones` y `/promociones?plataforma=sanluis` serian dos direcciones
 * para la misma pantalla.
 */
export const rutaDePromociones = ({
  plataforma,
  tipo,
  vertical,
}: FiltrosDePromociones = {}): string =>
  conParametros('/promociones', {
    plataforma: plataforma === PLATAFORMA_POR_DEFECTO ? undefined : plataforma,
    tipo,
    vertical,
  })

export interface FiltrosDePuntosDeVenta {
  tipo?: string
  provincia?: string
}

/**
 * A diferencia de `/promociones`, aca no hay valor por defecto que ocultar: sin
 * filtros se muestran todos los puntos del pais, que es justo lo que se quiere
 * ver al entrar. Los dos chips son opcionales y se combinan entre si.
 */
export const rutaDePuntosDeVenta = ({ provincia, tipo }: FiltrosDePuntosDeVenta = {}): string =>
  conParametros('/puntos-de-venta', { tipo, provincia })
