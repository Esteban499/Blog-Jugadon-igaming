import type { CollectionConfig } from 'payload'
import { isAdmin, isEditor } from '../access/roles'
import { slugField } from '../fields/slug'
import { ADAPTADORES_DISPONIBLES } from '../scrapers/tipos'

/**
 * Las marcas de Jugadon cuyas promociones se publican en el blog.
 *
 * Es a la vez contenido (nombre y logo salen en las tarjetas del sitio) y
 * configuracion del bot: de aca sale que paginas visitar y con que adaptador
 * leerlas. Tenerlo en la base y no en un archivo de codigo es lo que permite
 * apagar el scrapeo de una plataforma, o corregirle la URL, sin un deploy.
 */
export const Plataformas: CollectionConfig = {
  slug: 'plataformas',
  labels: { singular: 'Plataforma', plural: 'Plataformas' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'scrapeoActivo', 'adaptador', 'urlPromociones'],
    group: 'Promociones',
    description: 'Las marcas cuyas promociones se publican, y de donde las lee el bot.',
  },
  access: {
    read: () => true,
    create: isEditor,
    update: isEditor,
    // Borrar una plataforma dejaria sus promociones sin marca: queda en admin.
    delete: isAdmin,
  },
  fields: [
    { name: 'nombre', type: 'text', label: 'Nombre', required: true },
    slugField('nombre'),
    {
      name: 'logo',
      type: 'upload',
      label: 'Logo',
      relationTo: 'media',
      admin: { description: 'Se muestra en las tarjetas de promocion.' },
    },
    {
      name: 'urlSitio',
      type: 'text',
      label: 'Sitio de la plataforma',
      admin: { description: 'La home de la marca. No es de donde se scrapea.' },
    },
    {
      name: 'urlPromociones',
      type: 'text',
      label: 'Página de promociones',
      required: true,
      admin: {
        description:
          'La URL exacta que visita el bot. Si la plataforma rediseña y la mueve, se corrige acá.',
      },
    },
    {
      /**
       * El `PROXY_URL` de la plataforma. No se deduce del subdominio: cuatro
       * usan `proxy<provincia>.jugadon.bet.ar` pero San Luis pega contra
       * `proxy2.jugadon.bet.ar`. Sale del runtime config del sitio, buscando
       * `PROXY_URL` en el HTML de cualquier pagina.
       */
      name: 'urlApi',
      type: 'text',
      label: 'Base de la API',
      admin: {
        description:
          'De acá cuelga /bonus-engine/api/campaigns. Es el PROXY_URL que declara el sitio, y no siempre coincide con el subdominio.',
      },
    },
    {
      name: 'adaptador',
      type: 'select',
      label: 'Adaptador',
      required: true,
      options: [...ADAPTADORES_DISPONIBLES],
      admin: {
        description:
          'Con qué código se lee esta página. Cada plataforma maqueta distinto, así que casi siempre tiene el suyo.',
      },
    },
    {
      name: 'scrapeoActivo',
      type: 'checkbox',
      label: 'Scrapeo activo',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'Destildar para que el bot la saltee. Las promociones ya publicadas siguen online: esto solo frena la lectura.',
      },
    },
    {
      name: 'ultimaCorrida',
      type: 'date',
      label: 'Última corrida',
      admin: {
        position: 'sidebar',
        // Solo de cara al panel: la Local API, que es por donde escribe el bot,
        // no pasa por `readOnly`.
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        description: 'La escribe el bot. Si quedó vieja, algo dejó de correr.',
      },
    },
    {
      name: 'ultimoResultado',
      type: 'textarea',
      label: 'Último resultado',
      admin: {
        position: 'sidebar',
        // Solo de cara al panel: la Local API, que es por donde escribe el bot,
        // no pasa por `readOnly`.
        readOnly: true,
        description: 'Qué encontró el bot la última vez, o por qué falló.',
      },
    },
  ],
}
