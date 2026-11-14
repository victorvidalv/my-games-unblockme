import { sfx, vib } from '../audio/sound.js';
import { $ } from '../dom.js';
import { countUp } from './fx.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n) => n.toLocaleString('de-DE');

/** Aviso minimalista de «PERFECTO»: solo sonido y un sutil destello dorado en el marco. */
function perfectFx() {
  document.body.classList.add('perfect');
  sfx.perfect();
  vib([20, 30, 20]);
  setTimeout(() => document.body.classList.remove('perfect'), 1300);
}

/**
 * Aviso minimalista al terminar un nivel: solo muestra los puntos (y «PERFECTO» si fue mínimo).
 * Se cierra solo (≈0.9 s; ≈1.3 s si fue perfecto) o al tocar.
 */
export function showResult({ gain, moves, opt, previous, total }) {
  return new Promise((resolve) => {
    const el = $('result');
    const board = $('board');
    const r = board?.getBoundingClientRect?.();
    if (r && r.width > 0 && r.height > 0) {
      el.style.setProperty('--rx', `${r.left + r.width / 2}px`);
      el.style.setProperty('--ry', `${r.top + r.height / 2}px`);
    } else {
      el.style.removeProperty('--rx');
      el.style.removeProperty('--ry');
    }
    const perfect = moves <= opt;
    const ms = reduced() ? 450 : perfect ? 1300 : 900;
    el.classList.toggle('perfect', perfect);
    $('resTitle').textContent = perfect ? 'PERFECTO' : '';
    $('resLevel').textContent = '';
    $('resLine').textContent = '';
    $('resTotal').textContent = '';
    $('resBar').style.animationDuration = ms + 'ms';
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    countUp($('resPts'), 0, gain.total, Math.min(340, ms - 200), (v) => '+' + fmt(Math.round(v)) + ' pts');
    countUp($('score'), previous, total, 340);
    if (perfect) perfectFx();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      el.removeEventListener('pointerdown', finish);
      el.classList.remove('show');
      resolve();
    };
    const timer = setTimeout(finish, ms);
    el.addEventListener('pointerdown', finish);
  });
}
