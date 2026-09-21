import { BloqueCta } from '@/components/molecules/BloqueCta'
import type { Plataforma, Promocion } from '@/payload-types'
import { relacion } from '@/utilidades/payload'
import { estaVigente } from '@/utilidades/promociones'

/**
 * Como se reclama la promocion y donde estan sus terminos.
 *
 * El CTA es el unico de la pagina y va al final (§5.7). Solo aparece si la
 * promocion sigue vigente: ofrecer un boton para reclamar un bono vencido es
 * exactamente lo que no se puede hacer.
 *
 * La nota legal, en cambio, va siempre: los terminos existen igual, y quien
 * llega a una promocion vieja tambien tiene que poder llegar a ellos.
 */

export interface CierreDePromocionProps {
  promo: Promocion
}

export function CierreDePromocion({ promo }: CierreDePromocionProps) {
  const plataforma = relacion<Plataforma>(promo.plataforma)
  const nombre = plataforma?.nombre ?? 'la plataforma'

  return (
    <>
      {estaVigente(promo) ? (
        <div className="mt-16">
          <BloqueCta
            etiqueta="Ver la promoción"
            href={promo.urlDestino}
            /*
             * `sponsored` porque el enlace apunta a la plataforma que
             * comercializa el bono, y `noopener` porque abre en otra pestania.
             */
            rel="nofollow sponsored noopener"
            target="_blank"
            titulo={`Se canjea en ${nombre}`}
          >
            Ahí están también sus términos completos, que son los que valen y los únicos que están
            siempre actualizados.
          </BloqueCta>
        </div>
      ) : null}

      {/*
       * Los terminos no se reproducen: son un documento legal que cambia del
       * lado de la plataforma, y una copia en el blog puede quedar vieja justo
       * en lo que tiene que ser exacto. Se aclara que existen y se remite a
       * donde siempre estan vigentes.
       */}
      <p className="mt-12 border-t border-hairline pt-6 font-util text-legal text-apagado">
        Esta promoción está sujeta a los términos y condiciones de {nombre}, que podés consultar{' '}
        <a
          className="text-enlace underline decoration-1 underline-offset-[3px] transition-colors duration-150 ease-marca hover:text-accion"
          href={promo.urlDestino}
          rel="nofollow sponsored noopener"
          target="_blank"
        >
          en la página del bono
        </a>
        . Solo para mayores de 18 años. Jugá de forma responsable.
      </p>
    </>
  )
}
