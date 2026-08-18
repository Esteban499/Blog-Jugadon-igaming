import { getPayload } from 'payload'
import config from '@payload-config'

import { EstadoVacio } from '@/components/molecules'
import { NoticiasDestacadas, VideoHero } from '@/components/organisms'
import { PlantillaDePortada } from '@/components/templates'

// ISR: la portada se sirve estatica y se regenera sola. Ademas el hook
// afterChange de Posts la revalida al instante cuando marketing publica.
export const revalidate = 3600

export default async function HomePage() {
  const payload = await getPayload({ config })

  const { docs: entradas } = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: 12,
    // `destacado` promete en el panel que la entrada "aparece primero en la
    // portada": este orden es lo que hace que esa promesa se cumpla, y ademas
    // es lo que decide cuales salen en tarjeta ancha.
    sort: ['-destacado', '-publicadoEn'],
    where: { _status: { equals: 'published' } },
  })

  return (
    <PlantillaDePortada portada={<VideoHero />} tituloDeSeccion="Últimas noticias">
      {entradas.length === 0 ? (
        <div className="contenedor pt-10">
          <EstadoVacio>
            <p>
              Todavía no hay entradas publicadas. Cargá contenido de prueba con{' '}
              <code className="font-mono">pnpm seed</code>, o creá una entrada desde el{' '}
              <a
                className="text-enlace underline decoration-1 underline-offset-[3px] transition-colors duration-150 ease-marca hover:text-accion"
                href="/admin"
              >
                panel
              </a>
              .
            </p>
          </EstadoVacio>
        </div>
      ) : (
        <NoticiasDestacadas entradas={entradas} hrefVerTodas="/blog" />
      )}
    </PlantillaDePortada>
  )
}
