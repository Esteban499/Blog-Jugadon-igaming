/**
 * Los valores fijos de los puntos de venta: que tipos hay y en que provincias.
 *
 * Vive fuera de la coleccion porque lo leen los dos lados. La coleccion arma
 * con esto los `select` del panel, y la pantalla publica arma los chips de
 * filtro y valida lo que llega por la URL. Escrito dos veces, alcanzaba con
 * agregar una provincia en un lado para que el filtro del otro la ignorara en
 * silencio.
 *
 * Las claves son las que viajan en la URL y las que se guardan en Postgres, asi
 * que van sin acentos y en minuscula: `?provincia=entre-rios`. Las etiquetas
 * —con acentos y mayusculas— son lo unico que se muestra.
 */

/**
 * Tres cosas distintas que el visitante ya distingue antes de entrar.
 *
 * La **sala** es el local propio, con su horario y su piso de juego. La
 * **agencia** es el comercio adherido de la red de Jugadon, donde se apuesta y
 * se cobra: tiene codigo de agencia y esta en el listado de la marca. El
 * **punto de pago** no es ninguna de las dos: es una farmacia, un supermercado
 * o un centro de servicio de la red de cobranzas, donde lo unico que se puede
 * hacer es cargar saldo o retirar. Ahi no se juega.
 *
 * El filtro existe porque quien busca una cosa no quiere las otras, y la
 * diferencia importa: mandar a alguien a una farmacia a jugar es mandarlo al
 * lugar equivocado. Son ademas ordenes de magnitud distintos —una veintena de
 * salas contra mas de mil puntos de pago—, asi que sin el filtro los primeros
 * desaparecen entre los segundos.
 */
export const TIPOS_DE_PUNTO = ['sala', 'agencia', 'punto-de-pago'] as const

export type TipoDePunto = (typeof TIPOS_DE_PUNTO)[number]

export const ETIQUETAS_DE_TIPO_DE_PUNTO: Record<TipoDePunto, string> = {
  sala: 'Salas',
  agencia: 'Agencias',
  'punto-de-pago': 'Puntos de pago',
}

/** En singular, para la ficha de un punto suelto. */
export const ETIQUETAS_DE_TIPO_DE_PUNTO_SINGULAR: Record<TipoDePunto, string> = {
  sala: 'Sala',
  agencia: 'Agencia',
  'punto-de-pago': 'Punto de pago',
}

/**
 * Las 24 jurisdicciones del pais, no solo las cinco donde hoy opera la marca.
 *
 * Es un `select` y no un texto libre a proposito: el filtro publico agrupa por
 * este valor, y con texto libre "Entre Rios", "entre rios" y "E. Rios" serian
 * tres provincias distintas para la misma. Que sobren opciones no cuesta nada
 * —la pantalla solo dibuja las que tienen puntos cargados—; que falte una
 * obliga a tocar codigo para abrir un local.
 */
export const PROVINCIAS = [
  'buenos-aires',
  'caba',
  'catamarca',
  'chaco',
  'chubut',
  'cordoba',
  'corrientes',
  'entre-rios',
  'formosa',
  'jujuy',
  'la-pampa',
  'la-rioja',
  'mendoza',
  'misiones',
  'neuquen',
  'rio-negro',
  'salta',
  'san-juan',
  'san-luis',
  'santa-cruz',
  'santa-fe',
  'santiago-del-estero',
  'tierra-del-fuego',
  'tucuman',
] as const

export type Provincia = (typeof PROVINCIAS)[number]

export const ETIQUETAS_DE_PROVINCIA: Record<Provincia, string> = {
  'buenos-aires': 'Buenos Aires',
  caba: 'Ciudad de Buenos Aires',
  catamarca: 'Catamarca',
  chaco: 'Chaco',
  chubut: 'Chubut',
  cordoba: 'Córdoba',
  corrientes: 'Corrientes',
  'entre-rios': 'Entre Ríos',
  formosa: 'Formosa',
  jujuy: 'Jujuy',
  'la-pampa': 'La Pampa',
  'la-rioja': 'La Rioja',
  mendoza: 'Mendoza',
  misiones: 'Misiones',
  neuquen: 'Neuquén',
  'rio-negro': 'Río Negro',
  salta: 'Salta',
  'san-juan': 'San Juan',
  'san-luis': 'San Luis',
  'santa-cruz': 'Santa Cruz',
  'santa-fe': 'Santa Fe',
  'santiago-del-estero': 'Santiago del Estero',
  'tierra-del-fuego': 'Tierra del Fuego',
  tucuman: 'Tucumán',
}

/**
 * Las opciones tal como las quiere un `select` de Payload.
 *
 * Se derivan de las listas de arriba en lugar de escribirse de nuevo en la
 * coleccion: una provincia nueva se agrega en un solo lugar.
 */
export const opcionesDeTipoDePunto = TIPOS_DE_PUNTO.map((tipo) => ({
  label: ETIQUETAS_DE_TIPO_DE_PUNTO_SINGULAR[tipo],
  value: tipo,
}))

export const opcionesDeProvincia = PROVINCIAS.map((provincia) => ({
  label: ETIQUETAS_DE_PROVINCIA[provincia],
  value: provincia,
}))

/**
 * Los filtros entran por la URL, asi que se validan antes de llegar a la
 * consulta. No es solo higiene: `tipo` y `provincia` son enums en Postgres, y
 * un valor que no este en la lista hace fallar la query entera en vez de
 * devolver cero resultados. Con la guarda, un `?provincia=cualquiera`
 * simplemente no filtra.
 *
 * Es la misma razon por la que `/promociones` valida su vertical.
 */
export const esTipoDePunto = (valor?: string): valor is TipoDePunto =>
  typeof valor === 'string' && (TIPOS_DE_PUNTO as readonly string[]).includes(valor)

export const esProvincia = (valor?: string): valor is Provincia =>
  typeof valor === 'string' && (PROVINCIAS as readonly string[]).includes(valor)
