import type { Field } from 'payload'

export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // saca acentos: "guia-rapida", no "guía-rápida"
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Slug que se autocompleta desde otro campo si el editor lo deja vacio, pero
 * que se puede fijar a mano. Una vez publicado no conviene cambiarlo: si hay
 * que hacerlo, cargar el 301 en la coleccion de redirects.
 */
export const slugField = (from = 'titulo'): Field => ({
  name: 'slug',
  type: 'text',
  label: 'Slug',
  index: true,
  unique: true,
  localized: true,
  admin: {
    position: 'sidebar',
    description: 'Se genera solo si lo dejas vacío. Una vez publicado, cambiarlo pide cargar un 301.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.trim().length > 0) return slugify(value)
        const source = (data as Record<string, unknown> | undefined)?.[from]
        if (typeof source === 'string' && source.trim().length > 0) return slugify(source)
        return value
      },
    ],
  },
})
