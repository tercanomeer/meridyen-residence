// Geçici karşılama ekranı: altyapıyı (dil, para birimi, veri) görünür kılar.
// Kule ekranı gelince kaldırılacak.

import { localize } from '../i18n.js';

export function renderWelcome(container, { project, units }) {
  const prices = units.filter((unit) => unit.status !== 'sold').map((unit) => unit.price);
  const startingPrice = prices.length ? Math.min(...prices) : null;

  const section = document.createElement('section');
  section.className = 'welcome';

  const title = document.createElement('h1');
  title.className = 'welcome__title';
  title.textContent = localize(project.name);

  const tagline = document.createElement('p');
  tagline.className = 'welcome__tagline';
  tagline.textContent = localize(project.tagline);

  section.append(title, tagline);

  if (startingPrice !== null) {
    const price = document.createElement('p');
    price.className = 'welcome__price';
    price.innerHTML = '<span data-i18n="welcome.startingFrom"></span> <strong></strong>';
    price.querySelector('strong').dataset.priceUsd = String(startingPrice);
    section.append(price);
  }

  container.replaceChildren(section);
}
