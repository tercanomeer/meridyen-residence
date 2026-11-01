// Oda render'ları. Bir oda render'ı ya doğrudan tanımlanır ({ src, small, size, focus })
// ya da proje kütüphanesindeki (project.renders) bir görsele başvurur: "ad" veya { use: "ad", mirror?, focus? }.
// Böylece aynı görsel benzer odalarda tekrar kullanılır; mirror: true görseli yatay çevirir (doğu ↔ batı).
// Bir render'ın dikey ekranlar için ayrı sürümü olabilir: portrait: { src, small, size, focus? }.

export function resolveRender(project, render) {
  if (!render) return null;
  const entry = typeof render === 'string' ? { use: render } : render;
  if (!entry.use) return entry.src ? entry : null;
  const base = project.renders?.[entry.use];
  if (!base?.src) {
    console.warn(`[renders] bilinmeyen render: ${entry.use}`);
    return null;
  }
  const { use, ...overrides } = entry;
  return { ...base, ...overrides };
}

// Dikey kutuda (telefon, dikey tablet) dikey sürüm varsa onu, yoksa asıl render'ı döndürür.
export function renderForBox(render, { width, height }) {
  if (!render?.portrait?.src || width >= height) return render;
  const { portrait, ...base } = render;
  return { ...base, focus: [0.5, 0.5], ...portrait };
}
