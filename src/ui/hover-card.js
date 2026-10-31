// Bir alanın yanında açılan küçük bilgi kartı.
// İçerik: { id, title, meta, price: { label?, value } | null, note, status: { key, text } | null, action }.
// Kart fareyi geçirir; yalnızca eylem düğmesi tıklanır.

import { fadeIn, fadeOut, glideTo } from '../motion.js';

const GAP = 10;
const EDGE = 12;

export function createHoverCard({ onAction }) {
  const element = document.createElement('div');
  element.className = 'hover-card';
  element.hidden = true;
  element.innerHTML = `
    <p class="hover-card__title"></p>
    <p class="hover-card__meta"></p>
    <p class="hover-card__price"><span></span><strong></strong></p>
    <p class="hover-card__note"></p>
    <span class="status-chip"></span>
    <button type="button" class="hover-card__action"></button>`;

  const [title, meta, price, note, status, action] = element.children;
  let content = null;

  action.addEventListener('click', () => {
    if (content) onAction?.(content.id);
  });

  const fill = (node, text) => {
    node.textContent = text ?? '';
    node.hidden = !text;
  };

  function render() {
    fill(title, content.title);
    fill(meta, content.meta);
    fill(note, content.note);
    fill(action, content.action);
    price.hidden = !content.price;
    if (content.price) {
      fill(price.firstChild, content.price.label);
      price.lastChild.textContent = content.price.value;
    }
    fill(status, content.status?.text);
    if (content.status) status.dataset.status = content.status.key;
  }

  // anchor ve bounds sahneye göreli piksel kutuları; kart alanın sağına, sığmazsa soluna konur.
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
    show(nextContent, anchor, bounds) {
      const wasHidden = element.hidden;
      content = nextContent;
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
    update(nextContent) {
      if (element.hidden || !content || nextContent.id !== content.id) return;
      content = nextContent;
      render();
    },
    hide() {
      if (element.hidden) return;
      content = null;
      fadeOut(element, () => {
        if (!content) element.hidden = true;
      });
    },
    get isOpen() {
      return !element.hidden;
    },
    get currentId() {
      return content?.id ?? null;
    },
  };
}

// Bir öğenin kutusunu sahneye göreli olarak verir.
export function relativeBox(node, stage) {
  const box = stage.getBoundingClientRect();
  const rect = node.getBoundingClientRect();
  return { left: rect.left - box.left, right: rect.right - box.left, top: rect.top - box.top, height: rect.height };
}
