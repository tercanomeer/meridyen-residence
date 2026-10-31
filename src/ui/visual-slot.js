// Görsel slotu: "svg:<ad>" → src/visuals üreticisi, diğer değerler → <img>.
// İki yol da { element, viewBox, hotspots } döndürür; görsel ile tıklama alanları aynı kutuya oturur.

import { renderVisual } from '../visuals/index.js';

const SVG_PREFIX = 'svg:';

export function isSvgSlot(slot) {
  return typeof slot === 'string' && slot.startsWith(SVG_PREFIX);
}

export function createVisual(slot, options = {}) {
  if (isSvgSlot(slot)) return renderVisual(slot.slice(SVG_PREFIX.length), options);

  const img = document.createElement('img');
  img.src = slot;
  img.alt = options.label ?? '';
  img.decoding = 'async';
  return {
    element: img,
    viewBox: options.imageSize ?? [1, 1],
    hotspots: options.hotspots ?? [],
  };
}
