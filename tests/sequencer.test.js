import { describe, it, expect, vi, beforeAll } from 'vitest';

/** Audio y DOM simulados: cuentan las notas programadas y fallan si el secuenciador usa algo que no existe. */
const clock = { now: 0 };
const stats = { osc: 0, noise: 0, maxFreq: 0, minFreq: Infinity };
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
const node = () => ({ connect() {}, disconnect() {}, gain: param(), frequency: param(), detune: param(), start() {}, stop() {}, addEventListener() {}, type: '' });

class FakeAC {
  constructor() { this.state = 'running'; this.sampleRate = 8000; this.destination = node(); }
  get currentTime() { return clock.now; }
  addEventListener() {}
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
  createGain() { return node(); }
  createBiquadFilter() { return node(); }
  createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
  createBufferSource() { stats.noise++; return node(); }
  createOscillator() {
    stats.osc++;
    const o = node();
    o.frequency = { value: 0, setValueAtTime(f) { track(f); }, exponentialRampToValueAtTime() {}, set value(f) { track(f); }, get value() { return 0; } };
    return o;
  }
}
const track = (f) => { if (f > 0) { stats.maxFreq = Math.max(stats.maxFreq, f); stats.minFreq = Math.min(stats.minFreq, f); } };
const el = () => ({
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, style: { setProperty() {} }, dataset: {},
  addEventListener() {}, setAttribute() {}, removeAttribute() {}, querySelector: () => el(), textContent: '', innerHTML: '', hidden: true,
});

describe('secuenciador (con audio simulado)', () => {
  let Music;
  beforeAll(async () => {
    const store = {};
    vi.stubGlobal('localStorage', { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } });
    vi.stubGlobal('window', { AudioContext: FakeAC });
    vi.stubGlobal('addEventListener', () => {});
    vi.stubGlobal('document', { hidden: false, body: el(), getElementById: () => el(), addEventListener() {}, querySelectorAll: () => [] });
    vi.useFakeTimers();
    ({ Music } = await import('../src/audio/music.js'));
  });

  /** Reproduce `ms` milisegundos de música. */
  const play = (ms) => {
    for (let t = 0; t < ms; t += 25) {
      clock.now += 0.025;
      vi.advanceTimersByTime(25);
    }
  };

  it('toca el menú, héroes y las 10 ciudades sin errores, con notas en cada compás y en un registro audible', () => {
    const scenes = [() => Music.scene('menu'), () => Music.scene('heroes'), ...Array.from({ length: 10 }, (_, z) => () => Music.setLevel(z * 10 + 1))];
    expect(scenes).toHaveLength(12);
    for (const go of scenes) {
      go();
      Music.start();
      stats.osc = 0;
      stats.maxFreq = 0;
      stats.minFreq = Infinity;
      play(9000); // ~16 compases a ritmo normal: más que una vuelta entera de algunos compases
      expect(Music.playing).toBe(true);
      expect(stats.osc, Music.themeName).toBeGreaterThan(100);
      expect(stats.minFreq, Music.themeName).toBeGreaterThan(25);   // el bajo no cae a infrasonidos
      expect(stats.maxFreq, Music.themeName).toBeLessThan(9000);    // nada chillón
    }
  });

  it('el modo pánico y la tensión también suenan sin errores', () => {
    Music.setLevel(1);
    Music.setTension(1, true);
    stats.osc = 0;
    play(3000);
    expect(stats.osc).toBeGreaterThan(40);
    Music.setTension(0, false);
    Music.stop(0.1);
    expect(Music.playing).toBe(false);
  });
});
