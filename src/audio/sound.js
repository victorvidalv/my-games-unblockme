import { Music } from './music.js';
import { S } from '../state.js';
import { $ } from '../dom.js';
/* ============================ Sonido y vibración ============================ */
/** Ganchos que la app conecta, para que el audio no dependa del resto del juego. */
export const hooks={onSuspend:null};
export let AC=null,audioNeedsRecovery=false,audioRecoveryTimer=0,audioPageHidden=false;
export function ctx(){
 if(!AC||AC.state==='closed'){
  const previous=AC,owner=AC=new (window.AudioContext||window.webkitAudioContext)();
  if(previous)audioNeedsRecovery=true;
  if(owner.state==='running')queueMicrotask(()=>completeAudioRecovery(owner));
  owner.addEventListener('statechange',()=>handleAudioState(owner));
 }
 if(!document.hidden&&!audioPageHidden&&(AC.state==='suspended'||AC.state==='interrupted')){
  audioNeedsRecovery=true;const owner=AC;
  try{Promise.resolve(owner.resume()).then(()=>completeAudioRecovery(owner)).catch(()=>queueAudioRecoveryHint())}catch(_){}
 }
 return AC;
}
export let muted=localStorage.getItem('desbloquea.mute')==='1';
export function tone(f,d=.1,type='sine',v=.12,delay=0,slide=0){
  if(muted||document.hidden||audioPageHidden) return;
  try{
    ctx();
    const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
    g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.02);
  }catch(e){}
}
export const sfx={
  move:()=>tone(240+Math.random()*60,.08,'triangle',.1),
  win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.28,'sine',.13,i*.08)),
  perfect:()=>{[523,659,784,1047,1319,1568,2093].forEach((f,i)=>tone(f,.35,'sine',.12,i*.07));
    [1760,2349,2637,3136].forEach((f,i)=>tone(f,.18,'triangle',.05,.5+i*.09));tone(196,.5,'sine',.05,0,30)},
  fail:()=>{tone(260,.7,'triangle',.07,0,-140);tone(130,.8,'sine',.05,.1,-50)},
  hint:()=>{tone(880,.2,'sine',.1);tone(1320,.3,'sine',.08,.08)},
  gateMove:()=>{tone(740,.07,'square',.045);tone(520,.1,'triangle',.06,.05);tone(1480,.05,'sine',.03,.02)},          // metal: clic de cerradura y deslizar
  heavyMove:()=>{tone(95,.16,'triangle',.13);tone(70,.22,'sine',.1,.04,-25);tone(190,.06,'square',.04)},                  // golpe sordo y grave
  unlock:()=>{[523,784,1047,1568].forEach((f,i)=>tone(f,.16,'triangle',.09,i*.05));tone(1976,.3,'sine',.06,.2)},
  locked:()=>{tone(150,.18,'square',.06);tone(120,.22,'square',.05,.1)},
  plate:()=>{tone(330,.1,'triangle',.08);tone(494,.14,'triangle',.07,.07)},
  start:()=>{tone(330,.12,'triangle',.08);tone(494,.18,'triangle',.08,.08)},
  warn:()=>tone(220,.16,'sine',.04),
  fanfare:()=>{[523,659,784,1047,1319,1568,2093].forEach((f,i)=>tone(f,.45,'sine',.12,i*.11));[523,659,784,1047].forEach(f=>tone(f,1.6,'triangle',.07,.85))},
  journey:()=>{[392,494,587,784].forEach((f,i)=>tone(f,.5,'sine',.08,i*.35));tone(98,1.6,'triangle',.06,0,40);[1175,1568].forEach((f,i)=>tone(f,.4,'sine',.05,2+i*.12))},
};

/* Aplausos sintetizados: cientos de palmadas de ruido filtrado con una envolvente que sube y baja */
export const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
export function soundLabel(){
 const button=$('pSound');if(!button)return;
 const label=muted?'Activar sonido':'Desactivar sonido';
 const extra=muted?'<path d="m21 11 5 6m0-6-5 6"/>':'<path d="M21 10q6 4 0 8m3-11q9 7 0 14"/>';
 button.innerHTML=`<span>${label}</span><svg class="pause-icon" viewBox="0 0 30 28" aria-hidden="true"><path d="M4 11h5l7-6v18l-7-6H4Z"/>${extra}</svg>`;
 button.setAttribute('aria-pressed',String(!muted));button.setAttribute('aria-label',label);
}
export function toggleSound(){
  muted=!muted;localStorage.setItem('desbloquea.mute',muted?'1':'0');soundLabel();
  if(muted)Music.stop(.2);
  else if(S.G&&!S.G.done){Music.start();Music.muffle($('menu').classList.contains('show')||$('pause').classList.contains('show'))}
}
soundLabel();

/* Safari may return from background as "interrupted", not just "suspended".
   Retry resume directly inside every trusted gesture; never await before it. */
export function clearAudioRecoveryHint(){clearTimeout(audioRecoveryTimer);audioRecoveryTimer=0;const hint=$('audioRecover');if(hint)hint.hidden=true}
function queueAudioRecoveryHint(){
 if(audioRecoveryTimer||document.hidden||audioPageHidden||muted||!Music.playing)return;
 audioRecoveryTimer=setTimeout(()=>{audioRecoveryTimer=0;if(audioNeedsRecovery&&!document.hidden&&!audioPageHidden&&!muted&&Music.playing)$('audioRecover').hidden=false},700);
}
function completeAudioRecovery(owner=AC){
 if(owner!==AC||!owner||owner.state!=='running'||document.hidden||audioPageHidden||muted)return;
 const needed=audioNeedsRecovery;audioNeedsRecovery=false;clearAudioRecoveryHint();
 if(needed&&Music.playing)Music.recover();
}
function handleAudioState(owner){
 if(owner!==AC)return;
 if(owner.state==='running'){completeAudioRecovery(owner);return}
 audioNeedsRecovery=true;Music.background();
 if(!document.hidden&&!audioPageHidden&&!muted&&owner.state!=='closed')recoverPageAudio();
}
function recoverPageAudio(fromGesture=false){
 if(fromGesture&&!document.hidden)audioPageHidden=false;
 if(document.hidden||audioPageHidden||muted){clearAudioRecoveryHint();return}
 if(!AC){if(!fromGesture)return;try{ctx()}catch(_){return}}
 if(AC.state==='running'&&!audioNeedsRecovery)return;
 audioNeedsRecovery=true;
 try{
  if(AC.state==='closed')ctx();
  const owner=AC;
  if(owner.state==='running'){completeAudioRecovery(owner);return}
  // Must be called synchronously from touch/pointer/key handlers on iOS.
  Promise.resolve(owner.resume()).then(()=>completeAudioRecovery(owner)).catch(()=>queueAudioRecoveryHint());
 }catch(_){queueAudioRecoveryHint()}
 queueAudioRecoveryHint();
}
function suspendPageAudio(){
 audioPageHidden=true;
 hooks.onSuspend?.();                       // la app guarda la partida (se asigna en main.js)
 clearAudioRecoveryHint();Music.background();
 if(!AC)return;audioNeedsRecovery=true;
 if(AC.state==='running'){try{Promise.resolve(AC.suspend()).catch(()=>{})}catch(_){}}
}
addEventListener('pagehide',suspendPageAudio);
addEventListener('pageshow',()=>{audioPageHidden=false;recoverPageAudio()});
addEventListener('focus',()=>{if(!document.hidden)audioPageHidden=false;recoverPageAudio()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendPageAudio();else{audioPageHidden=false;recoverPageAudio()}});
for(const event of ['pointerdown','touchend','keydown'])addEventListener(event,()=>recoverPageAudio(true),{capture:true,passive:true});
$('audioRecover').onclick=()=>recoverPageAudio(true);
