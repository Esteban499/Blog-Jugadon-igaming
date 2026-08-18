import { Boton } from '@/components/atoms/Boton'

/**
 * Cuerpo del 404, compartido por los dos lugares desde donde puede aparecer:
 * `not-found.tsx` (cuando una nota o promocion no existe y la ruta llama a
 * `notFound()`) y `global-not-found.tsx` (cuando la URL no coincide con
 * ninguna ruta del sitio).
 */
export function NoEncontrada() {
  return (
    <div className="contenedor ritmo">
      <p className="font-util text-eyebrow text-apagado uppercase">Error 404</p>

      <h1 className="mt-5 max-w-[16ch] font-display text-h1 text-tinta text-balance">
        Esta página no existe
      </h1>

      <p className="mt-6 max-w-[60ch] text-bajada text-parrafo text-pretty">
        Puede que la dirección esté mal escrita, o que la nota que buscabas haya cambiado de
        lugar.
      </p>

      {/* El unico naranja de la vista: por eso el eyebrow va en secundario y
          no en el naranja que le corresponderia en una card. */}
      <div className="mt-10 flex flex-wrap gap-4">
        <Boton href="/" variante="primaria">
          Volver al inicio
        </Boton>
        <Boton href="/blog" variante="terciaria">
          Ver las noticias
        </Boton>
      </div>
    </div>
  )
}
