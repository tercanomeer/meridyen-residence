// Kule ekranı: kat vurgusu, kat özeti kartı, "Sadece müsaitler" filtresi.
// Sahne kutunun gerçek boyutuyla üretilir; boyut değişince yeniden kurulur.

import { t, localize } from '../i18n.js';
import { getState, setState, subscribe } from '../state.js';
import { navigate } from '../router.js';
import { applyBindings } from '../ui/bindings.js';
import { createVisual } from '../ui/visual-slot.js';
import { createHotspotLayer } from '../ui/hotspot-layer.js';
import { createHoverCard, relativeBox } from '../ui/hover-card.js';
import { floorCard, floorDescription } from '../ui/card-content.js';
import { observeSize } from '../ui/observe-size.js';
import { summarizeFloors, typicalPlate, terraceFloors } from '../model/floors.js';
import { revealScene } from '../motion.js';

const NARROW = 720;

export function renderTower(container, { project, units, focusFloor = null }) {
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
      <h1 class="tower__title" tabindex="-1" data-autofocus></h1>
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

  const card = createHoverCard({ onAction: enterFloor });
  stage.append(card.element);

  let scene = null;
  let layer = null;
  let firstBuild = true;

  function hotspotItems() {
    const { onlyAvailable } = getState();
    return scene.hotspots.map((hotspot) => {
      const summary = summaries.get(hotspot.id);
      const filteredOut = onlyAvailable && summary.available === 0;
      return {
        ...hotspot,
        label: floorDescription(summary),
        disabled: filteredOut,
        dimmed: filteredOut || summary.soldOut,
        activatable: summary.kind === 'residential',
      };
    });
  }

  function showCard(floor) {
    if (floor === null) {
      card.hide();
      return;
    }
    const anchor = layer.anchorOf(floor);
    if (!anchor) return;
    const box = stage.getBoundingClientRect();
    const hudBottom = hud.getBoundingClientRect().bottom - box.top;
    card.show(floorCard(summaries.get(floor)), relativeBox(anchor, stage), {
      width: box.width,
      height: box.height,
      top: Math.max(72, hudBottom + 8),
    });
  }

  function enterFloor(floor) {
    if (summaries.get(floor)?.kind !== 'residential') return;
    navigate({ floor });
  }

  function build() {
    const box = stage.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const narrow = box.width < NARROW;
    const previous = layer ? layer.activeId : focusFloor;

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
      onPreview: showCard,
      onActivate: enterFloor,
    });
    hotspotHost.replaceChildren(layer.element);

    if (previous !== null) {
      layer.setActive(previous, { silent: true });
      if (layer.activeId !== null) showCard(layer.activeId);
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
    if (layer.activeId !== null) card.update(floorCard(summaries.get(layer.activeId)));
  }

  function syncFilter({ onlyAvailable }) {
    filter.setAttribute('aria-checked', String(onlyAvailable));
    if (!layer) return;
    layer.update(hotspotItems());
    if (layer.activeId === null) card.hide();
  }

  filter.addEventListener('click', () => setState({ onlyAvailable: !getState().onlyAvailable }));

  const onKeydown = (event) => {
    if (event.key === 'Escape' && card.isOpen) {
      layer?.setActive(null);
      card.hide();
    }
  };
  document.addEventListener('keydown', onKeydown);

  const unsubscribe = subscribe((state, changed) => {
    if (changed.includes('lang') || changed.includes('currency')) refreshTexts();
    if (changed.includes('onlyAvailable')) syncFilter(state);
  });

  title.textContent = localize(project.name);
  applyBindings(root);
  syncFilter(getState());
  build();
  const stopObserving = observeSize(stage, build);

  return () => {
    unsubscribe();
    stopObserving();
    document.removeEventListener('keydown', onKeydown);
  };
}
