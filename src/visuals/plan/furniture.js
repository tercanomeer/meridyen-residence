// Oda türüne göre basit mobilya kutuları (metre). Mobilya pencerenin karşısındaki duvara dayanır.
// Her öğe: { rect, parts: [{ rect, z0, z1, tone }] } — parçalar üst üste, sırayla çizilir.

import { FURNITURE } from '../materials.js';

const OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east' };
const TURN = { north: 'west', west: 'south', south: 'east', east: 'north' };
const WINDOW_PRIORITY = ['south', 'west', 'east', 'north'];
const GAP = 0.18;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isHorizontal = (side) => side === 'north' || side === 'south';
const spanOf = (room, side) => (isHorizontal(side) ? room.rect[2] : room.rect[3]);
const depthOf = (room, side) => (isHorizontal(side) ? room.rect[3] : room.rect[2]);

// side duvarı boyunca length uzunluğunda, depth derinliğinde dikdörtgen.
// align: start | center | end; at: duvar başından uzaklık; offset: duvardan uzaklık.
function along(room, side, length, depth, { align = 'center', offset = 0, at = null } = {}) {
  const [x, y, w, h] = room.rect;
  const span = spanOf(room, side);
  const origin = isHorizontal(side) ? x : y;
  let s = origin + (span - length) / 2;
  if (at !== null) s = origin + at;
  else if (align === 'start') s = origin + GAP;
  else if (align === 'end') s = origin + span - GAP - length;
  if (side === 'north') return [s, y + GAP + offset, length, depth];
  if (side === 'south') return [s, y + h - GAP - offset - depth, length, depth];
  if (side === 'west') return [x + GAP + offset, s, depth, length];
  return [x + w - GAP - offset - depth, s, depth, length];
}

const piece = (rect, height, tone, z0 = 0) => ({ rect, parts: [{ rect, z0, z1: z0 + height, tone }] });

function stack(parts) {
  return { rect: parts[0].rect, parts };
}

function living(room, back) {
  const span = spanOf(room, back);
  const depth = depthOf(room, back);
  const sofa = clamp(span - 1.2, 1.6, 2.8);
  const align = span >= 9 ? 'start' : 'center';
  const items = [];
  if (depth >= 2.4) items.push(piece(along(room, back, Math.min(sofa + 0.6, span - 0.4), Math.min(2.4, depth - 1), { offset: 0.5, align }), 0.012, FURNITURE.rug));
  items.push(piece(along(room, back, sofa, 0.9, { align, offset: align === 'start' ? 0.2 : 0 }), 0.72, FURNITURE.fabric));
  if (depth >= 2.6) items.push(piece(along(room, back, 1.1, 0.6, { offset: 1.35, at: align === 'start' ? 0.2 + GAP + sofa / 2 - 0.55 : null }), 0.4, FURNITURE.walnut));
  if (span >= 4.5 && depth >= 3.2 && align === 'center') items.push(piece(along(room, back, 0.85, 0.85, { align: 'start', offset: 1.5 }), 0.7, FURNITURE.fabric));
  if (span >= 9) items.push(...dining(room, back, 'end'));
  return items;
}

function dining(room, back, align = 'center') {
  const span = spanOf(room, back);
  const depth = depthOf(room, back);
  const length = clamp(span - 1.6, 1.2, align === 'end' ? 2.2 : 2.4);
  const offset = Math.max(0.55, (depth - 0.95) / 2 - GAP);
  const at = align === 'end' ? span - GAP - 0.6 - length : (span - length) / 2;
  const items = [piece(along(room, back, length, 0.95, { at, offset }), 0.75, FURNITURE.walnut)];
  const chairs = Math.max(2, Math.floor(length / 0.7));
  for (let i = 0; i < chairs; i += 1) {
    const chairAt = at + ((i + 0.5) * length) / chairs - 0.225;
    items.push(piece(along(room, back, 0.45, 0.45, { at: chairAt, offset: offset - 0.55 }), 0.45, FURNITURE.oak));
    items.push(piece(along(room, back, 0.45, 0.45, { at: chairAt, offset: offset + 1.05 }), 0.45, FURNITURE.oak));
  }
  return items;
}

function kitchen(room, back) {
  const span = spanOf(room, back);
  const depth = depthOf(room, back);
  const items = [piece(along(room, back, span - GAP * 2, 0.62), 0.9, FURNITURE.marble)];
  if (depth >= 3.4 && span >= 2.8) items.push(piece(along(room, back, Math.min(2.2, span - 1.4), 0.9, { offset: 1.5 }), 0.9, FURNITURE.marble));
  return items;
}

function bedroom(room, back, windows) {
  const master = room.id.startsWith('ebeveyn');
  const bedLength = master ? 2.1 : 2;
  const fits = (side, width) => depthOf(room, side) >= bedLength + 0.6 && spanOf(room, side) >= width + 0.4;
  const preferredWidth = master ? 1.8 : 1.4;
  const candidates = [back, TURN[back], OPPOSITE[TURN[back]]].filter((side) => !windows.has(side));
  const side = candidates.find((s) => fits(s, preferredWidth)) ?? candidates.find((s) => fits(s, 1)) ?? back;
  const span = spanOf(room, side);
  const depth = depthOf(room, side);
  const bedWidth = span >= preferredWidth + 0.4 ? preferredWidth : 1;

  const frame = along(room, side, bedWidth + 0.1, bedLength + 0.05);
  const items = [
    stack([
      { rect: frame, z0: 0, z1: 0.3, tone: FURNITURE.walnut },
      { rect: along(room, side, bedWidth, bedLength - 0.05, { offset: 0.05 }), z0: 0.3, z1: 0.5, tone: FURNITURE.linen },
      { rect: along(room, side, bedWidth - 0.2, 0.38, { offset: 0.1 }), z0: 0.5, z1: 0.62, tone: FURNITURE.ceramic },
    ]),
  ];
  if (span >= bedWidth + 1.3) {
    items.push(piece(along(room, side, 0.45, 0.4, { at: (span - bedWidth) / 2 - 0.55 }), 0.5, FURNITURE.oak));
    items.push(piece(along(room, side, 0.45, 0.4, { at: (span + bedWidth) / 2 + 0.1 }), 0.5, FURNITURE.oak));
  }
  const front = OPPOSITE[side];
  if (!windows.has(front) && depth >= bedLength + 1.5) {
    items.push(piece(along(room, front, Math.min(2.4, span - 0.6), 0.6), 1, FURNITURE.oak));
  } else if ((span - bedWidth) / 2 >= 1 && !windows.has(TURN[side])) {
    items.push(piece(along(room, TURN[side], Math.min(2, depth - 1), 0.6, { align: 'end' }), 1, FURNITURE.oak));
  }
  return items;
}

function bath(room, back) {
  const span = spanOf(room, back);
  const depth = depthOf(room, back);
  const items = [piece(along(room, back, Math.max(0.6, Math.min(1.2, span - 1.3)), 0.5, { align: 'start' }), 0.85, FURNITURE.marble)];
  if (span >= 1.9) items.push(piece(along(room, back, 0.42, 0.65, { align: 'end' }), 0.42, FURNITURE.ceramic));
  if (span >= 3 && depth >= 2.5) items.push(piece(along(room, OPPOSITE[back], Math.min(1.7, span - 0.4), 0.75, { align: 'end' }), 0.55, FURNITURE.ceramic));
  else if (depth >= 2.2) items.push(piece(along(room, OPPOSITE[back], 0.9, 0.9, { align: 'end' }), 0.06, FURNITURE.ceramic));
  return items;
}

function utility(room, back) {
  const items = [piece(along(room, back, 0.6, 0.6, { align: 'start' }), 0.85, FURNITURE.appliance)];
  if (spanOf(room, back) >= 1.6) items.push(piece(along(room, back, 0.6, 0.6, { at: GAP + 0.65 }), 0.85, FURNITURE.appliance));
  return items;
}

function storage(room, back, windows, depth = 0.5) {
  const items = [piece(along(room, back, spanOf(room, back) - GAP * 2, depth), 1, FURNITURE.oak)];
  if (depthOf(room, back) >= 1.8 && !windows.has(OPPOSITE[back])) {
    items.push(piece(along(room, OPPOSITE[back], spanOf(room, back) - GAP * 2, depth), 1, FURNITURE.oak));
  }
  return items;
}

function entry(room, back) {
  if (depthOf(room, back) < 1.6 || spanOf(room, back) < 1.4) return [];
  return [piece(along(room, back, Math.min(1.2, spanOf(room, back) - 0.8), 0.35), 0.8, FURNITURE.walnut)];
}

function terrace(room) {
  const span = spanOf(room, 'south');
  const items = [];
  [0, 0.95].forEach((shift) => items.push(piece(along(room, 'south', 0.7, 1.9, { at: span * 0.55 + shift, offset: 0.4 }), 0.35, FURNITURE.fabric)));
  const planter = along(room, 'south', span * 0.3, 0.45, { align: 'start' });
  items.push(stack([
    { rect: planter, z0: 0, z1: 0.45, tone: FURNITURE.oak },
    { rect: planter, z0: 0.45, z1: 0.62, tone: FURNITURE.plant },
  ]));
  items.push(...dining({ ...room, rect: [room.rect[0], room.rect[1], span * 0.45, room.rect[3] * 0.6] }, 'north'));
  return items;
}

export function furnishRoom(room, windows) {
  const window = WINDOW_PRIORITY.find((side) => windows.has(side));
  const back = window ? OPPOSITE[window] : 'north';
  switch (room.kind) {
    case 'living':
      return living(room, back);
    case 'dining':
      return dining(room, back);
    case 'kitchen':
      return kitchen(room, back);
    case 'bedroom':
      return bedroom(room, back, windows);
    case 'bath':
      return bath(room, back);
    case 'utility':
      return utility(room, back);
    case 'dressing':
      return storage(room, back, windows);
    case 'storage':
      return storage(room, back, windows, 0.45);
    case 'entry':
      return entry(room, back);
    case 'terrace':
      return terrace(room);
    default:
      return [];
  }
}
