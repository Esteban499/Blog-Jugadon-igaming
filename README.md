# Blog iGaming

Blog de contenido informativo y tutoriales. Next.js + Payload CMS en un solo
proceso, PostgreSQL y almacenamiento S3.

| Capa | Local | Produccion |
| --- | --- | --- |
| App + CMS | `next dev` en :3000 | contenedor `web` en una VM con aaPanel, detras de su Nginx |
| Base de datos | Postgres en Docker, :5433 | Postgres en Docker, en la misma VM |
| Archivos | MinIO en Docker, :9000 | Cloudflare R2 |

Como se despliega y donde viven los secretos: [Produccion en una
VM](#produccion-en-una-vm).

MinIO y R2 hablan la misma API S3: pasar de un entorno a otro son variables de
entorno, no codigo.

## Arrancar

Requisitos: Node 24 (minimo 22.18, ver `.nvmrc`), pnpm 11, Docker.

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
  src/app/(frontend)/datos/    Route handlers propios del sitio publico. Fuera
                               de `/api`, que es de Payload
  src/seed.ts                  Datos de prueba
  src/scripts/                 reindex, importacion de puntos y migraciones de contenido
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

## Ultimos ganadores

Los treinta premios mas altos que pagaron las plataformas, en la portada justo
encima de la cinta de proveedores. Es dato vivo: no pasa por Payload y no hay
nada que cargar a mano.

Sale del mismo endpoint publico que consume el lobby de casino de cada sitio,
`PROXY_URL/matchcasino/last-winners`, y se piden las cuatro jurisdicciones que
lo exponen: San Luis (`proxy2`), Cordoba, La Rioja y CABA. Cada registro se
marca con su provincia, se juntan en una sola lista, se ordenan por monto
descendente y se cortan en treinta.

### El `Accept` no se toca

**El endpoint negocia contenido con una cadena literal, y con cualquier otra
contesta 204 sin cuerpo.** Hay que mandar exactamente:

    Accept: application/json, text/plain, */*

que es el que emite el axios del lobby. Con `application/json` a secas, con el
comodin a secas o sin cabecera, la respuesta es 204.

Esa es la trampa: **204 es un exito**, asi que `respuesta.ok` da `true`, no se
tira ninguna excepcion y no aparece nada en ningun log. Visto desde afuera es
identico a una API que todavia no tiene datos. Si algun dia la seccion deja de
mostrar premios sin explicacion, esta cabecera es el primer lugar donde mirar.

Ni `Origin`, ni `Referer`, ni `User-Agent` cambian nada; se manda `Referer` por
prolijidad, no porque haga falta.

### Un 204 legitimo tampoco es un error

Una jurisdiccion que no pago ningun premio en la ventana que mira el endpoint
contesta 204 con la cabecera correcta. La Rioja viene contestando asi de forma
sostenida. No se trata como falla: esa jurisdiccion no aporta registros y las
otras tres siguen su curso. Las cuatro peticiones van con `allSettled` por lo
mismo, un proxy caido no puede dejar la portada sin seccion.

Si las cuatro vienen vacias, la seccion **no se dibuja**: un titulo sobre un
hueco seria peor que no tenerla.

### Cada tarjeta pide su propio recorte

El catalogo publica tres versiones de la miniatura de cada juego, y **no son la
misma imagen escalada**: cada una esta compuesta aparte, con el titulo del juego
y el logo del proveedor donde entran.

| tag            | medida  | donde se usa   |
| -------------- | ------- | -------------- |
| `vertical`     | 420x588 | el premio mayor |
| `square`       | 420x420 | la pista        |
| `rectangulars` | 320x210 | en ningun lado, queda de respaldo |

Recortar una a la forma de la otra es justo lo que se lleva puestos el titulo y
el logo, que es lo unico que hace reconocible una miniatura a ese tamano. Por
eso el servidor manda las dos que se usan y elige la tarjeta, no el dato: la
forma del hueco la conoce la maqueta.

### La seccion se maqueta contra el contenedor, como todo lo demas

Nada especial: usa `contenedor`, igual que cualquier otra pantalla. Vale la pena
dejar dicho igual que **esta seccion es la razon por la que el contenedor del
sitio pasó de 1200px a 1700px**.

En un monitor ancho, a 1200 entraban tres columnas y media de premios y el resto
quedaba en aire. La regla de los 1200 venia de la medida de linea legible, y esa
razon vale para un parrafo pero no para una fila de miniaturas. Se movio el
numero del sistema en vez de darle un ancho propio a esta seccion: una segunda
medida de contenedor es justo lo que hace que dos secciones no alineen y que
despues nadie sepa cual manda. Ver §4.3 del manual.

Hubo una version intermedia que soltaba el borde derecho contra la ventana y
conservaba la sangria izquierda del contenedor. Entraban mas columnas todavia,
pero se descarto: con la tarjeta del premio mayor anclada a la izquierda, el
margen de ese lado quedaba a la vista como un hueco y la seccion se leia
corrida.

**El ancho de columna de la pista esta atado a esto.** Sus 13rem no son un
numero elegido a ojo: dos filas de tarjeta cuadrada de 208px mas los controles
dan el alto exacto que necesita el premio mayor para dibujar su 420x588 en
proporcion nativa sobre los 384px de su columna. Tocar ese ancho no agranda las
tarjetas de la pista y ya: empieza a recortar la imagen de la tarjeta grande, y
es un efecto que no se ve venir desde el archivo donde se cambia.

### Dos dominios de imagen, uno solo habilitado

Las miniaturas de los juegos vienen casi siempre del CDN
(`d2i3l2m8dk0scd.cloudfront.net`), pero unos pocos registros —tres de noventa
en la muestra— traen la URL del bucket que ese CDN tiene detras
(`sirplay-amazon.s3.eu-west-3.amazonaws.com`), con el mismo path y el mismo
archivo byte por byte. Se reescriben al CDN y solo el CDN esta en
`remotePatterns`.

Lo que llegue de un tercer dominio se descarta y la tarjeta cae en
`SinPortada`. No es prolijidad: `next/image` **tira una excepcion** ante un
`src` de un host no configurado, y como la seccion se dibuja del lado del
cliente esa excepcion se lleva puesta la pantalla entera. Ya paso una vez, con
el bucket.

### Tocar una tarjeta abre el modal de plataformas

Cada premio es tocable y abre un dialogo con las cuatro plataformas. Existe
porque la tarjeta prometia algo que no cumplia: un premio con monto, juego y
provincia se lee como algo en lo que se puede participar, y tocarlo no hacia
nada.

**No lleva a ningun juego puntual.** Seria lo esperable, pero la ruta de
lanzamiento de la plataforma (`/launch/<id>`) pide sesion iniciada, asi que
mandaria a quien toca a un login sin contexto. El destino es la portada de cada
plataforma.

Salen las **cuatro**, no solo la del premio: quien mira un premio de CABA puede
jugar en San Luis. La del premio va marcada y con el borde encendido, pero el
orden de la lista no cambia nunca, asi no baila entre una tarjeta y otra.

Los enlaces salen con `rel="nofollow sponsored noopener"` y `target="_blank"`,
el mismo tratamiento que los enlaces a plataformas de `/promociones`, y el modal
cierra con la linea de "+18, jugá de forma responsable": es, literalmente, el
paso previo a ir a jugar con dinero real.

Los hosts publicos van en minuscula, que es su forma canonica: `larioja`, no
`LaRioja`. Viven junto con los de la API en `utilidades/jurisdicciones.ts`, un
modulo puro que leen los dos lados —el servidor para pedir premios, el cliente
para armar los enlaces—. Escritos por separado, cambiar un dominio dejaria la
seccion pidiendole premios a una plataforma y mandando visitas a otra.

### Por que esta seccion pide sus datos desde el cliente

Es la unica de la portada que lo hace, y rompe a proposito la regla de "un solo
archivo cliente en la home". La portada es estatica y se regenera cada hora,
que es el ritmo correcto para noticias que salen de Payload; una lista que se
llama "ultimos ganadores" con una hora de atraso deja de ser cierta.

Pidiendola aparte contra `/datos/ultimos-ganadores` —route handler propio, con
un minuto de cache— los premios se renuevan cada minuto y el resto de la home
sigue sirviendose estatica.

### Y se refrescan al volver a la pestania

La seccion no lee una sola vez: vuelve a pedir los premios cuando la pestania
recupera el foco (`visibilitychange`). Es el momento en que la lista importa,
porque quien vuelve despues de un rato espera ver premios de ahora y no los de
cuando abrio la pagina.

**No es un intervalo, y es a proposito.** Un `setInterval` reordenaria las
tarjetas mientras alguien esta recorriendo la pista —es un carrusel, y moverle
el contenido debajo del dedo es peor que mostrarlo un minuto viejo— y ademas
seguiria pidiendo con la pestania de fondo, que es trabajo que nadie ve.

Tres guardas, y las tres hacen falta:

- **Solo al volver, no al irse.** El evento dispara en los dos sentidos.
- **Nunca con el modal abierto.** La tarjeta que lo abrio queda guardada aparte
  y seguiria siendo valida, pero cambiar la lista debajo mientras alguien decide
  a que plataforma ir no le suma nada.
- **Nunca antes del minuto.** Es lo que dura el cache de la ruta, asi que pedir
  antes devuelve lo mismo byte por byte. Sin esto, alternar entre dos pestanias
  dispara una peticion por cambio.

Y un detalle que no se ve hasta que falla: **si el refresco sale mal, se queda
lo que habia**. Solo la PRIMERA lectura puede dejar la seccion sin dibujar; en
un refresco ya hay treinta tarjetas en pantalla, y borrarlas porque una
relectura fallo seria hacer desaparecer contenido bueno delante de quien lo
estaba mirando.

Esa ruta **no vive bajo `/api`**: ese prefijo es de Payload, que lo atiende
entero con un catch-all. Un segmento estatico le ganaria, pero seria una
precedencia sutil de la que despues depende una pantalla.

### Los nombres se tapan en el servidor

El formato es dos letras, cuatro asteriscos y dos letras: `carinabusto` sale
como `CA****TO`. Los usuarios de cuatro caracteres o menos se reducen a la
inicial, porque ahi "dos primeras + dos ultimas" no taparia absolutamente nada.

La ofuscacion —y el formato en pesos— pasan antes de cruzar la red, no en la
maqueta. Al navegador nunca le llega un `userLogin` real: no esta en el HTML ni
en la respuesta que se ve por DevTools.

## Puntos de venta

Mil cuatrocientos locales con su mapa en `/puntos-de-venta`. Una sola coleccion
con un campo `tipo` que los distingue: comparten todos los campos, y con tres
colecciones cada campo nuevo habria que agregarlo tres veces.

Los tres tipos no son matices del mismo negocio:

| Tipo | Que es | Cuantos |
| --- | --- | --- |
| `sala` | El local propio de la marca, con su piso de juego. | 12 |
| `agencia` | El comercio adherido con terminal de juego. | 214 |
| `punto-de-pago` | Farmacia, supermercado o centro de servicio donde **solo** se carga saldo y se retira. Ahi no se juega. | 1.199 |

La distincion importa y por eso es un filtro y no una etiqueta: mandar a alguien
a una farmacia a jugar es mandarlo al lugar equivocado. Ademas son ordenes de
magnitud distintos, asi que sin el filtro las doce salas desaparecen entre los
mil doscientos puntos de pago.

Las coordenadas **no se geocodifican nunca**: o vienen en la planilla de origen,
o las carga a mano quien da de alta el local. Geocodificar al guardar seria mas
comodo pero mete una llamada paga en el guardado y falla en silencio donde mas
duele: una calle que existe en tres localidades se resuelve sola contra la
equivocada y el local queda a doscientos kilometros sin que nadie se entere. En
Google Maps, clic derecho sobre la puerta del local y "copiar coordenadas".

### Importar las planillas

El grueso del directorio no se carga a mano: llega como dos planillas de la
operacion, en `PDV/`, y entra con

```bash
pnpm importar-puntos:simular   # lee, normaliza y muestra, sin tocar la base
pnpm importar-puntos           # lo mismo, escribiendo
```

Correr **siempre primero la simulacion**. Los dos archivos vienen de sistemas
ajenos y lo que hay que mirar antes de escribir mil cuatrocientas filas es como
quedaron los nombres y cuantas se descartan, no si Postgres esta levantado.

Las dos planillas son dos redes distintas y no se pisan —cruzadas por
coordenadas coinciden en dos locales sobre mil cuatrocientos—:

- **`issues (N).csv`**, la red propia en San Luis: trae codigo de agencia y
  telefono, no trae horarios. Punto y coma como separador y **Windows-1252**, no
  UTF-8.
- **`Listado PDV *.xlsx`**, la red de cobranzas en CABA, Cordoba, San Luis y La
  Rioja: trae horarios, no trae telefono.

Es idempotente. Cada punto se guarda con el identificador que traia su planilla
—`agencias:687-000`, `pagos:5149300`— en `codigoExterno`, y reimportar actualiza
en lugar de duplicar. No hay otra llave posible: el listado propio tiene
veintitres agencias cuyo unico nombre es su codigo y cuatro locales distintos
llamados "La Suerte", asi que "mismo nombre y misma localidad" fusionaria cosas
que no tienen nada que ver.

La importacion **no toca `activo`** de lo que ya existe: sacar un local del mapa
es una decision que alguien tomo desde el panel. Los puntos que estaban y ya no
vienen en la planilla se informan al final, para que alguien decida.

Tres cosas que hace el importador y conviene saber que hace:

- **Normaliza el texto.** Las dos planillas vienen gritadas y sin acentos
  (`FARMACIA ANTIGUA CHARCAS`). Se pasan a capitalizacion normal, respetando
  siglas (`C.S.`, `(CF)`, `S/N`) y con una tabla corta de acentos que solo
  incluye palabras que en castellano **siempre** llevan tilde: `RIO` es siempre
  `Rio`, `ESTE` no. Lo que quede sin tilde se lee igual; lo que se corrija de
  mas, no.
- **Arregla las coordenadas.** El CSV mezcla los dos separadores decimales en la
  misma fila (`-33,225504` y `-66.227879`), y el `.xlsx` las trae al reves,
  `[lon, lat]` en un solo campo. Un `Number()` derecho pierde media provincia
  sin avisar y un orden invertido manda un local de Cordoba al Indico.
- **No lee las planillas con una libreria.** El `.xlsx` es un ZIP con XML
  adentro, y `src/scripts/planillas.ts` lo abre con `node:zlib` en streaming.
  Son ciento cincuenta lineas contra una dependencia de varios megas, y la hoja
  pesa 85 MB: levantada entera a un `string` son ~170 MB de heap por un archivo
  que en disco entra en un adjunto de mail.

### El mapa no es de Google, pero se ve como uno

Es **MapLibre** (BSD-3) sobre un **basemap propio de Protomaps**: un unico
archivo `.pmtiles` en el bucket del proyecto, que el navegador lee por rangos
HTTP —pide los pedazos del pais que estan en pantalla, no el archivo entero—.

Sin clave de API, sin cuota y sin facturacion por visita. El costo es el storage
del archivo, y en R2 no se paga egress.

Dos consecuencias que se ven en el codigo:

- **Los marcadores son una fuente GeoJSON, no elementos.** Con catorce locales
  eran un `<button>` cada uno, que entraba en el orden de tabulacion. Con mil
  cuatrocientos eso es un nodo del DOM por local que el navegador reposiciona en
  cada cuadro de un arrastre: el mapa deja de seguir al dedo. Ahora los dibuja la
  GPU, y arrastrar cuesta lo mismo con catorce que con mil cuatrocientos.

  Lo que se pierde —que el marcador ya no lo anuncie el lector de pantalla— se
  compensa con el **buscador por nombre**: un combobox que se maneja entero con
  el teclado y lleva a la ficha del local, que dice lo mismo que diria el
  marcador. Reemplazo a la lista de "lo que hay en pantalla", que cortaba en
  sesenta fichas y no respondia la pregunta de quien ya sabe a donde va.

- **MapLibre se carga despues que la pagina.** MapLibre, pmtiles y el estilo de
  Protomaps (`utilidades/mapa.ts`) se piden con `import()` al crear el mapa: son
  casi un megabyte que la pagina ya no espera para responder. Lo que el
  componente necesita desde el primer render vive en `utilidades/puntos-del-mapa.ts`.
  Del lado del servidor, el directorio entero se cachea con `unstable_cache`
  (etiqueta `puntos-de-venta`, una hora, invalidada al guardar en el panel) y
  los filtros se aplican en memoria.

- **Los puntos NO se agrupan en cumulos.** La fuente lleva `cluster: false` y
  cada local es su propio circulo en todos los zooms. El agrupamiento estuvo un
  rato y se saco a proposito: cambia lo que la pantalla es. Con cumulos, el
  encuadre de arranque son doce burbujas con numeros adentro y hay que ir
  abriendolas hasta llegar a un local; sin ellos se ve de una donde hay locales
  y donde no, que es la pregunta con la que alguien entra.

  El costo se acepta y esta a la vista: en el encuadre de pais, los cuatrocientos
  de CABA y los seiscientos de Cordoba son dos manchas azules. Lo unico que se
  hace al respecto es achicar el radio del circulo a 3 px en los zooms lejanos
  —con el radio de ciudad serian una mancha solida— y confiar en los filtros y
  en el buscador, que llega a cualquier local aunque el mapa no los separe.

  Agrupar y no agrupar son cinco lineas de diferencia (`cluster`, dos capas y el
  handler que abre el cumulo). Si algun dia se quiere volver, esta en el
  historial de git; lo que no conviene es dejar las dos formas conviviendo detras
  de una bandera.
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
- **Los marcadores siguen siendo de la marca**: tres pesos del mismo azul —el
  institucional para las salas, el de marca para las agencias, el de enlace para
  los puntos de pago— y naranja el seleccionado. En ese orden por algo: los
  puntos de pago son el color mas claro porque son mil doscientos y en CABA
  taparian todo lo demas. Van rellenos y con anillo blanco porque un circulo
  hueco no se ve sobre tierra clara.

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

Hoy el archivo cubre **solo las provincias que tienen puntos de venta** —CABA,
Cordoba, La Rioja y San Luis—, no el pais entero. Santa Fe estuvo y se saco
porque no tiene ningun local cargado. Son 105 MB contra 1.1 GB de Argentina
completa, y el hueco entre La Rioja y CABA es justamente lo que un bbox unico
traeria al pedo.

Por eso el script usa `--region` con un MultiPolygon de cuatro rectangulos y no
un `--bbox`. Si se abre un local en una provincia nueva, se le agrega su caja a
`scripts/jurisdicciones.geojson` y se vuelve a correr:

```bash
./scripts/generar-mapa.sh          # las provincias con locales, zoom 14
./scripts/generar-mapa.sh 13       # mas liviano, menos detalle de calle
```

Necesita el CLI [go-pmtiles](https://github.com/protomaps/go-pmtiles/releases)
en el PATH — no es el paquete de npm, es la herramienta que arma el archivo.
Baja del orden de 1-2 GB y se corre **cada varios meses**: el mapa base cambia
poco y no tiene por que estar en el deploy.

El script imprime al final los comandos para subirlo y la politica de CORS.
**Los headers de Range son los que importan**: sin exponerlos, MapLibre no puede
leer por pedazos e intenta bajar el archivo entero.

Sin `NEXT_PUBLIC_MAPA_TILES_URL` la pantalla no se rompe: avisa que falta el
mapa, y el buscador por nombre sigue llevando a la ficha de cada local, con su
direccion y el enlace para llegar.

Con la variable puesta pero sin el archivo en el bucket —un 404— el mapa carga
igual y dibuja los puntos sobre el gris de fondo, sin calles ni rotulos. Si el
mapa sale "vacio", lo primero es revisar que el `.pmtiles` este subido.

En desarrollo la variable es **relativa** (`/mapa/jurisdicciones.pmtiles`) y
`next.config.mjs` reenvia `/mapa/*` a MinIO. Con `http://localhost:9000/...` el
mapa andaba solo en la compu de desarrollo: el celular, abriendo el sitio por la
IP de la red, entendia `localhost` como si mismo y nunca recibia el archivo. En
produccion va la URL absoluta de R2.

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
pnpm importar-puntos     # carga los puntos de venta desde PDV/ (idempotente)
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

## Produccion en una VM

Una sola maquina virtual, administrada con aaPanel como si fuera on-premise.
aaPanel pone el Nginx de adelante, el certificado y el firewall; la app y la
base corren en Docker Compose, desde `deploy/`:

| Pieza | Donde | Expuesta |
| --- | --- | --- |
| Nginx | el de aaPanel, con `deploy/nginx-aapanel.conf` | 80 y 443. SSL de Let's Encrypt desde aaPanel |
| App + panel | contenedor `web` (`apps/web/Dockerfile`) | Solo `127.0.0.1:3000`: la ve Nginx |
| Postgres 16 | contenedor `postgres`, volumen `postgres-data` | Solo `127.0.0.1:5432` |
| Archivos | Cloudflare R2 | URL publica del bucket |

**Docker y no el "Proyecto Node" de aaPanel**, por dos motivos. El proyecto
Node guarda las variables de entorno en la configuracion del panel, en el
disco, que es justo lo que el esquema de [Secretos](#secretos) evita. Y el
handler del bot de promociones se carga por ruta, sin pasar por el bundle:
tiene que existir en el mismo lugar donde se compilo, y eso la imagen lo
garantiza y un despliegue a mano no.

**Node 24**, fijado en `.nvmrc`. El minimo es 22.18, y esta en `engines`:
Next 16 pide 20.9, pero el handler del bot es un `.ts` que Node carga sin
compilar, y recien desde 22.18 le saca los tipos solo. Con una version anterior
el sitio anda y la corrida diaria falla, con el error escrito solo en el
registro del job. La imagen ya trae Node 24: en la VM no hace falta instalarlo.

R2 y no MinIO para los archivos: el proyecto de MinIO dejo de publicar
imagenes de su edicion comunitaria, y un servicio de almacenamiento sin
parches, expuesto para servir el mapa, es justo lo que no conviene tener en la
misma VM que la base. Si los archivos tienen que quedar adentro si o si, la
alternativa es otro servidor compatible con S3 en un contenedor mas; para la app
son solo las variables `S3_*`.

### Secretos

**En la VM no se guarda ningun secreto.** Viven en un gestor externo y el
gestor los pone en el entorno del proceso que despliega; de ahi pasan a los
contenedores. No hay `.env` de produccion ni en el repo ni en el disco.

| Secreto | Que es | Rotarlo |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | Clave del usuario `jugadon` de Postgres | `ALTER USER` en la base, despues en el gestor, y redesplegar |
| `PAYLOAD_SECRET` | Firma las sesiones del panel. 32+ caracteres | Cambiarlo cierra todas las sesiones abiertas |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Token de R2 con permiso **solo** sobre el bucket del proyecto | Desde el panel de Cloudflare |

Generarlos con `openssl rand -hex 32`. La clave de Postgres va adentro de una
URL de conexion, y `desplegar.sh` rechaza caracteres que haya que escapar.

Lo que no es secreto —dominio, bucket, URLs publicas— esta en
`deploy/produccion.env`, versionado, y se revisa como cualquier cambio.

El gestor lo elige la organizacion; el repo no depende de ninguno, porque todo
lo que hace falta es un comando que corra otro con las variables puestas:

```bash
infisical run --env=prod -- bash deploy/desplegar.sh        # Infisical (nube o propio)
bws run --project-id <id> -- bash deploy/desplegar.sh       # Bitwarden Secrets Manager
op run --env-file=deploy/secretos.op.env -- bash deploy/desplegar.sh   # 1Password
```

Si la VM esta en una nube (Azure, AWS, GCP), su gestor de secretos con la
identidad administrada de la maquina evita incluso la credencial de arranque de
abajo.

**Lo que hay que saber de este esquema:**

- **La credencial del gestor.** La VM necesita una identidad para pedirle los
  secretos al gestor. Tiene que ser de solo lectura y solo del entorno de
  produccion, y revocable. O la usa una persona desde su sesion al desplegar,
  o queda cifrada con `systemd-creds` atada al TPM de la VM, que no sirve si
  alguien copia el disco.
- **Docker guarda el entorno de cada contenedor** en
  `/var/lib/docker/containers/*/config.v2.json`, y `docker inspect` lo muestra.
  Es lo que permite que los contenedores vuelvan solos despues de un reinicio.
  Solo lo lee root, que igual podria leer la memoria del proceso, pero
  si la politica exige que ningun secreto toque el disco, el paso siguiente
  es que el contenedor le pida los secretos al gestor al arrancar, con la CLI
  del gestor como entrypoint, y que en la VM quede solo la credencial del
  punto anterior.
- **Los secretos del build no quedan en la imagen.** El build necesita la base
  y `PAYLOAD_SECRET`, porque la portada se prerenderiza con contenido real.
  Entran como secretos de BuildKit, que existen mientras corre ese paso y no
  quedan en ninguna capa ni en `docker history`. Nunca pasarlos como `ARG`.
- **El `.env` versionado de desarrollo no llega a produccion.** El
  `.dockerignore` lo deja afuera de la imagen, y `payload.config.ts` frena el
  arranque si en produccion falta un secreto o quedo uno de los de ejemplo del
  repo.

### El sitio en aaPanel

aaPanel pone Nginx, el certificado y el firewall. La app no se da de alta como
"Proyecto Node": se crea un sitio comun y su Nginx se apunta a la app.

1. **Docker.** Desde la tienda de aaPanel (Docker) o `docker-ce`. Hace falta
   Docker Compose v2.24 o superior: `docker compose version`.
2. **Sitio.** Website > Add site, con el dominio, PHP en "Static" y sin base de
   datos: la base es la del compose.
3. **SSL.** Con el DNS ya apuntando a la VM: pestania SSL > Let's Encrypt, y
   "Force HTTPS".
4. **Nginx.** Pestania "Config" del sitio:
   - Borrar los dos bloques de estaticos que agrega aaPanel,
     `location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$` y `location ~ .*\.(js|css)?$`.
     Buscan los archivos en la carpeta del sitio, que esta vacia: los JS de
     Next, los logos y las imagenes darian 404.
   - Pegar `deploy/nginx-aapanel.conf` adentro del `server { }`.
   - Reemplazar la IP de ejemplo por las de la oficina o la VPN. **Viene
     cerrado a proposito**: con la base vacia, Payload muestra en `/admin` la
     pantalla para crear el primer usuario, y el primero que llega queda de
     admin.
   - Guardar. aaPanel prueba la configuracion con `nginx -t` y no la aplica si
     tiene errores.
5. **No usar la pestania "Reverse proxy".** Arma un `location ^~ /` que le gana
   a los bloques de `nginx-aapanel.conf` y deja `/admin` abierto.
6. **Firewall** (Security): 80 y 443 abiertos; el puerto del panel y el 22,
   solo desde las IPs de quienes administran. El 3000 y el 5432 no se abren:
   igual escuchan solo en el loopback.
7. **El panel.** Corre como root, asi que es la puerta mas valiosa de la VM:
   segundo factor, "entrada de seguridad" (la URL secreta del panel), lista
   blanca de IPs y siempre actualizado.

### Primer despliegue

1. VM con aaPanel, el DNS apuntando a ella y el sitio armado como arriba.
2. Bucket de R2 creado, con el `.pmtiles` subido y el CORS que imprime
   `scripts/generar-mapa.sh`. Token con permiso solo sobre ese bucket.
3. Completar `deploy/produccion.env`. El script no corre mientras quede un
   `CAMBIAR`.
4. Cargar los secretos en el gestor.
5. Por SSH, desde la carpeta del repo: `<gestor> run -- bash deploy/desplegar.sh`
6. Entrar a `/admin` desde una IP habilitada y crear el usuario admin real.
7. Cargar los datos iniciales. La imagen no trae `pnpm` ni los scripts, y las
   planillas de `PDV/` no tienen por que estar en la VM: se corren desde una
   compu del equipo, contra la base de produccion por un tunel SSH.

   ```bash
   ssh -N -L 5434:127.0.0.1:5432 usuario@vm &    # la base de la VM, en localhost:5434
   cd apps/web
   <gestor> run -- bash -c 'set -a; . ../../deploy/produccion.env; set +a
     DATABASE_URI="postgres://jugadon:$POSTGRES_PASSWORD@localhost:5434/jugadon" pnpm cargar-plataformas'
   ```

   Lo mismo con `cargar-banners` e `importar-puntos` (antes,
   `importar-puntos:simular`). `produccion.env` va cargado para que las
   imagenes suban a R2 y no al MinIO local: lo que ya esta en el entorno le
   gana al `.env` de desarrollo.

**`pnpm seed` no se corre nunca en produccion**: crea `admin@blog.local` con
`admin1234`.

### Actualizar

`git pull` y el mismo `<gestor> run -- bash deploy/desplegar.sh`. El script
respalda la base, construye la imagen (que corre `payload migrate` antes de
compilar) y reemplaza el contenedor.

Los cambios de esquema pasan a ser migraciones: en desarrollo sigue el push
automatico, pero todo cambio de colecciones que vaya a produccion lleva su
`pnpm payload migrate:create <nombre>`, versionado en `src/migrations`. La
primera, `inicial`, es el esquema entero.

### Respaldos

`desplegar.sh` deja un `pg_dump` en `deploy/respaldos/` antes de cada
despliegue, que el `.gitignore` excluye. Tiene emails y hashes de claves:
tiene que salir de la VM, cifrado, a otro lado. Un respaldo que vive en el
mismo disco que la base no sobrevive a perder ese disco. Falta el respaldo
diario programado; los archivos ya estan en R2.

## Pendientes antes de produccion

- Respaldo diario de la base, cifrado y fuera de la VM.
- Adaptador de email (SMTP). Sin el, "olvide mi clave" escribe el enlace de
  recuperacion en el log del contenedor: nadie lo recibe, y quien lea los logs
  puede resetear cuentas.
- Content-Security-Policy completa. Hoy solo va `frame-ancestors`: una politica
  de scripts hay que probarla contra MapLibre (workers en `blob:`), el editor
  del panel y los embeds de YouTube.
- Verificacion de edad, avisos de juego responsable y restriccion por
  jurisdiccion, modelados como configuracion global y no fijos en el codigo.
- Alta en Google Search Console: solo acumula datos desde que se configura.
- `next/image` en lugar de `<img>` en el bloque de imagen del cuerpo.

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
