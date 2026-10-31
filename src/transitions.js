// Ekranlar arası geçişler (GSAP).
//   in:   giden ekran seçilen kata / daireye / odaya yakınlaşarak kaybolur, yeni ekran belirir (~1,2 sn).
//   out:  geri dönüş; üst ekran geldiğimiz yere yakınlaşmış başlar ve geri açılır, giden ekran küçülerek solar.
//   fade: ilişkisiz geçişler.
// prefers-reduced-motion açıksa her geçiş sade bir solmadır. Bitince giden ekran DOM'dan kaldırılır.

import { getGsap, prefersReducedMotion } from './motion.js';

const DURATION = 1.2;
const FADE = 0.4;
let running = null;

function anchorRect(view, key) {
  if (key === null || key === undefined) return null;
  const hit = view.querySelector(`.hotspot__hit[data-key="${CSS.escape(String(key))}"]`);
  const shape = hit?.parentNode.querySelector('.hotspot__shape') ?? hit;
  const rect = shape?.getBoundingClientRect();
  return rect && rect.width > 0 && rect.height > 0 ? rect : null;
}

// Hedef alan ekranın büyük kısmını kaplayana kadar yakınlaş.
function zoomFor(rect) {
  const fit = Math.min(window.innerWidth / rect.width, window.innerHeight / rect.height) * 0.85;
  return Math.min(6, Math.max(1.6, fit));
}

function originWithin(element, rect) {
  const box = element.getBoundingClientRect();
  return `${rect.left + rect.width / 2 - box.left}px ${rect.top + rect.height / 2 - box.top}px`;
}

export function transitionScreens({ outgoing, incoming, direction = 'fade', anchorKey = null }) {
  running?.progress(1);
  running = null;
  if (!outgoing) return;

  // Giden ekran olduğu yerde sabitlenir; yeni ekran sayfanın başından başlar.
  outgoing.classList.add('screen--leaving');
  outgoing.style.top = `${-window.scrollY}px`;
  window.scrollTo(0, 0);

  const gsap = getGsap();
  const finish = () => {
    running = null;
    outgoing.remove();
    gsap?.set(incoming, { clearProps: 'transform,transformOrigin,opacity,zIndex,willChange' });
  };
  if (!gsap) {
    finish();
    return;
  }

  const rect = direction === 'fade' ? null : anchorRect(direction === 'in' ? outgoing : incoming, anchorKey);
  const mode = prefersReducedMotion() || !rect ? 'fade' : direction;
  const timeline = gsap.timeline({ onComplete: finish });

  if (mode === 'in') {
    const scale = zoomFor(rect);
    gsap.set(outgoing, { zIndex: 2, willChange: 'transform', transformOrigin: originWithin(outgoing, rect) });
    timeline
      .to(outgoing, { scale, duration: DURATION, ease: 'power2.in' }, 0)
      .to(outgoing, { opacity: 0, duration: DURATION * 0.45, ease: 'power1.in' }, DURATION * 0.55)
      .fromTo(incoming, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: DURATION * 0.55, ease: 'power2.out' }, DURATION * 0.45);
  } else if (mode === 'out') {
    const scale = zoomFor(rect);
    gsap.set(incoming, { zIndex: 2, willChange: 'transform', transformOrigin: originWithin(incoming, rect) });
    timeline
      .fromTo(incoming, { scale, opacity: 0 }, { scale: 1, duration: DURATION, ease: 'power2.out' }, 0)
      .to(incoming, { opacity: 1, duration: DURATION * 0.5, ease: 'power1.out' }, 0)
      .to(outgoing, { scale: 0.92, opacity: 0, duration: DURATION * 0.5, ease: 'power1.in' }, 0);
  } else {
    timeline
      .fromTo(incoming, { opacity: 0 }, { opacity: 1, duration: FADE, ease: 'power1.out' }, 0)
      .to(outgoing, { opacity: 0, duration: FADE * 0.75, ease: 'power1.in' }, 0);
  }
  running = timeline;
}
