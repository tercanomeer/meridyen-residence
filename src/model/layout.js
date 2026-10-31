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
