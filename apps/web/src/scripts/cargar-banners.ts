import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Deja cargados en el panel los banners de campania que hoy encabezan
 * `/promociones`.
 *
 * Uso: pnpm cargar-banners
 *
 * Es idempotente: busca cada banner por nombre y actualiza en lugar de
 * duplicar, y lo mismo con los archivos, que se buscan por `filename`. Correrlo
 * dos veces deja la base igual que correrlo una.
 *
 * Existe porque los banners nacieron como archivos sueltos en `public/banners`
 * y pasaron a ser contenido: sin este paso, estrenar la coleccion significaba
 * una pantalla sin banners hasta que alguien volviera a subir a mano ocho PNG
 * que ya estaban en el repo. Despues de esto el panel manda, y `public/banners`
 * queda solo como respaldo del arte original.
 *
 * `promocionesQueCubre` es la parte que no se puede adivinar desde el arte: son
 * las promociones que el banner ya esta mostrando y que por eso no se repiten
 * en la grilla. Se buscan por slug, que las cinco plataformas comparten.
 */

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const CARPETA = path.resolve(AQUI, '../../public/banners')

/** Los slugs de Santa Fe, que tiene su propio arte por no tener casino. */
const SANTA_FE = 'santafe'

interface Campania {
  /** El nombre con el que se lo reconoce en el panel. */
  nombre: string
  mensaje: string
  /** El prefijo de los dos archivos, sin la medida. */
  archivo: string
  /** Con que termina el slug de las promociones que este banner ya muestra. */
  finalDelSlug: string
  orden: number
  /**
   * Si es la version de Santa Fe.
   *
   * Las dos versiones se reparten las plataformas de forma explicita en lugar
   * de dejar la generica sin ninguna: "sin plataformas" significa "en todas", y
   * en Santa Fe eso hacia que se vieran las dos piezas, la propia y la que
   * venia a reemplazar.
   */
  deSantaFe?: boolean
}

const CAMPANIAS: Campania[] = [
  {
    archivo: 'bienvenida',
    finalDelSlug: 'bono-de-bienvenida',
    mensaje: 'Bono de bienvenida: creá tu cuenta y recibí $25.000',
    nombre: 'Bono de bienvenida',
    orden: 0,
  },
  {
    archivo: 'primer-deposito',
    finalDelSlug: 'bono-de-primer-deposito',
    mensaje: 'Primer depósito: duplicamos tu primera recarga hasta $500.000',
    nombre: 'Primer depósito',
    orden: 1,
  },
  {
    archivo: 'santafe-bienvenida',
    finalDelSlug: 'bono-de-bienvenida',
    mensaje: 'Bono de bienvenida: creá tu cuenta y recibí $25.000',
    nombre: 'Bono de bienvenida — Santa Fe',
    orden: 2,
    deSantaFe: true,
  },
  {
    archivo: 'santafe-primer-deposito',
    finalDelSlug: 'bono-de-primer-deposito',
    mensaje: 'Primer depósito: duplicamos tu primera recarga hasta $500.000',
    nombre: 'Primer depósito — Santa Fe',
    orden: 3,
    deSantaFe: true,
  },
]

const cargar = async () => {
  const payload = await getPayload({ config })

  const { docs: plataformas } = await payload.find({
    collection: 'plataformas',
    depth: 0,
    limit: 50,
  })

  const idDeSantaFe = plataformas.find((p) => p.slug === SANTA_FE)?.id
  const idsDelResto = plataformas.filter((p) => p.slug !== SANTA_FE).map((p) => p.id)

  /** Sube un PNG a `media`, o devuelve el que ya esta subido con ese nombre. */
  const subir = async (archivo: string, alt: string) => {
    const { docs } = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      where: { filename: { equals: archivo } },
    })

    if (docs[0]) return docs[0].id

    const creado = await payload.create({
      collection: 'media',
      data: { alt },
      filePath: path.join(CARPETA, archivo),
    })

    payload.logger.info(`Subido: ${archivo}`)
    return creado.id
  }

  for (const campania of CAMPANIAS) {
    const [imagenEscritorio, imagenTelefono] = await Promise.all([
      subir(`${campania.archivo}-1350x260.png`, campania.mensaje),
      subir(`${campania.archivo}-800x400.png`, campania.mensaje),
    ])

    /*
     * Las promociones que este banner cubre, en las plataformas donde se ve.
     * Sin filtrar por plataforma, el banner generico se llevaria puesta tambien
     * la promocion de Santa Fe, que tiene su propio banner.
     */
    const { docs: cubiertas } = await payload.find({
      collection: 'promociones',
      depth: 1,
      limit: 100,
      where: { slug: { like: campania.finalDelSlug } },
    })

    const promocionesQueCubre = cubiertas
      .filter((promo) => {
        const plataforma = typeof promo.plataforma === 'object' ? promo.plataforma : undefined
        const esDeSantaFe = plataforma?.slug === SANTA_FE
        return campania.deSantaFe ? esDeSantaFe : !esDeSantaFe
      })
      .map((promo) => promo.id)

    const datos = {
      activo: true,
      imagenEscritorio,
      imagenTelefono,
      mensaje: campania.mensaje,
      nombre: campania.nombre,
      orden: campania.orden,
      plataformas: campania.deSantaFe ? (idDeSantaFe ? [idDeSantaFe] : []) : idsDelResto,
      promocionesQueCubre,
    }

    const { docs } = await payload.find({
      collection: 'banners',
      depth: 0,
      limit: 1,
      where: { nombre: { equals: campania.nombre } },
    })

    if (docs[0]) {
      await payload.update({ collection: 'banners', data: datos, id: docs[0].id })
      payload.logger.info(`Actualizado: ${campania.nombre} (${promocionesQueCubre.length} promos)`)
    } else {
      await payload.create({ collection: 'banners', data: datos })
      payload.logger.info(`Creado: ${campania.nombre} (${promocionesQueCubre.length} promos)`)
    }
  }
}

await cargar()
