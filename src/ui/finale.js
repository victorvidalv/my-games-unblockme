import { Music } from '../audio/music.js';
import { sfx, tone } from '../audio/sound.js';
import { $ } from '../dom.js';
import { recordBest, startRun } from '../game/session.js';
import { S, heroOf, pathOf, persist, rkey, store } from '../state.js';
import { icon } from './icons.js';
import { countUp, rain } from './fx.js';
import { openMenu } from './menu.js';
import { endingStory } from './story.js';
/* Final del nivel 100: felicitación + reto al siguiente camino (o aplausos si fue Experto) */
let crowdTimer=0;
function stopCrowd(){clearInterval(crowdTimer);setTimeout(()=>{$('crowd').innerHTML=''},3600)}
function showFinale(prac,p,score,broken,heroId='lia'){
  endingStory(true,heroId,100);
  const mode=prac?'p':'c';
  const F={
    1: {ico:'trophy',tag:'CAMINO NORMAL COMPLETADO',title:'¡Felicidades!',text:'Superaste los 100 niveles del camino Normal.',
        chal:'Ahora ponte a prueba: el camino <b>Difícil</b> sube la exigencia y da más puntos por nivel.',next:[[50,'⚔️ Probar Difícil',1],[75,'🔥 Ir directo a Experto',0]]},
    50:{ico:'medal',tag:'CAMINO DIFÍCIL COMPLETADO',title:'¡Impresionante!',text:'Dominaste los 100 niveles del camino Difícil.',
        chal:'¿Listo para el reto final? El camino <b>Experto</b> es solo para expertos.',next:[[75,'🔥 Probar Experto',1]]},
    75:{ico:'crown',tag:'CAMINO EXPERTO COMPLETADO',title:'¡LEYENDA!',text:'Completaste los 100 niveles del camino Experto. Eres de los mejores.',
        chal:'👏 ¡Un aplauso enorme para ti! 👏',next:[[75,'↻ Jugar Experto otra vez',1]]},
  }[p.s]||{ico:'trophy',tag:'COMPLETADO',title:'¡Felicidades!',text:'Superaste los 100 niveles.',chal:'',next:[[1,'↻ Jugar otra vez',1]]};
  const legend=p.s===75;
  $('fCard').classList.toggle('legend',legend);
  $('fIco').innerHTML=icon(F.ico);$('fTag').textContent=F.tag;$('fTitle').textContent=F.title;$('fText').textContent=F.text;$('fChal').innerHTML=F.chal;
  $('fScore').textContent=prac?'':'0';$('fRec').innerHTML=(!prac&&broken)?'<span class="rec">★ NUEVO RÉCORD ★</span>':'';
  const box=$('fBtns');box.innerHTML='';
  F.next.forEach(([s,label,main])=>{const b=document.createElement('button');b.textContent=label;if(main)b.className='primary big';
    b.onclick=()=>{$('finale').classList.remove('show');stopCrowd();Music.duck(1);store.mode=mode;persist();startRun(s,mode)};box.appendChild(b)});
  const m=document.createElement('button');m.textContent='Ir al menú';m.onclick=()=>{$('finale').classList.remove('show');stopCrowd();Music.duck(1);openMenu()};box.appendChild(m);
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
  $('overTag').textContent=(victory?'¡VICTORIA!':'PARTIDA TERMINADA')+' · '+p.n.toUpperCase();
  $('overTitle').textContent=victory?'Maestro de bloques':'La luz volverá a despertar';
  $('overTxt').textContent=victory?'Superaste los 100 niveles. Una hazaña.':`Se agotaron los turnos: ${S.G.moves} movimientos (el mínimo era ${S.G.opt}). La aventura termina al llegar al límite sin sacar la llave.`;
  $('overRec').innerHTML=(!prac&&S.run.recBroken)?'<span class="rec">★ NUEVO RÉCORD ★</span>':'';
  $('overLvl').textContent=S.run.level;$('overBest').textContent=rec.score.toLocaleString('de-DE');
  $('over').classList.add('show');countUp($('overScore'),0,S.run.score,1200);
  if(victory){sfx.win();rain();rain()}
  store.run=null;persist();S.run=null;
}
