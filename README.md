# Blog iGaming

Blog de contenido informativo y tutoriales. Next.js + Payload CMS en un solo
proceso, PostgreSQL y almacenamiento S3.

| Capa | Local | Produccion |
| --- | --- | --- |
| App + CMS | `next dev` en :3000 | contenedor `web`, N replicas |
| Base de datos | Postgres en Docker, :5433 | Postgres del cluster |
| Archivos | MinIO en Docker, :9000 | Cloudflare R2 |

MinIO y R2 hablan la misma API S3: pasar de un entorno a otro son variables de
entorno, no codigo.

## Arrancar

Requisitos: Node >= 20, pnpm, Docker.

```bash
docker compose up -d          # Postgres + MinIO + creacion del bucket
cd apps/web
pnpm install
pnpm dev                      # http://localhost:3000
```

En otra terminal, para cargar datos de prueba:

```bash
cd apps/web
pnpm seed
```

El seed crea el usuario `admin@blog.local` con contrasenia `admin1234`, una
categoria, etiquetas, un autor, una imagen y una entrada publicada cuyo cuerpo
combina texto con bloques de aviso, HTML incrustado, tabla y FAQ. Es
idempotente: si ya hay entradas, no toca nada.

Desde la raiz del repo tambien sirven `pnpm dev`, `pnpm seed`, `pnpm up` y
`pnpm down`, que delegan en el subproyecto.

## Puntos de entrada

| URL | Que es |
| --- | --- |
| http://localhost:3000 | Sitio publico |
| http://localhost:3000/promociones | Bonos vigentes de las cinco plataformas |
| http://localhost:3000/admin | Panel del CMS |
| http://localhost:3000/api | API REST |
| http://localhost:3000/api/graphql-playground | Explorador GraphQL |
| http://localhost:9001 | Consola de MinIO (`minioadmin` / `minioadmin`) |

## Puerto 5433

El contenedor de Postgres publica el **5433**, no el 5432. Es a proposito: si hay
un PostgreSQL instalado nativamente en la maquina, se queda con el 5432 y la app
termina conectandose al servidor equivocado con un error de autenticacion que no
explica nada. Dentro de la red de Docker el puerto sigue siendo 5432.

## Estructura

```
docker-compose.yml             Postgres + MinIO
apps/web/
  src/payload.config.ts        Colecciones, plugins, i18n, localizacion,
                               carpetas y storage
  src/collections/             Posts, Categories, Tags, Authors, Promociones,
                               Plataformas, Media, Users
  src/blocks/                  Bloques que se insertan en el editor con `/`
  src/scrapers/                El bot de promociones: contrato, adaptadores y
                               el runner que escribe en la base
  src/jobs/                    Handlers del Jobs Queue
  src/fields/slug.ts           Slug que se autogenera desde el titulo
  src/access/roles.ts          Reglas de acceso por rol
  src/components/Contenido.tsx Render del cuerpo de la entrada: convertidores
                               de Lexical a JSX
  src/app/(payload)/           Panel y API (generado por Payload)
  src/app/(frontend)/          Sitio publico
  src/seed.ts                  Datos de prueba
  src/scripts/                 reindex y los scripts de migracion de contenido
```

En `apps/web/contenido-exportado.json` quedo el respaldo del cuerpo de las
entradas previo a la migracion a `richText`. No lo lee nadie: es una red por si
hiciera falta revisar como estaba antes, y se puede borrar.

## Modelo de contenido

`posts` es la coleccion central. El cuerpo es un campo **`richText`** (Lexical):
un documento continuo donde se escribe de corrido y los formatos especiales se
intercalan con el menu `/`, como en Notion. El editor trae ademas el `+` al pasar
el mouse y el asa para arrastrar y reordenar.

Del editor salen gratis los titulos, listas, citas, enlaces, tablas y la subida
de imagenes. Lo que Lexical no sabe hacer se define como bloque en `src/blocks` y
se suma a `bloquesDelEditor`: HTML incrustado, aviso, imagen, FAQ, tabla desde
planilla y CTA. Marketing los combina sin pedir cambios de codigo.

No hay bloque de "Texto": dentro de un `richText` seria un parrafo adentro de un
documento de parrafos.

Los encabezados del cuerpo van de **h2 a h4**, no h1. El h1 es el titulo de la
entrada, y repetirlo adentro lo hace competir contra si mismo en buscadores.
Esta acotado en `HeadingFeature`, que se declara despues de `defaultFeatures`
para pisar la version que trae Payload: las features se resuelven en un `Map`
por clave, asi que gana la ultima.

Sumar un formato nuevo son dos pasos: definirlo en `src/blocks` y agregarle su
convertidor en `src/components/Contenido.tsx`.

Los autores viven en `authors`, separados de `users`. No todo autor necesita
cuenta en el panel, y esos campos (bio, credenciales, enlaces) existen para que
Google pueda evaluar la autoria: en contenido de apuestas ese criterio pesa mas
que en otros nichos.

Roles: **autor** crea y edita; **editor** ademas publica y borra; **admin** ademas
gestiona usuarios. Nadie puede cambiarse el propio rol.

### Dos formas de hacer una tabla

| Cual | Cuando |
| --- | --- |
| Tabla nativa (`/table`) | Armarla a mano: Tab entre celdas, `+` al pasar el mouse para sumar filas o columnas, arrastrar para el ancho |
| Bloque "Tabla" | El dato ya existe en una planilla: se pega y listo |

Las dos se publican con el mismo HTML y los mismos estilos. El convertidor de la
tabla nativa esta redefinido en `Contenido.tsx` porque el que trae Payload pone
bordes y relleno como estilos en linea, y un estilo en linea le gana a cualquier
regla del sitio.

El bloque "Tabla" separa columnas por TAB, que es lo que copian Excel y Google
Sheets, y acepta `|` como alternativa. **La coma no se usa como separador**: los
numeros van con coma decimal (`66,7%`) y partiria las celdas al medio.

Las dos reemplazan al viejo bloque `comparativa`, que pedia tres arrays anidados
(columnas, filas, celdas) y no mantenia la cantidad de celdas alineada con la de
columnas: agregar una columna obligaba a entrar fila por fila. Ver
[Migraciones ya aplicadas](#migraciones-ya-aplicadas).

Salvedad: la tabla nativa esta marcada como experimental por Payload, y su menu
contextual ("Delete row", "Merge cells") esta escrito a mano en el bundle del
cliente sin pasar por i18n. Son las unicas etiquetas del panel que quedan en
ingles.

### Localizacion del cuerpo

`contenido` lleva `localized: true` y con eso alcanza. Todo lo que vive adentro
del documento viaja en ese mismo JSON, bloques incluidos, asi que los campos de
los bloques no llevan `localized` propio: dentro de Lexical no tendria efecto.
Es la excepcion a la regla de "solo se localizan los campos hoja", porque aca la
hoja es el documento entero.

### El bloque de HTML incrustado

Su slug sigue siendo `codigo` porque renombrarlo obligaria a migrar las filas ya
cargadas, pero **ejecuta**, no muestra: lo que se carga ahi termina renderizado.

Se renderiza dentro de un iframe con `sandbox` y `srcdoc`, y eso no es cosmetico.
Los documentos que se pegan traen reglas globales (`body { ... }`, `* { ... }`,
`@media`). Inyectadas en la pagina se aplicarian al sitio entero y romperian el
layout de todas las entradas; encerradas en su propio documento, no salen.

El `sandbox` nunca lleva `allow-same-origin`: sin eso el marco tiene origen
opaco y un script de adentro no puede leer el DOM de la entrada, ni las cookies,
ni el localStorage del sitio. `allow-scripts` se agrega solo cuando el bloque es
de tipo JavaScript, asi que un bloque de HTML no ejecuta nada ni aunque le
peguen un `<script>`. **Las dos juntas anulan el sandbox**: no combinarlas.

Contrapartida a tener presente: lo que vive en el iframe es invisible para
Google. Sirve para piezas decorativas o widgets, no para texto que tenga que
posicionar.

## Promociones

Los bonos vigentes de las cinco plataformas de Jugadon (Santa Fe, San Luis,
Cordoba, CABA, La Rioja), en `/promociones`. Los trae un bot que corre solo una
vez por dia.

Dos colecciones: `plataformas` es a la vez contenido (nombre y logo salen en las
tarjetas) y configuracion del bot (de donde lee y con que adaptador), y
`promociones` es el dato normalizado.

### No es scraping

Las cinco corren la misma app en Nuxt, que pide las campanias a
`PROXY_URL/bonus-engine/api/campaigns`. Ese endpoint devuelve JSON y no pide
autenticacion, asi que el bot consume la misma API que consume el sitio en vez
de leer el HTML.

No es una preferencia de estilo. El HTML de esa pagina lo pinta JavaScript
despues de hidratar, o sea que leerlo pediria un Chromium headless; y aun
teniendolo, el rollover habria que sacarlo de un texto tipo "35x" en vez de leer
`rolloverValue: 35`. Por la API los numeros llegan como numeros, y lo que hay
que vigilar es la forma del JSON, no la maqueta.

**El `PROXY_URL` no se deduce del subdominio.** Cuatro plataformas usan
`proxy<provincia>.jugadon.bet.ar`, pero San Luis pega contra
`proxy2.jugadon.bet.ar`. Por eso vive en el campo `urlApi` de cada plataforma y
no se arma con una plantilla. Sale del runtime config del sitio, buscando
`PROXY_URL` en el HTML de cualquier pagina.

### Que se publica: el recuadro `jgd-summary`

El texto que sale en el sitio no lo redacta el bot. Las bases de cada bono traen
un recuadro `div.jgd-summary` que el equipo de plataforma escribe a mano, con
los puntos del bono en una lista. El bot copia esos puntos al campo **Puntos
clave**, uno por linea, y eso es lo que se publica.

Esto es lo que hace defendible que no haya aprobacion previa: lo que llega al
blog ya fue redactado y revisado del otro lado. El bot ordena y copia; no
interpreta prosa.

Las campanias viejas no traen el recuadro: sus bases son un texto legal corrido,
sin una sola clase en el HTML. Para esas, los puntos se arman con las reglas de
la campania (monto, rollover, deposito minimo, tope de conversion), que son los
mismos numeros con los que la plataforma liquida el bono. La corrida lo avisa,
porque agregar el recuadro del lado de la plataforma da un resultado mejor.

**Los terminos completos no se guardan.** Son un documento legal de miles de
palabras que cambia del lado de la plataforma, y reproducirlo en el blog agrega
una copia que puede quedar vieja justo en lo que tiene que ser exacto. Cada
promocion aclara que esta sujeta a ellos y enlaza a la pagina del bono, que es
donde los terminos son siempre los vigentes.

### Las tres reglas del bot

- **Publica lo vigente.** El circuito es automatico de punta a punta: no hay
  paso de aprobacion. Las versiones quedan igual, y ahi esta el registro de que
  cambio el bot y cuando; es lo que reemplaza a la revision previa.
- **No borra.** Lo que desaparece del origen, o pasa su fecha de corte, va a
  `estado: expirada`: sale del sitio pero la URL sobrevive y no se pierde lo que
  ya estaba indexado. La pagina se sigue sirviendo, avisando que no esta vigente
  y sin el boton para reclamarla.
- **Ante la duda, no toca nada.** Si un adaptador falla, o devuelve cero
  teniendo promociones activas guardadas, la corrida de esa plataforma se aborta
  con un aviso. Es el caso tipico de "rediseniaron la pagina", y confundirlo con
  "se terminaron todas las promociones" vaciaria la seccion de golpe. Esta regla
  pesa mas ahora que no hay nadie mirando cada cambio.

### Como se cae una promocion vencida

Por tres caminos independientes, a proposito, porque es lo que no puede fallar:

1. El adaptador descarta las campanias cuya fecha de corte ya paso, asi que no
   vuelven a entrar.
2. Al final de cada corrida hay un barrido que pasa a `expirada` toda promocion
   activa con `vigenciaHasta` vencida. Corre aunque su plataforma haya fallado:
   la vigencia no depende de que el origen conteste.
3. El listado del sitio filtra por fecha en la consulta. Es el unico de los tres
   que no depende de que el bot haya corrido, y por eso las rutas de
   promociones revalidan cada 5 minutos y no cada hora: el cache es lo unico
   que podria dejar un bono vencido en pantalla.

### Que campos pisa y cuales no

| | De donde sale | Que pasa si un editor lo corrige |
| --- | --- | --- |
| titulo, oferta, rollover, deposito minimo, codigo, vigencia, puntos clave | Literal de la plataforma | Se pisa: la plataforma es la fuente de verdad |
| tipo, resumen | Los deduce el adaptador | No se pisa: solo se escriben al crear |

Dos campos de rastro sostienen todo esto. **`claveExterna`** es el `_id` de la
campania en el origen, y es con lo que el bot reconoce una promocion entre
corridas: si se derivara del titulo, cambiarle una palabra al bono lo daria de
alta de nuevo y quedarian dos. **`huella`** es un hash de lo que trajo el
scraper, y es lo que distingue "esta promocion cambio" de "sigue igual". Sin
ella, una corrida diaria generaria una version nueva por dia de cada documento:
con `maxPerDoc` en 25, en menos de un mes el historial no tendria mas que
pasadas del bot y se habria comido las ediciones de las personas.

Cuando una promocion cambia en el origen, la nueva version se publica y la
anterior queda en el historial. Ese historial es la unica trazabilidad que hay
de lo que hizo el bot, asi que conviene no bajarle el `maxPerDoc`.

### La corrida diaria

Es una tarea del Jobs Queue de Payload, sin infraestructura aparte. Son dos
piezas y hacen falta las dos: `schedule` **encola** el trabajo todos los dias y
`autoRun` lo **saca de la cola y lo ejecuta**. Con solo la primera, el job se
acumula sin correr nunca.

El cron corre en la hora del servidor, que en un contenedor es UTC: las 9 UTC
son las 6 de la maniana en Argentina. En produccion, con varias replicas, no
hace falta que todas miren la cola: `EJECUTAR_TAREAS=false` apaga el corredor en
las que no corresponda.

El `handler` se declara como ruta a un archivo, no importando la funcion.
`payload.config.ts` tambien se empaqueta para el navegador, y un import ahi
arrastraria el scraper entero al bundle del panel. Por el mismo motivo la lista
de adaptadores que ve el panel vive en `scrapers/tipos.ts`, que es solo texto, y
las implementaciones en `scrapers/registro.ts`.

### Cuando algo se rompe

`pnpm probar-adaptador <url> <url-api>` corre un adaptador y muestra lo que
devuelve **sin tocar la base**. Es la primera parada cuando una plataforma
cambia algo: deja ver el dato ya normalizado, que es donde se nota si el mapeo
se rompio.

En el panel, cada plataforma guarda `ultimaCorrida` y `ultimoResultado`. Si la
fecha quedo vieja, lo que fallo es la corrida entera, no el mapeo.

### Limitaciones conocidas

- Hay campanias cargadas sin ficha en espaniol. Se saltean con un aviso, porque
  sin titulo no hay nada que publicar.
- `tipo` (bono de bienvenida, de recarga, cashback) lo deduce el bot de como
  esta armada la campania, no del titulo. Es lo unico que adivina, y por eso es
  lo unico que no vuelve a pisar: si se corrige a mano, queda corregido.
- La imagen no se descarga a `media`: son banners que la plataforma reemplaza
  sin avisar, y copiarlos generaria un archivo huerfano por cada cambio. Si una
  promocion merece imagen propia, se carga en `portada` y la del origen se
  ignora.

## Puntos de venta

Las salas y agencias, con su mapa en `/puntos-de-venta`. Una sola coleccion con
un campo `tipo` que las distingue: comparten todos los campos, y con dos
colecciones cada campo nuevo habria que agregarlo dos veces.

Las coordenadas se cargan **a mano**, no se geocodifican. Geocodificar al
guardar seria mas comodo pero mete una llamada paga en el guardado y falla en
silencio donde mas duele: una calle que existe en tres localidades se resuelve
sola contra la equivocada y el local queda a doscientos kilometros sin que nadie
se entere. En Google Maps, clic derecho sobre la puerta del local y "copiar
coordenadas".

### El mapa no es de Google, pero se ve como uno

Es **MapLibre** (BSD-3) sobre un **basemap propio de Protomaps**: un unico
archivo `.pmtiles` en el bucket del proyecto, que el navegador lee por rangos
HTTP —pide los pedazos del pais que estan en pantalla, no el archivo entero—.

Sin clave de API, sin cuota y sin facturacion por visita. El costo es el storage
del archivo, y en R2 no se paga egress.

Dos consecuencias que se ven en el codigo:

- **Los marcadores son DOM, no dibujos.** Cada uno es un `<button>` con clases
  del sistema: entra en el orden de tabulacion y lo anuncia el lector de
  pantalla. Con Google eran paths SVG dentro de un canvas.
- **La paleta no sale de los tokens del sistema.** `saborGoogle()` en
  `utilidades/mapa.ts` lee los `--mapa-*` de `styles.css` con `getComputedStyle`:
  siguen siendo variables CSS —un color, un solo lugar, compartido con la
  atribucion y los controles— pero son una paleta aparte de la del sitio.

#### La paleta del basemap es una excepcion al manual de marca

Decidida a proposito y documentada en el bloque MAPA de `styles.css`. El mapa va
en los colores de **Google Maps** —tierra gris muy clara, agua celeste, calles
blancas, autopistas amarillas— y no en el azul profundo del sistema.

El motivo es de lectura y no de gusto: la pantalla existe para encontrar el local
mas cercano y salir, y un mapa que se parece al que la persona ya usa todos los
dias se entiende sin mirarlo dos veces.

Tres reglas para que la excepcion no se derrame:

- Los tokens se llaman `--mapa-*` y **no** `--color-*`. No generan utilidades de
  Tailwind y no se usan fuera del mapa.
- Viven fuera de `@theme`, en un `:root` propio: Tailwind solo emite las
  variables de `@theme` que alguna utilidad llega a usar, y a estas las lee
  `getComputedStyle`, que no es una utilidad.
- **Los marcadores siguen siendo de la marca**: azul institucional las salas,
  azul de marca las agencias, naranja el seleccionado. Van rellenos y con anillo
  blanco porque un circulo hueco no se ve sobre tierra clara.

### maplibre-gl esta fijado en la v5. NO subirlo a la v6

Es la unica dependencia del repo con `~` en lugar de `^`, y el motivo esta
tambien en `MapaDePuntosDeVenta.tsx`.

Con la v6 el mapa se queda en "Cargando el mapa" para siempre y **no tira ningun
error**: ni en la consola, ni en el `error` de MapLibre, ni como peticion
fallida. `addProtocol` escribe en un registro del hilo principal, pero los tiles
vectoriales se piden desde un Web Worker que tiene el suyo propio, vacio. El
sintoma exacto es una unica peticion 206 al `.pmtiles` —el TileJSON, que si
resuelve en el hilo principal— y despues silencio.

Cuando pmtiles soporte la v6, el camino es registrar el protocolo tambien en el
worker con `importScriptInWorkers()`.

### Generar el archivo del mapa

Hoy el archivo cubre **las cinco jurisdicciones donde opera Jugadon** —CABA,
Cordoba, La Rioja, San Luis y Santa Fe—, no el pais entero. Son 173 MB contra
1.1 GB de Argentina completa, y el hueco entre La Rioja y CABA es justamente lo
que un bbox unico traeria al pedo.

Por eso el script usa `--region` con un MultiPolygon de cinco rectangulos y no
un `--bbox`. Si se abre un local en una provincia nueva, se le agrega su caja a
`scripts/jurisdicciones.geojson` y se vuelve a correr:

```bash
./scripts/generar-mapa.sh          # las cinco jurisdicciones, zoom 14
./scripts/generar-mapa.sh 13       # mas liviano, menos detalle de calle
```

Necesita el CLI [go-pmtiles](https://github.com/protomaps/go-pmtiles/releases)
en el PATH — no es el paquete de npm, es la herramienta que arma el archivo.
Baja del orden de 1-2 GB y se corre **cada varios meses**: el mapa base cambia
poco y no tiene por que estar en el deploy.

El script imprime al final los comandos para subirlo y la politica de CORS.
**Los headers de Range son los que importan**: sin exponerlos, MapLibre no puede
leer por pedazos e intenta bajar el archivo entero.

Sin `NEXT_PUBLIC_MAPA_TILES_URL` la pantalla no se rompe: muestra la lista
completa de locales con direccion y enlace para llegar, y avisa que falta el
mapa.

### Lo unico que todavia sale a un tercero

Las tipografias de los rotulos (`NEXT_PUBLIC_MAPA_GLIFOS_URL`), que apuntan a
`protomaps.github.io`. Para cortar tambien eso, copiar el directorio de fuentes
de `protomaps/basemaps-assets` al bucket y apuntar la variable ahi.

### La atribucion no se toca

Los datos son de OpenStreetMap bajo ODbL: mostrar el credito es una condicion de
la licencia, no una cortesia. `styles.css` la lleva a la paleta del sitio; nunca
la esconde.

## Archivos y carpetas

`media` tiene `folders: true`, asi que el panel suma la vista **Explorar por
Carpeta** y un campo `Carpeta` en cada archivo. Admite subcarpetas: la tabla
`payload_folders` se referencia a si misma.

Dos cosas que conviene tener claras:

- **La carpeta es solo organizacion del panel.** No cambia donde se guarda el
  archivo: el objeto en S3 sigue bajo el mismo `prefix`, y la URL publica no se
  mueve. Reorganizar carpetas nunca rompe una imagen ya publicada.
- **Borrar una carpeta no borra los archivos.** La clave foranea es
  `ON DELETE SET NULL`: los archivos quedan sueltos, no se pierden.

`collectionSpecific` esta apagado porque hoy solo `media` usa carpetas; prenderlo
agrega un campo que pregunta que colecciones acepta cada carpeta, que con una
sola seria un paso con una unica opcion. Si se habilitan carpetas en otra
coleccion, conviene volver a prenderlo.

### Limitacion al insertar una imagen en una entrada

El selector que se abre desde un campo de imagen usa la vista de **lista**, y en
Payload 3.87 esa vista no sabe de carpetas: `folderID` existe solo en la vista
"Explorar por Carpeta". Dentro del selector **no se puede navegar el arbol**.

Lo que si funciona ahi: la columna **Carpeta** (por eso esta en `defaultColumns`
de `media`) y el filtro por carpeta, porque el campo no lleva `disableListFilter`
y el drawer no desactiva los filtros.

Las carpetas son una feature en beta de Payload y esto es un hueco conocido
aguas arriba. Cuando la vista de lista aprenda a navegar carpetas, se resuelve
solo: no hay nada propio que desarmar.

## Idioma: dos ejes distintos

Payload separa el idioma de la **interfaz** del idioma del **contenido**, y se
confunden seguido:

| Bloque en `payload.config.ts` | Que controla |
| --- | --- |
| `i18n` | El panel: botones, menus, validaciones, respuestas de la API |
| `localization` | El contenido: los valores que carga el equipo en cada campo |

`i18n` declara `es` como unico idioma soportado, asi que el panel queda fijo en
espaniol: ignora el Accept-Language del navegador y no aparece el selector de
idioma en el perfil. Los plugins de SEO y de redirects traen su propia
traduccion y se enganchan solas; el de busqueda no trae ninguna, por eso sus
etiquetas se sobreescriben a mano en el config.

Las etiquetas de los campos son `label`, nunca `name`: el `name` es la columna
en Postgres y renombrarlo es una migracion, no una traduccion.

## Decisiones que conviene no revertir

- **Localizacion activada con un solo idioma.** Sumar un locale despues es
  agregarlo a la lista de `payload.config.ts`. Activar la localizacion despues es
  una migracion de esquema sobre contenido ya cargado.
- **El rol se lee del campo `rol`, en espaniol.** `access/roles.ts` lo tipa
  contra `User` de `payload-types`. Si vuelve a leerse con un cast anonimo, un
  error de nombre no falla: apaga todos los permisos en silencio.
- **Solo se localizan los campos hoja.** Payload no anida localizacion: los
  bloques y los arrays no llevan `localized`, sus campos de texto si. El cuerpo
  de las entradas es la excepcion: al ser un unico `richText`, la hoja es el
  documento entero.
- **El cuerpo es `richText`, no `blocks`.** Volver a `blocks` es rehacer la
  migracion al reves y perder titulos, listas y el menu `/`.
- **Coleccion de redirects.** Cambiar una URL publicada sin cargar el 301 borra el
  posicionamiento ganado.
- **El bot publica lo que redacto la plataforma, no lo que dedujo el bot.** Sin
  aprobacion previa, lo unico que separa al sitio de publicar condiciones
  inventadas es que el texto salga del recuadro `jgd-summary`. Si algun dia se
  arma esa lista interpretando el texto legal, vuelve a hacer falta que alguien
  apruebe antes de publicar.
- **`allow-scripts` y `allow-same-origin` nunca juntos.** Es lo unico que separa
  el HTML incrustado del resto del sitio; combinarlas anula el sandbox entero y
  le devuelve al script acceso al DOM, a las cookies y al localStorage.
- **Indice de busqueda desacoplado.** Hoy se consulta contra Postgres. Cuando el
  corpus crezca, el mismo indice se sincroniza a Meilisearch sin tocar el modelo
  de contenido. Si cambia `beforeSync`, hay que correr `pnpm reindex`.

## Migraciones ya aplicadas

Cambios de forma sobre contenido que ya estaba cargado. Los scripts quedaron en
`src/scripts` como referencia; **no hace falta volver a correrlos**.

| Que cambio | De | A | Script |
| --- | --- | --- | --- |
| Cuerpo de las entradas | campo `blocks` (una tabla hija por bloque) | campo `richText` (una columna JSONB) | `exportar-contenido` + `importar-contenido` |
| Tablas | bloque `comparativa`, con tres arrays anidados | tabla nativa del editor | `migrar-comparativas` |

La primera es en dos pasos a proposito: el export **tiene que correr antes** de
tocar el campo, porque el cambio hace que Payload borre las tablas
`posts_blocks_*`. La segunda es segura de repetir: si no encuentra bloques
`comparativa`, no hace nada.

Las dos perdieron el historial de versiones anterior. El contenido publicado se
migro entero.

## Comandos

```bash
pnpm dev                 # servidor de desarrollo
pnpm build               # build de produccion
pnpm seed                # datos de prueba
pnpm reindex             # resincroniza el indice de busqueda
pnpm cargar-plataformas  # deja cargadas las cinco plataformas (idempotente)
pnpm scrapear-promos     # corre el bot de promociones a mano
pnpm probar-adaptador    # muestra lo que lee un adaptador, sin tocar la base
pnpm exportar-contenido  # vuelca el cuerpo de las entradas a JSON
pnpm importar-contenido  # lo reescribe desde ese JSON
pnpm migrar-comparativas # pasa bloques `comparativa` viejos a tabla nativa
pnpm generate:types      # regenera src/payload-types.ts
pnpm generate:importmap  # regenera el import map del panel
```

### Cambios de esquema que borran datos

En modo `push`, cuando el cambio implica perdida de datos Payload no lo aplica
solo: `pushDevSchema` abre un `prompts()` pidiendo confirmacion. En una terminal
se contesta y listo, pero en CI o en cualquier shell no interactiva el proceso
se queda esperando para siempre, sin imprimir nada. Se destraba mandando la
respuesta por stdin:

```bash
printf 'y\n' | pnpm seed
```

`PAYLOAD_FORCE_DRIZZLE_PUSH=true` **no** sirve para esto: fuerza el diff, no
saltea la confirmacion. Es un motivo mas para pasar a migraciones antes de
produccion, que ya figura en los pendientes.

### El otro prompt, el que no se contesta con `y`

Cuando un mismo cambio **agrega una columna y borra otra en la misma tabla**,
antes del aviso de perdida de datos aparece uno distinto, de Drizzle:

```
Is version_puntos_clave column in _promociones_v_locales table created or renamed from another column?
❯ + version_puntos_clave                    create column
  ~ version_terminos › version_puntos_clave rename column
```

Es un menu de seleccion, no un si/no: `printf 'y\n'` no lo contesta y el proceso
queda esperando para siempre, sin imprimir nada mas. Se sale partiendo el cambio
en dos pasos, que ademas es mas seguro porque cada uno es inequivoco:

1. Agregar el campo nuevo **dejando el viejo en su lugar**, y pushear. Al no
   haber ninguna columna borrada, no hay ambiguedad y no pregunta nada.
2. Borrar el campo viejo, y pushear de nuevo. Ahora solo hay bajas, asi que lo
   unico que aparece es el aviso de perdida de datos, que si se contesta con
   `printf 'y\n'`.

Asi se migro `terminos` a `puntosClave`.

Reiniciar de cero, borrando base y archivos:

```bash
docker compose down -v && docker compose up -d
cd apps/web && pnpm seed
```

## Pendientes antes de produccion

- Migraciones de Payload en lugar del push automatico de esquema, que solo sirve
  en desarrollo.
- `Dockerfile` con `output: 'standalone'` y manifiestos para el cluster.
- Storage apuntando a R2 y `next/image` en lugar de `<img>`.
- Verificacion de edad, avisos de juego responsable y restriccion por
  jurisdiccion, modelados como configuracion global y no fijos en el codigo.
- Alta en Google Search Console: solo acumula datos desde que se configura.
- El front actual es una verificacion de que el contenido llega del panel al
  sitio, no el diseno definitivo.

### Dos features de Payload que no estan estables

Conviene releer esta seccion en cada actualizacion de Payload, porque las dos
pueden cambiar en versiones menores:

- **Tabla nativa** (`EXPERIMENTAL_TableFeature`). El prefijo es del propio
  Payload. Si su API cambia, el contenido ya guardado son nodos `table` en el
  JSON y el riesgo esta en el editor, no en lo publicado: el render usa
  convertidores propios en `Contenido.tsx`.
- **Carpetas** (`folders`). En beta. De ahi salen las dos asperezas conocidas:
  no se pueden navegar desde el selector de imagenes, y la etiqueta del campo
  `folder` se corrige a mano sobre la config ya armada, al final de
  `payload.config.ts`, porque `buildFolderField` la fija sin pasar por i18n. Si
  una version futura la traduce, ese retoque sobra y se puede borrar.
