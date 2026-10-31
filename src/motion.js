// Animasyon yardımcıları. GSAP index.html'de CDN'den yüklenir (window.gsap).
// prefers-reduced-motion açıksa geçişler sade bir solmaya iner.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefersReducedMotion() {
  return reducedMotion.matches;
}

export function getGsap() {
  return window.gsap ?? null;
}

// Ekran geçişi. Sonraki fazda yazılacak.
export function transitionScreen(outgoing, incoming) {}
