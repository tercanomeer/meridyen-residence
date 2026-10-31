// Para birimi: fiyatlar USD tutulur, TL karşılığı project.json'daki kurla hesaplanır.
// Fiyat gösteren her yer formatPrice() kullanır.

import { getState, setState } from './state.js';
import { readPref, writePref } from './storage.js';
import { getLocale } from './i18n.js';

const SYMBOLS = { USD: '$', TRY: '₺' };
export const CURRENCY_CODES = Object.keys(SYMBOLS);
const BASE = 'USD';
const STORAGE_KEY = 'currency';

let rates = { [BASE]: 1 };

export function initCurrency(config = {}) {
  rates = { ...config.rates, [BASE]: 1 };
  const saved = readPref(STORAGE_KEY);
  const fallback = isAvailable(config.default) ? config.default : BASE;
  setState({ currency: isAvailable(saved) ? saved : fallback });
}

function isAvailable(code) {
  return code in SYMBOLS && Number.isFinite(rates[code]);
}

export function availableCurrencies() {
  return CURRENCY_CODES.filter(isAvailable);
}

export function setCurrency(code) {
  if (!isAvailable(code)) return;
  writePref(STORAGE_KEY, code);
  setState({ currency: code });
}

export function getCurrency() {
  return getState().currency ?? BASE;
}

export function convert(usd, code = getCurrency()) {
  return usd * rates[code];
}

// 890000 → "$890.000" veya "₺37.825.000" (binlik ayraç seçili dilin yerel ayarından).
export function formatPrice(usd, code = getCurrency()) {
  if (!Number.isFinite(usd) || !isAvailable(code)) return '';
  const amount = Math.round(convert(usd, code));
  const digits = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(amount);
  return SYMBOLS[code] + digits;
}
