// Daire listesi üzerinde sorgular.

export function unitsOnFloor(units, floor) {
  return units.filter((unit) => unit.floor === floor).sort((a, b) => a.slot - b.slot);
}

export function findUnit(units, id) {
  return units.find((unit) => unit.id === id) ?? null;
}

// Aynı tipte müsait daireler; yoksa aynı oda düzeninde. Kata yakınlığa, sonra fiyata göre.
export function similarUnits(project, units, unit, limit = 5) {
  const layout = project.unitTypes[unit.type]?.layout;
  const candidates = units.filter((other) => other.id !== unit.id && other.status === 'available');
  const sameType = candidates.filter((other) => other.type === unit.type);
  const pool = sameType.length ? sameType : candidates.filter((other) => project.unitTypes[other.type]?.layout === layout);
  return pool
    .sort((a, b) => Math.abs(a.floor - unit.floor) - Math.abs(b.floor - unit.floor) || a.price - b.price)
    .slice(0, limit);
}
