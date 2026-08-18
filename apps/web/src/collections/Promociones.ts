import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { isAuthenticated, isEditor, readPublished } from '../access/roles'
import { scrapearAhora } from '../endpoints/scrapear-ahora'
import { slugField } from '../fields/slug'
import {
  ETIQUETAS_DE_ACTIVACION,
  ETIQUETAS_DE_TIPO,
  ETIQUETAS_DE_VERTICAL,
  FORMAS_DE_ACTIVACION,
  TIPOS_DE_PROMOCION,
  VERTICALES,
} from '../scrapers/tipos'

const revalidarRutas: CollectionAfterChangeHook = async ({ doc }) => {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/promociones')
    const slug = (doc as { slug?: string })?.slug
    if (slug) revalidatePath(`/promociones/${slug}`)
  } catch {
    // Fuera del runtime de Next (el runner por CLI, el seed) no hay cache que invalidar.
  }
  return doc
}

/**
 * Las promociones vigentes de cada plataforma.
 *
 * No son entradas de blog: son datos con vencimiento, y por eso viven en su
 * propia coleccion con campos en lugar de un cuerpo libre. Un bono se compara
 * contra otro por rollover y deposito minimo; eso pide columnas, no parrafos.
 *
 * Casi todas las carga el bot, pero un editor puede cargar una a mano y las dos
 * conviven: `origen` distingue cual es cual, y el bot no pisa lo manual.
 *
 * El circuito es automatico de punta a punta: el bot publica lo vigente y
 * expira lo vencido, sin que nadie apruebe. Lo que lo hace defendible es de
 * donde sale el texto: los puntos que se publican son los que el equipo de
 * plataforma redacta en las bases de cada bono, no una lectura que el bot haga
 * de un texto libre. El blog reproduce un resumen que ya fue revisado del otro
 * lado, y remite a la plataforma para los terminos.
 *
 * Las versiones quedan igual (`drafts: true`), y ahi esta el registro de que
 * cambio el bot y cuando. Es lo que reemplaza a la aprobacion previa: no evita
 * el error, pero deja auditarlo.
 */
export const Promociones: CollectionConfig = {
  slug: 'promociones',
  labels: { singular: 'Promoción', plural: 'Promociones' },
  // Sin esto, Payload singulariza el slug a mano y el tipo generado sale como
  // `Promocione`. Solo afecta al nombre de la interfaz en payload-types.
  typescript: { interface: 'Promocion' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'plataforma', 'tipo', 'vigenciaHasta', 'estado', '_status'],
    group: 'Promociones',
    description:
      'Bonos y ofertas de las plataformas. El bot las publica y las expira solo: lo que se edita acá lo pisa la corrida siguiente, salvo el tipo y el resumen.',
    /**
     * El boton para correr el bot a pedido, arriba de la tabla.
     *
     * Va en esta coleccion y no en `plataformas` porque es donde se nota que
     * faltan promociones: quien entra a ver los bonos y los encuentra viejos
     * tiene el boton ahi mismo, sin tener que saber que la corrida se configura
     * en otra pantalla.
     *
     * Se declara por ruta, como todo componente del panel. La ruta la resuelve
     * Payload contra `admin.importMap.baseDir` (que es `src`), y el archivo
     * tiene que estar en el import map: si se agrega o se mueve un componente,
     * hay que correr `pnpm generate:importmap`.
     */
    components: {
      beforeListTable: ['/components/organisms/admin/BotonScrapear#BotonScrapear'],
    },
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/promociones/${
          (data as { slug?: string })?.slug ?? ''
        }`,
    },
  },
  access: {
    read: readPublished,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isEditor,
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  hooks: {
    afterChange: [revalidarRutas],
  },
  /**
   * Lo que llama el boton de "Leer promociones ahora". Cuelga de la coleccion,
   * asi que su ruta completa es POST /api/promociones/scrapear-ahora.
   */
  endpoints: [scrapearAhora],
  fields: [
    {
      name: 'plataforma',
      type: 'relationship',
      label: 'Plataforma',
      relationTo: 'plataformas',
      required: true,
      index: true,
    },
    { name: 'titulo', type: 'text', label: 'Título', required: true, localized: true },
    slugField('titulo'),
    {
      name: 'tipo',
      type: 'select',
      label: 'Tipo de promoción',
      required: true,
      index: true,
      options: TIPOS_DE_PROMOCION.map((value) => ({ value, label: ETIQUETAS_DE_TIPO[value] })),
    },
    {
      name: 'oferta',
      type: 'text',
      label: 'La oferta',
      localized: true,
      admin: {
        description: 'El gancho, tal como se muestra: "100% hasta $50.000 + 200 giros".',
      },
    },
    {
      name: 'resumen',
      type: 'textarea',
      label: 'Resumen',
      localized: true,
      maxLength: 300,
      admin: { description: 'Se muestra en el listado y sirve de meta descripción.' },
    },
    {
      name: 'portada',
      type: 'upload',
      label: 'Portada',
      relationTo: 'media',
      admin: {
        description:
          'Opcional. Si la cargás, se muestra en lugar de la imagen que trae la plataforma.',
      },
    },
    {
      /**
       * La imagen que publica la plataforma, como URL. No se descarga a `media`
       * a proposito: son banners que la plataforma reemplaza sin avisar, y
       * copiarlos generaria un archivo huerfano por cada cambio. Si una promo
       * merece imagen propia, se carga en `portada` y esta queda ignorada.
       */
      name: 'imagenOrigen',
      type: 'text',
      label: 'Imagen del origen',
      admin: { readOnly: true, description: 'La que publica la plataforma. La escribe el bot.' },
    },
    {
      type: 'collapsible',
      label: 'Condiciones',
      admin: {
        description:
          'Los números con los que la plataforma liquida el bono. Los trae el bot como datos, no parseados de un texto.',
      },
      fields: [
        {
          name: 'rollover',
          type: 'text',
          label: 'Rollover',
          localized: true,
          admin: { description: 'Tal como lo publica la plataforma: "30x sobre bono".' },
        },
        {
          name: 'depositoMinimo',
          type: 'text',
          label: 'Depósito mínimo',
          localized: true,
        },
        {
          /**
           * El limite de la campania, no el techo del bono.
           *
           * En los bonos por porcentaje los dos numeros son el mismo, y ahi el
           * adaptador deja este campo vacio en vez de repetir en la ficha un
           * importe que ya sale dentro de la oferta.
           */
          name: 'topeDeConversion',
          type: 'text',
          label: 'Tope de conversión',
          localized: true,
          admin: {
            description: 'Cuánto saldo real como máximo puede salir del bono.',
          },
        },
        {
          name: 'cuotaMinima',
          type: 'number',
          label: 'Cuota mínima',
          min: 1,
          admin: {
            description:
              'La cuota que tiene que tener la apuesta para que cuente al rollover. Solo en los bonos de deportes.',
          },
        },
        {
          name: 'diasParaCumplir',
          type: 'number',
          label: 'Plazo para cumplir el rollover',
          min: 0,
          admin: { description: 'En días, contados desde que se acredita el bono.' },
        },
        {
          name: 'usosPorUsuario',
          type: 'number',
          label: 'Usos por persona',
          min: 0,
        },
        {
          /**
           * Select y no checkbox: un checkbox solo puede decir si o no, y hace
           * falta un tercer estado para "la plataforma no lo publica". Con un
           * checkbox toda promocion sin el dato afirmaria que no se combina,
           * que es una restriccion inventada.
           */
          name: 'combinable',
          type: 'select',
          label: 'Se combina con otros bonos',
          options: [
            { value: 'si', label: 'Sí' },
            { value: 'no', label: 'No' },
          ],
          admin: { description: 'Vacío es "la plataforma no lo aclara".' },
        },
        {
          name: 'activacion',
          type: 'select',
          label: 'Cómo se activa',
          options: FORMAS_DE_ACTIVACION.map((value) => ({
            value,
            label: ETIQUETAS_DE_ACTIVACION[value],
          })),
        },
        {
          name: 'codigo',
          type: 'text',
          label: 'Código promocional',
          admin: { description: 'Vacío si la promoción no pide código.' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Dónde se puede usar',
      admin: {
        description: 'En qué parte de la plataforma corre el bono, según lo declara la campaña.',
      },
      fields: [
        {
          name: 'verticales',
          type: 'select',
          hasMany: true,
          label: 'Verticales',
          options: VERTICALES.map((value) => ({ value, label: ETIQUETAS_DE_VERTICAL[value] })),
          admin: {
            description:
              'El listado del sitio se puede filtrar por esto. Si cargás la promoción a mano y lo dejás vacío, no va a aparecer con ningún filtro puesto.',
          },
        },
        {
          /**
           * Vacio no es cero.
           *
           * La campania trae la lista de juegos solo cuando restringe: si no la
           * trae, el bono vale para todo el vertical. Guardar un 0 en ese caso
           * publicaria justo lo contrario de lo que dice el origen, asi que el
           * adaptador manda `undefined` y la ficha no muestra la fila.
           */
          name: 'juegosHabilitados',
          type: 'number',
          label: 'Juegos habilitados',
          min: 1,
          admin: {
            description: 'Solo si la promoción limita a una lista. Vacío es "no la limita".',
          },
        },
      ],
    },
    {
      /**
       * El resumen que el equipo de plataforma escribe a mano en las bases de
       * cada bono, dentro de un `div.jgd-summary`. Es lo que se publica.
       *
       * Un punto por linea, en vez de un array: el origen es una lista de
       * `<li>` que se reescribe entera en cada cambio, asi que las filas de un
       * array no tendrian identidad propia que valga la pena conservar, y una
       * columna de texto se compara mucho mejor en el historial de versiones.
       *
       * Los terminos completos NO se guardan. Son un documento legal de miles
       * de palabras que cambia del lado de la plataforma; reproducirlo en el
       * blog agrega una copia que puede quedar desactualizada justo en lo que
       * tiene que ser exacto. El sitio publica estos puntos y remite a la
       * plataforma, que es donde los terminos son siempre los vigentes.
       */
      name: 'puntosClave',
      type: 'textarea',
      label: 'Puntos clave',
      localized: true,
      admin: {
        description:
          'Un punto por línea. Los trae el bot del resumen que publica la plataforma en las bases del bono.',
      },
    },
    {
      name: 'urlDestino',
      type: 'text',
      label: 'Enlace a la promoción',
      required: true,
      admin: { description: 'Adónde manda el botón. Absoluta, no relativa.' },
    },
    {
      name: 'vigenciaDesde',
      type: 'date',
      label: 'Vigente desde',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'vigenciaHasta',
      type: 'date',
      label: 'Vigente hasta',
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Vacío es "sin fecha de corte publicada", no "para siempre".',
      },
    },
    {
      name: 'estado',
      type: 'select',
      label: 'Estado en el origen',
      required: true,
      defaultValue: 'activa',
      index: true,
      options: [
        { value: 'activa', label: 'Activa' },
        { value: 'expirada', label: 'Expirada' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Cuando una promoción desaparece de la plataforma, el bot la marca expirada en vez de borrarla: así la URL sigue existiendo y no se pierde lo indexado.',
      },
    },
    {
      name: 'destacada',
      type: 'checkbox',
      label: 'Destacada',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Aparece primero en el listado.' },
    },
    {
      type: 'collapsible',
      label: 'Rastro del bot',
      admin: {
        position: 'sidebar',
        description: 'Lo escribe el scraper. No se edita a mano.',
      },
      fields: [
        {
          name: 'origen',
          type: 'select',
          label: 'Origen',
          defaultValue: 'manual',
          options: [
            { value: 'scraper', label: 'Scraper' },
            { value: 'manual', label: 'Carga manual' },
          ],
          admin: {
            readOnly: true,
            description: 'El bot no pisa lo que cargó una persona.',
          },
        },
        {
          /**
           * Con que se reconoce una promocion entre corridas. Es la URL o el id
           * que le pone la plataforma, nunca algo derivado del titulo: si fuera
           * del titulo, cambiarle una palabra al bono lo daria de alta de nuevo
           * y quedarian dos.
           */
          name: 'claveExterna',
          type: 'text',
          label: 'Clave en el origen',
          index: true,
          admin: { readOnly: true },
        },
        {
          /**
           * Hash de los campos que trajo el scraper. Es lo que evita que una
           * corrida diaria genere una version nueva por dia de cada promocion:
           * si la huella no cambio, el runner no escribe.
           */
          name: 'huella',
          type: 'text',
          label: 'Huella del contenido',
          admin: { readOnly: true },
        },
        {
          name: 'vistoPorUltimaVez',
          type: 'date',
          label: 'Visto por última vez',
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime' },
            description: 'La última corrida en que esta promoción seguía publicada en el origen.',
          },
        },
      ],
    },
  ],
}
