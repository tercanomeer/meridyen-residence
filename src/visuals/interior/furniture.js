// Perspektif mobilya kutuları. Her kutu { x: [x0, x1], y: [y0, y1], z: [z0, z1], color }.
// Uzaktan yakına sıralanıp çizilir; görünen yüzler kameranın konumuna göre seçilir.

import { svgEl, round } from '../svg.js';
import { shade, lighten } from '../color.js';
import { FURNITURE } from '../materials.js';

const ACCENT = '#c9a45c';

function drawBox(cam, { x: [x0, x1], y: [y0, y1], z: [z0, z1], color, opacity }) {
  const faces = [];
  if (y1 < cam.eye) faces.push([[[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], lighten(color, 0.12)]);
  if (y0 > cam.eye) faces.push([[[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], shade(color, 0.22)]);
  if (x0 > 0) faces.push([[[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], shade(color, 0.2)]);
  if (x1 < 0) faces.push([[[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], shade(color, 0.2)]);
  faces.push([[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], shade(color, 0.06)]);
  return svgEl('g', opacity ? { opacity } : {}, faces.map(([points, fill]) => svgEl('polygon', { points: cam.poly(points), fill })));
}

const box = (x, y, z, color, extra = {}) => ({ x, y, z, color, ...extra });

function wallPanel(cam, side, [z0, z1], [y0, y1], attrs) {
  const x = side === 'left' ? -cam.room.w / 2 + 0.01 : cam.room.w / 2 - 0.01;
  return svgEl('polygon', { points: cam.poly([[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]]), ...attrs });
}

function floorPatch(cam, [x0, x1], [z0, z1], attrs) {
  return svgEl('polygon', { points: cam.poly([[x0, 0.003, z0], [x1, 0.003, z0], [x1, 0.003, z1], [x0, 0.003, z1]]), ...attrs });
}

function glowDot(cam, x, y, z, radius, color) {
  const [px, py] = cam.project(x, y, z);
  return svgEl('circle', { cx: round(px), cy: round(py), r: round(cam.size(radius, z)), fill: color, opacity: 0.35 });
}

function plant(cam, x, z, mood) {
  const [px, py] = cam.project(x, 0.95, z);
  const r = cam.size(0.32, z);
  return svgEl('g', {}, [
    svgEl('circle', { cx: round(px - r * 0.4), cy: round(py + r * 0.2), r: round(r * 0.8), fill: shade(FURNITURE.plant, 0.15) }),
    svgEl('circle', { cx: round(px + r * 0.35), cy: round(py), r: round(r * 0.85), fill: FURNITURE.plant }),
    svgEl('circle', { cx: round(px), cy: round(py - r * 0.5), r: round(r * 0.7), fill: lighten(FURNITURE.plant, 0.12) }),
  ]);
}

function pendant(cam, x, z, length, mood) {
  const h = cam.room.h;
  const [ax, ay] = cam.project(x, h, z);
  const [bx, by] = cam.project(x, h - length, z);
  const r = cam.size(0.16, z);
  return svgEl('g', {}, [
    svgEl('line', { x1: round(ax), y1: round(ay), x2: round(bx), y2: round(by), stroke: '#2a2a2a', 'stroke-width': 1 }),
    svgEl('circle', { cx: round(bx), cy: round(by + r * 0.6), r: round(r * 3), fill: mood.glow, opacity: 0.25 }),
    svgEl('ellipse', { cx: round(bx), cy: round(by + r * 0.4), rx: round(r), ry: round(r * 0.55), fill: ACCENT }),
    svgEl('ellipse', { cx: round(bx), cy: round(by + r * 0.75), rx: round(r * 0.7), ry: round(r * 0.18), fill: mood.spot }),
  ]);
}

function living(cam, mood) {
  const { room: { w }, back, near } = cam;
  const L = -w / 2;
  const R = w / 2;
  const zf = (offset) => Math.max(near + 0.25, back - offset);
  return {
    flats: [
      wallPanel(cam, 'right', [zf(3.8), zf(2.5)], [1.2, 2.05], { fill: '#2f2a27' }),
      wallPanel(cam, 'right', [zf(3.72), zf(3.15)], [1.28, 1.97], { fill: ACCENT, opacity: 0.85 }),
      wallPanel(cam, 'right', [zf(3.1), zf(2.58)], [1.28, 1.97], { fill: '#e6dccb' }),
      floorPatch(cam, [L + 0.5, R - 1.2], [zf(3.6), zf(1.0)], { fill: FURNITURE.rug, opacity: 0.9 }),
    ],
    boxes: [
      box([L + 0.15, L + 1.05], [0, 0.42], [zf(3.4), zf(1.0)], FURNITURE.fabric),
      box([L + 0.15, L + 0.4], [0.42, 0.85], [zf(3.4), zf(1.0)], shade(FURNITURE.fabric, 0.05)),
      box([L + 0.15, L + 1.05], [0.42, 0.62], [zf(1.22), zf(1.0)], FURNITURE.fabric),
      box([L + 0.15, L + 1.05], [0.42, 0.62], [zf(3.4), zf(3.18)], FURNITURE.fabric),
      box([L + 0.45, L + 0.6], [0.42, 0.75], [zf(2.6), zf(2.2)], ACCENT),
      box([-0.35, 0.65], [0, 0.34], [zf(2.8), zf(2.05)], FURNITURE.walnut),
      box([-0.35, 0.65], [0.34, 0.38], [zf(2.8), zf(2.05)], FURNITURE.marble),
      box([R - 1.5, R - 0.7], [0, 0.42], [zf(2.6), zf(1.8)], lighten(FURNITURE.fabric, 0.2)),
      box([R - 0.95, R - 0.7], [0.42, 0.82], [zf(2.6), zf(1.8)], lighten(FURNITURE.fabric, 0.15)),
      box([R - 0.6, R - 0.2], [0, 0.45], [zf(0.65), zf(0.25)], FURNITURE.walnut),
      box([L + 0.38, L + 0.42], [0, 1.45], [zf(0.6), zf(0.56)], '#2a2a2a'),
    ],
    lights: [glowDot(cam, L + 0.4, 1.55, zf(0.58), 0.25, mood.glow)],
    after: [plant(cam, R - 0.4, zf(0.45), mood)],
  };
}

function dining(cam, mood) {
  const { room: { w }, back, near } = cam;
  const L = -w / 2;
  const zf = (offset) => Math.max(near + 0.25, back - offset);
  const boxes = [
    box([L, L + 0.45], [0, 0.8], [zf(3.4), zf(1.4)], FURNITURE.walnut),
    box([-0.95, 0.95], [0.72, 0.76], [zf(3.0), zf(2.0)], FURNITURE.walnut),
    ...[-0.85, 0.81].flatMap((x) => [box([x, x + 0.04], [0, 0.72], [zf(2.95), zf(2.91)], FURNITURE.walnut), box([x, x + 0.04], [0, 0.72], [zf(2.09), zf(2.05)], FURNITURE.walnut)]),
  ];
  [-0.6, 0, 0.6].forEach((x) => {
    boxes.push(box([x - 0.22, x + 0.22], [0, 0.46], [zf(3.55), zf(3.1)], FURNITURE.oak));
    boxes.push(box([x - 0.22, x + 0.22], [0.46, 0.95], [zf(3.55), zf(3.5)], FURNITURE.oak));
    boxes.push(box([x - 0.22, x + 0.22], [0, 0.46], [zf(1.9), zf(1.45)], FURNITURE.oak));
    boxes.push(box([x - 0.22, x + 0.22], [0.46, 0.95], [zf(1.5), zf(1.45)], FURNITURE.oak));
  });
  return {
    flats: [floorPatch(cam, [-1.5, 1.5], [zf(3.8), zf(1.2)], { fill: FURNITURE.rug, opacity: 0.85 })],
    boxes,
    lights: [],
    after: [pendant(cam, -0.4, zf(2.5), 1.1, mood), pendant(cam, 0.4, zf(2.5), 1.1, mood)],
  };
}

function kitchen(cam, mood) {
  const { room: { w }, back, near } = cam;
  const L = -w / 2;
  const zf = (offset) => Math.max(near + 0.25, back - offset);
  return {
    flats: [],
    boxes: [
      box([L, L + 0.62], [0, 0.9], [zf(4.2), zf(0.3)], FURNITURE.oak),
      box([L, L + 0.64], [0.9, 0.94], [zf(4.2), zf(0.3)], FURNITURE.marble),
      box([L, L + 0.36], [1.55, 2.35], [zf(4.2), zf(0.3)], lighten(FURNITURE.oak, 0.1)),
      box([-0.95, 0.95], [0, 0.9], [zf(3.0), zf(2.1)], FURNITURE.oak),
      box([-1.0, 1.0], [0.9, 0.95], [zf(3.05), zf(2.05)], FURNITURE.marble),
      ...[-0.6, 0, 0.6].map((x) => box([x - 0.19, x + 0.19], [0, 0.68], [zf(3.5), zf(3.15)], FURNITURE.walnut)),
    ],
    lights: [],
    after: [pendant(cam, -0.45, zf(2.55), 0.9, mood), pendant(cam, 0.45, zf(2.55), 0.9, mood)],
  };
}

function bedroom(cam, mood) {
  const { room: { w }, back, near } = cam;
  const L = -w / 2;
  const R = w / 2;
  const zf = (offset) => Math.max(near + 0.25, back - offset);
  return {
    flats: [floorPatch(cam, [R - 2.8, R - 0.3], [zf(3.9), zf(0.6)], { fill: FURNITURE.rug, opacity: 0.85 })],
    boxes: [
      box([R - 0.12, R], [0, 1.2], [zf(3.35), zf(1.05)], FURNITURE.walnut),
      box([R - 2.15, R - 0.12], [0, 0.32], [zf(3.2), zf(1.2)], FURNITURE.walnut),
      box([R - 2.1, R - 0.12], [0.32, 0.55], [zf(3.15), zf(1.25)], FURNITURE.linen),
      box([R - 2.15, R - 1.55], [0.55, 0.58], [zf(3.17), zf(1.23)], ACCENT),
      box([R - 0.6, R - 0.18], [0.55, 0.74], [zf(3.0), zf(2.25)], FURNITURE.ceramic),
      box([R - 0.6, R - 0.18], [0.55, 0.74], [zf(2.15), zf(1.4)], FURNITURE.ceramic),
      box([R - 0.55, R - 0.1], [0, 0.5], [zf(3.8), zf(3.38)], FURNITURE.oak),
      box([R - 0.55, R - 0.1], [0, 0.5], [zf(1.02), zf(0.6)], FURNITURE.oak),
      box([L, L + 0.6], [0, 2.3], [zf(3.1), zf(1.3)], FURNITURE.oak),
    ],
    lights: [glowDot(cam, R - 0.32, 0.8, zf(3.6), 0.08, mood.glow)],
    after: [],
  };
}

function bath(cam, mood) {
  const { room: { w }, back, near } = cam;
  const L = -w / 2;
  const R = w / 2;
  const zf = (offset) => Math.max(near + 0.25, back - offset);
  const [tx0, ty] = cam.project(-0.7, 0.58, zf(1.4));
  const [tx1] = cam.project(0.7, 0.58, zf(1.4));
  return {
    flats: [
      wallPanel(cam, 'left', [zf(3.3), zf(2.0)], [1.15, 2.05], { fill: '#c7d1d6', stroke: mood.frame, 'stroke-width': 1.5 }),
      wallPanel(cam, 'left', [zf(3.2), zf(2.6)], [1.25, 1.95], { fill: '#ffffff', opacity: 0.25 }),
      floorPatch(cam, [R - 1.0, R], [zf(3.2), zf(2.0)], { fill: shade(mood.stone, 0.08) }),
    ],
    boxes: [
      box([L, L + 0.55], [0.45, 0.85], [zf(3.4), zf(1.9)], FURNITURE.oak),
      box([L, L + 0.57], [0.85, 0.88], [zf(3.42), zf(1.88)], FURNITURE.marble),
      box([R - 1.05, R - 1.02], [0, 2.1], [zf(3.2), zf(2.0)], '#dfe9ee', { opacity: 0.35 }),
      box([-0.85, 0.85], [0, 0.58], [zf(1.5), zf(0.7)], FURNITURE.ceramic),
    ],
    lights: [],
    after: [svgEl('ellipse', { cx: round((tx0 + tx1) / 2), cy: round(ty + cam.size(0.25, zf(1.1)) * 0.2), rx: round((tx1 - tx0) / 2), ry: round(cam.size(0.3, zf(1.1)) * Math.min(0.5, (cam.eye - 0.58) / zf(1.1))), fill: '#cfd9dd' })],
  };
}

function terrace(cam, mood) {
  const { room: { w }, back, near } = cam;
  const R = w / 2;
  const zf = (offset) => Math.max(near + 0.25, back - offset);
  const planters = [];
  for (let z = zf(0.6); z > near + 0.5; z -= 1.2) planters.push(plant(cam, R - 0.25, z, mood));
  return {
    flats: [],
    boxes: [
      box([R - 0.5, R], [0, 0.55], [near + 0.2, zf(0.2)], FURNITURE.oak),
      ...[-1.4, -0.35].flatMap((x) => [
        box([x, x + 0.7], [0.1, 0.3], [zf(2.6), zf(0.8)], FURNITURE.fabric),
        box([x, x + 0.7], [0.3, 0.7], [zf(2.6), zf(2.3)], lighten(FURNITURE.fabric, 0.1)),
      ]),
      box([0.55, 0.95], [0, 0.42], [zf(1.9), zf(1.5)], FURNITURE.walnut),
    ],
    lights: [],
    after: planters,
  };
}

const LAYOUTS = { living, dining, kitchen, bedroom, bath, terrace };

// Gölgeler, düz yüzeyler (halı, duvar panoları), kutular (uzaktan yakına) ve ışıklar.
export function drawFurniture(cam, kind, mood, shadowFilter) {
  const layout = (LAYOUTS[kind] ?? living)(cam, mood);
  const sorted = [...layout.boxes].sort((a, b) => b.z[0] - a.z[0]);
  const shadows = svgEl('g', { filter: `url(#${shadowFilter})`, fill: '#000', 'fill-opacity': 0.22 },
    layout.boxes
      .filter((item) => item.y[0] < 0.2)
      .map((item) => floorPatch(cam, [item.x[0] - 0.05, item.x[1] + 0.12], [item.z[0] - 0.05, item.z[1] + 0.12], {})));
  return svgEl('g', { class: 'interior-furniture' }, [
    ...layout.flats,
    shadows,
    ...sorted.map((item) => drawBox(cam, item)),
    ...layout.lights,
    ...layout.after,
  ]);
}
