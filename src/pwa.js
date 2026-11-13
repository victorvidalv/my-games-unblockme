import { sfx } from './audio/sound.js';
import { $ } from './dom.js';
import { saveRun } from './game/session.js';
import { S } from './state.js';
import { ask } from './ui/menu.js';
/* ============================ PWA ============================ */
// El récord y la partida en curso viven en localStorage; pedimos al navegador que no los borre
if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(()=>{});
$('ver').textContent='Versión '+__APP_VERSION__;      // viene de package.json (vite.config.js)
let pendingWorker=null,updating=false;
function showUpdate(w){pendingWorker=w;$('upd').classList.add('show');sfx.hint()}
async function applyUpdate(){
  if(S.G&&!S.G.done&&S.G.moves>0&&S.run){
    const ok=await ask({ico:'⬆️',title:'¿Actualizar ahora?',yes:'Actualizar',no:'Más tarde',
      text:'Hay una versión nueva. Tu partida se guarda, pero <b>el nivel actual se reinicia</b>.'});
    if(!ok) return;
  }
  if(S.run) saveRun();
  updating=true;$('updYes').textContent='Actualizando…';$('updYes').disabled=true;
  if(pendingWorker) pendingWorker.postMessage('SKIP_WAITING'); else location.reload();
}
$('updYes').onclick=applyUpdate;
$('updNo').onclick=()=>$('upd').classList.remove('show');
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  addEventListener('load',()=>{
    navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js').then(reg=>{
      const offer=w=>{ if(navigator.serviceWorker.controller) showUpdate(w) };      // solo si ya había una versión instalada
      if(reg.waiting) offer(reg.waiting);
      reg.addEventListener('updatefound',()=>{const w=reg.installing;if(w)w.addEventListener('statechange',()=>{if(w.state==='installed')offer(w)})});
      const check=()=>reg.update().catch(()=>{});
      setInterval(check,30*60*1000);                                                 // busca versión nueva cada 30 min
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()}); // y al volver a la app
    }).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updating)location.reload()});
  });
}
let deferredInstall=null;
const showInstall=v=>document.querySelectorAll('.install').forEach(b=>b.style.display=v?'flex':'none');
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;showInstall(true)});
document.querySelectorAll('.install').forEach(b=>b.onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;showInstall(false)});
addEventListener('appinstalled',()=>showInstall(false));

// evita zoom por gestos y menú contextual al mantener pulsado
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('contextmenu',e=>e.preventDefault());
