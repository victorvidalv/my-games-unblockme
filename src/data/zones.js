/* ============================ Zonas: una cada 10 niveles ============================
   Cambian los colores de las piezas y el fondo; la llave roja siempre se mantiene roja. */
export const ZONES=[
  {n:'Valle Esmeralda',e:'🌿',t1:'#4a35a066',t2:'#0e8a9a55',cc:'#43e0c1'},                      // paleta original
  {n:'Puerto de las Velas',     e:'⚓',s:60,l:54,h:[190,20,205,175,45,220,160,30]},
  {n:'Oasis Dorado',  e:'🏜️',s:68,l:54,h:[38,170,48,22,75,200,30,55]},
  {n:'Aldea de Otoño',  e:'🍂',s:62,l:50,h:[28,95,40,300,110,22,55,150]},
  {n:'Ciudad del Reloj',      e:'🌃',s:88,l:58,h:[300,185,265,215,320,150,60,280]},
  {n:'Refugio Glacial',e:'🏔️',s:60,l:64,h:[200,210,190,225,180,240,170,255]},
  {n:'Villa Sakura',    e:'🌸',s:62,l:72,h:[330,300,280,150,170,45,310,200]},
  {n:'Puerto del Volcán',   e:'🌋',s:55,l:48,h:[25,35,45,200,215,260,22,165]},
  {n:'Ciudad Celeste',          e:'🌌',s:70,l:58,h:[265,250,230,285,310,195,175,330]},
  {n:'Castillo Dorado',  e:'🏰',s:72,l:60,h:[45,50,40,210,160,280,35,200]},
];
ZONES.forEach(z=>{ if(z.h){ z.t1=`hsl(${z.h[0]} ${z.s}% ${Math.max(30,z.l-16)}% / .42)`; z.t2=`hsl(${z.h[1]} ${z.s}% ${Math.max(30,z.l-16)}% / .32)`; z.cc=`hsl(${z.h[0]} 80% 64%)`; } });
export const zoneIdx=l=>Math.min(9,Math.floor((l-1)/10)), zoneStep=l=>((l-1)%10)+1, zoneOf=l=>ZONES[zoneIdx(l)];
