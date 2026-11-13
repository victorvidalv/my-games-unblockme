import { baseScore } from '../engine/scoring.js';

/**
 * Tienda: se paga con los puntos de la aventura (restan de tu puntaje, así que cuestan de verdad).
 * El precio se mide en «niveles GANADOS»: un nivel vale lo que suele darte un nivel bien jugado
 * (LEVEL_VALUE × los puntos base: un nivel perfecto con algo de racha), no solo los puntos base.
 * Por eso sube a medida que avanzas y siempre equivale al mismo esfuerzo.
 *   Pista            2 niveles
 *   Rehacer tablero  2 niveles
 *   +5 turnos        8 niveles  ← evita que termine la aventura
 *   Saltar nivel    10 niveles
 * Los precios son fijos (no suben al comprar ni dependen de cómo juegues) y caros a propósito:
 * pagar duele en el puntaje y obliga a elegir bien cuándo gastar.
 */
export const EXTRA_MOVES = 5;
/** Lo que vale «un nivel» en la tienda, en múltiplos de los puntos base: perfecto (+20 %) con racha (×1.3). */
export const LEVEL_VALUE = 1.5;

export const SHOP_ITEMS = [
  { id: 'hint', icon: 'hint', name: 'Pista', levels: 2, detail: 'Una pista que te enseña el mejor movimiento.' },
  { id: 'moves', icon: 'hourglass', name: `+${EXTRA_MOVES} turnos`, levels: 8, detail: `Sube ${EXTRA_MOVES} movimientos el límite de este tablero para no perder.` },
  { id: 'redo', icon: 'rewind', name: 'Rehacer tablero', levels: 2, detail: 'Empieza este tablero de cero con 0 movimientos (conservas los turnos comprados).' },
  { id: 'skip', icon: 'skip', name: 'Saltar nivel', levels: 10, detail: 'Pasa al siguiente nivel sin puntos y sin racha.' },
];

export const itemById = (id) => SHOP_ITEMS.find((i) => i.id === id);

/** Precio en puntos de un objeto a la dificultad `rating`. */
export const priceOf = (id, rating) => Math.round(itemById(id).levels * LEVEL_VALUE * baseScore(rating));

/** ¿Se puede usar el objeto ahora mismo? (reason = por qué no) */
export function availability(id, { run, G }) {
  if (!run || !G || G.done) return { ok: false, reason: 'No hay un tablero en juego.' };
  if (run.mode === 'p') return { ok: false, reason: 'En Práctica todo es gratis.' };
  if (id === 'redo' && !G.moves) return { ok: false, reason: 'Aún no has movido nada.' };
  const price = priceOf(id, G.rate);
  if ((run.score || 0) < price) return { ok: false, reason: 'No te alcanzan los puntos.', price };
  return { ok: true, price };
}

/**
 * Compra un objeto: descuenta los puntos y aplica el efecto sobre `run` y `G`.
 * Devuelve {ok, price, reason}. El salto de nivel solo cobra; avanzar lo hace la interfaz.
 */
export function buy(id, { run, G }) {
  const a = availability(id, { run, G });
  if (!a.ok) return a;
  run.score -= a.price;
  run.spent = (run.spent || 0) + a.price;
  if (id === 'hint') run.hints = (run.hints || 0) + 1;
  else if (id === 'moves') {
    G.limit += EXTRA_MOVES;
    G.bought = (G.bought || 0) + EXTRA_MOVES; // turnos comprados: se muestran congelados y se «derriten» al usarse
  }
  else if (id === 'redo') {
    G.pos = G.start.slice();
    G.hist = [];
    G.moves = 0;
  }
  return { ok: true, price: a.price };
}
