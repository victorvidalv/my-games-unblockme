import { Music, setTensionFx } from '../audio/music.js';
import { soundLabel, toggleSound } from '../audio/sound.js';
import { zoneIdx, zoneOf } from '../data/zones.js';
import { $ } from '../dom.js';
import { recordBest, resumeAdventure, saveRun, startRun } from '../game/session.js';
import { PATHS, S, heroOf, pathOf, persist, store } from '../state.js';
import { syncRouteStyle } from './board.js';
import { syncHero } from './heroes.js';
import { showMap } from './map.js';
/* ---------- Menú: elegir camino ---------- */
const MODE_INFO={
  c:'Sube puntos nivel a nivel. Si agotas los turnos (el doble del mínimo) sin sacar la llave, la partida termina.',
  p:'Sin puntos ni eliminación. Pistas ilimitadas y deshacer gratis. Ideal para aprender y relajarte.'
};
function renderPaths(){
  const mode='c',box=$('paths');box.innerHTML='';

  $('modeInfo').textContent=MODE_INFO[mode];
  PATHS.forEach(p=>{
    const rec=store.paths[mode+p.s],lvl=rec?rec.level:0,prog=lvl?Math.max(4,lvl):0;
    const big=mode==='c'?(rec&&rec.score?rec.score.toLocaleString('de-DE'):'—'):(lvl?lvl:'—');
    const lbl=mode==='c'?'RÉCORD':'NIVEL MÁX.';
    let txt='Aún sin jugar';
    if(rec&&lvl) txt=(lvl>=100?'👑 Completado · ':'')+`Nivel máx. ${lvl}/100 · ${zoneOf(lvl).e} ${zoneOf(lvl).n}`+(rec.runs?` · ${rec.runs} partida${rec.runs>1?'s':''}`:'');
    const d=document.createElement('div');d.className='path';d.style.setProperty('--pc',p.c);
    d.innerHTML=`<div class="ptop"><div class="pemo">${p.e}</div>
      <div class="pinfo"><b>${p.n}</b><span>${p.d}</span></div>
      <div class="pscore"><small>${lbl}</small><b>${big}</b></div></div>
      <div class="pach"><div class="pbar"><i style="width:${prog}%"></i></div><span>${txt}</span></div>`;
    d.onclick=()=>pickPath(p.s,mode);
    box.appendChild(d);
  });
}
/* ---------- Ventana de confirmación con diseño propio ---------- */
import { ICON_NAMES, icon } from './icons.js';
export function ask({ico='❓',title,text,yes='Aceptar',no='Cancelar',danger=false}){
  return new Promise(res=>{
    $('askIco').innerHTML=ICON_NAMES.includes(ico)?icon(ico):ico;$('askTitle').textContent=title;$('askText').innerHTML=text;
    const y=$('askYes'),n=$('askNo');y.textContent=yes;n.textContent=no;y.className=danger?'danger':'primary';
    const done=v=>{$('ask').classList.remove('show');y.onclick=n.onclick=null;res(v)};
    y.onclick=()=>done(true);n.onclick=()=>done(false);
    $('ask').classList.add('show');
  });
}
async function pickPath(s,mode){
  mode='c';
  const active=S.run&&S.G&&!S.G.done,p=pathOf(s);
  if(active||store.run){
    const cur=active?S.run:store.run;
    const ok=await ask({ico:'🗺️',danger:true,yes:'Sí, empezar',no:'Volver',
      title:active?'¿Abandonar esta partida?':'¿Descartar la partida guardada?',
      text:(active?'Dejas la partida en curso.':'Se pierde la partida guardada.')+` Lo conseguido (${cur.mode==='p'?'nivel '+cur.level:cur.score.toLocaleString('de-DE')+' pts, nivel '+cur.level}) cuenta para tu máximo.<br><br>Empezarás <b>${p.n}</b> · Aventura.`});
    if(!ok) return;
  }
  $('menu').classList.remove('show');$('pause').classList.remove('show');Music.muffle(false);
  startRun(s,mode);
}
/* ---------- Opciones (pausa) ---------- */
function openPause(){
 if(!S.run||!S.G||S.G.done)return;
 $('pauseContext').textContent=`${heroOf().name} · Nivel ${S.run.level} de 100`;
 soundLabel();$('pause').classList.add('show');Music.muffle(true);$('pResume').focus();
}
function closePause(){$('pause').classList.remove('show');Music.muffle(false)}
$('bMenu').onclick=()=>{ if(S.busy)return; if(S.run&&S.G&&!S.G.done)openPause(); else openMenu(); };
$('pResume').onclick=closePause;
$('pause').addEventListener('keydown',e=>{
 if(e.key==='Escape'){e.preventDefault();closePause();return}
 if(e.key!=='Tab')return;const buttons=[...$('pause').querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
$('pProgress').onclick=async()=>{
 if(!S.run||!S.G||S.G.done)return;const session=S.run,wasBusy=S.busy;S.busy=true;$('pause').classList.remove('show');
 const zone=zoneIdx(S.run.level);await showMap(zone,zone,{overview:true});S.busy=wasBusy;
 if(S.run===session&&!S.G.done)openPause();
};
$('pSave').onclick=()=>{
 if(!S.run||!S.G||S.G.done)return;
 saveRun();S.G.done=true;S.run=null;S.busy=false;
 $('pause').classList.remove('show');Music.stop(.2);setTensionFx(0,false);openMenu();
};
$('pQuit').onclick=()=>{
 if(!S.run)return;recordBest(true);store.run=null;if(S.G)S.G.done=true;S.run=null;S.busy=false;persist();
 $('pause').classList.remove('show');Music.stop(.2);setTensionFx(0,false);openMenu();
};
$('pSound').onclick=toggleSound;
export function openMenu(){
  syncRouteStyle();
  renderPaths();
  const active=S.run&&S.G&&!S.G.done, canCont=!!store.run&&!active;
  const b=$('bContinue');b.style.display=canCont?'':'none';
  if(canCont){const sr=store.run;b.innerHTML=`▶ Continuar<small>${pathOf(sr.start||1).n} · Nivel ${sr.level}`+(sr.mode==='p'?' · Práctica':` · ${sr.score.toLocaleString('de-DE')} pts`)+'</small>'}
  $('bResume').style.display=active?'':'none';
  $('menu').classList.add('show');
  if(active)Music.muffle(true);        // hay un nivel en pausa debajo: su música suena apagada
  else Music.scene('menu');            // sin partida: tema del menú principal
}

$('bResume').onclick=()=>{$('menu').classList.remove('show');Music.muffle(false)};
$('bContinue').onclick=()=>{
  $('menu').classList.remove('show');Music.muffle(false);
  if(S.run&&S.G&&!S.G.done) return;
  S.run={start:1,mode:'c',hero:'lia',lifeUsed:false,undoUsedAt:0,undoUsedLevel:0,undoUsedCount:0,vanAwardedAt:0,recBroken:false,...store.run};syncHero();
  resumeAdventure();
};

