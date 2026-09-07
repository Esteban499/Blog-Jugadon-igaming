import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'
import config from '@payload-config'

import type { Provincia, TipoDePunto } from '../utilidades/puntos-de-venta'
import { filasDeCsv, filasDeXlsx } from './planillas'

/**
 * Carga en el mapa los dos listados de puntos de venta que manda la operacion.
 *
 * Uso: pnpm importar-puntos [carpeta]   ·   pnpm importar-puntos:simular
 *
 * Son dos redes distintas y no se pisan —cruzadas por coordenadas coinciden en
 * dos locales sobre mil cuatrocientos—, asi que van juntas en la misma
 * coleccion pero con `tipo` distinto:
 *
 * - **`issues (N).csv`**: la red propia de Jugadon en San Luis. Trae codigo de
 *   agencia y telefono, no trae horarios.
 * - **`Listado PDV *.xlsx`**: la red de cobranzas —farmacias, supermercados,
 *   centros de servicio— en CABA, Cordoba, San Luis y La Rioja. Trae horarios,
 *   no trae telefono. Ahi no se juega: solo se carga saldo y se retira.
 *
 * Es idempotente: cada punto se guarda con el identificador que traia su
 * planilla, en `codigoExterno`, y volver a correr el script sobre un listado
 * actualizado actualiza en lugar de duplicar. Es la unica forma de hacerlo
 * bien: el listado propio tiene veintitres agencias cuyo unico nombre es su
 * codigo y cuatro locales distintos llamados "La Suerte", asi que "mismo nombre
 * y misma localidad" fusionaria cosas que no tienen nada que ver.
 *
 * No toca `activo` de lo que ya existe: sacar un local del mapa es una decision
 * de operacion que alguien tomo desde el panel, y una reimportacion no tiene
 * por que deshacerla. Los puntos que estaban y ya no vienen en la planilla se
 * informan al final, para que alguien decida.
 */

/* ========================================================================= */
/* NORMALIZAR TEXTO                                                          */
/* ========================================================================= */

/**
 * Las dos planillas vienen en mayusculas de sistema —`FARMACIA ANTIGUA
 * CHARCAS`, `VILLA MERCEDES`— y sin acentos. Guardarlas asi deja la pantalla
 * gritando, asi que se pasan a capitalizacion normal.
 *
 * Palabras que quedan en minuscula cuando no encabezan.
 */
const CONECTORES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en', 'al'])

/**
 * Fichas que se dejan intactas: siglas, ordinales romanos y las abreviaturas de
 * direccion que la capitalizacion normal arruinaria (`S/N` → `S/n`).
 */
const INTACTAS = new Set([
  'S/N',
  'SN',
  'PB',
  'ZAC',
  'POS',
  'CF',
  'PEI',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
])

/**
 * Los acentos que las dos planillas perdieron, repuestos palabra por palabra.
 *
 * Es una tabla corta y deliberadamente conservadora: solo entran palabras que
 * en castellano **siempre** llevan tilde, asi que no hay forma de que corrija
 * de mas. `MARIA` es siempre `María` y `RIO` es siempre `Río`; `ESTE` o `SOLO`,
 * que dependen del uso, no estan y no van a estar.
 *
 * Cubre lo que aparece seguido en estos listados —`CORDOBA` 167 veces, `RIO
 * CUARTO` 32, `MARCOS JUAREZ` 10— y no pretende cubrir las 299 localidades.
 * Lo que quede sin tilde se lee igual; lo que se corrija de mas, no.
 */
const CON_TILDE: Record<string, string> = {
  ANGEL: 'Ángel',
  ANGELES: 'Ángeles',
  ANDRES: 'Andrés',
  BELEN: 'Belén',
  BOLIVAR: 'Bolívar',
  CACERES: 'Cáceres',
  CALCHAQUI: 'Calchaquí',
  CARMEN: 'Carmen',
  CATAMARCA: 'Catamarca',
  CESAR: 'César',
  CONCARAN: 'Concarán',
  CONSTITUCION: 'Constitución',
  CORDOBA: 'Córdoba',
  CORONEL: 'Coronel',
  DEAN: 'Deán',
  DIAZ: 'Díaz',
  ESTACION: 'Estación',
  FRANCES: 'Francés',
  GENERAL: 'General',
  GOMEZ: 'Gómez',
  GONZALEZ: 'González',
  GUEMES: 'Güemes',
  HIPOLITO: 'Hipólito',
  JERONIMO: 'Jerónimo',
  JESUS: 'Jesús',
  JOSE: 'José',
  JUAREZ: 'Juárez',
  JULIAN: 'Julián',
  LOPEZ: 'López',
  LUJAN: 'Luján',
  MARIA: 'María',
  MARTIN: 'Martín',
  MARTINEZ: 'Martínez',
  MERCEDES: 'Mercedes',
  MUNICIPAL: 'Municipal',
  NACION: 'Nación',
  NICOLAS: 'Nicolás',
  NOGOLI: 'Nogolí',
  PARANA: 'Paraná',
  PERU: 'Perú',
  PEREZ: 'Pérez',
  PRESBITERO: 'Presbítero',
  RAMON: 'Ramón',
  RIO: 'Río',
  RIOS: 'Ríos',
  RODRIGUEZ: 'Rodríguez',
  ROMAN: 'Román',
  SAENZ: 'Sáenz',
  SANMARTIN: 'Sanmartín',
  SEBASTIAN: 'Sebastián',
  SIMON: 'Simón',
  TOMAS: 'Tomás',
  TUCUMAN: 'Tucumán',
  UNION: 'Unión',
  VELEZ: 'Vélez',
  YRIGOYEN: 'Yrigoyen',
}

/** Deja `AV.` como `Av.` y `C.S.` como `C.S.`: la sigla con puntos no se toca. */
const esSigla = (ficha: string): boolean => /^[A-ZÑ](\.[A-ZÑ])+\.?$/.test(ficha)

const capitalizar = (ficha: string): string =>
  ficha
    .toLocaleLowerCase('es-AR')
    .replace(/(^|[^\p{L}])(\p{L})/gu, (_, antes: string, letra: string) =>
      antes === "'" ? antes + letra : antes + letra.toLocaleUpperCase('es-AR'),
    )

/**
 * `VILLA MERCEDES` → `Villa Mercedes`, `AV. SANTAMARINA 30` → `Av. Santamarina
 * 30`, `C.S. BELGRANO` → `C.S. Belgrano`.
 *
 * Solo actua sobre texto que viene todo en mayusculas: el CSV mezcla filas
 * gritadas con filas ya escritas bien —`La Mina de Oro`, `El Kiosquito del
 * ZAC`—, y pasar esas por la capitalizacion las empeora.
 */
const enCastellano = (bruto: string): string => {
  const limpio = bruto.replace(/\s+/g, ' ').trim()
  if (limpio === '') return ''
  if (limpio !== limpio.toLocaleUpperCase('es-AR')) return limpio

  return limpio
    .split(' ')
    .map((ficha, i) => {
      if (esSigla(ficha) || !/\p{L}/u.test(ficha)) return ficha

      /*
       * La sigla se busca sin la puntuacion que la rodea: en el listado
       * aparecen `(CF)` y `(SOLO PEI)`, y comparando la ficha entera el
       * parentesis la deja afuera y sale `(Cf)`.
       */
      const sinPuntuacion = ficha.replace(/[^\p{L}]/gu, '')
      if (INTACTAS.has(ficha) || INTACTAS.has(sinPuntuacion)) return ficha

      const conTilde = CON_TILDE[sinPuntuacion]
      if (conTilde) return ficha.replace(sinPuntuacion, conTilde)

      const capitalizada = capitalizar(ficha)
      const enMinuscula = capitalizada.toLocaleLowerCase('es-AR')
      return i > 0 && CONECTORES.has(enMinuscula) ? enMinuscula : capitalizada
    })
    .join(' ')
}

/**
 * La direccion, sin la basura que arrastra el sistema de origen.
 *
 * El CSV cierra cinco domicilios con `, 0`, que es el campo "numero" vacio
 * serializado como cero: `Granadero Puntanos y Cristobal Colon, 0` es una
 * esquina, no la altura cero. Tambien saca la coma que separa calle de altura
 * —`Rivadavia, 470`— porque el resto del listado escribe `Rivadavia 470` y en
 * la ficha conviven las dos formas.
 */
const limpiarDireccion = (bruto: string): string =>
  enCastellano(
    bruto
      .replace(/,\s*0\s*$/, '')
      .replace(/,\s*(?=\d)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )

/** `266-4412410`, ` 2664-021671`, `2657-664294- 2657-692534` → una sola forma prolija. */
const limpiarTelefono = (bruto: string): string | undefined => {
  const limpio = bruto
    .replace(/\s*-\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
  return limpio === '' ? undefined : limpio
}

/* ========================================================================= */
/* NORMALIZAR NUMEROS                                                        */
/* ========================================================================= */

/**
 * El CSV escribe las coordenadas con los dos separadores decimales a la vez
 * —`-33,225504` y `-66.227879` en la **misma fila**—, porque se exporto desde
 * una planilla con locale mixto. Un `Number()` derecho devuelve `NaN` para la
 * mitad de las filas, que es como se pierde medio San Luis sin que nadie lo
 * note.
 */
const aNumero = (bruto: string): number | undefined => {
  const valor = Number(bruto.trim().replace(',', '.'))
  return Number.isFinite(valor) ? valor : undefined
}

/**
 * Argentina continental, con margen. No es una validacion de precision: es la
 * red que atrapa la coordenada faltante o dada vuelta —`[lat, lon]` en vez de
 * `[lon, lat]` pone un local de San Luis en el Indico— antes de que llegue al
 * mapa y arruine el encuadre de todos los demas.
 */
const enArgentina = (lat: number, lon: number): boolean =>
  lat >= -56 && lat <= -21 && lon >= -74 && lon <= -53

/* ========================================================================= */
/* HORARIOS                                                                  */
/* ========================================================================= */

/**
 * `0830 A 1330 1500 A 2000` → `Lunes a viernes de 08:30 a 13:30 y de 15:00 a 20:00`.
 *
 * La planilla trae tres columnas —semana, sabado, domingo— con la hora pegada
 * en cuatro digitos y los tramos uno atras del otro. Se leen todos los numeros
 * de tres o cuatro digitos en orden y se arman de a pares, que aguanta las
 * variantes que aparecen en el archivo: `830 A 1330` sin el cero adelante,
 * doble espacio, la `a` en minuscula y las dos filas donde falta la `A` del
 * segundo tramo. Un `-` significa cerrado y no produce linea.
 */
const tramosHorarios = (bruto: string): string | undefined => {
  const numeros = bruto.match(/\d{3,4}/g)
  if (!numeros || numeros.length < 2) return undefined

  const tramos: string[] = []
  for (let i = 0; i + 1 < numeros.length; i += 2) {
    tramos.push(`de ${aHora(numeros[i]!)} a ${aHora(numeros[i + 1]!)}`)
  }
  return tramos.join(' y ')
}

const aHora = (digitos: string): string => {
  const relleno = digitos.padStart(4, '0')
  return `${relleno.slice(0, 2)}:${relleno.slice(2)}`
}

const armarHorarios = (semana: string, sabado: string, domingo: string): string | undefined => {
  const lineas = [
    ['Lunes a viernes', semana],
    ['Sábados', sabado],
    ['Domingos', domingo],
  ]
    .map(([dias, bruto]) => {
      const tramos = tramosHorarios(bruto!)
      return tramos ? `${dias} ${tramos}` : undefined
    })
    .filter((linea): linea is string => linea !== undefined)

  return lineas.length === 0 ? undefined : lineas.join('\n')
}

/* ========================================================================= */
/* LOS DOS LISTADOS                                                          */
/* ========================================================================= */

interface PuntoNormalizado {
  codigoExterno: string
  nombre: string
  tipo: TipoDePunto
  direccion: string
  localidad: string
  provincia: Provincia
  latitud: number
  longitud: number
  telefono?: string
  horarios?: string
}

/** Una fila que no se pudo cargar, con el motivo, para el informe del final. */
interface Descarte {
  origen: string
  identificacion: string
  motivo: string
}

/**
 * El `TIPO` del listado propio, traducido a los tres tipos del sitio.
 *
 * `SUCURSAL` es local de la marca: sala. `AGENCIA` es el comercio adherido con
 * terminal de juego: agencia. `SOLO MULTICASH` es el que **solo** tiene la
 * terminal de cobranzas —eso dice el nombre— y por lo tanto no es un lugar
 * donde se pueda jugar: va con el resto de los puntos de pago, que es
 * exactamente lo que ofrece.
 */
const TIPO_POR_LISTADO: Record<string, TipoDePunto> = {
  SUCURSAL: 'sala',
  AGENCIA: 'agencia',
  'SOLO MULTICASH': 'punto-de-pago',
}

const PROVINCIA_POR_PLANILLA: Record<string, Provincia> = {
  'CAPITAL FEDERAL': 'caba',
  CORDOBA: 'cordoba',
  'LA RIOJA': 'la-rioja',
  'SAN LUIS': 'san-luis',
  'SANTA FE': 'santa-fe',
}

/**
 * Veintitres filas del listado propio no tienen nombre comercial: en la columna
 * "Nombre Agencia" repiten el codigo, `687-000`. Dejarlo asi pone `687-000`
 * como titulo de la ficha, que no le dice nada a nadie; anteponerle el tipo lo
 * convierte en algo que al menos se lee: `Agencia 687-000`.
 */
const NOMBRE_ES_CODIGO = /^\d{3}-\d{3}$/

const ETIQUETA_PARA_NOMBRE: Record<TipoDePunto, string> = {
  sala: 'Sucursal',
  agencia: 'Agencia',
  'punto-de-pago': 'Punto de pago',
}

const leerAgencias = async (
  ruta: string,
  descartes: Descarte[],
): Promise<PuntoNormalizado[]> => {
  const filas = filasDeCsv(await readFile(ruta))
  const puntos: PuntoNormalizado[] = []

  for (const fila of filas) {
    const codigo = fila['Agencia']?.trim()
    const nombreBruto = fila['Nombre Agencia']?.trim() ?? ''
    const identificacion = codigo || nombreBruto || '(fila sin código)'

    if (!codigo) {
      descartes.push({ origen: 'agencias', identificacion, motivo: 'sin código de agencia' })
      continue
    }

    const tipo = TIPO_POR_LISTADO[fila['TIPO']?.trim().toUpperCase() ?? '']
    if (!tipo) {
      descartes.push({ origen: 'agencias', identificacion, motivo: `tipo desconocido: ${fila['TIPO']}` })
      continue
    }

    const latitud = aNumero(fila['Latitud'] ?? '')
    const longitud = aNumero(fila['Longitud'] ?? '')
    if (latitud === undefined || longitud === undefined || !enArgentina(latitud, longitud)) {
      descartes.push({ origen: 'agencias', identificacion, motivo: 'sin coordenadas válidas' })
      continue
    }

    const direccion = limpiarDireccion(fila['Domicilio'] ?? '')
    const localidad = enCastellano(fila['Localidad'] ?? '')
    if (!direccion || !localidad) {
      descartes.push({ origen: 'agencias', identificacion, motivo: 'sin domicilio o sin localidad' })
      continue
    }

    const nombre =
      nombreBruto === '' || nombreBruto === codigo || NOMBRE_ES_CODIGO.test(nombreBruto)
        ? `${ETIQUETA_PARA_NOMBRE[tipo]} ${codigo}`
        : enCastellano(nombreBruto)

    puntos.push({
      codigoExterno: `agencias:${codigo}`,
      nombre,
      tipo,
      direccion,
      localidad,
      // El listado propio es de la plataforma de San Luis y no trae columna de
      // provincia: las 232 filas son de ahi.
      provincia: 'san-luis',
      latitud,
      longitud,
      telefono: limpiarTelefono(fila['Telefono'] ?? ''),
    })
  }

  return puntos
}

/** Las columnas del `.xlsx`, por si el dia de manana llega una con otro orden. */
const COLUMNAS_PAGOS = {
  numero: 0,
  tipoAgente: 1,
  nombre: 2,
  domicilio: 3,
  provincia: 4,
  localidad: 5,
  codigoPostal: 6,
  geo: 7,
  horarioSemana: 8,
  horarioSabado: 9,
  horarioDomingo: 10,
} as const

const leerPuntosDePago = async (
  ruta: string,
  descartes: Descarte[],
): Promise<PuntoNormalizado[]> => {
  const puntos: PuntoNormalizado[] = []
  let encabezadoVisto = false

  for await (const fila of filasDeXlsx(ruta)) {
    const celda = (i: number): string => fila[i]?.trim() ?? ''

    // La primera fila con datos es el encabezado y se reconoce por su contenido,
    // no por su posicion: asi el script no depende de que la exportacion no
    // meta una fila de titulo arriba.
    if (!encabezadoVisto) {
      if (celda(COLUMNAS_PAGOS.numero).toUpperCase().includes('SUCURSAL')) {
        encabezadoVisto = true
        continue
      }
    }
    if (fila.length === 0) continue

    const numero = celda(COLUMNAS_PAGOS.numero)
    const nombreBruto = celda(COLUMNAS_PAGOS.nombre)
    const identificacion = numero || nombreBruto || '(fila sin número)'

    if (!numero || !nombreBruto) {
      descartes.push({ origen: 'pagos', identificacion, motivo: 'sin número o sin nombre' })
      continue
    }

    const provincia = PROVINCIA_POR_PLANILLA[celda(COLUMNAS_PAGOS.provincia).toUpperCase()]
    if (!provincia) {
      descartes.push({
        origen: 'pagos',
        identificacion,
        motivo: `provincia desconocida: ${celda(COLUMNAS_PAGOS.provincia)}`,
      })
      continue
    }

    /*
     * La columna es `[lon, lat]`, al reves de como se leen las coordenadas en
     * voz alta y al reves de como las guarda la coleccion. Es el error clasico
     * de portar datos de mapa —invertido, un local de Cordoba cae en el
     * Indico—, asi que el orden se desarma aca, una sola vez.
     */
    const geo = celda(COLUMNAS_PAGOS.geo).match(/-?\d+(?:\.\d+)?/g)
    const longitud = geo?.[0] === undefined ? undefined : aNumero(geo[0])
    const latitud = geo?.[1] === undefined ? undefined : aNumero(geo[1])

    if (latitud === undefined || longitud === undefined || !enArgentina(latitud, longitud)) {
      descartes.push({ origen: 'pagos', identificacion, motivo: 'sin coordenadas válidas' })
      continue
    }

    const direccion = limpiarDireccion(celda(COLUMNAS_PAGOS.domicilio))
    const localidad = enCastellano(celda(COLUMNAS_PAGOS.localidad))
    if (!direccion || !localidad) {
      descartes.push({ origen: 'pagos', identificacion, motivo: 'sin domicilio o sin localidad' })
      continue
    }

    puntos.push({
      codigoExterno: `pagos:${numero}`,
      nombre: enCastellano(nombreBruto),
      // El `TIPO AGENTE` de la planilla —"Agte Tradicional", "Centros y
      // Asistidos"— es una distincion interna de la red de cobranzas: para
      // quien busca donde cargar saldo, los dos son lo mismo.
      tipo: 'punto-de-pago',
      direccion,
      localidad,
      provincia,
      latitud,
      longitud,
      horarios: armarHorarios(
        celda(COLUMNAS_PAGOS.horarioSemana),
        celda(COLUMNAS_PAGOS.horarioSabado),
        celda(COLUMNAS_PAGOS.horarioDomingo),
      ),
    })
  }

  return puntos
}

/* ========================================================================= */
/* IMPORTAR                                                                  */
/* ========================================================================= */

const aqui = path.dirname(fileURLToPath(import.meta.url))
const CARPETA_POR_DEFECTO = path.resolve(aqui, '../../../../PDV')

const importar = async () => {
  /*
   * `simular` lee y normaliza las dos planillas y muestra el resultado sin
   * abrir la base. Es lo que se corre primero cuando llega un listado nuevo:
   * los dos archivos vienen de sistemas ajenos y lo que hay que mirar antes de
   * escribir mil cuatrocientas filas es como quedaron los nombres y cuantas se
   * descartan, no si Postgres esta levantado.
   *
   * Es una palabra suelta y no `--simular` porque `payload run` pasa los
   * argumentos por minimist y se queda solo con los posicionales: cualquier
   * cosa que empiece con guiones se la come el runner y nunca llega hasta aca.
   * Por eso tambien hay un `importar-puntos:simular` en el package.json.
   */
  const argumentos = process.argv.slice(2)
  const simular = argumentos.includes('simular')
  const carpeta = path.resolve(argumentos.find((a) => a !== 'simular') ?? CARPETA_POR_DEFECTO)

  const descartes: Descarte[] = []

  const puntos = [
    ...(await leerAgencias(path.join(carpeta, 'issues (16).csv'), descartes)),
    ...(await leerPuntosDePago(path.join(carpeta, 'Listado PDV sin Santa Fe.xlsx'), descartes)),
  ]

  if (simular) {
    console.log(`Leídos ${puntos.length} puntos de ${carpeta}
`)
    const porTipo = new Map<TipoDePunto, number>()
    const porProvincia = new Map<Provincia, number>()
    for (const p of puntos) {
      porTipo.set(p.tipo, (porTipo.get(p.tipo) ?? 0) + 1)
      porProvincia.set(p.provincia, (porProvincia.get(p.provincia) ?? 0) + 1)
    }
    console.log('Por tipo:', Object.fromEntries(porTipo))
    console.log('Por provincia:', Object.fromEntries(porProvincia))
    console.log(`
Muestra:`)
    for (const p of [puntos[0], puntos[120], puntos[232], puntos[700], puntos.at(-1)]) {
      if (p) console.log(' ', JSON.stringify(p))
    }
    console.log(`
Descartes: ${descartes.length}`)
    for (const d of descartes) console.log(`  [${d.origen}] ${d.identificacion} — ${d.motivo}`)
    return
  }

  const payload = await getPayload({ config })
  payload.logger.info(`Leídos ${puntos.length} puntos de ${carpeta}`)

  /*
   * Los existentes se traen de una y se indexan en memoria. Con `find` por
   * codigo dentro del bucle serian mil cuatrocientas consultas de ida y vuelta
   * para no averiguar nada que no se pueda saber de antemano.
   */
  const existentes = new Map<string, number>()
  let pagina = 1

  for (;;) {
    const { docs, hasNextPage } = await payload.find({
      collection: 'puntos-de-venta',
      depth: 0,
      limit: 500,
      page: pagina,
      pagination: true,
      where: { codigoExterno: { exists: true } },
    })
    for (const doc of docs) {
      if (doc.codigoExterno) existentes.set(doc.codigoExterno, doc.id)
    }
    if (!hasNextPage) break
    pagina++
  }

  const vistos = new Set<string>()
  let creados = 0
  let actualizados = 0
  let fallados = 0

  for (const punto of puntos) {
    if (vistos.has(punto.codigoExterno)) {
      descartes.push({
        origen: punto.codigoExterno.split(':')[0]!,
        identificacion: punto.codigoExterno,
        motivo: 'código repetido dentro de la misma planilla',
      })
      continue
    }
    vistos.add(punto.codigoExterno)

    const id = existentes.get(punto.codigoExterno)

    try {
      if (id === undefined) {
        // `activo` solo se pone al crear: en un punto que ya existe es una
        // decision de operacion y la importacion no la pisa.
        await payload.create({ collection: 'puntos-de-venta', data: { ...punto, activo: true } })
        creados++
      } else {
        await payload.update({ collection: 'puntos-de-venta', id, data: punto })
        actualizados++
      }
    } catch (error) {
      fallados++
      descartes.push({
        origen: punto.codigoExterno.split(':')[0]!,
        identificacion: `${punto.codigoExterno} — ${punto.nombre}`,
        motivo: error instanceof Error ? error.message : String(error),
      })
    }

    const hechos = creados + actualizados
    if (hechos > 0 && hechos % 200 === 0) payload.logger.info(`  …${hechos}/${puntos.length}`)
  }

  /* ----------------------------------------------------------------- */
  /* El informe                                                        */
  /* ----------------------------------------------------------------- */

  payload.logger.info(`Creados: ${creados} · Actualizados: ${actualizados} · Fallados: ${fallados}`)

  const huerfanos = [...existentes.keys()].filter((codigo) => !vistos.has(codigo))
  if (huerfanos.length > 0) {
    payload.logger.warn(
      `${huerfanos.length} punto(s) en la base ya no vienen en las planillas. No se tocaron; ` +
        `si cerraron, hay que destildarles "activo" en el panel: ${huerfanos.slice(0, 20).join(', ')}` +
        (huerfanos.length > 20 ? ' …' : ''),
    )
  }

  if (descartes.length > 0) {
    payload.logger.warn(`${descartes.length} fila(s) sin cargar:`)
    for (const d of descartes) {
      payload.logger.warn(`  [${d.origen}] ${d.identificacion} — ${d.motivo}`)
    }
  }
}

await importar()
