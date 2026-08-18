import { adaptadores } from '../scrapers/registro'
import type { SlugDeAdaptador } from '../scrapers/tipos'

/**
 * Corre un adaptador y muestra lo que devuelve, sin tocar la base.
 *
 * Es la herramienta para cuando una plataforma cambia algo: deja ver el dato ya
 * normalizado, que es donde se nota si el mapeo se rompio, sin tener que
 * deducirlo mirando lo que quedo guardado.
 *
 * Uso:
 *   pnpm probar-adaptador <url-de-promociones> <url-de-api> [adaptador]
 *
 * Ejemplo:
 *   pnpm probar-adaptador https://santafe.jugadon.bet.ar/bonus-campaign/ \
 *                         https://proxysantafe.jugadon.bet.ar
 */
const [url, urlApi, slug = 'jugadon-bonus-engine'] = process.argv.slice(2)

if (!url || !urlApi) {
  console.error('Faltan argumentos: pnpm probar-adaptador <url-de-promociones> <url-de-api>')
  process.exit(1)
}

const adaptador = adaptadores[slug as SlugDeAdaptador]
if (!adaptador) {
  console.error(`No hay adaptador registrado con el slug "${slug}".`)
  process.exit(1)
}

const { promociones, avisos } = await adaptador({ url, urlApi, plataforma: url })

console.log(`\n${promociones.length} promociones leídas desde ${url}\n`)
for (const p of promociones) {
  console.log(`  ${p.titulo}`)
  console.log(`    tipo             ${p.tipo}`)
  console.log(`    oferta           ${p.oferta ?? '—'}`)
  console.log(`    resumen          ${p.resumen ?? '—'}`)
  console.log(`    rollover         ${p.rollover ?? '—'}`)
  console.log(`    depósito mínimo  ${p.depositoMinimo ?? '—'}`)
  console.log(`    código           ${p.codigo ?? '—'}`)
  console.log(`    tope conversión  ${p.topeDeConversion ?? '—'}`)
  console.log(`    cuota mínima     ${p.cuotaMinima ?? '—'}`)
  console.log(`    plazo (días)     ${p.diasParaCumplir ?? '—'}`)
  console.log(`    usos por persona ${p.usosPorUsuario ?? '—'}`)
  console.log(`    combinable       ${p.combinable ?? '—'}`)
  console.log(`    activación       ${p.activacion ?? '—'}`)
  console.log(`    verticales       ${p.verticales?.join(', ') ?? '—'}`)
  console.log(`    juegos           ${p.juegosHabilitados ?? '—'}`)
  console.log(`    vigencia         ${p.vigenciaDesde ?? '?'} → ${p.vigenciaHasta ?? 'sin corte'}`)
  console.log(`    destino          ${p.urlDestino}`)
  console.log(`    clave externa    ${p.claveExterna}`)
  console.log(`    puntos clave     ${p.puntosClave?.length ?? 0}`)
  for (const punto of p.puntosClave ?? []) console.log(`        • ${punto}`)
  console.log('')
}

for (const aviso of avisos) console.warn(`  aviso: ${aviso}`)

process.exit(0)
