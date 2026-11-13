import { setTensionFx } from '../audio/music.js';
import { sfx, tone, vib } from '../audio/sound.js';
import { isLocked, slideRange, snapDrag } from '../engine/board.js';
import { isLow, isWon, moveStatus, movesLeft } from '../engine/rules.js';
import { $ } from '../dom.js';
import { fail, saveRun, win } from '../game/session.js';
import { S, gainNow, pathOf, rkey, store } from '../state.js';
import { zoneIdx } from '../data/zones.js';
import { coachOnMove } from './coach.js';
import { updateHeroHud } from './heroes.js';
import { lowState, renderTurns } from './turns.js';
export const boardEl=$('board'), cellPx=()=>boardEl.clientWidth/6;
/* Mide el espacio libre real y da al tablero el mayor tamaño posible (sin scroll) */
export function fitBoard(){
  const root=document.documentElement,app=$('app'),fr=document.querySelector('.frame'),cs=getComputedStyle(app);
  const padV=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom),padH=parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight);
  const framePad=2*parseFloat(getComputedStyle(fr).paddingLeft)||28;
  const wide=matchMedia('(min-aspect-ratio: 13/10)').matches;
  for(let pass=0;pass<2;pass++){                       // 2 pasadas: la altura del HUD depende del ancho
    let cell;
    if(wide){
      const availH=innerHeight-padV-framePad-8, availW=innerWidth-padH-framePad-300-26;
      cell=Math.min(availH,availW)/6;
    }else{
      const kids=[...app.children].filter(e=>e!==fr&&getComputedStyle(e).display!=='none');
      const gap=parseFloat(cs.rowGap)||0, used=kids.reduce((s,e)=>s+e.offsetHeight,0)+gap*kids.length;
      const availH=innerHeight-padV-used-framePad-4;
      const availW=Math.min(innerWidth,innerWidth>=700?760:520)-padH-framePad-30;      // 30px: flecha de salida
      cell=Math.min(availH,availW)/6;
    }
    cell=Math.floor(Math.max(30,Math.min(cell,wide?150:120)));
    root.style.setProperty('--cell',cell+'px');
  }
  layout();if(S.G&&S.run)fitScores();
  app.style.overflowY=app.scrollHeight>app.clientHeight+2?'auto':'hidden';   // sin scroll accidental si todo cabe
}
addEventListener('resize',fitBoard);addEventListener('orientationchange',()=>setTimeout(fitBoard,200));
if(window.visualViewport)visualViewport.addEventListener('resize',fitBoard);
const LOCK_SVG='<svg class="lk shut" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1.6" class="hole"/></svg>'
  +'<svg class="lk free" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/><circle cx="12" cy="16" r="1.6" class="hole"/></svg>';
const HEAVY_MARK='<span class="mk heavy" title="Pesada: 1 casilla"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14.6" fill="#2b323a" stroke="#1c1208" stroke-width="1.4"/><circle cx="16" cy="16" r="12.6" fill="none" stroke="#f1e6c8" stroke-width="1.8"/><text x="16" y="19.6" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="17" fill="#fff3d0">1</text><path d="M8.2 25.4h5M10.6 23.6l-2.4 1.8 2.4 1.8M23.8 25.4h-5M21.4 23.6l2.4 1.8-2.4 1.8" fill="none" stroke="#ffd98a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
const STRAPS='<span class="strap h"></span><span class="strap v"></span>';
export function buildPieces(){
  boardEl.querySelectorAll('.piece,.wall,.plate,.links').forEach(e=>e.remove());
  boardEl.dataset.city=zoneIdx(S.G.n);
  S.G.gateLocked={};
  S.G.wallEls=(S.G.walls||[]).map(()=>{const el=document.createElement('div');el.className='wall';el.innerHTML='<i></i>';boardEl.appendChild(el);return el});
  S.G.plateEls=S.G.pieces.map(p=>{if(p.kind!=='gate')return null;const el=document.createElement('div');el.className='plate';el.innerHTML='<i></i>';boardEl.appendChild(el);return el});
  S.G.linkEls={};
  if(S.G.plateEls.some(Boolean)){                // un hilo punteado une cada candado con su placa: se ve qué abre qué
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','links');svg.setAttribute('aria-hidden','true');
    S.G.pieces.forEach((p,i)=>{if(p.kind!=='gate')return;const ln=document.createElementNS('http://www.w3.org/2000/svg','line');ln.setAttribute('class','link');svg.appendChild(ln);S.G.linkEls[i]=ln});
    boardEl.appendChild(svg);
  }
  S.G.els=S.G.pieces.map((p,i)=>{
    const el=document.createElement('div');
    el.className='piece enter '+p.o+' '+(i===0?'red':'c'+S.G.colors[i%8])+(p.kind?' '+p.kind:'');
    el.style.setProperty('--dl',(i*18)+'ms');
    el.innerHTML='<div class="face"></div>'+(p.kind==='gate'?STRAPS+'<span class="mk gate">'+LOCK_SVG+'</span>':p.kind==='heavy'?HEAVY_MARK:'');
    el.addEventListener('animationend',e=>{if(e.animationName==='enter')el.classList.remove('enter')});
    boardEl.appendChild(el);attach(el,i);return el;
  });
  boardEl.classList.remove('board-lock');layout();
}
export function place(i,x=S.G.pos[i]){
  const p=S.G.pieces[i],el=S.G.els[i],s=cellPx();
  el.style.width=(p.o==='h'?p.len:1)*s+'px';el.style.height=(p.o==='v'?p.len:1)*s+'px';
  el.style.left=(p.o==='h'?x:p.fix)*s+'px';el.style.top=(p.o==='v'?x:p.fix)*s+'px';
}
function placeStatic(){
  const s=cellPx();
  (S.G.walls||[]).forEach(([r,c],k)=>{const el=S.G.wallEls?.[k];if(!el)return;el.style.left=c*s+'px';el.style.top=r*s+'px';el.style.width=el.style.height=s+'px'});
  S.G.pieces.forEach((p,i)=>{const el=S.G.plateEls?.[i];if(!el)return;el.style.left=p.plate[1]*s+'px';el.style.top=p.plate[0]*s+'px';el.style.width=el.style.height=s+'px'});
}
const flashEl=(el,cls,ms)=>{el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),ms)};
/** Candados: se cierran o se abren según la placa; al abrirse suena y brilla. */
/** Redibuja el hilo que une cada candado con su placa (sigue al candado cuando se mueve). */
export function updateLinks(){
  const G=S.G;if(!G||!G.linkEls)return;const s=cellPx();
  for(const i in G.linkEls){
    const p=G.pieces[i],x=G.pos[i],ln=G.linkEls[i];
    const gx=(p.o==='h'?x+p.len/2:p.fix+.5)*s,gy=(p.o==='h'?p.fix+.5:x+p.len/2)*s;
    ln.setAttribute('x1',gx);ln.setAttribute('y1',gy);ln.setAttribute('x2',(p.plate[1]+.5)*s);ln.setAttribute('y2',(p.plate[0]+.5)*s);
    ln.classList.toggle('open',!G.gateLocked?.[i]);
  }
}
export function syncSpecials(animate=true){
  const G=S.G;if(!G||!G.plateEls)return;
  G.pieces.forEach((p,i)=>{
    if(p.kind!=='gate')return;
    const locked=isLocked(G.pieces,G.pos,i,G.walls),el=G.els[i],plate=G.plateEls[i],was=G.gateLocked[i];
    G.gateLocked[i]=locked;
    el.classList.toggle('locked',locked);el.classList.toggle('open',!locked);plate.classList.toggle('on',!locked);
    if(animate&&was!==undefined&&was!==locked){
      if(!locked){sfx.unlock();vib([15,20,15]);flashEl(el,'just-open',900);flashEl(plate,'pulse',900);$('msg').textContent='¡Candado abierto! Ya puedes moverla mientras la placa siga cubierta.'}
      else{sfx.plate();$('msg').textContent='Sin nadie sobre la placa, el candado se cierra otra vez.'}
    }
  });
}
export const layout=()=>{if(!S.G)return;S.G.els.forEach((_,i)=>place(i));placeStatic();syncSpecials(false);updateLinks()};


let activeDrag=null;                           // arrastre en curso: solo puede haber uno (evita dos dedos a la vez)
function attach(el,i){
  el.addEventListener('pointerdown',e=>{
    if(!S.G||S.G.done||S.busy) return;
    if(activeDrag) activeDrag.cancel();          // un arrastre anterior que no terminó nunca bloquea el tablero
    e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(_){}
    const p=S.G.pieces[i],s=cellPx(),[lo,hi]=slideRange(S.G.pieces,S.G.pos,i,S.G.walls),x0=S.G.pos[i],start=p.o==='h'?e.clientX:e.clientY;
    if(p.kind==='gate'&&isLocked(S.G.pieces,S.G.pos,i,S.G.walls)){      // candado cerrado: sacude, avisa y señala la placa
      flashEl(el,'deny',450);flashEl(S.G.plateEls[i],'hint',1500);sfx.locked();vib([30,30,30]);
      $('msg').textContent='Está atrapada. Cubre la placa ▣ con otra pieza para abrirla.';return;
    }
    el.classList.remove('hint');el.classList.add('drag');let cur=x0,lastCell=x0,delta=0;
    const move=ev=>{
      if(ev.pointerId!==e.pointerId) return;
      delta=((p.o==='h'?ev.clientX:ev.clientY)-start)/s;cur=Math.max(lo,Math.min(hi,x0+delta));
      el.style[p.o==='h'?'left':'top']=cur*s+'px';
      const c=Math.round(cur);if(c!==lastCell){lastCell=c;tone(300+c*25,.04,'triangle',.05);vib(4)}
    };
    let ended=false;
    const end=commit=>{
      if(ended) return;ended=true;activeDrag=null;
      for(const t of ['pointermove','pointerup','pointercancel','lostpointercapture']) el.removeEventListener(t,handlers[t]);
      try{el.releasePointerCapture(e.pointerId)}catch(_){}
      el.classList.remove('drag');
      const x=commit&&S.G&&!S.G.done?snapDrag(x0,lo,hi,delta):x0;
      if(x!==x0){S.G.hist.push(S.G.pos.slice());S.G.pos[i]=x;S.G.moves++;(p.kind==='heavy'?sfx.heavyMove:p.kind==='gate'?sfx.gateMove:sfx.move)();$('bUndo').disabled=false}
      if(S.G&&S.G.els[i]===el){place(i);syncSpecials();updateLinks()}
      if(x!==x0) afterMove();
    };
    const handlers={pointermove:move,pointerup:ev=>{if(ev.pointerId===e.pointerId)end(true)},pointercancel:()=>end(true),lostpointercapture:()=>end(true)};
    for(const t in handlers) el.addEventListener(t,handlers[t]);
    activeDrag={cancel:()=>end(false)};
  });
}
function afterMove(){
  if(!S.run||!S.G||S.G.done)return;
  updateHud();saveRun();coachOnMove();
  const prac=S.run.mode==='p';
  const status=prac?'ok':moveStatus(S.G.moves,S.G.limit);
  if(isWon(S.G.pos)){win();return}                         // ganar en el último turno vale
  if(status==='over'){fail('limit');return}                // sin turnos: ya no se puede mover
  if(prac){if(S.G.moves===S.G.opt+1)$('msg').textContent='Vas por encima del mínimo. En práctica no pasa nada: ¡sigue!';return}
  if(status==='last'){$('msg').textContent='ÚLTIMO TURNO: si no sacas la llave con este movimiento, la aventura termina.';sfx.warn();vib([30,40,30])}
  else if(status==='warn'){$('msg').textContent=`Te quedan ${movesLeft(S.G.moves,S.G.limit)} turnos.`;sfx.warn()}
}
function fitScores(){                 // reduce la cifra si no cabe en su cuadro (p. ej. 123.456 en móviles estrechos)
  ['score','scoreMax'].forEach(id=>{const el=$(id);el.style.fontSize='';let fs=parseFloat(getComputedStyle(el).fontSize);
    while(el.scrollWidth>el.clientWidth+0.5&&fs>11){fs-=1;el.style.fontSize=fs+'px'}});
}
export function recLine(){            // refresca camino, puntaje actual y máximo del camino en juego
  const prac=S.run.mode==='p',rec=store.paths[rkey()]||{score:0,level:0},p=pathOf(S.run.start);
  $('pchip').textContent=p.n.toUpperCase();$('pchip').style.color=p.c;
  if(prac){
    $('scoreLbl').textContent='MODO';$('score').textContent='Práctica';
    $('maxLbl').textContent='NIVEL MÁX.';$('scoreMax').textContent=Math.max(rec.level,S.run.level);
    $('scMax').classList.remove('broken');return;
  }
  $('scoreLbl').textContent='PUNTOS';
  $('maxLbl').textContent=S.run.recBroken?'NUEVO RÉCORD':'RÉCORD';
  $('scoreMax').textContent=Math.max(rec.score,S.run.score).toLocaleString('de-DE');
  $('scMax').classList.toggle('broken',!!S.run.recBroken);
  fitScores();
}
export function syncRouteStyle(){
 const brave=!!S.run&&S.run.route==='brave';document.body.classList.toggle('adventure-route',brave);
 const level=S.run?.level||1,first=Math.floor((level-1)/10)*10+1,last=Math.min(100,first+9),practice=S.run?.mode==='p';
 $('routeName').textContent=brave?'RUTA AVENTURERA':'RUTA TRANQUILA';$('routeIcon').textContent=brave?'△':'⌁';
 $('routeScope').textContent=`NIV. ${first}–${last}`;$('routeReward').textContent=brave?(practice?'Más reto':'+10 % puntos'):'Normal';
 $('routeStatus').setAttribute('aria-label',brave?`Ruta aventurera, niveles ${first} a ${last}. Puzles algo más difíciles${practice?', sin puntos en Práctica.':' y diez por ciento más de puntos.'}`:`Ruta tranquila, niveles ${first} a ${last}. Dificultad habitual.`);
}

export function updateHud(){
  syncRouteStyle();
  updateHeroHud();
  $('mv').textContent=S.G.moves;
  const f=$('fill'),pct=Math.min(100,S.G.moves/S.G.limit*100);
  f.style.width=pct+'%';
  const over=Math.max(0,S.G.moves-S.G.opt)/S.G.opt,hue=140*(1-Math.min(1,over));
  f.style.background=`hsl(${hue} 85% 52%)`;f.style.color=`hsl(${hue} 85% 52%)`;
  const prac=S.run.mode==='p',cg=gainNow();
  $('pot').textContent=prac?'sin puntaje':'+'+cg.total.toLocaleString('de-DE');
  $('meter').classList.toggle('danger',!prac&&isLow(S.G.moves,S.G.limit));
  const {low,last}=lowState();                          // pocos turnos: solo aviso visual, la música no cambia
  setTensionFx(low,last);
  renderTurns();
}

/* ---------- Victoria de nivel ---------- */
