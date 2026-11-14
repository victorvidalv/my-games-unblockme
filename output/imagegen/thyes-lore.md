# Imágenes del mundo de Thyes (año 4133)

Cinco ilustraciones nuevas: el villano **Vhorn** y los cuatro pueblos antiguos (**Kogn**, **Sahrim**, **Ennari**, **Aluen**).
ChatGPT puede ver la carpeta del proyecto: que use como **referencia obligatoria de estilo** las ilustraciones que ya existen.

## Dónde mirar (referencias de estilo)

- Personajes (la referencia principal del dibujo): `public/heroes/jean.webp`, `public/heroes/lia.webp`, `public/heroes/van.webp`, `public/heroes/vendedor.webp`
- Escenas y ambientes: `public/backgrounds/zone-1.webp` … `zone-10.webp`, `public/backgrounds/dios-nordico-renacer.webp`, `public/backgrounds/guia-elfa-mapa.webp`
- Ejemplos de prompts ya usados con éxito: `output/imagegen/dios-nordico-renacer.md`, `output/imagegen/guia-elfa-mapa.md`

## Dónde dejar cada imagen

Carpeta nueva: **`public/lore/`** (créala si no existe). Un archivo por imagen, **WebP**, **640 × 960 px** (retrato 2:3), calidad ≈ 72, opaco y a sangre completa (sin bordes ni transparencia).

| Archivo | Quién |
|---|---|
| `public/lore/vhorn.webp` | Vhorn, el Apagador (el malo) |
| `public/lore/kogn.webp` | Los Kogn (Puerto de las Velas) |
| `public/lore/sahrim.webp` | Los Sahrim (Oasis Dorado) |
| `public/lore/ennari.webp` | Los Ennari (Aldea de Otoño) |
| `public/lore/aluen.webp` | Los Aluen (Ciudad Celeste) |

## Bloque común de estilo (pégalo en cada prompt)

STYLE: Image 1, 2 and 3 (jean.webp, lia.webp, van.webp) are the game's ORIGINAL HERO DRAWINGS and are the authoritative style references; vendedor.webp and the zone-N.webp backgrounds show the same style for secondary characters and scenery. Draw as if the same artist made the next characters of the same game: thick dark brown/black angular ink outlines, bold graphic anime/manga face construction, large sharply drawn expressive eyes, angular nose with only a few lines, stylized chunky hair locks, angular cloth folds, flat limited colors and hard-edged cel shadows, sparse hatching, distressed vintage paper print texture and rough ink edges. Simplify details to the same level as the original hero drawings. NOT realistic, NOT semi-realistic, NOT soft painterly, NOT intricate fine-line engraving, NOT glossy or 3D. Do not copy the hero identities, clothes or props literally.
COMPOSITION: Portrait 2:3, opaque full bleed, waist-to-knees three-quarter figure, face large enough to read like the original hero portraits, both hands inside the frame, readable backdrop on the sides. Single illustration. No text, no symbols resembling lettering, no logo, no watermark, no border, no UI.
WORLD: Thyes, a fantasy world with ten realms. Year 4133: the Beacon of Dawn (a great lighthouse) was put out by a shadow called Vhorn and the Long Night began. Warm, mysterious, storybook-adventure tone (not gore, not horror).

## 1 · Vhorn, el Apagador (villano) → `public/lore/vhorn.webp`

Primary request: The villain of the game. A tall, thin, NOT-gory figure made of living shadow and night sky, with a long tattered dark-indigo cloak that dissolves at the edges into drifting smoke and snuffed candle wicks. Face half-hidden under a hood with a pale narrow mask-like face, two small cold white glowing eyes, calm and patient expression (menacing but elegant, almost sad), no mouth detail. One long hand holds a giant brass snuffer (a candle-extinguisher cone) with a thread of grey smoke curling from it; the other hand is open, palm up, with a few tiny extinguished sparks falling. A broken crown of black glass shards hovers above the hood.
Backdrop: the top of a dark golden castle with a huge lighthouse lantern behind him, completely unlit, a starless deep indigo sky and slow ribbons of smoke. Color palette: indigo, charcoal, bone white, with only small touches of antique gold and a single red ember on the floor. He must look like a character of the same cast as the three heroes, drawn with the same thick ink and flat cel shading, and clearly the "bad one" without being scary for kids.

## 2 · Los Kogn, navegantes de las mareas → `public/lore/kogn.webp`

Primary request: An ancient Kogn sailor-elder of the tides, the people who moor their ships at the Puerto de las Velas every winter. Weathered but proud adult, broad shoulders, short braided hair with tiny shells and sea-glass beads, deep-teal and sand-colored layered wool coat with rope-knot embroidery and a fish-scale pattern at the shoulders, a spiral tattoo on the cheek (the spiral the Kogn carve on the stone bridges of Thyes). Holds a small lit lantern-candle in one hand and a coiled rope in the other; a tiny brass sextant at the belt. Calm, wise half-smile.
Backdrop: a quiet harbor at dusk with still sails, wooden quays, small candles burning on every pier and a motionless teal sea, in the same palette family as public/backgrounds/zone-2.webp (Puerto de las Velas).

## 3 · Los Sahrim, caravaneros del agua → `public/lore/sahrim.webp`

Primary request: A Sahrim caravan guide, the desert people who count wells like others count years. Lean adult, sun-bronzed skin, wrapped indigo-and-ochre headcloth with a face veil pulled down to the neck, kohl-lined eyes, layered light cloth with hanging copper water-flasks, tiny clay beads and a rope belt with knots (each knot is a well). Holds a long staff topped with a dowsing ring in one hand and a clay water jar with a single drop falling in the other. Patient, slightly amused expression.
Backdrop: golden dunes, a half-buried stone well rim and a fallen star glinting in the sand under a hot orange sky, same palette family as public/backgrounds/zone-3.webp (Oasis Dorado).

## 4 · Los Ennari, escribas de la corteza → `public/lore/ennari.webp`

Primary request: An Ennari bark-scribe, the forest people who write the names of their dead on tree bark. Slender adult, long silver-brown hair tied with leaves, skin with faint wood-grain freckles, an open autumn-colored robe with bark-plate shoulder guards and fallen golden leaves stitched into the hem. Holds a flat piece of birch bark with carved (but unreadable) marks in one hand and a carving stylus in the other; a few leaves float around him/her. Gentle, reflective, slightly worried expression (the names have been lost).
Backdrop: an autumn grove of golden and rust trees with carved altars among the roots, same palette family as public/backgrounds/zone-4.webp (Aldea de Otoño).

## 5 · Los Aluen, tejedores de puentes bajo las estrellas → `public/lore/aluen.webp`

Primary request: An Aluen star-weaver, the sky people who weave bridges of light between floating islands. Tall graceful adult with pale lilac-silver skin, long hair floating slightly upward as if in a weightless breeze, a deep-violet and starlight-blue layered robe sewn with small constellations (as simple dots joined by lines, no lettering) and thin feathered shoulder panels. Both hands hold a glowing thread of pale-gold light stretched between them like a loom string, with a small unfinished bridge-arch of light forming in front of them. Serene, hopeful smile.
Backdrop: floating castle islands with cut bridges over an abyss and a clear night sky full of stars, same palette family as public/backgrounds/zone-9.webp (Ciudad Celeste).

## Cómo entregar el resultado

1. Guarda cada imagen generada como WebP 640 × 960 (calidad ≈ 72) con el nombre exacto de la tabla, dentro de `public/lore/`.
2. No cambies nada más del proyecto.
3. Avisa cuando estén las cinco; después se enlazan en el juego (diálogo de viaje, pantalla de héroe, finales).
