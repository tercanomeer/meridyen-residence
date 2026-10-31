// Hangi ekranın açık olduğunu state'ten (floor, unit, room) çıkarır; değişince eskisini söküp yenisini kurar.
// Aynı dairenin odaları arasında geçiş oda ekranının içinde olur. Geri dönüşte önceki kat/daire/oda
// vurgulu açılır; klavye odağı yeni ekranın başlığına taşınır.

import { getState, subscribe } from '../state.js';
import { screenIn } from '../motion.js';
import { renderTower } from './tower.js';
import { renderFloor } from './floor.js';
import { renderUnitPlan } from './unit-plan.js';
import { renderRoom } from './room.js';

function screenKey({ floor, unit, room }) {
  if (floor === null) return 'tower';
  if (unit === null) return `floor:${floor}`;
  if (room === null) return `unit:${floor}/${unit}`;
  return `room:${floor}/${unit}`;
}

export function mountScreens(container, data) {
  let key = null;
  let cleanup = null;
  let previous = { floor: null, unit: null, room: null };

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
      const focusUnit = previous.floor === state.floor ? previous.unit : null;
      cleanup = renderFloor(view, { ...data, floor: state.floor, focusUnit });
    } else if (state.room === null) {
      const focusRoom = previous.unit === state.unit ? previous.room : null;
      cleanup = renderUnitPlan(view, { ...data, floor: state.floor, unitId: state.unit, focusRoom });
    } else {
      cleanup = renderRoom(view, { ...data, floor: state.floor, unitId: state.unit });
    }
    previous = { floor: state.floor, unit: state.unit, room: state.room };

    if (!isFirst) {
      window.scrollTo(0, 0);
      screenIn(view);
      view.querySelector('[data-autofocus]')?.focus({ preventScroll: true });
    }
  }

  subscribe((state, changed) => {
    if (['floor', 'unit', 'room'].some((field) => changed.includes(field))) show(state);
    if (changed.includes('room')) previous.room = state.room ?? previous.room;
  });
  show(getState());
}
