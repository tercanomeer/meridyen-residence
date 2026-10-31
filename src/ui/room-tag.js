// Planda vurgulanan odanın adını gösteren küçük etiket (odanın üstünde ortalanır).

export function createRoomTag() {
  const element = document.createElement('div');
  element.className = 'room-tag';
  element.hidden = true;
  element.innerHTML = '<span class="room-tag__name"></span><span class="room-tag__area"></span>';
  const [name, area] = element.children;

  return {
    element,
    show({ title, meta }, anchor, bounds) {
      name.textContent = title;
      area.textContent = meta;
      element.hidden = false;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const left = Math.min(Math.max(8, anchor.left + (anchor.right - anchor.left) / 2 - width / 2), bounds.width - width - 8);
      const top = Math.max(8, anchor.top + anchor.height / 2 - height / 2);
      Object.assign(element.style, { left: `${left}px`, top: `${top}px` });
    },
    hide() {
      element.hidden = true;
    },
  };
}
