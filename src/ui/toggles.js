// Sağ üstteki TR/EN ve USD/TL düğmeleri.

import { LANGUAGES, setLang } from '../i18n.js';
import { availableCurrencies, setCurrency } from '../currency.js';
import { subscribe } from '../state.js';

export function mountToggles(container) {
  const groups = [
    buildGroup({
      stateKey: 'lang',
      labelKey: 'toggle.language',
      onSelect: setLang,
      options: LANGUAGES.map((code) => ({
        value: code,
        textKey: `language.${code}`,
        nameKey: `language.${code}Name`,
        lang: code,
      })),
    }),
    buildGroup({
      stateKey: 'currency',
      labelKey: 'toggle.currency',
      onSelect: setCurrency,
      options: availableCurrencies().map((code) => ({
        value: code,
        textKey: `currency.${code}`,
        nameKey: `currency.${code}Name`,
      })),
    }),
  ];

  container.replaceChildren(...groups.map((group) => group.element));
  const sync = (state) => groups.forEach((group) => group.sync(state[group.stateKey]));

  subscribe((state, changed) => {
    if (changed.includes('lang') || changed.includes('currency')) sync(state);
  });
  return sync;
}

function buildGroup({ stateKey, labelKey, onSelect, options }) {
  const element = document.createElement('div');
  element.className = 'segmented';
  element.setAttribute('role', 'group');
  element.dataset.i18nAttr = `aria-label:${labelKey}`;

  const buttons = options.map((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'segmented__option';
    button.value = option.value;
    button.dataset.i18n = option.textKey;
    button.dataset.i18nAttr = `title:${option.nameKey}`;
    if (option.lang) button.lang = option.lang;
    button.addEventListener('click', () => onSelect(option.value));
    return button;
  });
  element.append(...buttons);

  const sync = (current) => {
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.value === current)));
  };
  return { element, stateKey, sync };
}
