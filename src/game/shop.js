import { snapshotRescue } from './heroes.js';

import { baseScore } from '../engine/scoring.js';

/**
 * Tienda: se paga con los puntos de la aventura (restan de tu puntaje, así que cuestan de verdad).
 * Los precios son proporcionales: un objeto vale N «niveles» (lo que da un nivel de esa dificultad, `baseScore`) y el camino
 * encarece todo (Normal ×1, Difícil ×1,25, Experto ×1,5). Los turnos comprados también son un % del límite del tablero.
 *   Pista              3 niveles
 *   Rehacer tablero    4 niveles
 *   +turnos pequeño    6 niveles → +10 % del límite (mín. 2)
 *   +turnos grande    10 niveles → +20 % del límite (mín. 3)
 *   Saltar nivel      16 niveles
 * Calibrado con `npm run simulate` (sección Tienda): un jugador que compra a fondo gana ~20 niveles en Normal, ~17 en Difícil
 * y ~8 en Experto (similar a un poder de héroe) pero su puntaje se desploma: ayuda, pero duele.
 */
export const PATH_PRICE = { 1: 1, 50: 1.25, 75: 1.5 };
export const pathPrice = (start = 1) => PATH_PRICE[start >= 75 ? 75 : start >= 50 ? 50 : 1];
/** Revivir al caer (fuera de tienda): cuesta 33 % de tus puntos actuales y solo 1 vez por partida. */
export const REVIVE_SHARE = 0.33;
export const MAX_REVIVES = 1;

export const SHOP_ITEMS = [
  { id: 'hint', icon: 'hint', name: 'Pista', levels: 3, detail: 'Una pista que te enseña el mejor movimiento.' },
  { id: 'moves3', icon: 'hourglass', name: 'Turnos extra', levels: 6, share: 0.1, min: 2, detail: 'Más turnos para este tablero.' },
  { id: 'moves', icon: 'hourglass', name: 'Muchos turnos extra', levels: 10, share: 0.2, min: 3, detail: 'Bastantes más turnos para este tablero.' },
  { id: 'redo', icon: 'rewind', name: 'Rehacer tablero', levels: 4, detail: 'Empieza este tablero de cero con 0 movimientos (conservas los turnos comprados).' },
  { id: 'skip', icon: 'skip', name: 'Saltar nivel', levels: 16, detail: 'Pasa al siguiente nivel sin puntos y sin racha.' },
];

export const itemById = (id) => SHOP_ITEMS.find((i) => i.id === id);

/** Precio en puntos de un objeto: niveles × valor de un nivel de esa dificultad × camino (redondeado a la decena). */
export const priceOf = (id, rating = 1, start = 1) => Math.round((itemById(id).levels * baseScore(rating) * pathPrice(start)) / 10) * 10;

/** Turnos que da un objeto de turnos sobre el límite actual del tablero (0 si no es de turnos). */
export const extraTurns = (id, limit) => {
  const item = itemById(id);
  return item?.share ? Math.max(item.min, Math.round(limit * item.share)) : 0;
};

/** ¿Se puede usar el objeto ahora mismo? (reason = por qué no) */
export function availability(id, { run, G }) {
  if (!run || !G || G.done) return { ok: false, reason: 'No hay un tablero en juego.' };
  if (run.mode === 'p') return { ok: false, reason: 'En Práctica todo es gratis.' };
  if (id === 'redo' && !G.moves) return { ok: false, reason: 'Aún no has movido nada.' };
  const price = priceOf(id, G.rate, run.start);
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
  const item = itemById(id);
  if (id === 'hint') run.hints = (run.hints || 0) + 1;
  else if (item?.share) {
    const moves = extraTurns(id, G.limit);
    G.limit += moves;
    G.bought = (G.bought || 0) + moves; // turnos comprados: se muestran congelados y se «derriten» al usarse
  }
  else if (id === 'redo') {
    G.pos = G.start.slice();
    G.hist = [];
    G.moves = 0;
  }
  return { ok: true, price: a.price };
}

/** Costo en puntos (33 %) de revivir tras perder con `score` puntos actuales. */
export const reviveCost = (score = 0) => Math.round(Math.max(0, score || 0) * REVIVE_SHARE);

/** ¿Puede revivir pagando el 33 % de sus puntos actuales? (una sola vez por aventura, nunca en Práctica). */
export const canPaidRevive = (run, mode = run?.mode) =>
  !!run && mode !== 'p' && (run.revivesBought || 0) < MAX_REVIVES && reviveCost(run.score) > 0;

/** Cobra el 33 % de los puntos actuales y marca el único revivir de la partida. */
export function payRevive(run) {
  if (!canPaidRevive(run)) return { ok: false, cost: 0 };
  const cost = reviveCost(run.score);
  run.score -= cost;
  run.spent = (run.spent || 0) + cost;
  run.revivesBought = (run.revivesBought || 0) + 1;
  return { ok: true, cost };
}

/** ¿Tienes un revivir guardado? (compatibilidad con partidas guardadas antiguas). */
export const hasRevive = (run) => (run?.revive || 0) > 0;

/** Gasta un revivir guardado y prepara el tablero para repetirlo desde el principio. */
export function useRevive(run, G) {
  run.revive = Math.max(0, (run.revive || 0) - 1);
  run.rescue = { ...snapshotRescue(G), kind: 'revive' };
}
