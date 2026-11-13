import { $ } from '../dom.js';
/* ============================ Partículas ============================ */
const cv=$('fx'),cx=cv.getContext('2d');let parts=[],raf=0;
function fit(){const d=devicePixelRatio||1;cv.width=innerWidth*d;cv.height=innerHeight*d;cx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',fit);fit();
export function burst(x,y,n=40,cols=['#ffcf6b','#ff6a6a','#43e0c1','#6cb6ff','#b18cff','#ff9cc7'],sp=7){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=sp*(.3+Math.random());
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-3,g:.22,life:60+Math.random()*40,max:100,c:cols[i%cols.length],r:2+Math.random()*4,rot:Math.random()*6,vr:(Math.random()-.5)*.4})}
  if(!raf) raf=requestAnimationFrame(tick);
}
export function tick(){
  cx.clearRect(0,0,innerWidth,innerHeight);
  parts=parts.filter(p=>p.life>0);
  for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=.99;p.life--;p.rot+=p.vr;
    cx.save();cx.globalAlpha=Math.min(1,p.life/30);cx.translate(p.x,p.y);cx.rotate(p.rot);cx.fillStyle=p.c;cx.fillRect(-p.r,-p.r/2,p.r*2,p.r);cx.restore()}
  raf=parts.length?requestAnimationFrame(tick):0;
}
export function rain(){for(let i=0;i<5;i++)setTimeout(()=>burst(Math.random()*innerWidth,-10,22,undefined,3),i*220)}
export function countUp(el,from,to,ms=900,fmt=v=>Math.round(v).toLocaleString('de-DE')){
  const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);el.textContent=fmt(from+(to-from)*e);if(k<1)requestAnimationFrame(f)})(t0);
}

