/**
 * Héroes y poderes. Los datos (nombre, texto) y las reglas viven juntos aquí; las reglas son
 * funciones puras sobre el objeto `run` (la aventura en curso), sin DOM, y están cubiertas por tests.
 */
/* Ojo: el identificador interno de Juth sigue siendo 'van' (imágenes heroes/van*.webp y partidas guardadas). Solo cambia el nombre que se ve. */
export const HEROES = [
  { id: 'lia', name: 'Lía', role: 'Portadora de la Brasa', icon: 'heart', color: '#68d8bd', power: 'Una segunda oportunidad', short: '1 vida extra por partida', detail: 'Resiste una caída y vuelve a intentar el tablero sin perder tus puntos.', quote: '«Incluso la ceniza recuerda el calor.»' },
  { id: 'jean', name: 'Jean', role: 'Vigía del Péndulo', icon: 'clock', color: '#8fb9ff', power: 'Tres pasos atrás', short: '3 deshacer gratis por tablero', detail: 'Desanda tus tres últimos movimientos sin penalización, uno a uno.', quote: '«Todo error deja una grieta por donde volver.»' },
  { id: 'van', name: 'Juth', role: 'Escriba de las Runas', icon: 'stars', color: '#c5a2ff', power: 'Una luz en cada tablero', short: '1 pista gratis por tablero', detail: 'Revela un paso seguro en cada tablero sin gastar tu reserva de pistas.', quote: '«Lo que no se nombra sigue buscando salida.»' },
];

export const heroById = (id) => HEROES.find((h) => h.id === id) || HEROES[0];

export const FREE_UNDOS = 3; // Jean: deshacer gratis por tablero
export const JUTH_FREE_HINTS = 1; // Juth: pistas gratis por tablero (equilibrado con simulaciones: ver src/game/balance.js)
export const CITY_EVERY = 10; // niveles por ciudad
export const HINT_EVERY = 5; // todos los héroes: +1 pista cada 5 niveles

const isPractice = (mode) => mode === 'p';

/* ───────────── Lía: una segunda oportunidad por aventura ───────────── */

/** ¿Puede Lía salvarte al caer? (una vez por aventura; no aplica en Práctica, donde no se pierde) */
export const canRescue = (heroId, run, mode) => heroId === 'lia' && !isPractice(mode) && !run.lifeUsed;

/** Foto del tablero para repetirlo desde el principio con 0 movimientos (la usan Lía y el revivir comprado). */
export function snapshotRescue(G) {
  return {
    level: G.n,
    rate: G.rate,
    pieces: G.pieces.map((p) => ({ ...p })),
    walls: (G.walls || []).map((w) => w.slice()),
    start: G.start.slice(),
    opt: G.opt,
  };
}

/** Gasta la vida extra de Lía y guarda el tablero para repetirlo. */
export function useRescue(run, G) {
  run.lifeUsed = true;
  run.rescue = { ...snapshotRescue(G), kind: 'lia' };
}

/* ───────────── Jean: tres pasos atrás gratis por tablero ───────────── */

/** Deshacer gratis que le quedan a Jean en `level` (0 para los demás héroes). */
export function freeUndosLeft(heroId, run, level) {
  if (!run || heroId !== 'jean') return 0;
  let used = 0;
  if (run.undoUsedLevel === level) used = Math.max(0, Math.min(FREE_UNDOS, run.undoUsedCount || 0));
  else if (run.undoUsedAt === level) used = 1; // compatibilidad con partidas guardadas antiguas
  return FREE_UNDOS - used;
}

/**
 * Aplica un deshacer y devuelve {free, moves}:
 *  - Práctica: siempre gratis (quita el movimiento).
 *  - Jean con deshacer gratis: quita el movimiento y gasta uno de sus tres.
 *  - Resto: deshacer cuenta como 1 movimiento más.
 */
export function applyUndo({ heroId, run, mode, level, moves }) {
  const practice = isPractice(mode);
  const left = freeUndosLeft(heroId, run, level);
  const free = practice || left > 0;
  if (!practice && free) {
    run.undoUsedCount = FREE_UNDOS - left + 1;
    run.undoUsedLevel = level;
    run.undoUsedAt = level;
  }
  return { free, moves: free ? Math.max(0, moves - 1) : moves + 1 };
}

/* ───────────── Pistas: base para todos + pista gratis de Juth ───────────── */

/** Pistas gratis que le quedan a Juth en `level` (0 para los demás héroes). No gastan tu reserva de pistas. */
export function freeHintsLeft(heroId, run, level) {
  if (!run || heroId !== 'van') return 0;
  const used = run.freeHintLevel === level ? Math.max(0, Math.min(JUTH_FREE_HINTS, run.freeHintCount || 0)) : 0;
  return JUTH_FREE_HINTS - used;
}

/**
 * Gasta una pista: la gratis de Juth si le queda en este tablero; si no, una de la reserva.
 * Devuelve {ok, free}. (ok=false si no hay ninguna.) En Práctica no gasta nada.
 */
export function spendHint({ heroId, run, mode, level }) {
  if (isPractice(mode)) return { ok: true, free: true };
  if (freeHintsLeft(heroId, run, level) > 0) {
    run.freeHintCount = (run.freeHintLevel === level ? run.freeHintCount || 0 : 0) + 1;
    run.freeHintLevel = level;
    return { ok: true, free: true };
  }
  if ((run.hints || 0) > 0) {
    run.hints--;
    return { ok: true, free: false };
  }
  return { ok: false, free: false };
}

/** ¿Se puede pedir una pista ahora? (gratis o de la reserva) */
export const canHint = (heroId, run, mode, level) => isPractice(mode) || freeHintsLeft(heroId, run, level) > 0 || (run.hints || 0) > 0;

/**
 * Pistas ganadas al completar `level`; suma a run.hints y devuelve cuántas.
 * Todos los héroes: +1 cada 5 niveles.
 */
export function clearRewards(heroId, run, level) {
  const gained = level % HINT_EVERY === 0 ? 1 : 0;
  run.hints = (run.hints || 0) + gained;
  return gained;
}
