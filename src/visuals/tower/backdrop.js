// Sahnenin kulesiz kısmı: gökyüzü, yıldızlar, bulutlar, tepeler, komşu binalar, kordon, deniz.

import { svgEl, rect, gradient, round } from '../svg.js';
import { createRng } from '../rng.js';
import { PALETTE } from './palette.js';

const between = (rng, min, max) => min + rng() * (max - min);

export function backdropDefs(geo, ids) {
  const { width, height, shoreY } = geo;
  return [
    gradient('linearGradient', ids.sky, { x1: 0, y1: 0, x2: 0, y2: 1 }, [
      [0, PALETTE.skyTop],
      [0.42, PALETTE.skyMid],
      [0.72, PALETTE.skyLow],
      [0.9, PALETTE.skyGlow],
      [1, PALETTE.horizon],
    ]),
    gradient(
      'radialGradient',
      ids.sun,
      { cx: round(width * 0.08), cy: round(shoreY), r: round(Math.max(width, height) * 0.55), gradientUnits: 'userSpaceOnUse' },
      [
        [0, PALETTE.sun, 0.55],
        [0.35, PALETTE.sun, 0.16],
        [1, PALETTE.sun, 0],
      ],
    ),
    gradient('linearGradient', ids.sea, { x1: 0, y1: 0, x2: 0, y2: 1 }, [
      [0, PALETTE.seaTop],
      [1, PALETTE.seaBottom],
    ]),
  ];
}

export function drawSky(geo, seed, ids) {
  const { width, shoreY, floorH } = geo;
  const rng = createRng(`${seed}:sky`);
  const group = svgEl('g', { class: 'tw-sky' }, [
    rect(0, 0, width, shoreY, { fill: `url(#${ids.sky})` }),
    rect(0, 0, width, shoreY, { fill: `url(#${ids.sun})` }),
  ]);

  const starCount = Math.round(width / 18);
  for (let i = 0; i < starCount; i += 1) {
    const y = shoreY * 0.45 * rng() ** 1.4;
    group.append(
      svgEl('circle', {
        cx: round(rng() * width),
        cy: round(y),
        r: round(between(rng, 0.4, 1.1)),
        fill: PALETTE.star,
        opacity: round(between(rng, 0.15, 0.7) * (1 - y / (shoreY * 0.5))),
      }),
    );
  }

  for (let i = 0; i < 6; i += 1) {
    const low = rng() > 0.35;
    group.append(
      svgEl('ellipse', {
        cx: round(rng() * width),
        cy: round(shoreY * (low ? between(rng, 0.68, 0.86) : between(rng, 0.4, 0.6))),
        rx: round(width * between(rng, 0.08, 0.22)),
        ry: round(floorH * between(rng, 0.12, 0.35)),
        fill: low ? PALETTE.cloudLit : PALETTE.cloudDark,
        opacity: round(low ? between(rng, 0.08, 0.2) : between(rng, 0.25, 0.45)),
      }),
    );
  }
  return group;
}

function drawHills(geo, rng) {
  const { width, baseY, floorH } = geo;
  const steps = 10;
  const points = Array.from({ length: steps + 1 }, (_, i) => [
    (width / steps) * i,
    baseY - floorH * between(rng, 2, 5.5),
  ]);
  let d = `M0 ${round(baseY)} L${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += ` Q${round(x)} ${round(y)} ${round((x + nx) / 2)} ${round((y + ny) / 2)}`;
  }
  d += ` L${round(width)} ${round(baseY)} Z`;
  return svgEl('path', { d, fill: PALETTE.hill });
}

function drawCityLayer(geo, rng, layer) {
  const { width, baseY, floorH } = geo;
  const group = svgEl('g');
  let x = -floorH * between(rng, 0, 3);

  while (x < width) {
    const w = floorH * between(rng, layer.minWidth, layer.maxWidth);
    const h = floorH * between(rng, layer.minFloors, layer.maxFloors);
    group.append(rect(x, baseY - h, w, h, { fill: layer.color }));

    if (rng() < 0.3) {
      const inset = w * between(rng, 0.15, 0.3);
      group.append(rect(x + inset, baseY - h - floorH * 1.2, w - inset * 2, floorH * 1.2, { fill: layer.color }));
    }

    for (let y = baseY - h + floorH * 0.6; y < baseY - floorH * 0.5; y += floorH * 0.85) {
      for (let wx = x + floorH * 0.45; wx < x + w - floorH * 0.4; wx += floorH * 0.7) {
        if (rng() < layer.lightChance) {
          group.append(
            rect(wx, y, floorH * 0.22, floorH * 0.3, {
              fill: PALETTE.cityLight,
              opacity: round(between(rng, 0.3, layer.lightOpacity)),
            }),
          );
        }
      }
    }
    x += w + floorH * between(rng, 0, 0.8);
  }
  return group;
}

function drawPromenade(geo, rng) {
  const { width, baseY, shoreY, floorH } = geo;
  const group = svgEl('g', {}, [
    rect(0, baseY, width, shoreY - baseY, { fill: PALETTE.promenade }),
    rect(0, baseY, width, 0.8, { fill: PALETTE.ripple, opacity: 0.12 }),
  ]);
  const step = floorH * 2.6;
  for (let x = step * rng(); x < width; x += step) {
    const y = baseY - floorH * 0.55;
    group.append(
      rect(x - 0.4, y, 0.8, baseY - y, { fill: PALETTE.cityNear }),
      svgEl('circle', { cx: round(x), cy: round(y), r: round(floorH * 0.32), fill: PALETTE.lamp, opacity: 0.12 }),
      svgEl('circle', { cx: round(x), cy: round(y), r: round(Math.max(0.8, floorH * 0.09)), fill: PALETTE.lamp }),
    );
  }
  return group;
}

// Kulenin arkasında kalan kara: tepeler, uzak ve yakın binalar, kordon.
export function drawLand(geo, seed) {
  return svgEl('g', { class: 'tw-land' }, [
    drawHills(geo, createRng(`${seed}:hills`)),
    drawCityLayer(geo, createRng(`${seed}:city-far`), {
      color: PALETTE.cityFar,
      minFloors: 6,
      maxFloors: 15,
      minWidth: 3,
      maxWidth: 8,
      lightChance: 0.12,
      lightOpacity: 0.55,
    }),
    drawCityLayer(geo, createRng(`${seed}:city-near`), {
      color: PALETTE.cityNear,
      minFloors: 3,
      maxFloors: 9,
      minWidth: 4,
      maxWidth: 10,
      lightChance: 0.2,
      lightOpacity: 0.85,
    }),
    drawPromenade(geo, createRng(`${seed}:promenade`)),
  ]);
}

export function drawSea(geo, ids) {
  const { width, height, shoreY } = geo;
  return rect(0, shoreY, width, height - shoreY, { fill: `url(#${ids.sea})` });
}

// Yansımayı dalgalı gösteren maske: yukarıdan aşağı solar, ince yatay boşluklarla kırılır.
export function reflectionMask(geo, seed, ids) {
  const { width, height, shoreY } = geo;
  const rng = createRng(`${seed}:ripples`);
  const depth = height - shoreY;
  const mask = svgEl('mask', { id: ids.reflection, maskUnits: 'userSpaceOnUse', x: 0, y: shoreY, width, height: depth }, [
    gradient('linearGradient', ids.reflectionFade, { x1: 0, y1: 0, x2: 0, y2: 1 }, [
      [0, '#fff', 0.85],
      [0.55, '#fff', 0.3],
      [1, '#fff', 0],
    ]),
    rect(0, shoreY, width, depth, { fill: `url(#${ids.reflectionFade})` }),
  ]);
  const count = Math.round(width / 6);
  for (let i = 0; i < count; i += 1) {
    const y = shoreY + depth * rng() ** 0.8;
    mask.append(rect(rng() * width, y, width * between(rng, 0.04, 0.25), between(rng, 0.6, 1.8), { fill: '#000' }));
  }
  return mask;
}

// Su yüzeyindeki parıltılar: güneşin altında sıcak çizgiler, her yerde soluk dalgalar.
export function drawWaterSurface(geo, seed) {
  const { width, height, shoreY, floorH } = geo;
  const rng = createRng(`${seed}:water`);
  const depth = height - shoreY;
  const group = svgEl('g', { class: 'tw-water' });

  for (let i = 0; i < Math.round(width / 14); i += 1) {
    group.append(
      rect(rng() * width, shoreY + depth * rng(), width * between(rng, 0.02, 0.12), 0.7, {
        fill: PALETTE.ripple,
        opacity: round(between(rng, 0.03, 0.09)),
      }),
    );
  }

  const sunX = width * 0.08;
  for (let i = 0; i < 70; i += 1) {
    const t = rng() ** 1.6;
    const spread = width * 0.06 * (1 + t * 2);
    const w = floorH * between(rng, 0.5, 3) * (1 - t * 0.5);
    group.append(
      rect(sunX + (rng() - 0.5) * spread * 2 - w / 2, shoreY + depth * t, w, 1, {
        fill: PALETTE.sun,
        opacity: round(between(rng, 0.12, 0.5) * (1 - t * 0.7)),
      }),
    );
  }
  return group;
}
