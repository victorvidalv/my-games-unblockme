import { Music } from '../audio/music.js';
import { tone } from '../audio/sound.js';
import { $ } from '../dom.js';
import { recordBest, startRun } from '../game/session.js';
import { S, heroOf, pathOf, persist, rkey, store } from '../state.js';
import { icon } from './icons.js';
import { countUp } from './fx.js';
import { openMenu } from './menu.js';
import { endingStory } from './story.js';
import { CHAPTERS } from '../data/story.js';
import { WORLD } from '../data/lore.js';
import { zoneIdx } from '../data/zones.js';
/* Final del nivel 100: felicitación + reto al siguiente camino (o aplausos si fue Experto) */
let crowdTimer=0;
function stopCrowd(){clearInterval(crowdTimer);setTimeout(()=>{$('crowd').innerHTML=''},3600)}
function showFinale(prac,p,score,broken,heroId='lia'){
  endingStory(true,heroId,100);
  const mode=prac?'p':'c';
  const F={
    1: {ico:'trophy',tag:'SENDA NORMAL COMPLETADA',title:'¡Los sellos ceden!',text:'Los diez sellos de Thyes se quiebran y el Faro del Alba parpadea en la penumbra. Pero Vhorn aún acecha, y Tri duerme.',
        chal:'En la senda <b>Difícil</b> las sombras de Vhorn pesan más: menos margen, más gloria.',next:[[50,'⚔️ Ir al camino Difícil',1]]},
    50:{ico:'medal',tag:'SENDA DIFÍCIL COMPLETADA',title:'¡Viajero de Thyes!',text:'Recorriste otra vez los diez reinos, ya con la Hora y la Palabra al hombro. El Faro arde casi entero.',
        chal:'Solo resta la prueba suprema: la senda <b>Experto</b>, hasta el trono vacío.',next:[[75,'🔥 Ir al camino Experto',1]]},
    75:{ico:'crown',tag:'SENDA EXPERTO COMPLETADA',title:'¡Thyes amanece!',text:'La Brasa, la Hora y la Palabra encienden el Faro del Alba. Vhorn se disuelve y Tri, al fin, abre los ojos: año 4134, Thyes despierta.',
        chal:'Tu nombre queda grabado en los diez sellos.',next:[]},
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
  $('overTag').textContent='LA NOCHE SE CIERRA · '+p.n.toUpperCase();
  $('overTitle').textContent='Sin turnos';
  $('overTxt').textContent=`Te quedaste sin movimientos en el nivel ${S.run.level}. El Sello de ${CHAPTERS[zoneIdx(S.run.level)].seal} resiste… por ahora. Thyes, año ${WORLD.year}.`;
  $('overRec').innerHTML=(!prac&&S.run.recBroken)?'<span class="rec">★ NUEVO RÉCORD ★</span>':'';
  $('overLvl').textContent=S.run.level;$('overBest').textContent=rec.score.toLocaleString('de-DE');
  $('over').classList.add('show');countUp($('overScore'),0,S.run.score,1200);$('bToMenu').focus();
  store.run=null;persist();S.run=null;
}
