// Kule ekranı: kat vurgusu, kat özeti etiketi, "Sadece müsaitler" filtresi.
// Sahne kutunun gerçek boyutuyla üretilir; boyut değişince yeniden kurulur.

import { t, localize } from '../i18n.js';
import { formatPrice } from '../currency.js';
import { getState, setState, subscribe } from '../state.js';
import { navigate } from '../router.js';
import { applyBindings } from '../ui/bindings.js';
import { createVisual } from '../ui/visual-slot.js';
import { createHotspotLayer } from '../ui/hotspot-layer.js';
import { createFloorLabel } from '../ui/floor-label.js';
import { summarizeFloors, typicalPlate, terraceFloors } from '../model/floors.js';
import { revealScene } from '../motion.js';

const NARROW = 720;
const RESIZE_DELAY = 150;

export function renderTower(container, { project, units }) {
  const summaries = summarizeFloors(project, units);
  const sceneOptions = {
    seed: project.id,
    floors: project.tower.floors,
    plate: typicalPlate(project),
    amenityFloors: (project.tower.amenityFloors ?? []).map((entry) => entry.floor),
    terraceFloors: terraceFloors(project),
    hotspots: project.tower.hotspots,
    imageSize: project.tower.imageSize,
  };

  const root = document.createElement('section');
  root.className = 'tower';
  root.innerHTML = `
    <div class="tower__hud">
      <h1 class="tower__title"></h1>
      <p class="tower__hint" data-i18n="tower.hint"></p>
      <button type="button" class="switch" role="switch" aria-checked="false">
        <span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span>
        <span data-i18n="tower.onlyAvailable"></span>
      </button>
    </div>
    <div class="tower__stage">
      <div class="tower__scene"></div>
      <div class="tower__hotspots"></div>
    </div>`;
  container.replaceChildren(root);

  const stage = root.querySelector('.tower__stage');
  const sceneHost = root.querySelector('.tower__scene');
  const hotspotHost = root.querySelector('.tower__hotspots');
  const hud = root.querySelector('.tower__hud');
  const title = root.querySelector('.tower__title');
  const filter = root.querySelector('.switch');

  const label = createFloorLabel({ onExplore: enterFloor });
  stage.append(label.element);

  let scene = null;
  let layer = null;
  let size = '';
  let firstBuild = true;

  function describe(summary) {
    const floorTitle = t('tower.floorTitle', { floor: summary.floor });
    if (summary.kind === 'amenity') return `${floorTitle}, ${localize(summary.amenity.label)}`;
    const parts = [
      floorTitle,
      t('tower.unitCount', { count: summary.total }),
      t('tower.availableCount', { count: summary.available }),
    ];
    if (summary.fromPrice !== null) parts.push(`${t('tower.startingFrom')} ${formatPrice(summary.fromPrice)}`);
    else if (summary.soldOut) parts.push(t('tower.soldOut'));
    return parts.join(', ');
  }

  function hotspotItems() {
    const { onlyAvailable } = getState();
    return scene.hotspots.map((hotspot) => {
      const summary = summaries.get(hotspot.id);
      const filteredOut = onlyAvailable && summary.available === 0;
      return {
        ...hotspot,
        label: describe(summary),
        disabled: filteredOut,
        dimmed: filteredOut || summary.soldOut,
        activatable: summary.kind === 'residential',
      };
    });
  }

  function stageBox() {
    const box = stage.getBoundingClientRect();
    return { box, narrow: box.width < NARROW };
  }

  function showLabel(floor) {
    if (floor === null) {
      label.hide();
      if (getState().floor !== null) navigate({});
      return;
    }
    const anchor = layer.anchorOf(floor);
    if (!anchor) return;
    const { box } = stageBox();
    const a = anchor.getBoundingClientRect();
    const hudBottom = hud.getBoundingClientRect().bottom - box.top;
    label.show(
      summaries.get(floor),
      { left: a.left - box.left, right: a.right - box.left, top: a.top - box.top, height: a.height },
      { width: box.width, height: box.height, top: Math.max(72, hudBottom + 8) },
    );
  }

  function enterFloor(floor) {
    if (summaries.get(floor)?.kind !== 'residential') return;
    navigate({ floor });
  }

  function dismiss() {
    layer?.setActive(null);
    label.hide();
    if (getState().floor !== null) navigate({});
  }

  function build() {
    const { box, narrow } = stageBox();
    if (!box.width || !box.height) return;
    size = `${Math.round(box.width)}x${Math.round(box.height)}`;
    const previous = layer?.activeId ?? getState().floor;

    scene = createVisual(project.tower.visual, {
      ...sceneOptions,
      width: Math.round(box.width),
      height: Math.round(box.height),
      focusX: narrow ? 0.3 : 0.46,
      topInset: narrow ? hud.getBoundingClientRect().bottom - box.top + 20 : 64,
      label: t('tower.sceneLabel', { name: localize(project.name), floors: project.tower.floors }),
    });
    sceneHost.replaceChildren(scene.element);

    layer = createHotspotLayer({
      viewBox: scene.viewBox,
      items: hotspotItems(),
      label: t('tower.floorsLabel'),
      onPreview: showLabel,
      onActivate: enterFloor,
    });
    hotspotHost.replaceChildren(layer.element);

    if (previous !== null) {
      layer.setActive(previous, { silent: true });
      if (layer.activeId !== null) showLabel(layer.activeId);
    }
    if (firstBuild) {
      revealScene(scene.element, scene.element.querySelectorAll('[data-lit]'));
      firstBuild = false;
    }
  }

  function refreshTexts() {
    title.textContent = localize(project.name);
    if (!scene) return;
    scene.element.setAttribute('aria-label', t('tower.sceneLabel', { name: localize(project.name), floors: project.tower.floors }));
    layer.element.setAttribute('aria-label', t('tower.floorsLabel'));
    layer.update(hotspotItems());
    label.refresh();
  }

  function syncFilter({ onlyAvailable }) {
    filter.setAttribute('aria-checked', String(onlyAvailable));
    if (!layer) return;
    layer.update(hotspotItems());
    if (layer.activeId === null) label.hide();
  }

  filter.addEventListener('click', () => setState({ onlyAvailable: !getState().onlyAvailable }));

  const onKeydown = (event) => {
    if (event.key === 'Escape' && (label.isOpen || getState().floor !== null)) dismiss();
  };
  document.addEventListener('keydown', onKeydown);

  let resizeTimer = 0;
  const observer = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const { box } = stageBox();
      if (`${Math.round(box.width)}x${Math.round(box.height)}` !== size) build();
    }, RESIZE_DELAY);
  });

  const unsubscribe = subscribe((state, changed) => {
    if (changed.includes('lang') || changed.includes('currency')) refreshTexts();
    if (changed.includes('onlyAvailable')) syncFilter(state);
    if (changed.includes('floor') && layer && state.floor !== null && state.floor !== layer.activeId) {
      layer.setActive(state.floor);
    }
  });

  title.textContent = localize(project.name);
  applyBindings(root);
  syncFilter(getState());
  build();
  observer.observe(stage);

  return () => {
    unsubscribe();
    observer.disconnect();
    window.clearTimeout(resizeTimer);
    document.removeEventListener('keydown', onKeydown);
  };
}
