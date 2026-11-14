import { Music, setTensionFx } from '../audio/music.js';
import { sfx, tone } from '../audio/sound.js';
import { HERO_TALK } from '../data/story.js';
import { ZONES, zoneIdx, zoneOf, zoneStep } from '../data/zones.js';
import { $ } from '../dom.js';
import { MAX_LEVEL, moveLimit, rateAt, startHintsFor } from '../engine/difficulty.js';
import { hash32 } from '../engine/rng.js';
import { playReviveEffect, playSkipEffect } from '../ui/turns.js';
import { startCoach } from '../ui/coach.js';
import { buildLevel, pickBoard, varyBoard } from '../engine/levels.js';
import levelBank from '../data/levels.json';
import specialBank from '../data/special.json';
import { levelPlan, tutorialFor } from './mechanics.js';
import { decodeBoard } from '../engine/board.js';
import { minMoves } from '../engine/solver.js';
import { baseScore } from '../engine/scoring.js';
import { canRescue, clearRewards, useRescue } from './heroes.js';
import { canPaidRevive, hasRevive, payRevive, useRevive } from './shop.js';
import { S, gainNow, heroOf, persist, rkey, store, undosLeft } from '../state.js';
import { boardEl, buildPieces, cellPx, fitBoard, layout, recLine, syncRouteStyle, updateHud } from '../ui/board.js';
import { isBonusLevel, showBonus } from '../ui/bonus.js';
import { endRun } from '../ui/finale.js';
import { showResult } from '../ui/result.js';
import { chooseHero, showRescue, showReviveOffer, syncHero } from '../ui/heroes.js';
import { applyZone, renderStage, showMap } from '../ui/map.js';
import { openMenu } from '../ui/menu.js';
import { heroArt, storyFor } from '../ui/story.js';
export function saveRun(){
 if(S.run&&S.G&&!S.G.done&&S.G.n===S.run.level&&!S.run.pendingClear&&!S.run.rescue&&!S.run.pendingRevive){
  S.run.board={level:S.G.n,rate:S.G.rate,pieces:S.G.pieces.map(p=>({...p})),walls:(S.G.walls||[]).map(w=>w.slice()),pos:S.G.pos.slice(),start:S.G.start.slice(),opt:S.G.opt,limit:S.G.limit,bought:S.G.bought||0,tutorial:S.G.tutorial||null,moves:S.G.moves,hist:S.G.hist.map(p=>p.slice()),colors:S.G.colors?.slice()};
 }
 store.run=S.run&&{...S.run};persist();
}
export async function startRun(start,mode){
  mode='c';
  const chosen=await chooseHero(start,mode);if(!chosen){openMenu();return}
  if(S.run) recordBest(true);                         // si abandonas, lo logrado cuenta
  const seed=Math.floor(Math.random()*2**31);
  S.G=null;
  S.run={seed,level:1,start,mode,hero:chosen,lifeUsed:false,revive:0,revivesBought:0,undoUsedAt:0,undoUsedLevel:0,undoUsedCount:0,vanAwardedAt:0,score:0,hints:startHintsFor(start),adj:0,streak:0,recBroken:false};
  syncHero();syncRouteStyle();applyZone(0);saveRun();
  S.run.route='normal';S.run.routeZone=0;S.run.travelFrom=0;saveRun();await resumeAdventure();
}
export async function startLevel(){
  S.busy=true;
  const rate=rateAt(S.run.start,S.run.level);
  // Tablero precalculado para esta dificultad; el objetivo se desplaza según tu eficiencia (adaptativo)
  const plan=levelPlan(S.run.level);                               // ¿normal, con muros, candados o pesadas?
  const tut=S.run.mode==='p'?null:tutorialFor(S.run.level,store.tips);       // primera vez de una pieza: tablero de aprendizaje
  let base,lvl;
  if(tut){
   const b=decodeBoard(tut.board);base={...b,family:plan.family};
   lvl={pieces:b.pieces,pos:b.pos,walls:b.walls,opt:minMoves(b.pieces,b.pos,b.walls)};
  }else{
   base=pickBoard(levelBank.ratings,rate,S.run.seed,S.run.level,plan.family,specialBank);
   const board=varyBoard(base,rate,hash32(S.run.seed,S.run.level,7));   // variante propia de cada partida
   lvl=buildLevel(board,{rating:rate,adj:S.run.adj,brave:S.run.route==='brave'});
  }
  S.G={n:S.run.level,rate,pieces:lvl.pieces,pos:lvl.pos,walls:lvl.walls||[],start:lvl.pos.slice(),opt:lvl.opt,limit:moveLimit(lvl.opt,S.run.start),moves:0,hist:[],done:false,els:[],plan,family:base.family,tutorial:tut?tut.mech:null};
  if(S.run.rescue&&S.run.rescue.level===S.run.level){const r=S.run.rescue;S.G={...S.G,rate:r.rate,pieces:r.pieces,walls:(r.walls||[]).map(w=>w.slice()),pos:r.start.slice(),start:r.start.slice(),opt:r.opt,limit:moveLimit(r.opt,S.run.start)}}
  const saved=S.run.board;
  if(!S.run.rescue&&saved?.level===S.run.level&&saved.pieces?.length===saved.pos?.length&&saved.start?.length===saved.pos.length){
   S.G={...S.G,rate:saved.rate,pieces:saved.pieces.map(p=>({...p})),walls:(saved.walls||[]).map(w=>w.slice()),pos:saved.pos.slice(),start:saved.start.slice(),opt:saved.opt,limit:saved.limit,bought:saved.bought||0,tutorial:saved.tutorial||null,moves:saved.moves||0,hist:(saved.hist||[]).map(p=>p.slice())};
  }
  S.G.colors=saved?.level===S.run.level&&saved.colors?saved.colors.slice():[0,1,2,3,4,5,6,7].sort(()=>Math.random()-.5);
  $('lvl').textContent=S.G.n;$('mn').textContent=S.G.opt;$('base').textContent=S.run.mode==='p'?'—':baseScore(S.G.rate);
  applyZone(zoneIdx(S.G.n));renderStage();
  const prac=S.run.mode==='p';
  $('score').textContent=prac?'—':S.run.score.toLocaleString('de-DE');recLine();
  $('lim').textContent=prac?'∞':S.G.limit;
  $('bUndo').disabled=!S.G.hist.length;
  $('msg').textContent=S.G.n===1?'Desliza los bloques y saca la llave roja ➜ Cada movimiento cuenta.':tipFor(S.G);
  buildPieces();updateHud();sfx.start();S.busy=true;
  fitBoard();Music.setLevel(S.G.n,S.G.rate);setTensionFx(0,false);Music.duck(1);Music.muffle(false);Music.start();
  if(S.run.rescue){showRescue();return}
  if(S.run.pendingRevive&&canPaidRevive(S.run,S.run.mode)){offerPaidRevive(S.run.pendingRevive);return}
  delete S.run.pendingRevive;
  S.busy=false;boardEl.classList.remove('board-lock');saveRun();banner();
  startCoach();                                        // avisos y guía de los primeros niveles / mecánicas nuevas
}
function tipFor(g){
  if(heroOf().id==='jean'&&undosLeft()>0)return `Jean puede deshacer ${undosLeft()} veces gratis en este tablero.`;
  const t=['Piensa antes de mover: cada movimiento de más resta puntos.','Los bloques largos bloquean más: libéralos primero.','Un solo arrastre largo cuenta como 1 movimiento.','Deshacer cuesta 1 movimiento. Úsalo con cabeza.','La pista no cuesta movimientos, pero es limitada.'];
  return t[(g.n*7)%t.length];
}
function banner(){
  const b=$('banner'),z=zoneOf(S.G.n);b.querySelector('b').textContent='NIVEL '+S.G.n;
  b.querySelector('span').textContent=`${z.e} ${z.n} · ${zoneStep(S.G.n)}/10`;
  b.querySelector('.b2').textContent=`Mínimo ${S.G.opt} mov.`+(S.run.mode==='p'?'':` · Límite ${S.G.limit}`);
  b.classList.remove('go');void b.offsetWidth;b.classList.add('go');
}

function travelDialog(){
 if(!S.run?.pendingClear||S.run.pendingClear.level%10!==0||S.run.pendingClear.level>=100)return Promise.resolve();
 return new Promise(resolve=>{
  const session=S.run,modal=$('travel'),h=heroOf(),city=Math.min(9,Math.floor(S.run.pendingClear.level/10)),story=storyFor(h.id,city*10+1);
  $('travelScene').src=`backgrounds/zone-${city+1}.webp`;$('travelPortrait').src=heroArt(h.id,'story');$('travelPortrait').alt=h.name;
  $('travelTag').textContent=`CAPÍTULO ${city+1} DE 10 · NIVELES ${city*10+1}–${(city+1)*10}`;
  $('travelSeal').textContent=`Sello de ${story.seal}`;
  const citySpan=document.createElement('span');citySpan.className='travel-city';citySpan.textContent=ZONES[city].n;
  $('travelTitle').replaceChildren('Elige cómo llegar a ',citySpan);
  const lines=story.cityLines||[story.body];
  $('travelText').replaceChildren(...lines.map(txt=>{const li=document.createElement('li');li.textContent=txt;return li}));
  $('travelHeroLine').textContent=`${h.name}: «${story.action}»`;
  $('routeSummary').textContent=`Nivel ${S.run.pendingClear?.level||S.run.level} superado · +${S.run.pendingClear?.gain||0} pts`;
  let chosen=false;const buttons=[$('routeNormal'),$('routeBrave')];buttons.forEach(b=>b.disabled=false);
  const key=e=>{
   if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();(document.activeElement===buttons[0]?buttons[1]:buttons[0]).focus();return}
   if(e.key!=='Tab')return;
   if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons[1].focus()}else if(!e.shiftKey&&document.activeElement===buttons[1]){e.preventDefault();buttons[0].focus()}
  };
  const choose=choice=>{if(chosen||S.run!==session)return;chosen=true;buttons.forEach(b=>b.disabled=true);S.run.route=choice;S.run.routeZone=city;S.run.storyChapterSeen=city;S.run.storySeen=city*10+1;
   if(S.run.pendingClear)S.run.pendingClear.routeChosen=true;
   saveRun();modal.classList.remove('show');modal.removeEventListener('keydown',key);resolve();
  };
  buttons[0].onclick=()=>choose('normal');buttons[1].onclick=()=>choose('brave');modal.classList.add('show');modal.addEventListener('keydown',key);buttons[0].focus();
 });
}
let advancingClear=false;
export async function resumeAdventure(){
 if(!S.run)return;S.busy=true;
 if(S.run.enterPending){delete S.run.enterPending;S.run.route='normal';S.run.routeZone=0;S.run.travelFrom=0;saveRun()}
 if(S.run.level<=10&&!S.run.pendingClear?.routeChosen&&S.run.route!=='normal'){S.run.route='normal';S.run.routeZone=0;saveRun()}
 if(S.run.pendingClear){await advanceClear();return}
 if(S.run.bonus){const prize=await showBonus();S.run.hints+=prize;S.run.bonus=0;saveRun()}
 if(S.run.travelFrom!==undefined){const from=S.run.travelFrom,to=zoneIdx(S.run.level);await showMap(from,to,{travel:from!==to});delete S.run.travelFrom;saveRun()}
 await startLevel();
}
async function advanceClear(){
 if(advancingClear||!S.run?.pendingClear)return;advancingClear=true;S.busy=true;
 try{
  const done=S.run.pendingClear,n=done.level;
  if(n>=MAX_LEVEL){endRun(true);S.busy=false;return}
  const crossing=n%10===0;
  if(crossing&&!done.routeChosen)await travelDialog();
  S.run.level=n+1;if(crossing)S.run.travelFrom=zoneIdx(n);if(isBonusLevel(n))S.run.bonus=1;
  delete S.run.pendingClear;saveRun();await resumeAdventure();
 }finally{advancingClear=false}
}
export function win(){
 if(S.G.done)return;S.G.done=true;S.busy=true;boardEl.classList.add('board-lock');
 const gain=gainNow(),previous=S.run.score;
 S.run.score+=gain.total;S.run.cleared=(S.run.cleared||0)+1;S.run.streak=gain.eff>=.9?(S.run.streak||0)+1:0;
 S.run.adj=Math.max(-2,Math.min(S.run.level<10?1:2,S.run.adj+(gain.eff>=.9?1:gain.eff<.4?-1:0)));
 clearRewards(heroOf().id,S.run,S.G.n);
 S.run.pendingClear={level:S.G.n,gain:gain.total,moves:S.G.moves,opt:S.G.opt,routeChosen:false};recordBest();saveRun();
 setTensionFx(0,false);Music.duck(.55);tone(523,.13,'sine',.06);tone(784,.18,'sine',.045,.08);
 S.G.els[0].classList.add('exit');S.G.els[0].style.left=7*cellPx()+'px';
 $('msg').textContent=`${S.G.moves<=S.G.opt?'Perfecto · ':''}+${gain.total} puntos · ${HERO_TALK[heroOf().id].win[S.G.n%3]}`;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,done=S.G;
 setTimeout(async()=>{                                   // la llave sale → puntaje rápido → siguiente nivel
  try{await showResult({level:done.n,gain,moves:done.moves,opt:done.opt,previous,total:S.run.score,streakMult:gain.mult})}
  catch(err){console.error(err)}                         // si la animación falla, el juego sigue igual
  advanceClear();
 },reduce?100:450);
}
/* ---------- Derrota ---------- */
/** Al pasarte del límite la aventura termina (la tienda se usa antes, no al perder). */
export function fail(why){
  if(S.G.done)return;
  finalFail(why);
}
/** Saltar nivel (tienda): sin puntos, sin racha; avanza como si se hubiera superado. */
export function skipLevel(){
  if(!S.G||S.G.done)return;
  S.G.done=true;S.busy=true;boardEl.classList.add('board-lock');
  S.run.streak=0;S.run.pendingClear={level:S.G.n,gain:0,moves:S.G.moves,opt:S.G.opt,routeChosen:false,skipped:true};
  recordBest();saveRun();setTensionFx(0,false);
  $('msg').textContent='Nivel saltado. Sin puntos.';
  playSkipEffect().then(()=>advanceClear());
}
function triggerGameOver(why){
  S.G.done=true;S.busy=true;boardEl.classList.add('board-lock');Music.stop(.25);setTensionFx(0,false);tone(220,.25,'sine',.045);S.G.els.forEach(el=>el.style.opacity='.5');
  setTimeout(()=>{endRun(false,why);S.busy=false},400);
}
async function offerPaidRevive(why){
  const accepted=await showReviveOffer();
  if(!S.run||!S.G)return;
  delete S.run.pendingRevive;
  if(accepted){
    const r=payRevive(S.run);
    if(r.ok){
      S.G.pos=S.G.start.slice();S.G.moves=0;S.G.hist=[];S.G.done=false;S.G.bought=0;S.G.limit=moveLimit(S.G.opt);
      $('score').textContent=S.run.score.toLocaleString('de-DE');$('lim').textContent=S.G.limit;recLine();
      saveRun();boardEl.classList.remove('board-lock');S.busy=false;$('bUndo').disabled=true;layout();updateHud();
      Music.duck(1);playReviveEffect('¡RENACER!',false);$('msg').textContent=`Renaciste (−${r.cost.toLocaleString('de-DE')} pts). ¡Este tablero empieza de nuevo!`;
      return;
    }
  }
  triggerGameOver(why);
}
function finalFail(why){
  if(S.G.done)return;
  if(canRescue(heroOf().id,S.run,S.run.mode)){useRescue(S.run,S.G);saveRun();showRescue('lia');return}      // primero la vida gratis de Lía
  if(hasRevive(S.run)){useRevive(S.run,S.G);saveRun();showRescue('revive');return}                           // compatibilidad con cargas antiguas
  if(canPaidRevive(S.run,S.run.mode)){S.run.pendingRevive=why||'limit';saveRun();offerPaidRevive(why);return}
  triggerGameOver(why);
}

export function recordBest(final){
  const k=rkey(), r=store.paths[k]||(store.paths[k]={score:0,level:0,runs:0});
  if(S.run.mode==='c'&&S.run.score>r.score){r.score=S.run.score;S.run.recBroken=true}
  if(S.run.level>r.level) r.level=S.run.level;
  if(final) r.runs++;
  persist();
}
