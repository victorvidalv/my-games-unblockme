/** Reglas puras de los minijuegos de descanso (sin DOM, con pruebas). */

/** Qué minijuego toca: las luciérnagas (activo y rápido) salen más que los demás. */
export const BONUS_WEIGHTS = { catch: 4, cards: 3, wheel: 1.5, slots: 1.5 };

/** Elige un minijuego según los pesos (`roll` entre 0 y 1, para poder probarlo). */
export function pickBonusKind(roll = Math.random()) {
  const total = Object.values(BONUS_WEIGHTS).reduce((a, b) => a + b, 0);
  let x = roll * total;
  for (const [k, w] of Object.entries(BONUS_WEIGHTS)) {
    if ((x -= w) < 0) return k;
  }
  return 'cards';
}

/** Luciérnagas atrapadas → pistas: 6 → 1, 12 → 2, 18 → 3. */
export const catchPrize = (score) => (score >= 18 ? 3 : score >= 12 ? 2 : score >= 6 ? 1 : 0);
