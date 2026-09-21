import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { isAdmin, isEditor } from '../access/roles'
import {
  ETIQUETA_DE_CACHE_DE_PUNTOS,
  opcionesDeProvincia,
  opcionesDeTipoDePunto,
} from '../utilidades/puntos-de-venta'

const revalidarRutas: CollectionAfterChangeHook = async ({ doc }) => {
  try {
    const { revalidatePath, revalidateTag } = await import('next/cache')
    /*
     * La consulta de la pagina se cachea aparte de la pagina —ver `traerPuntos`
     * en `puntos-de-venta/page.tsx`—, asi que invalidar solo la ruta no
     * alcanza: se volveria a renderizar con los mismos datos. `expire: 0` y no
     * `'max'` para que el proximo visitante ya vea el cambio, en lugar de
     * recibir la version vieja mientras la nueva se arma de fondo.
     */
    revalidateTag(ETIQUETA_DE_CACHE_DE_PUNTOS, { expire: 0 })
    revalidatePath('/puntos-de-venta')
  } catch {
    // Fuera del runtime de Next (el runner por CLI, el seed) no hay cache que invalidar.
  }
  return doc
}

/**
 * Las salas, agencias y puntos de pago de Jugadon, con su ubicacion en el mapa.
 *
 * Una sola coleccion para los tres, distinguidos por `tipo`. Comparten todos
 * los campos —direccion, horario, telefono— y la unica diferencia real es como
 * se llaman y con que color salen en el mapa; con tres colecciones, cada campo
 * nuevo habria que agregarlo tres veces y la pantalla publica tendria que
 * consultar y ordenar tres listas para dibujar una sola.
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
      'Las salas, agencias y puntos de pago que se muestran en el mapa del sitio. Cada uno necesita su par de coordenadas para aparecer.',
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
          'La sala es el local propio; la agencia, el comercio adherido de la red de Jugadon; el punto de pago, el comercio donde solo se carga y se retira, sin juego. Decide el color del marcador y es uno de los dos filtros del mapa.',
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
    /**
     * El identificador que trae la planilla de origen, no uno nuestro.
     *
     * Existe solo para que `pnpm importar-puntos` se pueda correr de nuevo
     * sobre una planilla actualizada sin duplicar nada: el script busca por
     * este campo y actualiza en lugar de crear. Sin el, la unica llave seria
     * "mismo nombre y misma localidad", que en un listado con veintitres
     * agencias llamadas por su propio codigo y cuatro "La Suerte" distintas
     * fusiona locales que no tienen nada que ver.
     *
     * Lleva prefijo de origen —`agencias:687-000`, `pagos:5149300`— porque los
     * dos listados numeran por su cuenta y nada garantiza que no choquen.
     *
     * Opcional a proposito: un local cargado a mano desde el panel no tiene
     * codigo de planilla y no deberia necesitar uno inventado.
     */
    {
      name: 'codigoExterno',
      type: 'text',
      label: 'Código de origen',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Lo pone la importación. Es lo que permite volver a importar la planilla sin duplicar el local.',
      },
    },
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
