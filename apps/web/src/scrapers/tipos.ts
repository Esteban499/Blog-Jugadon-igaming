/**
 * Contrato entre el bot y las plataformas.
 *
 * Cada plataforma publica sus promociones con una maqueta distinta, pero el
 * blog las guarda todas con la misma forma. Ese pasaje de "como lo muestra la
 * plataforma" a "como lo guarda el blog" vive en un adaptador por plataforma, y
 * este archivo es lo unico que los adaptadores tienen en comun.
 *
 * La regla de oro: un adaptador LEE y NORMALIZA, nunca escribe en la base. Asi
 * se lo puede correr suelto para ver que devuelve sin riesgo de ensuciar nada.
 */

/** Los tipos de bono que se ofrecen hoy. Se refleja en el select de la coleccion. */
export const TIPOS_DE_PROMOCION = [
  'bienvenida',
  'recarga',
  'sin-deposito',
  'giros-gratis',
  'cashback',
  'torneo',
  'otro',
] as const

export type TipoDePromocion = (typeof TIPOS_DE_PROMOCION)[number]

/** Como se nombra cada tipo, en el panel y en el sitio. */
export const ETIQUETAS_DE_TIPO: Record<TipoDePromocion, string> = {
  bienvenida: 'Bono de bienvenida',
  recarga: 'Bono de recarga',
  'sin-deposito': 'Sin depósito',
  'giros-gratis': 'Giros gratis',
  cashback: 'Cashback',
  torneo: 'Torneo',
  otro: 'Otro',
}

/**
 * En que parte de la plataforma se puede usar el bono.
 *
 * El origen los publica partidos en dos, uno para la apuesta y otro para la
 * ganancia: `SPORT_BET` y `SPORT_WIN`, `CASINO_BET` y `CASINO_WIN`. En las
 * campanias que hay hoy los dos aparecen siempre juntos, asi que el par no
 * distingue nada que le sirva a un lector; se colapsa al vertical y el sufijo
 * se descarta.
 */
export const VERTICALES = ['casino', 'casino-en-vivo', 'deportes', 'esports', 'virtuales'] as const

export type Vertical = (typeof VERTICALES)[number]

export const ETIQUETAS_DE_VERTICAL: Record<Vertical, string> = {
  casino: 'Casino',
  'casino-en-vivo': 'Casino en vivo',
  deportes: 'Deportes',
  esports: 'Esports',
  virtuales: 'Virtuales',
}

/**
 * Si el bono cae solo o hay que ir a buscarlo.
 *
 * Es la duda mas comun frente a una promocion, y de las pocas que la campania
 * contesta sin ambiguedad. Sale de `subscription`, que es `auto` o `manual`.
 */
export const FORMAS_DE_ACTIVACION = ['automatica', 'a-pedido'] as const

export type FormaDeActivacion = (typeof FORMAS_DE_ACTIVACION)[number]

export const ETIQUETAS_DE_ACTIVACION: Record<FormaDeActivacion, string> = {
  automatica: 'Se acredita sola',
  'a-pedido': 'Hay que activarla',
}

/**
 * Una promocion tal como salio de la pagina, ya normalizada pero todavia sin
 * tocar la base.
 *
 * Casi todo es opcional a proposito. Una plataforma puede no publicar el
 * rollover en el listado, u ocultar la vigencia dentro de los terminos: preferir
 * un campo vacio antes que un adaptador que inventa el dato o que falla entero
 * por un campo secundario.
 */
export type PromocionCruda = {
  /**
   * Identificador estable de la promocion DENTRO de su plataforma. Es la clave
   * con la que el bot decide si una promocion ya existe o es nueva, asi que
   * tiene que sobrevivir a que le cambien el titulo: sirve la URL de la
   * promocion, o el id que la propia plataforma le ponga en el HTML. Lo que no
   * sirve es derivarla del titulo.
   */
  claveExterna: string

  titulo: string
  tipo: TipoDePromocion

  /** El gancho, tal como se muestra: "100% hasta $50.000 + 200 giros". */
  oferta?: string

  resumen?: string
  rollover?: string
  depositoMinimo?: string
  codigo?: string

  /**
   * Tope de saldo real que se puede sacar del bono, ya formateado como importe
   * igual que `depositoMinimo`.
   *
   * Queda vacio cuando ese mismo numero ya sale dentro de la oferta ("100%
   * hasta $100.000"). Repetirlo abajo con otro nombre hace leer dos limites
   * donde hay uno solo.
   */
  topeDeConversion?: string

  /** Cuantas veces puede reclamarla una misma persona. */
  usosPorUsuario?: number

  /** Dias para cumplir el rollover antes de que el bono se caiga. */
  diasParaCumplir?: number

  /**
   * Cuota minima que tiene que tener la apuesta para que cuente al rollover.
   * Solo aparece en los bonos de deportes.
   */
  cuotaMinima?: number

  /**
   * Si se puede tener a la vez que otro bono.
   *
   * Vacio es "la plataforma no lo dice", que no es lo mismo que `false`: dar
   * por hecho que no se combina seria afirmar una restriccion inventada.
   */
  combinable?: boolean

  /** En que verticales de la plataforma se puede usar. */
  verticales?: Vertical[]

  /**
   * Cuantos juegos habilita, cuando la campania trae la lista.
   *
   * Vacio NO es cero: significa que no hay lista, o sea que valen todos los
   * juegos del vertical. Publicar un 0 ahi diria exactamente lo contrario.
   */
  juegosHabilitados?: number

  /** Si cae sola o hay que reclamarla. */
  activacion?: FormaDeActivacion

  /** ISO 8601. Si la pagina no lo publica, queda vacio y lo carga un editor. */
  vigenciaDesde?: string
  vigenciaHasta?: string

  /** Adonde manda el boton. Absoluta, no relativa. */
  urlDestino: string

  /**
   * Los puntos que describen la promocion, uno por elemento.
   *
   * Salen del resumen que el equipo de plataforma escribe a mano en las bases
   * de cada bono. No son los terminos completos y no los reemplazan: el sitio
   * publica estos puntos y remite a la plataforma para lo demas.
   */
  puntosClave?: string[]

  /** La imagen que publica la plataforma, como URL absoluta. */
  imagen?: string
}

/**
 * `tipo` y `resumen` son los dos campos que un adaptador DEDUCE en lugar de
 * copiar del origen, y por eso el runner los escribe solo al crear: si un
 * editor corrige la categoria de un bono, la corrida siguiente no se la pisa.
 * El resto viene literal de la plataforma, que es la fuente de verdad, y ahi si
 * se sobreescribe.
 */
export const CAMPOS_DEDUCIDOS = ['tipo', 'resumen'] as const

/** El resultado de una pasada del adaptador sobre una plataforma. */
export type ResultadoDelAdaptador = {
  promociones: PromocionCruda[]
  /**
   * Problemas que no justifican abortar: una tarjeta sin URL, una fecha que no
   * se pudo interpretar. Se registran para que se vean en el resumen de la
   * corrida en lugar de perderse.
   */
  avisos: string[]
}

export type ContextoDelAdaptador = {
  /** La pagina publica de promociones. Es tambien la base de los enlaces al sitio. */
  url: string
  /** Base de la API de la plataforma, cuando el adaptador consume JSON. */
  urlApi?: string | null
  /** Nombre de la plataforma, solo para los mensajes de aviso. */
  plataforma: string
}

export type Adaptador = (contexto: ContextoDelAdaptador) => Promise<ResultadoDelAdaptador>

/**
 * Los adaptadores que existen hoy, para poblar el select de la coleccion.
 *
 * Vive en este archivo, y no junto a las implementaciones, porque la config de
 * Payload tambien se empaqueta para el navegador: importar desde el panel el
 * modulo que hace el scraping arrastraria al bundle del cliente cosas que solo
 * corren en Node. Aca no hay mas que texto.
 *
 * Sumar un adaptador son dos pasos: agregarlo a esta lista y registrar su
 * implementacion en `registro.ts`. El runner falla temprano si uno esta sin el
 * otro.
 */
export const ADAPTADORES_DISPONIBLES = [
  { label: 'Jugadon · los dos orígenes', value: 'jugadon' },
  { label: 'Jugadon · solo bonos (bonus-engine)', value: 'jugadon-bonus-engine' },
  { label: 'Jugadon · solo promos (sircms)', value: 'jugadon-sircms' },
] as const

export type SlugDeAdaptador = (typeof ADAPTADORES_DISPONIBLES)[number]['value']
