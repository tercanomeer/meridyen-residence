// Oda dikdörtgenlerinden duvar, cam cephe, kapı boşluğu ve giriş eşiği çıkarır.
// İki oda arasındaki ortak kenar iç duvar olur; salon-mutfak-yemek açık plandır.
// Dış kenar: teras → cam korkuluk, cephe → cam, diğerleri (komşu, çekirdek) → dolu duvar.

export const WALL = { exterior: 0.24, interior: 0.12, glass: 0.08, height: 1.1, balustrade: 0.9 };

const EPS = 1e-6;
const DOOR = 0.9;
const ENTRANCE = 1.05;
const OPEN_PLAN = new Set(['living', 'kitchen', 'dining']);
const CIRCULATION = new Set(['entry', 'hall', 'living', 'dining', 'kitchen']);
const PRIVATE_DOORS = [
  ['bedroom', 'bath'],
  ['bedroom', 'dressing'],
];

function collectLines(rooms) {
  const lines = { h: new Map(), v: new Map() };
  const add = (axis, c, entry) => {
    const id = Math.round(c * 1000);
    if (!lines[axis].has(id)) lines[axis].set(id, { axis, c, entries: [] });
    lines[axis].get(id).entries.push(entry);
  };
  rooms.forEach((room, index) => {
    const [x, y, w, h] = room.rect;
    add('h', y, { a: x, b: x + w, index, after: true });
    add('h', y + h, { a: x, b: x + w, index, after: false });
    add('v', x, { a: y, b: y + h, index, after: true });
    add('v', x + w, { a: y, b: y + h, index, after: false });
  });
  return [...lines.h.values(), ...lines.v.values()];
}

// Bir çizgiyi parçalara böler: her parçanın iki yanındaki oda (before: kuzey/batı, after: güney/doğu).
function splitLine({ axis, c, entries }) {
  const stops = [...new Set(entries.flatMap((entry) => [entry.a, entry.b]))].sort((m, n) => m - n);
  const segments = [];
  for (let i = 0; i < stops.length - 1; i += 1) {
    const [p, q] = [stops[i], stops[i + 1]];
    if (q - p < EPS) continue;
    const mid = (p + q) / 2;
    const side = (after) => entries.find((entry) => entry.after === after && entry.a < mid && entry.b > mid)?.index ?? null;
    const before = side(false);
    const after = side(true);
    if (before === null && after === null) continue;
    const last = segments[segments.length - 1];
    if (last && last.before === before && last.after === after && Math.abs(last.q - p) < EPS) last.q = q;
    else segments.push({ axis, c, p, q, before, after });
  }
  return segments;
}

function outerSide({ axis, c }, [width, depth]) {
  if (axis === 'h') return Math.abs(c) < EPS ? 'north' : Math.abs(c - depth) < EPS ? 'south' : null;
  return Math.abs(c) < EPS ? 'west' : Math.abs(c - width) < EPS ? 'east' : null;
}

function bandRect({ axis, c }, start, end, thickness) {
  return axis === 'h' ? [start, c - thickness / 2, end - start, thickness] : [c - thickness / 2, start, thickness, end - start];
}

function wallPieces(segment, thickness, gap) {
  const { p, q } = segment;
  const half = thickness / 2;
  if (!gap || q - p < gap + 0.5) return [bandRect(segment, p - half, q + half, thickness)];
  const mid = (p + q) / 2;
  return [bandRect(segment, p - half, mid - gap / 2, thickness), bandRect(segment, mid + gap / 2, q + half, thickness)];
}

function needsDoor(a, b) {
  if (CIRCULATION.has(a) || CIRCULATION.has(b)) return true;
  return PRIVATE_DOORS.some(([m, n]) => (a === m && b === n) || (a === n && b === m));
}

export function deriveWalls(rooms, size, facades) {
  const walls = [];
  const glass = [];
  const thresholds = [];
  const windows = rooms.map(() => new Set());
  const entranceCandidates = [];

  collectLines(rooms)
    .flatMap(splitLine)
    .forEach((segment) => {
      const { before, after } = segment;
      if (before !== null && after !== null) {
        const kinds = [rooms[before].kind, rooms[after].kind];
        if (kinds.every((kind) => OPEN_PLAN.has(kind))) return;
        if (kinds.includes('terrace')) {
          glass.push({ rect: bandRect(segment, segment.p, segment.q, WALL.glass), height: WALL.height, segment });
          return;
        }
        const gap = needsDoor(...kinds) ? DOOR : 0;
        wallPieces(segment, WALL.interior, gap).forEach((rect) => walls.push({ rect }));
        return;
      }

      const index = before ?? after;
      const room = rooms[index];
      const side = outerSide(segment, size);
      if (room.kind === 'terrace') {
        glass.push({ rect: bandRect(segment, segment.p, segment.q, WALL.glass), height: WALL.balustrade, segment });
      } else if (side && facades.includes(side)) {
        glass.push({ rect: bandRect(segment, segment.p, segment.q, WALL.glass), height: WALL.height, segment });
        windows[index].add(side);
      } else if (room.kind === 'entry') {
        entranceCandidates.push(segment);
      } else {
        wallPieces(segment, WALL.exterior, 0).forEach((rect) => walls.push({ rect }));
      }
    });

  // Giriş kapısı: antrenin cephe olmayan en uzun dış kenarı (çekirdeğe bakan taraf).
  entranceCandidates.sort((a, b) => b.q - b.p - (a.q - a.p));
  entranceCandidates.forEach((segment, i) => {
    const gap = i === 0 ? ENTRANCE : 0;
    wallPieces(segment, WALL.exterior, gap).forEach((rect) => walls.push({ rect }));
    if (gap) {
      const mid = (segment.p + segment.q) / 2;
      thresholds.push(bandRect(segment, mid - gap / 2, mid + gap / 2, WALL.exterior));
    }
  });

  return { walls, glass, thresholds, windows };
}
