import { describe, it, expect } from 'vitest';
import { moveLimit } from '../src/engine/difficulty.js';
import {
  HEROES, bonusTurns, heroLimit, freeUndosLeft, applyUndo, clearRewards, freeUndosFor, freeHintsFor, powerScale, juthActive, freeHintsLeft, spendHint, canHint } from '../src/game/heroes.js';

const newRun = (extra = {}) => ({ hints: 3, lifeUsed: false, undoUsedAt: 0, undoUsedLevel: 0, undoUsedCount: 0, vanAwardedAt: 0, ...extra });

describe('héroes', () => {
  it('hay tres héroes con poder descrito', () => {
    expect(HEROES.map((h) => h.id)).toEqual(['lia', 'jean', 'van']);
    for (const h of HEROES) expect(h.power && h.short && h.detail).toBeTruthy();
  });
});

describe('Lía · turnos de reserva', () => {
  it('solo Lía recibe turnos extra: el 23 % del límite, mínimo 2', () => {
    expect(bonusTurns('lia', 8)).toBe(2);
    expect(bonusTurns('lia', 40)).toBe(9);
    expect(bonusTurns('lia', 74)).toBe(17);
    expect(bonusTurns('jean', 40)).toBe(0);
    expect(bonusTurns('van', 40)).toBe(0);
  });
  it('heroLimit suma el bonus al límite normal y para el resto de héroes no cambia', () => {
    for (const opt of [2, 7, 20, 37]) {
      expect(heroLimit('jean', opt, 1)).toBe(moveLimit(opt, 1));
      expect(heroLimit('lia', opt, 1)).toBe(moveLimit(opt, 1) + bonusTurns('lia', moveLimit(opt, 1)));
      expect(heroLimit('lia', opt, 75)).toBeGreaterThan(moveLimit(opt, 75));
    }
  });
});

describe('poderes por camino: Normal 100 %, Difícil 75 %, Experto 50 %', () => {
  it('powerScale baja con la dificultad del camino', () => {
    expect([1, 50, 75].map(powerScale)).toEqual([1, 0.75, 0.5]);
  });
  it('Lía, Jean y Juth dan menos en Difícil y menos aún en Experto (nunca cero)', () => {
    for (const opt of [14, 25, 37]) {
      expect(freeUndosFor(opt, 75)).toBeLessThanOrEqual(freeUndosFor(opt, 50));
      expect(freeUndosFor(opt, 50)).toBeLessThanOrEqual(freeUndosFor(opt, 1));
      expect(freeUndosFor(opt, 75)).toBeGreaterThanOrEqual(1);
      expect(bonusTurns('lia', 60, 75)).toBeLessThan(bonusTurns('lia', 60, 50));
      expect(bonusTurns('lia', 60, 50)).toBeLessThan(bonusTurns('lia', 60, 1));
      expect(heroLimit('lia', opt, 75)).toBeGreaterThan(moveLimit(opt, 75));
    }
  });
  it('la pista gratis de Juth llega a todos los tableros de Normal y a una parte de los de Difícil y Experto', () => {
    const share = (start) => Array.from({ length: 100 }, (_, i) => juthActive(i + 1, start)).filter(Boolean).length;
    expect(share(1)).toBe(100);
    expect(share(50)).toBeLessThan(100);
    expect(share(75)).toBeLessThan(share(50));
    expect(share(75)).toBeGreaterThanOrEqual(70);
  });
});

describe('Jean · pasos atrás proporcionales', () => {
  it('tiene deshacer gratis (22 % del mínimo, 1–6); los demás héroes, 0', () => {
    expect(freeUndosLeft('jean', newRun(), 5, 14)).toBe(freeUndosFor(14));
    expect(freeUndosLeft('lia', newRun(), 5)).toBe(0);
    expect(freeUndosLeft('van', newRun(), 5)).toBe(0);
  });
  it('cada uso gratis quita el movimiento y gasta uno de los suyos (14 de mínimo → 3)', () => {
    const run = newRun();
    let moves = 6;
    for (let used = 1; used <= 3; used++) {
      const r = applyUndo({ heroId: 'jean', run, mode: 'c', level: 5, moves, opt: 14 });
      expect(r.free).toBe(true);
      expect(r.moves).toBe(moves - 1);
      moves = r.moves;
      expect(freeUndosLeft('jean', run, 5, 14)).toBe(3 - used);
    }
  });
  it('agotados los gratis, deshacer cuesta +1 movimiento', () => {
    const run = newRun();
    for (let i = 0; i < 3; i++) applyUndo({ heroId: 'jean', run, mode: 'c', level: 5, moves: 6, opt: 14 });
    const r = applyUndo({ heroId: 'jean', run, mode: 'c', level: 5, moves: 6, opt: 14 });
    expect(r.free).toBe(false);
    expect(r.moves).toBe(7);
    expect(freeUndosLeft('jean', run, 5, 14)).toBe(0);
  });
  it('se reinicia en cada tablero nuevo', () => {
    const run = newRun();
    for (let i = 0; i < 3; i++) applyUndo({ heroId: 'jean', run, mode: 'c', level: 5, moves: 6, opt: 14 });
    expect(freeUndosLeft('jean', run, 5, 14)).toBe(0);
    expect(freeUndosLeft('jean', run, 6, 14)).toBe(3);
  });
  it('crece con el tablero: pocos en los fáciles, más en los largos, con tope', () => {
    expect([3, 10, 20, 37, 60].map(freeUndosFor)).toEqual([1, 2, 4, 6, 6]);
  });
  it('lee partidas guardadas con el formato antiguo (1 uso en ese nivel)', () => {
    expect(freeUndosLeft('jean', newRun({ undoUsedAt: 9, undoUsedLevel: 0 }), 9, 14)).toBe(2);
  });
  it('para el resto de héroes deshacer cuesta +1 movimiento', () => {
    const r = applyUndo({ heroId: 'lia', run: newRun(), mode: 'c', level: 5, moves: 4, opt: 14 });
    expect(r).toEqual({ free: false, moves: 5 });
  });
  it('en Práctica siempre es gratis y no gasta nada', () => {
    const run = newRun();
    for (const heroId of ['lia', 'jean', 'van']) {
      expect(applyUndo({ heroId, run, mode: 'p', level: 5, moves: 4, opt: 14 })).toEqual({ free: true, moves: 3 });
    }
    expect(freeUndosLeft('jean', run, 5, 14)).toBe(3);
  });
  it('el contador de movimientos nunca baja de 0', () => {
    expect(applyUndo({ heroId: 'jean', run: newRun(), mode: 'c', level: 1, moves: 0, opt: 14 }).moves).toBe(0);
  });
});

describe('pistas · recompensas de nivel y la pista gratis de Juth', () => {
  it('todos ganan +1 pista cada 5 niveles (y nada más: Juth ya no recibe pistas extra por ciudad)', () => {
    for (const hero of ['lia', 'jean', 'van']) {
      const run = newRun({ hints: 0 });
      expect(clearRewards(hero, run, 5)).toBe(1);
      expect(clearRewards(hero, run, 6)).toBe(0);
      expect(clearRewards(hero, run, 10)).toBe(1);
      expect(run.hints).toBe(2);
    }
  });
  it('Juth tiene 1 pista gratis por tablero; los demás héroes, ninguna', () => {
    expect(freeHintsFor(3)).toBe(1);
    expect(freeHintsLeft('van', newRun(), 7)).toBe(1);
    expect(freeHintsLeft('lia', newRun(), 7)).toBe(0);
    expect(freeHintsLeft('jean', newRun(), 7)).toBe(0);
  });
  it('la pista gratis se gasta primero y no toca la reserva; después se gasta la reserva', () => {
    const run = newRun({ hints: 2 });
    expect(spendHint({ heroId: 'van', run, mode: 'c', level: 7 })).toEqual({ ok: true, free: true });
    expect(run.hints).toBe(2);
    expect(freeHintsLeft('van', run, 7)).toBe(0);
    expect(spendHint({ heroId: 'van', run, mode: 'c', level: 7 })).toEqual({ ok: true, free: false });
    expect(run.hints).toBe(1);
  });
  it('la pista gratis se renueva en cada tablero nuevo', () => {
    const run = newRun({ hints: 0 });
    spendHint({ heroId: 'van', run, mode: 'c', level: 7 });
    expect(canHint('van', run, 'c', 7)).toBe(false);
    expect(canHint('van', run, 'c', 8)).toBe(true);
    expect(freeHintsLeft('van', run, 8)).toBe(1);
  });
  it('sin reserva ni pista gratis no se puede pedir una pista', () => {
    const run = newRun({ hints: 0 });
    expect(canHint('lia', run, 'c', 3)).toBe(false);
    expect(spendHint({ heroId: 'lia', run, mode: 'c', level: 3 })).toEqual({ ok: false, free: false });
    expect(run.hints).toBe(0);
  });
  it('en Práctica las pistas son gratis y no gastan nada', () => {
    const run = newRun({ hints: 0 });
    expect(canHint('lia', run, 'p', 3)).toBe(true);
    expect(spendHint({ heroId: 'lia', run, mode: 'p', level: 3 }).ok).toBe(true);
    expect(run.hints).toBe(0);
  });
});

describe('al elegir héroe solo se describe el poder, sin cifras', () => {
  it('ningún texto del héroe lleva números ni «según el tablero»', () => {
    for (const h of HEROES) {
      expect(`${h.power} ${h.short} ${h.detail}`, h.id).not.toMatch(/\d/);
      expect(`${h.short} ${h.detail}`.toLowerCase()).not.toContain('según el tablero');
      expect(h.short.length).toBeGreaterThan(8);
      expect(h.detail.length).toBeGreaterThan(30);
    }
  });
});
