import { mulberry32, hash32 } from '../engine/rng.js';
import { curve, rateAt, moveLimit, MAX_LEVEL } from '../engine/difficulty.js';
import { calcGain } from '../engine/scoring.js';
import { FREE_UNDOS, JUTH_FREE_HINTS, HINT_EVERY, CITY_EVERY } from './heroes.js';
import { MAX_REVIVES, REVIVE_SHARE } from './shop.js';

/**
 * Modelo de equilibrio: simula miles de partidas de jugadores de distinta habilidad para medir cuánto ayuda
 * cada poder de héroe y el revivir. NO es el juego real: es un modelo simple y determinista con el que comparar
 * los poderes entre sí. Lo que importa es la comparación entre héroes, no los números absolutos.
 *
 * Modelo de un tablero con mínimo d: el jugador da d movimientos correctos; en cada uno se equivoca con
 * probabilidad err = (1 − habilidad) · MODEL.err · (1 + d/25). Un error son k movimientos erróneos (k ≥ 1, media 2);
 * cada uno cuesta 2 movimientos (el movimiento y deshacerlo), salvo que sea un deshacer gratis de Jean (0).
 * Solo te das cuenta del error a tiempo con probabilidad MODEL.notice; si no, cuesta MODEL.unnoticedCost.
 * Una pista evita el error entero (pero se gasta una pista); el jugador las guarda para tableros duros (d ≥ MODEL.hintMinD).
 * Se pierde al agotar los turnos (el doble del mínimo) sin llegar a la salida.
 */
export const MODEL = {
  err: 0.07,
  notice: 0.7,           // probabilidad de darte cuenta de que un movimiento fue un error y deshacerlo enseguida
  hintAware: 0.65,       // probabilidad de pedir la pista A TIEMPO (antes de equivocarte): una pista solo ayuda si la pides
  unnoticedCost: 3,      // si no te das cuenta, recuperarte cuesta ~3 movimientos (y no se arregla con deshacer gratis)
  hintMinD: 10,
  startHints: 3,
  minigamePrizes: [0, 0, 1, 1, 1, 2, 2, 3],   // premio medio ≈ 1.25 pistas
};

export const HEROES_SIM = ['none', 'lia', 'jean', 'van'];   // «none» = sin poder (referencia)

const isBonusLevel = (level) => level >= 15 && level < 100 && level % 10 === 5;

function playBoard(rng, { skill, d, hints, undos, freeHints = 0 }) {
  const limit = moveLimit(d);
  const err = Math.min(0.85, (1 - skill) * MODEL.err * (1 + d / 25));
  let moves = 0;
  let h = hints;
  let u = undos;
  let f = freeHints;                               // pistas gratis de ESTE tablero (poder de Juth): no gastan tu reserva
  for (let step = 0; step < d; step++) {
    if (rng() < err) {
      if (f > 0 && rng() < MODEL.hintAware) {
        f--;                                       // pista gratis del tablero: evita el error
      } else if (h > 0 && d >= MODEL.hintMinD && rng() < MODEL.hintAware) {
        h--;                                       // la pista evita el error
      } else {
        const k = 1 + Math.floor(Math.log(1 - rng()) / Math.log(0.5)); // 1 + geométrica (media 2)
        for (let j = 0; j < k; j++) {
          if (rng() >= MODEL.notice) moves += MODEL.unnoticedCost;   // no te das cuenta: pierdes más
          else if (u > 0) u--;                                       // deshacer gratis de Jean
          else moves += 2;                                           // movimiento erróneo + deshacerlo
        }
      }
    }
    moves += 1;
    if (moves > limit || (moves >= limit && step < d - 1)) return { ok: false, moves, hints: h };
  }
  return { ok: true, moves, hints: h };
}

/**
 * Simula UNA partida de 100 niveles.
 * @param {object} o
 * @param {string} o.hero        'none' | 'lia' | 'jean' | 'van'
 * @param {number} o.start       dificultad inicial del camino (1, 50, 75)
 * @param {number} o.skill       habilidad 0-1
 * @param {number} o.seed
 * @param {object} [o.powers]   {undos, juthHints, juthFree, juthEvery, lives}: para probar otros valores sin tocar el juego
 * @param {string} [o.revive]    'none' | 'city': comprar un revivir al empezar cada ciudad (desde la 3ª) mientras queden
 * @returns {{cleared:number, score:number, completed:boolean, revivesBought:number}}
 */
export function simulateRun({ hero, start, skill, seed, revive = 'none', powers = {} }) {
  const undosPerBoard = powers.undos ?? FREE_UNDOS;
  const juthHints = powers.juthHints ?? 0;              // (el poder antiguo de Juth: pistas extra por ciudad)
  const lives = powers.lives ?? 1;
  const juthFree = powers.juthFree ?? JUTH_FREE_HINTS;
  const juthEvery = powers.juthEvery ?? 1;           // la pista gratis llega cada N tableros
  const rng = mulberry32(seed);
  let hints = MODEL.startHints + Math.floor(start / 25);
  let score = 0;
  let streak = 0;
  let adj = 0;
  let livesUsed = 0;
  let charges = 0;
  let bought = 0;
  for (let level = 1; level <= MAX_LEVEL; level++) {
    if (revive === 'city' && level % CITY_EVERY === 1 && level > 20 && bought < MAX_REVIVES && score > 0) {
      score -= Math.round(score * REVIVE_SHARE);
      charges++;
      bought++;
    }
    const rating = rateAt(start, level);
    const d = Math.max(1, curve(rating).target + adj);
    let res;
    for (;;) {
      res = playBoard(rng, { skill, d, hints, undos: hero === 'jean' ? undosPerBoard : 0, freeHints: hero === 'van' && level % juthEvery === 0 ? juthFree : 0 });
      hints = res.hints;
      if (res.ok) break;
      if (hero === 'lia' && livesUsed < lives) { livesUsed++; continue; }
      if (charges > 0) { charges--; continue; }
      return { cleared: level - 1, score, completed: false, revivesBought: bought };
    }
    const gain = calcGain(rating, res.moves, d, streak);
    score += gain.total;
    streak = gain.eff >= 0.9 ? streak + 1 : 0;
    adj = Math.max(-2, Math.min(level < 10 ? 1 : 2, adj + (gain.eff >= 0.9 ? 1 : gain.eff < 0.4 ? -1 : 0)));
    if (level % HINT_EVERY === 0) hints++;
    if (hero === 'van' && level % CITY_EVERY === 0) hints += juthHints;
    if (isBonusLevel(level)) hints += MODEL.minigamePrizes[Math.floor(rng() * MODEL.minigamePrizes.length)];
  }
  return { cleared: MAX_LEVEL, score, completed: true, revivesBought: bought };
}

/** Media de `runs` partidas (semillas deterministas) para una combinación héroe/camino/habilidad. */
export function averageRuns({ hero, start, skill, runs = 300, revive = 'none', salt = 0, powers = {} }) {
  let cleared = 0;
  let score = 0;
  let done = 0;
  for (let i = 0; i < runs; i++) {
    // misma semilla para todos los héroes en la misma habilidad/camino: comparación justa (mismos «dados»)
    const r = simulateRun({ hero, start, skill, revive, powers, seed: hash32(i, start, Math.round(skill * 100), salt) });
    cleared += r.cleared;
    score += r.score;
    if (r.completed) done++;
  }
  return { cleared: cleared / runs, score: score / runs, completion: done / runs };
}

export const SKILLS = [0.4, 0.6, 0.8, 0.92];
export const PATHS = [1, 50, 75];

/** Tabla de ayuda: cuántos niveles extra aporta cada héroe frente a no tener poder, por camino y habilidad. */
export function balanceReport({ runs = 300, powers = {} } = {}) {
  const rows = [];
  for (const start of PATHS) {
    for (const skill of SKILLS) {
      const base = averageRuns({ hero: 'none', start, skill, runs, powers });
      const row = { start, skill, base: base.cleared };
      for (const hero of ['lia', 'jean', 'van']) {
        const r = averageRuns({ hero, start, skill, runs, powers });
        row[hero] = r.cleared - base.cleared;
        row[hero + 'Score'] = r.score - base.score;
      }
      rows.push(row);
    }
  }
  return rows;
}
