import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, roleOf } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  auth: {
    /**
     * La cookie de sesion viaja solo por HTTPS en produccion, y nunca en un
     * pedido que arranca en otro sitio. `Strict` y no el `Lax` de Payload: el
     * panel no tiene enlaces de entrada desde afuera que valga la pena
     * conservar, y es una capa mas contra CSRF ademas de la lista `csrf` de
     * `payload.config.ts`.
     */
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    },
    // Los valores de Payload, declarados para que esten a la vista: cinco
    // intentos fallidos bloquean la cuenta diez minutos.
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
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
