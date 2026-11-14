import { Music, setTensionFx } from '../audio/music.js';
import { $, cssUrl } from '../dom.js';
import { saveRun } from '../game/session.js';
import { HEROES, canHint, freeHintsLeft, bonusTurns } from '../game/heroes.js';
import { moveLimit } from '../engine/difficulty.js';
import { reviveCost } from '../game/shop.js';
import { S, undosLeft, heroOf, pathOf, persist, store } from '../state.js';
import { boardEl, layout, updateHud } from './board.js';
import { heroArt } from './story.js';
import { icon } from './icons.js';
import { playReviveEffect } from './turns.js';
export function heroMarkup(h,pose='start'){return `<svg xmlns="http://www.w3.org/2000/svg" class="hero-art" viewBox="0 0 100 145" role="img" aria-label="${h.name}, ${h.role}"><defs><clipPath id="portrait-${h.id}-${pose}"><rect width="100" height="145" rx="16"/></clipPath></defs><image href="${heroArt(h.id,pose)}" width="100" height="145" preserveAspectRatio="xMidYMin slice" clip-path="url(#portrait-${h.id}-${pose})"/><rect x="1" y="1" width="98" height="143" rx="16" fill="none" stroke="${h.color}" stroke-opacity=".65" stroke-width="2"/></svg>`}
export function syncHero(id=S.run?.hero){const h=heroOf(id);const art=document.querySelector('#travel .traveler>.hero-art');if(art)art.outerHTML=heroMarkup(h,'map');document.documentElement.style.setProperty('--hero-color',h.color)}
export function chooseHero(start,mode){
 return new Promise(resolve=>{
  const modal=$('heroSelect'),cards=$('heroCards');let selected=heroOf(store.heroChoice||S.run?.hero).id;
  $('heroPath').textContent=`${pathOf(start).n.toUpperCase()} · AVENTURA`;
  const render=()=>{const h=heroOf(selected);modal.style.setProperty('--chosen',h.color);modal.style.setProperty('--hero-scene',cssUrl(`heroes/${h.id}.webp`));
   cards.innerHTML=HEROES.map(v=>`<button class="hero-choice ${v.id===selected?'selected':''}" role="radio" aria-checked="${v.id===selected}" tabindex="${v.id===selected?0:-1}" data-hero="${v.id}" style="--accent:${v.color}" aria-label="${v.name}: ${v.short}"><img src="${heroArt(v.id,v.id===selected?'ready':'start')}" alt="${v.name}, ${v.role}" width="360" height="720"><span class="hero-choice-name">${v.name}<small>${v.role}</small></span><span class="hero-check" aria-hidden="true">✓</span></button>`).join('');
   $('heroPowerIcon').innerHTML=icon(h.icon);$('heroPowerTitle').textContent=h.power;$('heroPowerShort').textContent=h.short;$('heroPowerDetail').textContent=h.detail;$('heroQuote').textContent=h.quote;
   $('heroConfirm').textContent=`Comenzar con ${h.name} ➜`;
   cards.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.hero;render();cards.querySelector(`[data-hero="${selected}"]`).focus()});
  };
  const close=value=>{modal.classList.remove('show');modal.removeEventListener('keydown',keyboard);resolve(value)};
  const keyboard=e=>{if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)&&cards.contains(document.activeElement)){e.preventDefault();const delta=e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1;selected=HEROES[(HEROES.findIndex(h=>h.id===selected)+delta+3)%3].id;render();cards.querySelector(`[data-hero="${selected}"]`).focus()}else if(e.key==='Escape')close(null);else if(e.key==='Tab'){const bs=[...modal.querySelectorAll('button')].filter(b=>b.tabIndex>=0);if(e.shiftKey&&document.activeElement===bs[0]){e.preventDefault();bs.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===bs.at(-1)){e.preventDefault();bs[0].focus()}}};
  $('heroCancel').onclick=()=>close(null);$('heroConfirm').onclick=()=>{store.heroChoice=selected;persist();close(selected)};render();modal.classList.add('show');Music.scene('heroes');modal.addEventListener('keydown',keyboard);cards.querySelector('[aria-checked=true]').focus();
 });
}
export function updateHeroHud(){
 if(!S.run||!S.G)return;const h=heroOf(),prac=S.run.mode==='p';
 $('heroHudImg').src=`heroes/${h.id}.webp`;$('heroHudImg').alt=h.name;$('heroHudName').textContent=h.name;
 $('heroHudPower').textContent=prac?'Práctica · ayudas ilimitadas':h.id==='lia'?`+${bonusTurns('lia',moveLimit(S.G.opt,S.run.start,S.run.level),S.run.start)} turnos de reserva`:h.id==='jean'?`${undosLeft()} deshacer gratis`:(freeHintsLeft(h.id,S.run,S.G.n,S.G.opt)>0?'Pista gratis disponible':'Pista gratis usada');
 $('hintN').textContent=prac?'∞':freeHintsLeft(h.id,S.run,S.G.n,S.G.opt)>0?'gratis':S.run.hints;$('bHint').disabled=!canHint(h.id,S.run,S.run.mode,S.G.n,S.G.opt);
 $('bUndo').querySelector('em').textContent=prac?'gratis':h.id==='jean'&&undosLeft()>0?undosLeft()+' gratis':'+1 mov';
}
/** Pantalla de «otra oportunidad»: la vida gratis de Lía o un revivir comprado (se repite el tablero con 0 movimientos). */
export function showRescue(kind=S.run?.rescue?.kind||'lia'){
 const revive=kind==='revive',h=heroOf();
 S.G.done=true;S.busy=true;boardEl.classList.add('board-lock');setTensionFx(0,false);Music.duck(.3);
 $('rescueHero').src=heroArt(revive?h.id:'lia','defeat');$('rescueHero').alt=revive?`${h.name} te da otra oportunidad`:'Lía protege la aventura';
 $('rescueIcon').innerHTML=icon(revive?'flame':'heart');
 $('rescueTag').textContent=revive?'REVIVIR · COMPRADO CON TUS PUNTOS':'PODER DE LÍA · UNA VEZ POR PARTIDA';
 $('rescueTitle').textContent=revive?'¡Otra oportunidad!':'La aventura sigue';
 $('rescueText').textContent=revive?`Pagaste por revivir. Repites este mismo tablero desde cero y conservas tus puntos y tus pistas.${S.run.revive>0?` Te queda ${S.run.revive} revivir guardado.`:''}`:'Lía te da una segunda oportunidad. Repites este mismo tablero desde cero y conservas tus puntos y tus pistas.';
 $('rescueContinue').textContent=revive?'Revivir':'Activar poder';
 $('rescue').classList.add('show');$('rescueContinue').focus();
 $('rescueContinue').onclick=()=>{
  if(!S.run?.rescue)return;S.G.pos=S.G.start.slice();S.G.moves=0;S.G.hist=[];S.G.done=false;S.G.limit-=(S.G.bought||0);S.G.bought=0;delete S.run.rescue;saveRun();
  $('rescue').classList.remove('show');boardEl.classList.remove('board-lock');S.busy=false;$('bUndo').disabled=true;layout();updateHud();Music.duck(1);
  playReviveEffect(revive?'¡RENACER!':'¡PODER DE LÍA!',!revive);
  $('msg').textContent=revive?'Revivir usado. ¡Este tablero empieza de nuevo!':'Poder de Lía activado. ¡Este tablero empieza de nuevo!';
 };
}

/** Pantalla completa del dios nórdico tras perder: elegir Revivir (−33 % pts, solo 1 vez) o Finalizar. */
export function showReviveOffer(){
 const modal=$('reviveOffer'),now=S.run?.score||0,cost=reviveCost(now),after=Math.max(0,now-cost),fmt=n=>n.toLocaleString('de-DE');
 S.G.done=true;S.busy=true;boardEl.classList.add('board-lock');setTensionFx(0,false);Music.duck(.3);
 $('reviveNow').textContent=fmt(now);
 $('reviveCost').textContent=`−${fmt(cost)}`;
 $('reviveAfter').textContent=fmt(after);
 $('reviveBtnNote').textContent=`Pierdes ${fmt(cost)} pts · Reinicia el tablero (solo 1 vez)`;
 return new Promise(resolve=>{
  let picked=false;
  const pick=yes=>{if(picked)return;picked=true;modal.classList.remove('show');modal.removeEventListener('keydown',onKey);resolve(yes)};
  const onKey=e=>{if(e.key==='Escape')pick(false)};
  $('reviveAccept').onclick=()=>pick(true);
  $('reviveEnd').onclick=()=>pick(false);
  modal.addEventListener('keydown',onKey);
  modal.classList.add('show');
  $('reviveAccept').focus();
 });
}
