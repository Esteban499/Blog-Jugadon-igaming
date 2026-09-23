/**
 * Datos estructurados (JSON-LD) para buscadores. No dibuja nada.
 *
 * Es un atomo porque es la unica forma en que el sitio escribe un
 * `<script type="application/ld+json">`: la escapada de abajo es una defensa,
 * y una defensa copiada en cada lugar que la necesita es una que alguna copia
 * se olvida.
 */

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

export interface DatosEstructuradosProps {
  /** El objeto de schema.org, con su `@context`. */
  dato: unknown
}

export function DatosEstructurados({ dato }: DatosEstructuradosProps) {
  return (
    <script dangerouslySetInnerHTML={{ __html: jsonLdSeguro(dato) }} type="application/ld+json" />
  )
}
