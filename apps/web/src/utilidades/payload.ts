/**
 * Desenvolver relaciones de Payload.
 *
 * Un campo de relacion se tipa como `number | Documento`: viene como id cuando
 * la consulta no lo poblo y como documento cuando el `depth` alcanzo. Cada
 * pantalla lo resolvia con su propio `typeof x === 'object' ? x : null`, que es
 * la linea que despues se olvida en un lugar y obliga a un `any` para tapar el
 * error.
 *
 * Devuelve `undefined` y no `null` para que encaje directo con las props
 * opcionales de las moleculas.
 */
export const relacion = <T>(valor: number | T | null | undefined): T | undefined =>
  typeof valor === 'object' && valor !== null ? valor : undefined

/**
 * La URL de un upload de Payload, ya desenvuelto.
 *
 * Un `upload` puede llegar como id, como documento sin `url` (si el adaptador
 * de storage todavia no la resolvio) o como documento completo. Los tres casos
 * terminan en el mismo lugar: sin imagen se dibuja `SinPortada`.
 */
export const urlDeUpload = (
  valor: number | { url?: string | null } | null | undefined,
): string | undefined => relacion(valor)?.url ?? undefined
