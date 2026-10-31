// Kule sahnesinin ölçüleri: kıyı çizgisi, kat yükseklikleri, cephe genişliği, yan yüz.
// Kule güneyden (denizden) görülür; batı yüzü solda, gün batımını alır.

const LOBBY_UNITS = 1.6;
const CROWN_UNITS = 1.3;
const SIDE_FORESHORTEN = 0.3;
const SIDE_RISE = 0.4;

export function towerGeometry({ width, height, floors, plate, floorHeight = 3.2, focusX = 0.5, topInset = 0 }) {
  const portrait = height > width;
  const shoreY = height * (portrait ? 0.8 : 0.79);
  const baseY = shoreY - Math.max(4, height * 0.012);

  const frontRatio = plate[0] / floorHeight;
  const depthRatio = (plate[1] / floorHeight) * SIDE_FORESHORTEN;
  const units = LOBBY_UNITS + (floors - 1) + CROWN_UNITS;
  const maxWidth = width * (portrait ? 0.5 : 0.32);
  const floorH = Math.max(4, Math.min((baseY - topInset) / units, maxWidth / (frontRatio + depthRatio)));

  const frontW = frontRatio * floorH;
  const dx = depthRatio * floorH;
  const dy = dx * SIDE_RISE;
  const x0 = width * focusX - (frontW + dx) / 2 + dx;

  const levels = [];
  let bottom = baseY;
  for (let floor = 1; floor <= floors; floor += 1) {
    const h = (floor === 1 ? LOBBY_UNITS : 1) * floorH;
    levels.push({ floor, top: bottom - h, bottom });
    bottom -= h;
  }

  return {
    width,
    height,
    shoreY,
    baseY,
    floorH,
    frontW,
    dx,
    dy,
    x0,
    x1: x0 + frontW,
    roofY: bottom,
    crownTop: bottom - CROWN_UNITS * floorH,
    levels,
  };
}

// Bir katın ön yüz + yan yüz dış çizgisi. padRight tıklama alanını sağa genişletir.
export function levelOutline(geo, { top, bottom }, padRight = 0) {
  const { x0, x1, dx, dy } = geo;
  return [
    [x0 - dx, top - dy],
    [x0, top],
    [x1 + padRight, top],
    [x1 + padRight, bottom],
    [x0, bottom],
    [x0 - dx, bottom - dy],
  ];
}

// Yan yüzde t (0 = ön köşe, 1 = arka köşe) konumundaki nokta.
export function sidePoint(geo, t, y) {
  return [geo.x0 - geo.dx * t, y - geo.dy * t];
}
