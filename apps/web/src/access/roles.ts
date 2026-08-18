import type { Access, FieldAccess } from 'payload'
import type { User } from '../payload-types'

/**
 * Los valores salen del tipo generado en lugar de repetirse aca: si manana se
 * suma o se renombra un rol en la coleccion, este tipo lo sigue solo.
 */
export type Role = User['rol']

/**
 * El campo se llama `rol`, en espaniol, igual que la columna en Postgres.
 *
 * Antes esto leia `.role` y siempre devolvia `undefined`, asi que `isAdmin` e
 * `isEditor` eran false para todo el mundo. Ese tipo de bug no da error: apaga
 * permisos en silencio. Tipar el cast contra `User` en vez de contra un objeto
 * anonimo hace que la proxima vez falle en compilacion.
 */
export const roleOf = (user: unknown): Role | undefined =>
  (user as Partial<User> | null | undefined)?.rol

export const isAdmin: Access = ({ req: { user } }) => roleOf(user) === 'admin'

export const isEditor: Access = ({ req: { user } }) => {
  const role = roleOf(user)
  return role === 'admin' || role === 'editor'
}

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

/**
 * El publico solo ve entradas publicadas; el equipo ve todo, borradores incluidos.
 * Devolver una query en lugar de false hace que Payload filtre en la base.
 */
export const readPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}

export const isAdminField: FieldAccess = ({ req: { user } }) => roleOf(user) === 'admin'
