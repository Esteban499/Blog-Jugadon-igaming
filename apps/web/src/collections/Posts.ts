import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { bloquesDelEditor } from '../blocks'
import { editarSinPublicar, isEditor, readPublished } from '../access/roles'
import { slugField } from '../fields/slug'

/**
 * Fecha de publicacion: se sella sola la primera vez que la entrada pasa a
 * publicada, para que nadie tenga que acordarse de cargarla.
 */
const sellarFechaDePublicacion: CollectionBeforeChangeHook = ({ data }) => {
  if (data?._status === 'published' && !data?.publicadoEn) {
    data.publicadoEn = new Date().toISOString()
  }
  return data
}

/**
 * Regenera solo las rutas afectadas en lugar de esperar a que venza el cache.
 * Es lo que hace que marketing vea el cambio online en segundos, sin rebuild
 * ni deploy de por medio.
 */
const revalidarRutas: CollectionAfterChangeHook = async ({ doc }) => {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/')
    const slug = (doc as { slug?: string })?.slug
    if (slug) revalidatePath(`/blog/${slug}`)
  } catch {
    // Fuera del runtime de Next (seed, scripts CLI) no hay cache que invalidar.
  }
  return doc
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Entrada', plural: 'Entradas' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'categoria', 'autor', 'publicadoEn', '_status'],
    group: 'Contenido',
    description: 'Guías, tutoriales y notas informativas.',
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/blog/${
          (data as { slug?: string })?.slug ?? ''
        }`,
    },
  },
  access: {
    read: readPublished,
    create: editarSinPublicar,
    update: editarSinPublicar,
    delete: isEditor,
  },
  versions: {
    drafts: true,
    // Acota cuanto crece la tabla de versiones en Postgres.
    maxPerDoc: 25,
  },
  hooks: {
    beforeChange: [sellarFechaDePublicacion],
    afterChange: [revalidarRutas],
  },
  fields: [
    { name: 'titulo', type: 'text', label: 'Título', required: true, localized: true },
    slugField('titulo'),
    {
      name: 'resumen',
      type: 'textarea',
      label: 'Resumen',
      required: true,
      localized: true,
      maxLength: 300,
      admin: {
        description:
          'Se muestra en los listados y sirve de respaldo para la meta descripción si no cargas una.',
      },
    },
    {
      name: 'portada',
      type: 'upload',
      label: 'Portada',
      relationTo: 'media',
      admin: {
        description:
          'Opcional. Si no cargas una, la entrada se publica igual y en los listados aparece solo con texto.',
      },
    },
    {
      /**
       * Un documento continuo, no una pila de tarjetas.
       *
       * Con `type: 'blocks'` escribir un parrafo costaba tres clics: agregar
       * bloque, elegir "Texto", desplegar la tarjeta. Con `richText` el texto es
       * el documento y los formatos especiales se intercalan con `/`, que es la
       * interaccion que la gente ya conoce de Notion. El editor trae ademas el
       * `+` al pasar el mouse y el asa para arrastrar y reordenar.
       */
      name: 'contenido',
      type: 'richText',
      label: 'Contenido',
      required: true,
      localized: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          // Misma clave que la de `defaultFeatures`, asi que la reemplaza.
          // El h1 es el titulo de la entrada: repetirlo en el cuerpo lo hace
          // competir contra si mismo.
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          /**
           * Tabla del editor: se inserta con `/table`, se navega con Tab y trae
           * el `+` al pasar el mouse para sumar filas y columnas.
           *
           * Payload la marca como experimental, y ademas su menu contextual
           * ("Delete row", "Merge cells") esta escrito a mano en el bundle del
           * cliente, sin pasar por i18n: son las unicas etiquetas del panel que
           * quedan en ingles. Para el dato que ya viene de una planilla existe
           * `TablaBlock`, que si esta traducido.
           */
          EXPERIMENTAL_TableFeature(),
          BlocksFeature({ blocks: bloquesDelEditor }),
        ],
      }),
      admin: {
        description:
          'Escribí directo. Con "/" insertás tablas, avisos, FAQs, imágenes o HTML.',
      },
    },
    {
      name: 'categoria',
      type: 'relationship',
      label: 'Categoría',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'etiquetas',
      type: 'relationship',
      label: 'Etiquetas',
      relationTo: 'tags',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'autor',
      type: 'relationship',
      label: 'Autor',
      relationTo: 'authors',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'publicadoEn',
      type: 'date',
      label: 'Publicado el',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Se completa sola al publicar. Edítala si necesitas otra fecha.',
      },
    },
    {
      name: 'actualizadoEn',
      type: 'date',
      label: 'Actualizado el',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'Mostrar la fecha de revisión es una señal de contenido mantenido, que pesa en este vertical.',
      },
    },
    {
      name: 'destacado',
      type: 'checkbox',
      label: 'Destacado',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Aparece primero en la portada.' },
    },
  ],
}
