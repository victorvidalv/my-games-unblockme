import { Music } from '../audio/music.js';
import { tone } from '../audio/sound.js';
import { $ } from '../dom.js';
import { recordBest, startRun } from '../game/session.js';
import { S, heroOf, pathOf, persist, rkey, store } from '../state.js';
import { icon } from './icons.js';
import { countUp } from './fx.js';
import { openMenu } from './menu.js';
import { endingStory } from './story.js';
/* Final del nivel 100: felicitación + reto al siguiente camino (o aplausos si fue Experto) */
let crowdTimer=0;
function stopCrowd(){clearInterval(crowdTimer);setTimeout(()=>{$('crowd').innerHTML=''},3600)}
function showFinale(prac,p,score,broken,heroId='lia'){
  endingStory(true,heroId,100);
  const mode=prac?'p':'c';
  const F={
    1: {ico:'trophy',tag:'SENDA NORMAL COMPLETADA',title:'¡Felicidades!',text:'Rompiste los diez sellos y superaste los 100 umbrales en Normal.',
        chal:'La senda <b>Difícil</b> aguarda ahora: menos margen, más gloria.',next:[[50,'⚔️ Ir al camino Difícil',1]]},
    50:{ico:'medal',tag:'SENDA DIFÍCIL COMPLETADA',title:'¡Felicidades, viajero!',text:'Superaste los 100 umbrales de la senda Difícil sin ceder al sello.',
        chal:'Solo resta la prueba suprema: la senda <b>Experto</b>.',next:[[75,'🔥 Ir al camino Experto',1]]},
    75:{ico:'crown',tag:'SENDA EXPERTO COMPLETADA',title:'¡Has finalizado el juego!',text:'¡Felicidades! Conquistaste los tres caminos y encendiste para siempre el Faro del Alba.',
        chal:'Tu leyenda queda grabada en los diez reinos.',next:[]},
  }[p.s]||{ico:'trophy',tag:'SENDA COMPLETADA',title:'¡Felicidades!',text:'Superaste los 100 umbrales.',chal:'',next:[[1,'↻ Jugar otra vez',1]]};
  const legend=p.s===75;
  $('fCard').classList.toggle('legend',legend);
  $('fIco').innerHTML=icon(F.ico);$('fTag').textContent=F.tag;$('fTitle').textContent=F.title;$('fText').textContent=F.text;$('fChal').innerHTML=F.chal;
  $('fScore').textContent=prac?'':'0';$('fRec').innerHTML=(!prac&&broken)?'<span class="rec">★ NUEVO RÉCORD ★</span>':'';
  const box=$('fBtns');box.innerHTML='';
  F.next.forEach(([s,label,main])=>{const b=document.createElement('button');b.textContent=label;if(main)b.className='primary big';
    b.onclick=()=>{$('finale').classList.remove('show');stopCrowd();Music.duck(1);store.mode=mode;persist();startRun(s,mode)};box.appendChild(b)});
  const m=document.createElement('button');m.textContent='Ir al inicio';if(!F.next.length)m.className='primary big';m.onclick=()=>{$('finale').classList.remove('show');stopCrowd();Music.duck(1);openMenu()};box.appendChild(m);
  $('finale').classList.add('show');Music.duck(.3);
  if(!prac) countUp($('fScore'),0,score,1600);
  tone(392,.35,'sine',.045);tone(523,.45,'sine',.035,.15);
}

export function endRun(victory,why){
  const prac=S.run.mode==='p',p=pathOf(S.run.start),endingHero=heroOf().id;
  S.lastCfg={start:S.run.start,mode:S.run.mode};
  recordBest(true);
  const rec=store.paths[rkey()];
  if(victory){const sc=S.run.score,br=S.run.recBroken;store.run=null;persist();S.run=null;showFinale(prac,p,sc,br,endingHero);return}
  endingStory(false,endingHero,S.run.level);
  $('overTag').textContent='PARTIDA TERMINADA · '+p.n.toUpperCase();
  $('overTitle').textContent='Sin turnos';
  $('overTxt').textContent=`Te quedaste sin movimientos en el nivel ${S.run.level}.`;
  $('overRec').innerHTML=(!prac&&S.run.recBroken)?'<span class="rec">★ NUEVO RÉCORD ★</span>':'';
  $('overLvl').textContent=S.run.level;$('overBest').textContent=rec.score.toLocaleString('de-DE');
  $('over').classList.add('show');countUp($('overScore'),0,S.run.score,1200);$('bToMenu').focus();
  store.run=null;persist();S.run=null;
}
