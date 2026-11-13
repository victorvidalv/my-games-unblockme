import { $ } from '../dom.js';
import { SHOP_ITEMS, availability, buy, itemById, priceOf } from '../game/shop.js';
import { saveRun, skipLevel } from '../game/session.js';
import { S } from '../state.js';
import { layout, recLine, updateHud } from './board.js';
import { ask } from './menu.js';
import { playBuyEffect, playRewindEffect } from './turns.js';

const fmt = (n) => n.toLocaleString('de-DE');

/** Refleja en pantalla la compra ya cobrada. */
function applyEffects(id) {
  $('score').textContent = fmt(S.run.score);
  recLine();
  if (id === 'hint') {
    $('hintN').textContent = S.run.hints;
    $('bHint').disabled = false;
  } else if (id === 'moves') {
    $('lim').textContent = S.G.limit;
    updateHud();
    playBuyEffect();
    $('msg').textContent = `⏳ ${itemById('moves').name}. Ahora el límite es ${S.G.limit}.`;
  } else if (id === 'redo') {
    playRewindEffect();
    layout();
    $('bUndo').disabled = true;
    updateHud();
    $('msg').textContent = '↺ Tablero reiniciado desde cero.';
  }
  saveRun();
}

/** Compra con confirmación (los precios son altos). Devuelve true si se compró. */
export async function confirmBuy(id) {
  const item = itemById(id);
  const price = priceOf(id, S.G.rate);
  const ok = await ask({
    ico: item.icon, title: `${item.name} · ${fmt(price)} pts`,
    text: `${item.detail}<br><br>Tienes <b>${fmt(S.run.score)}</b> puntos y te quedarían <b>${fmt(S.run.score - price)}</b>.`,
    yes: 'Comprar', no: 'Ahora no',
  });
  if (!ok) return false;
  const r = buy(id, { run: S.run, G: S.G });
  if (!r.ok) return false;
  applyEffects(id);
  return true;
}

/* ---------- Don Dublón habla ---------- */
const SAY = {
  greet: ['¡Pasen, pasen! Todo tiene precio… y el mío es justo.', 'Mmm… huelo puntos en tu bolsillo.', 'Ayudas, atajos y milagros. ¡Todo a su precio!'],
  hint: 'Una pista: el mejor movimiento, susurrado por mí. Barato… para lo que vale.',
  moves: '¿Sin turnos? Cinco más. Eso no se regala, amigo.',
  redo: 'Rebobino el tablero. Mi tiempo vale oro.',
  skip: '¿Saltar un nivel? Es un lujo. Y los lujos se pagan.',
  poor: ['¿Eso es todo lo que tienes? Vuelve con más monedas.', 'Sin monedas no hay milagros.', 'Mi bolsa está llena; la tuya… no tanto.'],
  bought: ['¡Un placer hacer negocios!', '¡Excelente compra! No hay devoluciones.', '¡Cling, cling! Eso suena bien.'],
  decline: ['Piénsalo… los precios no bajan.', 'Tú decides. El oro no huye.'],
  nothing: ['Aún no has movido nada. ¿Qué voy a rebobinar?'],
};
const SHORT = { hint: 'Te enseña el mejor movimiento', moves: '+5 al límite de este tablero', redo: 'Empieza de cero con 0 movimientos', skip: 'Pasa de nivel sin puntos ni racha' };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function say(text, mood) {
  const b = $('shopBubble');
  b.textContent = text;
  b.classList.remove('say');
  void b.offsetWidth;
  b.classList.add('say');
  if (mood) {
    const m = $('merchant');
    m.classList.remove('happy', 'nope');
    void m.offsetWidth;
    m.classList.add(mood);
  }
}

function render() {
  $('shopScore').textContent = fmt(S.run.score);
  $('shopList').innerHTML = SHOP_ITEMS.map((i) => {
    const a = availability(i.id, { run: S.run, G: S.G });
    return `<button class="shop-item${a.ok ? '' : ' off'}" data-id="${i.id}" aria-disabled="${!a.ok}">
      <span class="ico">${i.icon}</span><span><b>${i.name}</b><small>${a.ok || !a.reason ? `${SHORT[i.id]} · ${i.levels} niveles` : a.reason}</small></span>
      <span class="price">${fmt(priceOf(i.id, S.G.rate))}</span></button>`;
  }).join('');
}

/** Abre la tienda (botón 🛒). Bloquea el tablero mientras está abierta. */
export function openShop() {
  if (!S.G || S.G.done || S.busy || !S.run) return;
  const wasBusy = S.busy;
  S.busy = true;
  const modal = $('shop');
  const close = () => {
    modal.classList.remove('show');
    $('shopClose').onclick = null;
    S.busy = wasBusy;
  };
  render();
  modal.classList.add('show');
  say(pick(SAY.greet), 'happy');
  $('shopClose').onclick = close;
  const list = $('shopList');
  const lineFor = (b) => {
    if (b.classList.contains('off')) return b.dataset.id === 'redo' && S.G.moves === 0 ? pick(SAY.nothing) : pick(SAY.poor);
    return SAY[b.dataset.id];
  };
  list.onpointerover = (e) => { const b = e.target.closest('.shop-item'); if (b && e.pointerType === 'mouse') say(lineFor(b)); };
  list.onfocusin = (e) => { const b = e.target.closest('.shop-item'); if (b) say(lineFor(b)); };
  list.onclick = async (e) => {
    const b = e.target.closest('.shop-item');
    if (!b) return;
    if (b.classList.contains('off')) { say(lineFor(b), 'nope'); return; }
    const id = b.dataset.id;
    say(SAY[id]);
    if (!(await confirmBuy(id))) { say(pick(SAY.decline)); return; }
    say(pick(SAY.bought), 'happy');
    if (id === 'skip') {
      close();
      skipLevel();
      return;
    }
    render();
    if (id === 'redo' || id === 'moves') setTimeout(close, 650);   // un instante para ver a Don Dublón contento
  };
  $('shopClose').focus();
}
