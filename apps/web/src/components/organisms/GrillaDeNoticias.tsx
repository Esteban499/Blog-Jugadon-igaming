import { TarjetaNoticia } from '@/components/molecules/TarjetaNoticia'
import type { Category, Media, Post } from '@/payload-types'
import { relacion } from '@/utilidades/payload'
import { tiempoDeLectura } from '@/utilidades/texto'

/**
 * La grilla de tarjetas de los listados de notas.
 *
 * Grilla de listado (§4.3): 1 columna en movil, 2 desde 768px, 3 desde 1024px,
 * con gap de 24px.
 *
 * Es el organismo el que traduce el documento de Payload a las props de la
 * molecula —desenvolver la portada, resolver la categoria, calcular los
 * minutos—. Esa traduccion estaba escrita dentro del `map` de cada pagina, y es
 * la razon por la que las paginas tenian `entrada: any`: el tipo generado
 * existe, pero nadie lo estaba usando.
 */

export interface GrillaDeNoticiasProps {
  entradas: Post[]
  /**
   * Cuantas tarjetas del principio llevan `priority`. En el listado son las
   * tres de la primera fila; en la portada, ninguna, porque el LCP es el video.
   */
  prioritarias?: number
}

export function GrillaDeNoticias({ entradas, prioritarias = 0 }: GrillaDeNoticiasProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {entradas.map((entrada, indice) => {
        const portada = relacion<Media>(entrada.portada)
        const categoria = relacion<Category>(entrada.categoria)

        return (
          <li key={entrada.id}>
            <TarjetaNoticia
              categoria={categoria?.nombre}
              minutos={tiempoDeLectura(entrada.contenido)}
              portadaAlt={portada?.alt}
              portadaUrl={portada?.url}
              prioridad={indice < prioritarias}
              publicadoEn={entrada.publicadoEn}
              slug={entrada.slug ?? ''}
              titulo={entrada.titulo}
            />
          </li>
        )
      })}
    </ul>
  )
}
