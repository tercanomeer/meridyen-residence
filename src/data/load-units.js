// Satış verisine tek erişim noktası. Kaynak project.json'daki data.source: json | sheets | supabase.

import { projectUrl } from './load-project.js';

const sources = {
  async json(project) {
    const response = await fetch(projectUrl(project.id, project.data?.units ?? 'units.json'));
    if (!response.ok) throw new Error(`units.json: ${response.status}`);
    const data = await response.json();
    return data.units ?? [];
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
  return load(project);
}
