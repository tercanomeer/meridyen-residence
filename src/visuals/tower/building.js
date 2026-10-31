// Kulenin kendisi: ön ve yan cephe, cam bölmeler, yanan pencereler, teras korkulukları, taç.

import { svgEl, rect, gradient, toPoints, round } from '../svg.js';
import { createRng } from '../rng.js';
import { PALETTE } from './palette.js';
import { sidePoint } from './geometry.js';

const LIT_CHANCE = 0.4;
const SIDE_LIT_CHANCE = 0.3;
const PARAPET = 0.35;

export function buildingDefs(geo, ids) {
  const { x0, x1, dx, roofY, baseY, floorH } = geo;
  return [
    gradient('linearGradient', ids.glass, { x1: 0, y1: round(roofY), x2: 0, y2: round(baseY), gradientUnits: 'userSpaceOnUse' }, [
      [0, PALETTE.glassTop],
      [1, PALETTE.glassBottom],
    ]),
    gradient('linearGradient', ids.sheen, { x1: round(x0), y1: round(roofY), x2: round(x1), y2: round(baseY), gradientUnits: 'userSpaceOnUse' }, [
      [0, PALETTE.rim, 0.22],
      [0.45, PALETTE.rim, 0.05],
      [1, PALETTE.rim, 0],
    ]),
    gradient('linearGradient', ids.rim, { x1: round(x0 - dx), y1: 0, x2: round(x0), y2: 0, gradientUnits: 'userSpaceOnUse' }, [
      [0, PALETTE.rim, 0.35],
      [1, PALETTE.rim, 0.08],
    ]),
    svgEl('filter', { id: ids.glow, x: '-50%', y: '-50%', width: '200%', height: '200%' }, [
      svgEl('feGaussianBlur', { stdDeviation: round(Math.max(1, floorH * 0.35)) }),
    ]),
  ];
}

function litColor(rng) {
  return PALETTE.lights[Math.floor(rng() * PALETTE.lights.length)];
}

function sidePane(geo, t0, t1, top, bottom) {
  return toPoints([
    sidePoint(geo, t0, top),
    sidePoint(geo, t1, top),
    sidePoint(geo, t1, bottom),
    sidePoint(geo, t0, bottom),
  ]);
}

function drawLevel(geo, level, options, layers) {
  const { x0, frontW, floorH } = geo;
  const { floor, top, bottom } = level;
  const rng = createRng(`${options.seed}:floor:${floor}`);
  const isLobby = floor === 1;
  const isAmenity = options.amenityFloors.includes(floor);
  const paneTop = top + floorH * (isLobby ? 0.1 : 0.08);
  const paneBottom = bottom - floorH * (isLobby ? 0.12 : 0.24);

  const bayW = frontW / options.bays;
  const gap = Math.max(0.8, floorH * 0.1);
  for (let i = 0; i < options.bays; i += 1) {
    const x = x0 + i * bayW + gap / 2;
    const lit = isAmenity || rng() < LIT_CHANCE;
    layers.glass.append(rect(x, paneTop, bayW - gap, paneBottom - paneTop, { fill: `url(#${options.ids.glass})` }));
    if (!lit) continue;
    const dimmed = !isAmenity && rng() < 0.25;
    layers.lights.append(
      rect(x, paneTop, bayW - gap, paneBottom - paneTop, {
        fill: isAmenity && !isLobby ? PALETTE.coolLight : litColor(rng),
        opacity: round(dimmed ? 0.45 : isAmenity ? 0.9 : 0.75 + rng() * 0.25),
        'data-lit': '',
      }),
    );
  }

  for (let j = 0; j < options.sideBays; j += 1) {
    const t0 = (j + 0.12) / options.sideBays;
    const t1 = (j + 0.88) / options.sideBays;
    const points = sidePane(geo, t0, t1, paneTop, paneBottom);
    const lit = isAmenity || rng() < SIDE_LIT_CHANCE;
    layers.glass.append(svgEl('polygon', { points, fill: PALETTE.sideGlass }));
    if (lit) {
      layers.lights.append(
        svgEl('polygon', { points, fill: litColor(rng), opacity: round(0.45 + rng() * 0.3), 'data-lit': '' }),
      );
    }
  }

  if (options.terraceFloors.includes(floor)) {
    const railTop = bottom - floorH * 0.32;
    layers.details.append(
      rect(x0 - floorH * 0.2, railTop, frontW + floorH * 0.4, bottom - railTop, { fill: PALETTE.ripple, opacity: 0.1 }),
      rect(x0 - floorH * 0.2, railTop, frontW + floorH * 0.4, Math.max(0.6, floorH * 0.04), { fill: PALETTE.gold, opacity: 0.55 }),
    );
  }

  if (isLobby) {
    const canopyY = top + (bottom - top) * 0.45;
    layers.details.append(
      rect(x0 - floorH * 0.4, canopyY, frontW + floorH * 0.8, Math.max(1, floorH * 0.08), { fill: PALETTE.gold, opacity: 0.85 }),
    );
  }
}

function drawCrown(geo, ids) {
  const { x0, x1, frontW, roofY, crownTop, floorH } = geo;
  const parapetTop = roofY - floorH * PARAPET;
  const boxInset = frontW * 0.18;
  return svgEl('g', { class: 'tw-crown' }, [
    rect(x0 + boxInset, crownTop, frontW - boxInset * 2, parapetTop - crownTop, { fill: PALETTE.frame }),
    rect(x0 + boxInset, crownTop + (parapetTop - crownTop) * 0.45, frontW - boxInset * 2, Math.max(0.8, floorH * 0.08), {
      fill: PALETTE.gold,
      opacity: 0.6,
    }),
    svgEl('polygon', {
      points: toPoints([sidePoint(geo, 0, parapetTop), sidePoint(geo, 1, parapetTop), sidePoint(geo, 1, roofY), sidePoint(geo, 0, roofY)]),
      fill: PALETTE.sideFrame,
    }),
    svgEl('polygon', {
      points: toPoints([sidePoint(geo, 0, parapetTop), sidePoint(geo, 1, parapetTop), sidePoint(geo, 1, roofY), sidePoint(geo, 0, roofY)]),
      fill: `url(#${ids.rim})`,
    }),
    rect(x0, parapetTop, x1 - x0, roofY - parapetTop, { fill: PALETTE.frame }),
    rect(x0, parapetTop, x1 - x0, Math.max(0.8, floorH * 0.05), { fill: PALETTE.gold, opacity: 0.8 }),
    svgEl('circle', { cx: round((x0 + x1) / 2), cy: round(crownTop), r: round(Math.max(1, floorH * 0.1)), fill: PALETTE.lamp }),
  ]);
}

export function drawTower(geo, options) {
  const { x0, x1, roofY, baseY, floorH } = geo;
  const { ids } = options;
  const layers = {
    glass: svgEl('g'),
    lights: svgEl('g', { id: ids.lights }),
    details: svgEl('g'),
  };
  geo.levels.forEach((level) => drawLevel(geo, level, options, layers));

  const sideFace = toPoints([sidePoint(geo, 0, roofY), sidePoint(geo, 1, roofY), sidePoint(geo, 1, baseY), sidePoint(geo, 0, baseY)]);

  return svgEl('g', { class: 'tw-tower' }, [
    svgEl('polygon', { points: sideFace, fill: PALETTE.sideFrame }),
    rect(x0, roofY, x1 - x0, baseY - roofY, { fill: PALETTE.frame }),
    layers.glass,
    svgEl('polygon', { points: sideFace, fill: `url(#${ids.rim})` }),
    rect(x0, roofY, x1 - x0, baseY - roofY, { fill: `url(#${ids.sheen})` }),
    svgEl('use', { href: `#${ids.lights}`, filter: `url(#${ids.glow})`, opacity: 0.55 }),
    layers.lights,
    layers.details,
    rect(x0 - 0.5, roofY, Math.max(1, floorH * 0.06), baseY - roofY, { fill: PALETTE.gold, opacity: 0.45 }),
    drawCrown(geo, ids),
  ]);
}
