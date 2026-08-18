import type { CollectionConfig } from 'payload'
import { isAuthenticated, isEditor } from '../access/roles'
import { slugField } from '../fields/slug'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'Etiqueta', plural: 'Etiquetas' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'slug'],
    group: 'Contenido',
    description: 'Temas transversales. A diferencia de las categorías, una entrada puede llevar varias.',
  },
  access: { read: () => true, create: isAuthenticated, update: isEditor, delete: isEditor },
  fields: [
    { name: 'nombre', type: 'text', label: 'Nombre', required: true, localized: true },
    slugField('nombre'),
  ],
}
