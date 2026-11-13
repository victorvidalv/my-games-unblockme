/**
 * Punto de entrada: carga los estilos, conecta los módulos y abre el menú.
 * La lógica pura (tableros, solver, dificultad, puntaje) vive en src/engine y src/game/heroes.js;
 * el resto son módulos de interfaz que se comunican mediante el estado compartido de src/state.js.
 */
import './styles/01-base.css';
import './styles/02-hud.css';
import './styles/03-board.css';
import './styles/04-buttons-modals.css';
import './styles/05-layout.css';
import './styles/06-effects.css';
import './styles/07-menu-paths.css';
import './styles/08-pause-dialogs.css';
import './styles/09-map-journey.css';
import './styles/10-compact-screens.css';
import './styles/11-bonus.css';
import './styles/12-journal-art.css';
import './styles/13-route-hero.css';
import './styles/14-ink-theme.css';
import './styles/15-cover.css';
import './styles/16-result.css';
import './styles/17-shop.css';
import './styles/18-turns.css';
import './styles/19-specials.css';
import { hooks } from './audio/sound.js';
import { saveRun } from './game/session.js';
import { S, persist, store } from './state.js';
import { fitBoard } from './ui/board.js';
import { syncHero } from './ui/heroes.js';
import { openMenu } from './ui/menu.js';
import './ui/controls.js';
import './pwa.js';

hooks.onSuspend = () => (S.run ? saveRun() : persist());
syncHero(store.run?.hero || store.heroChoice || 'lia');
fitBoard();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBoard);
openMenu();
