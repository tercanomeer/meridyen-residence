// Uygulama durumunun tek kaynağı. Diğer modüller buradan okur, buraya yazar.

const state = {
  lang: null,
  currency: null,
  floor: null,
  unit: null,
  room: null,
  onlyAvailable: false,
};

const listeners = new Set();

export function getState() {
  return { ...state };
}

export function setState(patch) {
  const changed = Object.keys(patch).filter((key) => state[key] !== patch[key]);
  if (changed.length === 0) return;
  Object.assign(state, patch);
  const snapshot = getState();
  listeners.forEach((listener) => listener(snapshot, changed));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
