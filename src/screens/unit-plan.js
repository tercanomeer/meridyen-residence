// Daire ekranı: seçilen tipin izometrik planı, odalar üzerinde vurgu ve ad, yanda (mobilde altta) panel.

import { t, localize } from '../i18n.js';
import { getState, setState, subscribe } from '../state.js';
import { navigate } from '../router.js';
import { applyBindings } from '../ui/bindings.js';
import { createVisual } from '../ui/visual-slot.js';
import { createHotspotLayer } from '../ui/hotspot-layer.js';
import { createRoomTag } from '../ui/room-tag.js';
import { relativeBox } from '../ui/hover-card.js';
import { createPanel } from '../ui/panel.js';
import { observeSize } from '../ui/observe-size.js';
import { locateUnit, placedFacades, placedFootprint, placedRooms } from '../model/layout.js';

const areaOf = ([, , w, h]) => Math.round(w * h);

export function renderUnitPlan(container, { project, units, floor, unitId }) {
  const unit = units.find((entry) => entry.id === unitId && entry.floor === floor);
  const located = unit && locateUnit(project, unit);
  if (!located) {
    queueMicrotask(() => navigate({ floor }));
    return () => {};
  }
  const { placement, type } = located;
  const rooms = placedRooms(type, placement);
  const facades = placedFacades(type, placement);
  const footprint = placedFootprint(type, placement);

  const root = document.createElement('section');
  root.className = 'unit';
  root.innerHTML = `
    <div class="unit__stage">
      <button type="button" class="back-link unit__back"><span aria-hidden="true">←</span><span class="unit__back-label"></span></button>
      <div class="unit__scene"></div>
      <div class="unit__hotspots"></div>
    </div>`;
  container.replaceChildren(root);

  const stage = root.querySelector('.unit__stage');
  const sceneHost = root.querySelector('.unit__scene');
  const hotspotHost = root.querySelector('.unit__hotspots');
  const tag = createRoomTag();
  stage.append(tag.element);

  const backToFloor = () => navigate({ floor });
  const panel = createPanel({
    project,
    units,
    unit,
    type,
    facades,
    onBack: backToFloor,
    onAppointment: (selected) => setState({ leadUnit: selected.id }),
    onSelectUnit: (match) => navigate({ floor: match.floor, unit: match.id }),
  });
  root.append(panel.element);

  let scene = null;
  let layer = null;

  const roomContent = (room) => ({ title: localize(room.label), meta: t('unit.areaValue', { area: areaOf(room.rect) }) });

  function hotspotItems() {
    return scene.hotspots.map((hotspot) => {
      const room = rooms.find((entry) => entry.id === hotspot.id);
      const content = room ? roomContent(room) : { title: hotspot.id, meta: '' };
      return { ...hotspot, label: `${content.title}, ${content.meta}`, activatable: Boolean(room?.visual) };
    });
  }

  function showRoom(id) {
    const room = rooms.find((entry) => entry.id === id);
    const anchor = id === null ? null : layer.anchorOf(id);
    if (!room || !anchor) {
      tag.hide();
      return;
    }
    const box = stage.getBoundingClientRect();
    tag.show(roomContent(room), relativeBox(anchor, stage), { width: box.width, height: box.height });
  }

  function build() {
    const box = stage.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const previous = layer?.activeId ?? getState().room;
    const hadFocus = hotspotHost.contains(document.activeElement);
    scene = createVisual(type.plan ?? 'svg:unit-plan', {
      width: Math.round(box.width),
      height: Math.round(box.height),
      size: type.size,
      footprint,
      rooms,
      facades,
      labels: { sea: t('floor.sea') },
      label: t('unit.planLabel', { type: localize(type.label) }),
      hotspots: type.hotspots,
      imageSize: type.imageSize,
    });
    sceneHost.replaceChildren(scene.element);

    layer = createHotspotLayer({
      viewBox: scene.viewBox,
      items: hotspotItems(),
      label: t('unit.roomList'),
      onPreview: showRoom,
      onActivate: (roomId) => navigate({ floor, unit: unit.id, room: roomId }),
      onLeave: () => {
        if (getState().room === null) layer.setActive(null);
      },
    });
    hotspotHost.replaceChildren(layer.element);
    if (previous !== null) layer.setActive(previous, { focus: hadFocus });
  }

  function renderTexts() {
    root.querySelector('.unit__back-label').textContent = t('tower.floorTitle', { floor });
    root.querySelector('.unit__back').setAttribute('aria-label', t('unit.backToFloor'));
  }

  root.querySelector('.unit__back').addEventListener('click', backToFloor);

  const onKeydown = (event) => {
    if (event.key !== 'Escape') return;
    if (getState().room !== null) navigate({ floor, unit: unit.id });
    else if (panel.isOpen && panel.element.classList.contains('is-sheet')) panel.close();
    else backToFloor();
  };
  document.addEventListener('keydown', onKeydown);

  const unsubscribe = subscribe((state, changed) => {
    if (changed.includes('lang') || changed.includes('currency')) {
      renderTexts();
      panel.refresh();
      build();
    }
    if (changed.includes('room') && layer) layer.setActive(state.room);
  });

  renderTexts();
  applyBindings(root);
  panel.mount();
  build();
  const stopObserving = observeSize(stage, build);

  return () => {
    unsubscribe();
    stopObserving();
    panel.destroy();
    document.removeEventListener('keydown', onKeydown);
  };
}
