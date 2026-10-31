// Kat ekranı: kat plakasının izometrik görünümü, daire kartı ve yandaki daire listesi.

import { t, localize } from '../i18n.js';
import { formatPrice } from '../currency.js';
import { subscribe } from '../state.js';
import { navigate, goBack } from '../router.js';
import { applyBindings } from '../ui/bindings.js';
import { createVisual } from '../ui/visual-slot.js';
import { createHotspotLayer } from '../ui/hotspot-layer.js';
import { createHoverCard, relativeBox } from '../ui/hover-card.js';
import { unitCard, unitDescription } from '../ui/card-content.js';
import { observeSize, layoutSize } from '../ui/observe-size.js';
import { layoutForFloor, locateUnit, placeRect } from '../model/layout.js';
import { unitsOnFloor } from '../model/units.js';

const DEFAULT_VISUAL = 'svg:floor-plate';
const STATUSES = ['available', 'reserved', 'sold'];

export function renderFloor(container, { project, units, floor, focusUnit = null }) {
  const layout = layoutForFloor(project, floor);
  const floorUnits = unitsOnFloor(units, floor);
  if (!layout || floorUnits.length === 0) {
    queueMicrotask(() => navigate({}, { replace: true }));
    return () => {};
  }
  const typeOf = (unit) => project.unitTypes[unit.type];

  const root = document.createElement('section');
  root.className = 'floor';
  root.innerHTML = `
    <header class="floor__head">
      <button type="button" class="back-link" data-i18n-attr="aria-label:floor.backLabel">
        <span aria-hidden="true">←</span><span data-i18n="floor.back"></span>
      </button>
      <h1 class="floor__title" tabindex="-1" data-autofocus></h1>
      <p class="floor__meta"></p>
      <ul class="legend">
        ${STATUSES.map((status) => `<li data-status="${status}"><span class="legend__dot" aria-hidden="true"></span><span data-i18n="status.${status}"></span></li>`).join('')}
      </ul>
    </header>
    <div class="floor__stage">
      <div class="floor__scene"></div>
      <div class="floor__hotspots"></div>
    </div>
    <aside class="floor__list">
      <h2 class="floor__list-title" data-i18n="floor.units"></h2>
      <ul class="unit-list"></ul>
    </aside>`;
  container.replaceChildren(root);

  const stage = root.querySelector('.floor__stage');
  const sceneHost = root.querySelector('.floor__scene');
  const hotspotHost = root.querySelector('.floor__hotspots');
  const list = root.querySelector('.unit-list');
  const card = createHoverCard({ onAction: enterUnit });
  stage.append(card.element);

  let scene = null;
  let layer = null;

  function unitShapes() {
    return floorUnits.map((unit) => {
      const { placement, type } = locateUnit(project, unit);
      const terraces = type.rooms.filter((room) => room.kind === 'terrace').map((room) => room.rect.join());
      return {
        id: unit.id,
        status: unit.status,
        rects: type.footprint.map((rect) => ({
          rect: placeRect(rect, placement, type),
          low: terraces.includes(rect.join()),
        })),
      };
    });
  }

  function hotspotItems() {
    return scene.hotspots.map((hotspot) => {
      const id = hotspot.id ?? `${floor}-${hotspot.slot}`;
      const unit = floorUnits.find((entry) => entry.id === id);
      return { ...hotspot, id, label: unit ? unitDescription(unit, typeOf(unit)) : id, dimmed: unit?.status === 'sold' };
    });
  }

  function showCard(id) {
    list.querySelectorAll('.unit-row').forEach((row) => row.classList.toggle('is-active', row.dataset.id === id));
    if (id === null) {
      card.hide();
      return;
    }
    const unit = floorUnits.find((entry) => entry.id === id);
    const anchor = layer.anchorOf(id);
    if (!unit || !anchor) return;
    const box = stage.getBoundingClientRect();
    card.show(unitCard(unit, typeOf(unit)), relativeBox(anchor, stage), { width: box.width, height: box.height, top: 12 });
  }

  function enterUnit(id) {
    navigate({ floor, unit: id });
  }

  function renderHead() {
    const available = floorUnits.filter((unit) => unit.status === 'available').length;
    root.querySelector('.floor__title').textContent = t('tower.floorTitle', { floor });
    root.querySelector('.floor__meta').textContent =
      `${t('tower.unitCount', { count: floorUnits.length })} · ${t('tower.availableCount', { count: available })}`;
  }

  function renderList() {
    list.replaceChildren(
      ...floorUnits.map((unit) => {
        const type = typeOf(unit);
        const item = document.createElement('li');
        item.innerHTML = `
          <button type="button" class="unit-row">
            <span class="unit-row__id"></span>
            <span class="unit-row__type"></span>
            <span class="unit-row__price"></span>
            <span class="status-chip"></span>
          </button>`;
        const row = item.firstElementChild;
        row.dataset.id = unit.id;
        row.dataset.status = unit.status;
        row.setAttribute('aria-label', unitDescription(unit, type));
        row.querySelector('.unit-row__id').textContent = unit.id;
        row.querySelector('.unit-row__type').textContent = `${localize(type.label)} · ${t('unit.areaValue', { area: type.area })}`;
        row.querySelector('.unit-row__price').textContent = unit.status === 'sold' ? '' : formatPrice(unit.price);
        const chip = row.querySelector('.status-chip');
        chip.dataset.status = unit.status;
        chip.textContent = t(`status.${unit.status}`);
        row.classList.toggle('is-active', layer?.activeId === unit.id);
        return item;
      }),
    );
  }

  function build() {
    const box = layoutSize(stage);
    if (!box.width || !box.height) return;
    const previous = layer?.activeId ?? null;
    const hadFocus = hotspotHost.contains(document.activeElement);

    scene = createVisual(layout.visual ?? DEFAULT_VISUAL, {
      width: Math.round(box.width),
      height: Math.round(box.height),
      plate: layout.plate,
      core: layout.core,
      lobby: layout.lobby,
      units: unitShapes(),
      labels: { sea: t('floor.sea') },
      label: t('floor.plateLabel', { floor }),
      hotspots: layout.hotspots,
      imageSize: layout.imageSize,
    });
    sceneHost.replaceChildren(scene.element);

    layer = createHotspotLayer({
      viewBox: scene.viewBox,
      items: hotspotItems(),
      label: t('floor.units'),
      onPreview: showCard,
      onActivate: enterUnit,
    });
    hotspotHost.replaceChildren(layer.element);
    if (previous !== null) {
      layer.setActive(previous, { silent: true, focus: hadFocus });
      showCard(previous);
    }
  }

  list.addEventListener('pointerover', (event) => {
    const row = event.target.closest('.unit-row');
    if (row && event.pointerType !== 'touch') layer?.setActive(row.dataset.id);
  });
  list.addEventListener('focusin', (event) => {
    const row = event.target.closest('.unit-row');
    if (row) layer?.setActive(row.dataset.id);
  });
  list.addEventListener('click', (event) => {
    const row = event.target.closest('.unit-row');
    if (row) enterUnit(row.dataset.id);
  });
  root.querySelector('.back-link').addEventListener('click', goBack);

  const unsubscribe = subscribe((state, changed) => {
    if (!changed.includes('lang') && !changed.includes('currency')) return;
    renderHead();
    renderList();
    build();
  });

  renderHead();
  renderList();
  applyBindings(root);
  build();
  if (focusUnit && floorUnits.some((unit) => unit.id === focusUnit)) {
    layer?.setActive(focusUnit);
  }
  const stopObserving = observeSize(stage, build);

  return () => {
    unsubscribe();
    stopObserving();
  };
}
