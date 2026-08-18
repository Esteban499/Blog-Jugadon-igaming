'use client'

import { addProtocol, LngLatBounds, Map as MapaMapLibre, Marker } from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * La hoja de estilos de MapLibre NO se importa aca: entra desde `styles.css`,
 * con `@import ... layer(maplibre)`. Importada desde este archivo quedaria sin
 * capa, y en la cascada lo no-capado le gana a cualquier `@layer` sin importar
 * la especificidad: nuestros retoques de la atribucion y los controles no
 * pintaban nunca.
 */

/*
 * Imports a archivo y no a los barriles: este componente es cliente, y en App
 * Router importar un barril desde el lado cliente arrastra al bundle todo lo
 * que ese barril toca. Es la regla que documenta `atoms/index.ts`.
 */
import { AvisoEnLinea } from '@/components/molecules/AvisoEnLinea'
import { TarjetaPuntoDeVenta } from '@/components/molecules/TarjetaPuntoDeVenta'
import { ENCUADRE_ARGENTINA, estiloDelMapa, urlDeComoLlegar } from '@/utilidades/mapa'
import type { TipoDePunto } from '@/utilidades/puntos-de-venta'

/**
 * El mapa de salas y agencias, con su lista al costado.
 *
 * Las dos mitades son una sola pieza y por eso viven en un solo componente:
 * comparten el punto seleccionado. Tocar un marcador resalta su ficha en la
 * lista y la trae a la vista; tocar una ficha centra el mapa en su marcador. Con
 * el mapa y la lista separados, ese estado tendria que subir a la pagina, que es
 * un Server Component y no puede tenerlo.
 *
 * **MapLibre sobre un `.pmtiles` propio.** El mapa entero —geometria y rotulos—
 * sale de un solo archivo en el bucket del proyecto, que MapLibre lee por rangos
 * HTTP: pide los pedazos del pais que estan en pantalla y nada mas. Sin clave,
 * sin cuota y sin factura por visita.
 *
 * **Los marcadores son DOM, no dibujos.** Es la diferencia grande contra la
 * version con Google, donde el pin era un path SVG con el color pasado a mano y
 * vivia dentro de un canvas. Aca cada marcador es un `<button>` de verdad: lleva
 * clases del sistema, entra en el orden de tabulacion y lo anuncia el lector de
 * pantalla. El circulo es el de la ficha de poker del logotipo (§1), que es el
 * unico ornamento del sistema y justo la forma que pedia un marcador.
 *
 * **El basemap va en la paleta de Google Maps, no en la del sitio.** Es una
 * excepcion al manual, decidida a proposito y documentada en el bloque MAPA de
 * `styles.css`: la pantalla existe para encontrar un local y salir, y un mapa
 * que se parece al que la persona ya usa todos los dias se entiende sin mirarlo
 * dos veces. Los marcadores son la excepcion de la excepcion y siguen siendo de
 * la marca; lo unico que les cambio es que ahora van rellenos y con anillo
 * blanco, que es lo que se lee sobre tierra clara.
 */

export interface PuntoEnMapa {
  id: number
  nombre: string
  tipo: TipoDePunto
  /** "Sala" o "Agencia", ya traducido por la pagina. */
  etiquetaDeTipo: string
  direccion: string
  localidad: string
  /** El nombre de la provincia, ya traducido por la pagina. */
  provincia: string
  telefono?: string | null
  horarios?: string | null
  fotoUrl?: string | null
  latitud: number
  longitud: number
}

export interface MapaDePuntosDeVentaProps {
  puntos: readonly PuntoEnMapa[]
  /**
   * `undefined` cuando la variable de entorno no esta cargada. La lista se
   * dibuja igual: las direcciones y los telefonos son el dato que importa, y el
   * mapa es la forma comoda de leerlos, no la unica.
   */
  urlDeTiles?: string
  urlDeGlifos?: string
}

/*
 * Las clases de los marcadores, escritas enteras y no armadas por pedazos.
 *
 * Tailwind encuentra las clases leyendo el codigo como texto: una clase armada
 * con template string —`border-${color}`— no existe en el CSS compilado. Por eso
 * cada variante esta escrita completa, aunque se repitan pedazos.
 */
const CLASES_DE_MARCADOR =
  'marcador-mapa block cursor-pointer rounded-full border-2 border-tinta transition-all duration-150 ease-marca'

const CLASES_POR_TIPO: Record<TipoDePunto, string> = {
  /*
   * Relleno de color con anillo blanco, y no al reves: sobre la tierra clara
   * del mapa un circulo hueco de borde blanco directamente no existe.
   *
   * Las salas en el azul institucional y las agencias en el de marca: son dos
   * pesos distintos del mismo azul, que es lo que distingue sin meter un color
   * nuevo en la pantalla. El naranja queda para el punto seleccionado, que es
   * el unico elemento que esta respondiendo a algo que hizo quien mira
   * (§2.3.3), y por eso ninguno de los otros dos puede usarlo.
   */
  sala: 'size-5 bg-fondo',
  agencia: 'size-5 bg-marca',
}

const CLASES_SELECCIONADO = 'size-7 bg-accion'

type EstadoDelMapa = 'cargando' | 'listo' | 'error'

/**
 * El protocolo `pmtiles://` se registra una sola vez por pestania, no por mapa:
 * `addProtocol` es global de MapLibre. Registrarlo dentro del efecto lo
 * reinstalaria en cada montaje del componente.
 *
 * ⚠️ NO ACTUALIZAR `maplibre-gl` A LA v6. Por eso esta fijado con `~` en el
 * package.json, y no con el `^` del resto de las dependencias.
 *
 * En la v6 el mapa se queda cargando para siempre y no tira ningun error. La
 * razon: `addProtocol` escribe en un registro del hilo principal, pero los
 * tiles vectoriales se piden desde un Web Worker, que tiene su propio registro
 * vacio (`worker.ts` expone su `self.addProtocol` aparte). El TileJSON, que si
 * se resuelve en el hilo principal, carga bien —se ve una unica peticion 206 al
 * archivo— y despues no pasa nada mas: los pedidos de tiles mueren adentro del
 * worker, donde ni el `error` de MapLibre ni la consola de la pagina los ven.
 *
 * Cuando pmtiles publique soporte para la v6, el camino es registrar el
 * protocolo tambien en el worker con `importScriptInWorkers()`.
 */
let protocoloRegistrado = false

const registrarProtocolo = () => {
  if (protocoloRegistrado) return
  addProtocol('pmtiles', new Protocol().tile)
  protocoloRegistrado = true
}

export function MapaDePuntosDeVenta({
  puntos,
  urlDeGlifos,
  urlDeTiles,
}: MapaDePuntosDeVentaProps) {
  const [estado, setEstado] = useState<EstadoDelMapa>('cargando')
  const [seleccionado, setSeleccionado] = useState<number | null>(null)

  const contenedorRef = useRef<HTMLDivElement | null>(null)
  const mapaRef = useRef<MapaMapLibre | null>(null)
  const marcadoresRef = useRef(new Map<number, { marcador: Marker; nodo: HTMLElement }>())
  const fichasRef = useRef(new Map<number, HTMLLIElement>())

  /* Crear el mapa. Una sola vez: despues solo se le cambian los marcadores. */
  useEffect(() => {
    if (!urlDeTiles || !urlDeGlifos || mapaRef.current) return

    const contenedor = contenedorRef.current
    if (!contenedor) return

    registrarProtocolo()

    const mapa = new MapaMapLibre({
      container: contenedor,
      style: estiloDelMapa({ urlDeGlifos, urlDelArchivo: urlDeTiles }),
      center: ENCUADRE_ARGENTINA.centro,
      zoom: ENCUADRE_ARGENTINA.zoom,
      // El mapa se lee, no se explora: girarlo o inclinarlo solo desorienta.
      pitchWithRotate: false,
      dragRotate: false,
      /*
       * En el telefono, arrastrar con un dedo scrollea la pagina y hace falta
       * usar dos para mover el mapa. Sin esto, un mapa a lo ancho de la pantalla
       * atrapa el scroll y deja al visitante sin poder seguir bajando.
       */
      cooperativeGestures: true,
    })

    mapa.on('load', () => setEstado('listo'))
    mapa.on('error', () => setEstado('error'))

    mapaRef.current = mapa

    return () => {
      mapa.remove()
      mapaRef.current = null
      marcadoresRef.current.clear()
    }
  }, [urlDeGlifos, urlDeTiles])

  /* Redibujar los marcadores cuando cambia el filtro. */
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || estado !== 'listo') return

    for (const { marcador } of marcadoresRef.current.values()) marcador.remove()
    marcadoresRef.current.clear()

    const limites = new LngLatBounds()

    for (const punto of puntos) {
      /*
       * Envoltorio y contenido separados: MapLibre le escribe un `transform` al
       * elemento que recibe, para posicionarlo. Si el anillo fuera ese mismo
       * elemento, agrandarlo al seleccionarlo pelearia con esa posicion.
       */
      const nodo = document.createElement('div')
      const anillo = document.createElement('button')

      anillo.type = 'button'
      anillo.className = `${CLASES_DE_MARCADOR} ${CLASES_POR_TIPO[punto.tipo]}`
      anillo.setAttribute('aria-label', `${punto.nombre} — ver los datos del local`)
      anillo.title = punto.nombre
      anillo.addEventListener('click', () => setSeleccionado(punto.id))

      nodo.appendChild(anillo)

      const marcador = new Marker({ element: nodo, anchor: 'center' })
        .setLngLat([punto.longitud, punto.latitud])
        .addTo(mapa)

      marcadoresRef.current.set(punto.id, { marcador, nodo: anillo })
      limites.extend([punto.longitud, punto.latitud])
    }

    if (limites.isEmpty()) return

    /*
     * 48px de aire para que ningun marcador quede pegado al borde, y un tope de
     * zoom para el caso de un solo punto: sin el, encuadrar un unico local
     * dejaba la pantalla mostrando media vereda.
     */
    mapa.fitBounds(limites, { padding: 48, maxZoom: 15, animate: false })
  }, [estado, puntos])

  /*
   * El seleccionado se pinta de naranja y crece. `z-index` sobre el envoltorio
   * porque en una ciudad con varios locales los marcadores se superponen.
   */
  useEffect(() => {
    for (const [id, { marcador, nodo }] of marcadoresRef.current) {
      const destacado = id === seleccionado
      const punto = puntos.find((p) => p.id === id)
      if (!punto) continue

      nodo.className = `${CLASES_DE_MARCADOR} ${
        destacado ? CLASES_SELECCIONADO : CLASES_POR_TIPO[punto.tipo]
      }`
      marcador.getElement().style.zIndex = destacado ? '10' : '1'
    }
  }, [estado, puntos, seleccionado])

  /*
   * Centrar el mapa y traer la ficha a la vista. Corre para las dos formas de
   * elegir un punto, y en cada caso una de las dos mitades ya esta donde tiene
   * que estar: la que sobra es un no-op, no un salto.
   */
  useEffect(() => {
    if (seleccionado === null) return

    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const punto = puntos.find((p) => p.id === seleccionado)

    if (punto) {
      mapaRef.current?.easeTo({
        center: [punto.longitud, punto.latitud],
        animate: !sinMovimiento,
      })
    }

    // El `scroll-behavior: smooth` global de `styles.css` no alcanza: el suave
    // de `scrollIntoView` se pide por JS, asi que la preferencia se consulta.
    fichasRef.current.get(seleccionado)?.scrollIntoView({
      behavior: sinMovimiento ? 'auto' : 'smooth',
      block: 'nearest',
    })
  }, [puntos, seleccionado])

  /*
   * Al cambiar de filtro, el punto elegido puede haber quedado fuera de la
   * lista. Sin esto, la seleccion sigue puesta sobre algo que ya no se ve.
   */
  useEffect(() => {
    setSeleccionado((actual) =>
      actual !== null && puntos.some((p) => p.id === actual) ? actual : null,
    )
  }, [puntos])

  const registrarFicha = useCallback((id: number, nodo: HTMLLIElement | null) => {
    if (nodo) fichasRef.current.set(id, nodo)
    else fichasRef.current.delete(id)
  }, [])

  const hayMapa = Boolean(urlDeTiles && urlDeGlifos)

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      {/*
        El fondo del recuadro es el gris del mapa y no una superficie del
        sistema: es lo que se ve mientras bajan los primeros tiles, y con el azul
        del sitio la pantalla pegaba un salto de oscuro a claro justo cuando
        terminaba de cargar.
      */}
      {hayMapa ? (
        <div className="relative h-[clamp(360px,60vh,640px)] overflow-hidden rounded-caja bg-(--mapa-fuera)">
          {/* Al que MapLibre le dibuja el mapa adentro. */}
          <div className="size-full" ref={contenedorRef} />

          {estado !== 'listo' ? (
            <p
              aria-live="polite"
              className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center font-util text-meta text-(--mapa-rotulo-suave) uppercase"
            >
              {estado === 'error'
                ? 'No se pudo cargar el mapa. La lista de locales sigue disponible acá al lado.'
                : 'Cargando el mapa…'}
            </p>
          ) : null}
        </div>
      ) : (
        <AvisoEnLinea rotulo="Mapa no disponible">
          <p>
            Falta configurar el archivo de mapa del sitio. Mientras tanto, todos los locales están
            en la lista, con su dirección y el enlace para llegar.
          </p>
        </AvisoEnLinea>
      )}

      <div className="lg:max-h-[clamp(360px,60vh,640px)] lg:overflow-y-auto">
        <ul className="flex flex-col gap-3">
          {puntos.map((punto) => (
            <li key={punto.id} ref={(nodo) => registrarFicha(punto.id, nodo)}>
              <TarjetaPuntoDeVenta
                alSeleccionar={() => setSeleccionado(punto.id)}
                direccion={punto.direccion}
                fotoUrl={punto.fotoUrl}
                horarios={punto.horarios}
                localidad={punto.localidad}
                nombre={punto.nombre}
                provincia={punto.provincia}
                seleccionada={punto.id === seleccionado}
                telefono={punto.telefono}
                tipo={punto.etiquetaDeTipo}
                urlComoLlegar={urlDeComoLlegar({ lat: punto.latitud, lng: punto.longitud })}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
