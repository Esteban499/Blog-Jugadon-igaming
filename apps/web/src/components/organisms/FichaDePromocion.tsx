import Link from 'next/link'

import { AvisoEnLinea } from '@/components/molecules/AvisoEnLinea'
import type { Plataforma, Promocion } from '@/payload-types'
import { ETIQUETAS_DE_TIPO, type TipoDePromocion } from '@/scrapers/tipos'
import { relacion } from '@/utilidades/payload'
import { estaVigente } from '@/utilidades/promociones'

import { CondicionesDePromocion } from './CondicionesDePromocion'

/**
 * El cuerpo de la pagina de una promocion: de que se trata, si sigue vigente y
 * bajo que condiciones.
 *
 * El boton para reclamarla y la nota legal no estan aca: son el cierre de la
 * pagina y viven en `CierreDePromocion`.
 */

export interface FichaDePromocionProps {
  promo: Promocion
}

export function FichaDePromocion({ promo }: FichaDePromocionProps) {
  const plataforma = relacion<Plataforma>(promo.plataforma)
  const vigente = estaVigente(promo)

  // Los puntos se guardan uno por linea, tal como los publica la plataforma.
  const puntos = (promo.puntosClave ?? '')
    .split('\n')
    .map((punto) => punto.trim())
    .filter(Boolean)

  /**
   * La bajada que va debajo del titulo.
   *
   * Normalmente es `oferta`, el gancho que publica la plataforma. Las
   * promociones que salen de sircms —torneos y promos de casino— casi nunca la
   * traen, y ademas no tienen puntos clave, asi que sin esto su ficha quedaria
   * sin una sola linea que explique de que se trata. Ahi cae al resumen, que en
   * esas es la bajada redactada del otro lado.
   *
   * No se muestra cuando ya hay puntos: en las campanias el resumen es una
   * linea armada con los mismos numeros que la tabla de abajo, y repetirla solo
   * agrega ruido.
   */
  const bajada =
    promo.oferta && promo.oferta !== promo.titulo
      ? promo.oferta
      : puntos.length === 0
        ? promo.resumen
        : undefined

  return (
    <>
      <header>
        <p className="font-util text-eyebrow uppercase">
          <Link
            className="text-accion transition-colors duration-150 ease-marca hover:text-tinta"
            href="/promociones"
          >
            Promociones
          </Link>
          {plataforma ? <span className="text-apagado"> · {plataforma.nombre}</span> : null}
          <span className="text-apagado"> · {ETIQUETAS_DE_TIPO[promo.tipo as TipoDePromocion]}</span>
        </p>

        <h1 className="mt-5 font-display text-h1 text-tinta text-balance">{promo.titulo}</h1>

        {bajada ? (
          <p className="mt-6 max-w-[60ch] text-bajada text-parrafo text-pretty">{bajada}</p>
        ) : null}
      </header>

      {!vigente ? (
        <AvisoEnLinea alerta className="mt-8" rotulo="Ya no está vigente">
          <p>
            La dejamos publicada como referencia, pero no se puede reclamar. Mirá las{' '}
            <Link
              className="text-enlace underline decoration-1 underline-offset-[3px] transition-colors duration-150 ease-marca hover:text-accion"
              href="/promociones"
            >
              promociones activas
            </Link>
            .
          </p>
        </AvisoEnLinea>
      ) : null}

      {promo.imagenOrigen ? (
        // Imagen de un dominio externo: sin `next/image`, que exigiria
        // autorizar cada plataforma en `next.config`.
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="mt-10 w-full rounded-caja" src={promo.imagenOrigen} />
      ) : null}

      {puntos.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-h2 text-tinta text-balance">Cómo funciona</h2>
          {/* `.prosa` le da a la lista los bullets de ficha del sistema. */}
          <div className="prosa mt-6">
            <ul>
              {puntos.map((punto) => (
                <li key={punto}>{punto}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <CondicionesDePromocion promo={promo} />
    </>
  )
}
