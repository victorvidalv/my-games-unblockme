import { describe, it, expect } from 'vitest';
import { SHOP_ITEMS, EXTRA_MOVES, LEVEL_VALUE, REVIVE_SHARE, MAX_REVIVES, hasRevive, useRevive, priceOf, availability, buy } from '../src/game/shop.js';
import { baseScore } from '../src/engine/scoring.js';
import { moveStatus } from '../src/engine/rules.js';

const mk = (score, over = {}) => ({
  run: { score, hints: 3, mode: 'c', spent: 0 },
  G: { n: 10, rate: 10, opt: 5, limit: 10, moves: 4, hist: [[1], [2]], pos: [3], start: [0], done: false, ...over },
});

describe('tienda: precios', () => {
  it('las pistas cuestan siempre 900 puntos, sin importar la dificultad', () => {
    for (const rating of [1, 25, 50, 100]) expect(priceOf('hint', rating)).toBe(900);
  });
  it('los demás objetos cuestan un múltiplo de lo que vale un nivel a esa dificultad', () => {
    for (const rating of [1, 25, 50, 100]) {
      for (const i of SHOP_ITEMS.filter((i) => i.levels)) expect(priceOf(i.id, rating)).toBe(Math.round(i.levels * LEVEL_VALUE * baseScore(rating)));
    }
  });
  it('rehacer cuesta 2 niveles, +5 turnos 8 niveles y saltar nivel 10 niveles', () => {
    const level = LEVEL_VALUE * baseScore(20); // lo que da un nivel bien jugado
    expect(priceOf('redo', 20)).toBe(Math.round(2 * level));
    expect(priceOf('moves', 20)).toBe(Math.round(8 * level));
    expect(priceOf('skip', 20)).toBe(Math.round(10 * level));
    expect(priceOf('moves', 20)).toBeLessThan(priceOf('skip', 20));
  });
  it('los demás precios suben con la dificultad (siempre el mismo esfuerzo)', () => {
    for (const i of SHOP_ITEMS.filter((i) => i.levels)) expect(priceOf(i.id, 80)).toBeGreaterThan(priceOf(i.id, 5));
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
  it('cada pista descuenta exactamente 900 puntos y exige saldo suficiente', () => {
    const { run, G } = mk(1800, { rate: 100 });
    for (let purchase = 1; purchase <= 2; purchase++) {
      expect(buy('hint', { run, G })).toEqual({ ok: true, price: 900 });
      expect(run.score).toBe(1800 - 900 * purchase);
      expect(run.spent).toBe(900 * purchase);
      expect(run.hints).toBe(3 + purchase);
    }
    expect(buy('hint', { run, G }).ok).toBe(false);
    expect(run.hints).toBe(5);
    const poor = mk(899);
    expect(buy('hint', poor).ok).toBe(false);
    expect(poor.run.score).toBe(899);
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

describe('tienda: revivir', () => {
  it('cuesta la mitad de tus puntos actuales (y por eso duele más cuanto más has acumulado)', () => {
    expect(REVIVE_SHARE).toBe(0.5);
    expect(priceOf('revive', 50, 10000)).toBe(5000);
    expect(priceOf('revive', 50, 80001)).toBe(40001); // redondeado
    expect(priceOf('revive', 50, 0)).toBe(0);
    expect(priceOf('revive', 90, 10000)).toBe(priceOf('revive', 10, 10000)); // no depende de la dificultad, solo de tus puntos
  });
  it('compra: descuenta el 50 %, guarda una carga y cuenta como compra de la partida', () => {
    const { run, G } = mk(20000);
    expect(buy('revive', { run, G })).toEqual({ ok: true, price: 10000 });
    expect(run.score).toBe(10000);
    expect(run.revive).toBe(1);
    expect(run.revivesBought).toBe(1);
    expect(run.spent).toBe(10000);
    expect(hasRevive(run)).toBe(true);
  });
  it(`máximo ${2} revivir por partida: el tercero se rechaza y no cobra nada`, () => {
    expect(MAX_REVIVES).toBe(2);
    const { run, G } = mk(40000);
    expect(buy('revive', { run, G }).price).toBe(20000);
    expect(buy('revive', { run, G }).price).toBe(10000);   // el segundo cuesta el 50 % de lo que quedaba
    expect(run.revive).toBe(2);
    const third = buy('revive', { run, G });
    expect(third.ok).toBe(false);
    expect(third.reason).toMatch(/2 revivir/);
    expect(run.score).toBe(10000);
    expect(run.revivesBought).toBe(2);
  });
  it('el límite cuenta las compras, no las cargas: gastar un revivir no permite comprar otro', () => {
    const { run, G } = mk(100000);
    buy('revive', { run, G });
    buy('revive', { run, G });
    useRevive(run, { n: 5, rate: 5, pieces: [], walls: [], start: [], opt: 3 });
    expect(run.revive).toBe(1);
    expect(availability('revive', { run, G }).ok).toBe(false);
  });
  it('sin puntos no se puede comprar', () => {
    const { run, G } = mk(0);
    expect(availability('revive', { run, G }).ok).toBe(false);
    expect(buy('revive', { run, G }).ok).toBe(false);
    expect(run.revive).toBeUndefined();
  });
  it('usarlo gasta una carga y guarda el tablero para repetirlo desde cero', () => {
    const run = { revive: 2, hints: 3 };
    const G = { n: 12, rate: 12, pieces: [{ o: 'h', len: 2, fix: 2 }], walls: [[1, 1]], start: [1], opt: 5 };
    useRevive(run, G);
    expect(run.revive).toBe(1);
    expect(run.rescue).toMatchObject({ level: 12, opt: 5, kind: 'revive', start: [1], walls: [[1, 1]] });
    expect(run.rescue.pieces).not.toBe(G.pieces);
    useRevive(run, G);
    useRevive(run, G);
    expect(run.revive).toBe(0);   // nunca negativo
    expect(hasRevive(run)).toBe(false);
  });
  it('no se puede usar la tienda sin tablero en juego ni en Práctica', () => {
    expect(availability('revive', { run: mk(1e6).run, G: { ...mk(1e6).G, done: true } }).ok).toBe(false);
  });
});
