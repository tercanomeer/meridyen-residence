// Daire bilgi paneli: kat, tip, m², oda/banyo, cephe, fiyat, durum, özellikler ve eylemler.
// Masaüstünde sağ sütun; mobilde alttan açılan kart (başlık görünür, dokununca açılır).

import { t, localize } from '../i18n.js';
import { formatPrice } from '../currency.js';
import { similarUnits } from '../model/units.js';
import { observeSize } from './observe-size.js';

const SHEET_QUERY = '(max-width: 899px)';

export function createPanel({ project, units, unit, type, facades, onAppointment, onBack, onSelectUnit }) {
  const sheet = window.matchMedia(SHEET_QUERY);
  const element = document.createElement('aside');
  element.className = 'panel';
  element.innerHTML = `
    <button type="button" class="panel__handle" aria-expanded="false" aria-controls="panel-body">
      <span class="panel__grip" aria-hidden="true"></span>
      <span class="panel__handle-label"></span>
    </button>
    <header class="panel__head">
      <p class="panel__eyebrow"></p>
      <h1 class="panel__title" tabindex="-1" data-autofocus></h1>
      <div class="panel__price-row">
        <p class="panel__price"></p>
        <span class="status-chip"></span>
      </div>
    </header>
    <div class="panel__body" id="panel-body">
      <dl class="panel__facts"></dl>
      <ul class="panel__views"></ul>
      <h2 class="panel__subtitle"></h2>
      <ul class="panel__features"></ul>
      <div class="panel__actions">
        <button type="button" class="button button--primary" data-action="primary"></button>
        <button type="button" class="button button--ghost" data-action="back"></button>
      </div>
      <div class="panel__similar" hidden>
        <ul class="panel__similar-list"></ul>
      </div>
    </div>`;

  const $ = (selector) => element.querySelector(selector);
  const handle = $('.panel__handle');
  const head = $('.panel__head');
  const body = $('.panel__body');
  const primary = $('[data-action="primary"]');
  const similar = $('.panel__similar');
  const sold = unit.status === 'sold';
  let open = false;

  function fact(term, value) {
    const wrap = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = term;
    dd.textContent = value;
    wrap.append(dt, dd);
    return wrap;
  }

  function renderSimilar() {
    const list = $('.panel__similar-list');
    const matches = similarUnits(project, units, unit);
    if (matches.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'panel__similar-empty';
      empty.textContent = t('unit.similarNone');
      list.replaceChildren(empty);
      return;
    }
    list.replaceChildren(
      ...matches.map((match) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'similar-row';
        button.innerHTML = '<span class="similar-row__id"></span><span class="similar-row__meta"></span><span class="similar-row__price"></span>';
        button.children[0].textContent = t('unit.title', { id: match.id });
        button.children[1].textContent = `${t('tower.floorTitle', { floor: match.floor })} · ${localize(project.unitTypes[match.type].label)}`;
        button.children[2].textContent = formatPrice(match.price);
        button.addEventListener('click', () => onSelectUnit(match));
        item.append(button);
        return item;
      }),
    );
  }

  function render() {
    $('.panel__eyebrow').textContent = `${t('tower.floorTitle', { floor: unit.floor })} · ${t('unit.title', { id: unit.id })}`;
    $('.panel__title').textContent = localize(type.label);
    $('.panel__price').textContent = sold ? '' : formatPrice(unit.price);
    const chip = $('.status-chip');
    chip.dataset.status = unit.status;
    chip.textContent = t(`status.${unit.status}`);

    $('.panel__facts').replaceChildren(
      fact(t('unit.floor'), String(unit.floor)),
      fact(t('unit.type'), unit.type),
      fact(t('unit.area'), t('unit.areaValue', { area: type.area })),
      fact(t('unit.rooms'), t('unit.roomsValue', { layout: type.layout, bedrooms: type.bedrooms })),
      fact(t('unit.bathrooms'), String(type.bathrooms)),
    );
    $('.panel__views').replaceChildren(
      ...facades.map((side) => {
        const item = document.createElement('li');
        item.textContent = localize(project.facades?.[side]?.label) || side;
        return item;
      }),
    );
    $('.panel__subtitle').textContent = t('unit.features');
    $('.panel__features').replaceChildren(
      ...(type.features ?? []).map((feature) => {
        const item = document.createElement('li');
        item.textContent = localize(feature);
        return item;
      }),
    );
    primary.textContent = t(sold ? 'unit.similar' : 'unit.appointment');
    $('[data-action="back"]').textContent = t('unit.backToFloor');
    $('.panel__handle-label').textContent = t('unit.details');
    if (!similar.hidden) renderSimilar();
  }

  // Mobilde kapalı kartın yalnızca başlığı görünür; gövde klavye/ekran okuyucudan da gizlenir.
  function syncSheet() {
    const isSheet = sheet.matches;
    element.classList.toggle('is-sheet', isSheet);
    element.classList.toggle('is-open', !isSheet || open);
    handle.setAttribute('aria-expanded', String(!isSheet || open));
    body.inert = isSheet && !open;
    element.style.setProperty('--peek', `${handle.offsetHeight + head.offsetHeight}px`);
  }

  function setOpen(next) {
    open = next;
    syncSheet();
  }

  handle.addEventListener('click', () => setOpen(!open));
  head.addEventListener('click', () => {
    if (sheet.matches && !open) setOpen(true);
  });
  primary.addEventListener('click', () => {
    if (!sold) {
      onAppointment(unit);
      return;
    }
    similar.hidden = !similar.hidden;
    if (!similar.hidden) renderSimilar();
  });
  $('[data-action="back"]').addEventListener('click', onBack);
  sheet.addEventListener('change', syncSheet);
  const stopObserving = observeSize(head, syncSheet, 50);

  render();

  return {
    element,
    mount() {
      syncSheet();
    },
    refresh() {
      render();
      syncSheet();
    },
    get isOpen() {
      return open;
    },
    close() {
      setOpen(false);
    },
    showSimilar() {
      similar.hidden = false;
      renderSimilar();
      setOpen(true);
      similar.scrollIntoView({ block: 'nearest' });
    },
    destroy() {
      sheet.removeEventListener('change', syncSheet);
      stopObserving();
    },
  };
}
