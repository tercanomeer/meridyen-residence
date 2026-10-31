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
import { observeSize, layoutSize } from '../ui/observe-size.js';
import { summarizeFloors, typicalPlate, terraceFloors } from '../model/floors.js';
import { revealScene, fadeIn } from '../motion.js';
import { wantsRender } from '../visual-mode.js';
import { loadRender, createFittedRender } from '../ui/render-image.js';
import { createRenderControls } from '../ui/render-controls.js';
import { calibratedFloors } from '../model/tower-calibration.js';

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

  const render = project.tower.render;
  const controls = createRenderControls();
  controls.setAvailable(Boolean(render?.src && render.size && render.floors));
  hud.append(controls.element);

  let scene = null;
  let layer = null;
  let firstBuild = true;
  let disposed = false;

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
    const box = layoutSize(stage);
    if (!box.width || !box.height) return;
    const narrow = box.width < NARROW;
    const previous = layer ? layer.activeId : focusFloor;

    const topInset = narrow ? hud.offsetTop + hud.offsetHeight + 20 : 64;
    const label = t('tower.sceneLabel', { name: localize(project.name), floors: project.tower.floors });
    const showing = renderReady();
    scene = showing
      ? renderScene(box, { topInset, focusX: narrow ? 0.5 : 0.46, label })
      : createVisual(project.tower.visual, {
          ...sceneOptions,
          width: box.width,
          height: box.height,
          focusX: narrow ? 0.3 : 0.46,
          topInset,
          label,
        });
    sceneHost.replaceChildren(scene.element);
    controls.setShowing(showing);

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

  // Render yüklendiyse ve seçiliyse true. Yüklenmediyse yüklemeyi başlatır; bitince sahne yeniden kurulur.
  function renderReady() {
    if (!controls.element.hidden && wantsRender(render)) {
      const entry = loadRender(project, render);
      if (entry.loaded) return true;
      entry.promise.then(() => {
        if (!disposed && wantsRender(render)) rebuildWithFade();
      }, () => {});
    }
    return false;
  }

  function renderScene(box, { topInset, focusX, label }) {
    const fitted = createFittedRender(project, render, {
      width: box.width,
      height: box.height,
      area: [0, topInset, box.width, box.height - topInset - 8],
      focusX,
      label,
    });
    const hotspots = calibratedFloors(render.floors, project.tower.floors).map((floor) => ({
      ...floor,
      points: floor.points.map(fitted.toScene),
    }));
    return { element: fitted.element, viewBox: [box.width, box.height], hotspots };
  }

  function rebuildWithFade() {
    build();
    fadeIn(sceneHost);
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
      event.preventDefault();
      layer?.setActive(null);
      card.hide();
    }
  };
  document.addEventListener('keydown', onKeydown);

  const unsubscribe = subscribe((state, changed) => {
    if (changed.includes('lang') || changed.includes('currency')) refreshTexts();
    if (changed.includes('onlyAvailable')) syncFilter(state);
    if (changed.includes('visualMode') && !controls.element.hidden) rebuildWithFade();
  });

  title.textContent = localize(project.name);
  applyBindings(root);
  syncFilter(getState());
  build();
  const stopObserving = observeSize(stage, build);

  return () => {
    disposed = true;
    controls.destroy();
    unsubscribe();
    stopObserving();
    document.removeEventListener('keydown', onKeydown);
  };
}
