// Hangi ekranın açık olduğunu state'ten (floor, unit, room) çıkarır; değişince yenisini kurar ve
// transitions.js ile geçiş yapar. Aynı dairenin odaları arası geçiş oda ekranının içinde olur.
// Geri dönüşte önceki kat/daire/oda vurgulu açılır; klavye odağı yeni ekranın başlığına taşınır.

import { getState, subscribe } from '../state.js';
import { transitionScreens } from '../transitions.js';
import { renderTower } from './tower.js';
import { renderFloor } from './floor.js';
import { renderUnitPlan } from './unit-plan.js';
import { renderRoom } from './room.js';

const depth = ({ floor, unit, room }) => (floor === null ? 0 : unit === null ? 1 : room === null ? 2 : 3);
const keyAt = (state, level) => [null, state.floor, state.unit, state.room][level];

function screenKey(state) {
  return ['tower', `floor:${state.floor}`, `unit:${state.floor}/${state.unit}`, `room:${state.floor}/${state.unit}`][depth(state)];
}

// a, b'nin üst seviyesi mi? (b, a'nın içine girilerek ulaşılan ekran)
function contains(a, b) {
  return depth(b) === depth(a) + 1 && (a.floor === null || a.floor === b.floor) && (a.unit === null || a.unit === b.unit);
}

function relation(previous, next) {
  if (contains(previous, next)) return { direction: 'in', anchorKey: keyAt(next, depth(next)) };
  if (contains(next, previous)) return { direction: 'out', anchorKey: keyAt(previous, depth(previous)) };
  return { direction: 'fade' };
}

export function mountScreens(container, data) {
  let key = null;
  let cleanup = null;
  let view = null;
  let previous = { floor: null, unit: null, room: null };

  function render(target, state) {
    if (state.floor === null) return renderTower(target, { ...data, focusFloor: previous.floor });
    if (state.unit === null) {
      const focusUnit = previous.floor === state.floor ? previous.unit : null;
      return renderFloor(target, { ...data, floor: state.floor, focusUnit });
    }
    if (state.room === null) {
      const focusRoom = previous.unit === state.unit ? previous.room : null;
      return renderUnitPlan(target, { ...data, floor: state.floor, unitId: state.unit, focusRoom });
    }
    return renderRoom(target, { ...data, floor: state.floor, unitId: state.unit });
  }

  function show(state) {
    const next = screenKey(state);
    if (next === key) return;
    cleanup?.();

    const outgoing = view;
    view = document.createElement('div');
    view.className = 'screen';
    container.append(view);
    key = next;
    cleanup = render(view, state);

    if (outgoing) {
      transitionScreens({ outgoing, incoming: view, ...relation(previous, state) });
      view.querySelector('[data-autofocus]')?.focus({ preventScroll: true });
    }
    previous = { floor: state.floor, unit: state.unit, room: state.room };
  }

  subscribe((state, changed) => {
    if (['floor', 'unit', 'room'].some((field) => changed.includes(field))) show(state);
    if (changed.includes('room') && state.room !== null) previous.room = state.room;
  });
  show(getState());
}
