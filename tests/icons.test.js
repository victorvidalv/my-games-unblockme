import { describe, it, expect } from 'vitest';
import { icon, ICON_NAMES } from '../src/ui/icons.js';
import { SHOP_ITEMS } from '../src/game/shop.js';
import { MECHANICS } from '../src/game/mechanics.js';
import { HEROES } from '../src/game/heroes.js';

describe('iconos propios', () => {
  it('cada icono es un SVG 32×32 bien formado, con su clase y sin emojis', () => {
    for (const name of ICON_NAMES) {
      const svg = icon(name);
      expect(svg.startsWith('<svg'), name).toBe(true);
      expect(svg.endsWith('</svg>'), name).toBe(true);
      expect(svg).toContain('viewBox="0 0 32 32"');
      expect(svg).toContain(`ic-${name}`);
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).not.toContain('undefined');
      expect(/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(svg), `${name} no usa emojis`).toBe(false);
      // etiquetas abiertas y cerradas en equilibrio (g)
      expect((svg.match(/<g[ >]/g) || []).length).toBe((svg.match(/<\/g>/g) || []).length);
    }
  });
  it('un nombre desconocido no rompe nada (cadena vacía)', () => {
    expect(icon('no-existe')).toBe('');
  });
  it('todo lo que el juego muestra con icono lo tiene: tienda, piezas especiales, héroes, avisos y botones', () => {
    for (const i of SHOP_ITEMS) expect(ICON_NAMES, `tienda ${i.id}`).toContain(i.icon);
    for (const m of Object.values(MECHANICS)) expect(ICON_NAMES, `pieza ${m.id}`).toContain(m.icon);
    for (const h of HEROES) expect(ICON_NAMES, `héroe ${h.id}`).toContain(h.icon);
    for (const n of ['undo', 'hint', 'purse', 'crown', 'alert', 'crystal', 'trophy', 'medal', 'unlock']) expect(ICON_NAMES).toContain(n);
  });
  it('los iconos son todos distintos entre sí', () => {
    const bodies = ICON_NAMES.map((n) => icon(n).replace(`ic-${n}`, ''));
    expect(new Set(bodies).size).toBe(ICON_NAMES.length);
  });
});
