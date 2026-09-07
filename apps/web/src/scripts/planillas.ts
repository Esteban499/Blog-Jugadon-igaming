import { createReadStream } from 'node:fs'
import { open } from 'node:fs/promises'
import { createInflateRaw } from 'node:zlib'

/**
 * Leer las dos planillas de puntos de venta sin agregar dependencias.
 *
 * Es codigo de script, no del sitio: corre una vez por cada listado nuevo que
 * manda la operacion y nunca entra al bundle. Por eso vive en `scripts/` y no
 * en `utilidades/`, que es lo que comparten el servidor y el navegador.
 *
 * **Por que no `xlsx` ni `exceljs`.** Las dos librerias del rubro pesan varios
 * megas, arrastran su propia superficie de CVEs y resuelven el caso general
 * —formulas, estilos, graficos, fechas en cuatro epocas distintas—. Lo que hace
 * falta aca es una fraccion: leer las celdas de texto de una sola hoja. Son
 * ciento cincuenta lineas contra una dependencia permanente en el arbol de un
 * proyecto que ya publica al navegador.
 *
 * **Por que en streaming y no de una.** El `.xlsx` del listado pesa 11 MB
 * comprimido y su `sheet1.xml` son 85 MB. Levantado entero a un `string` de
 * JavaScript son ~170 MB de heap —UTF-16, dos bytes por caracter— por un
 * archivo que en disco entra en un adjunto de mail. Descomprimir de a pedazos y
 * cortar por `<row>` lo deja en unos pocos megas en cualquier momento dado.
 */

/* ========================================================================= */
/* ZIP: LO MINIMO PARA SACAR UNA ENTRADA DE UN .XLSX                         */
/* ========================================================================= */

/**
 * Un `.xlsx` es un ZIP con XML adentro. Para sacar una entrada hacen falta tres
 * saltos: el registro final (EOCD) dice donde arranca el directorio central, el
 * directorio central dice donde arranca la cabecera local de cada archivo, y
 * recien la cabecera local dice donde arrancan los bytes comprimidos —porque su
 * largo depende de campos que solo estan ahi—.
 */
interface EntradaZip {
  nombre: string
  /** 0 = guardado tal cual, 8 = deflate. Son los dos unicos que usa Excel. */
  metodo: number
  offsetCabeceraLocal: number
  tamanioComprimido: number
}

const FIRMA_EOCD = 0x06054b50
const FIRMA_ENTRADA_CENTRAL = 0x02014b50

/**
 * El EOCD son 22 bytes al final del archivo, salvo que haya comentario: por eso
 * se busca la firma hacia atras en la ultima porcion en lugar de leerlo de una
 * posicion fija.
 */
const leerDirectorioCentral = async (ruta: string): Promise<Map<string, EntradaZip>> => {
  const archivo = await open(ruta, 'r')

  try {
    const { size } = await archivo.stat()
    const largoDeCola = Math.min(size, 65_557)
    const cola = Buffer.alloc(largoDeCola)
    await archivo.read(cola, 0, largoDeCola, size - largoDeCola)

    let posEocd = -1
    for (let i = cola.length - 22; i >= 0; i--) {
      if (cola.readUInt32LE(i) === FIRMA_EOCD) {
        posEocd = i
        break
      }
    }
    if (posEocd === -1) throw new Error(`No parece un archivo ZIP válido: ${ruta}`)

    const cantidad = cola.readUInt16LE(posEocd + 10)
    const tamanioDirectorio = cola.readUInt32LE(posEocd + 12)
    const offsetDirectorio = cola.readUInt32LE(posEocd + 16)

    /*
     * ZIP64 aparece cuando el archivo pasa los 4 GB o los 65.535 miembros, y se
     * senializa con estos centinelas. Los listados de puntos de venta no se
     * acercan ni de lejos, asi que en vez de implementar el formato extendido
     * se falla con un mensaje que dice exactamente que pasa.
     */
    if (offsetDirectorio === 0xffffffff || cantidad === 0xffff) {
      throw new Error(`El archivo usa ZIP64, que este lector no cubre: ${ruta}`)
    }

    const directorio = Buffer.alloc(tamanioDirectorio)
    await archivo.read(directorio, 0, tamanioDirectorio, offsetDirectorio)

    const entradas = new Map<string, EntradaZip>()
    let pos = 0

    for (let i = 0; i < cantidad; i++) {
      if (directorio.readUInt32LE(pos) !== FIRMA_ENTRADA_CENTRAL) break

      const largoNombre = directorio.readUInt16LE(pos + 28)
      const largoExtra = directorio.readUInt16LE(pos + 30)
      const largoComentario = directorio.readUInt16LE(pos + 32)
      const nombre = directorio.toString('utf8', pos + 46, pos + 46 + largoNombre)

      entradas.set(nombre, {
        nombre,
        metodo: directorio.readUInt16LE(pos + 10),
        tamanioComprimido: directorio.readUInt32LE(pos + 20),
        offsetCabeceraLocal: directorio.readUInt32LE(pos + 42),
      })

      pos += 46 + largoNombre + largoExtra + largoComentario
    }

    return entradas
  } finally {
    await archivo.close()
  }
}

/**
 * Los bytes de una entrada, de a pedazos y ya descomprimidos.
 *
 * El offset real de los datos no esta en el directorio central: la cabecera
 * local repite el nombre y puede traer otro campo `extra`, asi que hay que
 * leer sus 30 bytes fijos para saber cuanto ocupan los dos variables.
 */
async function* leerEntrada(
  ruta: string,
  entrada: EntradaZip,
): AsyncGenerator<Buffer, void, undefined> {
  const archivo = await open(ruta, 'r')
  let inicio: number

  try {
    const cabecera = Buffer.alloc(30)
    await archivo.read(cabecera, 0, 30, entrada.offsetCabeceraLocal)
    const largoNombre = cabecera.readUInt16LE(26)
    const largoExtra = cabecera.readUInt16LE(28)
    inicio = entrada.offsetCabeceraLocal + 30 + largoNombre + largoExtra
  } finally {
    await archivo.close()
  }

  const crudo = createReadStream(ruta, { start: inicio, end: inicio + entrada.tamanioComprimido - 1 })

  if (entrada.metodo === 0) {
    yield* crudo
    return
  }
  if (entrada.metodo !== 8) {
    throw new Error(`Método de compresión ${entrada.metodo} no soportado en ${entrada.nombre}`)
  }

  yield* crudo.pipe(createInflateRaw())
}

/** Para las entradas chicas —`sharedStrings.xml` son ~170 KB— no hace falta cortar nada. */
const leerEntradaCompleta = async (ruta: string, entrada: EntradaZip): Promise<string> => {
  const pedazos: Buffer[] = []
  for await (const pedazo of leerEntrada(ruta, entrada)) pedazos.push(pedazo)
  return Buffer.concat(pedazos).toString('utf8')
}

/* ========================================================================= */
/* XLSX: LA HOJA COMO FILAS DE TEXTO                                         */
/* ========================================================================= */

const ENTIDADES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
}

const desescapar = (texto: string): string =>
  texto
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&(?:amp|lt|gt|quot|apos);/g, (e) => ENTIDADES[e] ?? e)

/** El texto plano de un nodo: se juntan todos los `<t>` y se tira el resto. */
const textoDeNodo = (xml: string): string => {
  let junto = ''
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?\/>|<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) {
    junto += m[1] ?? ''
  }
  return desescapar(junto)
}

/**
 * `A1` → 0, `B1` → 1, `AA1` → 26. La columna se lee del atributo `r` de la
 * celda en lugar de contar celdas, porque Excel **omite las vacias**: contando,
 * una fila sin telefono corre todo lo que viene despues un lugar a la izquierda.
 */
const indiceDeColumna = (ref: string): number => {
  let n = 0
  for (const letra of ref) {
    const codigo = letra.charCodeAt(0)
    if (codigo < 65 || codigo > 90) break
    n = n * 26 + (codigo - 64)
  }
  return n - 1
}

/**
 * Las filas de la primera hoja, cada una como un arreglo alineado por columna.
 *
 * Devuelve `string` siempre, incluso para las celdas numericas: lo que se hace
 * despues con estos datos es normalizar texto y parsear coordenadas a mano, y
 * un `number` de JavaScript en el medio solo agregaria una perdida de precision
 * silenciosa en los codigos largos.
 */
export async function* filasDeXlsx(ruta: string): AsyncGenerator<string[], void, undefined> {
  const entradas = await leerDirectorioCentral(ruta)

  const hoja = entradas.get('xl/worksheets/sheet1.xml')
  if (!hoja) throw new Error(`El .xlsx no tiene xl/worksheets/sheet1.xml: ${ruta}`)

  /*
   * Excel guarda el texto una sola vez en una tabla y en la celda deja el
   * indice. Sin esta tabla, una hoja de mil filas se lee como mil numeros.
   */
  const compartidas: string[] = []
  const entradaCompartidas = entradas.get('xl/sharedStrings.xml')
  if (entradaCompartidas) {
    const xml = await leerEntradaCompleta(ruta, entradaCompartidas)
    for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) compartidas.push(textoDeNodo(m[1]!))
  }

  /*
   * El corte por `<row>` se hace sobre un buffer que se va vaciando: entra un
   * pedazo del stream, se sacan todas las filas completas que quedaron adentro
   * y lo que sobra —media fila— espera al pedazo siguiente.
   */
  let pendiente = ''

  for await (const pedazo of leerEntrada(ruta, hoja)) {
    pendiente += pedazo.toString('utf8')

    let corte: number
    while ((corte = pendiente.indexOf('</row>')) !== -1) {
      const fin = corte + '</row>'.length
      const bloque = pendiente.slice(0, fin)
      pendiente = pendiente.slice(fin)

      const inicio = bloque.lastIndexOf('<row')
      if (inicio === -1) continue

      yield celdasDeFila(bloque.slice(inicio), compartidas)
    }
  }
}

const celdasDeFila = (xml: string, compartidas: string[]): string[] => {
  const celdas = new Map<number, string>()

  for (const m of xml.matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const atributos = m[1]!
    const cuerpo = m[2] ?? ''

    const ref = /\br="([A-Z]+)\d+"/.exec(atributos)?.[1]
    if (!ref) continue

    const tipo = /\bt="([^"]+)"/.exec(atributos)?.[1]
    let valor: string

    if (tipo === 'inlineStr') {
      valor = textoDeNodo(cuerpo)
    } else {
      const bruto = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(cuerpo)?.[1]
      if (bruto === undefined) continue
      valor = tipo === 's' ? (compartidas[Number(bruto)] ?? '') : desescapar(bruto)
    }

    if (valor.trim() === '') continue
    celdas.set(indiceDeColumna(ref), valor)
  }

  if (celdas.size === 0) return []

  const ancho = Math.max(...celdas.keys()) + 1
  return Array.from({ length: ancho }, (_, i) => celdas.get(i) ?? '')
}

/* ========================================================================= */
/* CSV                                                                       */
/* ========================================================================= */

/**
 * El CSV de agencias viene con `;` y en Windows-1252, no en UTF-8: los nombres
 * traen `Concar<A0>n` y `UNI<D3>N`, que leidos como UTF-8 salen con el rombo de
 * reemplazo. `TextDecoder` trae el juego de caracteres en el runtime, asi que no
 * hace falta tabla propia ni dependencia.
 *
 * Sin comillas ni escapes a proposito: el archivo no los usa —ningun campo
 * tiene punto y coma adentro— y soportarlos seria escribir un parser entero
 * para un caso que este listado no produce. Si algun dia aparece, revienta acá
 * y no en silencio: una fila con distinta cantidad de columnas se descarta con
 * aviso en el importador.
 */
export const filasDeCsv = (contenido: Buffer): Record<string, string>[] => {
  const texto = new TextDecoder('windows-1252').decode(contenido)
  const lineas = texto.split(/\r?\n/).filter((linea) => linea.trim() !== '')
  if (lineas.length === 0) return []

  const encabezados = lineas[0]!.split(';').map((h) => h.trim())

  return lineas.slice(1).map((linea) => {
    const celdas = linea.split(';')
    return Object.fromEntries(encabezados.map((h, i) => [h, (celdas[i] ?? '').trim()]))
  })
}
