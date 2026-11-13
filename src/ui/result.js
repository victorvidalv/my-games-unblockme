import { sfx, vib } from '../audio/sound.js';
import { $ } from '../dom.js';
import { burst, countUp } from './fx.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n) => n.toLocaleString('de-DE');

/** Animación dorada de «¡PERFECTO!»: rayos, brillo, estrellas y confeti. */
function perfectFx(streakMult) {
  const el = $('perfect');
  $('perfectSub').textContent = 'MÍNIMO DE MOVIMIENTOS' + (streakMult > 1 ? '  ·  RACHA ×' + streakMult.toFixed(1) : '');
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
  document.body.classList.add('perfect');
  sfx.perfect();
  vib([30, 40, 30, 40, 120]);
  if (!reduced()) {
    const W = innerWidth;
    const H = innerHeight;
    const gold = ['#ffd24a', '#ffb300', '#fff3b0', '#ff8f6b', '#fff'];
    [0, 250, 550, 900].forEach((d) => setTimeout(() => {
      burst(W / 2, H * 0.42, 45, gold, 10);
      burst(W * (0.2 + 0.6 * Math.random()), H * (0.25 + 0.3 * Math.random()), 24, gold, 7);
    }, d));
  }
  setTimeout(() => {
    el.classList.remove('go');
    document.body.classList.remove('perfect');
  }, 2300);
}

/**
 * Pantalla rápida de puntaje al terminar un nivel. Se cierra sola (≈1 s; ≈2 s si fue perfecto)
 * y se puede saltar tocando. Devuelve una promesa que se cumple al cerrarse.
 */
export function showResult({ level, gain, moves, opt, previous, total, streakMult }) {
  return new Promise((resolve) => {
    const el = $('result');
    const perfect = moves <= opt;
    const ms = reduced() ? 500 : perfect ? 2000 : 1100;
    el.classList.toggle('perfect', perfect);
    $('resTitle').textContent = perfect ? '¡PERFECTO!' : '';
    $('resLevel').textContent = `NIVEL ${level} COMPLETADO`;
    $('resLine').textContent = `${moves} movimientos · mínimo ${opt}` + (gain.routeBonus ? ` · ruta aventurera +${fmt(gain.routeBonus)}` : '') + (gain.bossBonus ? ` · jefe +${fmt(gain.bossBonus)}` : '');
    $('resTotal').textContent = `Total ${fmt(total)} pts`;
    $('resBar').style.animationDuration = ms + 'ms';
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    countUp($('resPts'), 0, gain.total, Math.min(700, ms - 200), (v) => '+' + fmt(Math.round(v)));
    countUp($('score'), previous, total, 400);
    if (perfect) perfectFx(streakMult);
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
