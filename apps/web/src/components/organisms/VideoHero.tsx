'use client'

import { useEffect, useRef, useState } from 'react'

const POSTER = '/video-hero-poster.jpg'

/**
 * Portada de video de la home.
 *
 * Llena el contenedor que la ancla —no fija su propio alto— porque quien
 * decide cuanto mide es el bloque `sticky` de la home, que tiene que valer
 * exactamente una vista para clavarse bien contra el borde superior.
 *
 * La leyenda legal ya no vive quemada en el pie del archivo: va abajo como
 * HTML, anclada por encima de la franja que las tarjetas tapan al treparse.
 * Es mejor por dos motivos ademas del obvio de que se vea: un pixel no lo lee
 * un lector de pantalla ni lo indexa un buscador, y ademas deja de atar el
 * encuadre del video a no perder el pie.
 *
 * **Sin parallax.** River desplaza su video con un `translateY` escrito por
 * JS al scrollear; el manual lo prohibe explicitamente (§6). El anclado es
 * estructura —el video no se mueve, se queda quieto— y eso si entra.
 */
export function VideoHero() {
  const video = useRef<HTMLVideoElement>(null)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    const nodo = video.current
    if (!nodo) return

    // El video puede estar listo antes de que React enganche `onCanPlay`.
    if (nodo.readyState >= 3) setListo(true)

    /*
     * Quien pidio menos movimiento en su sistema se queda con el cuadro fijo.
     * El navegador no ofrece forma de expresar esto en CSS: hay que frenar la
     * reproduccion a mano.
     */
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')

    const aplicar = () => {
      if (consulta.matches) {
        nodo.pause()
        nodo.currentTime = 0
      } else {
        // `play()` rechaza si el navegador bloquea la reproduccion automatica.
        // No hay nada que hacer al respecto: queda el poster.
        void nodo.play().catch(() => {})
      }
    }

    aplicar()
    consulta.addEventListener('change', aplicar)
    return () => consulta.removeEventListener('change', aplicar)
  }, [])

  return (
    <section aria-label="Portada" className="relative size-full overflow-hidden bg-fondo">
      {/*
       * El poster va de fondo y no en el atributo `poster` porque el video se
       * funde por encima: si viviera dentro del `<video>` se desvaneceria
       * junto con el, y el corte del primer cuadro volveria a verse.
       */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${POSTER})` }}
      />

      <video
        autoPlay
        className={`relative size-full object-cover transition-opacity duration-400 ease-marca ${
          listo ? 'opacity-100' : 'opacity-0'
        }`}
        loop
        // El archivo trae pista de audio: sin `muted` ningun navegador lo
        // arranca solo.
        muted
        onCanPlay={() => setListo(true)}
        playsInline
        preload="metadata"
        ref={video}
        src="/video-hero.mp4"
      />

      {/*
       * Leyenda legal. Se ancla por encima del solapamiento, asi que las
       * tarjetas nunca la tapan por mas que trepen: la cuenta la hace el
       * mismo token que las mueve.
       *
       * El velo detras es la unica forma autorizada de poner texto sobre una
       * fotografia (§2.4), y aca ademas es lo que garantiza el contraste
       * contra un cuadro de video que cambia todo el tiempo.
       */}
      <div
        className="velo absolute inset-x-0 bottom-0 pt-16"
        style={{ paddingBottom: 'calc(var(--solapamiento) + 24px)' }}
      >
        <p className="contenedor font-util text-legal text-parrafo uppercase">
          +18 · Solo para mayores de 18 años · Jugá de forma responsable
        </p>
      </div>
    </section>
  )
}
