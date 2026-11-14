import { sfx } from '../audio/sound.js';
import { $ } from '../dom.js';
import { SHOP_ITEMS, availability, buy, extraTurns, itemById, priceOf } from '../game/shop.js';
import { saveRun, skipLevel } from '../game/session.js';
import { S } from '../state.js';
import { layout, recLine, updateHud } from './board.js';
import { updateHeroHud } from './heroes.js';
import { ask } from './menu.js';
import { icon } from './icons.js';
import { playBuyEffect, playRewindEffect } from './turns.js';

const fmt = (n) => n.toLocaleString('de-DE');
/** Nombre con los turnos reales que da en este tablero (son un % del límite). */
const nameOf = (item) => (item.share ? `+${extraTurns(item.id, S.G.limit)} turnos` : item.name);   // la cifra real, nunca un porcentaje
const priceNow = (id) => priceOf(id, S.G.rate, S.run.start);

/** Refleja en pantalla la compra ya cobrada. */
function applyEffects(id) {
  $('score').textContent = fmt(S.run.score);
  recLine();
  if (id === 'hint') {
    updateHeroHud();
  } else if (itemById(id)?.share) {
    $('lim').textContent = S.G.limit;
    updateHud();
    playBuyEffect();
    $('msg').textContent = `${nameOf(itemById(id))}: ahora el límite es ${S.G.limit}.`;
  } else if (id === 'redo') {
    playRewindEffect();
    layout();
    $('bUndo').disabled = true;
    updateHud();
    $('msg').textContent = 'Tablero reiniciado desde cero.';
  }
  saveRun();
}

/** Compra con confirmación (los precios son altos). Devuelve true si se compró. */
export async function confirmBuy(id) {
  const item = itemById(id);
  const price = priceNow(id);
  const ok = await ask({
    ico: item.icon, title: `${nameOf(item)} · ${fmt(price)} pts`,
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
/* Don Dublón, vendedor sarcástico: varias frases por situación, elegidas al azar sin repetir la anterior. */
const SAY = {
  greet: [
    'Ah, un cliente. Qué sorpresa… y qué poco he dormido.',
    'Pasa, pasa. El que no compra, al menos admira mi mercancía… cara.',
    'Bienvenido a la única tienda de Thyes abierta en plena Noche Larga. Sí, tengo monopolio.',
    '¿Perdiendo otra vez? Tranquilo, tengo remedio para eso. Con recargo.',
    'Mi oro es anterior a Tri. Mis precios, también. Y no han bajado.',
    '¿Solo mirando? Mirar es gratis. Lo demás… no tanto.',
    'Vhorn apagó el Faro, pero mi caja sigue brillando.',
    'Huelo ecos en tu bolsillo. Ven, que no muerdo. Cobro.',
    '¿Un milagro? Estás en la tienda correcta. ¿Descuentos? En la de enfrente. No hay de enfrente.',
    'Ayudas, atajos y milagros. Todos garantizados por mí mismo. Es decir, por nadie.',
    'Los Kogn me pagan en perlas, los Sahrim en agua… tú me pagarás en puntos.',
    'Un consejo gratis: no te metas en deudas. Salvo conmigo, claro.',
  ],
  hint: ['Una pista: susurro lo obvio, pero a precio de oro.', 'Un empujoncito. Los empujones baratos no existen.', 'Pista en camino. Qué pena que el tablero no traiga instrucciones; para eso estoy yo.'],
  moves3: ['Unos turnos más para quien planifica con optimismo.', 'Más turnos, mismos errores, pero con más margen para repetirlos.', 'El futuro es caro. Este trocito, algo menos.'],
  moves: ['¿Muchos turnos? Alguien juega con confianza. Excesiva.', 'Un colchón de turnos. Cómodo, como mi margen de beneficio.', 'Paciencia comprada: la mejor, porque no se agota. El dinero sí.'],
  redo: ['Rebobino el tablero. Borrón y cuenta nueva… la cuenta, tuya.', '¿Empezar de cero? Qué humildad tan rentable.', 'El tiempo no vuelve atrás, pero el tablero sí. A cambio de oro.'],
  skip: ['¿Saltarte un nivel? Los atajos son para quien puede pagarlos. Qué casualidad.', 'Un lujo, amigo. Y los lujos se pagan, hasta en el año 4133.', 'Saltar un nivel: porque sufrir gratis ya no está de moda.'],
  poor: ['¿Eso es todo? Vuelve cuando tu bolsillo haga ruido.', 'Sin ecos no hay milagros. Esto no es una obra de caridad.', 'Mi bolsa está llena; la tuya… resuena a hueco.', 'Fiado no. Tri me lo prohibió. Seguro que fue por mi culpa.'],
  bought: ['¡Cling, cling! Eso suena a Faro encendido.', 'Un placer. No hay devoluciones, ni para Vhorn.', 'Excelente compra. Diría que inteligente, pero no quiero adular.', 'Gracias por tu generosidad involuntaria.', 'Negocio cerrado. Como los diez reinos, pero de mejor humor.'],
  decline: ['Piénsalo, los precios no bajan. Spoiler.', 'Tú decides. El oro no huye de Thyes… ni yo de mi caja.', 'Vuelve cuando la tentación pese más que el bolsillo.'],
  nothing: ['Aún no has movido nada. ¿Qué voy a rebobinar? ¿Tu optimismo?'],
};
const SHORT = { hint: 'Te enseña el mejor movimiento', moves3: 'Más turnos en este tablero', moves: 'Muchos más turnos en este tablero', redo: 'Empieza de cero con 0 movimientos', skip: 'Pasa de nivel sin puntos ni racha' };
const shortOf = (id) => SHORT[id];
const lastIdx = new Map();
/** Elige una frase al azar sin repetir la anterior de la misma lista. */
const pick = (arr) => {
  if (typeof arr === 'string') return arr;
  let i = Math.floor(Math.random() * arr.length);
  if (arr.length > 1 && i === lastIdx.get(arr)) i = (i + 1 + Math.floor(Math.random() * (arr.length - 1))) % arr.length;
  lastIdx.set(arr, i);
  return arr[i];
};

function say(text, mood, talk = true) {
  if (talk) sfx.merchantTalk(text);
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
      <span class="ico">${icon(i.icon)}</span><span><b>${nameOf(i)}</b><small>${a.ok || !a.reason ? shortOf(i.id) : a.reason}</small></span>
      <span class="price">${fmt(priceNow(i.id))}</span></button>`;
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
  sfx.merchantBell(); say(pick(SAY.greet), 'happy');
  $('shopClose').onclick = close;
  const list = $('shopList');
  const lineFor = (b) => {
    if (b.classList.contains('off')) return b.dataset.id === 'redo' && S.G.moves === 0 ? pick(SAY.nothing) : pick(SAY.poor);
    return pick(SAY[b.dataset.id]);
  };
  list.onpointerover = (e) => { const b = e.target.closest('.shop-item'); if (b && e.pointerType === 'mouse') say(lineFor(b), undefined, false); };
  list.onfocusin = (e) => { const b = e.target.closest('.shop-item'); if (b) say(lineFor(b), undefined, false); };
  list.onclick = async (e) => {
    const b = e.target.closest('.shop-item');
    if (!b) return;
    if (b.classList.contains('off')) { sfx.merchantNope(); say(lineFor(b), 'nope'); return; }
    const id = b.dataset.id;
    say(pick(SAY[id]));
    if (!(await confirmBuy(id))) { sfx.merchantNope(); say(pick(SAY.decline)); return; }
    sfx.merchantCoin(); say(pick(SAY.bought), 'happy');
    if (id === 'skip') {
      close();
      skipLevel();
      return;
    }
    render();
    if (id === 'redo' || itemById(id)?.share) setTimeout(close, 650);   // un instante para ver a Don Dublón contento
  };
  $('shopClose').focus();
}
