// Randevu formu gönderimine tek erişim noktası. Demo modunda hiçbir yere gönderilmez.

export async function submitLead(project, lead) {
  const mode = project.leads?.mode ?? 'demo';
  if (mode === 'demo') return { ok: true, demo: true };
  throw new Error(`lead mode "${mode}" is not implemented yet`);
}
