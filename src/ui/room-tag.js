// Planda vurgulanan odanın adını gösteren küçük etiket (odanın üstünde ortalanır).
// İçi gezilebilen odalarda "İçeri gir" düğmesi de çıkar (dokunmatikte odaya giriş yolu).

export function createRoomTag({ onAction }) {
  const element = document.createElement('div');
  element.className = 'room-tag';
  element.hidden = true;
  element.innerHTML = `
    <span class="room-tag__name"></span>
    <span class="room-tag__area"></span>
    <button type="button" class="room-tag__action"></button>`;
  const [name, area, action] = element.children;
  let currentId = null;

  action.addEventListener('click', () => {
    if (currentId !== null) onAction(currentId);
  });

  return {
    element,
    show({ id, title, meta, action: actionLabel }, anchor, bounds) {
      currentId = id;
      name.textContent = title;
      area.textContent = meta;
      action.textContent = actionLabel ?? '';
      action.hidden = !actionLabel;
      element.hidden = false;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const left = Math.min(Math.max(8, anchor.left + (anchor.right - anchor.left) / 2 - width / 2), bounds.width - width - 8);
      const top = Math.max(8, anchor.top + anchor.height / 2 - height / 2);
      Object.assign(element.style, { left: `${left}px`, top: `${top}px` });
    },
    hide() {
      currentId = null;
      element.hidden = true;
    },
  };
}
