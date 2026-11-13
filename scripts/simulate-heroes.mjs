/**
 * Simula partidas para comparar los poderes de los héroes y el revivir (modelo en src/game/balance.js).
 *   npm run simulate
 */
import { balanceReport, averageRuns, SKILLS, PATHS, MODEL } from '../src/game/balance.js';
import { FREE_UNDOS, JUTH_FREE_HINTS } from '../src/game/heroes.js';

const runs = Number(process.argv[2] || 400);
console.log(`Poderes: Lía 1 vida · Jean ${FREE_UNDOS} deshacer gratis por tablero · Juth ${JUTH_FREE_HINTS} pista gratis por tablero (modelo err=${MODEL.err}, ${runs} partidas por celda)\n`);
const names = { 1: 'Normal', 50: 'Difícil', 75: 'Experto' };
const rows = balanceReport({ runs });
console.log('camino   hab.  sin poder |  +Lía  +Jean  +Juth   (niveles extra frente a no tener poder)');
for (const r of rows) {
  console.log(`${names[r.start].padEnd(8)} ${r.skill.toFixed(2)}  ${r.base.toFixed(1).padStart(8)} | ${r.lia.toFixed(1).padStart(5)} ${r.jean.toFixed(1).padStart(6)} ${r.van.toFixed(1).padStart(6)}`);
}
const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
console.log(`\nMedia de niveles extra → Lía ${mean('lia').toFixed(2)} · Jean ${mean('jean').toFixed(2)} · Juth ${mean('van').toFixed(2)}`);
console.log('\nRevivir (comprar uno al empezar cada ciudad desde la 3ª, máx. 2): efecto en niveles y puntos');
for (const start of PATHS) for (const skill of SKILLS) {
  const a = averageRuns({ hero: 'none', start, skill, runs });
  const b = averageRuns({ hero: 'none', start, skill, runs, revive: 'city' });
  console.log(`${names[start].padEnd(8)} ${skill.toFixed(2)}  niveles ${a.cleared.toFixed(1)} → ${b.cleared.toFixed(1)}   puntos ${Math.round(a.score).toLocaleString('es')} → ${Math.round(b.score).toLocaleString('es')}`);
}
