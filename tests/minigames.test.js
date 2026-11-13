import { describe, it, expect } from 'vitest';
import { BONUS_WEIGHTS, pickBonusKind, catchPrize } from '../src/game/minigames.js';

describe('minijuegos', () => {
  it('cada minijuego tiene probabilidad y las luciérnagas salen más que los demás', () => {
    expect(Object.keys(BONUS_WEIGHTS).sort()).toEqual(['cards', 'catch', 'slots', 'wheel']);
    for (const w of Object.values(BONUS_WEIGHTS)) expect(w).toBeGreaterThan(0);
    expect(BONUS_WEIGHTS.catch).toBeGreaterThan(BONUS_WEIGHTS.wheel);
    expect(BONUS_WEIGHTS.catch).toBeGreaterThanOrEqual(BONUS_WEIGHTS.cards);
  });
  it('el sorteo respeta los pesos y siempre devuelve un minijuego válido', () => {
    const counts = { cards: 0, catch: 0, wheel: 0, slots: 0 };
    const N = 20000;
    for (let i = 0; i < N; i++) counts[pickBonusKind(i / N)]++;
    const total = Object.values(BONUS_WEIGHTS).reduce((a, b) => a + b, 0);
    for (const k of Object.keys(counts)) expect(counts[k] / N).toBeCloseTo(BONUS_WEIGHTS[k] / total, 1);
    expect(pickBonusKind(0.9999999)).toBeTruthy();
  });
  it('luciérnagas: 6 → 1 pista, 12 → 2, 18 → 3, menos de 6 → ninguna', () => {
    expect([0, 5, 6, 11, 12, 17, 18, 40].map(catchPrize)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
  it('el premio esperado es parecido al de las cartas (≈1,3 pistas) para un jugador normal', () => {
    // un jugador que caza entre 8 y 16 luciérnagas se lleva de 1 a 2 pistas
    const avg = [8, 10, 12, 14, 16].map(catchPrize).reduce((a, b) => a + b, 0) / 5;
    expect(avg).toBeGreaterThan(1);
    expect(avg).toBeLessThan(2.1);
  });
});
