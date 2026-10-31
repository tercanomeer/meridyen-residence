// HTML'deki bağlamaları seçili dile ve para birimine göre doldurur:
//   data-i18n="anahtar"                → textContent
//   data-i18n-attr="aria-label:anahtar" → öznitelik (birden çoksa ; ile ayrılır)
//   data-price-usd="890000"            → biçimlendirilmiş fiyat

import { t } from '../i18n.js';
import { formatPrice } from '../currency.js';

export function applyBindings(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((part) => part.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });

  root.querySelectorAll('[data-price-usd]').forEach((el) => {
    el.textContent = formatPrice(Number(el.dataset.priceUsd));
  });
}
