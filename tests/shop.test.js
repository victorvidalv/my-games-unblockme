import { describe, it, expect } from 'vitest';
import { SHOP_ITEMS, EXTRA_MOVES, EXTRA_MOVES_3, REVIVE_SHARE, MAX_REVIVES, reviveCost, canPaidRevive, payRevive, hasRevive, useRevive, priceOf, availability, buy } from '../src/game/shop.js';
import { moveStatus } from '../src/engine/rules.js';

const mk = (score, over = {}) => ({
  run: { score, hints: 3, mode: 'c', spent: 0 },
  G: { n: 10, rate: 10, opt: 5, limit: 10, moves: 4, hist: [[1], [2]], pos: [3], start: [0], done: false, ...over },
});

describe('tienda: precios', () => {
  it('incluye pista, +3 turnos, +5 turnos, rehacer y saltar (sin revivir)', () => {
    expect(SHOP_ITEMS.map((i) => i.id)).toEqual(['hint', 'moves3', 'moves', 'redo', 'skip']);
  });
  it('los precios fijos son iguales en cualquier dificultad', () => {
    const expected = { hint: 500, redo: 1500, moves3: 3000, moves: 4500, skip: 6000 };
    for (const rating of [1, 25, 50, 100]) {
      for (const [id, price] of Object.entries(expected)) expect(priceOf(id, rating)).toBe(price);
    }
    expect(priceOf('moves3', 20)).toBeLessThan(priceOf('moves', 20));
    expect(priceOf('moves', 20)).toBeLessThan(priceOf('skip', 20));
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
  it('turnos extra (+3): sube el límite en 3, descuenta 3000 y registra bought', () => {
    const { run, G } = mk(100000, { moves: 11, limit: 10 });
    expect(moveStatus(G.moves, G.limit)).toBe('over');
    const r = buy('moves3', { run, G });
    expect(r).toEqual({ ok: true, price: 3000 });
    expect(G.limit).toBe(10 + EXTRA_MOVES_3);
    expect(G.bought).toBe(EXTRA_MOVES_3);
    expect(run.score).toBe(97000);
    expect(run.spent).toBe(3000);
    expect(moveStatus(G.moves, G.limit)).not.toBe('over');
  });
  it('turnos extra (+5): sube el límite en 5, descuenta el precio y el jugador deja de estar eliminado', () => {
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
  it('cada pista descuenta exactamente 500 puntos y exige saldo suficiente', () => {
    const { run, G } = mk(1000, { rate: 100 });
    for (let purchase = 1; purchase <= 2; purchase++) {
      expect(buy('hint', { run, G })).toEqual({ ok: true, price: 500 });
      expect(run.score).toBe(1000 - 500 * purchase);
      expect(run.spent).toBe(500 * purchase);
      expect(run.hints).toBe(3 + purchase);
    }
    expect(buy('hint', { run, G }).ok).toBe(false);
    expect(run.hints).toBe(5);
    const poor = mk(499);
    expect(buy('hint', poor).ok).toBe(false);
    expect(poor.run.score).toBe(499);
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

describe('revivir al caer (fuera de la tienda)', () => {
  it('cuesta el 33 % de los puntos actuales y se permite máximo 1 vez por partida', () => {
    expect(REVIVE_SHARE).toBe(0.33);
    expect(MAX_REVIVES).toBe(1);
    expect(reviveCost(10000)).toBe(3300);
    expect(reviveCost(1001)).toBe(330);
    expect(reviveCost(0)).toBe(0);
  });
  it('cobra el 33 % de tus puntos actuales y bloquea un segundo revivir en la misma partida', () => {
    const run = { score: 10000, spent: 0, revivesBought: 0, mode: 'c' };
    expect(canPaidRevive(run)).toBe(true);
    expect(payRevive(run)).toEqual({ ok: true, cost: 3300 });
    expect(run.score).toBe(6700);
    expect(run.spent).toBe(3300);
    expect(run.revivesBought).toBe(1);
    expect(canPaidRevive(run)).toBe(false);
    expect(payRevive(run)).toEqual({ ok: false, cost: 0 });
    expect(run.score).toBe(6700);
  });
  it('no se puede revivir sin puntos ni en Práctica', () => {
    expect(canPaidRevive({ score: 0, revivesBought: 0, mode: 'c' })).toBe(false);
    expect(canPaidRevive({ score: 10000, revivesBought: 0, mode: 'p' })).toBe(false);
  });
  it('compatibilidad: si existe una carga antigua guardada, useRevive la consume sin quedar negativa', () => {
    const run = { revive: 1, hints: 3 };
    const G = { n: 12, rate: 12, pieces: [{ o: 'h', len: 2, fix: 2 }], walls: [[1, 1]], start: [1], opt: 5 };
    useRevive(run, G);
    expect(run.revive).toBe(0);
    expect(run.rescue).toMatchObject({ level: 12, opt: 5, kind: 'revive', start: [1], walls: [[1, 1]] });
    expect(run.rescue.pieces).not.toBe(G.pieces);
    useRevive(run, G);
    expect(run.revive).toBe(0);
    expect(hasRevive(run)).toBe(false);
  });
});
