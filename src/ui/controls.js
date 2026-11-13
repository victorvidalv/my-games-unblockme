import { sfx } from '../audio/sound.js';
import { moveStatus } from '../engine/rules.js';
import { $ } from '../dom.js';
import { hintMove } from '../engine/solver.js';
import { applyUndo } from '../game/heroes.js';
import { fail, saveRun, startRun } from '../game/session.js';
import { S, heroOf, persist, store, undosLeft } from '../state.js';
import { layout, updateHud } from './board.js';
import { burst } from './fx.js';
import { openMenu } from './menu.js';
$('bAgain').onclick=()=>{$('over').classList.remove('show');store.mode=S.lastCfg.mode;persist();startRun(S.lastCfg.start,S.lastCfg.mode)};
$('bToMenu').onclick=()=>{$('over').classList.remove('show');openMenu()};

/* ---------- Botones del juego ---------- */
$('bUndo').onclick=()=>{
  if(!S.G||S.G.done||S.busy||!S.G.hist.length)return;
  const undo=applyUndo({heroId:heroOf().id,run:S.run,mode:S.run.mode,level:S.G.n,moves:S.G.moves}),free=undo.free;
  S.G.pos=S.G.hist.pop();S.G.moves=undo.moves;layout();sfx.move();updateHud();$('bUndo').disabled=!S.G.hist.length;
  saveRun();
  if(free&&S.run.mode!=='p')$('msg').textContent=`↶ Un paso atrás. Quedan ${undosLeft()} deshacer gratis.`;   // en Desafío deshacer cuesta 1 movimiento; en Práctica es gratis
  if(S.run.mode==='p'){}
  else if(moveStatus(S.G.moves,S.G.limit)==='over')fail('limit');else if(moveStatus(S.G.moves,S.G.limit)==='last')$('msg').textContent='⚠️ ÚLTIMO MOVIMIENTO: el siguiente te elimina.';
};
$('bHint').onclick=()=>{
  if(!S.G||S.G.done||S.busy||(S.run.mode!=='p'&&S.run.hints<=0))return;
  const h=hintMove(S.G.pieces,S.G.pos);
  if(!h){$('msg').textContent='No encuentro pista desde aquí.';return}
  if(S.run.mode!=='p'){S.run.hints--;saveRun();$('hintN').textContent=S.run.hints;$('bHint').disabled=S.run.hints<=0}
  const p=S.G.pieces[h.i],n=Math.abs(h.to-h.from);
  const dir=p.o==='h'?(h.to>h.from?'derecha':'izquierda'):(h.to>h.from?'abajo':'arriba');
  $('msg').textContent=`💡 Mueve la pieza brillante ${n} casilla${n>1?'s':''} hacia ${dir}. Quedan ${h.left} movimientos.`;
  const el=S.G.els[h.i];el.classList.remove('hint');void el.offsetWidth;el.classList.add('hint');sfx.hint();
  const r=el.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,14,['#fff','#ffcf6b'],3);
};

