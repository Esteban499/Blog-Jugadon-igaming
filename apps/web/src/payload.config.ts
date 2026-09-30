import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { buildConfig, type Field } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { searchPlugin } from '@payloadcms/plugin-search'
import { es } from '@payloadcms/translations/languages/es'

import { Authors } from './collections/Authors'
import { Banners } from './collections/Banners'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Plataformas } from './collections/Plataformas'
import { Posts } from './collections/Posts'
import { Promociones } from './collections/Promociones'
import { PuntosDeVenta } from './collections/PuntosDeVenta'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const texto = (value: unknown): string => (typeof value === 'string' ? value : '')

const SITIO = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

/**
 * Produccion de verdad: build o servidor con `NODE_ENV=production` sirviendo
 * una URL publica. Un `pnpm build && pnpm start` en la compu de desarrollo
 * tambien corre en modo production, pero contra `localhost` y con los secretos
 * del `.env` versionado, y no tiene sentido frenarlo.
 */
const enProduccion =
  process.env.NODE_ENV === 'production' &&
  !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(SITIO)

/**
 * Los valores de ejemplo que viven en el repo.
 *
 * El `.env` de desarrollo esta versionado y Next lo carga solo si lo encuentra.
 * Si en la VM el gestor de secretos no llegara a inyectar `PAYLOAD_SECRET`, el
 * proceso arrancaria con el de ejemplo, que es publico, y cualquiera podria
 * firmarse un token de admin.
 */
const VALORES_DE_EJEMPLO = new Set([
  'dev-secret-solo-para-local-no-usar-en-produccion',
  'cambiar-este-valor',
])

/**
 * Frena el arranque en produccion si falta un secreto o quedo uno de ejemplo.
 *
 * Tira en lugar de avisar: un warning en el log de un proceso que igual
 * arranca es exactamente lo que nadie lee.
 */
const verificarEntorno = () => {
  if (!enProduccion || typeof window !== 'undefined') return

  const problemas: string[] = []

  for (const nombre of ['DATABASE_URI', 'PAYLOAD_SECRET']) {
    if (!process.env[nombre]) problemas.push(`falta ${nombre}`)
  }
  if (VALORES_DE_EJEMPLO.has(process.env.PAYLOAD_SECRET ?? '')) {
    problemas.push('PAYLOAD_SECRET tiene el valor de ejemplo del repo')
  }
  if ((process.env.PAYLOAD_SECRET ?? '').length < 32) {
    problemas.push('PAYLOAD_SECRET tiene que tener al menos 32 caracteres')
  }
  if ((process.env.DATABASE_URI ?? '').includes('//blog:blog@')) {
    problemas.push('DATABASE_URI usa el usuario y la clave de desarrollo')
  }

  if (problemas.length > 0) {
    throw new Error(`Configuración de producción inválida: ${problemas.join('; ')}.`)
  }
}

verificarEntorno()

/**
 * El bloque `i18n` traduce la UI de Payload, pero no alcanza para los campos
 * que los plugins declaran con etiquetas fijas en ingles. Esto se las cambia
 * buscandolas por `name`.
 *
 * Importante: cambia el `label`, nunca el `name`. El `name` es el nombre de la
 * columna en Postgres; renombrarlo seria una migracion de esquema, no una
 * traduccion.
 */
const traducirPorNombre =
  (etiquetas: Record<string, string>) =>
  (field: Field): Field => {
    if (!('name' in field)) return field
    const label = etiquetas[field.name]
    return label ? ({ ...field, label } as Field) : field
  }

/** El plugin de busqueda no trae traducciones: ningun campo suyo se traduce solo. */
const traducirCampoDelIndice = traducirPorNombre({
  title: 'Título',
  priority: 'Prioridad',
  doc: 'Documento indexado',
  docUrl: 'Ver documento',
})

/**
 * El de SEO traduce los widgets (trae su propio `es`), pero las etiquetas de
 * los campos las tiene fijas en ingles: 'Meta Image', 'Overview', 'Preview'.
 * `title` y `description` ni siquiera declaran label, asi que Payload los
 * deriva del nombre y quedan como "Title" y "Description".
 */
const traducirCampoDeSeo = traducirPorNombre({
  overview: 'Resumen',
  title: 'Título para buscadores',
  description: 'Descripción para buscadores',
  image: 'Imagen para compartir',
  preview: 'Vista previa en Google',
})

const config = buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Blog iGaming' },
  },

  /**
   * La cookie de sesion solo vale en pedidos que salen del propio sitio. Si el
   * navegador manda un `Origin` que no es este, Payload ignora la cookie y el
   * pedido llega sin usuario. Es la segunda capa contra CSRF, sobre el
   * `sameSite: 'Strict'` de `Users`.
   *
   * Solo en produccion: en desarrollo el panel tambien se abre desde el celular
   * por la IP de la red, que es otro origen. Si el sitio se sirve en mas de un
   * dominio (con y sin www), van todos aca.
   */
  csrf: enProduccion ? [SITIO] : [],

  /**
   * GraphQL apagado: nada del sitio ni del panel lo usa —el front consulta por
   * la Local API y el panel por REST—, y una API que nadie usa es superficie
   * de ataque que nadie mira. Las rutas `api/graphql*` se borraron con esto.
   */
  graphQL: { disable: true },

  collections: [
    Posts,
    Categories,
    Tags,
    Authors,
    Promociones,
    Plataformas,
    Banners,
    PuntosDeVenta,
    Media,
    Users,
  ],

  /**
   * Idioma de la INTERFAZ del panel: botones, menus, mensajes de validacion y
   * todo lo que dibuja Payload. No confundir con `localization`, que es el
   * idioma del CONTENIDO. Son dos ejes independientes.
   *
   * Al declarar `es` como unico idioma soportado, el panel queda fijo en
   * espaniol: ignora el Accept-Language del navegador y no muestra el selector
   * de idioma en el perfil del usuario. Sin este bloque, Payload cae en ingles.
   *
   * Los plugins de SEO y de redirects traen sus propias traducciones al
   * espaniol y se registran solas a partir de aca. El de busqueda no: sus
   * etiquetas se sobreescriben mas abajo, a mano.
   */
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },

  /**
   * Carpetas para organizar los archivos, en lugar de una lista plana que crece
   * sin orden. Payload agrega la vista "Explorar por Carpeta" y un campo
   * `folder` en cada coleccion que las habilite (hoy solo `media`).
   *
   * `collectionSpecific` apagado: con una sola coleccion con carpetas, el campo
   * que pregunta que tipo de documentos acepta cada carpeta seria un paso
   * obligatorio con una unica opcion posible. Si manana se habilitan carpetas en
   * otra coleccion, conviene volver a prenderlo.
   */
  folders: {
    collectionSpecific: false,
    /**
     * La coleccion de carpetas la arma Payload, y sin etiquetas propias las
     * deriva del slug: los mensajes salen como "Folder se creo correctamente".
     * Los textos de la vista si estan traducidos; esto cubre el nombre de la
     * coleccion, que es lo unico que quedaba en ingles.
     */
    collectionOverrides: [
      ({ collection }) => ({
        ...collection,
        labels: { singular: 'Carpeta', plural: 'Carpetas' },
      }),
    ],
  },

  /**
   * Un solo idioma hoy, pero la localizacion queda activa desde el inicio.
   * Sumar un locale despues es agregarlo a esta lista; activar la localizacion
   * despues es una migracion de esquema sobre contenido ya cargado.
   */
  localization: {
    locales: [{ label: 'Español', code: 'es' }],
    defaultLocale: 'es',
    fallback: true,
  },

  /**
   * La corrida diaria del bot de promociones.
   *
   * Son dos piezas distintas y hacen falta las dos: `schedule` ENCOLA el
   * trabajo todos los dias, y `autoRun` es el que lo saca de la cola y lo
   * ejecuta. Con solo la primera, el job se acumula sin correr nunca.
   *
   * El `handler` se declara como ruta a un archivo, no importando la funcion.
   * Esta config tambien se empaqueta para el navegador, y un import ahi
   * arrastraria el scraper entero al bundle del panel; Payload acepta el string
   * justamente para cortar esa cadena.
   *
   * El cron corre en la hora del servidor, que en un contenedor es UTC: las 9
   * UTC son las 6 de la maniana en Argentina. Las promociones se cargan durante
   * el dia habil, asi que a esa hora el dato del dia anterior ya esta completo.
   */
  jobs: {
    tasks: [
      {
        slug: 'scrapearPromociones',
        label: 'Leer promociones de las plataformas',
        handler: `${path.resolve(dirname, 'jobs/scrapear-promociones.ts')}#scrapearPromociones`,
        schedule: [{ cron: '0 9 * * *', queue: 'diaria' }],
        // Un reintento cubre el corte de red pasajero. Mas que eso solo
        // repetiria un error de forma del JSON, que no se arregla insistiendo.
        retries: 1,
      },
    ],
    autoRun: [{ cron: '*/5 * * * *', queue: 'diaria' }],
    /**
     * En produccion el sitio corre con varias replicas y no hace falta que
     * todas miren la cola. La variable deja prender el corredor en una sola.
     */
    shouldAutoRun: () => process.env.EJECUTAR_TAREAS !== 'false',
  },

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
  }),

  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },

  plugins: [
    seoPlugin({
      collections: ['posts', 'categories', 'promociones'],
      uploadsCollection: 'media',
      tabbedUI: true,
      fields: ({ defaultFields }) => defaultFields.map(traducirCampoDeSeo),
      /*
       * Sin marca: el sitio le agrega " | Jugadon" a todo titulo con la
       * plantilla del layout. Si el boton de generar la escribiera tambien, el
       * resultado en Google seria "Titulo | Blog iGaming | Jugadon". Esos diez
       * caracteres cuentan: el titulo que se carga aca tiene que caber en unos
       * 50 para que el total no pase los 60.
       */
      generateTitle: ({ doc }) => {
        const d = doc as Record<string, unknown>
        return texto(d?.titulo) || texto(d?.nombre)
      },
      generateDescription: ({ doc }) => {
        const d = doc as Record<string, unknown>
        return texto(d?.resumen) || texto(d?.descripcion)
      },
    }),

    /**
     * Reestructurar URLs sin 301 borra el posicionamiento ganado. Esta coleccion
     * le da a marketing una forma de cargar la redireccion sin pedir un deploy.
     */
    redirectsPlugin({
      collections: ['posts'],
      overrides: {
        // Sin `labels`, Payload los deriva del slug `redirects` y quedan en
        // ingles. Los campos internos si se traducen solos: el plugin trae su
        // propio `es` y los declara con `label: ({ t }) => t('...')`.
        labels: { singular: 'Redirección', plural: 'Redirecciones' },
        admin: {
          group: 'Sistema',
          description:
            'Cuando una entrada cambia de URL, registra aquí el 301 de la dirección vieja a la nueva.',
        },
      },
    }),

    /**
     * Mantiene un indice plano de las entradas. Hoy se consulta contra Postgres;
     * cuando el corpus crezca, el mismo indice se sincroniza a Meilisearch sin
     * tocar el modelo de contenido.
     */
    searchPlugin({
      collections: ['posts'],
      defaultPriorities: { posts: 10 },
      beforeSync: ({ originalDoc, searchDoc }) => {
        const d = originalDoc as Record<string, unknown>
        return {
          ...searchDoc,
          // El plugin busca un campo llamado `title`; el nuestro es `titulo`,
          // asi que sin esto el indice se guarda sin titulo.
          title: texto(d?.titulo) || searchDoc.title,
          resumen: texto(d?.resumen),
          slug: texto(d?.slug),
        }
      },
      searchOverrides: {
        slug: 'search',
        labels: { singular: 'Índice de búsqueda', plural: 'Índice de búsqueda' },
        admin: {
          group: 'Sistema',
          // El plugin trae una `description` hardcodeada en ingles. Se pisa aca
          // porque `searchOverrides.admin` se mezcla despues de la del plugin.
          description:
            'Se mantiene solo: cada vez que se crea o edita una entrada, su fila se actualiza. No se edita a mano.',
        },
        // Sin declarar el campo, lo que escribe beforeSync se descarta en silencio.
        fields: ({ defaultFields }) => [
          ...defaultFields.map(traducirCampoDelIndice),
          {
            name: 'resumen',
            type: 'textarea',
            label: 'Resumen',
            localized: true,
            admin: { readOnly: true },
          },
          {
            name: 'slug',
            type: 'text',
            label: 'Slug',
            localized: true,
            index: true,
            admin: { readOnly: true },
          },
        ],
      },
    }),
  ],
})

/**
 * Ultimo retoque de idioma, sobre la config ya armada.
 *
 * El campo `folder` que Payload agrega a las colecciones con carpetas trae
 * `label: 'Folder'` escrito a mano en `buildFolderField`, sin pasar por i18n, y
 * el unico override que esa funcion acepta es `admin`. No hay punto de
 * extension para la etiqueta, asi que se corrige aca: la config puede
 * exportarse como promesa, y para cuando resuelve el campo ya existe.
 *
 * Los textos de la vista de carpetas si estan traducidos por Payload; esto era
 * lo unico que quedaba en ingles.
 */
export default config.then((armada) => {
  for (const coleccion of armada.collections) {
    for (const campo of coleccion.fields) {
      if ('name' in campo && campo.name === 'folder' && campo.type === 'relationship') {
        campo.label = 'Carpeta'
      }
    }
  }
  return armada
})
