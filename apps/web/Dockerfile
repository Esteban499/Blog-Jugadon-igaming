# syntax=docker/dockerfile:1.10
#
# Imagen de produccion: sitio y panel en un solo proceso (Next.js + Payload).
#
# No se construye a mano: la arma `deploy/desplegar.sh` a traves de
# `deploy/docker-compose.prod.yml`, que le pasa los secretos del build. Ver
# "Produccion en una VM" en el README.

ARG NODE_VERSION=24-alpine
ARG PNPM_VERSION=11.24.0

# ---- Dependencias ----
FROM node:${NODE_VERSION} AS deps
ARG PNPM_VERSION
WORKDIR /app
RUN npm install -g pnpm@${PNPM_VERSION}
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Build ----
FROM node:${NODE_VERSION} AS builder
ARG PNPM_VERSION
WORKDIR /app
RUN npm install -g pnpm@${PNPM_VERSION}
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Las `NEXT_PUBLIC_*` se escriben dentro del JavaScript que baja el navegador,
# asi que tienen que estar al compilar. No son secretas: son URLs publicas.
# `YOUTUBE_CANAL_ID` tampoco, y hace falta porque la portada se prerenderiza aca.
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_MAPA_TILES_URL
ARG NEXT_PUBLIC_MAPA_GLIFOS_URL
ARG YOUTUBE_CANAL_ID
ENV NODE_ENV=production \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL} \
    NEXT_PUBLIC_MAPA_TILES_URL=${NEXT_PUBLIC_MAPA_TILES_URL} \
    NEXT_PUBLIC_MAPA_GLIFOS_URL=${NEXT_PUBLIC_MAPA_GLIFOS_URL} \
    YOUTUBE_CANAL_ID=${YOUTUBE_CANAL_ID}

# El build necesita la base: la portada y los listados se prerenderizan con el
# contenido real. Por eso las migraciones corren aca, antes: en una base nueva,
# sin tablas, el prerender no tendria que consultar.
#
# La base y el secreto entran como secretos de BuildKit: existen solo mientras
# corre este RUN y no quedan en ninguna capa ni en `docker history`. Nunca
# pasarlos como ARG, que si quedan grabados en la imagen.
RUN --mount=type=secret,id=database_uri,env=DATABASE_URI,required=true \
    --mount=type=secret,id=payload_secret,env=PAYLOAD_SECRET,required=true \
    pnpm payload migrate && pnpm build

# ---- Imagen final ----
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# `standalone` trae server.js y solo las dependencias que el build rastreo.
# Next escribe el cache de ISR en `.next/`, asi que es del usuario del proceso.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# El handler del bot de promociones lo carga Payload por ruta, con un `import()`
# de Node fuera del bundle (ver `jobs` en payload.config.ts), y el rastreo de
# `standalone` no lo ve. Va el `src` entero, en la misma ruta que tenia en el
# build: esa ruta quedo escrita en el bundle. Node 24 le saca los tipos solo.
COPY --from=builder /app/src ./src

# Los archivos que se suben desde el panel. Va montado un volumen encima (ver
# docker-compose.prod.yml): la imagen se reconstruye en cada despliegue y lo que
# quede adentro se pierde.
#
# El directorio tiene que existir aca y ser del usuario del proceso: Docker le
# copia dueno y permisos al volumen la primera vez que lo monta. Si no, el
# volumen nace de root y la primera subida falla con EACCES.
ENV MEDIA_DIR=/app/media
RUN mkdir -p /app/media && chown nextjs:nodejs /app/media

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
