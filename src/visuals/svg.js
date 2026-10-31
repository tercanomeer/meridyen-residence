// SVG düğümü üretme yardımcıları.

export const SVG_NS = 'http://www.w3.org/2000/svg';

export function svgEl(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([name, value]) => {
    if (value !== undefined && value !== null) node.setAttribute(name, String(value));
  });
  node.append(...children);
  return node;
}

export function round(value) {
  return Math.round(value * 100) / 100;
}

export function rect(x, y, w, h, attrs = {}) {
  return svgEl('rect', { x: round(x), y: round(y), width: round(w), height: round(h), ...attrs });
}

export function toPoints(points) {
  return points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
}

export function gradient(tag, id, attrs, stops) {
  return svgEl(
    tag,
    { id, ...attrs },
    stops.map(([offset, color, opacity = 1]) =>
      svgEl('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }),
    ),
  );
}

let counter = 0;

// Aynı sayfada birden çok sahne olabilir; defs kimlikleri çakışmasın.
export function uniqueId(prefix) {
  counter += 1;
  return `${prefix}-${counter}`;
}
