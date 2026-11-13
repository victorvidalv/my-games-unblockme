/**
 * Visor de melodías (melodies.html): dibuja la melodía y los acordes de cada tema como un piano roll
 * y la reproduce con el mismo secuenciador del juego. No forma parte del juego.
 */
import { Music } from '../audio/music.js';
import { ALL_THEMES, ZONE_THEMES, SCALES, chordMidi, entryAt } from '../audio/themes.js';
import { ZONES } from '../data/zones.js';

const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const noteName = (m) => NAMES[m % 12];
const SCALE_NAMES = { maj: 'mayor', min: 'menor', dor: 'dórica', mix: 'mixolidia', lyd: 'lidia', phd: 'frigia dominante', hmin: 'menor armónica' };
const GROOVE_NAMES = { pop: 'pop-folk', polka: 'polka', latin: 'clave y conga', shuffle: 'shuffle', disco: 'disco-funk', soft: 'suave', bossa: 'bossa nova', march: 'marcha', chill: 'chill', bigband: 'big band', drive: 'galope' };
const INSTR = { flute: 'flauta', accordion: 'acordeón', clarinet: 'clarinete', celesta: 'celesta', koto: 'koto', brass: 'metales', vibes: 'vibráfono', guitar: 'guitarra', piano: 'piano', pizz: 'pizzicato', whistle: 'silbato', fiddle: 'violín', synth: 'sintetizador' };

/** «Dmaj7», «Am7», «G7»… a partir de las notas del acorde. */
function chordName(th, entry) {
  const c = chordMidi(th, entry);
  const iv = c.slice(1, 4).map((m) => (m - c[0]) % 12).join(',');
  const q = { '4,7,11': 'maj7', '3,7,10': 'm7', '4,7,10': '7', '3,6,10': 'm7♭5', '3,6,9': 'dim7', '3,7,11': 'm(maj7)', '4,8,11': 'maj7♯5', '4,7,9': '6' }[iv] ?? '';
  return noteName(c[0]) + q;
}

const noteMidi = (th, deg) => {
  const s = SCALES[th.sc];
  const n = s.length;
  return th.root + 12 + s[((deg % n) + n) % n] + 12 * Math.floor(deg / n);
};

function rollSvg(th) {
  const W = 1024;
  const stepW = W / 256;
  const all = th.tune.flat().map(([, d]) => noteMidi(th, d));
  const lo = Math.min(...all) - 1;
  const hi = Math.max(...all) + 1;
  const rowH = 9;
  const H = (hi - lo + 1) * rowH;
  let g = '';
  for (let b = 0; b < 16; b++) {
    g += `<rect x="${b * 16 * stepW}" y="0" width="${16 * stepW}" height="${H}" fill="${b % 2 ? '#ffffff05' : '#ffffff00'}"/>`;
    g += `<line x1="${b * 16 * stepW}" x2="${b * 16 * stepW}" y1="0" y2="${H}" stroke="${b % 4 ? '#ffffff12' : '#ffffff30'}"/>`;
  }
  th.tune.forEach((bar, b) => {
    for (const [at, deg, dur] of bar) {
      const m = noteMidi(th, deg);
      const x = (b * 16 + at) * stepW;
      const y = (hi - m) * rowH;
      const hue = (m * 17) % 360;
      g += `<rect x="${x + 0.5}" y="${y + 1}" width="${Math.max(2, dur * stepW - 1)}" height="${rowH - 2}" rx="2" fill="hsl(${hue} 70% 62%)"><title>${noteName(m)} · bar ${b + 1}</title></rect>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${Math.min(240, H)}px">${g}</svg>`;
}

const list = document.getElementById('list');
const now = document.getElementById('now');
let playingId = null;
let raf = 0;
let startedAt = 0;

function stopAll() {
  Music.stop(0.15);
  cancelAnimationFrame(raf);
  playingId = null;
  document.querySelectorAll('.cursor').forEach((c) => (c.style.display = 'none'));
  document.querySelectorAll('.card button.on').forEach((b) => { b.classList.remove('on'); b.textContent = '▶ Escuchar'; });
  document.querySelectorAll('.chords span.hit').forEach((s) => s.classList.remove('hit'));
  now.textContent = 'Nada sonando';
}

ALL_THEMES.forEach((th, i) => {
  const zone = i < ZONE_THEMES.length ? ZONES[i] : null;
  const title = zone ? `${zone.e} ${zone.n}` : i === ZONE_THEMES.length ? '🏠 Menú principal' : '🛡️ Elección de héroe';
  const card = document.createElement('section');
  card.className = 'card';
  const chords = Array.from({ length: 16 }, (_, b) => {
    const e = entryAt(th, b, 0);
    const e2 = entryAt(th, b, 8);
    const a = chordName(th, e);
    return `<span>${e2 === e ? a : `${a}·${chordName(th, e2)}`}</span>`;
  }).join('');
  card.innerHTML = `
    <div class="head"><h2>${title}</h2><small>«${th.name}»</small><span class="sp"></span><button>▶ Escuchar</button></div>
    <div class="meta">
      <span class="tag">${noteName(th.root)} ${SCALE_NAMES[th.sc] ?? th.sc}</span><span class="tag">${th.bpm} bpm</span>
      <span class="tag">swing ${Math.round(th.swing * 100)}%</span><span class="tag">melodía: ${INSTR[th.leadVoice] ?? th.leadVoice}</span>
      <span class="tag">acompaña: ${INSTR[th.compVoice] ?? th.compVoice}</span><span class="tag">ritmo: ${GROOVE_NAMES[th.groove] ?? th.groove}</span><span class="tag">bajo: ${th.bassPat}</span><span class="tag">épica ${th.epic}/3</span>
    </div>
    <div class="chords">${chords}</div>
    <div class="roll">${rollSvg(th)}<div class="cursor"></div></div>
    <div class="legend">Eje horizontal: 16 compases. Cada barra es una nota (largo = duración, altura = tono, color = nota).</div>`;
  list.append(card);

  const btn = card.querySelector('button');
  const cursor = card.querySelector('.cursor');
  const spans = [...card.querySelectorAll('.chords span')];
  btn.onclick = () => {
    if (playingId === i) { stopAll(); return; }
    stopAll();
    playingId = i;
    btn.classList.add('on');
    btn.textContent = '■ Parar';
    Music.playTheme(th);
    startedAt = performance.now() + 150;
    now.textContent = `Sonando: ${th.name}`;
    cursor.style.display = 'block';
    const frame = () => {
      const barSec = (60 / th.bpm) * 4;
      const t = Math.max(0, (performance.now() - startedAt) / 1000) / barSec;
      const pos = (t % 16) / 16;
      cursor.style.left = `${pos * 100}%`;
      spans.forEach((s, k) => s.classList.toggle('hit', k === Math.floor(t % 16)));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };
});
document.getElementById('stop').onclick = stopAll;
