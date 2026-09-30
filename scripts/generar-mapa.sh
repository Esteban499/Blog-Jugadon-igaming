#!/usr/bin/env bash
#
# Genera el basemap de /puntos-de-venta y lo deja listo para copiar al servidor.
#
# El mapa del sitio es UN archivo .pmtiles con la geometria y los rotulos de
# Argentina. Se saca del build diario de Protomaps —el planeta entero, ~137 GB—
# sin bajarlo: `pmtiles extract` usa peticiones HTTP Range para leer solo los
# pedazos del recuadro que se le pide. La descarga real son los tiles de
# Argentina, no el planeta.
#
# Se corre a mano y cada tanto. El mapa base cambia poco: una calle nueva o un
# barrio que se renombra. Tres o cuatro veces al año alcanza; no hace falta
# automatizarlo ni meterlo en el deploy.
#
#   ./scripts/generar-mapa.sh              # Argentina a zoom 14
#   ./scripts/generar-mapa.sh 13           # mas liviano, menos detalle de calle
#
set -euo pipefail

ZOOM="${1:-14}"
SALIDA="${SALIDA:-jurisdicciones.pmtiles}"

# El planeta al dia de hoy. Protomaps lo reconstruye a diario y la URL es fija.
ORIGEN="${ORIGEN:-https://demo-bucket.protomaps.com/v4.pmtiles}"

# Las jurisdicciones que tienen puntos de venta, un rectangulo cada una: CABA,
# Cordoba, La Rioja y San Luis. Santa Fe estuvo y se saco: no tiene ningun local
# cargado, y sus tiles eran peso que nadie iba a mirar.
#
# Se usa --region con un MultiPolygon y no un --bbox unico: las cuatro estan
# desparramadas —La Rioja al oeste, CABA al este— y una caja que las contenga a
# todas se trae media Argentina central de regalo. Medido: 105 MB con las cuatro
# cajas (173 MB cuando eran cinco, con Santa Fe) contra 1.1 GB del pais entero,
# para el mismo detalle de calle.
#
# Local nuevo en otra provincia: se le agrega su caja a este archivo y se vuelve
# a correr el script.
REGION="${REGION:-$(dirname "$0")/jurisdicciones.geojson}"

if ! command -v pmtiles > /dev/null 2>&1; then
  cat >&2 << 'FALTA'
Falta el CLI `pmtiles` (go-pmtiles). No es el paquete de npm que usa el sitio:
es la herramienta de linea de comandos que arma el archivo.

  https://github.com/protomaps/go-pmtiles/releases

Bajar el binario de la plataforma, ponerlo en el PATH y volver a correr esto.
FALTA
  exit 1
fi

echo "Extrayendo las jurisdicciones con puntos de venta hasta zoom ${ZOOM}…"
echo "  origen: ${ORIGEN}"
echo "  region: ${REGION}"
echo
echo "Baja del orden de 105 MB, en un par de minutos. Se hace una vez cada"
echo "varios meses: el mapa base cambia poco."
echo

pmtiles extract "${ORIGEN}" "${SALIDA}" --region="${REGION}" --maxzoom="${ZOOM}"

echo
echo "Listo: ${SALIDA} ($(du -h "${SALIDA}" | cut -f1))"
echo
cat << SIGUIENTE
Ahora copiarlo a donde lo sirva el servidor web, siempre bajo /mapa/:

  Desarrollo
    mv ${SALIDA} apps/web/public/mapa/jurisdicciones.pmtiles
    # lo sirve el propio Next; la carpeta no se versiona (ver .gitignore)

  Produccion (la VM con aaPanel)
    scp ${SALIDA} usuario@vm:/www/wwwroot/<dominio>/mapa/jurisdicciones.pmtiles
    # lo sirve Nginx: ver \`location ^~ /mapa/\` en deploy/nginx-aapanel.conf

NEXT_PUBLIC_MAPA_TILES_URL queda relativa (/mapa/jurisdicciones.pmtiles) en los
dos entornos. Al salir por el mismo origen que el sitio NO hace falta CORS.

Lo que si importa son los pedidos con Range: MapLibre lee el archivo por
pedazos, y un servidor que conteste 200 con el archivo entero en vez de 206 hace
que el navegador se baje los cientos de MB. Nginx y Next responden 206 de
fabrica; si se mete un CDN o un proxy en el medio, hay que confirmarlo.
SIGUIENTE
