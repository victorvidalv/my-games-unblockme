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
 * Curva de dificultad: suave al inicio (tutorial), exigente al final.
 * Con t^1.35: dificultad 1-10 → 2 a 3 movimientos, 20 → 5, 50 → 14, 100 → 32.
 *  - target: movimientos mínimos objetivo del tablero.
 *  - others: bloques además de la llave roja.
 *  - pLong: probabilidad de bloques largos (3 casillas).
 */
export function curve(rating) {
  const t = (rating - 1) / (MAX_RATING - 1);
  const e = Math.pow(t, 1.35);
  return {
    target: Math.round(2 + 30 * e),
    others: rating <= 3 ? 3 : Math.min(13, 4 + Math.round(9 * Math.pow(t, 0.8))),
    pLong: 0.05 + 0.4 * t,
  };
}

/** Distancia mínima aceptable que debe alcanzar un tablero para considerarse válido en esa dificultad. */
export const minReach = (rating) => curve(rating).target;

/** Margen (±) de movimientos mínimos alrededor del objetivo que se ofrece al jugador. */
export const WINDOW = 3;

/** Límite de movimientos: el doble del mínimo. */
export const moveLimit = (opt) => opt * 2;
