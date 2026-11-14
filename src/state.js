import { heroById, freeUndosLeft } from './game/heroes.js';
import { gainFor } from './engine/scoring.js';
/* ============================ Estado y guardado ============================ */
/* Los puntajes viven SIEMPRE en localStorage (clave estable entre versiones, con copia de respaldo) */
const SAVE='desbloquea.rogue.v2', BAK=SAVE+'.bak';
function readStore(){                                    // lee el guardado; si está dañado, usa la copia de respaldo
  for(const k of [SAVE,BAK]){ try{const v=JSON.parse(localStorage.getItem(k)||'null');if(v&&typeof v==='object')return v}catch(e){} }
  return {};
}
export const store=Object.assign({best:{score:0,level:0},run:null,paths:{},mode:'c'},readStore());
store.mode='c';if(store.run){store.run.mode='c';if(!Number.isFinite(store.run.hints))store.run.hints=3;}
if(!store.paths)store.paths={};
if(store.best&&store.best.score>0&&!store.paths.c1) store.paths.c1={score:store.best.score,level:store.best.level,runs:0};   // migra récords antiguos
/* Tres caminos de 100 niveles. 's' = dificultad inicial (1-100); sube de forma lineal hasta 100 en el nivel 100 */
export const PATHS=[
  {s:1, n:'Normal',   e:'Ⅰ',c:'#43e0c1',d:'Para empezar y aprender'},
  {s:50,n:'Difícil', e:'Ⅱ',c:'#ffc65a',d:'Más difícil, más puntos'},
  {s:75,n:'Experto', e:'Ⅲ',c:'#ff5f8f',d:'Solo para expertos'},
];
export const pathOf=s=>PATHS.find(p=>p.s===s)||PATHS[0];
export const rkey=()=>S.run.mode+S.run.start;

/* Estado mutable compartido entre módulos: la aventura en curso, el tablero activo y si la UI está ocupada. */
export const S={run:null,G:null,busy:false,lastCfg:{start:1,mode:'c'}};
export const heroOf=(id=S.run?.hero)=>heroById(id);
/** Deshacer gratis que le quedan al héroe activo en el nivel (solo Jean). */
export const undosLeft=(level=S.run?.level)=>freeUndosLeft(heroOf().id,S.run,level,S.G?.opt);
/** Puntos que dan `moves` movimientos en el tablero actual (incluye racha y bono de ruta aventurera). */
export const gainNow=(moves=S.G.moves)=>gainFor(S.G.rate,moves,S.G.opt,S.run.streak||0,{brave:S.run.mode!=='p'&&S.run.route==='brave'});
function mergeRecords(a,b){                              // conserva el máximo de cada registro (p. ej. con dos pestañas abiertas)
  const out={...a};
  for(const k in b){const x=out[k]||{score:0,level:0,runs:0},y=b[k]||{};
    out[k]={score:Math.max(x.score||0,y.score||0),level:Math.max(x.level||0,y.level||0),runs:Math.max(x.runs||0,y.runs||0)}}
  return out;
}
export function persist(){
  try{
    store.paths=mergeRecords(store.paths,readStore().paths||{});
    const s=JSON.stringify(store);localStorage.setItem(SAVE,s);localStorage.setItem(BAK,s);
  }catch(e){}                                            // modo privado o almacenamiento lleno: el juego sigue funcionando
}
