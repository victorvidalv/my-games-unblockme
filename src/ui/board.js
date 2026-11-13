import { setTensionFx } from '../audio/music.js';
import { sfx, tone, vib } from '../audio/sound.js';
import { slideRange, snapDrag } from '../engine/board.js';
import { isWon, moveStatus, movesLeft } from '../engine/rules.js';
import { $ } from '../dom.js';
import { fail, saveRun, win } from '../game/session.js';
import { S, gainNow, pathOf, rkey, store } from '../state.js';
import { updateHeroHud } from './heroes.js';
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
export function buildPieces(){
  boardEl.querySelectorAll('.piece').forEach(e=>e.remove());
  S.G.els=S.G.pieces.map((p,i)=>{
    const el=document.createElement('div');
    el.className='piece enter '+p.o+' '+(i===0?'red':'c'+S.G.colors[i%8]);
    el.style.setProperty('--dl',(i*18)+'ms');
    el.innerHTML='<div class="face"></div>';
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
export const layout=()=>S.G&&S.G.els.forEach((_,i)=>place(i));


let activeDrag=null;                           // arrastre en curso: solo puede haber uno (evita dos dedos a la vez)
function attach(el,i){
  el.addEventListener('pointerdown',e=>{
    if(!S.G||S.G.done||S.busy) return;
    if(activeDrag) activeDrag.cancel();          // un arrastre anterior que no terminó nunca bloquea el tablero
    e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(_){}
    const p=S.G.pieces[i],s=cellPx(),[lo,hi]=slideRange(S.G.pieces,S.G.pos,i),x0=S.G.pos[i],start=p.o==='h'?e.clientX:e.clientY;
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
      if(x!==x0){S.G.hist.push(S.G.pos.slice());S.G.pos[i]=x;S.G.moves++;sfx.move();$('bUndo').disabled=false}
      if(S.G&&S.G.els[i]===el) place(i);
      if(x!==x0) afterMove();
    };
    const handlers={pointermove:move,pointerup:ev=>{if(ev.pointerId===e.pointerId)end(true)},pointercancel:()=>end(true),lostpointercapture:()=>end(true)};
    for(const t in handlers) el.addEventListener(t,handlers[t]);
    activeDrag={cancel:()=>end(false)};
  });
}
function afterMove(){
  if(!S.run||!S.G||S.G.done)return;
  updateHud();saveRun();
  const prac=S.run.mode==='p';
  const status=prac?'ok':moveStatus(S.G.moves,S.G.limit);
  if(status==='over'){fail('limit');return}
  if(isWon(S.G.pos)){win();return}
  if(prac){if(S.G.moves===S.G.opt+1)$('msg').textContent='Vas por encima del mínimo. En práctica no pasa nada: ¡sigue!';return}
  if(status==='last'){$('msg').textContent='⚠️ ÚLTIMO MOVIMIENTO: el siguiente te elimina.';sfx.warn();vib([30,40,30])}
  else if(status==='warn'){$('msg').textContent=`⚠️ Te quedan ${movesLeft(S.G.moves,S.G.limit)} movimientos antes del límite.`;sfx.warn()}
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
  $('meter').classList.toggle('danger',!prac&&S.G.moves>=S.G.limit*.8);
  const panic=!prac&&!S.G.done&&S.G.moves>=S.G.limit&&S.G.pos[0]!==4, tn=(prac||S.G.done)?0:Math.max(0,Math.min(1,(S.G.moves/S.G.limit-.5)/.5));
  setTensionFx(tn,panic);
}

/* ---------- Victoria de nivel ---------- */
