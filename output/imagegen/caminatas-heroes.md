# Caminatas de los héroes para el mapa

Cuadros generados con la herramienta de imágenes integrada, usando el retrato original de cada héroe como referencia directa. Fondo transparente real. Cada ciclo contiene ocho poses de caminata hacia la derecha; el mapa invierte la imagen al caminar hacia la izquierda.

| Archivo | Tamaño | Cuadros | Ciclo | Peso |
| --- | --- | --- | --- | --- |
| `public/heroes/jean-caminando.gif` | 72 × 96 px | 8 | 800 ms | 22 515 bytes |
| `public/heroes/lia-caminando.gif` | 72 × 96 px | 8 | 800 ms | 28 022 bytes |
| `public/heroes/van-caminando.gif` | 72 × 96 px | 8 | 800 ms | 27 482 bytes |

GIF en bucle con paleta común de 63 colores más transparencia, cuadros de 100 ms y limpieza entre cuadros para evitar rastros. Se incluyen `jean-mapa.png`, `lia-mapa.png` y `van-mapa.png` como versiones quietas de igual tamaño. Los originales de los cuadros se conservan en el historial de imágenes generadas.

`src/ui/map.js` muestra el GIF solo durante el desplazamiento entre ciudades, orienta el personaje en la dirección de la ruta y vuelve al PNG al llegar. Si se prefiere movimiento reducido, usa únicamente el PNG. Los GIF se incluyen en la caché sin conexión.

Comprobación: formato, transparencia, ocho cuadros distintos, duración, bucle y revisión visual de la tira de cuadros en `output/imagegen/caminatas-preview.png`.

## Prompt jean

Use case: stylized-concept.
Asset type: a production 8-frame WALK CYCLE SPRITE SHEET, a tiny transparent animated map token, for an existing fantasy game.
Input image 1: exact original hero character identity and authoritative illustration style reference. Preserve this specific character's hair colors, skin tone, recognizable clothing and signature accessories.
Primary request: Draw the SAME CHARACTER eight times in EIGHT CONSECUTIVE WALKING POSES, for a perfectly looping WALK-IN-PLACE animation facing RIGHT. All eight poses must be different actual stages of a natural alternating-leg walk cycle, with opposing arm swing, slightly swinging clothing, planted foot and lifted passing foot. Walking forward, NOT running, NOT jumping, NOT standing static. Body remains in place; feet alternate forward/back. Head stays stable, very subtle vertical motion.
MANDATORY LAYOUT: LANDSCAPE canvas with exactly FOUR EQUAL COLUMNS and TWO EQUAL ROWS = 8 independent sprite cells, row-major frame order. Prefer canvas 1536x768, each cell384x384. Each cell holds exactly ONE FULL BODY of the SAME character. All figures same scale, same facing RIGHT view (side / slight three-quarter profile), same centered pelvis x-coordinate, same feet baseline. Leave at least 12% empty transparent margin in every cell. Every whole figure from hair/hat to shoes fully inside its own cell, never overlapping another cell. No cell borders, no labels or numbers.
Frames, read left to right top row then bottom row:
1 right leg forward contact / left leg back.
2 recoil/down with bent supporting right knee.
3 passing, left foot lifts under the body.
4 up, left leg advancing and right heel lifting.
5 left leg forward contact / right leg back.
6 recoil/down with bent supporting left knee.
7 passing, right foot lifts under the body.
8 up, right leg advancing returning smoothly into frame 1.
Drawing: simplified mini version of the original full-body hero, approximately 3 heads tall for clear map readability, bold angular dark ink contours, expressive original anime-style face, flat cel colors, no micro-details and almost no grain at this tiny size. Match original thick-line fantasy print drawing, not pixel art, not 3D or realistic. Keep outfit colors consistent across all eight cells. Hands simple but anatomical, two legs, two arms in every pose. No props held in hands that prevent walking.
TRANSPARENCY CRITICAL: actual transparent alpha background everywhere outside each figure. NO floor, scene, painted background, checkerboard, halo, drop shadow, cast shadow, ground circle or glow. No text, watermark, logo, panel borders or registration marks. ONE CHARACTER only, repeated as 8 animation frames.
Character JEAN: young adult male, fair warm skin, tousled dark-black hair with a very distinctive broad BLOND FORELOCK, original navy long travelling coat with ochre gold edges and simple clock emblem on shoulder, cream rolled sleeves, dark scarf, dark trousers, practical brown boots and dark fingerless gloves. Pocketwatch tucked in pocket, small brass chain at waist. Keep his youthful sharp face, clean-shaven. Coat tails swing gently with his measured walk. No backpack, no hat, no oversized weapon.

## Prompt lia

Use case: stylized-concept.
Asset type: a production 8-frame WALK CYCLE SPRITE SHEET, a tiny transparent animated map token, for an existing fantasy game.
Input image 1: exact original hero character identity and authoritative illustration style reference. Preserve this specific character's hair colors, skin tone, recognizable clothing and signature accessories.
Primary request: Draw the SAME CHARACTER eight times in EIGHT CONSECUTIVE WALKING POSES, for a perfectly looping WALK-IN-PLACE animation facing RIGHT. All eight poses must be different actual stages of a natural alternating-leg walk cycle, with opposing arm swing, slightly swinging clothing, planted foot and lifted passing foot. Walking forward, NOT running, NOT jumping, NOT standing static. Body remains in place; feet alternate forward/back. Head stays stable, very subtle vertical motion.
MANDATORY LAYOUT: LANDSCAPE canvas with exactly FOUR EQUAL COLUMNS and TWO EQUAL ROWS = 8 independent sprite cells, row-major frame order. Prefer canvas 1536x768, each cell384x384. Each cell holds exactly ONE FULL BODY of the SAME character. All figures same scale, same facing RIGHT view (side / slight three-quarter profile), same centered pelvis x-coordinate, same feet baseline. Leave at least 12% empty transparent margin in every cell. Every whole figure from hair/hat to shoes fully inside its own cell, never overlapping another cell. No cell borders, no labels or numbers.
Frames, read left to right top row then bottom row:
1 right leg forward contact / left leg back.
2 recoil/down with bent supporting right knee.
3 passing, left foot lifts under the body.
4 up, left leg advancing and right heel lifting.
5 left leg forward contact / right leg back.
6 recoil/down with bent supporting left knee.
7 passing, right foot lifts under the body.
8 up, right leg advancing returning smoothly into frame 1.
Drawing: simplified mini version of the original full-body hero, approximately 3 heads tall for clear map readability, bold angular dark ink contours, expressive original anime-style face, flat cel colors, no micro-details and almost no grain at this tiny size. Match original thick-line fantasy print drawing, not pixel art, not 3D or realistic. Keep outfit colors consistent across all eight cells. Hands simple but anatomical, two legs, two arms in every pose. No props held in hands that prevent walking.
TRANSPARENCY CRITICAL: actual transparent alpha background everywhere outside each figure. NO floor, scene, painted background, checkerboard, halo, drop shadow, cast shadow, ground circle or glow. No text, watermark, logo, panel borders or registration marks. ONE CHARACTER only, repeated as 8 animation frames.
Character LÍA: young adult female adventurer, fair warm freckled skin, short messy dark purple-auburn hair with the distinctive GOLDEN FORELOCK, worn dark TEAL adventurer cap with gold compass badge and red key motif, teal PATCHED cape, cream rolled sleeves, rust-red scarf, brown trousers, dark brown boots, fingerless gloves and small gold hoop earring. Brown backpack with a rolled tan blanket must stay on her back in every frame. Keep her confident original warm face. Cap and backpack remain consistent. Cape swings slightly as she walks.

## Prompt van

Use case: stylized-concept.
Asset type: a production 8-frame WALK CYCLE SPRITE SHEET, a tiny transparent animated map token, for an existing fantasy game.
Input image 1: exact original hero character identity and authoritative illustration style reference. Preserve this specific character's hair colors, skin tone, recognizable clothing and signature accessories.
Primary request: Draw the SAME CHARACTER eight times in EIGHT CONSECUTIVE WALKING POSES, for a perfectly looping WALK-IN-PLACE animation facing RIGHT. All eight poses must be different actual stages of a natural alternating-leg walk cycle, with opposing arm swing, slightly swinging clothing, planted foot and lifted passing foot. Walking forward, NOT running, NOT jumping, NOT standing static. Body remains in place; feet alternate forward/back. Head stays stable, very subtle vertical motion.
MANDATORY LAYOUT: LANDSCAPE canvas with exactly FOUR EQUAL COLUMNS and TWO EQUAL ROWS = 8 independent sprite cells, row-major frame order. Prefer canvas 1536x768, each cell384x384. Each cell holds exactly ONE FULL BODY of the SAME character. All figures same scale, same facing RIGHT view (side / slight three-quarter profile), same centered pelvis x-coordinate, same feet baseline. Leave at least 12% empty transparent margin in every cell. Every whole figure from hair/hat to shoes fully inside its own cell, never overlapping another cell. No cell borders, no labels or numbers.
Frames, read left to right top row then bottom row:
1 right leg forward contact / left leg back.
2 recoil/down with bent supporting right knee.
3 passing, left foot lifts under the body.
4 up, left leg advancing and right heel lifting.
5 left leg forward contact / right leg back.
6 recoil/down with bent supporting left knee.
7 passing, right foot lifts under the body.
8 up, right leg advancing returning smoothly into frame 1.
Drawing: simplified mini version of the original full-body hero, approximately 3 heads tall for clear map readability, bold angular dark ink contours, expressive original anime-style face, flat cel colors, no micro-details and almost no grain at this tiny size. Match original thick-line fantasy print drawing, not pixel art, not 3D or realistic. Keep outfit colors consistent across all eight cells. Hands simple but anatomical, two legs, two arms in every pose. No props held in hands that prevent walking.
TRANSPARENCY CRITICAL: actual transparent alpha background everywhere outside each figure. NO floor, scene, painted background, checkerboard, halo, drop shadow, cast shadow, ground circle or glow. No text, watermark, logo, panel borders or registration marks. ONE CHARACTER only, repeated as 8 animation frames.
Character VAN: young adult female scholar, warm medium-brown skin, long silver-lavender hair in a clearly visible thick BRAID, round GOLD SPECTACLES, geometric gold earrings, original plum-PURPLE robe/cloak with simple gold astronomy/star motifs, cream sleeves, dark trousers or modest divided travelling lower garment and practical shoes visible beneath the robe. A closed little spellbook strapped at the waist, hands free for walking. Preserve exact brown skin, braid and glasses in every frame; do not make her an elf. Braid swings slightly, long robe opens just enough to clearly show the alternating WALKING FEET.
