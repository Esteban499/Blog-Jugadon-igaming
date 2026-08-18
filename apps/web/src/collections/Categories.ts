import type { CollectionConfig } from 'payload'
import { isEditor } from '../access/roles'
import { slugField } from '../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Categoría', plural: 'Categorías' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'slug'],
    group: 'Contenido',
    description: 'Cada categoría es un silo de contenido con su propia página pilar.',
  },
  access: { read: () => true, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { name: 'nombre', type: 'text', label: 'Nombre', required: true, localized: true },
    slugField('nombre'),
    {
      name: 'descripcion',
      type: 'textarea',
      label: 'Descripción',
      localized: true,
      admin: {
        description:
          'Texto de la página pilar. Es la que compite por el término genérico, así que conviene que sea sustancial.',
      },
    },
  ],
}
