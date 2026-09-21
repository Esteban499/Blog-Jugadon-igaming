#!/usr/bin/env bash
#
# Despliega o actualiza el sitio en la VM.
#
# Se corre SIEMPRE a traves del gestor de secretos, que pone las claves en el
# entorno de este proceso y de nada mas. Por ejemplo:
#
#   infisical run --env=prod -- bash deploy/desplegar.sh
#   bws run --project-id <id> -- bash deploy/desplegar.sh
#   op run --env-file=deploy/secretos.op.env -- bash deploy/desplegar.sh
#
# Con `bash` adelante y no `./`: un archivo creado desde Windows llega al repo
# sin el bit de ejecucion.
#
# Que hace, en orden:
#   1. Verifica que llegaron los secretos y que produccion.env esta completo.
#   2. Levanta Postgres y, si la base ya tiene datos, la respalda.
#   3. Construye la imagen: migra la base y compila (ver apps/web/Dockerfile).
#   4. Reemplaza la app y deja Caddy corriendo.
#
set -euo pipefail
cd "$(dirname "$0")"

SECRETOS=(POSTGRES_PASSWORD PAYLOAD_SECRET S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY)

faltan=()
for nombre in "${SECRETOS[@]}"; do
  [[ -n "${!nombre:-}" ]] || faltan+=("$nombre")
done
if ((${#faltan[@]})); then
  echo "Faltan secretos en el entorno: ${faltan[*]}" >&2
  echo "Esto se corre a traves del gestor de secretos. Ver README, \"Secretos\"." >&2
  exit 1
fi

if grep -q 'CAMBIAR' produccion.env; then
  echo "deploy/produccion.env todavia tiene valores CAMBIAR:" >&2
  grep -n 'CAMBIAR' produccion.env >&2
  exit 1
fi

# La clave va adentro de una URL de conexion: con caracteres reservados
# (@ : / ? #) habria que escaparla, y un error ahi es un "password
# authentication failed" que no explica nada. Se generan sin ellos.
if [[ ! "$POSTGRES_PASSWORD" =~ ^[A-Za-z0-9_-]{24,}$ ]]; then
  echo "POSTGRES_PASSWORD tiene que tener 24 caracteres o mas, solo letras, numeros, - y _." >&2
  echo "Generar una con: openssl rand -hex 32" >&2
  exit 1
fi

compose() { docker compose --env-file produccion.env -f docker-compose.prod.yml "$@"; }

echo "==> Postgres"
compose up -d --wait postgres

# Respaldo antes de migrar: si una migracion sale mal, este archivo es la
# vuelta atras. En la primera corrida la base esta vacia y no hay que guardar.
if compose exec -T postgres psql -U jugadon -d jugadon -tAc \
  "select to_regclass('public.payload_migrations')" | grep -q payload_migrations; then
  mkdir -p respaldos
  archivo="respaldos/$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
  echo "==> Respaldo de la base en deploy/${archivo}"
  compose exec -T postgres pg_dump -U jugadon -d jugadon | gzip > "$archivo"
fi

echo "==> Imagen (migraciones + build)"
# Para el build la base es el puerto publicado en el loopback, no el servicio.
export DATABASE_URI_BUILD="postgres://jugadon:${POSTGRES_PASSWORD}@127.0.0.1:5432/jugadon"
compose build web

echo "==> App y proxy"
compose up -d --wait web caddy
compose ps
