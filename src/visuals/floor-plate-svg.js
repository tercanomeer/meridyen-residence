// "svg:floor-plate" üreticisi: kat plakasının izometrik görünümü.
// Ortada çekirdek, kat holü; daireler durumlarına göre renkli alçak kütleler. Deniz güney kenarında.

import { svgEl, toPoints, round } from './svg.js';
import { createIsoView, boxSilhouette, depthKey, drawBox, floorPolygon } from './iso.js';
import { STATUS_TONES, SURFACES } from './materials.js';

const SLAB = 0.6;
const CORE_HEIGHT = 2.6;
const UNIT_HEIGHT = 1.1;
const TERRACE_HEIGHT = 0.35;
const LOBBY_HEIGHT = 0.06;

// units: [{ id, status, rects: [{ rect: [x, y, w, d], low }] }] — plaka koordinatında, metre.
export function floorPlateSvg({ width, height, plate, core, lobby = [], units, labels = {}, label = '' }) {
  const [plateW, plateD] = plate;
  const view = createIsoView(
    { minX: 0, maxX: plateW, minY: 0, maxY: plateD + 4, minZ: -SLAB, maxZ: CORE_HEIGHT },
    { width, height, padding: Math.max(16, Math.min(width, height) * 0.05) },
  );

  const solids = [
    { rect: core, z1: CORE_HEIGHT, color: SURFACES.core },
    ...lobby.map((rect) => ({ rect, z1: LOBBY_HEIGHT, color: SURFACES.lobby })),
    ...units.flatMap((unit) =>
      unit.rects.map(({ rect, low }) => ({
        rect,
        z1: low ? TERRACE_HEIGHT : UNIT_HEIGHT,
        color: STATUS_TONES[unit.status] ?? STATUS_TONES.sold,
        unit,
      })),
    ),
  ].sort((a, b) => depthKey(a.rect) - depthKey(b.rect));

  const blocks = svgEl('g', { class: 'plate-blocks' });
  solids.forEach(({ rect, z1, color, unit }) => {
    blocks.append(
      drawBox(view, rect, 0, z1, color, unit ? { class: 'plate-unit', 'data-status': unit.status } : { class: 'plate-core' }),
    );
  });

  const ids = svgEl('g', { class: 'plate-ids' });
  units.forEach((unit) => {
    const main = unit.rects.filter((part) => !part.low).sort((a, b) => b.rect[2] * b.rect[3] - a.rect[2] * a.rect[3])[0];
    if (!main) return;
    const [x, y, w, d] = main.rect;
    const [cx, cy] = view.project(x + w / 2, y + d / 2, UNIT_HEIGHT);
    ids.append(
      svgEl('text', {
        x: round(cx),
        y: round(cy),
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        class: 'plate-id',
        'data-status': unit.status,
        'font-size': round(Math.max(10, view.scale * 0.95)),
      }, [unit.id]),
    );
  });

  const element = svgEl(
    'svg',
    { class: 'plate-scene', viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': label },
    [
      drawBox(view, [0, 0, plateW, plateD], -SLAB, 0, SURFACES.slab),
      svgEl('polyline', {
        points: toPoints([view.project(0, plateD, 0), view.project(plateW, plateD, 0), view.project(plateW, 0, 0)]),
        fill: 'none',
        stroke: SURFACES.gold,
        'stroke-opacity': 0.55,
        'stroke-width': 1,
      }),
      blocks,
      ids,
      seaMark(view, plateW, plateD, labels.sea),
    ],
  );

  const toUnit = (points) => points.map(([px, py]) => [px / width, py / height]);
  const hotspots = units.map((unit) => ({
    id: unit.id,
    points: unit.rects.map(({ rect, low }) => toUnit(boxSilhouette(view, rect, 0, low ? TERRACE_HEIGHT : UNIT_HEIGHT))),
  }));

  return { element, viewBox: [width, height], hotspots };
}

// Güney kenarının önünde dalga çizgileri ve "Deniz" yazısı.
function seaMark(view, plateW, plateD, text) {
  const group = svgEl('g', { class: 'plate-sea' });
  [1.4, 2.2, 3].forEach((offset, i) => {
    const inset = plateW * (0.18 + i * 0.08);
    group.append(
      svgEl('polyline', {
        points: toPoints(
          floorPolygon(view, [inset, plateD + offset, plateW - inset * 2, 0], -SLAB).slice(0, 2),
        ),
        class: 'plate-wave',
      }),
    );
  });
  if (text) {
    const [x, y] = view.project(plateW / 2, plateD + 3.8, -SLAB);
    group.append(svgEl('text', { x: round(x), y: round(y), 'text-anchor': 'middle', class: 'plate-sea-label' }, [text]));
  }
  return group;
}
