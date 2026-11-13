/** Puntos base de un nivel según su dificultad. */
export const baseScore = (rating) => 100 + 20 * (rating - 1);

/**
 * Puntos: base × eficiencia (100% en el mínimo, 0% al doble de movimientos).
 * Perfecto (mínimo exacto): +20%. Racha: ×1.1 por cada nivel seguido con ≥90% (máx ×1.5).
 */
export function calcGain(rating, moves, opt, streak) {
  const base = baseScore(rating);
  const eff = Math.max(0, Math.min(1, 1 - (moves - opt) / opt));
  const pts = Math.round(base * eff);
  const perfect = moves <= opt ? Math.round(base * 0.2) : 0;
  const mult = eff >= 0.9 ? 1 + 0.1 * Math.min(5, streak + 1) : 1;
  const total = Math.round((pts + perfect) * mult);
  return { base, eff, pts, perfect, mult, total, lost: Math.round(base * (1 - eff)) };
}

/** Los jefes de ciudad dan un 50 % más de puntos. */
export const BOSS_POINTS = 1.5;

/** Igual que calcGain, más el +10% de la ruta aventurera y el bono de jefe (no cuentan en Práctica). */
export function gainFor(rating, moves, opt, streak, { brave = false, boss = false } = {}) {
  const gain = calcGain(rating, moves, opt, streak);
  gain.routeBonus = brave ? Math.round(gain.total * 0.1) : 0;
  gain.total += gain.routeBonus;
  gain.bossBonus = boss ? Math.round(gain.total * (BOSS_POINTS - 1)) : 0;
  gain.total += gain.bossBonus;
  return gain;
}
