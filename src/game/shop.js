import { baseScore } from '../engine/scoring.js';
import { snapshotRescue } from './heroes.js';

/**
 * Tienda: se paga con los puntos de la aventura (restan de tu puntaje, así que cuestan de verdad).
 * La pista cuesta siempre 900 puntos. Los demás precios se miden en «niveles GANADOS»:
 * un nivel vale lo que suele darte un nivel bien jugado
 * (LEVEL_VALUE × los puntos base: un nivel perfecto con algo de racha), no solo los puntos base.
 * Por eso sube a medida que avanzas y siempre equivale al mismo esfuerzo.
 *   Pista            900 puntos fijos
 *   Rehacer tablero  2 niveles
 *   +5 turnos        8 niveles  ← evita que termine la aventura
 *   Saltar nivel    10 niveles
 * Los precios no suben al comprar ni dependen de cómo juegues y son caros a propósito:
 * pagar duele en el puntaje y obliga a elegir bien cuándo gastar.
 */
export const EXTRA_MOVES = 5;
/** Revivir: cuesta la mitad de tus puntos actuales (¡duele!) y como máximo 2 por partida. */
export const REVIVE_SHARE = 0.5;
export const MAX_REVIVES = 2;
/** Lo que vale «un nivel» en la tienda, en múltiplos de los puntos base: perfecto (+20 %) con racha (×1.3). */
export const LEVEL_VALUE = 1.5;

export const SHOP_ITEMS = [
  { id: 'hint', icon: 'hint', name: 'Pista', price: 900, detail: 'Una pista que te enseña el mejor movimiento.' },
  { id: 'moves', icon: 'hourglass', name: `+${EXTRA_MOVES} turnos`, levels: 8, detail: `Sube ${EXTRA_MOVES} movimientos el límite de este tablero para no perder.` },
  { id: 'redo', icon: 'rewind', name: 'Rehacer tablero', levels: 2, detail: 'Empieza este tablero de cero con 0 movimientos (conservas los turnos comprados).' },
  { id: 'skip', icon: 'skip', name: 'Saltar nivel', levels: 10, detail: 'Pasa al siguiente nivel sin puntos y sin racha.' },
  { id: 'revive', icon: 'flame', name: 'Revivir', share: REVIVE_SHARE, detail: `Si pierdes, repites ese tablero. Cuesta el ${Math.round(REVIVE_SHARE * 100)} % de tus puntos; máximo ${MAX_REVIVES} por partida.` },
];

export const itemById = (id) => SHOP_ITEMS.find((i) => i.id === id);

/** Precio en puntos de un objeto a la dificultad `rating` (el revivir depende de tus puntos actuales `score`). */
export const priceOf = (id, rating, score = 0) => {
  const item = itemById(id);
  if (item.share) return Math.round(score * item.share);
  return item.price ?? Math.round(item.levels * LEVEL_VALUE * baseScore(rating));
};

/** ¿Se puede usar el objeto ahora mismo? (reason = por qué no) */
export function availability(id, { run, G }) {
  if (!run || !G || G.done) return { ok: false, reason: 'No hay un tablero en juego.' };
  if (run.mode === 'p') return { ok: false, reason: 'En Práctica todo es gratis.' };
  if (id === 'redo' && !G.moves) return { ok: false, reason: 'Aún no has movido nada.' };
  if (id === 'revive' && (run.revivesBought || 0) >= MAX_REVIVES) return { ok: false, reason: `Ya compraste tus ${MAX_REVIVES} revivir de esta partida.` };
  const price = priceOf(id, G.rate, run.score || 0);
  if (id === 'revive' && price <= 0) return { ok: false, reason: 'No tienes puntos que pagar.', price };
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
  else if (id === 'revive') {
    run.revive = (run.revive || 0) + 1;           // cargas guardadas: se gastan solas al perder
    run.revivesBought = (run.revivesBought || 0) + 1;
  }
  else if (id === 'redo') {
    G.pos = G.start.slice();
    G.hist = [];
    G.moves = 0;
  }
  return { ok: true, price: a.price };
}

/** ¿Tienes un revivir guardado? */
export const hasRevive = (run) => (run?.revive || 0) > 0;

/** Gasta un revivir y guarda el tablero para repetirlo desde el principio (como la segunda vida de Lía). */
export function useRevive(run, G) {
  run.revive = Math.max(0, (run.revive || 0) - 1);
  run.rescue = { ...snapshotRescue(G), kind: 'revive' };
}
