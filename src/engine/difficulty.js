/** Niveles por camino y nivel de dificultad máximo. */
export const MAX_LEVEL = 100;
export const MAX_RATING = 100;

/**
 * Dificultad (1-100) del nivel `level` en un camino que empieza en `start`.
 * Sube linealmente hasta 100 en el último nivel.
 */
export const rateAt = (start, level) =>
  Math.round(start + (MAX_RATING - start) * (level - 1) / (MAX_LEVEL - 1));

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

/** Límite de movimientos: el doble del mínimo. */
export const moveLimit = (opt) => opt * 2;
