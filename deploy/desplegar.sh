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
#   2. Levanta Postgres y, si la base ya tiene datos, respalda base y archivos.
#   3. Construye la imagen: migra la base y compila (ver apps/web/Dockerfile).
#   4. Reemplaza la app. El Nginx de aaPanel la encuentra en el loopback.
#
set -euo pipefail
cd "$(dirname "$0")"

SECRETOS=(POSTGRES_PASSWORD PAYLOAD_SECRET)

faltan=()
for nombre in "${SECRETOS[@]}"; do
  [[ -n "${!nombre:-}" ]] || faltan+=("$nombre")
done
if ((${#faltan[@]})); then
  echo "Faltan secretos en el entorno: ${faltan[*]}" >&2
  echo "Esto se corre a traves del gestor de secretos. Ver README, \"Secretos\"." >&2
  exit 1
fi

if grep -q '^[^#]*CAMBIAR' produccion.env; then
  echo "deploy/produccion.env todavia tiene valores CAMBIAR:" >&2
  grep -n '^[^#]*CAMBIAR' produccion.env >&2
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

# Los puertos del loopback salen de produccion.env, igual que para compose.
leer() { sed -n "s/^$1=//p" produccion.env | tr -d '\r'; }
PUERTO_POSTGRES="$(leer PUERTO_POSTGRES)"
PUERTO_POSTGRES="${PUERTO_POSTGRES:-5432}"
PUERTO_WEB="$(leer PUERTO_WEB)"
PUERTO_WEB="${PUERTO_WEB:-3000}"

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

# Los archivos del panel viven en el volumen `media-data` y en ningun otro
# lado: no hay bucket que los replique. Van al mismo respaldo que la base y en
# la misma corrida, para que el dump y los archivos sean del mismo momento.
#
# Lo hace un contenedor aparte: el volumen es de la app, que en este punto del
# despliegue todavia esta por reemplazarse. La condicion del volumen cubre la
# primera corrida, cuando `web` nunca se levanto y el volumen no existe.
if [[ -n "${archivo:-}" ]] && docker volume inspect jugadon_media-data > /dev/null 2>&1; then
  archivo_media="respaldos/$(basename "${archivo%.sql.gz}")-media.tar.gz"
  echo "==> Respaldo de los archivos en deploy/${archivo_media}"
  docker run --rm -v jugadon_media-data:/media:ro alpine \
    tar -czf - -C /media . > "$archivo_media"
fi

echo "==> Imagen (migraciones + build)"
# Para el build la base es el puerto publicado en el loopback, no el servicio.
export DATABASE_URI_BUILD="postgres://jugadon:${POSTGRES_PASSWORD}@127.0.0.1:${PUERTO_POSTGRES}/jugadon"
compose build web

echo "==> App"
compose up -d --wait web
compose ps

echo
echo "La app responde en 127.0.0.1:${PUERTO_WEB}; afuera sale por el Nginx de aaPanel."
