import type { CollectionConfig } from 'payload'
import { isAuthenticated, isEditor } from '../access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Archivo', plural: 'Archivos' },
  // Habilita las carpetas de Payload en esta coleccion: agrega el campo
  // `folder` y la incluye en la vista "Explorar por Carpeta".
  folders: true,
  admin: {
    /**
     * `folder` va en las columnas por defecto a proposito.
     *
     * El selector que se abre al insertar una imagen en una entrada usa la vista
     * de lista, no la de carpetas: en Payload 3.87 la navegacion por carpetas
     * existe solo en la pantalla "Explorar por Carpeta". Con la columna a la
     * vista, al menos se ve a que carpeta pertenece cada archivo y se puede
     * filtrar por carpeta desde el mismo selector.
     */
    defaultColumns: ['filename', 'alt', 'folder', 'updatedAt'],
    group: 'Contenido',
    description:
      'Imágenes que usan las entradas, los autores y las portadas. Organizalas en carpetas desde "Explorar por Carpeta".',
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isEditor,
  },
  upload: {
    focalPoint: true,
    /**
     * Formatos de mapa de bits, con nombre y apellido. `image/*` dejaba pasar
     * SVG, que es un documento con `<script>` adentro: el archivo se sirve por
     * `/api/media/file/...`, desde el mismo origen que el panel, y abrirlo
     * ejecutaria lo que traiga con la sesion de quien lo abra. Tambien quedan
     * afuera HEIC/HEIF, que pasan por libheif, la parte de sharp con mas
     * historial de vulnerabilidades.
     */
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
    // Los tamanos se generan al subir; el front pide el que necesita en vez de
    // servir el original y escalarlo en el navegador.
    imageSizes: [
      { name: 'thumbnail', width: 400, height: undefined },
      { name: 'card', width: 768, height: undefined },
      { name: 'hero', width: 1600, height: undefined },
      { name: 'og', width: 1200, height: 630, fit: 'cover' },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texto alternativo',
      required: true,
      localized: true,
      admin: {
        description:
          'Qué se ve en la imagen. Lo leen los lectores de pantalla y lo usa Google: no lo dejes vacío ni repitas el título.',
      },
    },
    { name: 'epigrafe', type: 'text', label: 'Epígrafe', localized: true },
  ],
}
