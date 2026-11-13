/**
 * Héroes y poderes. Los datos (nombre, texto) y las reglas viven juntos aquí; las reglas son
 * funciones puras sobre el objeto `run` (la aventura en curso), sin DOM, y están cubiertas por tests.
 */
/* Ojo: el identificador interno de Juth sigue siendo 'van' (imágenes heroes/van*.webp y partidas guardadas). Solo cambia el nombre que se ve. */
export const HEROES = [
  { id: 'lia', name: 'Lía', role: 'Exploradora', icon: '♥', color: '#68d8bd', power: 'Una segunda oportunidad', short: '1 vida extra por partida', detail: 'Repite un tablero al caer. Una vez por aventura, sin perder tus puntos.', quote: '«Si la puerta no abre, buscamos otra.»' },
  { id: 'jean', name: 'Jean', role: 'Relojero', icon: '↶', color: '#8fb9ff', power: 'Tres pasos atrás', short: '3 deshacer gratis por tablero', detail: 'Recupera tus tres últimos movimientos sin penalización, uno a uno.', quote: '«Voy tarde. El tiempo, también.»' },
  { id: 'van', name: 'Juth', role: 'Cronista', icon: '✦', color: '#c5a2ff', power: 'Dos luces en el camino', short: '+2 pistas cada 10 niveles', detail: 'Dos pistas extra al completar cada ciudad.', quote: '«Primero observo. Luego abro.»' },
];

export const heroById = (id) => HEROES.find((h) => h.id === id) || HEROES[0];

export const FREE_UNDOS = 3; // Jean: deshacer gratis por tablero
export const JUTH_HINTS = 2; // Juth: pistas extra por ciudad
export const CITY_EVERY = 10; // niveles por ciudad
export const HINT_EVERY = 5; // todos los héroes: +1 pista cada 5 niveles

const isPractice = (mode) => mode === 'p';

/* ───────────── Lía: una segunda oportunidad por aventura ───────────── */

/** ¿Puede Lía salvarte al caer? (una vez por aventura; no aplica en Práctica, donde no se pierde) */
export const canRescue = (heroId, run, mode) => heroId === 'lia' && !isPractice(mode) && !run.lifeUsed;

/** Gasta la vida extra y guarda el tablero para repetirlo desde el principio con 0 movimientos. */
export function useRescue(run, G) {
  run.lifeUsed = true;
  run.rescue = {
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

/* ───────────── Pistas: base para todos + Juth ───────────── */

/**
 * Pistas ganadas al completar `level`; suma a run.hints y devuelve cuántas.
 * Todos: +1 cada 5 niveles. Juth: +2 al completar cada ciudad (10, 20, …), una sola vez por ciudad.
 */
export function clearRewards(heroId, run, level) {
  let gained = 0;
  if (level % HINT_EVERY === 0) gained += 1;
  if (heroId === 'van' && level % CITY_EVERY === 0 && (run.vanAwardedAt || 0) < level) {
    gained += JUTH_HINTS;
    run.vanAwardedAt = level;
  }
  run.hints = (run.hints || 0) + gained;
  return gained;
}
