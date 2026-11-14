import { describe, it, expect } from 'vitest';
import { BONUS_WEIGHTS, pickBonusKind, catchPrize, catchPace, comboBonus, CATCH, reelPosition, reelStopSymbol, slotPrize, slotPart, REEL_SPEEDS, maxPrize, scalePrize, BONUS_KINDS, runesPart, runesPrize, runeShowMs, pendulumZone, pendulumPeriod, pendulumPoints, pendulumPart, pendulumPrize, PENDULUM, RUNES } from '../src/game/minigames.js';

describe('minijuegos', () => {
  it('cada minijuego tiene probabilidad y las luciérnagas salen más que los demás', () => {
    expect(Object.keys(BONUS_WEIGHTS).sort()).toEqual(['cards', 'catch', 'pendulum', 'runes', 'slots', 'wheel']);
    expect(BONUS_KINDS).toHaveLength(6);
    for (const w of Object.values(BONUS_WEIGHTS)) expect(w).toBeGreaterThan(0);
    expect(BONUS_WEIGHTS.catch).toBeGreaterThan(BONUS_WEIGHTS.wheel);
    expect(BONUS_WEIGHTS.catch).toBeGreaterThanOrEqual(BONUS_WEIGHTS.cards);
  });
  it('el sorteo respeta los pesos y siempre devuelve un minijuego válido', () => {
    const counts = { cards: 0, catch: 0, wheel: 0, slots: 0, runes: 0, pendulum: 0 };
    const N = 20000;
    for (let i = 0; i < N; i++) counts[pickBonusKind(i / N)]++;
    const total = Object.values(BONUS_WEIGHTS).reduce((a, b) => a + b, 0);
    for (const k of Object.keys(counts)) expect(counts[k] / N).toBeCloseTo(BONUS_WEIGHTS[k] / total, 1);
    expect(pickBonusKind(0.9999999)).toBeTruthy();
  });
  it('luciérnagas: 12 → 1 pista, 24 → 2, 36 → 3, menos de 12 → ninguna', () => {
    expect([0, 11, 12, 23, 24, 35, 36, 80].map(catchPrize)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
  it('luciérnagas: la partida acelera y salen más a la vez, y el combo da puntos extra cada 5', () => {
    const a = catchPace(0);
    const b = catchPace(1);
    expect(b.delay).toBeLessThan(a.delay);
    expect(b.rise).toBeLessThan(a.rise);
    expect(b.group).toBeGreaterThan(a.group);
    expect(CATCH.duration).toBeGreaterThanOrEqual(12000);
    // más de 5 apariciones por segundo en la recta final: un reto de verdad
    expect((1000 / b.delay) * b.group).toBeGreaterThan(10);
    expect([1, 4, 5, 6, 10, 15].map(comboBonus)).toEqual([0, 0, 2, 0, 2, 2]);
  });
  it('tragaperras: el rodillo para en el símbolo más cercano y el premio depende de los tres', () => {
    expect(reelStopSymbol(reelPosition(0, 100))).toBe(0);
    expect(reelStopSymbol(reelPosition(149, 100))).toBe(1);
    expect(reelStopSymbol(reelPosition(260, 100))).toBe(0);   // 2,6 → 3 ≡ 0
    expect(reelStopSymbol(-0.6)).toBe(2);
    expect(REEL_SPEEDS.every((ms, i) => i === 0 || ms < REEL_SPEEDS[i - 1])).toBe(true);
    expect(slotPrize([1, 1, 1])).toBe(3);
    expect(slotPrize([0, 2, 0])).toBe(1);
    expect(slotPrize([0, 1, 2])).toBe(0);
  });
  it('tragaperras: parando a ciegas el premio esperado queda en torno a 1 pista; con puntería, más', () => {
    let blind = 0;
    let n = 0;
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) { blind += slotPrize([a, b, c]); n++; }
    expect(blind / n).toBeGreaterThan(0.8);
    expect(blind / n).toBeLessThan(1.3);
  });

  it('los premios son proporcionales al nivel: el máximo sube de 3 pistas (nivel 15) a 10 (nivel 95)', () => {
    expect(maxPrize(15)).toBe(3);
    expect(maxPrize(95)).toBe(10);
    let prev = 0;
    for (const lvl of [15, 25, 35, 45, 55, 65, 75, 85, 95]) {
      expect(maxPrize(lvl), `nivel ${lvl}`).toBeGreaterThanOrEqual(prev);
      prev = maxPrize(lvl);
    }
    expect(scalePrize(0, 95)).toBe(0);
    expect([1, 2, 3].map((p) => scalePrize(p, 15))).toEqual([1, 2, 3]);
    expect([1, 2, 3].map((p) => scalePrize(p, 95))).toEqual([3, 7, 10]);
    expect(catchPrize(40, 95)).toBe(10);
    expect(catchPrize(12, 95)).toBe(3);
    expect(slotPrize([1, 1, 1], 95)).toBe(10);
    expect(slotPrize([1, 1, 2], 95)).toBe(3);
    expect(slotPart([1, 1, 2])).toBe(1);
  });

  it('runas de memoria: 3 rondas → 1 parte, 5 → 2, 7 → 3, y cada ronda se muestra más rápido', () => {
    expect([0, 2, 3, 4, 5, 6, 7, 8].map(runesPart)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(runesPrize(7, 95)).toBe(10);
    expect(runesPrize(3, 95)).toBe(3);
    expect(runeShowMs(7)).toBeLessThan(runeShowMs(0));
    expect(runeShowMs(99)).toBeGreaterThanOrEqual(260);
    expect(RUNES.count).toBe(4);
  });
  it('péndulo: el centro vale 2, la zona 1, fuera 0; cada lanzamiento es más rápido y más estrecho', () => {
    const z = pendulumZone(0);
    expect(pendulumPoints(0, z)).toBe(2);
    expect(pendulumPoints(z * 0.9, z)).toBe(1);
    expect(pendulumPoints(z * 1.1, z)).toBe(0);
    expect(pendulumPoints(-z * 0.2, z)).toBe(2);
    for (let i = 1; i < PENDULUM.throws; i++) {
      expect(pendulumZone(i)).toBeLessThan(pendulumZone(i - 1));
      expect(pendulumPeriod(i)).toBeLessThan(pendulumPeriod(i - 1));
    }
    expect([0, 3, 4, 6, 7, 8, 9, 10].map(pendulumPart)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(pendulumPrize(10, 95)).toBe(10);
  });
});
