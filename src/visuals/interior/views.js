// Camın ardındaki manzara: gökyüzü, deniz, kıyı ya da şehir. Ufuk göz hizasında.
// box: ekran koordinatında { x0, y0, x1, y1 }; çağıran taraf kırpar.

import { svgEl, rect, gradient, round, uniqueId } from '../svg.js';
import { createRng } from '../rng.js';

const between = (rng, min, max) => min + rng() * (max - min);

function sky(box, horizon, mood, defs) {
  const id = uniqueId('iv-sky');
  const stops = mood.sky.map((color, i) => [i / (mood.sky.length - 1), color]);
  defs.append(gradient('linearGradient', id, { x1: 0, y1: 0, x2: 0, y2: 1 }, stops));
  return rect(box.x0, box.y0, box.x1 - box.x0, horizon - box.y0, { fill: `url(#${id})` });
}

function sun(box, horizon, mood, defs) {
  if (!mood.sun) return [];
  const id = uniqueId('iv-sun');
  const x = box.x0 + (box.x1 - box.x0) * 0.66;
  const r = (box.x1 - box.x0) * 0.04;
  defs.append(gradient('radialGradient', id, {}, [[0, mood.sun, 0.7], [0.4, mood.sun, 0.18], [1, mood.sun, 0]]));
  return [
    svgEl('circle', { cx: round(x), cy: round(horizon - r * 0.4), r: round(r * 7), fill: `url(#${id})` }),
    svgEl('circle', { cx: round(x), cy: round(horizon - r * 0.4), r: round(r), fill: mood.sun }),
  ];
}

function clouds(box, horizon, mood, rng) {
  const width = box.x1 - box.x0;
  return Array.from({ length: 5 }, () =>
    svgEl('ellipse', {
      cx: round(box.x0 + rng() * width),
      cy: round(box.y0 + (horizon - box.y0) * between(rng, 0.35, 0.85)),
      rx: round(width * between(rng, 0.08, 0.2)),
      ry: round(Math.max(1, (horizon - box.y0) * between(rng, 0.01, 0.025))),
      fill: mood.cloud,
      opacity: round(between(rng, 0.25, 0.55)),
    }),
  );
}

function sea(box, horizon, mood, rng, defs) {
  const id = uniqueId('iv-sea');
  defs.append(gradient('linearGradient', id, { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, mood.seaTop], [1, mood.seaBottom]]));
  const width = box.x1 - box.x0;
  const depth = box.y1 - horizon;
  const shapes = [rect(box.x0, horizon, width, depth, { fill: `url(#${id})` })];
  const centre = box.x0 + width * (mood.sun ? 0.66 : 0.5);
  for (let i = 0; i < 60; i += 1) {
    const t = rng() ** 1.4;
    const spread = width * (mood.sun ? 0.05 : 0.4) * (1 + t * 2);
    const w = width * between(rng, 0.01, 0.05) * (1 + t);
    shapes.push(
      rect(centre + (rng() - 0.5) * spread * 2 - w / 2, horizon + depth * t, w, Math.max(0.6, depth * 0.006), {
        fill: mood.glitter,
        opacity: round(between(rng, 0.15, 0.55) * (1 - t * 0.6)),
      }),
    );
  }
  if (!mood.sun) {
    const x = box.x0 + width * between(rng, 0.15, 0.35);
    const size = depth * 0.08;
    shapes.push(svgEl('path', {
      d: `M${round(x)} ${round(horizon + depth * 0.12)}l${round(size * 0.45)} ${round(-size)}l0 ${round(size)}z`,
      fill: '#ffffff',
      opacity: 0.8,
    }));
  }
  return shapes;
}

function coast(box, horizon, mood, rng, side) {
  const width = box.x1 - box.x0;
  const reach = width * 0.42;
  const start = side === 'left' ? box.x0 : box.x1;
  const dir = side === 'left' ? 1 : -1;
  const rise = (horizon - box.y0) * 0.14;
  let d = `M${round(start)} ${round(horizon + (box.y1 - horizon) * 0.08)}`;
  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    d += ` L${round(start + dir * reach * t)} ${round(horizon - rise * (1 - t) * between(rng, 0.6, 1))}`;
  }
  d += ` L${round(start + dir * reach)} ${round(horizon + 1)} L${round(start)} ${round(horizon + 1)} Z`;
  const shapes = [svgEl('path', { d, fill: mood.coast, opacity: 0.85 })];
  if (mood.lights) {
    for (let i = 0; i < 26; i += 1) {
      const t = rng();
      shapes.push(rect(start + dir * reach * t, horizon - rise * (1 - t) * rng() * 0.8, 1.2, 1.2, { fill: mood.lights, opacity: 0.8 }));
    }
  }
  return shapes;
}

function city(box, horizon, mood, rng, defs) {
  const id = uniqueId('iv-city');
  defs.append(gradient('linearGradient', id, { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, mood.city], [1, mood.cityShade]]));
  const width = box.x1 - box.x0;
  const depth = box.y1 - horizon;
  const shapes = [rect(box.x0, horizon, width, depth, { fill: `url(#${id})` })];
  for (let row = 0; row < 7; row += 1) {
    const t = (row + 1) / 7;
    const y = horizon + depth * t ** 1.6;
    const size = depth * 0.05 * (1 + t * 3);
    for (let x = box.x0 - rng() * size; x < box.x1; x += size * between(rng, 1.1, 1.8)) {
      shapes.push(rect(x, y - size * 0.6, size, size * 0.6, { fill: mood.cityShade, opacity: round(0.25 + t * 0.4) }));
      if (mood.lights && rng() < 0.4) shapes.push(rect(x + size * 0.3, y - size * 0.4, 1.4, 1.4, { fill: mood.lights }));
    }
  }
  for (let i = 0; i < 6; i += 1) {
    const w = width * between(rng, 0.02, 0.05);
    const h = (horizon - box.y0) * between(rng, 0.05, 0.22);
    shapes.push(rect(box.x0 + rng() * width, horizon - h, w, h + 2, { fill: mood.cityShade, opacity: 0.75 }));
  }
  return shapes;
}

export function drawView(type, mood, box, horizon, { seed, coastSide = 'right' }) {
  const rng = createRng(`${seed}:view`);
  const defs = svgEl('defs');
  const group = svgEl('g', { class: 'interior-view' }, [defs]);
  group.append(sky(box, horizon, mood, defs), ...sun(box, horizon, mood, defs), ...clouds(box, horizon, mood, rng));
  if (type === 'city') group.append(...city(box, horizon, mood, rng, defs));
  else group.append(...sea(box, horizon, mood, rng, defs));
  if (type === 'coast') group.append(...coast(box, horizon, mood, rng, coastSide));
  return group;
}
