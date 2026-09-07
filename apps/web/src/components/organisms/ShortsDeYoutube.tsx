import { obtenerShorts, URL_DEL_CANAL } from '@/utilidades/shorts'

import { CarruselDeShorts } from './CarruselDeShorts'

/**
 * Los ultimos quince shorts del canal, entre los ultimos ganadores y la cinta
 * de proveedores.
 *
 * Va ahi por lo mismo que decide todo el orden de la portada: es contenido de
 * marca y no editorial, asi que no puede competir con las notas; pero es
 * contenido propio con cara y voz, asi que va por encima de la cinta de logos,
 * que es la firma de respaldo con la que cierra la pagina. Y va DEBAJO de los
 * ganadores porque esos son dato vivo con premios reales, que pesa mas que una
 * pieza de contenido.
 *
 * Es Server Component y trae sus datos en el render, al reves que
 * `UltimosGanadores`, que los pide desde el cliente. La razon es cada cuanto
 * cambia cada cosa: los premios se renuevan al minuto y por eso no pueden
 * quedar atrapados en el ISR horario de la portada, pero un canal que publica
 * algunos shorts por semana esta perfectamente servido por ese mismo ISR. Traer
 * esto en el servidor ahorra la ruta en `/datos`, el esqueleto de carga y el
 * salto de layout que viene con el.
 *
 * Sin shorts no hay seccion, y los tres casos que llevan a eso —canal sin
 * configurar, YouTube caido, feed vacio— terminan igual: la portada queda
 * exactamente como estaba. Un titulo sobre un hueco vacio seria peor que no
 * tener la seccion, que es el mismo criterio de los ganadores.
 */
export async function ShortsDeYoutube() {
  const shorts = await obtenerShorts()

  if (shorts.length === 0) return null

  return (
    <section aria-labelledby="titulo-shorts" className="pb-18 md:pb-32">
      {/*
       * Titulo y pista comparten el mismo `contenedor`, asi que la seccion
       * entera vive dentro de la columna centrada del sitio y no se sale por
       * ningun lado. Es lo que pide el bloque de layout de `styles.css` para
       * todo bloque nuevo: nadie define su propio maximo.
       *
       * Son dos `contenedor` hermanos y no uno solo envolviendo todo porque la
       * pista necesita ser el elemento que desborda —es quien lleva el
       * `overflow-x-auto`—, y meterla en el mismo div que el titulo la obligaria
       * a compartir contexto de scroll con el.
       */}
      <div className="contenedor">
        {/*
         * Mismo escalon que "Ultimos ganadores": las dos son vitrinas, no notas,
         * y quedan por debajo de un H2 de articulo y por encima del rotulo de
         * proveedores.
         */}
        <h2 className="font-display text-h3 text-tinta" id="titulo-shorts">
          Shorts del canal
        </h2>
      </div>

      <div className="contenedor mt-6 md:mt-8">
        <CarruselDeShorts hrefCanal={URL_DEL_CANAL} shorts={shorts} />
      </div>
    </section>
  )
}
