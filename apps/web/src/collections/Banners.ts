import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { isAuthenticated, isEditor } from '../access/roles'

const revalidarPromociones: CollectionAfterChangeHook = async ({ doc }) => {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/promociones')
  } catch {
    // Fuera del runtime de Next (el runner por CLI, el seed) no hay cache que invalidar.
  }
  return doc
}

/**
 * Los banners de campania que abren `/promociones`, por encima del titulo.
 *
 * Es la unica pieza del sitio que es puro arte: no describe una promocion con
 * campos comparables como hace `promociones`, muestra la imagen que diseño
 * marketing con el monto ya dibujado adentro. Por eso vive en su propia
 * coleccion y no como un campo mas del bono: el bono es el dato y el banner es
 * la campania, y no cambian ni al mismo ritmo ni con la misma mano.
 *
 * Dos imagenes por banner y no una escalada: la faja de escritorio y el
 * rectangulo de telefono no son el mismo dibujo recortado —cambia la
 * composicion y el texto se reacomoda—, asi que el sitio las sirve como art
 * direction y baja una sola de las dos.
 *
 * `plataformas` vacio significa "en todas", y es lo que evita cargar cinco veces
 * la misma pieza. La excepcion se declara a mano: hoy cada campania tiene una
 * version para cuatro jurisdicciones y otra para Santa Fe, que no tiene casino y
 * por eso su arte dice otra cosa. Las dos listan sus plataformas, porque dejar
 * la generica vacia la haria salir tambien en Santa Fe, encima de la propia.
 *
 * Sin borradores a proposito: un banner no se redacta ni se revisa, se prende o
 * se apaga. Esa es la unica decision, y la toma `activo`.
 */
export const Banners: CollectionConfig = {
  slug: 'banners',
  labels: { singular: 'Banner', plural: 'Banners' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'plataformas', 'orden', 'activo', 'updatedAt'],
    group: 'Promociones',
    description:
      'Las piezas de campaña que encabezan la pantalla de promociones. Se turnan solas, en el orden de acá abajo.',
  },
  /**
   * La lista arranca ordenada como se va a ver en el sitio, no por fecha de
   * edicion: el orden es parte del contenido, y verlo distinto en el panel
   * obliga a reconstruirlo de memoria para saber cual sale primero.
   */
  defaultSort: 'orden',
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isEditor,
  },
  hooks: {
    afterChange: [revalidarPromociones],
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      label: 'Nombre',
      required: true,
      admin: {
        description: 'Solo para reconocerlo acá adentro. No se muestra en el sitio.',
      },
    },
    {
      /**
       * Lo unico que un lector de pantalla puede saber del banner.
       *
       * El texto de la campania esta dibujado dentro del PNG, y ahi no lo
       * alcanza nadie: ni un lector de pantalla, ni el buscador, ni quien tiene
       * las imagenes apagadas. Este campo es esa misma frase en texto, y es lo
       * que el sitio le pone de nombre al boton que cubre el banner.
       */
      name: 'mensaje',
      type: 'text',
      label: 'Qué dice el banner',
      required: true,
      localized: true,
      admin: {
        description:
          'La oferta escrita en texto, tal como se lee en la imagen. Ej: "Bono de bienvenida: creá tu cuenta y recibí $25.000".',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'imagenEscritorio',
          type: 'upload',
          label: 'Imagen para computadora',
          relationTo: 'media',
          required: true,
          admin: {
            width: '50%',
            description: 'Faja apaisada. La medida del arte actual es 1350 × 260.',
          },
        },
        {
          name: 'imagenTelefono',
          type: 'upload',
          label: 'Imagen para teléfono',
          relationTo: 'media',
          required: true,
          admin: {
            width: '50%',
            description: 'La misma campaña recompuesta en vertical. La medida actual es 800 × 400.',
          },
        },
      ],
    },
    {
      name: 'plataformas',
      type: 'relationship',
      label: 'Plataformas',
      relationTo: 'plataformas',
      hasMany: true,
      admin: {
        description:
          'En qué jurisdicciones se muestra. Vacío es en todas. Si una necesita otro arte, cargá la pieza aparte y sacá esa jurisdicción de esta lista: si no, se ven las dos.',
      },
    },
    {
      /**
       * Que promociones deja de mostrar la grilla por culpa de este banner.
       *
       * El bono de bienvenida y el de primer deposito estan arriba con el monto
       * en cuerpo 100; dejarlos ademas como tarjeta seria decir dos veces lo
       * mismo en la misma pantalla, y la tarjeta es la version pobre.
       *
       * Es un campo y no una regla escrita en el codigo porque la respuesta
       * cambia con la campania: hasta ayer se resolvia buscando el tipo
       * `bienvenida` y los slugs que contuvieran `bono-de-primer-deposito`, que
       * es exactamente la clase de heuristica que se rompe callada el dia que
       * marketing renombra una campania.
       */
      name: 'promocionesQueCubre',
      type: 'relationship',
      label: 'Promociones que reemplaza',
      relationTo: 'promociones',
      hasMany: true,
      admin: {
        description:
          'Las promociones que este banner ya está mostrando. No aparecen en la grilla de abajo, para no repetirlas.',
      },
    },
    {
      name: 'orden',
      type: 'number',
      label: 'Orden',
      required: true,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'De menor a mayor. El más chico se muestra primero.',
      },
    },
    {
      name: 'activo',
      type: 'checkbox',
      label: 'Activo',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Destildado, el banner deja de salir en el sitio pero no se borra.',
      },
    },
  ],
}
