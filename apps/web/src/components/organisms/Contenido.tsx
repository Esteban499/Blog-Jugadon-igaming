import React from 'react'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import { IconoChevron } from '@/components/atoms/iconos/IconoChevron'
import { AvisoEnLinea } from '@/components/molecules/AvisoEnLinea'
import { BloqueCta } from '@/components/molecules/BloqueCta'

/**
 * Render del cuerpo de una entrada.
 *
 * El cuerpo es un documento Lexical. Los parrafos, titulos, listas, citas y
 * enlaces los resuelven los convertidores que ya trae Payload, y su estetica
 * sale entera de las reglas de `.prosa` en styles.css: aca no se escribe una
 * sola clase para ellos. Lo que si vive en este archivo son los bloques
 * propios, que son los nodos que Payload no sabe dibujar.
 *
 * Sumar un formato nuevo son dos pasos: definirlo en src/blocks y agregarle su
 * entrada en `blocks` de abajo.
 */

/**
 * Lo que recibe cada convertidor de bloque. `fields` es el bloque tal cual se
 * guardo: los mismos campos que declara src/blocks, mas `blockType`.
 */
type ArgsDeBloque = { node: { fields: Record<string, any> } }

const urlDeMedia = (media: unknown): string | undefined =>
  typeof media === 'object' && media !== null ? (media as { url?: string }).url : undefined

/**
 * Parte el texto pegado desde una planilla en filas y celdas.
 *
 * El separador es TAB, que es lo que ponen Excel y Google Sheets al copiar. Si
 * no hay ninguno, se prueba con `|`, que es como se escribe una tabla a mano.
 *
 * La coma queda descartada a proposito: en este proyecto los numeros se
 * escriben con coma decimal ("66,7%") y partiria las celdas al medio.
 */
const filasDeTabla = (datos: string): string[][] => {
  const lineas = datos
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((linea) => linea.trim() !== '')

  if (lineas.length === 0) return []

  const separador = lineas.some((linea) => linea.includes('\t')) ? '\t' : '|'

  const filas = lineas.map((linea) => {
    const celdas = linea.split(separador).map((celda) => celda.trim())
    // "| a | b |" deja una celda vacia en cada punta.
    if (separador === '|') {
      if (celdas[0] === '') celdas.shift()
      if (celdas[celdas.length - 1] === '') celdas.pop()
    }
    return celdas
  })

  // Rectangular: si a una fila le faltan celdas, se completan vacias, para que
  // los encabezados no se desalineen del cuerpo.
  const ancho = Math.max(...filas.map((fila) => fila.length))
  return filas.map((fila) => [...fila, ...Array(ancho - fila.length).fill('')])
}

/**
 * Cierra cualquier `</script>` que venga en el contenido para que no corte el
 * bloque que lo envuelve. Sin esto, el texto del autor puede salirse de la
 * etiqueta y escribir markup suelto en el documento del marco.
 */
const neutralizarCierres = (codigo: string): string => codigo.replace(/<\/script/gi, '<\\/script')

/**
 * Serializa el JSON-LD para meterlo dentro de un `<script>` de la pagina.
 *
 * `JSON.stringify` no escapa `<`: una respuesta de FAQ que diga
 * `</script><script>...` cierra la etiqueta y lo que sigue se ejecuta en la
 * entrada, con el mismo origen que el panel. Cualquier cuenta que edite
 * entradas —la de autor incluida— podria correr codigo con la sesion de quien
 * la abra, un admin entre ellos. Con el `<` escrito como su escape unicode
 * sigue siendo el mismo JSON para Google, pero ya no puede cerrar nada.
 *
 * U+2028 y U+2029 van por lo mismo: son validos en JSON y no en todos los
 * parsers de JavaScript.
 */
const jsonLdSeguro = (dato: unknown): string =>
  JSON.stringify(dato)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

/**
 * Arma el documento que va a vivir dentro del marco.
 *
 * Un HTML completo se usa tal cual: si el equipo pego `<html>` con su `<head>`,
 * sus fuentes y su `<style>`, lo que quiere es esa pagina, no un fragmento
 * suelto. Un fragmento se envuelve para que igual sea un documento valido.
 */
const documentoAislado = (lenguaje: string, codigo: string): string => {
  const cabecera = '<!doctype html><meta charset="utf-8">'

  if (lenguaje === 'css') {
    return `${cabecera}<style>${codigo}</style>`
  }

  if (lenguaje === 'js') {
    return `${cabecera}<script>${neutralizarCierres(codigo)}</script>`
  }

  return /<html[\s>]/i.test(codigo) ? codigo : `${cabecera}${codigo}`
}

/**
 * `sandbox` sin `allow-same-origin` le da al marco un origen opaco: aunque el
 * contenido traiga un `<script>`, no puede leer el DOM de la entrada, ni las
 * cookies, ni el localStorage del sitio.
 *
 * Los scripts solo se habilitan cuando el bloque es de tipo JavaScript. Un
 * bloque de HTML o CSS no ejecuta nada, ni siquiera si le pegan un `<script>`
 * adentro.
 *
 * `allow-same-origin` junto a `allow-scripts` anula el sandbox entero y le
 * devuelve al script acceso a todo. No agregar esa combinacion.
 */
const permisosDelMarco = (lenguaje: string): string => {
  const base = 'allow-popups allow-popups-to-escape-sandbox'
  return lenguaje === 'js' ? `allow-scripts ${base}` : base
}

/**
 * Los cuatro tipos de aviso se resuelven con el naranja mas iconografia y
 * texto, no con verdes ni rojos: el sistema no incorpora colores ajenos, ni
 * siquiera para estados (§2.3.4). Lo que cambia entre un consejo y una
 * advertencia es el rotulo y el icono, no la paleta.
 *
 * La caja la dibuja la molecula `AvisoEnLinea`, que comparte con la ficha de
 * una promocion vencida. Aca solo vive el mapa de tipo a rotulo, que es lo
 * unico propio del editor.
 */
const AVISOS: Record<string, { rotulo: string; alerta: boolean }> = {
  info: { rotulo: 'Información', alerta: false },
  consejo: { rotulo: 'Consejo', alerta: false },
  atencion: { rotulo: 'Atención', alerta: true },
  'juego-responsable': { rotulo: 'Juego responsable', alerta: true },
}

const convertidores: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,

  /**
   * La tabla nativa del editor. Payload ya trae un convertidor, pero le pone
   * los bordes y el relleno como estilos en linea, y un estilo en linea le
   * gana a cualquier regla del sitio. Redefinirlo es lo que hace que las dos
   * tablas (esta y la del bloque `tabla`) se vean igual.
   */
  table: ({ node, nodesToJSX }: any) => (
    <div className="tabla-scroll">
      <table>
        <tbody>{nodesToJSX({ nodes: node.children })}</tbody>
      </table>
    </div>
  ),

  tablerow: ({ node, nodesToJSX }: any) => <tr>{nodesToJSX({ nodes: node.children })}</tr>,

  tablecell: ({ node, nodesToJSX }: any) => {
    const hijos = nodesToJSX({ nodes: node.children })
    // `headerState` es 0 en una celda comun y mayor en las de encabezado.
    return node.headerState > 0 ? (
      <th
        colSpan={node.colSpan > 1 ? node.colSpan : undefined}
        rowSpan={node.rowSpan > 1 ? node.rowSpan : undefined}
      >
        {hijos}
      </th>
    ) : (
      <td
        colSpan={node.colSpan > 1 ? node.colSpan : undefined}
        rowSpan={node.rowSpan > 1 ? node.rowSpan : undefined}
      >
        {hijos}
      </td>
    )
  },

  blocks: {
    aviso: ({ node }: ArgsDeBloque) => {
      const { tipo, texto } = node.fields as Record<string, any>
      const { alerta, rotulo } = AVISOS[tipo] ?? AVISOS.info

      return (
        <AvisoEnLinea alerta={alerta} className="my-8" rotulo={rotulo}>
          <RichText data={texto} />
        </AvisoEnLinea>
      )
    },

    imagen: ({ node }: ArgsDeBloque) => {
      const { imagen, epigrafe, ancho } = node.fields as Record<string, any>
      const url = urlDeMedia(imagen)
      if (!url) return null

      return (
        // El ancho es una decision editorial que se toma en el panel: una foto
        // marcada como completa se sale de la columna hasta el contenedor.
        <figure className={ancho === 'completo' ? 'ancho-completo' : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={imagen?.alt ?? ''} src={url} />
          {epigrafe ? <figcaption>{epigrafe}</figcaption> : null}
        </figure>
      )
    },

    faq: ({ node }: ArgsDeBloque) => {
      const { titulo, preguntas } = node.fields as Record<string, any>
      const lista: Array<{ pregunta: string; respuesta: string }> = preguntas ?? []
      if (lista.length === 0) return null

      // Schema FAQPage: es lo que habilita el resultado enriquecido en Google.
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: lista.map((p) => ({
          '@type': 'Question',
          name: p.pregunta,
          acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
        })),
      }

      return (
        <section className="my-8">
          {titulo ? <h2>{titulo}</h2> : null}

          {/*
           * Cada pregunta es una fila separada por hairline, no una tarjeta:
           * una pila de cajas dentro de la columna de lectura es exactamente
           * el ruido que el sistema saca. La flecha gira 90 grados al abrir.
           */}
          <div className="border-t border-hairline">
            {lista.map((p, j) => (
              <details className="group border-b border-hairline" key={j}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-cuerpo font-semibold text-tinta transition-colors duration-150 ease-marca hover:text-accion">
                  {p.pregunta}
                  <IconoChevron className="size-5 shrink-0 transition-transform duration-150 ease-marca group-open:rotate-90" />
                </summary>
                <p className="pb-4">{p.respuesta}</p>
              </details>
            ))}
          </div>

          <script
            dangerouslySetInnerHTML={{ __html: jsonLdSeguro(jsonLd) }}
            type="application/ld+json"
          />
        </section>
      )
    },

    tabla: ({ node }: ArgsDeBloque) => {
      const { titulo, datos, conEncabezado } = node.fields as Record<string, any>
      const filas = filasDeTabla(typeof datos === 'string' ? datos : '')
      if (filas.length === 0) return null

      const hayEncabezado = conEncabezado !== false
      const encabezado = hayEncabezado ? filas[0] : null
      const cuerpo = hayEncabezado ? filas.slice(1) : filas

      return (
        // La tabla usa la columna entera, no los 68ch del texto corrido.
        <section className="max-w-none">
          {titulo ? <h2>{titulo}</h2> : null}
          <div className="tabla-scroll">
            <table>
              {encabezado ? (
                <thead>
                  <tr>
                    {encabezado.map((celda, j) => (
                      <th key={j}>{celda}</th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {cuerpo.map((fila, j) => (
                  <tr key={j}>
                    {fila.map((celda, k) => (
                      <td key={k}>{celda}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )
    },

    codigo: ({ node }: ArgsDeBloque) => {
      const { lenguaje, archivo, altura, codigo } = node.fields as Record<string, any>
      if (typeof codigo !== 'string' || codigo.trim() === '') return null

      const tipo = lenguaje ?? 'html'
      const alto = typeof altura === 'number' && altura > 0 ? altura : 400

      return (
        // El marco no lleva fondo propio: el documento de adentro trae el suyo,
        // y usa la columna entera porque lo incrustado suele necesitarla.
        <figure className="my-8 max-w-none overflow-hidden rounded-caja border border-hairline">
          {archivo ? (
            <figcaption className="mt-0 border-b border-hairline bg-superficie px-4 py-2 font-mono text-meta text-apagado">
              {archivo}
            </figcaption>
          ) : null}
          <iframe
            className="block w-full border-0"
            loading="lazy"
            sandbox={permisosDelMarco(tipo)}
            srcDoc={documentoAislado(tipo, codigo)}
            style={{ height: `${alto}px` }}
            title={archivo || 'Contenido incrustado'}
          />
        </figure>
      )
    },

    cta: ({ node }: ArgsDeBloque) => {
      const { titulo, texto, url, etiquetaBoton } = node.fields as Record<string, any>
      return (
        // `max-w-none` para que el bloque ocupe la columna entera y no los
        // 68ch que `.prosa` le pone al texto corrido.
        <div className="my-12 max-w-none">
          <BloqueCta
            etiqueta={etiquetaBoton}
            href={url}
            // El enlace apunta a la plataforma que comercializa el bono.
            rel="nofollow sponsored noopener"
            target="_blank"
            titulo={titulo}
          >
            {texto}
          </BloqueCta>
        </div>
      )
    },
  },
})

export interface ContenidoProps {
  /**
   * El documento Lexical tal cual sale de Payload. Va como `unknown` a
   * proposito: el tipo generado describe la raiz pero no los nodos de los
   * bloques propios, asi que tiparlo mas fino seria una promesa que el tipo no
   * puede cumplir.
   */
  data: unknown
}

export function Contenido({ data }: ContenidoProps) {
  if (!data) return null
  return (
    <div className="prosa">
      <RichText converters={convertidores} data={data as never} />
    </div>
  )
}
