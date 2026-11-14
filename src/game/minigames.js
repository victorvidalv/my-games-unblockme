/** Reglas puras de los minijuegos de descanso (sin DOM, con pruebas). */

/** Seis minijuegos de descanso; las luciérnagas (activas y rápidas) salen un poco más que los demás. */
export const BONUS_KINDS = ['cards', 'wheel', 'slots', 'catch', 'runes', 'pendulum'];
export const BONUS_WEIGHTS = { catch: 2.5, cards: 2, wheel: 1.5, slots: 2, runes: 2, pendulum: 2 };

/** Elige un minijuego según los pesos (`roll` entre 0 y 1, para poder probarlo). */
export function pickBonusKind(roll = Math.random()) {
  const total = Object.values(BONUS_WEIGHTS).reduce((a, b) => a + b, 0);
  let x = roll * total;
  for (const [k, w] of Object.entries(BONUS_WEIGHTS)) {
    if ((x -= w) < 0) return k;
  }
  return 'cards';
}

/**
 * Premios proporcionales al nivel: el premio MÁXIMO de un minijuego sube de 3 pistas (nivel 15) a 10 (nivel 95).
 * Cada juego define sus premios en «partes» de 0 a 3 (0 = nada, 1 = pequeño, 3 = máximo) y `scalePrize` las convierte.
 */
export const PRIZE_MAX_FIRST = 3;
export const PRIZE_MAX_LAST = 10;
export const maxPrize = (level = 15) => Math.max(PRIZE_MAX_FIRST, Math.min(PRIZE_MAX_LAST, Math.round(PRIZE_MAX_FIRST + ((PRIZE_MAX_LAST - PRIZE_MAX_FIRST) * (level - 15)) / 80)));
export const scalePrize = (part, level = 15) => (part <= 0 ? 0 : Math.max(1, Math.round((part * maxPrize(level)) / 3)));

/**
 * Luciérnagas: 12 s, cada vez más rápidas y más numerosas. Atrapadas (las doradas valen 3, y cada 5 seguidas sin dejar
 * escapar ninguna dan +2) → pistas: 12 → 1, 24 → 2, 36 → 3.
 */
export const CATCH = { duration: 12000, tiers: [12, 24, 36], goldChance: 0.16, goldValue: 3, comboEvery: 5, comboBonus: 2 };
export const catchBase = (score) => (score >= CATCH.tiers[2] ? 3 : score >= CATCH.tiers[1] ? 2 : score >= CATCH.tiers[0] ? 1 : 0);
export const catchPrize = (score, level = 15) => scalePrize(catchBase(score), level);

/** Ritmo según el avance de la partida (p de 0 a 1): tiempo entre apariciones, segundos que tarda en subir y cuántas salen a la vez. */
export const catchPace = (p) => {
  const t = Math.max(0, Math.min(1, p));
  return { delay: Math.round(300 - 140 * t), rise: Math.round((2.5 - 1.0 * t) * 100) / 100, group: t < 0.35 ? 1 : t < 0.75 ? 2 : 3 };
};
/** Puntos extra por llevar `streak` luciérnagas seguidas sin que se escape ninguna. */
export const comboBonus = (streak) => (streak > 0 && streak % CATCH.comboEvery === 0 ? CATCH.comboBonus : 0);

/**
 * Tragaperras interactiva: tres rodillos giran sin parar y tú los paras uno a uno.
 * Cada rodillo recorre 3 símbolos (0, 1, 2) a `msPer` ms por símbolo; al parar se queda en el símbolo más cercano.
 */
export const REEL_SPEEDS = [150, 120, 95];      // ms por símbolo (cada rodillo más rápido que el anterior)
export const reelPosition = (elapsedMs, msPer, start = 0) => start + elapsedMs / msPer;
export const reelStopSymbol = (position) => ((Math.round(position) % 3) + 3) % 3;
/** Premio (en partes) de los tres símbolos: tres iguales 3, dos iguales 1, todos distintos 0. */
export const slotPart = (symbols) => {
  const n = Math.max(...[0, 1, 2].map((i) => symbols.filter((v) => v === i).length));
  return n === 3 ? 3 : n === 2 ? 1 : 0;
};
export const slotPrize = (symbols, level = 15) => scalePrize(slotPart(symbols), level);

/**
 * Runas de memoria: repite la secuencia de runas que se ilumina; cada ronda añade una. Rondas superadas → pistas:
 * 3 → 1 parte, 5 → 2, 7 → 3 (el juego termina con el primer error o a las 8 rondas).
 */
export const RUNES = { start: 2, tiers: [3, 5, 7], maxRounds: 8, count: 4 };
export const runesPart = (rounds) => (rounds >= RUNES.tiers[2] ? 3 : rounds >= RUNES.tiers[1] ? 2 : rounds >= RUNES.tiers[0] ? 1 : 0);
export const runesPrize = (rounds, level = 15) => scalePrize(runesPart(rounds), level);
/** Milisegundos que dura cada runa al mostrarse (más rápido cuanto más avanzas). */
export const runeShowMs = (round) => Math.max(260, 560 - round * 40);

/**
 * Péndulo: 5 lanzamientos; detén la bola dentro de la zona dorada (el centro vale 2, el resto de la zona 1).
 * Cada lanzamiento es más rápido y con la zona más estrecha. Puntos totales (máx. 10) → pistas: 4 → 1 parte, 7 → 2, 9 → 3.
 */
export const PENDULUM = { throws: 5, tiers: [4, 7, 9] };
export const pendulumZone = (i) => Math.max(0.1, 0.28 - 0.035 * i);        // media anchura de la zona (−1 a 1 es todo el recorrido)
export const pendulumPeriod = (i) => Math.max(900, 1700 - 170 * i);       // ms por vaivén completo
export const pendulumPoints = (offset, zone) => (Math.abs(offset) <= zone * 0.3 ? 2 : Math.abs(offset) <= zone ? 1 : 0);
export const pendulumPart = (total) => (total >= PENDULUM.tiers[2] ? 3 : total >= PENDULUM.tiers[1] ? 2 : total >= PENDULUM.tiers[0] ? 1 : 0);
export const pendulumPrize = (total, level = 15) => scalePrize(pendulumPart(total), level);
