/** Niveles por camino y nivel de dificultad máximo. */
export const MAX_LEVEL = 100;
export const MAX_RATING = 100;

/**
 * Puntos de control nivel → dificultad (1-100) de cada camino (entre ellos se interpola linealmente).
 * La clave es el identificador del camino (1 = Normal, 50 = Difícil, 75 = Experto; no cambia: lo usan los récords guardados).
 *   Normal  : empieza en 2 movimientos y en el nivel 20 ya hay que pensar (11); llega al máximo en el 100.
 *   Difícil : empieza donde Normal ya exige pensar (~12 mov.) y sube mucho más rápido: máximo al llegar al nivel 55.
 *   Experto : empieza en ~21 movimientos y alcanza el máximo (37) en el nivel 40; el resto aprieta el límite de turnos.
 */
export const PATH_CURVES = {
  1: [[1, 1], [20, 30], [45, 55], [70, 78], [100, 100]],
  50: [[1, 35], [25, 65], [55, 100], [100, 100]],
  75: [[1, 55], [20, 85], [40, 100], [100, 100]],
};

/** Dificultad (1-100) del nivel `level` en el camino `start` (1, 50 o 75). */
export function rateAt(start, level) {
  const knots = PATH_CURVES[start >= 75 ? 75 : start >= 50 ? 50 : 1];
  const l = Math.max(1, Math.min(MAX_LEVEL, level));
  for (let i = 1; i < knots.length; i++) {
    const [l1, r1] = knots[i];
    const [l0, r0] = knots[i - 1];
    if (l <= l1) return Math.round(r0 + ((r1 - r0) * (l - l0)) / (l1 - l0));
  }
  return knots[knots.length - 1][1];
}

/**
 * Movimientos mínimos objetivo por dificultad (puntos de control; entre ellos se interpola).
 *   1-20   tutorial suave (2 a 6 movimientos)
 *   30     «hay que pensar» (11)         ← en el camino Normal, nivel 30
 *   50     el Difícil empieza aquí (19)
 *   75     el Experto empieza aquí (29)
 *   100    desafiante de verdad (37)
 */
export const TARGET_KNOTS = [[1, 2], [10, 3], [20, 6], [30, 11], [40, 15], [50, 19], [60, 23], [75, 29], [90, 34], [100, 37]];

export function targetFor(rating) {
  const r = Math.max(1, Math.min(MAX_RATING, rating));
  for (let i = 1; i < TARGET_KNOTS.length; i++) {
    const [r1, t1] = TARGET_KNOTS[i];
    const [r0, t0] = TARGET_KNOTS[i - 1];
    if (r <= r1) return Math.round(t0 + ((t1 - t0) * (r - r0)) / (r1 - r0));
  }
  return TARGET_KNOTS[TARGET_KNOTS.length - 1][1];
}

/**
 * Curva de dificultad de un nivel:
 *  - target: movimientos mínimos objetivo del tablero.
 *  - others: bloques además de la llave roja.
 *  - pLong: probabilidad de bloques largos (3 casillas).
 */
export function curve(rating) {
  const t = (rating - 1) / (MAX_RATING - 1);
  return {
    target: targetFor(rating),
    others: rating <= 3 ? 3 : Math.min(13, 4 + Math.round(9.5 * Math.pow(t, 0.7))),
    pLong: 0.05 + 0.4 * t,
  };
}

/**
 * Distancia mínima que debe alcanzar un tablero para valer en esa dificultad. En las más altas se admiten
 * hasta 3 movimientos menos (encontrar tableros tan duros es carísimo y el juego ya ofrece un margen de ±3).
 */
export const minReach = (rating) => curve(rating).target - (rating > 85 ? 3 : rating > 70 ? 2 : rating > 55 ? 1 : 0);

/** Margen (±) de movimientos mínimos alrededor del objetivo que se ofrece al jugador. */
export const WINDOW = 3;

/** Pistas iniciales según la dificultad del camino (Experto empieza más justo). */
export const startHintsFor = (start = 1) => (start >= 75 ? 2 : 3);

/**
 * Factor de límite de movimientos: empieza holgado y se aprieta hasta el nivel 100, así la dificultad se siente subir.
 *   Normal ×2 → ×1,3 · Difícil ×1,7 → ×1,15 · Experto ×1,5 → ×1,1   (interpolación lineal entre el nivel 1 y el 100)
 */
export const LIMIT_FACTORS = { 1: [2, 1.3], 50: [1.7, 1.15], 75: [1.5, 1.1] };
export const limitFactor = (start = 1, level = 1) => {
  const [from, to] = LIMIT_FACTORS[start >= 75 ? 75 : start >= 50 ? 50 : 1];
  const t = Math.max(0, Math.min(1, (level - 1) / (MAX_LEVEL - 1)));
  return from + (to - from) * t;
};

/** Límite de movimientos permitido para completar un tablero de mínimo `opt` en ese camino y nivel (nivel 1 si no se indica). */
export const moveLimit = (opt, start = 1, level = 1) => Math.max(opt + 2, Math.round(opt * limitFactor(start, level)));
