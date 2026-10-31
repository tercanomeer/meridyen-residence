// localStorage erişimi. Gizli pencere veya engellenmiş depolamada sessizce vazgeçer.

const PREFIX = 'site.';

export function readPref(key) {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writePref(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Depolama yoksa seçim yalnızca bu oturumda geçerli kalır.
  }
}
