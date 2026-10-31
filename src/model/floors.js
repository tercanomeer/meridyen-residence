// Kat düzeyindeki bilgiler: kat özetleri ve kule görseli için plaka/teras bilgisi.

export function summarizeFloors(project, units) {
  const amenities = new Map((project.tower.amenityFloors ?? []).map((entry) => [entry.floor, entry]));
  const byFloor = new Map();
  units.forEach((unit) => {
    if (!byFloor.has(unit.floor)) byFloor.set(unit.floor, []);
    byFloor.get(unit.floor).push(unit);
  });

  const summaries = new Map();
  for (let floor = 1; floor <= project.tower.floors; floor += 1) {
    const amenity = amenities.get(floor);
    if (amenity) {
      summaries.set(floor, { floor, kind: 'amenity', amenity, total: 0, available: 0, soldOut: false, fromPrice: null });
      continue;
    }
    const list = byFloor.get(floor) ?? [];
    const available = list.filter((unit) => unit.status === 'available');
    const sold = list.filter((unit) => unit.status === 'sold').length;
    summaries.set(floor, {
      floor,
      kind: 'residential',
      total: list.length,
      available: available.length,
      soldOut: list.length > 0 && sold === list.length,
      fromPrice: available.length ? Math.min(...available.map((unit) => unit.price)) : null,
    });
  }
  return summaries;
}

// En çok katta kullanılan plaka [genişlik, derinlik].
export function typicalPlate(project) {
  const weights = new Map();
  project.floorLayouts.forEach(({ plate, floors: [from, to] }) => {
    const key = plate.join('x');
    weights.set(key, (weights.get(key) ?? 0) + to - from + 1);
  });
  const [best] = [...weights.entries()].sort((a, b) => b[1] - a[1])[0];
  return best.split('x').map(Number);
}

// Teraslı daire tipi bulunan katlar.
export function terraceFloors(project) {
  const hasTerrace = (code) => project.unitTypes[code]?.rooms.some((room) => room.kind === 'terrace');
  return project.floorLayouts
    .filter((layout) => layout.units.some((placement) => hasTerrace(placement.type)))
    .flatMap(({ floors: [from, to] }) => Array.from({ length: to - from + 1 }, (_, i) => from + i));
}
