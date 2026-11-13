import { describe, it, expect } from 'vitest';
import {
  HEROES, canRescue, useRescue, freeUndosLeft, applyUndo, clearRewards, FREE_UNDOS, JUTH_FREE_HINTS, freeHintsLeft, spendHint, canHint } from '../src/game/heroes.js';

const newRun = (extra = {}) => ({ hints: 3, lifeUsed: false, undoUsedAt: 0, undoUsedLevel: 0, undoUsedCount: 0, vanAwardedAt: 0, ...extra });

describe('héroes', () => {
  it('hay tres héroes con poder descrito', () => {
    expect(HEROES.map((h) => h.id)).toEqual(['lia', 'jean', 'van']);
    for (const h of HEROES) expect(h.power && h.short && h.detail).toBeTruthy();
  });
});

describe('Lía · segunda oportunidad', () => {
  it('solo Lía puede ser rescatada, una vez, y no en Práctica', () => {
    const run = newRun();
    expect(canRescue('lia', run, 'c')).toBe(true);
    expect(canRescue('jean', run, 'c')).toBe(false);
    expect(canRescue('van', run, 'c')).toBe(false);
    expect(canRescue('lia', run, 'p')).toBe(false);
  });
  it('gastarla guarda el tablero inicial y no se puede repetir', () => {
    const run = newRun();
    const G = { n: 12, rate: 12, pieces: [{ o: 'h', len: 2, fix: 2 }], start: [1], pos: [3], opt: 5 };
    useRescue(run, G);
    expect(run.lifeUsed).toBe(true);
    expect(run.rescue).toMatchObject({ level: 12, start: [1], opt: 5 });
    expect(run.rescue.pieces).not.toBe(G.pieces); // copia, no referencia
    expect(canRescue('lia', run, 'c')).toBe(false);
  });
});

describe('Jean · tres pasos atrás', () => {
  it('tiene 3 deshacer gratis por tablero; los demás héroes, 0', () => {
    expect(freeUndosLeft('jean', newRun(), 5)).toBe(FREE_UNDOS);
    expect(freeUndosLeft('lia', newRun(), 5)).toBe(0);
    expect(freeUndosLeft('van', newRun(), 5)).toBe(0);
  });
  it('cada uso gratis quita el movimiento y gasta uno de los tres', () => {
    const run = newRun();
    let moves = 6;
    for (let used = 1; used <= 3; used++) {
      const r = applyUndo({ heroId: 'jean', run, mode: 'c', level: 5, moves });
      expect(r.free).toBe(true);
      expect(r.moves).toBe(moves - 1);
      moves = r.moves;
      expect(freeUndosLeft('jean', run, 5)).toBe(3 - used);
    }
  });
  it('agotados los tres, deshacer cuesta +1 movimiento', () => {
    const run = newRun();
    for (let i = 0; i < 3; i++) applyUndo({ heroId: 'jean', run, mode: 'c', level: 5, moves: 6 });
    const r = applyUndo({ heroId: 'jean', run, mode: 'c', level: 5, moves: 6 });
    expect(r.free).toBe(false);
    expect(r.moves).toBe(7);
    expect(freeUndosLeft('jean', run, 5)).toBe(0);
  });
  it('se reinicia en cada tablero nuevo', () => {
    const run = newRun();
    for (let i = 0; i < 3; i++) applyUndo({ heroId: 'jean', run, mode: 'c', level: 5, moves: 6 });
    expect(freeUndosLeft('jean', run, 5)).toBe(0);
    expect(freeUndosLeft('jean', run, 6)).toBe(3);
  });
  it('lee partidas guardadas con el formato antiguo (1 uso en ese nivel)', () => {
    expect(freeUndosLeft('jean', newRun({ undoUsedAt: 9, undoUsedLevel: 0 }), 9)).toBe(2);
  });
  it('para el resto de héroes deshacer cuesta +1 movimiento', () => {
    const r = applyUndo({ heroId: 'lia', run: newRun(), mode: 'c', level: 5, moves: 4 });
    expect(r).toEqual({ free: false, moves: 5 });
  });
  it('en Práctica siempre es gratis y no gasta nada', () => {
    const run = newRun();
    for (const heroId of ['lia', 'jean', 'van']) {
      expect(applyUndo({ heroId, run, mode: 'p', level: 5, moves: 4 })).toEqual({ free: true, moves: 3 });
    }
    expect(freeUndosLeft('jean', run, 5)).toBe(3);
  });
  it('el contador de movimientos nunca baja de 0', () => {
    expect(applyUndo({ heroId: 'jean', run: newRun(), mode: 'c', level: 1, moves: 0 }).moves).toBe(0);
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
    expect(JUTH_FREE_HINTS).toBe(1);
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
