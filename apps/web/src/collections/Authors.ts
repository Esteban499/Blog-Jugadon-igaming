import type { CollectionConfig } from 'payload'
import { isEditor } from '../access/roles'
import { slugField } from '../fields/slug'
import { validarUrl } from '../fields/url'

/**
 * Perfil publico, separado de Users a proposito: no todo autor necesita cuenta
 * en el panel, y estos campos existen para que Google pueda evaluar la autoria.
 * En contenido de apuestas ese criterio (E-E-A-T) pesa mas que en otros nichos.
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Autor', plural: 'Autores' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'cargo'],
    group: 'Contenido',
    description: 'Perfiles públicos que firman las entradas.',
  },
  access: { read: () => true, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { name: 'nombre', type: 'text', label: 'Nombre', required: true },
    slugField('nombre'),
    {
      name: 'cargo',
      type: 'text',
      label: 'Cargo',
      localized: true,
      admin: { description: 'Por ejemplo: "Analista de apuestas deportivas".' },
    },
    { name: 'bio', type: 'richText', label: 'Biografía', localized: true },
    { name: 'foto', type: 'upload', label: 'Foto', relationTo: 'media' },
    {
      name: 'credenciales',
      type: 'array',
      label: 'Credenciales',
      labels: { singular: 'Credencial', plural: 'Credenciales' },
      admin: { description: 'Formación, años de experiencia, certificaciones.' },
      fields: [{ name: 'texto', type: 'text', label: 'Texto', required: true, localized: true }],
    },
    {
      name: 'enlaces',
      type: 'array',
      label: 'Enlaces',
      labels: { singular: 'Enlace', plural: 'Enlaces' },
      admin: { description: 'Perfiles externos que respaldan la identidad del autor.' },
      fields: [
        { name: 'etiqueta', type: 'text', label: 'Etiqueta', required: true },
        { name: 'url', type: 'text', label: 'URL', required: true, validate: validarUrl() },
      ],
    },
    {
      name: 'usuario',
      type: 'relationship',
      label: 'Cuenta vinculada',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'Opcional: vincula este perfil con una cuenta del panel.',
      },
    },
  ],
}
