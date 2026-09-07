# Jugadon — Directrices de Diseño del Blog

> Derivado de **Brand Guidelines v1.0 — Agosto 2026**.
> Stack: Next.js + React + Tailwind. Tema: **oscuro**.
> Alcance: **estética únicamente** — color, tipografía, espacio, componentes y movimiento.

---

## 0. Cómo leer este documento

Esto define **qué tiene que verse y por qué**. La implementación queda a criterio de quien
escribe el código: nombres de tokens, estructura de componentes, dónde vive cada estilo y qué
utilidades usar son decisiones técnicas, no de marca.

Lo innegociable son los valores concretos que aparecen acá —hex, tamaños, pesos, proporciones,
reglas de uso— y las prohibiciones de la sección 9. Todo lo demás es criterio.

**Sugerencia de implementación** (no obligatoria): definir los valores de las secciones 2, 3
y 4 una sola vez en la capa de tema, y que ningún componente escriba un hex o un píxel a mano.
Si un componente necesita un valor que no está acá, es señal de que falta una definición: se
agrega al sistema, no al componente.

Este documento vive en el repo y se referencia desde `CLAUDE.md` para que se cargue antes de
tocar cualquier UI.

---

## 1. Dirección visual

**Premium, sencillo, limpio.** Las tres palabras se traducen en decisiones concretas, no en
adjetivos:

| Palabra | Qué significa acá |
|---|---|
| **Premium** | Materiales caros, no efectos caros. Tipografía bien ajustada, espaciado generoso, hairlines de 1px, transiciones cortas. Nada de sombras difusas, glows ni brillos. |
| **Sencillo** | Un solo acento por pantalla. Dos formas geométricas en todo el sitio. Tres niveles de superficie, no siete. Si un elemento no comunica algo, se elimina. |
| **Limpio** | El aire es el recurso principal. Los bloques se separan por espacio, no por cajas, líneas ni fondos alternados. |

**El blog no es la plataforma.** La plataforma es densa y transaccional: muchos elementos
compitiendo, todo a mano. El blog es lo contrario: una columna de lectura, mucho respiro, la
marca presente pero sin gritar. La identidad es la misma, el volumen es distinto.

**Regla de sustracción.** Antes de dar un componente por terminado, sacarle un elemento. Si
nadie lo extraña, se queda afuera. Ahí está la diferencia entre "limpio" y "vacío": lo limpio
es lo que quedó después de sacar, no lo que nunca se puso.

**El único ornamento del sistema es la ficha de póker** de la "o" del logotipo. Aparece como
bullet de las listas del artículo y como marca central del divisor de sección. **En ningún
otro lado.** No es un patrón de fondo, no es un ícono decorativo, no se repite.

---

## 2. Color

### 2.1 Institucionales — del manual, no se modifican

| Rol | HEX | RGB | CMYK |
|---|---|---|---|
| **Principal** | `#1258DB` | 18, 88, 219 | 87, 65, 0, 0 |
| Secundario | `#002788` | 0, 39, 126 | 100, 88, 23, 4 |
| Secundario | `#00003C` | 0, 0, 60 | 100, 93, 40, 58 |
| Complementario | `#FC891E` | 252, 137, 30 | 0, 60, 100, 0 |
| Complementario | `#BCC1D3` | 188, 193, 211 | 30, 20, 10, 0 |

El manual fija la jerarquía: **el principal encabeza**, los complementarios son apoyo,
contraste y diferenciación. En el blog eso se traduce en un reparto estricto de funciones —
cada color hace un solo trabajo:

- `#00003C` → fondo. Es la firma cromática del sitio.
- `#1258DB` → superficies de marca y navegación. **Como fondo, no como texto.**
- `#BCC1D3` → texto de lectura.
- `#FC891E` → acción. Nada más.
- `#002788` → profundidad y gradientes.

### 2.2 Derivados — necesarios para un tema oscuro

El manual está pensado para impresión y aplicaciones de marca; una interfaz oscura necesita
escalones intermedios que el manual no define. Estos son los mínimos, y son **derivados, no
institucionales**: no se usan en piezas de marca ni se presentan como paleta oficial.

**Superficies** — tres niveles, no más:

| Nivel | HEX | Uso |
|---|---|---|
| Fondo | `#00003C` | Página |
| Superficie | `#060A46` | Cards, inputs, footer |
| Elevada | `#0C1454` | Hover, dropdowns, barra al scrollear |

**Texto** — tres niveles:

| Nivel | HEX | Uso |
|---|---|---|
| Primario | `#FFFFFF` | Títulos y énfasis |
| Cuerpo | `#BCC1D3` | Párrafos |
| Secundario | `#7F86A4` | Metadatos, epígrafes, legales |

**Interacción:**

| Valor | HEX | Uso |
|---|---|---|
| Azul claro | `#5B8DEF` | Enlaces en línea sobre fondo oscuro |
| Azul oscuro | `#0D47B8` | Hover del botón azul |
| Naranja oscuro | `#E0740F` | Hover del botón naranja |

**Bordes:** `#BCC1D3` al **12%** para bordes de card, al **24%** para divisores y contornos
de elementos interactivos. Siempre 1px. Nunca más gruesos.

### 2.3 Reglas de aplicación

1. **`#1258DB` nunca como texto sobre `#00003C`.** El contraste cae a 3.2:1 y el enlace se
   pierde. Los enlaces en línea van en `#5B8DEF`. El azul principal brilla como fondo.
2. **Texto sobre naranja siempre en `#00003C`, nunca blanco.** Blanco sobre `#FC891E` da
   2.2:1: ilegible en pantalla. *(El lockup "AFILIADOS" del manual usa blanco sobre naranja
   y está bien resuelto a tamaño de logo e impresión, pero no se replica en botones de UI.)*
3. **Un solo elemento naranja visible a la vez.** Si el color de acción compite consigo
   mismo, deja de indicar acción. En una card, el naranja está en el eyebrow o en el botón,
   nunca en ambos.
4. **Prohibido incorporar colores ajenos al sistema** — verdes, violetas, teal, rojos de
   alerta. Los estados de error se resuelven con `#FC891E` más iconografía y texto.
5. **Las superficies no llevan borde y fondo distinto al mismo tiempo.** O se separan por
   elevación, o se separan por hairline. Las dos cosas juntas ensucian.

### 2.4 Gradientes

Tres, y con moderación:

- **De marca**, 135°, `#1258DB → #002788`: bloques de CTA, superficies destacadas puntuales.
- **Profundo**, 180°, `#00003C → #002788`: fondo de hero sin imagen.
- **Velo**, vertical, de `#00003C` opaco abajo a transparente arriba: única forma autorizada
  de poner texto sobre una fotografía.

El manual también define un gradiente claro (`#BCC1D3 → #FFFFFF`) reservado a piezas de fondo
claro; el blog es oscuro y no lo usa.

**El gradiente dorado está reservado al lockup Jugadon VIP.** No aparece en el blog: ni en
botones, ni en badges "premium", ni en texto, ni en bordes.

---

## 3. Tipografía

### 3.1 Familias

| Rol | Familia | Origen |
|---|---|---|
| **Display** | **Pacaembu** (700) | Manual |
| **Utilitaria** | **NV Gourd** | Manual |
| **Cuerpo** | **Archivo** (400 / 500 / 600 + itálicas) | Agregada |

**Por qué hay una tercera familia.** Pacaembu es una display pesada y NV Gourd es extra
condensada: ninguna de las dos sostiene 1.500 palabras de lectura. La marca no tiene
tipografía de texto, así que hay que definirla.

**Por qué una grotesca neutral y no una serif.** Un cuerpo en serif habría dado un aire
editorial con más carácter, pero introduce una tercera voz que compite con la personalidad de
Pacaembu. Para el objetivo de "premium, sencillo y limpio" conviene lo contrario: un cuerpo
silencioso y bien ajustado que deje que los títulos carguen toda la identidad. Archivo
funciona bien en pantalla, tiene familia amplia y su estructura grotesca convive sin fricción
con la geometría del logotipo.

*Si más adelante marca quiere más carácter editorial, la alternativa a evaluar es **Literata**
en 18px/1.75 — se comporta bien sobre fondos oscuros porque no afina las astas.*

**Sugerencia de implementación:** autohospedar las tres en `woff2` con `next/font/local` y
`display: swap`. Confirmar la licencia web de Pacaembu y NV Gourd antes de desplegar.

### 3.2 Escala

| Estilo | Familia | Tamaño | Interlínea | Tracking |
|---|---|---|---|---|
| H1 de artículo | Display 700 | 36 → 60px fluido | 1.05 | −0.025em |
| H1 de sección | Display 700 | 32 → 48px fluido | 1.1 | −0.02em |
| H2 | Display 700 | 26 → 34px fluido | 1.15 | −0.02em |
| H3 | Display 700 | 22px | 1.25 | −0.01em |
| Título de card | Display 700 | 20px | 1.2 | −0.015em |
| Bajada / lead | Cuerpo 400 | 22px | 1.55 | 0 |
| **Cuerpo** | Cuerpo 400 | **18px** | **1.75** | 0 |
| Cita | Cuerpo 400 itálica | 21px | 1.5 | 0 |
| Eyebrow / categoría | Utilitaria 700 MAY | 13px | 1.2 | +0.12em |
| Etiqueta de botón | Utilitaria 700 MAY | 15px | 1 | +0.04em |
| Metadato / epígrafe | Utilitaria 400 | 13px | 1.4 | +0.02em |

**Color por jerarquía:** títulos en blanco, cuerpo en `#BCC1D3`, metadatos en `#7F86A4`. El
eyebrow es el único texto naranja del sistema.

### 3.3 Reglas

- **Pacaembu con moderación.** Nunca en párrafos. Máximo tres apariciones por pantalla. Su
  peso es la voz de la marca; en exceso grita — y gritar rompe lo premium.
- **NV Gourd siempre en mayúsculas y con tracking positivo.** Es condensada: en caja baja y
  sin espaciado se vuelve ilegible a tamaños chicos.
- **Ancho de columna: 68 caracteres.** No se excede nunca, ni en pantallas anchas.
- **Cifras siempre tabulares** — cuotas, porcentajes, fechas, tablas.
- **Sin texto centrado en el cuerpo.** Solo se centran el hero y los bloques de CTA.
- Sin texto sobre gradiente. Sin mayúsculas en títulos largos. Sin subrayados decorativos.

---

## 4. Espacio y geometría

### 4.1 Espacio

Base **4px**. Escala: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160.

El espacio es el material principal de lo premium. Ante la duda entre dos valores, va el
más grande.

| Contexto | Desktop | Móvil |
|---|---|---|
| Separación entre secciones de la home | 128px | 72px |
| Separación entre bloques dentro de una sección | 48px | 32px |
| Padding interno de card | 24px | 20px |
| Gap de grilla | 24px | 20px |
| Margen superior de H2 en el artículo | 56px | 40px |
| Espacio entre párrafos | 1.5em | 1.5em |

### 4.2 Geometría

El manual construye todo con dos formas: **rectángulos rectos** (paños de color, bloques de
logo) y **píldoras totales** (badges AFILIADOS / BENEFICIOS). El sistema respeta esa dualidad
y no inventa una tercera.

| Radio | Uso |
|---|---|
| **0** | Bandas a sangre, paños de color |
| **4px** | Cards, imágenes, inputs, tablas |
| **Píldora** | Botones, tags, avatares |

**Nada intermedio.** Sin 12px, sin 16px, sin 24px: ese salto de escala es exactamente lo que
hace que una interfaz parezca plantilla.

### 4.3 Layout

- Contenedor máximo **1700px**; gutter 24px en desktop, 16px en móvil.
- Columna de lectura **720px**, centrada. Sin sidebar dentro del artículo.
- Grilla de listado: 1 columna en móvil → 2 desde 768px → 3 desde 1024px → 4 desde 1536px.
- Breakpoints estándar (640 / 768 / 1024 / 1280 / 1536).

**El contenedor es 1700px y no 1200px.** Fueron 1200 hasta que la vitrina de
últimos ganadores lo puso a prueba en un monitor ancho: entraban tres columnas y
media de tarjetas y el resto de la pantalla quedaba en aire. La regla de los
1200 venía de la medida de línea legible, y esa razón vale para un párrafo pero
no para una fila de tarjetas — ahí el ancho no cansa la vista, solo decide
cuánto se ve.

La línea de texto sigue protegida por donde corresponde: por la **columna de
lectura de 720px**, que es la que acota el cuerpo del artículo y no se movió.
Son dos límites distintos porque acotan cosas distintas.

**Cómo se aplica esto de acá en adelante:**

- Todo bloque nuevo se maqueta contra el contenedor y queda alineado con el
  resto. Ninguna pantalla define su propio máximo.
- Si algo parece necesitar más ancho, se discute mover el número del sistema.
  **No se agrega una excepción al lado**: una segunda medida de contenedor es
  justo lo que hace que dos secciones no alineen y que nadie sepa cuál manda.
- Los anchos de tarjeta se **derivan** del contenedor y de la grilla, no se
  eligen a ojo: `(1700 − 24×3) / 4 = 407px` la normal, `407×2 + 24 = 838px` la
  ancha. Es lo que hace que una nota se vea del mismo tamaño en la portada y en
  el listado.

---

## 5. Componentes

Descritos por intención y especificación. La estructura del código queda a criterio.

### 5.1 Botones

Píldora. Etiqueta en NV Gourd mayúsculas. Altura 44px (48px en la variante grande), padding
lateral 28px.

| Variante | Reposo | Hover | Cuándo |
|---|---|---|---|
| **Primaria** | Fondo `#FC891E`, texto `#00003C` | Fondo `#E0740F` | Una por pantalla: registro, suscripción |
| **Secundaria** | Fondo `#1258DB`, texto blanco | Fondo `#0D47B8` | Navegación destacada |
| **Terciaria** | Transparente, borde 1px al 24%, texto `#BCC1D3` | Borde `#FC891E`, texto blanco | "Cargar más", filtros |

El hover cambia color, no geometría: sin desplazamientos, sin escalas, sin sombras de color.
Deshabilitado: 40% de opacidad y sin respuesta al hover.

### 5.2 Tag de categoría

Píldora chica: NV Gourd 12px mayúsculas, tracking +0.08em, padding 4×12px. En reposo, fondo
azul al 18% con texto `#5B8DEF` y borde azul al 35%. Seleccionado, fondo `#FC891E` con texto
`#00003C`.

### 5.3 Card de artículo

```
┌───────────────────────────────┐
│                               │
│      imagen 16:9              │
│                               │
├───────────────────────────────┤
│  CATEGORÍA                    │   eyebrow, naranja
│                               │
│  Título en Pacaembu que       │   blanco, máx. 2 líneas
│  puede ocupar dos líneas      │
│                               │
│  12 AGO 2026 · 6 MIN          │   metadato, secundario
└───────────────────────────────┘
```

Fondo de superficie, borde hairline al 12%, radio 4px. **Sin bajada**: título, categoría y
metadato alcanzan — la bajada agrega ruido y obliga a un recorte más. El hover sube el borde
a naranja al 45% y aclara la superficie un escalón; la imagen puede escalar apenas (1.02).
Nada de elevación ni sombra.

Toda la card es clickeable, pero el enlace real es el título.

### 5.4 Hero del artículo

Imagen a sangre con el velo encima, o gradiente profundo si no hay imagen. El contenido se
ancla abajo a la izquierda dentro del contenedor: categoría, H1 de hasta tres líneas, bajada
de hasta dos líneas en 60 caracteres de ancho, y la línea de autor con fecha y tiempo de
lectura separados por punto medio.

La altura no supera el 70% del viewport: el primer párrafo tiene que asomar.

### 5.5 Cuerpo del artículo

- **Los H2 no llevan adorno.** El aire de 56px arriba ya establece la jerarquía; una barra o
  una línea de color sería justamente el elemento que hay que sacar.
- **Los bullets son fichas**: círculo con anillo naranja de 2px y centro transparente, del
  tamaño de la altura de x. Este es el ornamento firma.
- **Listas numeradas solo cuando el orden significa algo** — pasos de un registro, un ranking.
  Cifras en NV Gourd tabular naranja. Si no es secuencia, van bullets.
- **Citas**: borde izquierdo de 2px en `#1258DB`, itálica, texto blanco. Sin comillas
  decorativas gigantes.
- **Enlaces en línea** en `#5B8DEF` con subrayado fino y offset de 3px; en hover pasan a
  naranja.
- **Divisor de sección**: hairline, ficha centrada, hairline. Como máximo dos por artículo.
- **Imágenes** con radio de 4px y epígrafe en NV Gourd secundario, alineado a la izquierda.
- **Tablas**: encabezado en NV Gourd mayúsculas sobre azul al 18%, filas separadas por
  hairline, cifras tabulares. Sin bordes verticales ni filas cebradas.

### 5.6 Firma de autor

Avatar circular de 40px con borde hairline, nombre en cuerpo 600 blanco, rol en NV Gourd
mayúsculas 12px secundario. Fecha y tiempo de lectura separados por punto medio.

### 5.7 Bloque de CTA

Gradiente de marca, radio 4px, padding generoso (48px vertical). Título en Pacaembu blanco,
apoyo en cuerpo `#BCC1D3`, botón primario naranja. **Uno solo por página**, al final.

### 5.8 Navegación

Barra de 72px, fondo transparente al tope y `#00003C` al 85% con desenfoque al scrollear, con
hairline inferior que aparece junto con el fondo. Isologotipo blanco. Ítems en NV Gourd
mayúsculas 14px en `#BCC1D3`; el activo pasa a blanco. **Sin subrayado ni indicador de color**:
el cambio de peso visual alcanza.

### 5.9 Footer

Fondo de superficie, mucho aire. Franja legal inferior separada por hairline: sello **+18**,
logos de los reguladores provinciales y textos de juego responsable en NV Gourd 12px
secundario. Los logos de reguladores van en blanco o gris plano, nunca coloreados con la
paleta ni sobre fondos de color.

---

## 6. Movimiento

| Interacción | Duración |
|---|---|
| Color, borde, opacidad | 150ms |
| Card, imagen | 250ms |
| Entrada al scroll | 400ms |

Curva única para todo el sitio: una ease-out pronunciada, del tipo `cubic-bezier(.2,.8,.2,1)`.

- La entrada al scroll es opacidad más 12px de desplazamiento vertical, una sola vez. Sin
  cascadas encadenadas de veinte elementos.
- **Sin parallax, sin contadores animados, sin partículas, sin loops en bucle.**
- `prefers-reduced-motion` respetado en todo el sitio.

El movimiento premium es el que casi no se nota: confirma una acción, no la anuncia.

---

## 7. Imágenes e iconos

- **Iconos**: un solo set, línea de 1.5px, tamaños 16 / 20 / 24. Sin emojis como iconos.
- **Fotografía**: tratamiento consistente en todo el sitio — saturación levemente reducida y
  viraje frío para que convivan con el azul profundo. 16:9 en cards y hero.
- **Sin imagen disponible**: gradiente profundo con la ficha centrada al 10% de opacidad.
  Nunca un gris plano ni un ícono de placeholder genérico.

---

## 8. Logotipo — usos prohibidos

Del manual, y aplican a todo renderizado del blog, incluidas las imágenes de Open Graph:

1. **No alterar los colores** del logotipo ni de los lockups.
2. **No rotar** el logotipo.
3. **Evitar fondos que dificulten el contraste y la lectura.**
4. **No incorporar colores ajenos al sistema cromático definido.**

Fondos autorizados para el isologotipo blanco: `#00003C`, `#1258DB`, `#002788` y el gradiente
azul. Sobre fondos claros se usa la versión azul del isologotipo.

Los lockups **VIP**, **Afiliados** y **Club de Beneficios** conservan la estructura visual
definida en el manual y no se recomponen ni se reordenan.

---

## 9. Anti-patrones

Rechazar en revisión:

- Radios de 12px o más.
- Glassmorphism, glows, sombras de color, bordes luminosos.
- Gradiente dorado fuera del lockup VIP.
- Más de un elemento naranja compitiendo en la misma vista.
- Verde, violeta, teal o cian en cualquier estado.
- Texto de cuerpo en Pacaembu o NV Gourd.
- Enlaces en `#1258DB` sobre fondo oscuro; texto blanco sobre `#FC891E`.
- Numeración 01 / 02 / 03 en contenido que no es una secuencia real.
- Cards con borde **y** fondo diferenciado a la vez.
- Fondos alternados sección por sección para "separar" — eso lo hace el espacio.
- Secciones con menos de 72px de separación en móvil.
- La ficha usada como decoración fuera de bullets y divisores.

---

## 10. Cómo encarar la remodelación

El proyecto ya tiene la home construida. Orden sugerido para no rehacer trabajo dos veces:

1. **Primero el sistema, después las pantallas.** Definir color, tipografía y espacio antes de
   tocar un componente. Todo lo que hoy tenga valores a mano se migra.
2. **Auditar la home contra la sección 9** y listar cada violación antes de corregir. Suele
   aparecer un patrón repetido —un radio, una sombra, un color de más— que se arregla una vez
   en el sistema y se propaga solo.
3. **Reconstruir de abajo hacia arriba:** botones y tags → card de artículo → grilla →
   navegación y footer → hero. Los componentes chicos se usan dentro de los grandes; al revés
   se rehace todo.
4. **Pasar la regla de sustracción a la home entera** una vez reconstruida: sacar un elemento
   de cada sección y ver qué se extraña.
5. **Revisar en móvil primero.** En 360px se nota si el espaciado es generoso o si
   simplemente había pantalla de sobra.

---

## 11. Checklist por componente

- [ ] Ningún hex ni medida escrita a mano: todo sale del sistema.
- [ ] Funciona de 360px a 1440px sin scroll horizontal.
- [ ] Foco de teclado visible en todo lo interactivo.
- [ ] Hover, activo y deshabilitado definidos explícitamente.
- [ ] Cifras tabulares.
- [ ] Como máximo un elemento naranja en la vista.
- [ ] Le saqué un elemento y no se extraña.
