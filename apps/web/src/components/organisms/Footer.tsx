import Image from 'next/image'
import Link from 'next/link'

import { LogoJugadon } from '@/components/atoms/marca/LogoJugadon'

import { SECCIONES } from './secciones'

/**
 * Los perfiles todavia no estan definidos: el prototipo trae los iconos pero
 * no las URLs. Con `href: null` el icono se dibuja apagado y sin enlace, en
 * vez de apuntar a `#` y no llevar a ningun lado.
 */
const REDES: readonly { nombre: string; icono: string; href: string | null }[] = [
  { nombre: 'Facebook', icono: '/redes/facebook.svg', href: null },
  { nombre: 'Instagram', icono: '/redes/instagram.svg', href: null },
  { nombre: 'Twitter', icono: '/redes/twitter.svg', href: null },
  { nombre: 'Youtube', icono: '/redes/youtube.svg', href: null },
  { nombre: 'TikTok', icono: '/redes/tiktok.svg', href: null },
]

/**
 * Cada logo se exporto con 150 de ancho y su propio alto: son proporciones
 * distintas, asi que un tamano unico para todos los deformaria. Cada uno vive
 * en una caja de la misma medida y se acomoda adentro.
 */
const LOTERIAS = [
  { nombre: 'AJALAR', imagen: '/loterias/ajalar.png', ancho: 150, alto: 168 },
  { nombre: 'Lotería de San Luis', imagen: '/loterias/san-luis.png', ancho: 150, alto: 72 },
  { nombre: 'Lotería de Córdoba', imagen: '/loterias/cordoba.png', ancho: 150, alto: 42 },
  { nombre: 'Lotería de la Ciudad', imagen: '/loterias/ciudad.png', ancho: 150, alto: 64 },
  { nombre: 'Lotería de Santa Fe', imagen: '/loterias/santa-fe.png', ancho: 150, alto: 45 },
  {
    nombre: 'Publicidad responsable — A.L.E.A.',
    imagen: '/loterias/alea.png',
    ancho: 150,
    alto: 150,
  },
] as const

/**
 * `brightness-0 invert` aplana cualquier logo a blanco puro, y la opacidad lo
 * baja a un gris. Es lo que pide el manual: los logos de reguladores van en
 * blanco o gris plano, nunca coloreados con la paleta ni sobre fondos de
 * color (§5.9).
 */
const PLANO = 'brightness-0 invert'

export function Footer() {
  return (
    /*
     * Fondo de superficie y mucho aire (§5.9). Va a sangre y solo el contenido
     * se acota: en pantallas anchas un recuadro flotando se leeria como una
     * caja suelta.
     */
    <footer className="bg-superficie">
      <div className="contenedor py-16 md:py-24">
        {/* Marca de un lado, redes del otro. Se apila centrado mientras no
            entre en una linea. */}
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <LogoJugadon alto={43} ancho={150} />

          <div className="flex items-center gap-4">
            <p className="font-util text-legal text-apagado uppercase">Seguinos en</p>
            <ul className="flex items-center gap-1">
              {REDES.map((red) => {
                const icono = (
                  <Image
                    alt=""
                    className={PLANO}
                    height={20}
                    src={red.icono}
                    style={{ height: 20, width: 20 }}
                    unoptimized
                    width={20}
                  />
                )

                return (
                  <li key={red.nombre}>
                    {red.href === null ? (
                      <span
                        aria-disabled
                        aria-label={`${red.nombre} — cuenta todavía sin definir`}
                        className="flex size-11 cursor-not-allowed items-center justify-center opacity-40"
                        role="img"
                        title="Cuenta todavía sin definir"
                      >
                        {icono}
                      </span>
                    ) : (
                      <a
                        aria-label={red.nombre}
                        className="flex size-11 items-center justify-center opacity-60 transition-opacity duration-150 ease-marca hover:opacity-100"
                        href={red.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {icono}
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <nav aria-label="Secciones" className="mt-12">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:justify-start">
            {SECCIONES.map((seccion) => (
              <li key={seccion.etiqueta}>
                {seccion.href === null ? (
                  <span
                    aria-disabled
                    className="font-util text-menu text-apagado uppercase"
                    title="Sección en preparación"
                  >
                    {seccion.etiqueta}
                  </span>
                ) : (
                  <Link
                    className="font-util text-menu text-parrafo uppercase transition-colors duration-150 ease-marca hover:text-tinta"
                    href={seccion.href}
                  >
                    {seccion.etiqueta}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/*
       * Franja legal, separada por hairline (§5.9). Sello +18, logos de los
       * reguladores provinciales y el texto de juego responsable, todo en la
       * utilitaria a 12px en el nivel secundario.
       */}
      <div className="border-t border-hairline">
        <div className="contenedor flex flex-col items-center gap-8 py-10 md:flex-row md:items-center md:gap-12">
          {/*
           * El sello es tipografico: no hay un archivo de marca para el +18 y
           * dibujar uno seria inventar un simbolo. Pildora, que es la segunda
           * forma del sistema.
           */}
          <span className="flex h-11 shrink-0 items-center rounded-full border border-contorno px-5 font-util text-menu text-tinta uppercase">
            +18
          </span>

          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
            {LOTERIAS.map((loteria) => (
              <li className="flex h-10 w-[100px] items-center justify-center" key={loteria.nombre}>
                {/*
                 * `h-auto w-auto` en las dos: el reset de Tailwind fija
                 * `height: auto` y, si solo una queda en automatico,
                 * `next/image` avisa de que la relacion de aspecto no cierra.
                 */}
                <Image
                  alt={loteria.nombre}
                  className={`h-auto max-h-full w-auto max-w-full object-contain opacity-60 ${PLANO}`}
                  height={loteria.alto}
                  src={loteria.imagen}
                  width={loteria.ancho}
                />
              </li>
            ))}
          </ul>

          <p className="max-w-[46ch] text-center font-util text-legal text-apagado md:ml-auto md:text-right">
            Contenido informativo sobre juego. Solo para mayores de 18 años. El juego compulsivo
            es perjudicial para la salud. Jugá de forma responsable.
          </p>
        </div>
      </div>
    </footer>
  )
}
