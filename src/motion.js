// Animasyon yardımcıları. GSAP index.html'de CDN'den yüklenir (window.gsap).
// prefers-reduced-motion açıksa hareket kalkar, yalnızca solma kalır. GSAP yüklenmezse anında uygulanır.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefersReducedMotion() {
  return reducedMotion.matches;
}

export function getGsap() {
  return window.gsap ?? null;
}

export function fadeIn(element, { y = 0, duration = 0.3 } = {}) {
  const gsap = getGsap();
  if (!gsap) {
    element.style.opacity = '1';
    return;
  }
  gsap.killTweensOf(element);
  gsap.fromTo(
    element,
    { opacity: 0, y: prefersReducedMotion() ? 0 : y },
    { opacity: 1, y: 0, duration, ease: 'power2.out' },
  );
}

export function fadeOut(element, onComplete) {
  const gsap = getGsap();
  if (!gsap) {
    element.style.opacity = '0';
    onComplete?.();
    return;
  }
  gsap.killTweensOf(element);
  gsap.to(element, { opacity: 0, duration: 0.18, ease: 'power1.out', onComplete });
}

// Açık bir öğeyi yeni konumuna kaydırır (left/top piksel).
export function glideTo(element, { left, top }) {
  const gsap = getGsap();
  const target = { left: `${left}px`, top: `${top}px`, opacity: 1, y: 0 };
  if (!gsap || prefersReducedMotion()) {
    gsap?.killTweensOf(element);
    Object.assign(element.style, { left: target.left, top: target.top, opacity: '1', transform: '' });
    return;
  }
  gsap.killTweensOf(element);
  gsap.to(element, { ...target, duration: 0.22, ease: 'power2.out' });
}

// Sahne açılışı: sahne solarak gelir, pencereler rastgele sırayla yanar.
export function revealScene(scene, lights) {
  const gsap = getGsap();
  if (!gsap) return;
  gsap.fromTo(scene, { opacity: 0 }, { opacity: 1, duration: prefersReducedMotion() ? 0.3 : 0.8, ease: 'power1.out' });
  if (prefersReducedMotion() || lights.length === 0) return;
  gsap.from(lights, { opacity: 0, duration: 0.5, delay: 0.3, stagger: { each: 1.2 / lights.length, from: 'random' } });
}

// Yeni ekranın girişi: hafif yükselerek solma; azaltılmış harekette yalnızca solma.
export function screenIn(element) {
  const gsap = getGsap();
  if (!gsap) return;
  gsap.fromTo(
    element,
    { opacity: 0, y: prefersReducedMotion() ? 0 : 14 },
    { opacity: 1, y: 0, duration: prefersReducedMotion() ? 0.25 : 0.5, ease: 'power2.out', clearProps: 'transform' },
  );
}

// Çok yavaş yakınlaşma (iç mekânlar). Azaltılmış harekette hiç yapılmaz. Durdurma fonksiyonu döndürür.
export function slowZoom(element, [originX, originY]) {
  const gsap = getGsap();
  if (!gsap || prefersReducedMotion()) return () => {};
  const tween = gsap.fromTo(
    element,
    { scale: 1 },
    { scale: 1.12, duration: 60, ease: 'none', transformOrigin: `${originX}px ${originY}px` },
  );
  return () => tween.kill();
}

// Yeni katmanı eskisinin üstünde belirginleştirir, sonra eskisini kaldırır.
export function crossfade(incoming, outgoing) {
  const gsap = getGsap();
  if (!gsap || !outgoing) {
    outgoing?.remove();
    return;
  }
  gsap.fromTo(
    incoming,
    { opacity: 0 },
    { opacity: 1, duration: prefersReducedMotion() ? 0.3 : 0.7, ease: 'power1.inOut', onComplete: () => outgoing.remove() },
  );
}
