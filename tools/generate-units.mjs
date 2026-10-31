// Demo satış verisi üretir: project.json'daki floorLayouts, unitTypes, pricing ve demo
// ayarlarından projects/<id>/units.json yazar. Önce geometriyi doğrular.
//
// Kullanım: node tools/generate-units.mjs <projectId>

import { readFile, writeFile } from 'node:fs/promises';
import { createRng } from '../src/visuals/rng.js';

const EPS = 1e-6;
const MIRRORED_SIDE = { west: 'east', east: 'west', north: 'north', south: 'south' };

const area = ([, , w, h]) => w * h;
const sum = (rects) => rects.reduce((total, rect) => total + area(rect), 0);

function overlap(a, b) {
  const w = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]);
  const h = Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]);
  return w > 0 && h > 0 ? w * h : 0;
}

function assertDisjoint(rects, context) {
  rects.forEach((a, i) => {
    rects.slice(i + 1).forEach((b) => {
      if (overlap(a.rect, b.rect) > EPS) throw new Error(`${context}: ${a.name} overlaps ${b.name}`);
    });
  });
}

// Odalar tipin footprint'ini boşluksuz ve taşmasız kaplamalı.
function validateType(code, type) {
  const footprint = type.footprint.map((rect, i) => ({ name: `footprint[${i}]`, rect }));
  assertDisjoint(footprint, `type ${code}`);

  const ids = new Set();
  type.rooms.forEach((room) => {
    if (ids.has(room.id)) throw new Error(`type ${code}: duplicate room id ${room.id}`);
    ids.add(room.id);
    const inside = type.footprint.reduce((total, rect) => total + overlap(room.rect, rect), 0);
    if (Math.abs(inside - area(room.rect)) > EPS) throw new Error(`type ${code}: room ${room.id} leaves the footprint`);
  });
  assertDisjoint(type.rooms.map((room) => ({ name: room.id, rect: room.rect })), `type ${code}`);

  const roomArea = sum(type.rooms.map((room) => room.rect));
  if (Math.abs(roomArea - sum(type.footprint)) > EPS) {
    throw new Error(`type ${code}: rooms cover ${roomArea} m² of a ${sum(type.footprint)} m² footprint`);
  }
}

function placeRect([x, y, w, h], placement, type) {
  const localX = placement.mirror ? type.size[0] - x - w : x;
  return [placement.at[0] + localX, placement.at[1] + y, w, h];
}

// Daireler, çekirdek ve lobi kat plakasını boşluksuz ve taşmasız kaplamalı.
function validateLayout(layout, types) {
  const [plateW, plateH] = layout.plate;
  const parts = [
    { name: 'core', rect: layout.core },
    ...layout.lobby.map((rect, i) => ({ name: `lobby[${i}]`, rect })),
    ...layout.units.flatMap((placement) => {
      const type = types[placement.type];
      if (!type) throw new Error(`layout ${layout.id}: unknown type ${placement.type}`);
      return type.footprint.map((rect) => ({ name: `slot ${placement.slot}`, rect: placeRect(rect, placement, type) }));
    }),
  ];

  parts.forEach(({ name, rect: [x, y, w, h] }) => {
    if (x < -EPS || y < -EPS || x + w > plateW + EPS || y + h > plateH + EPS) {
      throw new Error(`layout ${layout.id}: ${name} leaves the plate`);
    }
  });
  assertDisjoint(parts, `layout ${layout.id}`);

  const covered = sum(parts.map((part) => part.rect));
  if (Math.abs(covered - plateW * plateH) > EPS) {
    throw new Error(`layout ${layout.id}: parts cover ${covered} m² of a ${plateW * plateH} m² plate`);
  }
}

function validateFloors(project) {
  const residential = project.floorLayouts.flatMap(({ floors: [from, to] }) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i),
  );
  const amenity = project.tower.amenityFloors.map((entry) => entry.floor);
  const all = [...amenity, ...residential].sort((a, b) => a - b);
  const expected = Array.from({ length: project.tower.floors }, (_, i) => i + 1);
  if (all.join() !== expected.join()) throw new Error('floors 1..N must be covered exactly once');
}

function unitPrice(type, facades, floor, firstFloor, pricing) {
  const floorFactor = 1 + (floor - firstFloor) * pricing.floorStep;
  const facadeFactor = 1 + facades.reduce((total, side) => total + (pricing.facadePremium[side] ?? 0), 0);
  return Math.round((type.basePrice * floorFactor * facadeFactor) / pricing.roundTo) * pricing.roundTo;
}

// Sabit tohumla karıştırıp oranlara göre durum dağıtır: her çalıştırmada aynı sonuç.
function assignStatuses(units, demo) {
  const rng = createRng(`${demo.seed}:status`);
  const order = units.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const entries = Object.entries(demo.statusMix);
  let cursor = 0;
  entries.forEach(([status, share], i) => {
    const count = i === entries.length - 1 ? order.length - cursor : Math.round(share * order.length);
    order.slice(cursor, cursor + count).forEach((index) => {
      units[index].status = status;
    });
    cursor += count;
  });
}

function buildUnits(project) {
  const types = project.unitTypes;
  const firstFloor = Math.min(...project.floorLayouts.map((layout) => layout.floors[0]));
  const units = [];

  project.floorLayouts.forEach((layout) => {
    for (let floor = layout.floors[0]; floor <= layout.floors[1]; floor += 1) {
      layout.units.forEach((placement) => {
        const type = types[placement.type];
        const facades = type.facades.map((side) => (placement.mirror ? MIRRORED_SIDE[side] : side));
        units.push({
          id: `${floor}-${placement.slot}`,
          floor,
          slot: placement.slot,
          type: placement.type,
          price: unitPrice(type, facades, floor, firstFloor, project.pricing),
          status: null,
        });
      });
    }
  });

  assignStatuses(units, project.demo);
  return units;
}

function serialize(units) {
  const lines = units.map((unit) => `    ${JSON.stringify(unit)}`);
  return `{\n  "units": [\n${lines.join(',\n')}\n  ]\n}\n`;
}

function report(units) {
  const count = (key) =>
    units.reduce((acc, unit) => ({ ...acc, [unit[key]]: (acc[unit[key]] ?? 0) + 1 }), {});
  const prices = units.map((unit) => unit.price);
  console.log(`units: ${units.length}`);
  console.log('by type:', count('type'));
  console.log('by status:', count('status'));
  console.log(`price range: $${Math.min(...prices)} – $${Math.max(...prices)}`);
}

async function main() {
  const projectId = process.argv[2];
  if (!projectId) throw new Error('usage: node tools/generate-units.mjs <projectId>');

  const base = new URL(`../projects/${projectId}/`, import.meta.url);
  const project = JSON.parse(await readFile(new URL('project.json', base), 'utf8'));

  Object.entries(project.unitTypes).forEach(([code, type]) => validateType(code, type));
  project.floorLayouts.forEach((layout) => validateLayout(layout, project.unitTypes));
  validateFloors(project);

  const units = buildUnits(project);
  await writeFile(new URL(project.data?.units ?? 'units.json', base), serialize(units));
  report(units);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
