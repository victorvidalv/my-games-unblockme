import { sfx, tone, vib } from '../audio/sound.js';
import { HERO_TALK } from '../data/story.js';
import { ZONES, zoneIdx } from '../data/zones.js';
import { $, cssUrl } from '../dom.js';
import { saveRun } from '../game/session.js';
import { S, heroOf } from '../state.js';
import { BONUS_KINDS, CATCH, PENDULUM, REEL_SPEEDS, RUNES, catchPace, catchPrize, comboBonus, pendulumPoints, pendulumPrize, pendulumPeriod, pendulumZone, pickBonusKind, reelPosition, reelStopSymbol, runeShowMs, runesPrize, scalePrize, slotPart } from '../game/minigames.js';
import { burst } from './fx.js';
import { heroMarkup } from './heroes.js';

/* ============================ Minijuegos de descanso ============================
   Cada 10 niveles (15, 25… 95) hay un descanso con un minijuego que da PISTAS. El premio máximo es proporcional al nivel
   (de 3 pistas en el 15 a 10 en el 95); las reglas puras están en game/minigames.js y aquí vive solo la interfaz.
     cartas · rueda · altar de los ecos (tragaperras: tú paras los rodillos) · luciérnagas (rápidas, cada vez más). */
export const isBonusLevel = (level) => level >= 15 && level < 100 && level % 10 === 5;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 100) : ms));
const pistas = (n) => `+${n} pista${n === 1 ? '' : 's'}`;
const centerOf = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

function runeIcon(index) {
  const paths = [
    '<circle cx="13" cy="12" r="5"/><path d="M17 16l13 13m-4-4 4-4m-9 0 4-4"/>',
    '<path d="M21 5c2 8-7 9-7 17a7 7 0 0 0 14 0c0-5-2-9-4-11 1 7-3 7-3 7"/>',
    '<path d="M27 6A15 15 0 1 0 34 28 15 15 0 0 1 27 6Z"/>',
  ];
  return `<svg class="rune-icon" viewBox="0 0 42 42" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths[index % 3]}</svg>`;
}

/** Premio en «partes» (0-3) de cada carta y de cada sector de la rueda; scalePrize las pasa a pistas según el nivel. */
const CARD_TYPES = [{ n: 'Llave', part: 1, c: '#43e0c1' }, { n: 'Llama', part: 3, c: '#ffd24a' }, { n: 'Luna', part: 0, c: '#ff4a6a' }];
const WHEEL_PARTS = [1, 0, 2, 1, 3, 1, 2, 1];
const WHEEL_COLORS = { 0: '#3b4150', 1: '#2f6f68', 2: '#94702c', 3: '#7b3f93' };
const REEL_NAMES = ['Llave', 'Llama', 'Luna'];

function createBonusPlan(level) {
  const kind = pickBonusKind();
  const deck = [0, 0, 0, 1, 1, 1, 2, 2, 2];
  for (let i = 8; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return { kind, level, deck, opened: [], wheel: Math.floor(Math.random() * 8), reels: [0, 0, 0], score: 0 };
}

/**
 * La ruleta del destino: la gira el JUGADOR (toca el botón, el anillo o arrástralo). Seis sellos, uno por minijuego;
 * el anillo gira, «chasquea» y se detiene en el que toca. Es misteriosa, corta (~3 s) y se puede saltar.
 */
const FATE_SIGILS = { cards: ['△', 'Las cartas del umbral'], wheel: ['✺', 'La rueda de los sellos'], slots: ['❖', 'El altar de los ecos'], catch: ['✦', 'Las luciérnagas de Thyes'], runes: ['ᚱ', 'Las runas de la memoria'], pendulum: ['◐', 'El péndulo del tiempo'] };
const FATE_COLORS = ['#2f6f68', '#a85a45', '#b58a3a', '#2b5460', '#8c4b3a', '#8f7430'];
function playFate(card, kind) {
  return new Promise((resolve) => {
    const idx = BONUS_KINDS.indexOf(kind), fate = document.createElement('div');
    const pt = (r, a) => [160 + r * Math.cos((a * Math.PI) / 180), 160 + r * Math.sin((a * Math.PI) / 180)];
    const sectors = BONUS_KINDS.map((k, i) => {
      const a = -90 + i * 60, p = pt(150, a), q = pt(150, a + 60), g = pt(104, a + 30);
      return `<path class="sec" data-k="${k}" d="M160 160L${p}A150 150 0 0 1 ${q}Z" fill="${FATE_COLORS[i]}"/><text class="glyph" x="${g[0]}" y="${g[1]}" text-anchor="middle" dominant-baseline="central" transform="rotate(${a + 30 + 90} ${g[0]} ${g[1]})">${FATE_SIGILS[k][0]}</text>`;
    }).join('');
    fate.className = 'bfate';
    fate.innerHTML = `<h3 class="fate-title">LA RULETA DEL DESTINO</h3><p class="fate-sub">Seis juegos. Gira y que elija el destino.</p>
      <div class="fate-stage"><span class="fate-pointer" aria-hidden="true">▼</span><i class="fate-lights" aria-hidden="true"></i>
        <svg class="fate-wheel fate-ring" viewBox="0 0 320 320" role="button" tabindex="0" aria-label="Gira la ruleta del destino">${sectors}<circle cx="160" cy="160" r="150" fill="none" stroke="#b8a16d" stroke-width="3"/></svg>
        <button type="button" class="fate-hub" aria-label="Girar">GIRAR</button></div>
      <p class="fate-line" role="status">TOCA O ARRASTRA LA RULETA</p>
      <button type="button" class="primary fate-spin">¡Girar!</button><button type="button" class="fate-skip">Saltar</button>`;
    card.appendChild(fate);
    const ring = fate.querySelector('.fate-ring'), pointer = fate.querySelector('.fate-pointer'), line = fate.querySelector('.fate-line');
    const spinBtn = fate.querySelector('.fate-spin'), hub = fate.querySelector('.fate-hub'), skip = fate.querySelector('.fate-skip');
    let done = false, spun = false, raf = 0, anim = null;
    const end = async () => {
      if (done) return; done = true; cancelAnimationFrame(raf);
      fate.classList.add('leave'); await wait(420); fate.remove(); resolve();
    };
    const spin = (power = 0.5) => {
      if (spun) return; spun = true;
      fate.classList.add('spinning');
      spinBtn.hidden = true; line.textContent = 'EL DESTINO ELIGE…';
      const turns = 3 + Math.round(Math.max(0, Math.min(1, power)) * 3);       // más fuerte el empujón, más vueltas
      const dur = reduced() ? 120 : 2600 + turns * 330, target = 360 * turns - 30 - idx * 60;
      anim = ring.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${target}deg)` }], { duration: dur, easing: 'cubic-bezier(.1,.72,.12,1)', fill: 'forwards' });
      sfx.fateSpin();
      let total = 0, prev = 0, ticks = 0;
      const watch = () => {
        const mt = /matrix\(([^,]+),([^,]+)/.exec(getComputedStyle(ring).transform);
        if (mt) {
          const deg = (Math.atan2(Number(mt[2]), Number(mt[1])) * 180) / Math.PI, d = (deg - prev + 360) % 360;
          prev = deg; total += d;
          const n = Math.floor(total / 60);
          if (n > ticks) {
            ticks = n;
            const under = ((Math.round((-30 - total) / 60) % 6) + 6) % 6;     // sector que pasa bajo la flecha
            line.textContent = FATE_SIGILS[BONUS_KINDS[under]][1].toUpperCase();
            pointer.classList.remove('tick'); void pointer.offsetWidth; pointer.classList.add('tick'); sfx.fateTick(n);
          }
        }
        raf = requestAnimationFrame(watch);
      };
      raf = requestAnimationFrame(watch);
      anim.finished.then(async () => {
        cancelAnimationFrame(raf);
        const chosen = fate.querySelector(`[data-k="${kind}"]`);
        chosen.classList.add('chosen'); fate.classList.add('landed'); fate.classList.remove('spinning');
        line.textContent = FATE_SIGILS[kind][1].toUpperCase();
        sfx.fateLand(); vib([20, 30, 20]);
        const [x, y] = centerOf(fate.querySelector('.fate-stage')); burst(x, y, 40, ['#f1ce82', '#ffe9b0', '#43e0c1', '#c9795f'], 5.5);
        await wait(1100); end();
      }, end);
    };
    spinBtn.onclick = () => spin(0.5);
    hub.onclick = () => spin(0.5);
    skip.onclick = () => { if (anim) { try { anim.finish(); } catch { end(); } } else end(); };
    // arrastrar o tocar la ruleta también la gira (más rápido el gesto, más vueltas)
    let down = null;
    ring.onpointerdown = (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; try { ring.setPointerCapture(e.pointerId); } catch { /* sin captura */ } };
    ring.onpointerup = (e) => {
      if (!down) return;
      const d = Math.hypot(e.clientX - down.x, e.clientY - down.y), v = d / Math.max(60, performance.now() - down.t);
      down = null; spin(d < 12 ? 0.5 : Math.min(1, v / 1.6));
    };
    ring.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spin(0.5); } };
    setTimeout(() => spinBtn.focus(), 60);
  });
}

/** Destello de premio: nube de partículas y un cartel grande con lo ganado. */
function prizePop(stage, prize) {
  const pop = document.createElement('div');
  pop.className = 'bpop' + (prize ? '' : ' bad');
  pop.innerHTML = `<b>${prize >= 7 ? '🌟' : prize ? '💡' : '·'}</b><span>${prize ? pistas(prize) : 'Sin premio'}</span>`;
  stage.appendChild(pop);
  setTimeout(() => pop.remove(), 1600);
  if (prize) { const [x, y] = centerOf(stage); burst(x, y, 30 + prize * 6, undefined, 6 + Math.min(prize, 8) * 0.5); }
}

export async function showBonus() {
  S.run.bonusPlan ||= createBonusPlan(Math.max(15, S.run.level - 1));
  S.run.bonusPlan.introSeen = true;
  saveRun();
  return new Promise((resolve) => {
    const plan = S.run.bonusPlan;
    plan.level ||= Math.max(15, S.run.level - 1);
    const level = plan.level;
    const part = (p) => scalePrize(p, level);
    const m = $('bonus'), stage = $('bStage'), go = $('bGo'), action = $('bAction'), result = $('bRes');
    const titles = { cards: 'Las cartas del umbral', wheel: 'La rueda de los sellos', slots: 'El altar de los ecos', catch: 'Las luciérnagas de Thyes', runes: 'Las runas de la memoria', pendulum: 'El péndulo del tiempo' };
    const lines = {
      cards: 'Toca las cartas. Gana el primer trío de símbolos iguales.',
      wheel: 'Pulsa girar. La flecha elige tu premio.',
      slots: 'Pulsa PARAR en cada amuleto. Busca símbolos iguales.',
      catch: 'Toca las luciérnagas antes de que escapen. ¡Las doradas valen 3!',
      runes: 'Mira la secuencia de runas y repítela.',
      pendulum: 'Toca cuando la bola esté en la zona dorada.',
    };
    const zone = zoneIdx(Math.max(1, S.run.level - 1));
    m.style.setProperty('--bonus-scene', cssUrl('historia/tesoro.webp'));   // el cuarto del tesoro: fondo de todos los minijuegos
    m.dataset.game = plan.kind;
    $('bTag').textContent = `UN DESCANSO · ${ZONES[zone].n.toUpperCase()}`;
    $('bTitle').textContent = titles[plan.kind];
    $('bSub').textContent = lines[plan.kind];
    $('bHero').innerHTML = heroMarkup(heroOf(), 'story');
    $('bSpeech').textContent = HERO_TALK[heroOf().id].bonus[plan.kind];
    $('bHints').textContent = S.run.hints;
    result.innerHTML = '';
    result.className = 'bres';
    stage.innerHTML = '';
    stage.className = 'bonus-stage ' + plan.kind;
    go.hidden = true; go.style.display = 'none'; go.disabled = false;
    action.hidden = plan.kind === 'cards'; action.disabled = false;
    action.textContent = { wheel: 'Girar la rueda', catch: '¡Empezar a cazar!', slots: '¡Girar los amuletos!', runes: 'Mostrar las runas', pendulum: '¡Soltar el péndulo!' }[plan.kind] || '';
    const t = CATCH.tiers;
    $('bLegend').innerHTML = {
      cards: `<span>Llaves ${pistas(part(1))}</span><span>Llamas ${pistas(part(3))}</span><span>Lunas: nada</span>`,
      wheel: `<span>Premios: ${[...new Set(WHEEL_PARTS.map(part))].sort((a, b) => a - b).join(', ')} pistas</span>`,
      catch: `<span>${t[0]} luces ${pistas(part(1))}</span><span>${t[1]}: ${pistas(part(2))}</span><span>${t[2]}: ${pistas(part(3))}</span>`,
      slots: `<span>Tres iguales ${pistas(part(3))}</span><span>Dos iguales ${pistas(part(1))}</span>`,
      runes: `<span>${RUNES.tiers[0]} rondas ${pistas(part(1))}</span><span>${RUNES.tiers[1]}: ${pistas(part(2))}</span><span>${RUNES.tiers[2]}: ${pistas(part(3))}</span>`,
      pendulum: `<span>${PENDULUM.tiers[0]} puntos ${pistas(part(1))}</span><span>${PENDULUM.tiers[1]}: ${pistas(part(2))}</span><span>${PENDULUM.tiers[2]}: ${pistas(part(3))}</span>`,
    }[plan.kind];
    let locked = plan.prize !== undefined;

    async function finish(prize, restore = false) {
      locked = true;
      plan.prize = prize;
      saveRun();
      action.disabled = true; action.hidden = true;
      $('bSpeech').textContent = HERO_TALK[heroOf().id][prize ? 'prize' : 'empty'];
      result.className = 'bres ' + (prize ? 'good' : 'neutral');
      result.innerHTML = `<b>${prize ? pistas(prize) : 'Sin premio'}</b><span>${prize ? 'Para las puertas que faltan.' : 'Tu reserva de pistas se conserva.'}</span>`;
      $('bHints').textContent = S.run.hints + prize;
      if (!restore) {
        prizePop(stage, prize);
        if (prize) { tone(660, 0.15, 'sine', 0.05); tone(880, 0.2, 'sine', 0.04, 0.1); tone(1175, 0.3, 'triangle', 0.04, 0.2); vib([20, 30, 20]); } else tone(280, 0.16, 'sine', 0.025);
        await wait(300);
      }
      go.hidden = false; go.style.display = ''; go.textContent = 'Seguir el camino →'; go.focus();
    }
    go.onclick = () => { if (go.disabled || plan.prize === undefined) return; go.disabled = true; m.classList.remove('show'); delete S.run.bonusPlan; resolve(plan.prize); };

    /* ---------------------------- Cartas ---------------------------- */
    if (plan.kind === 'cards') {
      stage.innerHTML = '<div class="bgrid" id="bGrid"></div>';
      const grid = $('bGrid');
      const cards = plan.deck.map((ty, i) => {
        const P = CARD_TYPES[ty], prize = part(P.part), b = document.createElement('button');
        const label = P.part ? pistas(prize) : 'Sin premio';
        b.className = 'bcard'; b.type = 'button';
        b.style.setProperty('--i', i); b.style.setProperty('--pc', P.c);
        b.setAttribute('aria-label', `Carta ${i + 1}, oculta`);
        b.innerHTML = `<span class="bin"><span class="bb"><i>△</i></span><span class="bf"><b>${runeIcon(ty)}</b><small>${label}</small></span></span>`;
        grid.appendChild(b);
        if (plan.opened.includes(i)) { b.classList.add('on'); b.setAttribute('aria-label', label); }
        b.onclick = () => {
          if (locked || plan.opened.includes(i)) return;
          plan.opened.push(i);
          b.classList.add('on'); b.setAttribute('aria-label', label);
          tone(500 + plan.opened.length * 55, 0.1, 'triangle', 0.07);
          const [x, y] = centerOf(b); burst(x, y, 10, [P.c, '#fff3b0'], 3.2);
          saveRun();
          const count = plan.opened.filter((k) => plan.deck[k] === ty).length;
          if (count === 2) {
            $('bSpeech').textContent = '«¡Ya hay dos iguales! Falta una…»';
            cards.forEach((c, k) => { if (plan.opened.includes(k) && plan.deck[k] === ty) c.classList.add('pair'); });
            tone(880, 0.12, 'sine', 0.05);
          }
          if (count === 3) {
            locked = true;
            cards.forEach((c, k) => c.classList.add(plan.deck[k] === ty ? 'winc' : 'dim'));
            grid.classList.add('won');
            finish(part(P.part));
          }
        };
        return b;
      });

    /* ---------------------------- Luciérnagas ---------------------------- */
    } else if (plan.kind === 'catch') {
      stage.innerHTML = `<div class="catch-field" id="cField"><div class="catch-hud"><span>⏱ <b id="cTime">${CATCH.duration / 1000}</b> s</span><span class="catch-combo" id="cCombo"></span><span>✦ <b id="cScore">0</b></span></div><div class="catch-bar"><i id="cBar"></i></div></div>`;
      const field = $('cField');
      if (locked) { field.insertAdjacentHTML('beforeend', `<div class="catch-end">Cazaste ${plan.score || 0} ✦</div>`); $('cScore').textContent = plan.score || 0; }
      action.onclick = () => {
        if (locked) return;
        locked = true; action.hidden = true;
        let score = 0, streak = 0, best = 0;
        $('bSpeech').textContent = HERO_TALK[heroOf().id].bonus.catch;
        sfx.start();
        const t0 = performance.now();
        field.classList.add('playing');
        const setCombo = (n) => { const c = $('cCombo'); c.textContent = n >= 2 ? `×${n} seguidas` : ''; c.classList.toggle('hot', n >= 5); };
        const catchOne = (f, gold) => {
          if (f.classList.contains('caught')) return;
          f.classList.add('caught');
          streak++; best = Math.max(best, streak);
          const extra = comboBonus(streak);
          score += (gold ? CATCH.goldValue : 1) + extra;
          $('cScore').textContent = score; setCombo(streak);
          tone(gold ? 1175 : 700 + Math.min(streak, 20) * 28, gold ? 0.22 : 0.09, gold ? 'triangle' : 'sine', gold ? 0.09 : 0.06);
          const [x, y] = centerOf(f);
          burst(x, y, gold ? 18 : 8, gold ? ['#ffd24a', '#fff3b0'] : ['#d7ff7a', '#fbffc2'], gold ? 4.5 : 3);
          if (extra) { tone(1568, 0.25, 'sine', 0.06, 0.06); vib(20); field.classList.remove('combo-flash'); void field.offsetWidth; field.classList.add('combo-flash'); }
          if (gold) vib(15);
          setTimeout(() => f.remove(), 320);
        };
        const spawnOne = (p) => {
          const gold = Math.random() < CATCH.goldChance, pace = catchPace(p);
          const f = document.createElement('button');
          f.type = 'button'; f.className = 'ff' + (gold ? ' gold' : '');
          f.setAttribute('aria-label', gold ? 'Luciérnaga dorada: 3 puntos' : 'Luciérnaga');
          f.style.left = 6 + Math.random() * 82 + '%';
          f.style.setProperty('--t', pace.rise * (0.85 + Math.random() * 0.4) + 's');
          f.style.setProperty('--dx', Math.random() * 70 - 35 + 'px');
          f.innerHTML = gold ? '★' : '✦';
          f.onpointerdown = (e) => { e.preventDefault(); catchOne(f, gold); };
          f.addEventListener('animationend', (e) => {
            if (e.animationName !== 'ff-rise') return;
            if (!f.classList.contains('caught') && streak) { streak = 0; setCombo(0); field.classList.remove('miss'); void field.offsetWidth; field.classList.add('miss'); }
            f.remove();
          });
          field.appendChild(f);
        };
        let stopped = false;
        const loop = () => {
          if (stopped) return;
          const p = Math.min(1, (performance.now() - t0) / CATCH.duration), pace = catchPace(p);
          for (let k = 0; k < pace.group; k++) setTimeout(() => !stopped && spawnOne(p), k * 70);
          setTimeout(loop, pace.delay);
        };
        loop();
        const clock = setInterval(() => {
          const used = performance.now() - t0;
          $('cTime').textContent = Math.max(0, Math.ceil((CATCH.duration - used) / 1000));
          $('cBar').style.width = Math.min(100, (used / CATCH.duration) * 100) + '%';
          field.style.setProperty('--hot', Math.min(1, used / CATCH.duration));
          if (used >= CATCH.duration) {
            stopped = true; clearInterval(clock);
            field.classList.remove('playing');
            field.querySelectorAll('.ff').forEach((e) => e.remove());
            plan.score = score;
            field.insertAdjacentHTML('beforeend', `<div class="catch-end">¡Cazaste ${score} ✦!<small>mejor racha: ${best}</small></div>`);
            finish(catchPrize(score, level));
          }
        }, 100);
      };

    /* ---------------------------- Rueda ---------------------------- */
    } else if (plan.kind === 'wheel') {
      let sectors = '';
      const point = (r, a) => [160 + r * Math.cos((a * Math.PI) / 180), 160 + r * Math.sin((a * Math.PI) / 180)];
      WHEEL_PARTS.forEach((v, i) => {
        const a = -90 + i * 45, p = point(140, a), q = point(140, a + 45), tx = point(104, a + 22.5), prize = part(v);
        sectors += `<path data-sector="${i}" d="M160 160L${p}A140 140 0 0 1 ${q}Z" fill="${WHEEL_COLORS[v]}" stroke="#e9d9a8aa" stroke-width="1.5"/>`
          + `<text x="${tx[0]}" y="${tx[1]}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${a + 22.5 + 90} ${tx[0]} ${tx[1]})" class="wheel-num${v ? '' : ' nil'}">${v ? '+' + prize : '✕'}</text>`;
      });
      stage.innerHTML = `<div class="wheel-shell"><span class="wheel-pointer" aria-hidden="true">▼</span><svg class="prize-wheel" viewBox="0 0 320 320" role="img" aria-label="Rueda de ocho premios en pistas.">${sectors}<circle cx="160" cy="160" r="140" fill="none" stroke="#b8a16d" stroke-width="3"/></svg><div class="wheel-hub">${runeIcon(0)}</div><i class="wheel-lights" aria-hidden="true"></i></div>`;
      const wheel = stage.querySelector('.prize-wheel'), pointer = stage.querySelector('.wheel-pointer'), shell = stage.querySelector('.wheel-shell');
      const angle = 1440 - 22.5 - plan.wheel * 45;
      if (locked) { wheel.style.transform = `rotate(${angle}deg)`; wheel.querySelector(`[data-sector="${plan.wheel}"]`).setAttribute('stroke', '#fff3b0'); }
      action.onclick = async () => {
        if (locked) return;
        locked = true; action.disabled = true; action.textContent = 'La rueda está girando…';
        $('bSpeech').textContent = 'La flecha decide.';
        sfx.start(); shell.classList.add('spinning');
        const dur = reduced() ? 150 : 3200;
        const anim = wheel.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${angle}deg)` }], { duration: dur, easing: 'cubic-bezier(.12,.74,.12,1)', fill: 'forwards' });
        let total = 0, prevDeg = 0, ticks = 0, raf = 0;
        const watch = () => {                                          // la flecha «chasquea» y suena cada vez que pasa un sector
          const mt = /matrix\(([^,]+),([^,]+)/.exec(getComputedStyle(wheel).transform);
          if (mt) {
            const deg = (Math.atan2(Number(mt[2]), Number(mt[1])) * 180) / Math.PI, d = (deg - prevDeg + 360) % 360;
            prevDeg = deg; total += d;
            const n = Math.floor(total / 45);
            if (n > ticks) { ticks = n; pointer.classList.remove('tick'); void pointer.offsetWidth; pointer.classList.add('tick'); tone(360 + (n % 8) * 38, 0.04, 'triangle', 0.035); }
          }
          raf = requestAnimationFrame(watch);
        };
        raf = requestAnimationFrame(watch);
        try { await anim.finished; } finally { cancelAnimationFrame(raf); shell.classList.remove('spinning'); }
        const win = wheel.querySelector(`[data-sector="${plan.wheel}"]`);
        win.setAttribute('stroke', '#fff3b0'); win.classList.add('win');
        await finish(part(WHEEL_PARTS[plan.wheel]));
      };

    /* ---------------------------- Runas de memoria (tipo «Simón») ---------------------------- */
    } else if (plan.kind === 'runes') {
      const RUNE_COLORS = ['#43e0c1', '#ffd24a', '#ff6a8a', '#b18cff'], RUNE_TONES = [392, 494, 587, 698];
      stage.innerHTML = `<div class="runes-board" id="rBoard"><div class="runes-orb" id="rOrb"><small>RONDA</small><b id="rRound">0</b><span id="rState">Mira…</span></div>${RUNE_COLORS.map((c, i) => `<button type="button" class="rune-pad" data-r="${i}" style="--rc:${c}" aria-label="Runa ${i + 1}" disabled>${runeIcon(i)}</button>`).join('')}</div>`;
      const board = $('rBoard'), pads = [...board.querySelectorAll('.rune-pad')], state = $('rState'), roundEl = $('rRound');
      if (locked) { roundEl.textContent = plan.rounds || 0; state.textContent = 'Fin'; }
      const light = async (i, ms) => { pads[i].classList.add('lit'); tone(RUNE_TONES[i], ms / 1000, 'triangle', 0.08); await wait(ms); pads[i].classList.remove('lit'); };
      action.onclick = async () => {
        if (locked) return;
        locked = true; action.hidden = true;
        const seq = Array.from({ length: RUNES.start }, () => Math.floor(Math.random() * RUNES.count));
        let rounds = 0, alive = true;
        $('bSpeech').textContent = HERO_TALK[heroOf().id].bonus.runes;
        sfx.start();
        while (alive && rounds < RUNES.maxRounds) {
          board.classList.remove('your-turn'); pads.forEach((p) => { p.disabled = true; });
          state.textContent = 'Mira…'; await wait(550);
          for (const r of seq) { await light(r, runeShowMs(rounds)); await wait(120); }
          state.textContent = '¡Tu turno!'; board.classList.add('your-turn'); pads.forEach((p) => { p.disabled = false; });
          const ok = await new Promise((done) => {
            let k = 0;
            pads.forEach((p, i) => { p.onclick = async () => {
              if (i !== seq[k]) { pads.forEach((q) => { q.onclick = null; q.disabled = true; }); p.classList.add('wrong'); tone(160, 0.3, 'sawtooth', 0.06); vib([40, 40, 40]); await wait(500); p.classList.remove('wrong'); done(false); return; }
              k++; p.classList.add('lit'); tone(RUNE_TONES[i], 0.18, 'triangle', 0.08); setTimeout(() => p.classList.remove('lit'), 160);
              if (k === seq.length) { pads.forEach((q) => { q.onclick = null; q.disabled = true; }); done(true); }
            }; });
          });
          if (!ok) { alive = false; break; }
          rounds++; roundEl.textContent = rounds; plan.rounds = rounds; saveRun();
          const [x, y] = centerOf($('rOrb')); burst(x, y, 14, RUNE_COLORS, 4); tone(880, 0.12, 'sine', 0.05);
          seq.push(Math.floor(Math.random() * RUNES.count));
        }
        board.classList.remove('your-turn'); state.textContent = rounds >= RUNES.maxRounds ? '¡Memoria perfecta!' : 'Fin';
        plan.rounds = rounds;
        await finish(runesPrize(rounds, level));
      };

    /* ---------------------------- Péndulo (para en la zona dorada) ---------------------------- */
    } else if (plan.kind === 'pendulum') {
      stage.innerHTML = `<div class="pend-field" id="pField"><div class="pend-top"><span>LANZAMIENTO <b id="pThrow">1</b>/${PENDULUM.throws}</span><span>✦ <b id="pPts">0</b></span></div><div class="pend-track" id="pTrack"><i class="pend-zone" id="pZone"><i></i></i><b class="pend-ball" id="pBall"></b></div><div class="pend-marks" id="pMarks">${Array.from({ length: PENDULUM.throws }, () => '<i></i>').join('')}</div></div>`;
      const track = $('pTrack'), ball = $('pBall'), zoneEl = $('pZone'), marks = [...$('pMarks').children];
      const setZone = (i) => { zoneEl.style.width = pendulumZone(i) * 94 + '%'; };
      setZone(0);
      if (locked) { $('pPts').textContent = plan.points || 0; $('pThrow').textContent = PENDULUM.throws; }
      let swing = null;
      const stopSwing = () => { if (swing) { cancelAnimationFrame(swing.raf); swing = null; } };
      action.onclick = async () => {
        if (locked) return;
        locked = true;
        let i = 0, total = 0;
        $('bSpeech').textContent = HERO_TALK[heroOf().id].bonus.pendulum;
        sfx.start();
        action.hidden = false; action.disabled = false;
        const throwOne = () => new Promise((done) => {
          setZone(i); $('pThrow').textContent = i + 1; action.textContent = '¡PARAR!';
          const period = pendulumPeriod(i), zone = pendulumZone(i), t0 = performance.now();
          let x = 0;
          const step = () => { x = Math.sin(((performance.now() - t0) / period) * Math.PI * 2); ball.style.left = 50 + x * 47 + '%'; swing = { raf: requestAnimationFrame(step) }; };
          step();
          const hit = () => {
            stopSwing(); action.removeEventListener('click', hit); track.removeEventListener('pointerdown', hit);
            const pts = pendulumPoints(x, zone);
            marks[i].className = pts === 2 ? 'perfect' : pts === 1 ? 'ok' : 'miss';
            marks[i].textContent = pts === 2 ? '★' : pts === 1 ? '✓' : '✕';
            ball.classList.remove('pop'); void ball.offsetWidth; ball.classList.add('pop');
            tone(pts === 2 ? 1175 : pts ? 784 : 200, 0.18, pts ? 'triangle' : 'sawtooth', 0.08); vib(pts ? 10 : [30, 30]);
            const [bx, by] = centerOf(ball); if (pts) burst(bx, by, pts === 2 ? 20 : 8, ['#ffd24a', '#fff3b0'], 3.5);
            done(pts);
          };
          action.addEventListener('click', hit); track.addEventListener('pointerdown', hit);
        });
        while (i < PENDULUM.throws) {
          const pts = await throwOne();
          total += pts; $('pPts').textContent = total; i++;
          if (i < PENDULUM.throws) { action.disabled = true; await wait(650); action.disabled = false; }
        }
        action.onclick = null; plan.points = total;
        await finish(pendulumPrize(total, level));
      };

    /* ---------------------------- Altar de los ecos (tragaperras) ---------------------------- */
    } else {
      const ROW = 88;
      stage.innerHTML = '<div class="amulet-machine"><div class="machine-crown">EL ALTAR DE LOS ECOS</div><div class="reels"></div><div class="machine-plaque" id="mPlaque">GIRA Y PARA CADA AMULETO</div><div class="machine-lights" aria-hidden="true">✧ · ✧ · ✧ · ✧ · ✧ · ✧ · ✧</div></div>';
      const reels = stage.querySelector('.reels'), plaque = $('mPlaque');
      const strips = [0, 1, 2].map((i) => {
        const reel = document.createElement('button');
        reel.type = 'button'; reel.className = 'reel'; reel.setAttribute('aria-label', `Amuleto ${i + 1}`);
        reel.innerHTML = `<div class="reel-strip">${Array.from({ length: 6 }, (_, k) => `<span>${runeIcon(k % 3)}</span>`).join('')}</div><i class="reel-line" aria-hidden="true"></i>`;
        reels.appendChild(reel);
        return reel.querySelector('.reel-strip');
      });
      const reelEls = [...reels.querySelectorAll('.reel')];
      const place = (i, pos) => { strips[i].style.transform = `translateY(${-(((pos % 3) + 3) % 3) * ROW}px)`; };
      if (locked) { plan.reels.forEach((sym, i) => { place(i, sym); reelEls[i].classList.add('stopped'); }); const n = plan.reels.map((v) => plan.reels.filter((x) => x === v).length); reelEls.forEach((r, i) => { if (n[i] >= 2) r.classList.add('match'); }); }
      else strips.forEach((_, i) => place(i, 0));
      const start = [Math.random() * 3, Math.random() * 3, Math.random() * 3];
      const stoppedAt = [null, null, null];
      let t0 = 0, raf = 0;
      const nextReel = () => stoppedAt.findIndex((v) => v === null);
      const refreshButton = () => {
        const n = nextReel();
        action.textContent = n < 0 ? '…' : `¡PARAR ${n + 1}!`;
        plaque.textContent = n < 0 ? 'LOS ECOS HAN HABLADO' : `PARA EL AMULETO ${n + 1}`;
      };
      const spin = () => {
        const now = performance.now() - t0;
        stoppedAt.forEach((v, i) => { if (v === null) place(i, reelPosition(now, REEL_SPEEDS[i], start[i])); });
        raf = requestAnimationFrame(spin);
      };
      const stopReel = (i) => {
        if (!locked || stoppedAt[i] !== null || !t0) return;
        const pos = reelPosition(performance.now() - t0, REEL_SPEEDS[i], start[i]), target = Math.round(pos), sym = reelStopSymbol(pos);
        stoppedAt[i] = sym;
        const t1 = performance.now(), D = reduced() ? 10 : 220;
        const settle = () => {                                         // el rodillo se asienta con un pequeño rebote
          const k = Math.min(1, (performance.now() - t1) / D), c1 = 2.2, e = 1 + (c1 + 1) * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
          place(i, pos + (target - pos) * e);
          if (k < 1) requestAnimationFrame(settle); else place(i, target);
        };
        settle();
        reelEls[i].classList.add('stopped'); reelEls[i].setAttribute('aria-label', `Amuleto ${i + 1}: ${REEL_NAMES[sym]}`);
        tone(520 + i * 160, 0.12, 'triangle', 0.08); vib(8);
        const [x, y] = centerOf(reelEls[i]); burst(x, y, 8, ['#ffe29a', '#fff'], 2.6);
        refreshButton();
        if (stoppedAt.every((v) => v !== null)) conclude();
      };
      const conclude = async () => {
        cancelAnimationFrame(raf);
        stage.classList.remove('spinning'); action.disabled = true;
        plan.reels = stoppedAt.slice();
        const n = plan.reels.map((v) => plan.reels.filter((x) => x === v).length);
        await wait(260);
        reelEls.forEach((r, i) => { if (n[i] >= 2) r.classList.add('match'); });
        if (Math.max(...n) === 3) stage.classList.add('jackpot');
        await finish(part(slotPart(plan.reels)));
      };
      reelEls.forEach((r, i) => { r.onclick = () => stopReel(i); });
      action.onclick = () => {
        if (!locked && !t0) {                                           // primer toque: empiezan a girar los tres
          locked = true; t0 = performance.now();
          stage.classList.add('spinning'); sfx.start();
          $('bSpeech').textContent = '«Uno… dos… ¡y el último! Toca cada amuleto, o el botón.»';
          refreshButton(); raf = requestAnimationFrame(spin);
        } else if (t0 && nextReel() >= 0) stopReel(nextReel());       // luego, cada toque para el siguiente
      };
      if (plan.prize === undefined) { action.hidden = false; action.disabled = false; }
    }
    m.classList.add('show');
    if (plan.prize !== undefined) { finish(plan.prize, true); return; }
    const focusGame = () => { if (plan.kind !== 'cards') action.focus(); else stage.querySelector('button')?.focus(); };
    if (!plan.fateSeen && !locked) {                              // primera vez: la ruleta del destino anuncia el minijuego
      plan.fateSeen = true; saveRun();
      m.classList.add('fating');
      playFate(m.querySelector('.bonuscard'), plan.kind).then(() => { m.classList.remove('fating'); focusGame(); });
    } else focusGame();
  });
}
