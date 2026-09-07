'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Las dos copias del video de portada, cada una con su poster.
 *
 * No son el mismo material recortado: los dos montajes traen tipografia pegada
 * a los bordes del cuadro —"HASTA LA CANCHA", "SOLO PARA MAYORES"—, asi que
 * cada encuadre esta hecho para su relacion de aspecto y ninguno de los dos
 * tolera que le coman los costados.
 *
 * Cada poster es el **primer cuadro exacto** de su video. Es la unica forma de
 * que el fundido de entrada no se note: el video aparece encima de la misma
 * imagen que ya estaba, y lo que se ve es el arranque del movimiento y no un
 * salto de encuadre.
 */
const VERTICAL = {
  poster: '/video-blog-vertical-poster.jpg',
  video: '/Blog-Vertical.mp4',
} as const

const HORIZONTAL = {
  poster: '/video-blog-horizontal-poster.jpg',
  video: '/video-blog-horizontal.mp4',
} as const

/**
 * Cuando entra la copia vertical.
 *
 * El ancho es el `md` de Tailwind (48rem) escrito a mano porque quien elige la
 * fuente es JS y no una utilidad; si el sistema cambia de breakpoint, este
 * numero y el `max-md:portrait:` del marcado cambian juntos.
 *
 * La orientacion no sobra: un telefono chico acostado entra por ancho pero
 * tiene un cuadro apaisado, y ahi la copia que sirve es la horizontal.
 */
const CONSULTA_VERTICAL = '(max-width: 47.999rem) and (orientation: portrait)'

/**
 * Portada de video de la home.
 *
 * Llena el contenedor que la ancla —no fija su propio alto— porque quien
 * decide cuanto mide es el bloque `sticky` de la home, que tiene que valer
 * exactamente una vista para clavarse bien contra el borde superior.
 *
 * **Una sola copia se descarga.** La fuente se elige en el cliente con
 * `matchMedia` y no con dos `<video>` tapados por CSS ni con `<source media>`
 * —que los navegadores ignoran en `<video>`—: entre las dos copias hay 21 MB, y
 * la que no se ve no se paga. Los posters si van los dos en el marcado, tapados
 * por CSS: pesan 50 KB, tienen que estar en el HTML del servidor para cubrir el
 * rato anterior a la hidratacion, y el navegador no descarga el fondo de un
 * elemento en `display: none`.
 *
 * **El vertical entra completo, no recortado.** En un telefono el cuadro 9:16
 * del video es mas ancho que la vista —un 390x844 da 0.46 contra 0.5625—, asi
 * que `object-cover` escala por alto y se lleva puestos unos 85px de los
 * costados, justo donde vive la tipografia del montaje. Con `object-contain`
 * el video entra por ancho y sobran unos 75px arriba y abajo, y esas dos
 * franjas caen exactamente donde no se ven: la de arriba queda detras de la
 * barra transparente, que mide 72px, y la de abajo adentro del velo, que a esa
 * altura ya es `--color-fondo` puro. De ahi que el sobrante sea del color del
 * sitio y no negro. En pantallas grandes no hay nada que resolver: el cuadro
 * 16:9 es mas ancho que cualquier vista de escritorio y `object-cover` recorta
 * arriba y abajo, que es donde estos montajes tienen aire.
 *
 * **Sin leyenda encima del video.** El aviso legal no se superpone al cuadro:
 * la unica pieza de chrome legal del sitio vive en el footer, que es donde se
 * la busca y donde no compite con la portada.
 *
 * El velo del pie si se queda, y no es decoracion: es la juntura entre el
 * video y el cuerpo de la pagina. `PlantillaDePortada` hace trepar la primera
 * seccion `--solapamiento` por encima de la portada, y sin el degradado a
 * `--color-fondo` esa seccion arranca contra un cuadro de video a pleno, con
 * un corte duro donde deberia haber una transicion. El degradado es lo que
 * hace que el fondo del sitio parezca nacer del video.
 *
 * **Sin parallax.** River desplaza su video con un `translateY` escrito por
 * JS al scrollear; el manual lo prohibe explicitamente (§6). El anclado es
 * estructura —el video no se mueve, se queda quieto— y eso si entra.
 */
export function VideoHero() {
  const video = useRef<HTMLVideoElement>(null)
  const [fuente, setFuente] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_VERTICAL)

    const elegir = () => setFuente(consulta.matches ? VERTICAL.video : HORIZONTAL.video)

    elegir()
    consulta.addEventListener('change', elegir)
    return () => consulta.removeEventListener('change', elegir)
  }, [])

  useEffect(() => {
    const nodo = video.current
    // Sin fuente todavia no hay nada que arrancar: el `<video>` esta vacio.
    if (!nodo || !fuente) return

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
    // Cambiar `src` dispara solo la carga del nuevo archivo, pero el arranque
    // hay que volver a pedirlo: por eso la fuente es dependencia.
  }, [fuente])

  return (
    <section aria-label="Portada" className="relative size-full overflow-hidden bg-fondo">
      {/*
       * Los posters van de fondo y no en el atributo `poster` porque el video
       * se funde por encima: si vivieran dentro del `<video>` se desvanecerian
       * junto con el, y el corte del primer cuadro volveria a verse.
       *
       * Cada uno repite el encaje de su copia —`contain` el vertical, `cover`
       * el horizontal— porque si no coincidieran, el fundido mostraria dos
       * encuadres distintos de la misma imagen.
       */}
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-contain bg-center bg-no-repeat max-md:portrait:block"
        style={{ backgroundImage: `url(${VERTICAL.poster})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center max-md:portrait:hidden"
        style={{ backgroundImage: `url(${HORIZONTAL.poster})` }}
      />

      <video
        autoPlay
        className={`relative size-full object-cover transition-opacity duration-400 ease-marca max-md:portrait:object-contain ${
          listo && fuente ? 'opacity-100' : 'opacity-0'
        }`}
        loop
        // El archivo trae pista de audio: sin `muted` ningun navegador lo
        // arranca solo.
        muted
        onCanPlay={() => setListo(true)}
        playsInline
        preload="metadata"
        ref={video}
        // `undefined` y no `''`: un `src` vacio resuelve contra la URL de la
        // pagina y el navegador se pone a descargar el HTML como si fuera video.
        src={fuente ?? undefined}
      />

      {/*
       * La juntura con el cuerpo de la pagina. Es puramente visual —ya no lleva
       * texto—, asi que va `aria-hidden`: para un lector de pantalla no existe.
       *
       * El alto cubre la franja que las tarjetas tapan al treparse mas el
       * recorrido del degradado, y por eso la cuenta la hace el mismo token que
       * las mueve: si `--solapamiento` cambia y esto quedara fijo, el fundido
       * terminaria antes o despues de donde arranca el contenido.
       */}
      <div
        aria-hidden
        className="velo absolute inset-x-0 bottom-0"
        style={{ height: 'calc(var(--solapamiento) + 104px)' }}
      />
    </section>
  )
}
