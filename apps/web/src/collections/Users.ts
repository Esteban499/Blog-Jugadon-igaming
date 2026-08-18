import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, roleOf } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  auth: true,
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'email', 'rol'],
    group: 'Administración',
    description: 'Cuentas con acceso al panel. El perfil público del autor vive en Autores.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: isAdmin,
    // Cualquiera puede editar su propia cuenta; el resto, solo un admin.
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (roleOf(user) === 'admin') return true
      return user.id === id
    },
    delete: isAdmin,
  },
  fields: [
    { name: 'nombre', type: 'text', label: 'Nombre', required: true },
    {
      name: 'rol',
      type: 'select',
      label: 'Rol',
      required: true,
      defaultValue: 'autor',
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Autor', value: 'autor' },
      ],
      admin: {
        description:
          'Autor: crea y edita entradas. Editor: además publica y borra. Administrador: además gestiona usuarios.',
      },
      // Nadie se puede autoascender.
      access: { update: isAdminField },
    },
  ],
}
