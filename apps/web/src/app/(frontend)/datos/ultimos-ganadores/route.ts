import { obtenerUltimosGanadores } from '@/utilidades/ultimos-ganadores'

/**
 * `GET /datos/ultimos-ganadores` — los treinta premios mas altos de las cuatro
 * plataformas, consolidados.
 *
 * Existe para que la portada pueda mostrar premios frescos sin renunciar a su
 * ISR de una hora: las noticias salen de Payload y no cambian seguido, pero
 * "ultimos ganadores" con una hora de atraso ya no es lo que dice ser. La
 * seccion pide esto desde el cliente y el resto de la home sigue siendo
 * estatica.
 *
 * Que el fan-out a las cuatro jurisdicciones ocurra de este lado no es solo
 * prolijidad: al navegador le llega una sola respuesta, y sobre todo le llega
 * sin un solo nombre de usuario completo. La ofuscacion pasa antes de cruzar la
 * red, asi que ni el DevTools de quien mire tiene el dato original.
 *
 * No vive bajo `/api` a proposito: ese prefijo es de Payload, que lo atiende
 * entero con un catch-all en `(payload)/api/[...slug]`. Un segmento estatico le
 * ganaria a ese catch-all, pero seria una precedencia sutil de la que despues
 * depende una pantalla.
 */

/** Cuanto vale la respuesta antes de volver a pedirla, en segundos. */
const FRESCURA = 60

/** Cuanto tiempo mas se puede seguir sirviendo la vieja mientras se revalida. */
const GRACIA = 300

export async function GET() {
  const ganadores = await obtenerUltimosGanadores()

  return Response.json(ganadores, {
    headers: {
      /*
       * El mismo minuto que ya usan las peticiones de adentro. Sin esto la
       * ruta seria dinamica pura y cada visita a la portada dispararia cuatro
       * llamadas salientes.
       */
      'Cache-Control': `public, s-maxage=${FRESCURA}, stale-while-revalidate=${GRACIA}`,
    },
  })
}
