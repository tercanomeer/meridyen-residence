// Hash yönlendirme: #kat-19, #kat-19/19-2, #kat-19/19-2/salon ↔ state (floor, unit, room).
// Her geçiş tarayıcı geçmişine yazılır; geri tuşu ve Esc bir üst seviyeye döner.

import { getState, setState } from './state.js';

const FLOOR_PATTERN = /^kat-(\d+)$/;
const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

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

// Bir üst seviye: oda → daire planı → kat → kule.
export function parentRoute({ floor, unit, room }) {
  if (room !== null) return { floor, unit };
  if (unit !== null) return { floor };
  if (floor !== null) return {};
  return null;
}

// replace: geçmişe yeni kayıt eklemeden adresi değiştirir (geçersiz adres düzeltmeleri için).
export function navigate(route, { replace = false } = {}) {
  const hash = buildHash(route);
  if (hash === window.location.hash) return;
  const url = hash || window.location.pathname + window.location.search;
  // Yer değiştirmede geldiğimiz yer korunur (aynı dairede odalar arası geçiş geçmişi doldurmaz).
  const entry = { from: replace ? (window.history.state?.from ?? null) : window.location.hash };
  if (replace) window.history.replaceState(entry, '', url);
  else window.history.pushState(entry, '', url);
  sync();
}

// Önceki kayıt zaten üst seviyeyse tarayıcı geçmişinde geri gidilir; böylece Esc ve geri tuşu tutarlı kalır.
export function goBack() {
  const parent = parentRoute(getState());
  if (!parent) return false;
  if (window.history.state?.from === buildHash(parent)) window.history.back();
  else navigate(parent);
  return true;
}

export function initRouter() {
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);
  // Ekranlar kendi Esc işlerini (kart, alt kart kapatma) document'ta yapar ve preventDefault ile bildirir.
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented || TYPING.has(event.target?.tagName)) return;
    if (goBack()) event.preventDefault();
  });
  sync();
}
