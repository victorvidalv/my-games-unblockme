import { WIN_POS } from './board.js';

/** Fracción de turnos restantes (o menos) a partir de la cual se avisa de que quedan pocos. */
export const WARN_FRACTION = 0.2;

/** Movimientos que aún puedes hacer (nunca negativo). Al llegar a 0 sin ganar, la aventura termina: ya no se puede mover. */
export const movesLeft = (moves, limit) => Math.max(0, limit - moves);

/** Sin turnos: se hicieron todos los movimientos permitidos (si no ganaste en el último, pierdes y no puedes mover más). */
export const isOver = (moves, limit) => moves >= limit;

/** Quedan pocos turnos: ≈ 20 % del límite o menos (al menos el aviso salta con 1 restante) y todavía se puede mover. */
export function isLow(moves, limit) {
  const left = limit - moves;
  return left > 0 && left <= Math.max(1, Math.ceil(limit * WARN_FRACTION));
}

/**
 * Estado del contador de movimientos:
 *  'ok' · 'warn' (pocos turnos) · 'last' (te queda UN movimiento: si no ganas con él, terminas) · 'over' (sin turnos).
 */
export function moveStatus(moves, limit) {
  if (isOver(moves, limit)) return 'over';
  if (limit - moves === 1) return 'last';
  if (isLow(moves, limit)) return 'warn';
  return 'ok';
}

/** La llave roja (pieza 0) ha llegado a la salida. */
export const isWon = (pos) => pos[0] === WIN_POS;
