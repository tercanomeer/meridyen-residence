// Görselin üstündeki tıklama alanları (noktalar 0–1).
// Fare: üzerine gelince vurgu, tıklayınca içeri. Dokunma: dokunuş ve parmak kaydırma yalnızca vurgular;
// içeri giriş etiketteki düğmeyle olur. Klavye: oklar gezer, Enter içeri girer.

import { svgEl, toPoints } from '../visuals/svg.js';

const NEXT_KEYS = ['ArrowUp', 'ArrowRight'];
const PREV_KEYS = ['ArrowDown', 'ArrowLeft'];

export function createHotspotLayer({ viewBox: [vw, vh], items, label, onPreview, onActivate, onLeave }) {
  const element = svgEl('svg', {
    class: 'hotspots',
    viewBox: `0 0 ${vw} ${vh}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'group',
    'aria-label': label,
    tabindex: '-1',
  });
  // Tek çokgen ya da çokgen listesi → path verisi (L biçimli daireler birden çok parçadan oluşur).
  const toPath = (points) => {
    const polygons = Array.isArray(points[0]?.[0]) ? points : [points];
    return polygons.map((polygon) => `M${toPoints(polygon.map(([x, y]) => [x * vw, y * vh])).replaceAll(' ', 'L')}Z`).join('');
  };
  const nodes = new Map();
  let activeKey = null;
  let lastPointer = 'mouse';
  let scrubbing = false;

  items.forEach((item) => {
    const key = String(item.id);
    const outline = toPath(item.outline ?? item.points);
    const shape = svgEl('path', { class: 'hotspot__shape', d: outline });
    const hit = svgEl('path', { class: 'hotspot__hit', d: toPath(item.points), role: 'button', tabindex: '-1' });
    hit.dataset.key = key;
    const group = svgEl('g', { class: 'hotspot' }, [svgEl('path', { class: 'hotspot__dim', d: outline }), shape, hit]);
    element.append(group);
    nodes.set(key, { item, group, shape, hit });
  });
  const order = [...nodes.keys()];

  const keyOf = (target) => target?.closest?.('.hotspot__hit')?.dataset.key ?? null;
  const idOf = (key) => nodes.get(key).item.id;
  const enabledKeys = () => order.filter((key) => !nodes.get(key).item.disabled);

  function syncTabStop() {
    const enabled = enabledKeys();
    const stop = enabled.includes(activeKey) ? activeKey : enabled[0];
    nodes.forEach((node, key) => node.hit.setAttribute('tabindex', key === stop ? '0' : '-1'));
  }

  function setActive(id, { focus = false, silent = false } = {}) {
    const key = id == null ? null : String(id);
    if (key !== null && (!nodes.has(key) || nodes.get(key).item.disabled)) return;
    const changed = key !== activeKey;
    if (activeKey) nodes.get(activeKey).group.classList.remove('is-active');
    activeKey = key;
    if (key) nodes.get(key).group.classList.add('is-active');
    syncTabStop();
    if (key && focus) nodes.get(key).hit.focus({ preventScroll: true });
    if (changed && !silent) onPreview?.(key === null ? null : idOf(key));
  }

  function update(nextItems) {
    nextItems.forEach((item) => {
      const node = nodes.get(String(item.id));
      if (!node) return;
      node.item = item;
      node.hit.setAttribute('aria-label', item.label ?? '');
      node.hit.setAttribute('aria-disabled', String(Boolean(item.disabled)));
      node.group.classList.toggle('is-disabled', Boolean(item.disabled));
      node.group.classList.toggle('is-dimmed', Boolean(item.dimmed));
    });
    if (activeKey && nodes.get(activeKey).item.disabled) setActive(null);
    syncTabStop();
  }

  function activate(key) {
    const { item } = nodes.get(key);
    if (item.disabled || item.activatable === false) return;
    onActivate?.(item.id);
  }

  element.addEventListener('pointerdown', (event) => {
    lastPointer = event.pointerType;
    if (event.pointerType !== 'touch') return;
    scrubbing = true;
    const key = keyOf(event.target);
    setActive(key === null ? null : idOf(key));
  });

  element.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') {
      if (!scrubbing) return;
      const key = keyOf(document.elementFromPoint(event.clientX, event.clientY));
      if (key !== null) setActive(idOf(key));
      return;
    }
    const key = keyOf(event.target);
    if (key !== null) setActive(idOf(key));
  });

  const endScrub = () => {
    scrubbing = false;
  };
  element.addEventListener('pointerup', endScrub);
  element.addEventListener('pointercancel', endScrub);

  element.addEventListener('click', (event) => {
    if (lastPointer === 'touch') return;
    const key = keyOf(event.target);
    if (key !== null) activate(key);
  });

  element.addEventListener('focusin', (event) => {
    const key = keyOf(event.target);
    if (key !== null && key !== activeKey) setActive(idOf(key));
  });

  element.addEventListener('keydown', (event) => {
    const key = keyOf(event.target);
    if (key === null) return;
    const enabled = enabledKeys();
    const index = enabled.indexOf(key);
    let next = null;
    if (NEXT_KEYS.includes(event.key)) next = enabled[Math.min(index + 1, enabled.length - 1)];
    else if (PREV_KEYS.includes(event.key)) next = enabled[Math.max(index - 1, 0)];
    else if (event.key === 'Home') next = enabled[0];
    else if (event.key === 'End') next = enabled[enabled.length - 1];
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(key);
      return;
    } else return;

    event.preventDefault();
    if (next) setActive(idOf(next), { focus: true });
  });

  update(items);

  element.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'touch') onLeave?.(event);
  });

  return {
    element,
    update,
    setActive,
    anchorOf: (id) => nodes.get(String(id))?.shape ?? null,
    get activeId() {
      return activeKey === null ? null : idOf(activeKey);
    },
  };
}
