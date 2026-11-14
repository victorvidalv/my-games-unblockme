import { Music } from '../audio/music.js';
import { sfx } from '../audio/sound.js';
import { CHAPTERS, HERO_LORE } from '../data/story.js';
import { ZONES, zoneOf, zoneStep } from '../data/zones.js';
import { $, cssUrl } from '../dom.js';
import { S, heroOf } from '../state.js';
import { heroMarkup } from './heroes.js';
let curZone=-1;

function paintScenery(i){
 document.documentElement.style.setProperty('--scene',cssUrl(`backgrounds/zone-${i+1}.webp`));
}
export function applyZone(i){
  paintScenery(i);
  if(curZone===i) return; curZone=i;
  const z=ZONES[i],r=document.documentElement.style;
  for(let k=0;k<8;k++){
    if(!z.h){['a','b','d'].forEach(c=>r.removeProperty(`--p${k}${c}`));continue}
    const l=z.l+(k%2?4:-3), s=z.s-(k%3===0?6:0);
    r.setProperty(`--p${k}a`,`hsl(${z.h[k]} ${s}% ${Math.min(l+14,88)}%)`);
    r.setProperty(`--p${k}b`,`hsl(${z.h[k]} ${s}% ${l-5}%)`);
    r.setProperty(`--p${k}d`,`hsl(${z.h[k]} ${Math.max(20,s-12)}% ${Math.max(14,l-30)}%)`);
  }
  document.body.style.setProperty('--t1',z.t1);document.body.style.setProperty('--t2',z.t2);document.body.style.setProperty('--cc',z.cc);
}
export function renderStage(){                                   // barra de 10 tramos de la zona actual
  const z=zoneOf(S.G.n),step=zoneStep(S.G.n);
  $('sname').textContent=z.n;
  const sg=$('segs');sg.innerHTML='';
  for(let k=1;k<=10;k++){const s=document.createElement('span');s.className='sg'+(k<step?' done':k===step?' cur adv':'');sg.appendChild(s)}
}
/* Mapa de zonas: se muestra al empezar un camino y al cambiar de zona (la llave roja viaja a la siguiente parada) */
export function showMap(fromI,toI,{travel=false,overview=false}={}){
 return new Promise(resolve=>{
  const el=$('journey'),svg=$('mapSvg'),NS='http://www.w3.org/2000/svg';
  const wide=innerWidth/innerHeight>1.3,W=wide?1000:480,H=wide?390:650;
  const mk=(tag,attrs,parent=svg)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent.appendChild(n);return n};
  svg.innerHTML='';svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`El atlas de ${heroOf().name}. Destino: ${ZONES[toI].n}`);
  const pts=ZONES.map((_,i)=>wide?[100+(i<5?i:9-i)*200,i<5?100:285]:[i%4<2?118:362,60+Math.floor(i/2)*130]);
  // Serpentine order: two cities per row on a hand-drawn constellation road.
  if(!wide)pts.forEach((p,i)=>p[0]=(Math.floor(i/2)%2===0?(i%2===0?118:362):(i%2===0?362:118)));
  const defs=mk('defs',{});const grad=mk('linearGradient',{id:'atlasShade',x1:0,y1:0,x2:0,y2:1},defs);
  mk('stop',{offset:0,'stop-color':'#081126','stop-opacity':0},grad);mk('stop',{offset:1,'stop-color':'#081126','stop-opacity':.95},grad);
  const open=travel?fromI:toI,paths=[];
  mk('rect',{x:2,y:2,width:W-4,height:H-4,rx:32,fill:'#0a1734','fill-opacity':.65,stroke:'#c6cde629'});
  for(let i=0;i<45;i++)mk('circle',{cx:18+(i*137)%(W-36),cy:16+(i*83)%(H-32),r:i%5===0?2:1,fill:'#f5d99b',opacity:i%3===0?.5:.15});
  for(let i=0;i<9;i++){
   const [x,y]=pts[i],[nx,ny]=pts[i+1],mx=(x+nx)/2,my=(y+ny)/2;
   const d=wide?(y===ny?`M${x} ${y} C${mx} ${y-25} ${mx} ${ny+25} ${nx} ${ny}`:`M${x} ${y} C${x+95} ${my} ${nx+95} ${my} ${nx} ${ny}`):(y===ny?`M${x} ${y} C${mx} ${y+35} ${mx} ${ny+35} ${nx} ${ny}`:`M${x} ${y} C${x+(x<240?-55:55)} ${my} ${nx+(nx<240?-55:55)} ${my} ${nx} ${ny}`);
   mk('path',{d,fill:'none',stroke:'#040919','stroke-width':15});
   const road=mk('path',{d,fill:'none',stroke:i<open?'#e7c47c':'#7289a657','stroke-width':4,'stroke-dasharray':i<open?'none':'3 10','stroke-linecap':'round'});paths.push(road);
  }
  const cards=ZONES.map((z,i)=>{
   const [x,y]=pts[i],w=wide?162:176,h=94,id='cityCrop'+i;
   const clip=mk('clipPath',{id},defs);mk('rect',{x:x-w/2,y:y-h/2,width:w,height:h,rx:17},clip);
   const g=mk('g',{class:'atlas-city'+(i===open?' current':'')+(i>open?' undiscovered':'')});
   mk('rect',{x:x-w/2-3,y:y-h/2-3,width:w+6,height:h+6,rx:20,fill:'#10223c',stroke:i===open?'#ffdb8f':i<open?'#73bfaa':'#7289a655','stroke-width':i===open?3:1},g);
   mk('image',{href:`backgrounds/zone-${i+1}.webp`,x:x-w/2,y:y-h/2,width:w,height:h,preserveAspectRatio:'xMidYMid slice','clip-path':`url(#${id})`,opacity:i>open?.35:1},g);
   mk('rect',{x:x-w/2,y:y-h/2,width:w,height:h,rx:17,fill:'url(#atlasShade)'},g);
   const label=mk('text',{x,y:y+22,'text-anchor':'middle',fill:'#fff','font-size':wide?12:13,'font-weight':800},g);label.textContent=z.n;
   const sub=mk('text',{x,y:y+39,'text-anchor':'middle',fill:i>open?'#b7c5dd':'#e7c47c','font-size':9,'letter-spacing':1.2},g);sub.textContent=i<open?'COMPLETADA':i===open?'ESTÁS AQUÍ':`NIVELES ${i*10+1}–${(i+1)*10}`;
   mk('circle',{cx:x-w/2+15,cy:y-h/2+15,r:11,fill:'#0b152de6',stroke:'#f3d08b99'},g);
   const num=mk('text',{x:x-w/2+15,y:y-h/2+19,'text-anchor':'middle',fill:'#ffdf9f','font-size':11,'font-weight':800},g);num.textContent=i<open?'✓':i+1;
   return g;
  });
  const hero=mk('g',{class:'atlas-traveler'});hero.innerHTML=heroMarkup(heroOf(),'map');
  const art=hero.firstElementChild;art.style.width='44px';art.style.height='64px';art.setAttribute('width','44');art.setAttribute('height','64');art.setAttribute('x','-22');art.setAttribute('y','-70');
  const place=(x,y)=>hero.setAttribute('transform',`translate(${x} ${y-27})`);place(...pts[open]);
  el.style.setProperty('--atlas-scene',cssUrl(`backgrounds/zone-${toI+1}.webp`));
  $('mTag').textContent=travel?`EL ATLAS DE ${heroOf().name.toUpperCase()} · UN NUEVO HORIZONTE`:`EL ATLAS DE ${heroOf().name.toUpperCase()} · CIUDAD ${toI+1} DE 10`;
  $('mName').textContent=travel?`Hasta pronto, ${ZONES[fromI].n}`:ZONES[toI].n;
  $('mSub').textContent=overview?`Nivel actual ${S.run.level} de 100 · Umbral ${zoneStep(S.run.level)} de 10 en este reino`:travel?CHAPTERS[fromI].end:`Diez umbrales, un sello antiguo. Nivel ${S.run.level} de 100.`;
  el.setAttribute('role',overview?'dialog':'status');if(overview)el.setAttribute('aria-modal','true');else el.removeAttribute('aria-modal');el.setAttribute('aria-labelledby','mName');$('mapClose').hidden=!overview;
  el.classList.remove('out');el.classList.add('show');Music.duck(.35);
  let finished=false,frame=0,timer=0,ready=!travel;
  const end=()=>{if(finished||!ready)return;finished=true;clearTimeout(timer);cancelAnimationFrame(frame);el.removeEventListener('pointerdown',end);el.removeEventListener('keydown',key);document.removeEventListener('keydown',key);el.classList.add('out');setTimeout(()=>{el.classList.remove('show','out');$('mapClose').hidden=true;Music.duck(1);resolve()},150)};
  const key=e=>{if(overview){if(e.key==='Escape'){e.preventDefault();end()}else if(e.key==='Tab'){e.preventDefault();$('mapClose').focus()}}else if(e.key==='Enter'||e.key===' '){e.preventDefault();end()}};
  if(!overview){el.addEventListener('pointerdown',end);el.addEventListener('keydown',key)}else document.addEventListener('keydown',key);el.removeAttribute('tabindex');$('mapClose').onclick=end;if(overview)$('mapClose').focus();
  if(travel){
   sfx.journey();const path=paths[fromI],length=path.getTotalLength(),t0=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:1400;
   art.classList.add('walking');
   function step(t){const k=duration?Math.min(1,(t-t0)/duration):1,e=k*k*(3-2*k),p=path.getPointAtLength(length*e);place(p.x,p.y);
    if(k<1)frame=requestAnimationFrame(step);else{art.classList.remove('walking');applyZone(toI);cards[fromI].classList.remove('current');cards[fromI].querySelectorAll('text')[1].textContent='COMPLETADA';cards[fromI].querySelector('rect').setAttribute('stroke','#73bfaa');cards[toI].classList.remove('undiscovered');cards[toI].classList.add('current');const pic=cards[toI].querySelector('image');pic.setAttribute('opacity',1);cards[toI].querySelector('rect').setAttribute('stroke','#ffdb8f');const texts=cards[toI].querySelectorAll('text');texts[1].textContent='ESTÁS AQUÍ';$('mName').textContent=ZONES[toI].n;$('mSub').textContent=`${heroOf().name}: ${HERO_LORE[heroOf().id].quote}`;ready=true;timer=setTimeout(end,matchMedia('(prefers-reduced-motion: reduce)').matches?100:450);sfx.win()}}
   frame=requestAnimationFrame(step);
  }else{applyZone(toI);if(!overview){sfx.start();timer=setTimeout(end,650)}}
 });
}

