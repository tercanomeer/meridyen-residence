// Daire tiplerinin kat plakasına yerleşimi: ayna, plaka koordinatı, cepheler, odalar.

const MIRRORED_SIDE = { west: 'east', east: 'west', north: 'north', south: 'south' };

export function layoutForFloor(project, floor) {
  return project.floorLayouts.find(({ floors: [from, to] }) => floor >= from && floor <= to) ?? null;
}

// Tipin kendi koordinatındaki dikdörtgen; ayna varsa x ekseninde çevrilir.
export function mirrorRect([x, y, w, h], placement, type) {
  return placement.mirror ? [type.size[0] - x - w, y, w, h] : [x, y, w, h];
}

// Tipin kendi koordinatından kat plakası koordinatına.
export function placeRect(rect, placement, type) {
  const [x, y, w, h] = mirrorRect(rect, placement, type);
  return [placement.at[0] + x, placement.at[1] + y, w, h];
}

export function placedFacades(type, placement) {
  return type.facades.map((side) => (placement.mirror ? MIRRORED_SIDE[side] : side));
}

export function placedRooms(type, placement) {
  return type.rooms.map((room) => ({ ...room, rect: mirrorRect(room.rect, placement, type) }));
}

export function placedFootprint(type, placement) {
  return type.footprint.map((rect) => mirrorRect(rect, placement, type));
}

export function locateUnit(project, unit) {
  const layout = layoutForFloor(project, unit.floor);
  const placement = layout?.units.find((entry) => entry.slot === unit.slot);
  const type = project.unitTypes[unit.type];
  return layout && placement && type ? { layout, placement, type } : null;
}

// Odanın pencereli yönleri: tipin dış sınırında cepheye bakan kenarlar ve terasa açılan kenarlar.
export function roomWindows(room, type, facades, rooms = []) {
  const [x, y, w, h] = room.rect;
  const [width, depth] = type.size;
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  const overlaps = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > 1e-6;
  const sides = [];
  if (near(y, 0)) sides.push('north');
  if (near(y + h, depth)) sides.push('south');
  if (near(x, 0)) sides.push('west');
  if (near(x + w, width)) sides.push('east');
  const windows = sides.filter((side) => facades.includes(side));

  rooms
    .filter((other) => other.kind === 'terrace' && other !== room)
    .forEach(({ rect: [ox, oy, ow, oh] }) => {
      if (near(oy, y + h) && overlaps(x, x + w, ox, ox + ow)) windows.push('south');
      if (near(oy + oh, y) && overlaps(x, x + w, ox, ox + ow)) windows.push('north');
      if (near(ox, x + w) && overlaps(y, y + h, oy, oy + oh)) windows.push('east');
      if (near(ox + ow, x) && overlaps(y, y + h, oy, oy + oh)) windows.push('west');
    });
  return [...new Set(windows)];
}
