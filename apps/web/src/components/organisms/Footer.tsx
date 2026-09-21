import Image from 'next/image'
import Link from 'next/link'

import { LogoJugadon } from '@/components/atoms/marca/LogoJugadon'

import { SECCIONES } from './secciones'

interface Red {
  nombre: string
  icono: string
  href: string
}

/** Las cuentas nacionales, que van en la fila principal. */
const REDES: readonly Red[] = [
  { nombre: 'X (Twitter)', icono: '/redes/twitter.svg', href: 'https://x.com/jugadon_arg' },
  {
    nombre: 'Instagram',
    icono: '/redes/instagram.svg',
    href: 'https://www.instagram.com/jugadon_arg/',
  },
  { nombre: 'YouTube', icono: '/redes/youtube.svg', href: 'https://www.youtube.com/@jugadon_arg' },
  { nombre: 'TikTok', icono: '/redes/tiktok.svg', href: 'https://www.tiktok.com/@jugadon.ok' },
  {
    nombre: 'Spotify',
    icono: '/redes/spotify.svg',
    href: 'https://open.spotify.com/user/317gntai2wlxn4tdon7du6lisemu',
  },
  { nombre: 'Twitch', icono: '/redes/twitch.svg', href: 'https://www.twitch.tv/jugadon_arg' },
]

/**
 * Las cuentas de cada provincia van aparte y con el nombre al lado: cuatro
 * iconos de Facebook iguales en la misma fila no dicen cual es cual.
 */
const REDES_PROVINCIALES: readonly { provincia: string; redes: readonly Red[] }[] = [
  {
    provincia: 'CABA',
    redes: [
      {
        nombre: 'Instagram',
        icono: '/redes/instagram.svg',
        href: 'https://www.instagram.com/jugadoncaba/',
      },
      {
        nombre: 'Facebook',
        icono: '/redes/facebook.svg',
        href: 'https://www.facebook.com/jugadoncaba/',
      },
    ],
  },
  {
    provincia: 'Córdoba',
    redes: [
      {
        nombre: 'Facebook',
        icono: '/redes/facebook.svg',
        href: 'https://www.facebook.com/jugadoncordoba/',
      },
    ],
  },
  {
    provincia: 'La Rioja',
    redes: [
      {
        nombre: 'Facebook',
        icono: '/redes/facebook.svg',
        href: 'https://www.facebook.com/Jugadonlarioja/',
      },
    ],
  },
  {
    provincia: 'San Luis',
    redes: [
      {
        nombre: 'Facebook',
        icono: '/redes/facebook.svg',
        href: 'https://www.facebook.com/jugadonsl/',
      },
    ],
  },
]

/**
 * Medidas reales de cada PNG, en pixeles. Los archivos estan recortados al
 * dibujo: los originales traian margenes transparentes distintos —el de AJALAR
 * ocupaba la mitad del archivo— que achicaban el logo sin que se notara.
 */
const LOTERIAS = [
  { nombre: 'AJALAR', imagen: '/loterias/ajalar.png', ancho: 121, alto: 136 },
  { nombre: 'Lotería de San Luis', imagen: '/loterias/san-luis.png', ancho: 981, alto: 427 },
  { nombre: 'Lotería de Córdoba', imagen: '/loterias/cordoba.png', ancho: 686, alto: 192 },
  { nombre: 'Lotería de la Ciudad', imagen: '/loterias/ciudad.png', ancho: 1330, alto: 471 },
  { nombre: 'Lotería de Santa Fe', imagen: '/loterias/santa-fe.png', ancho: 882, alto: 236 },
  {
    nombre: 'Publicidad responsable — A.L.E.A.',
    imagen: '/loterias/alea.png',
    ancho: 450,
    alto: 424,
  },
] as const

/**
 * Los logos se igualan por superficie, no por caja. Encajados en una misma
 * caja, los apaisados la llenan a lo ancho y los cuadrados solo a lo alto, asi
 * que AJALAR y A.L.E.A. quedaban en una fraccion del tamano de Cordoba. Con la
 * misma superficie todos pesan parecido; el tope de alto evita que los casi
 * cuadrados se estiren por encima de la fila.
 */
const SUPERFICIE_DE_LOGO = 2600
const ALTO_MAXIMO_DE_LOGO = 48

function medidaDeLogo(ancho: number, alto: number) {
  const proporcion = ancho / alto
  const altoFinal = Math.min(Math.sqrt(SUPERFICIE_DE_LOGO / proporcion), ALTO_MAXIMO_DE_LOGO)
  return { width: Math.round(altoFinal * proporcion), height: Math.round(altoFinal) }
}

/**
 * `brightness-0 invert` aplana cualquier logo a blanco puro, y la opacidad lo
 * baja a un gris. Es lo que pide el manual: los logos de reguladores van en
 * blanco o gris plano, nunca coloreados con la paleta ni sobre fondos de
 * color (§5.9).
 *
 * Por eso los SVG de `/redes/` son un disco con el glifo calado, sin nada
 * debajo: un relleno blanco detras del glifo se aplanaria junto con el disco y
 * el icono quedaria como un circulo liso.
 */
const PLANO = 'brightness-0 invert'

function EnlaceARed({ red, etiqueta }: { red: Red; etiqueta: string }) {
  return (
    <a
      aria-label={etiqueta}
      className="flex size-11 items-center justify-center opacity-60 transition-opacity duration-150 ease-marca hover:opacity-100"
      href={red.href}
      rel="noreferrer"
      target="_blank"
    >
      <Image
        alt=""
        className={PLANO}
        height={20}
        src={red.icono}
        style={{ height: 20, width: 20 }}
        unoptimized
        width={20}
      />
    </a>
  )
}

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

          <div className="flex flex-col items-center gap-3 md:items-end">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:justify-end">
              <p className="font-util text-legal text-apagado uppercase">Seguinos en</p>
              <ul className="flex flex-wrap items-center justify-center gap-1">
                {REDES.map((red) => (
                  <li key={red.nombre}>
                    <EnlaceARed etiqueta={red.nombre} red={red} />
                  </li>
                ))}
              </ul>
            </div>

            <ul
              aria-label="Cuentas por provincia"
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 md:justify-end"
            >
              {REDES_PROVINCIALES.map(({ provincia, redes }) => (
                <li className="flex items-center gap-1" key={provincia}>
                  <span className="font-util text-legal text-apagado uppercase">{provincia}</span>
                  <ul className="flex items-center">
                    {redes.map((red) => (
                      <li key={red.nombre}>
                        <EnlaceARed etiqueta={`${red.nombre} de Jugadón ${provincia}`} red={red} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
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
            {LOTERIAS.map((loteria) => {
              const medida = medidaDeLogo(loteria.ancho, loteria.alto)

              return (
                <li className="flex h-12 items-center" key={loteria.nombre}>
                  {/*
                   * Ancho y alto tambien en `style`: el reset de Tailwind fija
                   * `height: auto` y, si solo una queda en automatico,
                   * `next/image` avisa de que la relacion de aspecto no cierra.
                   */}
                  <Image
                    alt={loteria.nombre}
                    className={`opacity-60 ${PLANO}`}
                    height={medida.height}
                    src={loteria.imagen}
                    style={medida}
                    width={medida.width}
                  />
                </li>
              )
            })}
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
