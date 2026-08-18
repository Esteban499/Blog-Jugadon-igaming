'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, useConfig } from '@payloadcms/ui'

/**
 * "Leer promociones ahora", arriba del listado de promociones.
 *
 * La corrida programada cubre el dia a dia; esto es para cuando esperarla no
 * sirve. Llama al endpoint, que encola y corre la misma tarea que el cron.
 *
 * Corre en primer plano a proposito, aunque tarde. Encolar y contestar al
 * instante seria mas prolijo de escribir y peor de usar: quien aprieta el boton
 * quiere ver que trajo, y un "se encoló" obliga a recargar a ciegas hasta que
 * aparezca algo. El resultado que se muestra es el mismo texto que el runner
 * deja en cada plataforma, asi que el boton y el panel nunca se contradicen.
 */

type EstadoDePlataforma = {
  nombre: string
  activa: boolean
  resultado: null | string
  corrida: null | string
}

type Respuesta = {
  mensaje?: string
  ok?: boolean
  plataformas?: EstadoDePlataforma[]
}

const estilos = {
  caja: {
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: '4px',
    marginBottom: 'var(--base)',
    padding: 'calc(var(--base) * 0.75)',
  },
  encabezado: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'calc(var(--base) * 0.5)',
    justifyContent: 'space-between',
  },
  ayuda: {
    color: 'var(--theme-elevation-500)',
    margin: 0,
  },
  lista: {
    listStyle: 'none',
    margin: 'calc(var(--base) * 0.75) 0 0',
    padding: 0,
  },
  fila: {
    borderTop: '1px solid var(--theme-elevation-100)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'calc(var(--base) * 0.4)',
    padding: 'calc(var(--base) * 0.3) 0',
  },
  error: {
    color: 'var(--theme-error-500)',
    margin: 'calc(var(--base) * 0.5) 0 0',
  },
} satisfies Record<string, React.CSSProperties>

export const BotonScrapear = () => {
  const { config } = useConfig()
  const router = useRouter()

  const [corriendo, setCorriendo] = useState(false)
  const [respuesta, setRespuesta] = useState<null | Respuesta>(null)

  const correr = async () => {
    setCorriendo(true)
    setRespuesta(null)

    try {
      const peticion = await fetch(
        `${config.serverURL ?? ''}${config.routes.api}/promociones/scrapear-ahora`,
        {
          // La cookie de sesion es lo que autentica: el endpoint pide editor.
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      )

      const cuerpo = (await peticion.json()) as Respuesta
      setRespuesta(cuerpo)

      // El listado se dibuja en el servidor, asi que sin esto lo recien traido
      // no aparece hasta que alguien recargue a mano.
      if (cuerpo.ok) router.refresh()
    } catch (error) {
      setRespuesta({
        ok: false,
        mensaje: error instanceof Error ? error.message : 'No se pudo contactar al servidor.',
      })
    } finally {
      setCorriendo(false)
    }
  }

  return (
    <div style={estilos.caja}>
      <div style={estilos.encabezado}>
        <p style={estilos.ayuda}>
          El bot corre solo todos los días a las 9 de la mañana. Si necesitás las promociones al
          día ahora mismo, corrélo a mano.
        </p>
        <Button buttonStyle="secondary" disabled={corriendo} onClick={correr} size="small">
          {corriendo ? 'Leyendo…' : 'Leer promociones ahora'}
        </Button>
      </div>

      {corriendo ? (
        <p style={estilos.ayuda}>
          Consultando cada plataforma. Puede tardar un rato; no cierres la pestaña.
        </p>
      ) : null}

      {respuesta?.ok === false ? <p style={estilos.error}>{respuesta.mensaje}</p> : null}

      {respuesta?.plataformas?.length ? (
        <ul style={estilos.lista}>
          {respuesta.plataformas.map((p) => (
            <li key={p.nombre} style={estilos.fila}>
              <strong>{p.nombre}</strong>
              <span style={estilos.ayuda}>
                {p.activa ? (p.resultado ?? 'Sin resultado registrado.') : 'Scrapeo desactivado.'}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
