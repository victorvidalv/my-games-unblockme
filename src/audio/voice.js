import { muted } from './sound.js';
import { Music } from './music.js';
import { voicePath } from '../data/voices.js';

/**
 * Voz del héroe al llegar a una ciudad: reproduce public/voces/<héroe>-NN.m4a (si existe) y baja la música mientras habla.
 * No muestra ningún texto en pantalla. Respeta el botón de sonido; si falta el archivo, no pasa nada (sin voz y sin error).
 */
let current = null;

/** ¿Está hablando el héroe ahora mismo? (la música se mantiene baja mientras dura). */
export const voiceActive = () => !!current && !current.paused;

export function stopVoice() {
  if (current) { const a = current; current = null; a.pause(); a.dispatchEvent(new Event('voice-stop')); }
  Music.duck(1);
}

/** Reproduce la frase del héroe para la ciudad `city` (0-9). Devuelve true si llegó a sonar. */
export function playVoice(heroId, city) {
  stopVoice();
  if (muted) return Promise.resolve(false);
  return new Promise((resolve) => {
    const audio = new Audio(voicePath(heroId, city));
    current = audio;
    audio.volume = 0.95;
    const finish = (played) => { if (current === audio) { current = null; Music.duck(1); } resolve(played); };
    audio.addEventListener('playing', () => Music.duck(0.35), { once: true });
    audio.addEventListener('ended', () => finish(true), { once: true });
    audio.addEventListener('error', () => finish(false), { once: true });
    audio.addEventListener('voice-stop', () => resolve(false), { once: true });
    audio.play().catch(() => finish(false));
  });
}
