/** Generador pseudoaleatorio determinista (mulberry32): misma semilla, misma secuencia. */
export function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mezcla de enteros a un hash de 32 bits sin signo (para derivar semillas). */
export function hash32(...parts) {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    h ^= p | 0;
    h = Math.imul(h, 16777619) >>> 0;
    h ^= h >>> 13;
  }
  return h >>> 0;
}
