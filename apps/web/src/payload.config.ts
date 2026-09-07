import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { buildConfig, type Field } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
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
    /**
     * Local: MinIO. Produccion: Cloudflare R2. Mismo SDK, misma API S3:
     * el salto entre entornos son variables de entorno, no codigo.
     */
    s3Storage({
      collections: { media: { prefix: 'media' } },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'us-east-1',
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),

    seoPlugin({
      collections: ['posts', 'categories', 'promociones'],
      uploadsCollection: 'media',
      tabbedUI: true,
      fields: ({ defaultFields }) => defaultFields.map(traducirCampoDeSeo),
      generateTitle: ({ doc }) => {
        const d = doc as Record<string, unknown>
        const base = texto(d?.titulo) || texto(d?.nombre)
        return base ? `${base} | Blog iGaming` : 'Blog iGaming'
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
