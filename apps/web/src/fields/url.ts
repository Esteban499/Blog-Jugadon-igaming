import type { TextFieldSingleValidation } from 'payload'
import { DOMINIO_DE_PLATAFORMAS, esUrlDePlataforma } from '../utilidades/jurisdicciones'

/**
 * Validaciones para los campos de texto que terminan en un `href` o en un
 * `fetch` del servidor.
 *
 * Sin esto el campo acepta cualquier cosa, `javascript:` y `data:` incluidos, y
 * lo que se carga ahi sale tal cual en un enlace del sitio publico. React 19 ya
 * bloquea `javascript:` al dibujar, pero que el dato no entre es mejor que
 * confiar en que alguien lo frene a la salida.
 *
 * Como toda validacion propia, reemplaza a la de Payload: por eso cada una se
 * ocupa tambien de `required`.
 */

const vacio = (valor: unknown): boolean => typeof valor !== 'string' || valor.trim() === ''

/**
 * Una direccion http(s) completa. Con `relativa`, tambien una ruta del propio
 * sitio (`/promociones`).
 *
 * `//` y `/\` no cuentan como rutas: el navegador los lee como "otro host", y
 * `/\ejemplo.com` lleva afuera del sitio aunque empiece con barra.
 */
export const validarUrl =
  ({ relativa = false }: { relativa?: boolean } = {}): TextFieldSingleValidation =>
  (valor, { required }) => {
    if (vacio(valor)) return required ? 'Este campo es obligatorio.' : true
    const texto = String(valor).trim()

    if (relativa && texto.startsWith('/') && !/^\/[/\\]/.test(texto)) return true

    try {
      const url = new URL(texto)
      if (url.protocol === 'https:' || url.protocol === 'http:') return true
    } catch {
      // cae al mensaje de abajo
    }

    return relativa
      ? 'Tiene que ser una dirección completa (https://…) o una ruta del sitio que empiece con /.'
      : 'Tiene que ser una dirección completa, que empiece con https://.'
  }

/** Una direccion de una plataforma de Jugadon. Ver `esUrlDePlataforma`. */
export const validarUrlDePlataforma: TextFieldSingleValidation = (valor, { required }) => {
  if (vacio(valor)) return required ? 'Este campo es obligatorio.' : true
  return esUrlDePlataforma(String(valor).trim())
    ? true
    : `Tiene que ser una dirección https de ${DOMINIO_DE_PLATAFORMAS}, sin puerto ni parámetros.`
}
