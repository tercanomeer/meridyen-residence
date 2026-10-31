// "svg:room-<tür>" üreticisi: tek kaçış noktalı perspektif iç mekân.
// Arka duvarda yere kadar cam ve pencerenin baktığı manzara, tavanda spotlar; penthouse gün batımı tonlarında.
// focus: yavaş yakınlaşmanın merkezi (kaçış noktası).

import { svgEl, gradient, rect, round, uniqueId } from './svg.js';
import { createCamera } from './interior/camera.js';
import { MOODS } from './interior/moods.js';
import { drawShell } from './interior/shell.js';
import { drawFurniture } from './interior/furniture.js';

export function interiorSvg({
  width,
  height,
  kind = 'living',
  view = 'sea',
  mood: moodName = 'day',
  size = [5, 5],
  ceiling = 2.9,
  coastSide = 'right',
  seed = 'room',
  label = '',
}) {
  const mood = MOODS[moodName] ?? MOODS.day;
  const cam = createCamera({ width, height, room: { w: size[0], d: size[1], h: ceiling } });
  const ids = { shadow: uniqueId('iv-shadow'), warm: uniqueId('iv-warm'), vignette: uniqueId('iv-vignette') };

  const element = svgEl(
    'svg',
    { class: 'interior-scene', viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'xMidYMid slice', role: 'img', 'aria-label': label },
    [
      svgEl('defs', {}, [
        svgEl('filter', { id: ids.shadow, x: '-20%', y: '-20%', width: '140%', height: '140%' }, [
          svgEl('feGaussianBlur', { stdDeviation: round(Math.max(1.5, cam.size(0.08, cam.back))) }),
        ]),
        gradient('radialGradient', ids.warm, { cx: round(cam.cx / width), cy: round(cam.cy / height), r: 0.8 }, [
          [0, mood.glow, mood.warmth],
          [1, mood.glow, 0],
        ]),
        gradient('radialGradient', ids.vignette, { r: 0.75 }, [
          [0.55, '#050b16', 0],
          [1, '#050b16', 0.45],
        ]),
      ]),
      drawShell(cam, { kind, view, mood, seed, coastSide }),
      drawFurniture(cam, kind, mood, ids.shadow),
      rect(0, 0, width, height, { fill: `url(#${ids.warm})`, 'pointer-events': 'none' }),
      rect(0, 0, width, height, { fill: `url(#${ids.vignette})`, 'pointer-events': 'none' }),
    ],
  );

  return { element, viewBox: [width, height], hotspots: [], focus: [cam.cx, cam.cy] };
}
