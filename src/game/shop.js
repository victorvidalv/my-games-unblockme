import { snapshotRescue } from './heroes.js';

/**
 * Tienda: se paga con los puntos de la aventura (restan de tu puntaje, así que cuestan de verdad).
 * Precios fijos:
 *   Pista             500 puntos
 *   Rehacer tablero 1.500 puntos
 *   +3 turnos       3.000 puntos
 *   +5 turnos       4.500 puntos
 *   Saltar nivel    6.000 puntos
 */
export const EXTRA_MOVES_3 = 3;
export const EXTRA_MOVES = 5;
/** Revivir al caer (fuera de tienda): cuesta 33 % de tus puntos actuales y solo 1 vez por partida. */
export const REVIVE_SHARE = 0.33;
export const MAX_REVIVES = 1;

export const SHOP_ITEMS = [
  { id: 'hint', icon: 'hint', name: 'Pista', price: 500, detail: 'Una pista que te enseña el mejor movimiento.' },
  { id: 'moves3', icon: 'hourglass', name: `+${EXTRA_MOVES_3} turnos`, moves: EXTRA_MOVES_3, price: 3000, detail: `Sube ${EXTRA_MOVES_3} movimientos el límite de este tablero para no perder.` },
  { id: 'moves', icon: 'hourglass', name: `+${EXTRA_MOVES} turnos`, moves: EXTRA_MOVES, price: 4500, detail: `Sube ${EXTRA_MOVES} movimientos el límite de este tablero para no perder.` },
  { id: 'redo', icon: 'rewind', name: 'Rehacer tablero', price: 1500, detail: 'Empieza este tablero de cero con 0 movimientos (conservas los turnos comprados).' },
  { id: 'skip', icon: 'skip', name: 'Saltar nivel', price: 6000, detail: 'Pasa al siguiente nivel sin puntos y sin racha.' },
];

export const itemById = (id) => SHOP_ITEMS.find((i) => i.id === id);

/** Precio en puntos de un objeto de la tienda. */
export const priceOf = (id) => itemById(id).price;

/** ¿Se puede usar el objeto ahora mismo? (reason = por qué no) */
export function availability(id, { run, G }) {
  if (!run || !G || G.done) return { ok: false, reason: 'No hay un tablero en juego.' };
  if (run.mode === 'p') return { ok: false, reason: 'En Práctica todo es gratis.' };
  if (id === 'redo' && !G.moves) return { ok: false, reason: 'Aún no has movido nada.' };
  const price = priceOf(id);
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
  else if (item?.moves) {
    G.limit += item.moves;
    G.bought = (G.bought || 0) + item.moves; // turnos comprados: se muestran congelados y se «derriten» al usarse
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
