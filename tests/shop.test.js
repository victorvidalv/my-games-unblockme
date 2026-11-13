import { describe, it, expect } from 'vitest';
import { SHOP_ITEMS, EXTRA_MOVES, LEVEL_VALUE, priceOf, availability, buy } from '../src/game/shop.js';
import { baseScore } from '../src/engine/scoring.js';
import { moveStatus } from '../src/engine/rules.js';

const mk = (score, over = {}) => ({
  run: { score, hints: 3, mode: 'c', spent: 0 },
  G: { n: 10, rate: 10, opt: 5, limit: 10, moves: 4, hist: [[1], [2]], pos: [3], start: [0], done: false, ...over },
});

describe('tienda: precios', () => {
  it('cada objeto cuesta un múltiplo de lo que vale un nivel a esa dificultad', () => {
    for (const rating of [1, 25, 50, 100]) {
      for (const i of SHOP_ITEMS) expect(priceOf(i.id, rating)).toBe(Math.round(i.levels * LEVEL_VALUE * baseScore(rating)));
    }
  });
  it('precios fijos: pista y rehacer 2 niveles, +5 turnos 8 niveles, saltar nivel 10 niveles', () => {
    const level = LEVEL_VALUE * baseScore(20); // lo que da un nivel bien jugado
    expect(priceOf('hint', 20)).toBe(Math.round(2 * level));
    expect(priceOf('redo', 20)).toBe(Math.round(2 * level));
    expect(priceOf('moves', 20)).toBe(Math.round(8 * level));
    expect(priceOf('skip', 20)).toBe(Math.round(10 * level));
    expect(priceOf('moves', 20)).toBeLessThan(priceOf('skip', 20));
  });
  it('los precios suben con la dificultad (siempre el mismo esfuerzo)', () => {
    for (const i of SHOP_ITEMS) expect(priceOf(i.id, 80)).toBeGreaterThan(priceOf(i.id, 5));
  });
});

describe('tienda: compras', () => {
  it('sin puntos suficientes no se compra nada y no se descuenta', () => {
    const { run, G } = mk(priceOf('moves', 10) - 1);
    const r = buy('moves', { run, G });
    expect(r.ok).toBe(false);
    expect(run.score).toBe(priceOf('moves', 10) - 1);
    expect(G.limit).toBe(10);
  });
  it('turnos extra: sube el límite en 5, descuenta el precio y el jugador deja de estar eliminado', () => {
    const { run, G } = mk(100000, { moves: 11, limit: 10 });
    expect(moveStatus(G.moves, G.limit)).toBe('over');
    const r = buy('moves', { run, G });
    expect(r.ok).toBe(true);
    expect(G.limit).toBe(10 + EXTRA_MOVES);
    expect(run.score).toBe(100000 - priceOf('moves', 10));
    expect(run.spent).toBe(priceOf('moves', 10));
    expect(moveStatus(G.moves, G.limit)).not.toBe('over');
  });
  it('pista: suma una pista', () => {
    const { run, G } = mk(100000);
    expect(buy('hint', { run, G }).ok).toBe(true);
    expect(run.hints).toBe(4);
  });
  it('rehacer: vuelve al inicio con 0 movimientos y conserva los turnos comprados', () => {
    const { run, G } = mk(100000);
    buy('moves', { run, G });
    const limit = G.limit;
    expect(buy('redo', { run, G }).ok).toBe(true);
    expect(G.moves).toBe(0);
    expect(G.hist).toEqual([]);
    expect(G.pos).toEqual(G.start);
    expect(G.limit).toBe(limit);
  });
  it('rehacer no está disponible si aún no has movido', () => {
    const { run, G } = mk(100000, { moves: 0 });
    expect(availability('redo', { run, G }).ok).toBe(false);
  });
  it('saltar nivel cobra el precio (la interfaz avanza)', () => {
    const { run, G } = mk(100000);
    const r = buy('skip', { run, G });
    expect(r.ok).toBe(true);
    expect(run.score).toBe(100000 - priceOf('skip', 10));
  });
  it('en Práctica o sin tablero activo la tienda no vende', () => {
    expect(availability('hint', { ...mk(1e6), run: { ...mk(1e6).run, mode: 'p' } }).ok).toBe(false);
    expect(availability('hint', { run: mk(1e6).run, G: { ...mk(1e6).G, done: true } }).ok).toBe(false);
    expect(availability('hint', { run: null, G: null }).ok).toBe(false);
  });
  it('no se puede quedar en puntos negativos', () => {
    const { run, G } = mk(priceOf('hint', 10));
    expect(buy('hint', { run, G }).ok).toBe(true);
    expect(run.score).toBe(0);
    expect(buy('hint', { run, G }).ok).toBe(false);
    expect(run.score).toBe(0);
  });
});
