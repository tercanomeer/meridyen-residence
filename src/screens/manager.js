// Hangi ekranın açık olduğunu state'ten (floor, unit) çıkarır; değişince eskisini söküp yenisini kurar.
// Geri dönüşte önceki kat/daire vurgulu açılır; klavye odağı yeni ekranın başlığına taşınır.

import { getState, subscribe } from '../state.js';
import { screenIn } from '../motion.js';
import { renderTower } from './tower.js';
import { renderFloor } from './floor.js';
import { renderUnitPlan } from './unit-plan.js';

function screenKey({ floor, unit }) {
  if (floor === null) return 'tower';
  if (unit === null) return `floor:${floor}`;
  return `unit:${floor}/${unit}`;
}

export function mountScreens(container, data) {
  let key = null;
  let cleanup = null;
  let previous = { floor: null, unit: null };

  function show(state) {
    const next = screenKey(state);
    if (next === key) return;
    const isFirst = key === null;
    cleanup?.();

    const view = document.createElement('div');
    view.className = 'screen';
    container.replaceChildren(view);
    key = next;

    if (state.floor === null) {
      cleanup = renderTower(view, { ...data, focusFloor: previous.floor });
    } else if (state.unit === null) {
      cleanup = renderFloor(view, { ...data, floor: state.floor, focusUnit: previous.floor === state.floor ? previous.unit : null });
    } else {
      cleanup = renderUnitPlan(view, { ...data, floor: state.floor, unitId: state.unit });
    }
    previous = { floor: state.floor, unit: state.unit };

    if (!isFirst) {
      window.scrollTo(0, 0);
      screenIn(view);
      view.querySelector('[data-autofocus]')?.focus({ preventScroll: true });
    }
  }

  subscribe((state, changed) => {
    if (changed.includes('floor') || changed.includes('unit')) show(state);
  });
  show(getState());
}
