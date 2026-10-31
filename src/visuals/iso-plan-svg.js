// "svg:unit-plan" üreticisi: daire tipinin izometrik planı, oda dikdörtgenlerinden.
// Zemin malzemeleri, alçak kesit duvarlar, cam cephe, gölgeli mobilya kutuları; her oda bir tıklama alanı.

import { svgEl, toPoints, round, uniqueId } from './svg.js';
import { createIsoView, depthKey, drawBox, floorPolygon, shade } from './iso.js';
import { FLOORS, FLOOR_BY_KIND, SURFACES } from './materials.js';
import { deriveWalls, WALL } from './plan/walls.js';
import { furnishRoom } from './plan/furniture.js';

const SLAB = 0.35;
const TEXTURE = {
  wood: { step: 0.42, opacity: 0.14, grid: false },
  stone: { step: 0.6, opacity: 0.1, grid: true },
  deck: { step: 0.16, opacity: 0.22, grid: false },
};

function floorTexture(view, [x, y, w, d], material) {
  const { step, opacity, grid } = TEXTURE[material];
  const segments = [];
  for (let yy = y + step; yy < y + d - 0.01; yy += step) segments.push([view.project(x, yy), view.project(x + w, yy)]);
  if (grid) for (let xx = x + step; xx < x + w - 0.01; xx += step) segments.push([view.project(xx, y), view.project(xx, y + d)]);
  const d3 = segments.map(([[x1, y1], [x2, y2]]) => `M${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}`).join('');
  return svgEl('path', { d: d3, stroke: shade(FLOORS[material], 0.45), 'stroke-opacity': opacity, 'stroke-width': 0.6, fill: 'none' });
}

function drawGlass(view, { rect, height, segment }) {
  const [x, y, w, d] = rect;
  const p = view.project;
  const faces = [
    [p(x, y + d, 0), p(x + w, y + d, 0), p(x + w, y + d, height), p(x, y + d, height)],
    [p(x + w, y, 0), p(x + w, y + d, 0), p(x + w, y + d, height), p(x + w, y, height)],
    floorPolygon(view, rect, height),
  ];
  const group = svgEl('g', { class: 'plan-glass' }, faces.map((points) =>
    svgEl('polygon', { points: toPoints(points), fill: SURFACES.glass, 'fill-opacity': 0.24 }),
  ));
  const mullions = [];
  const length = segment.q - segment.p;
  const count = Math.max(1, Math.round(length / 1.5));
  for (let i = 0; i <= count; i += 1) {
    const t = segment.p + (length * i) / count;
    const [ax, ay] = segment.axis === 'h' ? [t, segment.c] : [segment.c, t];
    mullions.push([p(ax, ay, 0), p(ax, ay, height)]);
  }
  const top = segment.axis === 'h'
    ? [p(segment.p, segment.c, height), p(segment.q, segment.c, height)]
    : [p(segment.c, segment.p, height), p(segment.c, segment.q, height)];
  mullions.push(top);
  group.append(svgEl('path', {
    d: mullions.map(([[x1, y1], [x2, y2]]) => `M${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}`).join(''),
    stroke: SURFACES.glassEdge,
    'stroke-opacity': 0.75,
    'stroke-width': 1,
  }));
  return group;
}

export function isoPlanSvg({ width, height, size, footprint, rooms, facades = [], labels = {}, label = '' }) {
  const [planW, planD] = size;
  const hasSea = facades.includes('south') && labels.sea;
  const view = createIsoView(
    { minX: -0.4, maxX: planW + 0.4, minY: -0.4, maxY: planD + (hasSea ? 2.8 : 0.4), minZ: -SLAB, maxZ: WALL.height },
    { width, height, padding: Math.max(16, Math.min(width, height) * 0.05) },
  );
  const ids = { shadow: uniqueId('plan-shadow'), clip: uniqueId('plan-clip') };
  const { walls, glass, thresholds, windows } = deriveWalls(rooms, size, facades);

  const solids = [
    ...walls.map(({ rect }) => ({ rect, parts: [{ rect, z0: 0, z1: WALL.height, tone: SURFACES.wallCut }] })),
    ...glass.map((pane) => ({ rect: pane.rect, glass: pane })),
    ...rooms.flatMap((room, index) => furnishRoom(room, windows[index])),
  ].sort((a, b) => depthKey(a.rect) - depthKey(b.rect));

  const slab = [...footprint]
    .sort((a, b) => depthKey(a) - depthKey(b))
    .map((rect) => drawBox(view, rect, -SLAB, 0, SURFACES.slab));

  const floors = svgEl('g', { class: 'plan-floors' });
  rooms.forEach((room) => {
    const material = FLOOR_BY_KIND[room.kind] ?? 'wood';
    floors.append(
      svgEl('polygon', { points: toPoints(floorPolygon(view, room.rect)), fill: FLOORS[material] }),
      floorTexture(view, room.rect, material),
    );
  });
  thresholds.forEach((rect) => {
    floors.append(svgEl('polygon', { points: toPoints(floorPolygon(view, rect, 0.01)), fill: SURFACES.gold }));
  });

  const shadows = svgEl('g', { 'clip-path': `url(#${ids.clip})` }, [
    svgEl('g', { filter: `url(#${ids.shadow})`, fill: SURFACES.shadow, 'fill-opacity': 0.3 },
      solids
        .filter((solid) => !solid.glass)
        .map((solid) => {
          const z1 = Math.max(...solid.parts.map((part) => part.z1));
          const offset = z1 * 0.32;
          const [x, y, w, d] = solid.rect;
          return z1 < 0.2 ? null : svgEl('polygon', { points: toPoints(floorPolygon(view, [x + offset, y + offset, w, d], 0.002)) });
        })
        .filter(Boolean)),
  ]);

  const objects = svgEl('g', { class: 'plan-objects' });
  solids.forEach((solid) => {
    if (solid.glass) objects.append(drawGlass(view, solid.glass));
    else solid.parts.forEach((part) => objects.append(drawBox(view, part.rect, part.z0, part.z1, part.tone)));
  });

  const element = svgEl(
    'svg',
    { class: 'plan-scene', viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': label },
    [
      svgEl('defs', {}, [
        svgEl('filter', { id: ids.shadow, x: '-20%', y: '-20%', width: '140%', height: '140%' }, [
          svgEl('feGaussianBlur', { stdDeviation: round(Math.max(1, view.scale * 0.14)) }),
        ]),
        svgEl('clipPath', { id: ids.clip }, footprint.map((rect) => svgEl('polygon', { points: toPoints(floorPolygon(view, rect)) }))),
      ]),
      ...slab,
      floors,
      shadows,
      objects,
    ],
  );

  if (hasSea) {
    const [x, y] = view.project(planW / 2, planD + 2.4, -SLAB);
    element.append(svgEl('text', { x: round(x), y: round(y), 'text-anchor': 'middle', class: 'plan-sea-label' }, [labels.sea]));
  }

  const toUnit = (points) => points.map(([px, py]) => [px / width, py / height]);
  const hotspots = rooms.map((room) => ({ id: room.id, points: toUnit(floorPolygon(view, room.rect)) }));
  return { element, viewBox: [width, height], hotspots };
}
