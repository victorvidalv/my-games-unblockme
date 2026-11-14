/* ============================ Zonas: una cada 10 niveles ============================
   Cambian los colores de las piezas y el fondo; la llave roja siempre se mantiene roja. */
export const ZONES=[
  {n:'Valle Esmeralda',  e:'🌿',s:52,l:52,h:[158,38,202,92,224,24,46,178]},
  {n:'Puerto de las Velas',     e:'⚓',s:56,l:53,h:[194,22,208,174,42,218,158,30]},
  {n:'Oasis Dorado',  e:'🏜️',s:60,l:53,h:[38,172,48,22,78,200,30,55]},
  {n:'Aldea de Otoño',  e:'🍂',s:56,l:50,h:[28,96,40,305,112,22,52,154]},
  {n:'Ciudad del Reloj',      e:'🌃',s:64,l:54,h:[295,188,262,212,322,155,46,278]},
  {n:'Refugio Glacial',e:'🏔️',s:54,l:60,h:[198,210,188,224,178,238,170,252]},
  {n:'Villa Sakura',    e:'🌸',s:56,l:64,h:[332,298,278,154,174,44,312,202]},
  {n:'Puerto del Volcán',   e:'🌋',s:54,l:48,h:[24,36,46,200,214,262,18,166]},
  {n:'Ciudad Celeste',          e:'🌌',s:60,l:56,h:[262,246,226,284,312,196,176,332]},
  {n:'Castillo Dorado',  e:'🏰',s:62,l:56,h:[44,52,38,210,162,276,34,198]},
];
ZONES.forEach(z=>{ if(z.h){ z.t1=`hsl(${z.h[0]} ${z.s}% ${Math.max(30,z.l-16)}% / .42)`; z.t2=`hsl(${z.h[1]} ${z.s}% ${Math.max(30,z.l-16)}% / .32)`; z.cc=`hsl(${z.h[0]} 80% 64%)`; } });
export const zoneIdx=l=>Math.min(9,Math.floor((l-1)/10)), zoneStep=l=>((l-1)%10)+1, zoneOf=l=>ZONES[zoneIdx(l)];
