import { Music, setTensionFx } from '../audio/music.js';
import { sfx } from '../audio/sound.js';
import { $, cssUrl } from '../dom.js';
import { saveRun } from '../game/session.js';
import { HEROES } from '../game/heroes.js';
import { S, undosLeft, heroOf, pathOf, persist, store } from '../state.js';
import { boardEl, layout, updateHud } from './board.js';
import { heroArt } from './story.js';
import { icon } from './icons.js';
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
 $('heroHudPower').textContent=prac?'Práctica · ayudas ilimitadas':h.id==='lia'?(S.run.lifeUsed?'Segunda oportunidad usada':'Segunda oportunidad disponible'):h.id==='jean'?`${undosLeft()} deshacer gratis`:`+2 pistas al completar nivel ${Math.min(100,(Math.floor((S.G.n-1)/10)+1)*10)}`;
 $('bUndo').querySelector('em').textContent=prac?'gratis':h.id==='jean'&&undosLeft()>0?undosLeft()+' gratis':'+1 mov';
}
export function showRescue(){
 S.G.done=true;S.busy=true;boardEl.classList.add('board-lock');setTensionFx(0,false);Music.duck(.3);
 $('rescueHero').src=heroArt('lia','defeat');$('rescue').classList.add('show');$('rescueContinue').focus();
 $('rescueContinue').onclick=()=>{
  if(!S.run?.rescue)return;S.G.pos=S.G.start.slice();S.G.moves=0;S.G.hist=[];S.G.done=false;delete S.run.rescue;saveRun();
  $('rescue').classList.remove('show');boardEl.classList.remove('board-lock');S.busy=false;$('bUndo').disabled=true;layout();updateHud();Music.duck(1);sfx.start();$('msg').textContent='Lía te dio otra oportunidad. ¡Este tablero empieza de nuevo!';
 };
}
