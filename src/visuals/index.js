// "svg:<ad>" görsellerinin üretici kaydı.
// Üretici { element, viewBox: [w, h], hotspots: [{ id, points, outline? }] } döndürür; noktalar 0–1.

import { towerSvg } from './tower-svg.js';

const generators = new Map([['tower', towerSvg]]);

export function registerVisual(name, generator) {
  generators.set(name, generator);
}

export function renderVisual(name, options = {}) {
  const generator = generators.get(name);
  if (!generator) throw new Error(`unknown visual: svg:${name}`);
  return generator(options);
}
