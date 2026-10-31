// Satış verisine tek erişim noktası. Kaynak project.json'daki data.source: json | sheets | supabase.
// Her kaynak ham satır listesi döndürür; burada tek biçime getirilir ve projeye göre denetlenir.

import { projectUrl } from './load-project.js';

export const STATUSES = ['available', 'reserved', 'sold'];

const sources = {
  async json(project) {
    const response = await fetch(projectUrl(project.id, project.data?.units ?? 'units.json'));
    if (!response.ok) throw new Error(`units.json: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data.units) ? data.units : [];
  },
  async sheets() {
    throw new Error('units source "sheets" is not implemented yet');
  },
  async supabase() {
    throw new Error('units source "supabase" is not implemented yet');
  },
};

export async function loadUnits(project) {
  const source = project.data?.source ?? 'json';
  const load = sources[source];
  if (!load) throw new Error(`unknown units source: ${source}`);

  const rows = await load(project);
  const slots = slotIndex(project);
  const seen = new Set();

  return rows
    .map((row) => normalize(row))
    .filter((unit) => {
      const problem = checkUnit(unit, project, slots, seen);
      if (problem) console.warn(`[units] skipped ${unit.id || '?'}: ${problem}`);
      seen.add(unit.id);
      return !problem;
    })
    .sort((a, b) => a.floor - b.floor || a.slot - b.slot);
}

function normalize(row) {
  const status = String(row.status ?? '').trim().toLowerCase();
  return {
    id: String(row.id ?? '').trim(),
    floor: Number(row.floor),
    slot: Number(row.slot),
    type: String(row.type ?? '').trim(),
    price: Number(row.price),
    // Bilinmeyen durum satışa açık gösterilmez.
    status: STATUSES.includes(status) ? status : 'reserved',
  };
}

// "kat:slot" → o konumdaki tip kodu, project.json'daki floorLayouts'tan.
function slotIndex(project) {
  const index = new Map();
  (project.floorLayouts ?? []).forEach(({ floors: [from, to], units }) => {
    for (let floor = from; floor <= to; floor += 1) {
      units.forEach(({ slot, type }) => index.set(`${floor}:${slot}`, type));
    }
  });
  return index;
}

function checkUnit(unit, project, slots, seen) {
  if (!unit.id) return 'missing id';
  if (seen.has(unit.id)) return 'duplicate id';
  if (!project.unitTypes?.[unit.type]) return `unknown type ${unit.type}`;
  const expectedType = slots.get(`${unit.floor}:${unit.slot}`);
  if (!expectedType) return `no slot ${unit.slot} on floor ${unit.floor}`;
  if (expectedType !== unit.type) return `slot holds type ${expectedType}, not ${unit.type}`;
  if (!Number.isFinite(unit.price) || unit.price <= 0) return 'invalid price';
  return null;
}
