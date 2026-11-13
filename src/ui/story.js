import { CHAPTERS, HERO_LORE } from '../data/story.js';
import { ZONES, zoneIdx } from '../data/zones.js';
import { $ } from '../dom.js';
import { heroOf } from '../state.js';
export function heroArt(id,pose='start'){return pose==='start'?`heroes/${id}.webp`:`heroes/${id}-${pose}.webp`}
export function storyFor(id,level){const i=zoneIdx(level),c=CHAPTERS[i],h=heroOf(id),l=HERO_LORE[h.id];return {chapter:i+1,level:i*10+1,city:ZONES[i].n,title:c.title,body:c.opening,action:l.chapterLines[i],quote:l.quote,seal:c.seal}}
export function endingStory(victory,id,level){const h=heroOf(id),l=HERO_LORE[h.id],prefix=victory?'f':'over';$(prefix+'Portrait').parentElement.style.setProperty('--ending-scene',`url("backgrounds/zone-${zoneIdx(level)+1}.webp")`);$(prefix+'Portrait').src=heroArt(h.id,victory?'victory':'defeat');$(prefix+'Portrait').alt=victory?`${h.name} celebra el regreso del amanecer`:`${h.name} descansa tras la aventura`;
 $(prefix+'Lore').textContent=victory?'Tri pierde su dominio. Los diez fragmentos se unen y el Faro del Alba devuelve la luz a todas las ciudades que ayudaste a salvar.':`Tri cierra el camino a ${ZONES[zoneIdx(level)].n}. La llave pierde su brillo. ${h.name} cae de rodillas, sin fuerzas. La noche gana este intento; la esperanza sigue esperando.`;
 $(prefix+'Thanks').textContent=`${h.name}: ${victory?l.thanksWin:l.thanksLoss}`;
}

