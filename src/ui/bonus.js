import { sfx, tone, vib } from '../audio/sound.js';
import { HERO_TALK } from '../data/story.js';
import { ZONES, zoneIdx } from '../data/zones.js';
import { $ } from '../dom.js';
import { saveRun } from '../game/session.js';
import { S, heroOf } from '../state.js';
import { catchPrize, pickBonusKind } from '../game/minigames.js';
import { heroMarkup } from './heroes.js';

function runeIcon(index){
 const paths=[
  '<circle cx="13" cy="12" r="5"/><path d="M17 16l13 13m-4-4 4-4m-9 0 4-4"/>',
  '<path d="M21 5c2 8-7 9-7 17a7 7 0 0 0 14 0c0-5-2-9-4-11 1 7-3 7-3 7"/>',
  '<path d="M27 6A15 15 0 1 0 34 28 15 15 0 0 1 27 6Z"/>'
 ];
 return `<svg class="rune-icon" viewBox="0 0 42 42" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths[index%3]}</svg>`;
}


/* ============================ Fase bonus: 9 cartas, 3 premios x 3 copias ============================
   Gana el primer premio que consigas completar con 3 cartas iguales: +1 pista, +3 pistas o enemigo (0). */
export const isBonusLevel=level=>level>=15&&level<100&&level%10===5;
const BONUS_CARDS=[{e:'💡',n:'+1 pista',v:1,c:'#43e0c1'},{e:'🌟',n:'+3 pistas',v:3,c:'#ffd24a'},{e:'👾',n:'Sin premio',v:0,c:'#ff4a6a'}];
const WHEEL_PRIZES=[1,0,2,1,3,1,2,1];
const REEL_SYMBOLS=['Llave','Llama','Luna'];
const bonusDelay=ms=>new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion: reduce)').matches?Math.min(ms,100):ms));
function slotPrize(symbols){const n=Math.max(...REEL_SYMBOLS.map((_,i)=>symbols.filter(v=>v===i).length));return n===3?3:n===2?1:0}
function createBonusPlan(){
 const kind=pickBonusKind();
 const deck=[0,0,0,1,1,1,2,2,2];for(let i=8;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
 return {kind,deck,opened:[],wheel:Math.floor(Math.random()*8),reels:Array.from({length:3},()=>Math.floor(Math.random()*3))};
}
export async function showBonus(){
 const pending=S.run.bonusPlan||(S.run.bonusPlan=createBonusPlan());saveRun();
  pending.introSeen=true;saveRun();
 return new Promise(resolve=>{
  const plan=S.run.bonusPlan||(S.run.bonusPlan=createBonusPlan());saveRun();
  const m=$('bonus'),stage=$('bStage'),go=$('bGo'),action=$('bAction'),result=$('bRes');
  const titles={cards:'Las cartas del umbral',wheel:'La rueda de los sellos',slots:'El altar de los ecos',catch:'Las luciérnagas del camino'};
  const lines={cards:'Busca tres símbolos iguales. El primer trío decide tu premio.',wheel:'Gira una vez. La marca roja señala tu premio en pistas.',slots:'Tres amuletos iguales: +3 pistas. Dos iguales: +1. Todos distintos: 0.',catch:'Toca las luciérnagas antes de que se escapen. ¡Las doradas valen 3!'};
  const zone=zoneIdx(Math.max(1,S.run.level-1));m.style.setProperty('--bonus-scene',`url("backgrounds/zone-${zone+1}.webp")`);m.dataset.game=plan.kind;
  $('bTag').textContent=`UN DESCANSO · ${ZONES[zone].n.toUpperCase()}`;
  $('bTitle').textContent=titles[plan.kind];$('bSub').textContent=lines[plan.kind];
  $('bHero').innerHTML=heroMarkup(heroOf(),'story');$('bSpeech').textContent=HERO_TALK[heroOf().id].bonus[plan.kind];
  $('bHints').textContent=S.run.hints;result.innerHTML='';result.className='bres';stage.innerHTML='';stage.className='bonus-stage '+plan.kind;
  go.hidden=true;go.style.display='none';go.disabled=false;action.hidden=plan.kind==='cards';action.disabled=false;
  action.textContent=plan.kind==='wheel'?'Girar la rueda':plan.kind==='catch'?'¡Empezar a cazar!':'Escuchar los ecos';
  $('bLegend').innerHTML=plan.kind==='cards'?'<span>Llaves: +1</span><span>Llamas: +3</span><span>Lunas: 0</span>':plan.kind==='wheel'?'<span>Premios: 0, 1, 2 o 3 pistas</span>':plan.kind==='catch'?'<span>6 luces: +1</span><span>12: +2</span><span>18: +3</span>':'<span>Tres iguales: +3</span><span>Dos iguales: +1</span>';
  let locked=plan.prize!==undefined;
  async function finish(prize,restore=false){
   locked=true;plan.prize=prize;saveRun();action.disabled=true;action.hidden=true;
   $('bSpeech').textContent=HERO_TALK[heroOf().id][prize?'prize':'empty'];
   result.className='bres '+(prize?'good':'neutral');result.innerHTML=`<b>${prize?'+'+prize+' pista'+(prize===1?'':'s'):'Sin premio'}</b><span>${prize?'Para las puertas que faltan.':'Tu reserva de pistas se conserva.'}</span>`;
   $('bHints').textContent=S.run.hints+prize;
   if(!restore){if(prize){tone(660,.15,'sine',.045);tone(880,.2,'sine',.035,.1)}else tone(280,.16,'sine',.025);await bonusDelay(250)}
   go.hidden=false;go.style.display='';go.textContent='Seguir el camino →';go.focus();
  }
  go.onclick=()=>{if(go.disabled||plan.prize===undefined)return;go.disabled=true;m.classList.remove('show');delete S.run.bonusPlan;resolve(plan.prize)};
  if(plan.kind==='cards'){
   stage.innerHTML='<div class="bgrid" id="bGrid"></div>';const grid=$('bGrid');
   const cards=plan.deck.map((ty,i)=>{const P=BONUS_CARDS[ty],b=document.createElement('button');b.className='bcard';b.style.setProperty('--i',i);b.style.setProperty('--pc',P.c);b.setAttribute('aria-label',`Carta ${i+1}, oculta`);b.innerHTML=`<span class="bin"><span class="bb"><i>△</i></span><span class="bf"><b>${runeIcon(ty)}</b><small>${P.n}</small></span></span>`;grid.appendChild(b);
    if(plan.opened.includes(i)){b.classList.add('on');b.setAttribute('aria-label',P.n)}
    b.onclick=()=>{if(locked||plan.opened.includes(i))return;plan.opened.push(i);b.classList.add('on');b.setAttribute('aria-label',P.n);tone(500+plan.opened.length*55,.1,'triangle',.07);saveRun();
     const count=plan.opened.filter(k=>plan.deck[k]===ty).length;
     if(count===2){$('bSpeech').textContent='«¡Ya hay dos iguales! Falta una…»';cards.forEach((c,k)=>{if(plan.opened.includes(k)&&plan.deck[k]===ty)c.classList.add('pair')})}
     if(count===3){locked=true;cards.forEach((c,k)=>c.classList.add(plan.deck[k]===ty?'winc':'dim'));finish(P.v)}
    };return b});
  }else if(plan.kind==='catch'){
   stage.innerHTML='<div class="catch-field" id="cField"><div class="catch-hud"><span>⏱ <b id="cTime">10</b> s</span><span>✦ <b id="cScore">0</b></span></div><div class="catch-bar"><i id="cBar"></i></div></div>';
   const field=$('cField');
   if(locked){field.insertAdjacentHTML('beforeend',`<div class="catch-end">Cazaste ${plan.score||0} ✦</div>`);$('cScore').textContent=plan.score||0}
   action.onclick=()=>{
    if(locked)return;locked=true;action.hidden=true;let score=0,left=10;$('bSpeech').textContent=HERO_TALK[heroOf().id].bonus.catch;sfx.start();
    const DURATION=10000,t0=performance.now();field.classList.add('playing');
    const spawn=()=>{
     const f=document.createElement('button'),gold=Math.random()<.14;f.type='button';f.className='ff'+(gold?' gold':'');f.setAttribute('aria-label',gold?'Luciérnaga dorada: 3 puntos':'Luciérnaga');
     f.style.left=(8+Math.random()*78)+'%';f.style.setProperty('--t',(2.1+Math.random()*1.3)+'s');f.style.setProperty('--dx',(Math.random()*60-30)+'px');f.innerHTML=gold?'★':'✦';
     f.onpointerdown=e=>{e.preventDefault();if(f.classList.contains('caught'))return;f.classList.add('caught');score+=gold?3:1;$('cScore').textContent=score;
      tone(gold?1175:700+Math.min(score,20)*28,gold?.22:.09,gold?'triangle':'sine',gold?.09:.06);if(gold){tone(1568,.25,'sine',.06,.08);vib(15)}setTimeout(()=>f.remove(),320)};
     f.addEventListener('animationend',e=>{if(e.animationName==='ff-rise')f.remove()});field.appendChild(f);
    };
    spawn();const spawner=setInterval(spawn,320+Math.random()*60);
    const clock=setInterval(()=>{const used=performance.now()-t0;left=Math.max(0,Math.ceil((DURATION-used)/1000));$('cTime').textContent=left;$('cBar').style.width=Math.min(100,used/DURATION*100)+'%';
     if(used>=DURATION){clearInterval(clock);clearInterval(spawner);field.classList.remove('playing');field.querySelectorAll('.ff').forEach(e=>e.remove());plan.score=score;
      field.insertAdjacentHTML('beforeend',`<div class="catch-end">¡Cazaste ${score} ✦!</div>`);finish(catchPrize(score))}},100);
   };
  }else if(plan.kind==='wheel'){
   const colors=['#314b4e','#283f49','#474b50','#29464a','#765545','#33444a','#46544e','#2c424b'];let sectors='';
   const point=(r,a)=>[160+r*Math.cos(a*Math.PI/180),160+r*Math.sin(a*Math.PI/180)];
   WHEEL_PRIZES.forEach((v,i)=>{const a=-90+i*45,p=point(140,a),q=point(140,a+45),t=point(99,a+22.5),mark=point(126,a+22.5);sectors+=`<path data-sector="${i}" d="M160 160L${p}A140 140 0 0 1 ${q}Z" fill="${colors[i]}" stroke="#a6966e77" stroke-width="1"/><circle cx="${mark[0]}" cy="${mark[1]}" r="2" fill="#bdac7c"/><text x="${t[0]}" y="${t[1]+7}" data-label="${i}" style="transform-box:view-box;transform-origin:${t[0]}px ${t[1]}px" text-anchor="middle" fill="#e7d8b5" font-size="25" font-family="Georgia,serif">${v?'+'+v:'0'}</text>`});
   stage.innerHTML=`<div class="wheel-shell"><span class="wheel-pointer" aria-hidden="true">▼</span><svg class="prize-wheel" viewBox="0 0 320 320" role="img" aria-label="Rueda de ocho sellos. La marca roja indica el premio en pistas.">${sectors}<circle cx="160" cy="160" r="140" fill="none" stroke="#b8a16d" stroke-width="2"/></svg><div class="wheel-hub">${runeIcon(0)}</div></div>`;
   const wheel=stage.querySelector('.prize-wheel'),angle=1440-22.5-plan.wheel*45;
   if(locked){wheel.style.transform=`rotate(${angle}deg)`;wheel.querySelectorAll('text').forEach(label=>label.style.transform=`rotate(${-angle}deg)`)}
   action.onclick=async()=>{if(locked)return;locked=true;action.disabled=true;action.textContent='La rueda está girando…';$('bSpeech').textContent='La marca roja decide.';sfx.start();
    const dur=matchMedia('(prefers-reduced-motion: reduce)').matches?150:2600;wheel.querySelectorAll('text').forEach(label=>label.animate([{transform:'rotate(0deg)'},{transform:`rotate(${-angle}deg)`}],{duration:dur,easing:'cubic-bezier(.12,.74,.12,1)',fill:'forwards'}));const anim=wheel.animate([{transform:'rotate(0deg)'},{transform:`rotate(${angle}deg)`}],{duration:dur,easing:'cubic-bezier(.12,.74,.12,1)',fill:'forwards'});
    let tick=0;const timer=setInterval(()=>{tone(320+(tick++%8)*30,.035,'sine',.014)},250);
    try{await anim.finished}finally{clearInterval(timer)}wheel.querySelector(`[data-sector="${plan.wheel}"]`).setAttribute('stroke','#f0d69e');await finish(WHEEL_PRIZES[plan.wheel]);
   };
  }else{
   stage.innerHTML='<div class="amulet-machine"><div class="machine-crown">✦ LÍA EXPRESS ✦</div><div class="reels"></div><div class="machine-plaque">TRES MARCAS · UNA RESPUESTA</div><div class="machine-lights" aria-hidden="true">✧ · ✧ · ✧ · ✧ · ✧ · ✧ · ✧</div></div>';
   stage.querySelector('.machine-crown').textContent='EL ALTAR DE LOS ECOS';
   const reels=stage.querySelector('.reels');
   for(let i=0;i<3;i++){const reel=document.createElement('div');reel.className='reel';reel.setAttribute('aria-label',`Amuleto ${i+1}`);reel.innerHTML=`<div class="reel-strip">${Array.from({length:22},(_,k)=>`<span>${runeIcon(k===21?plan.reels[i]:k%3)}</span>`).join('')}</div>`;reels.appendChild(reel)}
   const strips=[...reels.querySelectorAll('.reel-strip')];if(locked)strips.forEach(s=>s.style.transform='translateY(-1848px)');
   action.onclick=async()=>{if(locked)return;locked=true;action.disabled=true;action.textContent='Los amuletos están girando…';stage.classList.add('spinning');$('bSpeech').textContent='«Uno… dos… ¡y el último!»';sfx.start();
    await Promise.all(strips.map(async(strip,i)=>{const dur=matchMedia('(prefers-reduced-motion: reduce)').matches?150:1300+i*350;
     const anim=strip.animate([{transform:'translateY(0)'},{transform:'translateY(-1848px)'}],{duration:dur,easing:'cubic-bezier(.12,.7,.16,1)',fill:'forwards'});await anim.finished;tone(650+i*150,.15,'triangle',.07);strip.parentElement.classList.add('stopped');strip.parentElement.setAttribute('aria-label',`Amuleto ${i+1}: ${REEL_SYMBOLS[plan.reels[i]]}`);
    }));stage.classList.remove('spinning');const prize=slotPrize(plan.reels);const counts=plan.reels.map(v=>plan.reels.filter(n=>n===v).length);strips.forEach((strip,i)=>{if(counts[i]>=2)strip.parentElement.classList.add('match')});await finish(prize);
   };
  }
  m.classList.add('show');if(plan.prize!==undefined)finish(plan.prize,true);else if(plan.kind!=='cards')action.focus();else stage.querySelector('button').focus();
 });
}

