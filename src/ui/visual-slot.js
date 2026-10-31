// Görsel slotu: "svg:<ad>" → src/visuals üreticisi, diğer değerler → <img>.

import { renderVisual } from '../visuals/index.js';

const SVG_PREFIX = 'svg:';

export function isSvgSlot(slot) {
  return typeof slot === 'string' && slot.startsWith(SVG_PREFIX);
}

export function createVisual(slot, { alt = '', ...options } = {}) {
  if (isSvgSlot(slot)) return renderVisual(slot.slice(SVG_PREFIX.length), options);

  const img = document.createElement('img');
  img.src = slot;
  img.alt = alt;
  img.decoding = 'async';
  return img;
}
