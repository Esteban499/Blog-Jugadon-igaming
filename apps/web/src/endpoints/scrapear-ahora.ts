import type { Endpoint } from 'payload'
import { roleOf } from '../access/roles'

/**
 * Dispara la corrida del bot a pedido, desde el panel.
 *
 * La corrida programada sale a las 9 UTC y alcanza para el dia a dia, pero hay
 * momentos en que esperarla no sirve: se corrigio la URL de una plataforma, la
 * plataforma acaba de publicar un bono, o se quiere confirmar que el bot volvio
 * a andar. Para eso esta este endpoint, y el boton que lo llama.
 *
 * No reimplementa nada: encola la MISMA tarea que encola el cron y la corre.
 * Esa es la parte importante del disenio, y no es solo elegancia: significa que
 * si el boton anda, la corrida de la madrugada tambien, porque es exactamente
 * el mismo camino. Una version manual por afuera del Jobs Queue podria andar
 * perfecto mientras la programada sigue rota, que es justo el bug que este
 * archivo llega despues de arreglar.
 *
 * Tampoco importa el scraper. Este modulo lo alcanza la config de Payload, que
 * se empaqueta para el navegador; hablarle a la cola por el slug de la tarea
 * mantiene al scraper del lado del servidor, donde tiene que estar.
 */
export const scrapearAhora: Endpoint = {
  path: '/scrapear-ahora',
  method: 'post',
  handler: async (req) => {
    const rol = roleOf(req.user)
    if (rol !== 'admin' && rol !== 'editor') {
      return Response.json(
        { ok: false, mensaje: 'Hace falta una sesión de editor para correr el bot.' },
        { status: 403 },
      )
    }

    const { payload } = req

    /** Lo que el runner ya deja escrito en cada plataforma, para devolverlo tal cual. */
    const estadoDeLasPlataformas = async () => {
      const { docs } = await payload.find({
        collection: 'plataformas',
        depth: 0,
        limit: 100,
        pagination: false,
        sort: 'nombre',
        req,
      })

      return docs.map((p) => ({
        nombre: p.nombre,
        activa: Boolean(p.scrapeoActivo),
        resultado: p.ultimoResultado ?? null,
        corrida: p.ultimaCorrida ?? null,
      }))
    }

    try {
      const job = await payload.jobs.queue({
        task: 'scrapearPromociones',
        queue: 'diaria',
        input: {},
        req,
      })

      const { jobStatus } = await payload.jobs.runByID({ id: job.id, req })

      if (jobStatus?.[String(job.id)]?.status === 'success') {
        return Response.json({ ok: true, plataformas: await estadoDeLasPlataformas() })
      }

      /**
       * El job fallado guarda el motivo en su propio documento, y ese campo no
       * se ve en ninguna pantalla del panel. Se lee y se devuelve: sin esto, un
       * fallo del handler queda como un "algo salio mal" que solo se puede
       * diagnosticar entrando a la base.
       */
      const fallado = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
        depth: 0,
        req,
        disableErrors: true,
      })

      const motivo = (fallado?.error as { message?: string } | null | undefined)?.message

      return Response.json(
        {
          ok: false,
          mensaje: motivo ?? 'La corrida terminó con error y no dejó un motivo legible.',
          plataformas: await estadoDeLasPlataformas(),
        },
        { status: 500 },
      )
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Falló la corrida manual del bot de promociones.' })

      return Response.json(
        {
          ok: false,
          mensaje: error instanceof Error ? error.message : String(error),
          plataformas: await estadoDeLasPlataformas(),
        },
        { status: 500 },
      )
    }
  },
}
