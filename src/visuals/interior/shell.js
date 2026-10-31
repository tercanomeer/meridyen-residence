// Oda kabuğu: zemin, tavan, yan duvarlar, arka duvar (yere kadar cam + manzara ya da dolu duvar),
// tavanda spot ışıklar ve zemine düşen ışık. Teraslarda tavan yerine pergola, arka ve yan cam korkuluk.

import { svgEl, rect, gradient, round, uniqueId } from '../svg.js';
import { createRng } from '../rng.js';
import { shade, lighten } from '../color.js';
import { drawView } from './views.js';

const FLOOR_MATERIAL = { bath: 'stone', kitchen: 'stone', terrace: 'deck' };

function line(cam, a, b) {
  const [x1, y1] = cam.project(...a);
  const [x2, y2] = cam.project(...b);
  return `M${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}`;
}

function floorTexture(cam, material, mood, rng) {
  const { room: { w }, near, back } = cam;
  const left = -w / 2;
  const segments = [];
  if (material === 'wood') {
    for (let x = left + 0.19; x < w / 2; x += 0.19) {
      segments.push(line(cam, [x, 0, near], [x, 0, back]));
      for (let k = 0; k < 3; k += 1) {
        const z = near + rng() * (back - near);
        segments.push(line(cam, [x - 0.19, 0, z], [x, 0, z]));
      }
    }
  } else if (material === 'stone') {
    for (let x = left + 0.6; x < w / 2; x += 0.6) segments.push(line(cam, [x, 0, near], [x, 0, back]));
    for (let z = back - 0.6; z > near; z -= 0.6) segments.push(line(cam, [left, 0, z], [w / 2, 0, z]));
  } else {
    for (let z = back - 0.14; z > near; z -= 0.14) segments.push(line(cam, [left, 0, z], [w / 2, 0, z]));
  }
  return svgEl('path', {
    d: segments.join(''),
    fill: 'none',
    stroke: shade(mood[material], 0.4),
    'stroke-opacity': material === 'stone' ? 0.18 : 0.28,
    'stroke-width': 0.7,
  });
}

function spotPositions(cam) {
  const { room: { w }, near, back } = cam;
  const xs = w > 5.2 ? [-w / 3, 0, w / 3] : [-w / 4, w / 4];
  const spots = [];
  for (let z = back - 0.7; z > near + 0.3; z -= 1.3) xs.forEach((x) => spots.push([x, z]));
  return spots;
}

function drawSpots(cam, mood, defs, height) {
  const glowId = uniqueId('iv-glow');
  defs.append(gradient('radialGradient', glowId, {}, [[0, mood.glow, 0.55], [0.35, mood.glow, 0.16], [1, mood.glow, 0]]));
  const group = svgEl('g', { class: 'interior-spots' });
  spotPositions(cam).forEach(([x, z]) => {
    const [px, py] = cam.project(x, height, z);
    const [fx, fy] = cam.project(x, 0, z);
    const r = cam.size(0.055, z);
    const squash = Math.min(0.6, Math.max(0.15, (height - cam.eye) / z));
    group.append(
      svgEl('ellipse', { cx: round(fx), cy: round(fy), rx: round(cam.size(0.7, z)), ry: round(cam.size(0.7, z) * Math.min(0.6, cam.eye / z)), fill: `url(#${glowId})`, opacity: 0.35 }),
      svgEl('circle', { cx: round(px), cy: round(py), r: round(r * 6), fill: `url(#${glowId})` }),
      svgEl('ellipse', { cx: round(px), cy: round(py), rx: round(r), ry: round(r * squash), fill: mood.spot }),
    );
  });
  return group;
}

function wallGradient(defs, id, from, to, color) {
  defs.append(gradient('linearGradient', id, { gradientUnits: 'userSpaceOnUse', ...from, ...to }, [[0, lighten(color, 0.04)], [1, shade(color, 0.28)]]));
  return `url(#${id})`;
}

function glassFrame(cam, mood, box, opening) {
  const { room: { w, h }, back } = cam;
  const stroke = Math.max(1, cam.size(0.05, back));
  const panes = Math.max(2, Math.round(w / 1.6));
  const d = [];
  for (let i = 1; i < panes; i += 1) {
    const x = -w / 2 + (w * i) / panes;
    d.push(line(cam, [x, 0, back], [x, opening, back]));
  }
  return svgEl('g', { class: 'interior-glass' }, [
    rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0, { fill: '#ffffff', opacity: 0.05 }),
    svgEl('path', { d: d.join(''), stroke: mood.frame, 'stroke-width': round(stroke), fill: 'none' }),
    rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0, { fill: 'none', stroke: mood.frame, 'stroke-width': round(stroke * 1.4) }),
    opening < h ? null : rect(box.x0, box.y1 - stroke, box.x1 - box.x0, stroke * 1.2, { fill: mood.frame }),
  ].filter(Boolean));
}

function curtains(cam, box) {
  const width = cam.size(0.5, cam.back);
  return [box.x0, box.x1 - width].map((x) =>
    svgEl('g', { class: 'interior-curtain' }, [
      rect(x, box.y0, width, box.y1 - box.y0, { fill: '#fbf7f0', opacity: 0.55 }),
      ...[0.25, 0.5, 0.75].map((t) => rect(x + width * t, box.y0, 1, box.y1 - box.y0, { fill: '#ffffff', opacity: 0.5 })),
    ]),
  );
}

function solidBackWall(cam, mood, box, kind, defs) {
  const group = svgEl('g', {}, [rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0, { fill: shade(mood.wall, 0.04) })]);
  const washId = uniqueId('iv-wash');
  defs.append(gradient('radialGradient', washId, { cy: 0 }, [[0, mood.glow, 0.5], [1, mood.glow, 0]]));
  const width = box.x1 - box.x0;
  [0.25, 0.75].forEach((t) => {
    group.append(svgEl('ellipse', { cx: round(box.x0 + width * t), cy: round(box.y0), rx: round(width * 0.16), ry: round((box.y1 - box.y0) * 0.6), fill: `url(#${washId})` }));
  });
  const [mx0, my0] = cam.project(kind === 'bath' ? -0.9 : -0.8, kind === 'bath' ? 2.1 : 2, cam.back);
  const [mx1, my1] = cam.project(kind === 'bath' ? 0.9 : 0.8, kind === 'bath' ? 1.1 : 1.1, cam.back);
  group.append(
    rect(mx0, my0, mx1 - mx0, my1 - my0, { fill: kind === 'bath' ? '#c9d3d8' : '#b9a58c', stroke: mood.frame, 'stroke-width': 1.5 }),
    rect(mx0 + (mx1 - mx0) * 0.12, my0 + (my1 - my0) * 0.15, (mx1 - mx0) * 0.4, (my1 - my0) * 0.7, { fill: '#ffffff', opacity: kind === 'bath' ? 0.25 : 0.12 }),
  );
  return group;
}

export function drawShell(cam, { kind, view, mood, seed, coastSide }) {
  const { width, height } = cam;
  const { w, h } = cam.room;
  const { near, back } = cam;
  const L = -w / 2;
  const R = w / 2;
  const terrace = kind === 'terrace';
  const rng = createRng(`${seed}:shell`);
  const defs = svgEl('defs');
  const group = svgEl('g', { class: 'interior-shell' }, [defs]);

  const [bx0, by0] = cam.project(L, h, back);
  const [bx1, by1] = cam.project(R, 0, back);
  const box = { x0: bx0, y0: by0, x1: bx1, y1: by1 };

  if (terrace) {
    group.append(drawView('sea', mood, { x0: 0, y0: 0, x1: width, y1: height }, cam.cy, { seed }));
  } else if (view === 'wall') {
    group.append(solidBackWall(cam, mood, box, kind, defs));
  } else {
    const clipId = uniqueId('iv-clip');
    defs.append(svgEl('clipPath', { id: clipId }, [rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0)]));
    group.append(svgEl('g', { 'clip-path': `url(#${clipId})` }, [drawView(view, mood, box, cam.cy, { seed, coastSide })]));
  }

  const leftFill = wallGradient(defs, uniqueId('iv-left'), { x1: round(bx0), y1: 0 }, { x2: 0, y2: 0 }, mood.wall);
  const rightFill = wallGradient(defs, uniqueId('iv-right'), { x1: round(bx1), y1: 0 }, { x2: round(width), y2: 0 }, mood.wall);
  const material = FLOOR_MATERIAL[kind] ?? 'wood';
  const floorId = uniqueId('iv-floor');
  defs.append(gradient('linearGradient', floorId, { gradientUnits: 'userSpaceOnUse', x1: 0, y1: round(by1), x2: 0, y2: round(height) }, [[0, lighten(mood[material], 0.1)], [1, shade(mood[material], 0.22)]]));

  group.append(svgEl('polygon', { points: cam.poly([[L, 0, near], [R, 0, near], [R, 0, back], [L, 0, back]]), fill: `url(#${floorId})` }));
  group.append(floorTexture(cam, material, mood, rng));

  const spillId = uniqueId('iv-spill');
  defs.append(gradient('linearGradient', spillId, { gradientUnits: 'userSpaceOnUse', x1: 0, y1: round(by1), x2: 0, y2: round(cam.project(0, 0, Math.max(near, back - 3))[1]) }, [[0, mood.spill, view === 'wall' ? 0 : 0.4], [1, mood.spill, 0]]));
  group.append(svgEl('polygon', { points: cam.poly([[L + 0.3, 0, back], [R - 0.3, 0, back], [R - 0.3, 0, Math.max(near, back - 3)], [L + 0.3, 0, Math.max(near, back - 3)]]), fill: `url(#${spillId})` }));

  // Sol duvar; terasta binanın cam cephesi.
  group.append(svgEl('polygon', { points: cam.poly([[L, 0, near], [L, 0, back], [L, h, back], [L, h, near]]), fill: terrace ? shade(mood.wall, 0.12) : leftFill }));
  if (terrace) {
    const panes = [];
    for (let z = back - 0.9; z > near; z -= 1.4) panes.push(line(cam, [L, 0, z], [L, h * 0.92, z]));
    group.append(
      svgEl('polygon', { points: cam.poly([[L, 0.05, near], [L, 0.05, back - 0.4], [L, h * 0.92, back - 0.4], [L, h * 0.92, near]]), fill: mood.seaTop, opacity: 0.35 }),
      svgEl('path', { d: panes.join(''), stroke: mood.frame, 'stroke-width': 2, fill: 'none' }),
    );
  } else {
    group.append(svgEl('polygon', { points: cam.poly([[R, 0, near], [R, 0, back], [R, h, back], [R, h, near]]), fill: rightFill }));
  }

  if (terrace) {
    const rail = 1.05;
    group.append(
      svgEl('polygon', { points: cam.poly([[L, 0, back], [R, 0, back], [R, rail, back], [L, rail, back]]), fill: '#ffffff', opacity: 0.12 }),
      svgEl('polygon', { points: cam.poly([[R, 0, near], [R, 0, back], [R, rail, back], [R, rail, near]]), fill: '#ffffff', opacity: 0.1 }),
      svgEl('path', { d: line(cam, [L, rail, back], [R, rail, back]) + line(cam, [R, rail, back], [R, rail, near]), stroke: mood.frame, 'stroke-width': 2.5, fill: 'none' }),
    );
    const beams = [];
    for (let z = back - 0.3; z > near; z -= 0.9) beams.push(line(cam, [L, h, z], [R + 0.4, h, z]));
    beams.push(line(cam, [R, h, near], [R, h, back]));
    group.append(svgEl('path', { d: beams.join(''), stroke: shade(mood.deck, 0.25), 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }));
  } else {
    const ceilingId = uniqueId('iv-ceiling');
    defs.append(gradient('linearGradient', ceilingId, { gradientUnits: 'userSpaceOnUse', x1: 0, y1: round(by0), x2: 0, y2: 0 }, [[0, mood.ceiling], [1, shade(mood.ceiling, 0.18)]]));
    group.append(svgEl('polygon', { points: cam.poly([[L, h, near], [R, h, near], [R, h, back], [L, h, back]]), fill: `url(#${ceilingId})` }));
    // Tavan ile arka duvar birleşiminde gizli ışık bandı.
    group.append(svgEl('path', { d: line(cam, [L, h, back], [R, h, back]), stroke: mood.glow, 'stroke-width': 3, 'stroke-opacity': 0.7 }));
    if (view !== 'wall') group.append(glassFrame(cam, mood, box, h));
    if (view !== 'wall' && (kind === 'living' || kind === 'bedroom')) group.append(...curtains(cam, box));
  }

  group.append(drawSpots(cam, mood, defs, h));
  return group;
}
