import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { isAdmin, isEditor } from '../access/roles'
import { opcionesDeProvincia, opcionesDeTipoDePunto } from '../utilidades/puntos-de-venta'

const revalidarRutas: CollectionAfterChangeHook = async ({ doc }) => {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/puntos-de-venta')
  } catch {
    // Fuera del runtime de Next (el runner por CLI, el seed) no hay cache que invalidar.
  }
  return doc
}

/**
 * Las salas y agencias de Jugadon, con su ubicacion en el mapa.
 *
 * Una sola coleccion para los dos, distinguidos por `tipo`. Comparten todos los
 * campos —direccion, horario, telefono— y la unica diferencia real es como se
 * llaman y con que color salen en el mapa; con dos colecciones, cada campo
 * nuevo habria que agregarlo dos veces y la pantalla publica tendria que
 * consultar y ordenar dos listas para dibujar una sola.
 *
 * No es contenido editorial: no tiene cuerpo, ni autor, ni borradores. Es un
 * directorio, y lo que se edita de una sala es un dato puntual —cambio el
 * telefono, cambio el horario—, no una version que alguien tenga que aprobar.
 * Por eso `activo` en lugar de `_status`: un local que cierra por refaccion se
 * saca del mapa destildando una casilla, y vuelve igual de facil.
 */
export const PuntosDeVenta: CollectionConfig = {
  slug: 'puntos-de-venta',
  labels: { singular: 'Punto de venta', plural: 'Puntos de venta' },
  // Sin esto, Payload arma el nombre del tipo desde el slug y sale como
  // `PuntosDeVentum`. Solo afecta al nombre de la interfaz en payload-types.
  typescript: { interface: 'PuntoDeVenta' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'tipo', 'provincia', 'localidad', 'activo'],
    group: 'Puntos de venta',
    description:
      'Las salas y agencias que se muestran en el mapa del sitio. Cada una necesita su par de coordenadas para aparecer.',
  },
  access: {
    read: () => true,
    create: isEditor,
    update: isEditor,
    // Borrar saca la sala del historial; para sacarla del mapa alcanza con
    // destildar `activo`, asi que el borrado real queda en admin.
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidarRutas],
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      label: 'Nombre',
      required: true,
      admin: {
        description: 'Como se anuncia el local. Es lo que encabeza la ficha en el mapa.',
      },
    },
    {
      name: 'tipo',
      type: 'select',
      label: 'Tipo',
      required: true,
      defaultValue: 'sala',
      options: opcionesDeTipoDePunto,
      admin: {
        description:
          'La sala es el local propio; la agencia, el comercio adherido. Decide el color del marcador y es uno de los dos filtros del mapa.',
      },
    },

    /* ------------------------------------------------------------------ */
    /* Donde queda                                                        */
    /* ------------------------------------------------------------------ */
    {
      name: 'direccion',
      type: 'text',
      label: 'Dirección',
      required: true,
      admin: {
        description: 'Calle y número, como para llegar. Sin la localidad ni la provincia.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'localidad',
          type: 'text',
          label: 'Localidad',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'provincia',
          type: 'select',
          label: 'Provincia',
          required: true,
          options: opcionesDeProvincia,
          admin: {
            width: '50%',
            description: 'Agrupa los puntos en el filtro del mapa.',
          },
        },
      ],
    },

    /**
     * Las coordenadas se cargan a mano y no se deducen de la direccion.
     *
     * Geocodificar al guardar seria mas comodo de cargar, pero mete una llamada
     * paga en el guardado y falla en silencio justo donde mas duele: una
     * direccion ambigua —una calle que existe en tres localidades— se resuelve
     * sola contra la equivocada y el local queda a doscientos kilometros sin
     * que nadie se entere. Copiar el par del mapa lleva diez segundos y lo que
     * queda guardado es exactamente el punto que alguien vio y confirmo.
     *
     * De donde se sacan: en Google Maps, clic derecho sobre la puerta del local
     * y "copiar coordenadas". Se copian los dos numeros juntos, separados por
     * coma, en el mismo orden que los dos campos de aca.
     */
    {
      type: 'row',
      fields: [
        {
          name: 'latitud',
          type: 'number',
          label: 'Latitud',
          required: true,
          min: -90,
          max: 90,
          admin: {
            width: '50%',
            step: 0.000001,
            description: 'En Argentina es un número negativo: -33.30…',
          },
        },
        {
          name: 'longitud',
          type: 'number',
          label: 'Longitud',
          required: true,
          min: -180,
          max: 180,
          admin: {
            width: '50%',
            step: 0.000001,
            description: 'También negativo: -66.33…',
          },
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    /* Datos de contacto                                                  */
    /* ------------------------------------------------------------------ */
    {
      name: 'telefono',
      type: 'text',
      label: 'Teléfono',
      admin: {
        description: 'Opcional. Si se carga, en el celular sale como enlace para llamar.',
      },
    },
    {
      name: 'horarios',
      type: 'textarea',
      label: 'Horarios',
      admin: {
        description: 'Una línea por tramo. Por ejemplo: "Lunes a viernes de 10 a 22".',
      },
    },
    {
      name: 'foto',
      type: 'upload',
      label: 'Foto',
      relationTo: 'media',
      admin: {
        description: 'Opcional. La fachada, para reconocer el local al llegar.',
      },
    },

    /* ------------------------------------------------------------------ */
    /* Sidebar                                                            */
    /* ------------------------------------------------------------------ */
    {
      name: 'activo',
      type: 'checkbox',
      label: 'Activo',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'Destildar para sacarlo del mapa sin borrarlo: sirve para un local cerrado por refacción.',
      },
    },
  ],
}
