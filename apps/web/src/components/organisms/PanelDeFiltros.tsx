'use client'

import { useEffect, useId, useRef, useState } from 'react'

/*
 * Imports a archivo y no al barril de `atoms` ni al de `molecules`: este
 * componente es cliente, y en App Router importar un barril desde el lado
 * cliente arrastra al bundle todo lo que ese barril toca. Es la regla que
 * documenta `atoms/index.ts`.
 */
import { Boton } from '@/components/atoms/Boton'
import { IconoCerrar } from '@/components/atoms/iconos/IconoCerrar'
import { IconoFiltros } from '@/components/atoms/iconos/IconoFiltros'
import { clasesDeTag, Tag } from '@/components/atoms/Tag'
import type { OpcionDeFiltro } from '@/components/molecules/FilaDeFiltros'

/**
 * El boton "Filtros" y el panel que abre.
 *
 * Con cinco plataformas, siete tipos de bono y cinco verticales, mostrar las
 * tres filas a la vez son diecisiete chips arriba de la grilla: mas superficie
 * de decision que resultados. Afuera queda la unica pregunta que el visitante
 * ya trae contestada —en que provincia juega— y el resto entra aca.
 *
 * Las opciones siguen siendo enlaces, no controles de formulario: cada
 * combinacion es una URL propia y el filtro se aplica al tocarlo, sin "aplicar"
 * que confirmar. Por eso el panel no se cierra solo al elegir: se puede sumar
 * tipo y vertical de un saque, viendo el contador del boton cambiar detras.
 *
 * Lo unico que necesita JavaScript es abrirlo y cerrarlo. Sin JS el panel no
 * abre, pero las URLs con `?tipo=` o `?vertical=` puestas a mano siguen
 * filtrando igual, que es lo que sostiene que esto sea navegable.
 */

export interface GrupoDeFiltros {
  /** "Tipo de bono", "Dónde se usa". */
  etiqueta: string
  opciones: readonly OpcionDeFiltro[]
}

export interface PanelDeFiltrosProps {
  grupos: readonly GrupoDeFiltros[]
  /** La misma pantalla sin ninguno de estos filtros, conservando la plataforma. */
  hrefLimpiar: string
}

export function PanelDeFiltros({ grupos, hrefLimpiar }: PanelDeFiltrosProps) {
  const [abierto, setAbierto] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const idPanel = useId()
  const idTitulo = useId()

  const activos = grupos.reduce(
    (total, grupo) => total + grupo.opciones.filter((opcion) => opcion.activa).length,
    0,
  )

  useEffect(() => {
    if (!abierto) return

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false)
    }

    /*
     * El panel tapa la pantalla: sin esto el fondo sigue scrolleando debajo y,
     * en telefono, el gesto se lo lleva la pagina en lugar de la lista.
     */
    const desbordeAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', alTeclear)

    // El foco entra al panel para que Escape y el tabulado empiecen adentro.
    panel.current?.focus()

    return () => {
      document.body.style.overflow = desbordeAnterior
      window.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  /*
   * El boton toma la geometria del chip con el que comparte fila, y su estado
   * seleccionado cuando hay algo puesto adentro: es lo que hace que "hay filtros
   * aplicados que no estas viendo" se lea de lejos, sin leer el contador.
   */
  const clasesDelBoton = `${clasesDeTag({ seleccionado: activos > 0 })} cursor-pointer gap-2`

  return (
    <>
      <button
        aria-controls={abierto ? idPanel : undefined}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className={clasesDelBoton}
        onClick={() => setAbierto(true)}
        type="button"
      >
        <IconoFiltros className="size-3.5" />
        Filtros
        {activos > 0 ? <span aria-label={`${activos} aplicados`}>·&nbsp;{activos}</span> : null}
      </button>

      {abierto ? (
        <div
          aria-labelledby={idTitulo}
          aria-modal
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
          id={idPanel}
          role="dialog"
        >
          {/* El velo tambien cierra. Es un boton y no un div con `onClick`
              para que exista para el teclado y para el lector de pantalla. */}
          <button
            aria-label="Cerrar filtros"
            className="absolute inset-0 cursor-default bg-fondo/85 backdrop-blur-md"
            onClick={() => setAbierto(false)}
            tabIndex={-1}
            type="button"
          />

          <div
            className="relative flex max-h-[90dvh] w-full flex-col border border-hairline bg-superficie md:max-h-[80dvh] md:max-w-[560px] md:rounded-caja"
            ref={panel}
            tabIndex={-1}
          >
            <header className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-4 md:px-6">
              <h2 className="font-util text-menu text-tinta uppercase" id={idTitulo}>
                Filtros
              </h2>

              <button
                aria-label="Cerrar filtros"
                className="-mr-2 cursor-pointer p-2 text-parrafo transition-colors duration-150 ease-marca hover:text-tinta"
                onClick={() => setAbierto(false)}
                type="button"
              >
                <IconoCerrar className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
              <div className="flex flex-col gap-6">
                {grupos.map((grupo) => (
                  <div key={grupo.etiqueta}>
                    <p className="font-util text-meta text-apagado uppercase">{grupo.etiqueta}</p>

                    <ul className="mt-3 flex flex-wrap gap-3">
                      {grupo.opciones.map((opcion) => (
                        <li key={opcion.clave}>
                          <Tag href={opcion.href} seleccionado={opcion.activa}>
                            {opcion.nombre}
                          </Tag>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <footer className="flex items-center justify-between gap-4 border-t border-hairline px-4 py-4 md:px-6">
              {/* Sin nada elegido no hay nada que limpiar: el enlace apunta a
                  la pantalla en la que ya se esta. */}
              {activos > 0 ? (
                <Tag href={hrefLimpiar}>Limpiar</Tag>
              ) : (
                <span className="font-util text-meta text-apagado uppercase">Sin filtros</span>
              )}

              {/* No aplica nada: los filtros ya se aplicaron al tocarlos. Solo
                  saca el panel del medio para ver lo que quedo debajo. */}
              <Boton onClick={() => setAbierto(false)} variante="primaria">
                Ver promociones
              </Boton>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}
