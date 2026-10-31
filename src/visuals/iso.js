// İzometrik izdüşüm. Dünya: x → doğu, y → güney, z → yukarı (metre).
// Bakış güneydoğudan: kutuların üst, güney ve doğu yüzleri görünür.

import { svgEl, toPoints } from './svg.js';

const COS30 = Math.cos(Math.PI / 6);

function raw(x, y, z) {
  return [(x - y) * COS30, (x + y) * 0.5 - z];
}

// Verilen 3B sınırları kutuya ortalayarak sığdıran izdüşüm.
export function createIsoView({ minX, maxX, minY, maxY, minZ = 0, maxZ = 0 }, { width, height, padding = 24 }) {
  const xs = [];
  const ys = [];
  [minX, maxX].forEach((x) =>
    [minY, maxY].forEach((y) =>
      [minZ, maxZ].forEach((z) => {
        const [sx, sy] = raw(x, y, z);
        xs.push(sx);
        ys.push(sy);
      }),
    ),
  );
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const scale = Math.max(1, Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY));
  const offsetX = (width - spanX * scale) / 2 - Math.min(...xs) * scale;
  const offsetY = (height - spanY * scale) / 2 - Math.min(...ys) * scale;

  return {
    scale,
    project(x, y, z = 0) {
      const [sx, sy] = raw(x, y, z);
      return [offsetX + sx * scale, offsetY + sy * scale];
    },
  };
}

export function floorPolygon(view, [x, y, w, d], z = 0) {
  const p = view.project;
  return [p(x, y, z), p(x + w, y, z), p(x + w, y + d, z), p(x, y + d, z)];
}

// Kutunun ekrandaki dış çizgisi (üst + güney + doğu yüzleri).
export function boxSilhouette(view, [x, y, w, d], z0, z1) {
  const p = view.project;
  return [p(x, y, z1), p(x + w, y, z1), p(x + w, y, z0), p(x + w, y + d, z0), p(x, y + d, z0), p(x, y + d, z1)];
}

// Ressam sıralaması: güneydoğu köşesi büyük olan sonra çizilir.
export function depthKey([x, y, w, d]) {
  return x + w + y + d;
}

export function shade(hex, amount) {
  const value = parseInt(hex.slice(1), 16);
  const channel = (shift) => Math.round(((value >> shift) & 255) * (1 - amount));
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, '0')).join('')}`;
}

export function drawBox(view, rect, z0, z1, color, attrs = {}) {
  const [x, y, w, d] = rect;
  const p = view.project;
  const faces = [
    [[p(x, y + d, z0), p(x + w, y + d, z0), p(x + w, y + d, z1), p(x, y + d, z1)], shade(color, 0.16)],
    [[p(x + w, y, z0), p(x + w, y + d, z0), p(x + w, y + d, z1), p(x + w, y, z1)], shade(color, 0.32)],
    [floorPolygon(view, rect, z1), color],
  ];
  return svgEl(
    'g',
    attrs,
    faces.map(([points, fill]) => svgEl('polygon', { points: toPoints(points), fill })),
  );
}
