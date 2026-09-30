import { getPayload } from 'payload'
import config from '@payload-config'
import sharp from 'sharp'

/**
 * Datos de prueba para verificar la cadena completa: Postgres, el panel y la
 * subida de archivos al disco. Es idempotente: si ya hay entradas, no toca nada.
 *
 * Uso: pnpm seed
 */

/**
 * Lexical espera esta forma; escribirla a mano evita depender del editor.
 *
 * `as const` en `format` y `direction`: sin el, TS los ensancha a `string` y
 * dejan de encajar en las uniones literales que declara Lexical.
 */
const parrafo = (texto: string) => ({
  type: 'paragraph',
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  textFormat: 0,
  children: texto
    ? [
        {
          type: 'text',
          text: texto,
          format: 0,
          style: '',
          mode: 'normal',
          detail: 0,
          version: 1,
        },
      ]
    : [],
})

/** Documento suelto, para los campos richText que viven dentro de un bloque. */
const parrafos = (...textos: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: textos.map(parrafo),
  },
})

/** Los bloques de Lexical se identifican con un ObjectID, igual que en Mongo. */
const idDeBloque = () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')

/**
 * Un bloque de Payload incrustado en el documento. Es como se guarda lo que en
 * el panel se inserta con el menu `/`.
 */
const bloque = (campos: Record<string, unknown>) => ({
  type: 'block',
  format: '' as const,
  version: 2,
  fields: { id: idDeBloque(), blockName: '', ...campos },
})

/** Arma el cuerpo de una entrada a partir de nodos sueltos. */
const documento = (...nodos: Array<{ type: string; version: number; [k: string]: unknown }>) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: nodos,
  },
})

const seed = async () => {
  const payload = await getPayload({ config })

  // ---- Usuario administrador ----
  const { totalDocs: totalUsuarios } = await payload.count({ collection: 'users' })
  if (totalUsuarios === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@blog.local',
        password: 'admin1234',
        nombre: 'Administrador',
        rol: 'admin',
      },
    })
    payload.logger.info('Usuario creado -> admin@blog.local / admin1234')
  } else {
    payload.logger.info('Ya hay usuarios; no se crea ninguno.')
  }

  // ---- Contenido ----
  const { totalDocs: totalEntradas } = await payload.count({ collection: 'posts' })
  if (totalEntradas > 0) {
    payload.logger.info('Ya hay entradas cargadas; se omite el contenido de prueba.')
    return
  }

  const categoria = await payload.create({
    collection: 'categories',
    data: {
      nombre: 'Apuestas deportivas',
      descripcion:
        'Guias para entender cuotas, mercados y gestion de banca antes de hacer una apuesta.',
    },
  })

  const etiquetaCuotas = await payload.create({
    collection: 'tags',
    data: { nombre: 'Cuotas' },
  })

  const etiquetaPrincipiantes = await payload.create({
    collection: 'tags',
    data: { nombre: 'Principiantes' },
  })

  const autor = await payload.create({
    collection: 'authors',
    data: {
      nombre: 'Equipo editorial',
      cargo: 'Redaccion',
      bio: parrafos(
        'Equipo de redaccion del blog. Este perfil es de prueba: reemplazalo por autores reales con credenciales verificables antes de publicar.',
      ),
      credenciales: [{ texto: 'Perfil de ejemplo cargado por el seed' }],
    },
  })

  // Genera una imagen y la sube: verifica de punta a punta el camino a MinIO.
  const imagen = await sharp({
    create: { width: 1200, height: 630, channels: 3, background: '#0d6b57' },
  })
    .png()
    .toBuffer()

  const portada = await payload.create({
    collection: 'media',
    data: { alt: 'Imagen de prueba generada por el seed' },
    file: {
      data: imagen,
      mimetype: 'image/png',
      name: 'portada-demo.png',
      size: imagen.length,
    },
  })

  await payload.create({
    collection: 'posts',
    data: {
      titulo: 'Como se leen las cuotas decimales',
      resumen:
        'Que significa el numero que aparece al lado de cada mercado, como se calcula el retorno y por que la cuota no es la probabilidad real.',
      portada: portada.id,
      categoria: categoria.id,
      etiquetas: [etiquetaCuotas.id, etiquetaPrincipiantes.id],
      autor: autor.id,
      _status: 'published',
      // El cuerpo es un documento Lexical: el texto va suelto y los formatos
      // especiales se intercalan como nodos de bloque.
      contenido: documento(
        parrafo(
          'La cuota decimal expresa cuanto se cobra por cada unidad apostada, incluido el importe original. Una cuota de 2.50 devuelve 2,50 por cada 1 apostado: 1,50 de ganancia mas el 1 que pusiste.',
        ),
        bloque({
          blockType: 'aviso',
          tipo: 'juego-responsable',
          texto: parrafos(
            'Este contenido es informativo. Apostar implica riesgo de perdida: definí un limite antes de empezar y no lo muevas.',
          ),
        }),
        bloque({
          // El bloque `codigo` renderiza: lo que se carga aca se ejecuta dentro
          // de un marco aislado, no se muestra como texto.
          blockType: 'codigo',
          lenguaje: 'html',
          archivo: 'Ejemplo de calculo',
          altura: 220,
          codigo: [
            '<!doctype html>',
            '<meta charset="utf-8">',
            '<style>',
            '  body { margin: 0; font-family: system-ui, sans-serif; background: #f0f3f1; }',
            '  .caja { padding: 1.25rem; }',
            '  .fila { display: flex; justify-content: space-between; padding: 0.5rem 0;',
            '          border-bottom: 1px solid #d8e0dd; color: #3d4d49; }',
            '  .fila strong { color: #0d6b57; }',
            '</style>',
            '<div class="caja">',
            '  <div class="fila"><span>Importe apostado</span><strong>$1.000</strong></div>',
            '  <div class="fila"><span>Cuota decimal</span><strong>2,50</strong></div>',
            '  <div class="fila"><span>Retorno total</span><strong>$2.500</strong></div>',
            '  <div class="fila"><span>Ganancia neta</span><strong>$1.500</strong></div>',
            '</div>',
          ].join('\n'),
        }),
        bloque({
          // Tal cual sale de una planilla: una fila por linea, columnas con TAB.
          blockType: 'tabla',
          titulo: 'Equivalencia entre formatos de cuota',
          conEncabezado: true,
          datos: [
            'Decimal\tFraccional\tProbabilidad implicita',
            '1.50\t1/2\t66,7%',
            '2.00\t1/1\t50,0%',
            '3.40\t12/5\t29,4%',
          ].join('\n'),
        }),
        bloque({
          blockType: 'faq',
          titulo: 'Preguntas frecuentes',
          preguntas: [
            {
              pregunta: 'La probabilidad implicita es la probabilidad real?',
              respuesta:
                'No. Incluye el margen del operador, asi que la suma de las probabilidades implicitas de un evento siempre supera el 100%.',
            },
            {
              pregunta: 'Que formato de cuota conviene usar?',
              respuesta:
                'El decimal es el mas directo para calcular el retorno, porque ya incluye el importe apostado.',
            },
          ],
        }),
        // Un documento que termina en bloque no deja donde pararse a escribir.
        parrafo(''),
      ),
    },
  })

  payload.logger.info('Contenido de prueba cargado.')
}

await seed()
process.exit(0)
