// Randevu formu gönderimine tek erişim noktası. Demo modunda hiçbir yere gönderilmez;
// gerçek bir gönderim gibi kısa bir bekleme yapıp başarı döner.

const DEMO_DELAY = 700;

export async function submitLead(project, lead) {
  const mode = project.leads?.mode ?? 'demo';
  if (mode === 'demo') {
    await new Promise((resolve) => window.setTimeout(resolve, DEMO_DELAY));
    return { ok: true, demo: true };
  }
  throw new Error(`lead mode "${mode}" is not implemented yet`);
}
