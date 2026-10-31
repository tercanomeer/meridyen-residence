// Kat özeti etiketi: kat no, daire sayısı, müsait sayısı, başlangıç fiyatı ve "İncele".

import { t, localize } from '../i18n.js';
import { formatPrice } from '../currency.js';
import { fadeIn, fadeOut, glideTo } from '../motion.js';

const GAP = 10;
const EDGE = 12;

export function createFloorLabel({ onExplore }) {
  const element = document.createElement('div');
  element.className = 'floor-label';
  element.hidden = true;
  element.innerHTML = `
    <p class="floor-label__title"></p>
    <p class="floor-label__meta"></p>
    <p class="floor-label__price"></p>
    <button type="button" class="floor-label__explore"></button>`;

  const [title, meta, price, explore] = element.children;
  let summary = null;

  explore.addEventListener('click', () => {
    if (summary) onExplore(summary.floor);
  });

  function render() {
    title.textContent = t('tower.floorTitle', { floor: summary.floor });
    explore.textContent = t('tower.explore');

    if (summary.kind === 'amenity') {
      meta.textContent = localize(summary.amenity.label);
      price.textContent = localize(summary.amenity.features?.[0]);
      price.dataset.tone = 'muted';
      explore.hidden = true;
      return;
    }

    meta.textContent = `${t('tower.unitCount', { count: summary.total })} · ${t('tower.availableCount', { count: summary.available })}`;
    explore.hidden = false;
    if (summary.fromPrice !== null) {
      price.dataset.tone = 'price';
      price.innerHTML = '<span></span><strong></strong>';
      price.firstChild.textContent = t('tower.startingFrom');
      price.lastChild.textContent = formatPrice(summary.fromPrice);
    } else {
      price.dataset.tone = 'muted';
      price.textContent = t(summary.soldOut ? 'tower.soldOut' : 'tower.noneAvailable');
    }
  }

  // anchor ve bounds sahneye göreli piksel kutuları; etiket katın sağına, sığmazsa soluna konur.
  function place(anchor, bounds) {
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    let left = anchor.right + GAP;
    if (left + width > bounds.width - EDGE) left = anchor.left - GAP - width;
    if (left < EDGE) left = Math.min(Math.max(EDGE, anchor.right + GAP), bounds.width - width - EDGE);
    const centre = anchor.top + anchor.height / 2 - height / 2;
    const top = Math.min(Math.max(bounds.top, centre), bounds.height - height - EDGE);
    return { left, top };
  }

  return {
    element,
    show(nextSummary, anchor, bounds) {
      const wasHidden = element.hidden;
      summary = nextSummary;
      element.hidden = false;
      render();
      const position = place(anchor, bounds);
      if (wasHidden) {
        Object.assign(element.style, { left: `${position.left}px`, top: `${position.top}px` });
        fadeIn(element, { y: 6 });
      } else {
        glideTo(element, position);
      }
    },
    refresh() {
      if (summary && !element.hidden) render();
    },
    hide() {
      if (element.hidden) return;
      summary = null;
      fadeOut(element, () => {
        if (!summary) element.hidden = true;
      });
    },
    get isOpen() {
      return !element.hidden;
    },
  };
}
