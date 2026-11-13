import { WIN_POS } from './board.js';

/** Aviso cuando se ha gastado esta fracción del límite de movimientos. */
export const WARN_AT = 0.8;

/** Movimientos que quedan antes de quedar eliminado (nunca negativo). */
export const movesLeft = (moves, limit) => Math.max(0, limit - moves);

/**
 * Estado del contador de movimientos:
 *  'ok' · 'warn' (≥80% del límite) · 'last' (el siguiente movimiento elimina) · 'over' (superado: eliminado).
 */
export function moveStatus(moves, limit) {
  if (moves > limit) return 'over';
  if (moves === limit) return 'last';
  if (moves >= limit * WARN_AT) return 'warn';
  return 'ok';
}

/** La llave roja (pieza 0) ha llegado a la salida. */
export const isWon = (pos) => pos[0] === WIN_POS;
