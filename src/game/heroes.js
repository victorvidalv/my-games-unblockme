/**
 * Héroes y poderes. Los datos (nombre, texto) y las reglas viven juntos aquí; las reglas son
 * funciones puras sobre el objeto `run` (la aventura en curso), sin DOM, y están cubiertas por tests.
 */
import { moveLimit } from '../engine/difficulty.js';

/* Ojo: el identificador interno de Juth sigue siendo 'van' (imágenes heroes/van*.webp y partidas guardadas). Solo cambia el nombre que se ve. */
export const HEROES = [
  { id: 'lia', name: 'Lía', role: 'Portadora de la Brasa', icon: 'heart', color: '#68d8bd', power: 'Turnos de reserva', short: 'Más turnos en cada tablero', detail: 'Cada tablero te da un margen extra de turnos para perdonar los errores pequeños sin quitarte el reto.', quote: '«Incluso la ceniza recuerda el calor.»' },
  { id: 'jean', name: 'Jean', role: 'Vigía del Péndulo', icon: 'clock', color: '#8fb9ff', power: 'Pasos atrás', short: 'Algunos deshacer gratis', detail: 'Desanda tus movimientos sin penalización: un error no tiene por qué costarte el tablero.', quote: '«Todo error deja una grieta por donde volver.»' },
  { id: 'van', name: 'Juth', role: 'Escriba de las Runas', icon: 'stars', color: '#c5a2ff', power: 'Una luz en cada tablero', short: 'Algunas pistas gratis', detail: 'Revela un paso seguro sin gastar tu reserva de pistas.', quote: '«Lo que no se nombra sigue buscando salida.»' },
];

export const heroById = (id) => HEROES.find((h) => h.id === id) || HEROES[0];

/* Los poderes de Jean y Juth crecen con el tablero (su mínimo de movimientos `opt`), así ayudan igual de bien al principio
   y al final sin regalar los niveles fáciles. Valores calibrados con `npm run simulate` (src/game/balance.js). */
export const JEAN_UNDO_SHARE = 0.22; // deshacer gratis = 22 % del mínimo del tablero (Normal)…
export const JEAN_UNDO_MIN = 1;
export const JEAN_UNDO_MAX = 6;      // …entre 1 y 6
export const JUTH_HINT_EVERY = 32;   // pistas gratis = 1 por cada 32 movimientos del mínimo (redondeado)…
export const JUTH_HINT_MAX = 3;      // …entre 1 y 3
/** Qué parte de sus poderes conserva el héroe en cada camino: Normal 100 %, Difícil 75 %, Experto 50 %. */
export const POWER_SCALE = { 1: 1, 50: 0.75, 75: 0.5 };
export const powerScale = (start = 1) => POWER_SCALE[start >= 75 ? 75 : start >= 50 ? 50 : 1];

/** ¿Este tablero lleva pista gratis de Juth? Normal: todos; Difícil: ~9 de cada 10; Experto: ~8 de cada 10 (repartidos de forma pareja). */
export const juthActive = (level = 1, start = 1) => {
  const k = powerScale(start) ** 0.3; // las pistas gratis pesan más que el resto de poderes: se recortan menos
  return Math.floor(level * k + 1e-9) > Math.floor((level - 1) * k + 1e-9);
};

export const freeUndosFor = (opt = 10, start = 1) => {
  const k = powerScale(start);
  return Math.max(JEAN_UNDO_MIN, Math.min(Math.max(1, Math.round(JEAN_UNDO_MAX * k)), Math.round(opt * JEAN_UNDO_SHARE * k)));
};
export const freeHintsFor = (opt = 10, start = 1) => {
  const k = powerScale(start);
  return Math.max(1, Math.min(Math.max(1, Math.round(JUTH_HINT_MAX * k)), Math.round((opt / JUTH_HINT_EVERY) * k)));
};
export const CITY_EVERY = 10; // niveles por ciudad
export const HINT_EVERY = 5; // todos los héroes: +1 pista cada 5 niveles

const isPractice = (mode) => mode === 'p';

/* ───────────── Lía: turnos de reserva (un % más de turnos en cada tablero) ───────────── */

export const LIA_TURNS_SHARE = 0.23; // +23 % del límite de movimientos (calibrado con npm run simulate)
export const LIA_MIN_TURNS = 2;     // y como mínimo 2 turnos

/** Turnos extra que da el héroe sobre un límite base (solo Lía). */
export const bonusTurns = (heroId, baseLimit, start = 1) => {
  if (heroId !== 'lia') return 0;
  const k = powerScale(start);
  return Math.max(Math.max(1, Math.round(LIA_MIN_TURNS * k)), Math.round(baseLimit * LIA_TURNS_SHARE * k));
};

/** Límite de movimientos de un tablero de mínimo `opt` para ese héroe y camino. */
export const heroLimit = (heroId, opt, start = 1, level = 1, brave = false) => {
  const base = moveLimit(opt, start, level, brave);
  return base + bonusTurns(heroId, base, start);
};

/** Foto del tablero para repetirlo desde el principio con 0 movimientos (la usa el revivir). */
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

/* ───────────── Jean: tres pasos atrás gratis por tablero ───────────── */

/** Deshacer gratis que le quedan a Jean en `level` (0 para los demás héroes). */
export function freeUndosLeft(heroId, run, level, opt) {
  if (!run || heroId !== 'jean') return 0;
  const total = freeUndosFor(opt, run.start);
  let used = 0;
  if (run.undoUsedLevel === level) used = Math.max(0, Math.min(total, run.undoUsedCount || 0));
  else if (run.undoUsedAt === level) used = 1; // compatibilidad con partidas guardadas antiguas
  return total - used;
}

/**
 * Aplica un deshacer y devuelve {free, moves}:
 *  - Práctica: siempre gratis (quita el movimiento).
 *  - Jean con deshacer gratis: quita el movimiento y gasta uno de sus tres.
 *  - Resto: deshacer cuenta como 1 movimiento más.
 */
export function applyUndo({ heroId, run, mode, level, moves, opt }) {
  const practice = isPractice(mode);
  const left = freeUndosLeft(heroId, run, level, opt);
  const free = practice || left > 0;
  if (!practice && free) {
    run.undoUsedCount = freeUndosFor(opt, run.start) - left + 1;
    run.undoUsedLevel = level;
    run.undoUsedAt = level;
  }
  return { free, moves: free ? Math.max(0, moves - 1) : moves + 1 };
}

/* ───────────── Pistas: base para todos + pista gratis de Juth ───────────── */

/** Pistas gratis que le quedan a Juth en `level` (0 para los demás héroes). No gastan tu reserva de pistas. */
export function freeHintsLeft(heroId, run, level, opt) {
  if (!run || heroId !== 'van') return 0;
  const total = juthActive(level, run.start) ? freeHintsFor(opt, run.start) : 0;
  const used = run.freeHintLevel === level ? Math.max(0, Math.min(total, run.freeHintCount || 0)) : 0;
  return total - used;
}

/**
 * Gasta una pista: la gratis de Juth si le queda en este tablero; si no, una de la reserva.
 * Devuelve {ok, free}. (ok=false si no hay ninguna.) En Práctica no gasta nada.
 */
export function spendHint({ heroId, run, mode, level, opt }) {
  if (isPractice(mode)) return { ok: true, free: true };
  if (freeHintsLeft(heroId, run, level, opt) > 0) {
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
export const canHint = (heroId, run, mode, level, opt) => isPractice(mode) || freeHintsLeft(heroId, run, level, opt) > 0 || (run.hints || 0) > 0;

/**
 * Pistas ganadas al completar `level`; suma a run.hints y devuelve cuántas.
 * Todos los héroes: +1 cada 5 niveles.
 */
export function clearRewards(heroId, run, level) {
  const gained = level % HINT_EVERY === 0 ? 1 : 0;
  run.hints = (run.hints || 0) + gained;
  return gained;
}
