import { CHAPTERS, HERO_LORE } from '../data/story.js';
import { ZONES, zoneIdx } from '../data/zones.js';
import { $, cssUrl } from '../dom.js';
import { heroOf } from '../state.js';
export function heroArt(id,pose='start'){return pose==='start'?`heroes/${id}.webp`:`heroes/${id}-${pose}.webp`}
export function storyFor(id,level){const i=zoneIdx(level),c=CHAPTERS[i],h=heroOf(id),l=HERO_LORE[h.id];return {chapter:i+1,level:i*10+1,city:ZONES[i].n,title:c.title,body:c.opening,cityLines:c.cityLines,action:l.chapterLines[i],quote:l.quote,seal:c.seal}}
export function endingStory(victory,id,level){
 const h=heroOf(id),l=HERO_LORE[h.id],bg=`backgrounds/zone-${zoneIdx(level)+1}.webp`;
 if(!victory){
  const art=heroArt(h.id,'derrota');
  $('overBg').src=art;$('overPortrait').src=art;$('overPortrait').alt=`${h.name}, sin fuerzas tras la derrota`;
  return;
 }
 const port=$('fPortrait');
 port.parentElement.style.setProperty('--ending-scene',cssUrl(bg));
 port.onerror=()=>{
  if(h.id==='van'&&!port.dataset.triedJuth){port.dataset.triedJuth='1';port.src='heroes/juth-final.webp';return}
  port.onerror=null;port.src=heroArt(h.id,'victory');
 };
 delete port.dataset.triedJuth;
 port.src=heroArt(h.id,'final');port.alt=`${h.name} alcanza el final de su senda`;
 $('fLore').textContent=l.endingLore;
 $('fThanks').textContent=`${h.name}: ${l.thanksWin}`;
}

