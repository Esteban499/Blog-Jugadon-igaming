import { Esqueleto } from '@/components/atoms/Esqueleto'

/**
 * Lo que se ve mientras una pagina de lectura busca sus datos.
 *
 * El hero es opcional por el mismo motivo que en `PlantillaDeArticulo`: la nota
 * abre con su portada a sangre y la ficha de una promocion arranca directo en
 * la columna. Reservar el alto del hero cuando no va lo unico que lograria es
 * que la pagina saltara al llegar.
 */

export interface PlantillaDeArticuloCargandoProps {
  conHero?: boolean
}

export function PlantillaDeArticuloCargando({
  conHero = false,
}: PlantillaDeArticuloCargandoProps) {
  return (
    <div>
      {conHero ? (
        <div className="degradado-profundo -mt-[var(--alto-barra)] flex min-h-[min(70dvh,640px)] flex-col justify-end pt-[var(--alto-barra)]">
          <div className="contenedor pt-16 pb-12 md:pb-16">
            <Esqueleto className="h-3 w-24 rounded-full" />
            <Esqueleto className="mt-5 h-10 w-[18ch] max-w-full rounded-caja md:h-14" />
            <Esqueleto className="mt-6 h-4 w-[50ch] max-w-full rounded-full" />
          </div>
        </div>
      ) : null}

      <div className="columna py-16 md:py-24">
        {!conHero ? (
          <>
            <Esqueleto className="h-3 w-40 rounded-full" />
            <Esqueleto className="mt-5 h-10 w-[18ch] max-w-full rounded-caja md:h-14" />
          </>
        ) : null}

        {/* Ocho lineas de texto corrido: la ultima corta, como corta un parrafo. */}
        <div className={`flex flex-col gap-4 ${conHero ? '' : 'mt-10'}`.trim()}>
          {Array.from({ length: 8 }, (_, i) => (
            <Esqueleto className={`h-4 rounded-full ${i === 7 ? 'w-2/5' : 'w-full'}`} key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
