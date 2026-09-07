import { getPayload } from 'payload'
import config from '@payload-config'

import { EstadoVacio } from '@/components/molecules'
import {
  CarruselDeProveedores,
  NoticiasDestacadas,
  ShortsDeYoutube,
  UltimosGanadores,
  VideoHero,
} from '@/components/organisms'
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
    <>
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

      {/*
       * Las tres van afuera de la plantilla y no adentro: `PlantillaDePortada`
       * arma el solapamiento de las noticias con el video anclado, y ni los
       * ganadores, ni los shorts, ni la cinta de proveedores participan de esa
       * cuenta. La separacion entre secciones la pone el `pb` de cada una, que
       * es el ritmo del sistema.
       *
       * El orden de las tres es el de cuanto pesa lo que muestran, y baja. Los
       * ultimos ganadores van primero: es contenido de plataforma y no
       * editorial, asi que no puede competir con las notas, pero es dato vivo y
       * con premios reales. Despues los shorts, que son contenido propio con
       * cara y voz pero no dejan de ser piezas de marca. Y al final la cinta de
       * logos, que es la firma de respaldo con la que cierra la portada.
       *
       * A diferencia de todo lo de arriba, los ganadores traen sus datos desde
       * el cliente: la home es estatica con revalidacion horaria y los premios
       * se renuevan cada minuto. Los shorts no necesitan eso —el canal publica
       * algunos por semana— y por eso se resuelven en el servidor, dentro de
       * este mismo render. Ver `UltimosGanadores` y `ShortsDeYoutube`.
       */}
      <UltimosGanadores />

      <ShortsDeYoutube />

      <CarruselDeProveedores />
    </>
  )
}
