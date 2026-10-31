// "svg:<ad>" görsellerinin üretici kaydı.
// Üretici { element, viewBox: [w, h], hotspots: [{ id, points, outline? }] } döndürür; noktalar 0–1.
// points tek çokgen ([[x, y], …]) ya da çokgen listesi olabilir.

import { towerSvg } from './tower-svg.js';
import { floorPlateSvg } from './floor-plate-svg.js';
import { isoPlanSvg } from './iso-plan-svg.js';
import { interiorSvg } from './interior-svg.js';

const ROOM_KINDS = ['living', 'dining', 'kitchen', 'bedroom', 'bath', 'terrace'];

const generators = new Map([
  ['tower', towerSvg],
  ['floor-plate', floorPlateSvg],
  ['unit-plan', isoPlanSvg],
  ...ROOM_KINDS.map((kind) => [`room-${kind}`, (options) => interiorSvg({ ...options, kind })]),
]);

export function registerVisual(name, generator) {
  generators.set(name, generator);
}

export function renderVisual(name, options = {}) {
  const generator = generators.get(name);
  if (!generator) throw new Error(`unknown visual: svg:${name}`);
  return generator(options);
}
