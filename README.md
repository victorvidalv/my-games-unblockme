# SLIDE & SLAY

Un puzle de bloques con tres héroes y cien niveles. Abre el camino entre las diez ciudades de Tri
y devuelve la luz al Faro del Alba. Funciona en el navegador y se puede instalar como app (PWA, también sin conexión).

- **Objetivo:** desliza los bloques y saca la llave roja por la derecha en el menor número de movimientos.
  Un arrastre largo cuenta como **1** movimiento.
- **Límite:** tienes el doble del mínimo en turnos. Al agotarlos sin sacar la llave **ya no se puede mover** y la aventura termina (ganar en el último turno vale).
- **Tres caminos** de 100 niveles: Normal, Difícil y Experto (cambia dónde empieza la dificultad).
- **Tres héroes**, cada uno con un poder (ver [Héroes](#héroes-y-poderes)).

---

## Empezar

Requiere [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run dev        # servidor local con recarga en caliente
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Compila la versión final en `dist/` (incluye el service worker). |
| `npm run preview` | Sirve `dist/` para probar el build (y la instalación PWA). |
| `npm test` | Ejecuta todas las pruebas (motor, banco de niveles, poderes, partidas completas). |
| `npm run lint` | Revisa el código con ESLint. |
| `npm run levels` | Regenera el banco de tableros `src/data/levels.json` (varios minutos). |

## Publicar en GitHub Pages

1. En el repositorio: **Settings → Pages → Build and deployment → Source: _GitHub Actions_**.
2. Haz push a `main`. El workflow [`deploy.yml`](.github/workflows/deploy.yml) ejecuta lint, pruebas y build,
   y publica `dist/` en `https://<usuario>.github.io/<repo>/`.

El workflow define `BASE_PATH=/<repo>/` automáticamente. Si usas un dominio propio en la raíz,
compila con `BASE_PATH=/ npm run build`. Sin `BASE_PATH` se usan rutas relativas (`./`), que valen para cualquier carpeta.

**Versiones y actualizaciones:** no hay que subir ningún número a mano. Cada build con cambios genera un
service worker nuevo; los jugadores ven el aviso «Nueva versión disponible». El número visible en el menú
sale de la versión mayor de `package.json`.

---

## Estructura del proyecto

```
index.html              Marcado de todas las pantallas (menú, tablero, modales). Sin lógica.
vite.config.js          Vite + PWA (manifest, service worker, base para GitHub Pages).
public/                 Arte que se copia tal cual: backgrounds/, heroes/, icons/.
scripts/
  generate-levels.mjs   Genera el banco de tableros (src/data/levels.json) en paralelo.
tests/                  Pruebas con Vitest (ver abajo).
src/
  main.js               Punto de entrada: importa estilos y módulos y abre el menú.
  state.js              Estado compartido (S), guardado en localStorage, caminos, puntos de la jugada.
  dom.js                Atajo $(id).
  sw.js                 Service worker (precaché + aviso de actualización).
  pwa.js                Registro del service worker, instalación, aviso de versión nueva.
  engine/               ★ MOTOR PURO: sin DOM, sin estado global, 100 % probado.
    board.js            Tablero 6×6, codificación de estados, tablero aleatorio, mutación.
    solver.js           BFS exacto: distancia mínima de cada estado a la victoria, pistas.
    difficulty.js       Curva de dificultad, dificultad por nivel/camino, límite de movimientos.
    generator.js        Generador de tableros (determinista, por iteraciones).
    levels.js           Elegir tablero del banco y construir el nivel (mínimo exacto, ajuste adaptativo).
    decorate.js         Añade candados y piezas pesadas a un tablero y comprueba que importan y tienen solución.
    scoring.js          Puntos: eficiencia, perfecto, racha, bono de ruta aventurera y de jefe.
    rules.js            Movimientos restantes, aviso/último/eliminado, victoria.
    rng.js              Pseudoaleatorio con semilla.
  game/
    shop.js             Tienda: precios y compras como funciones puras (turnos extra, pista, rehacer, saltar).
    mechanics.js        Piezas especiales por ciudad, calendario de niveles (normales, mecánica, jefe) y jefes.
    minigames.js        Reglas puras de los minijuegos de descanso (sorteo y premios).
    heroes.js           ★ Héroes y poderes como funciones puras (Lía, Jean, Juth) + recompensas de nivel.
    session.js          Flujo de la aventura: empezar, cargar nivel, ganar, perder, viajar, récord.
  data/
    levels.json         Banco de tableros normales (100 dificultades × 12). Se genera, no se edita.
    special.json        Tableros con muros, candados, piezas pesadas y mixtos (mismas dificultades). Se genera.
    zones.js            Las diez ciudades (colores, nombres).
    story.js            Capítulos, diálogo de los héroes.
  ui/                   Pantallas y efectos (usan el DOM): board, heroes, map, bonus, finale, menu, controls, story, fx,
                        coach (guía y leyenda de piezas), shop (tienda de Don Dublón), turns, result.
  audio/                sound.js (efectos, recuperación del audio), music.js (secuenciador) y themes.js (las melodías).
  styles/               CSS en orden de cascada (01-… a 19-…); main.js los importa en ese orden.
```

Regla de oro: **`src/engine` y `src/game/heroes.js` no tocan el DOM.** Toda regla del juego que se pueda
romper (dificultad, mínimos, puntos, poderes) vive ahí y está cubierta por pruebas; la interfaz solo las llama.

### Estado compartido

`src/state.js` exporta `S = { run, G, busy, lastCfg }`:

- `S.run` — la aventura en curso (nivel, puntos, héroe, pistas…). Se guarda en `localStorage`.
- `S.G` — el tablero activo (piezas, posiciones, movimientos, mínimo, límite).
- `S.busy` — bloquea la interacción durante animaciones.

---

## Cómo funciona el motor

### Tablero y solver

Tablero 6×6; la pieza 0 es la llave roja (horizontal, largo 2, fila 2). Cada estado se codifica como un
número (base 8, una cifra por pieza). `analyze()` explora **toda** la componente alcanzable y hace un BFS desde
las posiciones ganadoras, de modo que conoce la **distancia exacta** (movimientos mínimos) de cada estado.
Por eso el «Mínimo» que ve el jugador y la pista son siempre exactos.

### Dificultad

`rateAt(inicio, nivel)` da una dificultad de 1 a 100 que sube linealmente hasta 100 en el nivel 100
(**Normal** empieza en 1, **Difícil** en 50, **Experto** en 75). `curve(dificultad)` fija el mínimo de movimientos
objetivo con unos puntos de control (entre ellos se interpola) en `src/engine/difficulty.js`:

| Dificultad | Mínimo objetivo | Qué se siente |
|---|---|---|
| 1–10 | 2–3 movimientos | tutorial |
| 20 | 6 | se aprende a planificar |
| 30 | 11 | **en Normal, aquí hay que pensar** |
| 50 | 19 | **donde empieza Difícil** |
| 75 | 29 | **donde empieza Experto** |
| 100 | 37 | desafiante de verdad |

`tests/difficulty.test.js` comprueba esa forma (Normal ≥ 11 en el nivel 30, ≥ 35 al final, Difícil y Experto empiezan
como los niveles 50 y 75 de Normal, nunca bajan ni dan saltos de más de 2 movimientos).

### Piezas especiales

Todas conservan lo que hace fiable al solver: **cada movimiento se puede deshacer**, así que nunca hay estados sin
salida ni atascos imposibles (las pruebas lo verifican sobre todos los bancos).

| Pieza | Qué hace | Cómo se ve |
|---|---|---|
| 🪨 **Roca fija** (muro) | Nunca se mueve ni se empuja | Bloque de piedra con remaches, del color de cada ciudad |
| 🔒 **Candado + placa ▣** | La pieza solo se mueve mientras OTRA cubra la placa del suelo | Rayas y un candado (se abre y brilla); la placa se ilumina |
| ⚓ **Pesada** | Avanza solo 1 casilla por movimiento | Remaches de hierro y una insignia «1 ⇄» |

Cada ciudad usa una mecánica (`CITY_FAMILY` en `src/game/mechanics.js`): los niveles 1-2 son normales, la mecánica aparece
en el 3, 5, 6, 8 y 9 (en el Valle desde el 6, para aprender lo básico) y el **nivel 10 es el jefe**. Los jefes piden 2 movimientos
mínimos más, dan **+50 % de puntos y 2 pistas**, y los de las ciudades 4-10 mezclan las tres piezas.
La primera vez que aparece cada pieza sale un aviso con una mini animación; después, una leyenda bajo el tablero.
Mover un candado o una pieza pesada suena distinto (clic metálico / golpe grave), y las rocas y la placa también tienen su sonido.

### Generación de tableros

`generateBoard()` hace escalada de colina: parte de un tablero aleatorio y va cambiando una pieza mientras la
distancia máxima a la victoria no empeore. Es **determinista** (el presupuesto son iteraciones, no milisegundos)
y exige alcanzar el mínimo objetivo de la dificultad (`minReach`: igual a la curva, y hasta 3 menos en las
dificultades más altas, donde encontrar tableros tan duros es carísimo).

Para que cada nivel esté garantizado y cargue al instante en cualquier móvil, los tableros **se generan antes**:

| Comando | Genera |
|---|---|
| `npm run levels` | `src/data/levels.json`: tableros normales (formato compacto `"h2.2.0 v3.4.1 …"`) |
| `npm run levels:walls` | Tableros con muros (se generan desde cero con los muros dentro: un tablero normal ya está tan apretado que un muro suelto casi siempre lo deja sin solución) |
| `npm run levels:decorate` | Candados, pesadas y mixtos: se añaden a tableros del banco, y **solo se aceptan si el elemento importa** (la solución cuesta más movimientos que sin él) |
| `npm run levels:all` | Todo lo anterior, en orden (decenas de minutos) |

En el juego, `pickBoard()` elige un tablero de la familia que toque según la ciudad y la semilla de la partida (si
falta una familia usa otra), `varyBoard()` crea una variante propia de cada partida y `buildLevel()` escoge el estado inicial:

- **Normal:** distancia = objetivo de la curva + ajuste adaptativo.
- **Adaptativo:** si juegas con ≥ 90 % de eficiencia el ajuste sube (máx. +1 hasta el nivel 10, +2 después);
  si < 40 %, baja (mín. −2).
- **Ruta aventurera** (al terminar una ciudad): la siguiente distancia mayor y +10 % de puntos.
- Siempre dentro de ±3 del objetivo, y el límite de movimientos es el doble del mínimo.

> Si cambias `curve()` o las reglas de generación, ejecuta `npm run levels:all` y `npm test`
> y haz commit de los nuevos `levels.json` y `special.json`.

## Guía para el jugador

Los primeros niveles enseñan jugando (avisos de una sola vez, guardados en `store.tips`): nivel 1 mueve el brillo hasta que
sales; nivel 2 explica Mínimo/Límite/Premio; nivel 3 las ayudas; nivel 4 el poder del héroe; y cada pieza nueva y cada jefe
traen su aviso. No hay pantalla de «Cómo se juega» en el menú principal.

### Puntos

`base = 100 + 20·(dificultad−1)` × eficiencia (100 % en el mínimo, 0 % al doble). Mínimo exacto: +20 %.
Racha: ×1.1 por nivel seguido con ≥ 90 % (máx. ×1.5).

---

## Héroes y poderes

Elegir héroe es permanente durante la aventura. Las reglas están en [`src/game/heroes.js`](src/game/heroes.js).

| Héroe | Poder | Función |
|---|---|---|
| **Lía** | Una segunda oportunidad: repite un tablero al caer, una vez por aventura, sin perder puntos. | `canRescue`, `useRescue` |
| **Jean** | Tres pasos atrás: 3 deshacer gratis por tablero (el movimiento se descuenta). | `freeUndosLeft`, `applyUndo` |
| **Juth** | Dos luces en el camino: +2 pistas al completar cada ciudad (10, 20 … 100). | `clearRewards` |

Reglas comunes: sin poder, deshacer cuesta **+1 movimiento**; todos ganan **+1 pista cada 5 niveles**.
En **Práctica** todo es gratis y no se gasta nada. Los poderes se leen del objeto `run`, así que sobreviven
a recargar la página y a las partidas guardadas antiguas.

---

## Pruebas

`npm test` (Vitest) comprueba:

- **Solver:** mínimos exactos, la pista siempre acorta 1, simetría de movimientos, tableros sin solución.
- **Generador:** determinismo y que alcanza el mínimo objetivo.
- **Banco de niveles:** las 100 dificultades × 12 tableros son válidos, resolubles y alcanzan su objetivo.
- **Construcción de niveles:** el mínimo anunciado es el real para cada ajuste adaptativo y ruta, y crece a lo largo de cada camino.
- **Partida completa:** 3 caminos × 100 niveles jugados de forma óptima; siempre se gana con el mínimo y puntos perfectos.
- **Poderes:** vida única de Lía, tres deshacer de Jean por tablero (y migración de guardados antiguos), bono de Juth sin duplicarse, Práctica sin consumo.
- **Reglas:** movimientos restantes y estados ok / aviso / último / eliminado.

## Tienda

El botón **🛒 Tienda** (junto a Deshacer y Pista) vende ayudas que se pagan con los **puntos de la aventura**: lo que gastas
se resta de tu puntaje, así que cada compra duele. Los precios se miden en «niveles ganados»: un nivel vale 1,5 × los puntos base (lo que da un nivel perfecto con algo de racha) a la dificultad actual, por lo que suben a medida que avanzas y siempre equivalen al mismo esfuerzo. Los precios son **fijos**: no suben al comprar ni dependen de cómo juegues.
Los turnos comprados aparecen como cristales de hielo bajo el medidor, y se «derriten» uno a uno al usarlos. Rehacer rebobina el tablero y saltar nivel lo lanza fuera de la pantalla, ambos con efecto:

| Objeto | Precio | Efecto |
|---|---|---|
| 💡 Pista | 2 niveles | Una pista extra |
| ↺ Rehacer tablero | 2 niveles | Reinicia el tablero con 0 movimientos (conserva los turnos comprados) |
| ⏳ +5 turnos | 8 niveles | Sube 5 el límite de movimientos del tablero |
| ⏭ Saltar nivel | 10 niveles | Pasa al siguiente sin puntos y sin racha |

Si te pasas del límite de movimientos la aventura termina: **no se ofrece comprar turnos al perder**, hay que comprarlos antes.
Toda compra pide confirmación y la lógica está en [`src/game/shop.js`](src/game/shop.js), con pruebas.

La tienda es una escena ilustrada: el vendedor **Don Dublón** (`public/heroes/vendedor.webp`) detrás de su mostrador
(`public/tienda/fondo-tienda.webp`) comenta cada ayuda, se alegra cuando compras y niega con la cabeza si no te alcanza.
Los precios se muestran con su equivalente en niveles.

## Minijuegos de descanso

Cada cinco niveles (desde el 15) hay una parada con un minijuego que regala pistas: **luciérnagas** (toca las luces antes
de que escapen en 10 s: 6 → +1, 12 → +2, 18 → +3; las doradas valen 3), **cartas**, **rueda** y **altar de los ecos**.
Las luciérnagas salen más a menudo (pesos en `src/game/minigames.js`, con pruebas).

## Música

Cada ciudad tiene su propia pieza de 8 compases, con melodía, acordes, bajo y timbres distintos (flauta, silbato, oud,
koto, campanas, trompa…), más un tema para el **menú principal** y otro para la **elección de héroe**. Todo está
escrito como datos en [`src/audio/themes.js`](src/audio/themes.js): cada compás de la melodía es un texto como
`"7:3 9:1 11:4 9:2 7:2 4:4"` (grado de la escala : duración en pasos de 1/16; `r` = silencio) y `prog` da el acorde de cada compás.
Para cambiar una melodía basta con editar ese texto; `tests/music.test.js` comprueba que los compases suman 16, que
los tiempos fuertes caen en notas del acorde y que no hay dos temas iguales. El secuenciador acelera el tempo con los
movimientos gastados y entra en «modo pánico» en el último movimiento.

Las piezas son épicas pero distintas: el campo `epic` (1-3) de cada tema añade capas orquestales —cuerdas, timbal suave, trompas que doblan la melodía, caja y platillo—. El menú y la elección de héroe usan el nivel máximo.

## Guardado

Todo vive en `localStorage` (`desbloquea.rogue.v2` con copia `.bak`; se mantiene entre versiones).
Los récords de cada camino se fusionan tomando el máximo, y la partida en curso se guarda tras cada movimiento.
