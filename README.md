# SLIDE & SLAY

Un puzle de bloques con tres héroes y cien niveles. Abre el camino entre las diez ciudades de Tri
y devuelve la luz al Faro del Alba. Funciona en el navegador y se puede instalar como app (PWA, también sin conexión).

- **Objetivo:** desliza los bloques y saca la llave roja por la derecha en el menor número de movimientos.
  Un arrastre largo cuenta como **1** movimiento.
- **Límite:** si superas el doble del mínimo, la aventura termina.
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
    scoring.js          Puntos: eficiencia, perfecto, racha, bono de ruta aventurera.
    rules.js            Movimientos restantes, aviso/último/eliminado, victoria.
    rng.js              Pseudoaleatorio con semilla.
  game/
    heroes.js           ★ Héroes y poderes como funciones puras (Lía, Jean, Van) + recompensas de nivel.
    session.js          Flujo de la aventura: empezar, cargar nivel, ganar, perder, viajar, récord.
  data/
    levels.json         Banco de tableros precalculados (100 dificultades × 12). Se genera, no se edita.
    zones.js            Las diez ciudades (colores, nombres).
    story.js            Capítulos, diálogo de los héroes.
  ui/                   Pantallas y efectos (usan el DOM): board, heroes, map, bonus, finale, menu, controls, story, fx.
  audio/                sound.js (efectos, recuperación del audio), music.js (secuenciador) y themes.js (las melodías).
  styles/               CSS en orden de cascada (01-… a 15-…); main.js los importa en ese orden.
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
(Normal empieza en 1, Difícil en 50, Experto en 75). `curve(dificultad)` fija:

| Dificultad | Mínimo objetivo | Bloques |
|---|---|---|
| 1–10 | 2–3 movimientos | 4–7 |
| 20 | 5 | 8 |
| 50 | 14 | 11 |
| 100 | 32 | 14 |

### Generación de tableros

`generateBoard()` hace escalada de colina: parte de un tablero aleatorio y va cambiando una pieza mientras la
distancia máxima a la victoria no empeore. Es **determinista** (el presupuesto son iteraciones, no milisegundos)
y exige alcanzar el mínimo objetivo de la dificultad.

Para que cada nivel esté garantizado y cargue al instante en cualquier móvil, los tableros **se generan antes**
(`npm run levels`) y se guardan en `src/data/levels.json` (formato compacto: `"h2.2.0 v3.4.1 …"` = orientación,
largo, fila/columna fija, posición). En el juego, `pickBoard()` elige uno según la semilla de la partida y
`buildLevel()` escoge el estado inicial con el mínimo adecuado:

- **Normal:** distancia = objetivo de la curva + ajuste adaptativo.
- **Adaptativo:** si juegas con ≥ 90 % de eficiencia el ajuste sube (máx. +1 hasta el nivel 10, +2 después);
  si < 40 %, baja (mín. −2).
- **Ruta aventurera** (al terminar una ciudad): la siguiente distancia mayor y +10 % de puntos.
- Siempre dentro de ±3 del objetivo, y el límite de movimientos es el doble del mínimo.

> Si cambias `curve()` o las reglas de generación, ejecuta `npm run levels` y `npm test`
> y haz commit del nuevo `levels.json`.

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
| **Van** | Dos luces en el camino: +2 pistas al completar cada ciudad (10, 20 … 100). | `clearRewards` |

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
- **Poderes:** vida única de Lía, tres deshacer de Jean por tablero (y migración de guardados antiguos), bono de Van sin duplicarse, Práctica sin consumo.
- **Reglas:** movimientos restantes y estados ok / aviso / último / eliminado.

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
