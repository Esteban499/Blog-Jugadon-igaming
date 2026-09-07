'use client'

import {
  addProtocol,
  type GeoJSONSource,
  LngLatBounds,
  Map as MapaMapLibre,
  type MapLayerMouseEvent,
} from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import {
  CAPAS,
  capasDePuntos,
  ENCUADRE_ARGENTINA,
  estiloDelMapa,
  filtroDelElegido,
  ID_FUENTE_DE_PUNTOS,
  SIN_ELEGIDO,
  urlDeComoLlegar,
} from '@/utilidades/mapa'
import type { TipoDePunto } from '@/utilidades/puntos-de-venta'

/**
 * El mapa de salas, agencias y puntos de pago, con su lista al costado.
 *
 * Las dos mitades son una sola pieza y por eso viven en un solo componente:
 * comparten el punto seleccionado y el encuadre. Tocar un marcador resalta su
 * ficha en la lista y la trae a la vista; tocar una ficha centra el mapa en su
 * marcador; y mover el mapa cambia la lista, porque **la lista es lo que hay
 * en pantalla**.
 *
 * **MapLibre sobre un `.pmtiles` propio.** El mapa entero —geometria y rotulos—
 * sale de un solo archivo en el bucket del proyecto, que MapLibre lee por rangos
 * HTTP: pide los pedazos del pais que estan en pantalla y nada mas. Sin clave,
 * sin cuota y sin factura por visita.
 *
 * **Los puntos son una fuente, no marcadores.** Es el cambio grande contra la
 * version anterior, y esta explicado entero en `utilidades/mapa.ts`: con mil
 * cuatrocientos locales, un `<button>` por local es un arrastre que no sigue al
 * dedo. Ahora los dibuja la GPU.
 *
 * **Y no se agrupan.** Cada local es su propio circulo en todos los zooms, sin
 * burbujas con el total adentro. El porque —y lo que cuesta— esta arriba de
 * `ID_FUENTE_DE_PUNTOS` en `utilidades/mapa.ts`. Para este archivo lo que
 * importa es la consecuencia: no hay que abrir nada para llegar a un local, y
 * por lo tanto no hay estado de "cumulo abierto" ni un zoom minimo al que haya
 * que llevar el mapa para que un punto exista.
 *
 * **La lista muestra lo que se ve, ordenado por cercania al centro.** No es una
 * comodidad: es lo que hace que la pantalla siga teniendo sentido con mil
 * cuatrocientos puntos. Una lista completa serian mil cuatrocientas fichas que
 * nadie va a recorrer, y la primera —la que se lee— seria la que quedo primera
 * en el orden alfabetico de la base, que no tiene ninguna relacion con donde
 * esta parado quien mira. Es ademas el equivalente accesible del mapa: los
 * circulos del canvas no los anuncia el lector de pantalla, las fichas si.
 *
 * **El basemap va en la paleta de Google Maps, no en la del sitio.** Es una
 * excepcion al manual, decidida a proposito y documentada en el bloque MAPA de
 * `styles.css`: la pantalla existe para encontrar un local y salir, y un mapa
 * que se parece al que la persona ya usa todos los dias se entiende sin mirarlo
 * dos veces. Los marcadores son la excepcion de la excepcion y siguen siendo de
 * la marca.
 */

export interface PuntoEnMapa {
  id: number
  nombre: string
  tipo: TipoDePunto
  /** "Sala", "Agencia" o "Punto de pago", ya traducido por la pagina. */
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

/**
 * Cuantas fichas se dibujan de las que hay en pantalla.
 *
 * Es un tope de dibujado, no de busqueda: con el mapa lejos, en el encuadre
 * entran seiscientos locales y renderizar seiscientas fichas cuesta lo mismo
 * que renderizar mil cuatrocientas. Sesenta es la cantidad que llena varias
 * pantallas de scroll —o sea, mas de lo que alguien recorre— sin costar nada.
 * Cuando el tope corta, la pantalla lo dice y la salida es acercar el mapa.
 */
const TOPE_DE_LISTA = 60

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

/**
 * Cuan lejos del centro de la pantalla cae un punto, para ordenar la lista.
 *
 * Sin raiz cuadrada porque solo se usa para comparar, y con los grados de
 * longitud encogidos por el coseno de la latitud: en Argentina un grado de
 * longitud mide un 83% de lo que mide uno de latitud, y sin corregirlo la lista
 * de una ciudad ancha sale ordenada de costado.
 */
const cercaniaAlCentro = (
  punto: PuntoEnMapa,
  centroLng: number,
  centroLat: number,
  escalaLng: number,
): number => {
  const dx = (punto.longitud - centroLng) * escalaLng
  const dy = punto.latitud - centroLat
  return dx * dx + dy * dy
}

export function MapaDePuntosDeVenta({
  puntos,
  urlDeGlifos,
  urlDeTiles,
}: MapaDePuntosDeVentaProps) {
  const [estado, setEstado] = useState<EstadoDelMapa>('cargando')
  const [seleccionado, setSeleccionado] = useState<number | null>(null)
  /**
   * Que pedazo de mundo se esta viendo. `null` mientras el mapa no cargo, y
   * para siempre cuando no hay mapa: en los dos casos la lista cae en "todos",
   * que es lo correcto si no hay encuadre del que hablar.
   */
  const [encuadre, setEncuadre] = useState<LngLatBounds | null>(null)

  const contenedorRef = useRef<HTMLDivElement | null>(null)
  const mapaRef = useRef<MapaMapLibre | null>(null)
  const fichasRef = useRef(new Map<number, HTMLLIElement>())

  /**
   * Lo que el mapa dibuja: un punto por local, con lo justo para pintarlo y
   * reconocerlo.
   *
   * En `properties` van solo `id` y `tipo` —el color sale de uno, la seleccion
   * del otro— y nada mas. El nombre, la direccion y el telefono ya estan del
   * lado de React para la lista: duplicarlos adentro de la fuente serian mil
   * cuatrocientas copias en memoria que el canvas no va a mirar nunca.
   */
  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: puntos.map((punto) => ({
        type: 'Feature' as const,
        properties: { id: punto.id, tipo: punto.tipo },
        geometry: { type: 'Point' as const, coordinates: [punto.longitud, punto.latitud] },
      })),
    }),
    [puntos],
  )

  /* Crear el mapa. Una sola vez: despues solo se le cambian los datos. */
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

    mapa.on('load', () => {
      mapa.addSource(ID_FUENTE_DE_PUNTOS, {
        type: 'geojson',
        // Arranca vacia: los datos los pone el efecto de abajo, que es el mismo
        // que corre cuando cambia el filtro.
        data: { type: 'FeatureCollection', features: [] },
        // Sin agrupar. El porque esta arriba de `ID_FUENTE_DE_PUNTOS`.
        cluster: false,
      })

      for (const capa of capasDePuntos()) mapa.addLayer(capa)

      const elegirDelMapa = (evento: MapLayerMouseEvent) => {
        const id = evento.features?.[0]?.properties?.id
        if (typeof id === 'number') setSeleccionado(id)
      }
      mapa.on('click', CAPAS.puntos, elegirDelMapa)
      mapa.on('click', CAPAS.elegido, elegirDelMapa)

      /* El cursor avisa que el circulo se puede tocar; el canvas no lo hace solo. */
      for (const capa of [CAPAS.puntos, CAPAS.elegido]) {
        mapa.on('mouseenter', capa, () => {
          mapa.getCanvas().style.cursor = 'pointer'
        })
        mapa.on('mouseleave', capa, () => {
          mapa.getCanvas().style.cursor = ''
        })
      }

      /*
       * De aca sale la lista. `moveend` y no `move`: durante el arrastre
       * dispararia sesenta veces por segundo y volveria a armar la lista en
       * cada cuadro, que es exactamente el trabajo que se saco del DOM.
       */
      mapa.on('moveend', () => setEncuadre(mapa.getBounds()))

      setEncuadre(mapa.getBounds())
      setEstado('listo')
    })

    mapa.on('error', () => setEstado('error'))

    mapaRef.current = mapa

    return () => {
      mapa.remove()
      mapaRef.current = null
    }
  }, [urlDeGlifos, urlDeTiles])

  /* Poner los puntos y encuadrarlos. Corre al cargar y cada vez que cambia el filtro. */
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || estado !== 'listo') return

    const fuente = mapa.getSource(ID_FUENTE_DE_PUNTOS) as GeoJSONSource | undefined
    if (!fuente) return

    fuente.setData(geojson)

    const limites = new LngLatBounds()
    for (const { latitud, longitud } of puntos) limites.extend([longitud, latitud])
    if (limites.isEmpty()) return

    /*
     * 48px de aire para que ningun marcador quede pegado al borde, y un tope de
     * zoom para el caso de un solo punto: sin el, encuadrar un unico local
     * dejaba la pantalla mostrando media vereda.
     */
    mapa.fitBounds(limites, { padding: 48, maxZoom: 15, animate: false })
  }, [estado, geojson, puntos])

  /* El elegido se pinta de naranja: es un filtro sobre su capa, no un repintado. */
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || estado !== 'listo') return

    mapa.setFilter(
      CAPAS.elegido,
      seleccionado === null ? SIN_ELEGIDO : filtroDelElegido(seleccionado),
    )
  }, [estado, seleccionado])

  /*
   * Centrar el mapa y traer la ficha a la vista. Corre para las dos formas de
   * elegir un punto, y en cada caso una de las dos mitades ya esta donde tiene
   * que estar: la que sobra es un no-op, no un salto.
   */
  useEffect(() => {
    if (seleccionado === null) return

    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const punto = puntos.find((p) => p.id === seleccionado)
    const mapa = mapaRef.current

    /*
     * Centra y nada mas: no toca el zoom. Sin cumulos, el punto elegido se
     * dibuja siempre —naranja, mas grande y en su capa, arriba de todo—, asi
     * que no hay que acercar el mapa para que exista. Acercarlo igual seria
     * decidir por el visitante que perdiera el contexto que tenia.
     */
    if (punto && mapa) {
      mapa.easeTo({ center: [punto.longitud, punto.latitud], animate: !sinMovimiento })
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

  /* Los que estan en pantalla, del mas cercano al centro al mas lejano. */
  const enPantalla = useMemo(() => {
    if (!encuadre) return puntos

    const centro = encuadre.getCenter()
    const escalaLng = Math.cos((centro.lat * Math.PI) / 180)

    return puntos
      .filter((punto) => encuadre.contains([punto.longitud, punto.latitud]))
      .sort(
        (a, b) =>
          cercaniaAlCentro(a, centro.lng, centro.lat, escalaLng) -
          cercaniaAlCentro(b, centro.lng, centro.lat, escalaLng),
      )
  }, [encuadre, puntos])

  const listados = enPantalla.slice(0, TOPE_DE_LISTA)
  const ocultos = enPantalla.length - listados.length
  const hayMapa = Boolean(urlDeTiles && urlDeGlifos)

  /**
   * El recuento de arriba de la lista.
   *
   * Sin encuadre —el mapa todavia no cargo, o directamente no hay mapa— no se
   * puede hablar de "en pantalla": no hay pantalla de la que hablar, y decirlo
   * igual anuncia "60 de 1425 en pantalla" arriba de un recuadro gris que
   * todavia esta cargando. La salida en ese caso tampoco es acercar el mapa,
   * sino usar los filtros; las dos frases cambian juntas.
   */
  const plural = enPantalla.length === 1 ? 'local' : 'locales'
  const donde = encuadre ? ' en pantalla' : ''
  const comoVerElResto = encuadre
    ? 'acercá el mapa para ver el resto'
    : 'filtrá por provincia para achicar la búsqueda'

  const recuento =
    enPantalla.length === 0
      ? 'No hay locales en esta parte del mapa'
      : ocultos > 0
        ? `${listados.length} de ${enPantalla.length}${donde} · ${comoVerElResto}`
        : `${enPantalla.length} ${plural}${donde}`

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
            Falta configurar el archivo de mapa del sitio. Mientras tanto, los locales están en la
            lista, con su dirección y el enlace para llegar. Usá los filtros de arriba para achicar
            la búsqueda.
          </p>
        </AvisoEnLinea>
      )}

      <div className="flex flex-col gap-3 lg:max-h-[clamp(360px,60vh,640px)] lg:overflow-y-auto">
        {/*
          El recuento va en `aria-live` porque cambia sin que nadie lo pida: al
          mover el mapa, la lista de abajo se renueva entera y sin este aviso un
          lector de pantalla no tendria como enterarse.
        */}
        <p aria-live="polite" className="font-util text-meta text-apagado uppercase">
          {recuento}
        </p>

        {enPantalla.length === 0 ? (
          <p className="text-parrafo">
            Alejá el mapa o movelo hacia una ciudad para volver a ver locales.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {listados.map((punto) => (
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
        )}
      </div>
    </div>
  )
}
