'use client'

import type { GeoJSONSource, Map as MapaMapLibre, MapLayerMouseEvent } from 'maplibre-gl'
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

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
import { IconoCerrar } from '@/components/atoms/iconos/IconoCerrar'
import { IconoLupa } from '@/components/atoms/iconos/IconoLupa'
import { AvisoEnLinea } from '@/components/molecules/AvisoEnLinea'
import { TarjetaPuntoDeVenta } from '@/components/molecules/TarjetaPuntoDeVenta'
import {
  CAPAS,
  ENCUADRE_ARGENTINA,
  filtroDelElegido,
  ID_FUENTE_DE_PUNTOS,
  SIN_ELEGIDO,
  urlDeComoLlegar,
} from '@/utilidades/puntos-del-mapa'
import type { TipoDePunto } from '@/utilidades/puntos-de-venta'

/**
 * El mapa de salas, agencias y puntos de pago, con su buscador y la ficha del
 * local elegido.
 *
 * Las tres piezas viven en un solo componente porque comparten el punto
 * elegido: tocar un marcador o elegir un resultado del buscador lo selecciona,
 * lo pinta de naranja en el mapa y muestra su ficha.
 *
 * **MapLibre sobre un `.pmtiles` propio.** El mapa entero —geometria y rotulos—
 * sale de un solo archivo en el bucket del proyecto, que MapLibre lee por rangos
 * HTTP: pide los pedazos del pais que estan en pantalla y nada mas. Sin clave,
 * sin cuota y sin factura por visita.
 *
 * **MapLibre se carga despues que la pagina, no con ella.** Entre MapLibre,
 * pmtiles y el estilo de Protomaps son casi un megabyte de JavaScript, y con
 * los tres en los imports de arriba la pagina entera esperaba a bajarlos y
 * ejecutarlos antes de responder. Ahora se piden con `import()` dentro del
 * efecto que crea el mapa: el buscador anda de entrada y el mapa aparece cuando
 * llega. Por eso de MapLibre solo se importan tipos aca arriba.
 *
 * **Los puntos son una fuente, no marcadores.** Es el cambio grande contra la
 * version anterior, y esta explicado entero en `utilidades/puntos-del-mapa.ts`:
 * con mil cuatrocientos locales, un `<button>` por local es un arrastre que no
 * sigue al dedo. Ahora los dibuja la GPU.
 *
 * **Y no se agrupan.** Cada local es su propio circulo en todos los zooms, sin
 * burbujas con el total adentro. El porque —y lo que cuesta— esta en el mismo
 * archivo. Para este lo que importa es la consecuencia: no hay que abrir nada
 * para llegar a un local, y por lo tanto no hay estado de "cumulo abierto" ni
 * un zoom minimo al que haya que llevar el mapa para que un punto exista.
 *
 * **Un buscador en lugar de una lista.** Al costado del mapa iba la lista de
 * los locales en pantalla, cortada en sesenta. No respondia la pregunta de
 * quien ya sabe a donde quiere ir —"¿donde queda La Suerte?"— y costaba
 * sesenta fichas con foto redibujadas en cada movimiento del mapa. El buscador
 * responde esa pregunta y es, ademas, el equivalente accesible del mapa: los
 * circulos del canvas no los anuncia el lector de pantalla, los resultados del
 * buscador si.
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
   * `undefined` cuando la variable de entorno no esta cargada. El buscador y la
   * ficha andan igual: las direcciones y los telefonos son el dato que
   * importa, y el mapa es la forma comoda de leerlos, no la unica.
   *
   * Puede ser relativa al sitio (`/mapa/...`, la de desarrollo) o absoluta (R2).
   */
  urlDeTiles?: string
  urlDeGlifos?: string
}

type EstadoDelMapa = 'cargando' | 'listo' | 'error'

/**
 * Cuantos resultados muestra el buscador.
 *
 * Es un tope de dibujado, no de busqueda: la busqueda recorre todos los puntos
 * y el desplegable dice cuantos quedaron afuera. Con dos o tres letras mas,
 * cualquier nombre entra entre estos ocho.
 */
const TOPE_DE_RESULTADOS = 8

/**
 * A que zoom se acerca el mapa cuando el local sale del buscador.
 *
 * Tocar un punto del mapa solo lo centra: quien lo toco ya estaba mirando esa
 * zona, y acercar seria decidir por el que perdiera el contexto. El que busca
 * por nombre, en cambio, puede estar mirando el pais entero, y centrar sin
 * acercar lo dejaria con el punto naranja perdido en una mancha de mil. A 15
 * se leen las calles alrededor del local.
 */
const ZOOM_DE_BUSQUEDA = 15

/**
 * Los textos que MapLibre dibuja por su cuenta, en castellano.
 *
 * El que importa es el del celular: con `cooperativeGestures`, arrastrar un
 * dedo sobre el mapa lo tapa con un aviso que explica como moverlo, y de
 * fabrica ese aviso esta en ingles. En el telefono es lo primero que alguien
 * ve si intenta bajar por la pagina con el dedo encima del mapa.
 */
const TEXTOS_DE_MAPLIBRE = {
  'CooperativeGesturesHandler.WindowsHelpText': 'Usá Ctrl + la rueda del mouse para hacer zoom',
  'CooperativeGesturesHandler.MacHelpText': 'Usá ⌘ + la rueda del mouse para hacer zoom',
  'CooperativeGesturesHandler.MobileHelpText': 'Usá dos dedos para mover el mapa',
}

/**
 * El protocolo `pmtiles://` se registra una sola vez por pestania, no por mapa:
 * `addProtocol` es global de MapLibre. Registrarlo dentro del efecto sin esta
 * guarda lo reinstalaria en cada montaje del componente.
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

/**
 * El nombre tal como se compara: sin acentos y en minuscula. Quien escribe
 * "cordoba" tiene que encontrar "Córdoba", y en el telefono casi nadie escribe
 * los acentos.
 */
const normalizar = (texto: string): string =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/* ========================================================================= */
/* EL BUSCADOR                                                               */
/* ========================================================================= */

interface BuscadorDeLocalesProps {
  puntos: readonly PuntoEnMapa[]
  alElegir: (punto: PuntoEnMapa) => void
}

/**
 * El campo de busqueda por nombre, con su desplegable de resultados.
 *
 * Es un combobox de ARIA y no un `<datalist>`: el `datalist` no deja mostrar
 * la localidad debajo del nombre, y con cuatro "La Suerte" en el listado la
 * localidad es lo unico que dice cual es cual. Se maneja entero con el
 * teclado —flechas, Enter y Escape— y el foco no sale nunca del campo: la
 * opcion activa se anuncia con `aria-activedescendant`.
 *
 * Busca sobre los puntos que ya dejaron pasar los filtros de arriba, no sobre
 * el directorio entero: los chips y el campo dicen lo mismo, y un resultado de
 * otra provincia que al elegirlo no aparece en el mapa seria peor que ninguno.
 *
 * Vive aca y no como molecula porque tiene estado propio, y las moleculas del
 * sitio no lo tienen. No sale de este archivo.
 */
function BuscadorDeLocales({ alElegir, puntos }: BuscadorDeLocalesProps) {
  const [consulta, setConsulta] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(-1)
  const campoRef = useRef<HTMLInputElement | null>(null)

  const id = useId()
  const idDelCampo = `${id}-campo`
  const idDeLaLista = `${id}-lista`
  const idDeOpcion = (indice: number) => `${id}-opcion-${indice}`

  /* Los nombres se normalizan una vez por filtro, no en cada tecla. */
  const indice = useMemo(
    () => puntos.map((punto) => ({ punto, nombre: normalizar(punto.nombre) })),
    [puntos],
  )

  const { coincidencias, resultados } = useMemo(() => {
    const palabras = normalizar(consulta).split(/\s+/).filter(Boolean)
    if (palabras.length === 0) return { coincidencias: 0, resultados: [] }

    /*
     * Todas las palabras tienen que estar, en cualquier orden: "suerte la"
     * encuentra "La Suerte". Y adelante van los que *empiezan* con lo escrito,
     * que casi siempre es el que se buscaba. `sort` es estable, asi que dentro
     * de cada grupo queda el orden del servidor: provincia, localidad, nombre.
     */
    const primera = palabras[0] ?? ''
    const encontrados = indice
      .filter(({ nombre }) => palabras.every((palabra) => nombre.includes(palabra)))
      .sort((a, b) => Number(b.nombre.startsWith(primera)) - Number(a.nombre.startsWith(primera)))

    return {
      coincidencias: encontrados.length,
      resultados: encontrados.slice(0, TOPE_DE_RESULTADOS).map(({ punto }) => punto),
    }
  }, [consulta, indice])

  const desplegado = abierto && consulta.trim() !== ''

  /* La opcion activa sigue a las flechas aunque el desplegable tenga scroll. */
  useEffect(() => {
    if (activo < 0) return
    document.getElementById(`${id}-opcion-${activo}`)?.scrollIntoView({ block: 'nearest' })
  }, [activo, id])

  const elegir = (punto: PuntoEnMapa) => {
    setConsulta(punto.nombre)
    setAbierto(false)
    setActivo(-1)
    // En el telefono esto cierra el teclado, que tapa la mitad del mapa que
    // se esta por mover hasta el local.
    campoRef.current?.blur()
    alElegir(punto)
  }

  const alTeclear = (evento: KeyboardEvent<HTMLInputElement>) => {
    const total = resultados.length

    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault()
        setAbierto(true)
        setActivo((actual) => (total === 0 ? -1 : (actual + 1) % total))
        break
      case 'ArrowUp':
        evento.preventDefault()
        setActivo((actual) => (total === 0 ? -1 : actual <= 0 ? total - 1 : actual - 1))
        break
      case 'Enter': {
        // Sin ninguno marcado con las flechas, Enter elige el primero: es lo
        // que se espera de un buscador.
        const punto = desplegado ? resultados[Math.max(activo, 0)] : undefined
        if (punto) {
          evento.preventDefault()
          elegir(punto)
        }
        break
      }
      case 'Escape':
        // Primero cierra el desplegable; con el desplegable cerrado, borra.
        if (desplegado) setAbierto(false)
        else setConsulta('')
        break
    }
  }

  const anuncio = !desplegado
    ? ''
    : coincidencias === 0
      ? 'Ningún local coincide'
      : `${coincidencias} ${coincidencias === 1 ? 'local coincide' : 'locales coinciden'}`

  return (
    <div className="relative">
      <label className="sr-only" htmlFor={idDelCampo}>
        Buscar un local por su nombre
      </label>

      <IconoLupa className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-apagado" />

      {/*
        `type="text"` con `inputMode="search"` y no `type="search"`: el de
        busqueda trae su propia cruz para borrar, que en Chrome y Safari salia
        al lado de la nuestra. El teclado del telefono es el mismo.
      */}
      <input
        aria-activedescendant={desplegado && activo >= 0 ? idDeOpcion(activo) : undefined}
        aria-autocomplete="list"
        aria-controls={idDeLaLista}
        aria-expanded={desplegado}
        autoComplete="off"
        className="w-full rounded-caja border border-contorno bg-superficie py-3 pr-12 pl-12 text-cuerpo text-tinta transition-colors duration-150 ease-marca placeholder:text-apagado hover:border-accion-contorno focus-visible:border-accion"
        enterKeyHint="search"
        id={idDelCampo}
        inputMode="search"
        onBlur={() => setAbierto(false)}
        onChange={(evento) => {
          setConsulta(evento.target.value)
          setAbierto(true)
          setActivo(-1)
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={alTeclear}
        placeholder="Buscá un local por su nombre"
        ref={campoRef}
        role="combobox"
        spellCheck={false}
        type="text"
        value={consulta}
      />

      {consulta ? (
        <button
          aria-label="Borrar la búsqueda"
          className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-apagado transition-colors duration-150 ease-marca hover:text-tinta"
          onClick={() => {
            setConsulta('')
            setActivo(-1)
            campoRef.current?.focus()
          }}
          type="button"
        >
          <IconoCerrar className="size-5" />
        </button>
      ) : null}

      {/*
        Flota sobre el mapa en lugar de empujarlo: si lo corriera para abajo, en
        el telefono el mapa saltaria con cada letra que cambia la cantidad de
        resultados.
      */}
      {desplegado ? (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-caja border border-contorno bg-elevada shadow-2xl">
          {resultados.length === 0 ? (
            <p className="px-4 py-3 text-parrafo">
              Ningún local se llama así. Probá con otra parte del nombre, o quitando algún filtro.
            </p>
          ) : (
            <ul
              aria-label="Locales que coinciden"
              className="max-h-72 overflow-y-auto py-1"
              id={idDeLaLista}
              role="listbox"
            >
              {resultados.map((punto, i) => (
                // El teclado lo maneja el campo, que nunca pierde el foco: por
                // eso la opcion no tiene `onKeyDown` ni `tabIndex` propios.
                <li
                  aria-selected={i === activo}
                  className={`cursor-pointer px-4 py-3 ${i === activo ? 'bg-azul-velo' : ''}`}
                  id={idDeOpcion(i)}
                  key={punto.id}
                  onClick={() => elegir(punto)}
                  // Sin esto el campo pierde el foco en el `mousedown`, el
                  // desplegable se cierra y el click nunca llega a la opcion.
                  onMouseDown={(evento) => evento.preventDefault()}
                  onMouseEnter={() => setActivo(i)}
                  role="option"
                >
                  <span className="block text-tinta text-pretty">{punto.nombre}</span>
                  <span className="mt-1 block font-util text-meta text-apagado uppercase">
                    {punto.etiquetaDeTipo} · {punto.localidad}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {coincidencias > resultados.length ? (
            <p className="border-t border-contorno px-4 py-2 font-util text-meta text-apagado uppercase">
              {coincidencias - resultados.length} más · seguí escribiendo para achicar
            </p>
          ) : null}
        </div>
      ) : null}

      {/* La cantidad cambia con cada letra sin que nadie la pida: se anuncia. */}
      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>
    </div>
  )
}

/* ========================================================================= */
/* EL MAPA                                                                   */
/* ========================================================================= */

export function MapaDePuntosDeVenta({
  puntos,
  urlDeGlifos,
  urlDeTiles,
}: MapaDePuntosDeVentaProps) {
  const [estado, setEstado] = useState<EstadoDelMapa>('cargando')
  const [seleccionado, setSeleccionado] = useState<number | null>(null)

  const contenedorRef = useRef<HTMLDivElement | null>(null)
  const mapaRef = useRef<MapaMapLibre | null>(null)
  const fichaRef = useRef<HTMLDivElement | null>(null)

  const porId = useMemo(() => new Map(puntos.map((punto) => [punto.id, punto])), [puntos])

  /*
   * El click del mapa se registra una sola vez, al crearlo, y tiene que ver
   * los puntos del filtro de ahora y no los del momento en que se registro.
   */
  const porIdRef = useRef(porId)
  useEffect(() => {
    porIdRef.current = porId
  }, [porId])

  /*
   * Lo mismo con la seleccion, para el primer encuadre: el buscador anda antes
   * de que llegue MapLibre, y un local elegido en ese rato tiene que ser lo
   * primero que muestre el mapa al aparecer.
   */
  const seleccionadoRef = useRef(seleccionado)
  useEffect(() => {
    seleccionadoRef.current = seleccionado
  }, [seleccionado])

  /** Si el mapa ya hizo su primer encuadre. Vuelve a `false` si se recrea. */
  const encuadradoRef = useRef(false)

  /**
   * Lo que el mapa dibuja: un punto por local, con lo justo para pintarlo y
   * reconocerlo.
   *
   * En `properties` van solo `id` y `tipo` —el color sale de uno, la seleccion
   * del otro— y nada mas. El nombre, la direccion y el telefono ya estan del
   * lado de React para el buscador y la ficha: duplicarlos adentro de la fuente
   * serian mil cuatrocientas copias en memoria que el canvas no va a mirar.
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

  /**
   * Elegir un punto: marcarlo y llevar el mapa hasta el.
   *
   * El movimiento se hace aca, en el momento, y no en un efecto que mire la
   * seleccion: asi elegir dos veces el mismo local —despues de haber movido el
   * mapa— lo vuelve a traer, y cada origen decide si acerca o no.
   */
  const irAlPunto = useCallback((punto: PuntoEnMapa, { acercar }: { acercar: boolean }) => {
    setSeleccionado(punto.id)

    const mapa = mapaRef.current
    if (!mapa) return

    // El `scroll-behavior: smooth` global de `styles.css` no alcanza: la
    // animacion de MapLibre se pide por JS, asi que la preferencia se consulta.
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    mapa.easeTo({
      center: [punto.longitud, punto.latitud],
      // Condicional y no `zoom: undefined`: MapLibre lee la clave aunque venga
      // vacia, y un zoom `undefined` deja el mapa en `NaN`.
      ...(acercar ? { zoom: Math.max(mapa.getZoom(), ZOOM_DE_BUSQUEDA) } : {}),
      animate: !sinMovimiento,
    })
  }, [])

  /* Crear el mapa. Una sola vez: despues solo se le cambian los datos. */
  useEffect(() => {
    if (!urlDeTiles || !urlDeGlifos) return

    const contenedor = contenedorRef.current
    if (!contenedor) return

    let cancelado = false
    let mapa: MapaMapLibre | undefined

    const crear = async () => {
      const [maplibre, { Protocol }, { capasDePuntos, estiloDelMapa }] = await Promise.all([
        import('maplibre-gl'),
        import('pmtiles'),
        import('@/utilidades/mapa'),
      ])

      // Si el componente se desmonto mientras bajaban, no hay donde dibujar.
      if (cancelado) return

      /*
       * En desarrollo la URL es relativa (`/mapa/...`) y se resuelve contra el
       * host con el que se abrio la pagina: `localhost` en la compu, la IP de la
       * red en el celular. Con `http://localhost:9000` fijo, el celular le pedia
       * el archivo a si mismo y el mapa no aparecia nunca. La absoluta de R2 en
       * produccion pasa por aca sin cambios.
       */
      const urlDelArchivo = new URL(urlDeTiles, window.location.href).href

      if (!protocoloRegistrado) {
        maplibre.addProtocol('pmtiles', new Protocol().tile)
        protocoloRegistrado = true
      }

      const nuevo = new maplibre.Map({
        container: contenedor,
        style: estiloDelMapa({ urlDeGlifos, urlDelArchivo }),
        center: ENCUADRE_ARGENTINA.centro,
        zoom: ENCUADRE_ARGENTINA.zoom,
        locale: TEXTOS_DE_MAPLIBRE,
        // El mapa se lee, no se explora: girarlo o inclinarlo solo desorienta.
        pitchWithRotate: false,
        dragRotate: false,
        touchPitch: false,
        /*
         * En el telefono, arrastrar con un dedo scrollea la pagina y hace falta
         * usar dos para mover el mapa. Sin esto, un mapa a lo ancho de la
         * pantalla atrapa el scroll y deja al visitante sin poder seguir bajando.
         */
        cooperativeGestures: true,
      })
      mapa = nuevo
      mapaRef.current = nuevo

      // Con dos dedos se acerca y se aleja, pero no se gira: lo mismo que
      // `dragRotate: false` hace con el mouse.
      nuevo.touchZoomRotate.disableRotation()

      let cargado = false

      nuevo.on('load', () => {
        cargado = true

        nuevo.addSource(ID_FUENTE_DE_PUNTOS, {
          type: 'geojson',
          // Arranca vacia: los datos los pone el efecto de abajo, que es el
          // mismo que corre cuando cambia el filtro.
          data: { type: 'FeatureCollection', features: [] },
          // Sin agrupar. El porque esta arriba de `ID_FUENTE_DE_PUNTOS`.
          cluster: false,
        })

        for (const capa of capasDePuntos()) nuevo.addLayer(capa)

        const elegirDelMapa = (evento: MapLayerMouseEvent) => {
          const id = evento.features?.[0]?.properties?.id
          const punto = typeof id === 'number' ? porIdRef.current.get(id) : undefined
          if (punto) irAlPunto(punto, { acercar: false })
        }
        nuevo.on('click', CAPAS.puntos, elegirDelMapa)
        nuevo.on('click', CAPAS.elegido, elegirDelMapa)

        /* El cursor avisa que el circulo se puede tocar; el canvas no lo hace solo. */
        for (const capa of [CAPAS.puntos, CAPAS.elegido]) {
          nuevo.on('mouseenter', capa, () => {
            nuevo.getCanvas().style.cursor = 'pointer'
          })
          nuevo.on('mouseleave', capa, () => {
            nuevo.getCanvas().style.cursor = ''
          })
        }

        setEstado('listo')
      })

      /*
       * Solo cuenta como falla lo que pasa antes de cargar. Despues, un error
       * es un tile o un glifo suelto que no llego —pasa, sobre todo con la señal
       * del celular— y el mapa sigue andando. Antes cualquiera de esos tapaba
       * con el cartel de "no se pudo cargar" un mapa que funcionaba.
       */
      nuevo.on('error', () => {
        if (!cargado) setEstado('error')
      })
    }

    crear().catch(() => {
      // El `import()` fallo: sin red a mitad de carga, o un deploy nuevo que
      // borro los chunks viejos. Sin la biblioteca no hay mapa que mostrar.
      if (!cancelado) setEstado('error')
    })

    return () => {
      cancelado = true
      mapa?.remove()
      mapaRef.current = null
      encuadradoRef.current = false
    }
  }, [irAlPunto, urlDeGlifos, urlDeTiles])

  /* Poner los puntos y encuadrarlos. Corre al cargar y cada vez que cambia el filtro. */
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || estado !== 'listo') return

    const fuente = mapa.getSource(ID_FUENTE_DE_PUNTOS) as GeoJSONSource | undefined
    if (!fuente) return

    fuente.setData(geojson)

    /*
     * Primer encuadre con un local ya elegido. Como MapLibre llega despues que
     * la pagina, alguien puede buscar y elegir antes de que el mapa exista, y
     * entonces lo que tiene que aparecer es ese local, no el pais entero con un
     * punto naranja perdido. Solo la primera vez: despues, cambiar de filtro es
     * pedir ver el filtro.
     */
    const primerEncuadre = !encuadradoRef.current
    encuadradoRef.current = true
    const elegidoAntes =
      primerEncuadre && seleccionadoRef.current !== null
        ? porIdRef.current.get(seleccionadoRef.current)
        : undefined
    if (elegidoAntes) {
      mapa.jumpTo({
        center: [elegidoAntes.longitud, elegidoAntes.latitud],
        zoom: ZOOM_DE_BUSQUEDA,
      })
      return
    }

    /*
     * El encuadre se calcula a mano y no con `LngLatBounds`: seria la unica
     * clase de MapLibre que se usa fuera del efecto, y traerla obligaba a
     * importar la biblioteca entera de forma estatica.
     */
    let oeste = Number.POSITIVE_INFINITY
    let sur = Number.POSITIVE_INFINITY
    let este = Number.NEGATIVE_INFINITY
    let norte = Number.NEGATIVE_INFINITY
    for (const { latitud, longitud } of puntos) {
      oeste = Math.min(oeste, longitud)
      este = Math.max(este, longitud)
      sur = Math.min(sur, latitud)
      norte = Math.max(norte, latitud)
    }
    if (!Number.isFinite(oeste)) return

    /*
     * 48px de aire para que ningun marcador quede pegado al borde, y un tope de
     * zoom para el caso de un solo punto: sin el, encuadrar un unico local
     * dejaba la pantalla mostrando media vereda.
     */
    mapa.fitBounds(
      [
        [oeste, sur],
        [este, norte],
      ],
      { padding: 48, maxZoom: 15, animate: false },
    )
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
   * Al cambiar de filtro, el punto elegido puede haber quedado afuera. Sin
   * esto, la ficha seguiria mostrando un local que ya no esta en el mapa.
   */
  useEffect(() => {
    setSeleccionado((actual) => (actual !== null && porId.has(actual) ? actual : null))
  }, [porId])

  /*
   * Traer la ficha a la vista. En escritorio va al lado del mapa y esto no
   * mueve nada; en el telefono va debajo, y sin esto tocar un punto no
   * mostraria ningun cambio en pantalla.
   */
  useEffect(() => {
    if (seleccionado === null) return

    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    fichaRef.current?.scrollIntoView({
      behavior: sinMovimiento ? 'auto' : 'smooth',
      block: 'nearest',
    })
  }, [seleccionado])

  const hayMapa = Boolean(urlDeTiles && urlDeGlifos)
  const elegido = seleccionado === null ? undefined : porId.get(seleccionado)

  return (
    /*
     * El orden del DOM es el del telefono —buscador, mapa, ficha— y en
     * escritorio la grilla los reubica: el mapa ocupa la columna ancha de
     * arriba abajo, y el buscador y la ficha se apilan al costado. Asi el
     * buscador queda primero en el orden de tabulacion en los dos casos.
     */
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-6">
      <div className="lg:col-start-2 lg:row-start-1">
        <BuscadorDeLocales
          alElegir={(punto) => irAlPunto(punto, { acercar: true })}
          puntos={puntos}
        />
      </div>

      {/*
        El fondo del recuadro es el gris del mapa y no una superficie del
        sistema: es lo que se ve mientras bajan los primeros tiles, y con el azul
        del sitio la pantalla pegaba un salto de oscuro a claro justo cuando
        terminaba de cargar.
      */}
      {hayMapa ? (
        <div className="relative h-[clamp(360px,60vh,640px)] overflow-hidden rounded-caja bg-(--mapa-fuera) lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {/* Al que MapLibre le dibuja el mapa adentro. */}
          <div className="size-full" ref={contenedorRef} />

          {estado !== 'listo' ? (
            <p
              aria-live="polite"
              className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center font-util text-meta text-(--mapa-rotulo-suave) uppercase"
            >
              {estado === 'error'
                ? 'No se pudo cargar el mapa. Podés buscar el local por su nombre.'
                : 'Cargando el mapa…'}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <AvisoEnLinea rotulo="Mapa no disponible">
            <p>
              Falta configurar el archivo de mapa del sitio. Mientras tanto, buscá el local por su
              nombre: la ficha trae su dirección, su horario y el enlace para llegar.
            </p>
          </AvisoEnLinea>
        </div>
      )}

      {/*
        La ficha va en `aria-live` porque cambia sin que el foco se mueva: al
        tocar un punto del mapa, un lector de pantalla no tendria como enterarse
        de que local quedo elegido.
      */}
      <div aria-live="polite" className="lg:col-start-2 lg:row-start-2" ref={fichaRef}>
        {elegido ? (
          <TarjetaPuntoDeVenta
            direccion={elegido.direccion}
            fotoUrl={elegido.fotoUrl}
            horarios={elegido.horarios}
            localidad={elegido.localidad}
            nombre={elegido.nombre}
            provincia={elegido.provincia}
            seleccionada
            telefono={elegido.telefono}
            tipo={elegido.etiquetaDeTipo}
            urlComoLlegar={urlDeComoLlegar({ lat: elegido.latitud, lng: elegido.longitud })}
          />
        ) : (
          <p className="text-parrafo text-pretty">
            Tocá un punto del mapa o buscá un local por su nombre para ver su dirección, su horario
            y cómo llegar.
          </p>
        )}
      </div>
    </div>
  )
}
