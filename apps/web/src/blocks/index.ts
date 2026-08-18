import type { Block } from 'payload'

/**
 * Los formatos que se pueden insertar en el cuerpo de una entrada.
 *
 * El cuerpo es un campo `richText`: el texto corriente ya es el documento, y
 * estos bloques se intercalan adentro con el menu `/`. Por eso no hay un bloque
 * de "Texto": seria un parrafo dentro de un documento de parrafos.
 *
 * Sobre localizacion: el campo `contenido` de la entrada esta marcado como
 * `localized`, y con eso alcanza. Todo lo que vive dentro del documento viaja
 * en ese mismo JSON, incluidos estos bloques, asi que sus campos no llevan
 * `localized` propio: adentro de Lexical no tendria efecto.
 */

/**
 * Codigo que se ejecuta, no que se muestra: lo que se carga aca termina
 * renderizado en la entrada.
 *
 * El contenido vive dentro de un marco aislado (un iframe con `sandbox`), y esa
 * no es una decision estetica. Los documentos que se pegan traen reglas
 * globales: `body { background: ... }`, `* { margin: 0 }`, `@media`. Inyectadas
 * en la pagina se aplicarian al sitio entero y romperian el layout de todas las
 * entradas. Encerradas en su propio documento, no salen de la caja.
 *
 * El slug sigue siendo `codigo` a proposito: renombrarlo obligaria a migrar las
 * filas ya cargadas en `posts_blocks_codigo`.
 */
export const CodigoBlock: Block = {
  slug: 'codigo',
  labels: { singular: 'HTML incrustado', plural: 'HTML incrustado' },
  fields: [
    {
      name: 'lenguaje',
      type: 'select',
      label: 'Tipo de código',
      defaultValue: 'html',
      options: [
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
        { label: 'JavaScript', value: 'js' },
      ],
      admin: {
        description:
          'HTML acepta un documento completo, con su <head>, sus fuentes y su <style> adentro.',
      },
    },
    {
      name: 'archivo',
      type: 'text',
      label: 'Rótulo',
      admin: { description: 'Opcional: texto que se muestra arriba del marco.' },
    },
    {
      name: 'altura',
      type: 'number',
      label: 'Alto del marco (px)',
      defaultValue: 400,
      min: 80,
      admin: {
        description:
          'El marco está aislado, así que no puede medir su contenido solo: el alto se fija acá.',
      },
    },
    {
      name: 'codigo',
      type: 'code',
      label: 'Código',
      required: true,
      admin: { language: 'html' },
    },
  ],
}

export const AvisoBlock: Block = {
  slug: 'aviso',
  labels: { singular: 'Aviso', plural: 'Avisos' },
  fields: [
    {
      name: 'tipo',
      type: 'select',
      label: 'Tipo',
      defaultValue: 'info',
      options: [
        { label: 'Información', value: 'info' },
        { label: 'Consejo', value: 'consejo' },
        { label: 'Atención', value: 'atencion' },
        { label: 'Juego responsable', value: 'juego-responsable' },
      ],
    },
    { name: 'texto', type: 'richText', label: 'Texto', required: true, localized: true },
  ],
}

export const ImagenBlock: Block = {
  slug: 'imagen',
  labels: { singular: 'Imagen', plural: 'Imágenes' },
  fields: [
    { name: 'imagen', type: 'upload', label: 'Imagen', relationTo: 'media', required: true },
    { name: 'epigrafe', type: 'text', label: 'Epígrafe', localized: true },
    {
      name: 'ancho',
      type: 'select',
      label: 'Ancho',
      defaultValue: 'contenido',
      options: [
        { label: 'Ancho del texto', value: 'contenido' },
        { label: 'Ancho completo', value: 'completo' },
      ],
    },
  ],
}

/** Alimenta el schema FAQPage, que Google puede mostrar como resultado enriquecido. */
export const FaqBlock: Block = {
  slug: 'faq',
  labels: { singular: 'Preguntas frecuentes', plural: 'Preguntas frecuentes' },
  fields: [
    {
      name: 'titulo',
      type: 'text',
      label: 'Título',
      localized: true,
      defaultValue: 'Preguntas frecuentes',
    },
    {
      name: 'preguntas',
      type: 'array',
      label: 'Preguntas',
      minRows: 1,
      labels: { singular: 'Pregunta', plural: 'Preguntas' },
      fields: [
        { name: 'pregunta', type: 'text', label: 'Pregunta', required: true, localized: true },
        { name: 'respuesta', type: 'textarea', label: 'Respuesta', required: true, localized: true },
      ],
    },
  ],
}

/**
 * Una tabla que se carga pegando, no construyendo.
 *
 * Reemplaza al viejo bloque `comparativa`, que pedia tres arrays anidados:
 * cargar una tabla de 3x3 eran tres columnas, tres filas y nueve celdas de a
 * una, sin nada que mantuviera la cantidad de celdas alineada con la de
 * columnas. Agregar una columna despues obligaba a entrar fila por fila.
 *
 * Aca se pega desde la planilla, que es de donde el dato ya viene.
 *
 * Separador: TAB, que es lo que ponen Excel y Google Sheets al copiar. La coma
 * NO sirve como separador en este proyecto: los numeros se escriben con coma
 * decimal ("66,7%") y partiria las celdas al medio.
 */
export const TablaBlock: Block = {
  slug: 'tabla',
  labels: { singular: 'Tabla', plural: 'Tablas' },
  fields: [
    { name: 'titulo', type: 'text', label: 'Título', localized: true },
    {
      name: 'datos',
      type: 'textarea',
      label: 'Datos',
      required: true,
      localized: true,
      admin: {
        description:
          'Pegá directo desde Excel o Google Sheets. Una fila por línea; las columnas se separan solas. También acepta columnas separadas con "|".',
      },
    },
    {
      name: 'conEncabezado',
      type: 'checkbox',
      label: 'La primera fila es el encabezado',
      defaultValue: true,
    },
  ],
}

export const CtaBlock: Block = {
  slug: 'cta',
  labels: { singular: 'Llamada a la acción', plural: 'Llamadas a la acción' },
  fields: [
    { name: 'titulo', type: 'text', label: 'Título', required: true, localized: true },
    { name: 'texto', type: 'textarea', label: 'Texto', localized: true },
    { name: 'etiquetaBoton', type: 'text', label: 'Etiqueta del botón', required: true, localized: true },
    { name: 'url', type: 'text', label: 'URL', required: true },
  ],
}

/**
 * Lo que ofrece el menu `/` dentro del editor de la entrada.
 *
 * Para tablas hay dos caminos, a proposito: la tabla nativa del editor (`/table`)
 * para armarla a mano celda por celda, y `TablaBlock` para cuando el dato ya
 * existe en una planilla y solo hay que pegarlo.
 */
export const bloquesDelEditor: Block[] = [
  AvisoBlock,
  ImagenBlock,
  FaqBlock,
  TablaBlock,
  CodigoBlock,
  CtaBlock,
]
