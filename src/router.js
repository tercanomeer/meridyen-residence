// Hash yönlendirme: #kat-19, #kat-19/19-2, #kat-19/19-2/salon ↔ state (floor, unit, room).

import { setState } from './state.js';

const FLOOR_PATTERN = /^kat-(\d+)$/;

export function parseHash(hash) {
  const parts = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  const match = FLOOR_PATTERN.exec(parts[0] ?? '');
  if (!match) return { floor: null, unit: null, room: null };
  return { floor: Number(match[1]), unit: parts[1] ?? null, room: parts[2] ?? null };
}

export function buildHash({ floor = null, unit = null, room = null } = {}) {
  if (floor === null) return '';
  const parts = [`kat-${floor}`, unit, room].filter(Boolean).map((part) => encodeURIComponent(part));
  return `#${parts.join('/')}`;
}

function sync() {
  setState(parseHash(window.location.hash));
}

export function initRouter() {
  window.addEventListener('hashchange', sync);
  sync();
}

export function navigate(route) {
  const hash = buildHash(route);
  if (hash === window.location.hash) return;
  if (hash) {
    window.location.hash = hash;
  } else {
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    sync();
  }
}
