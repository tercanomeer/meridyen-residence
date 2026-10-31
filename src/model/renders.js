// Oda render'ları. Bir oda render'ı ya doğrudan tanımlanır ({ src, small, size, focus })
// ya da proje kütüphanesindeki (project.renders) bir görsele başvurur: "ad" veya { use: "ad", mirror?, focus? }.
// Böylece aynı görsel benzer odalarda tekrar kullanılır; mirror: true görseli yatay çevirir (doğu ↔ batı).

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
