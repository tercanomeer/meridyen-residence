// Oda ekranı: perspektif iç mekân (çok yavaş yakınlaşır), sol altta kat ve oda adı,
// altta odalar arası geçiş, "Plana dön" ve "Randevu Al" (satılmışsa "Benzer daireleri göster").

import { t, localize } from '../i18n.js';
import { getState, setState, subscribe } from '../state.js';
import { navigate, goBack } from '../router.js';
import { createVisual } from '../ui/visual-slot.js';
import { observeSize, layoutSize } from '../ui/observe-size.js';
import { locateUnit, placedFacades, placedRooms, roomWindows } from '../model/layout.js';
import { slowZoom, crossfade } from '../motion.js';
import { wantsRender } from '../visual-mode.js';
import { loadRender, createRenderImage } from '../ui/render-image.js';
import { createRenderControls } from '../ui/render-controls.js';
import { resolveRender, renderForBox } from '../model/renders.js';
import { applyBindings } from '../ui/bindings.js';

const WINDOW_PRIORITY = ['south', 'west', 'east', 'north'];
const KIND_ORDER = ['living', 'dining', 'kitchen', 'terrace', 'bedroom', 'bath'];
const RENDER_WAIT = 250;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function renderRoom(container, { project, units, floor, unitId }) {
  const unit = units.find((entry) => entry.id === unitId && entry.floor === floor);
  const located = unit && locateUnit(project, unit);
  const allRooms = located ? placedRooms(located.type, located.placement) : [];
  const rank = (room) => KIND_ORDER.indexOf(room.kind) * 2 + (room.id.startsWith('ebeveyn') ? 0 : 1);
  const rooms = allRooms
    .filter((room) => room.visual)
    .map((room) => ({ ...room, render: resolveRender(project, room.render) }))
    .sort((a, b) => rank(a) - rank(b));
  if (!located || !rooms.some((room) => room.id === getState().room)) {
    queueMicrotask(() => navigate(located ? { floor, unit: unitId } : { floor }, { replace: true }));
    return () => {};
  }
  const { placement, type } = located;
  const facades = placedFacades(type, placement);
  const sold = unit.status === 'sold';
  const planRoute = { floor, unit: unit.id };

  const root = document.createElement('section');
  root.className = 'room';
  root.innerHTML = `
    <div class="room__stage"></div>
    <div class="room__shade" aria-hidden="true"></div>
    <div class="room__bar">
      <div class="room__caption">
        <p class="room__eyebrow"></p>
        <h1 class="room__title" tabindex="-1" data-autofocus></h1>
      </div>
      <nav class="room__nav"><ul class="room-tabs"></ul></nav>
      <div class="room__actions">
        <button type="button" class="button button--ghost" data-action="plan"></button>
        <button type="button" class="button button--primary" data-action="primary"></button>
      </div>
    </div>`;
  container.replaceChildren(root);

  const stage = root.querySelector('.room__stage');
  const tabs = root.querySelector('.room-tabs');
  const controls = createRenderControls();
  controls.element.classList.add('room__visual-mode');
  root.querySelector('.room__shade').after(controls.element);
  let current = null;
  let renderRequest = 0;

  function interiorOptions(room) {
    const windows = roomWindows(room, type, facades, allRooms);
    const side = WINDOW_PRIORITY.find((entry) => windows.includes(entry));
    const view = room.kind === 'terrace' ? 'sea' : !side ? 'wall' : side === 'south' ? 'sea' : side === 'north' ? 'city' : 'coast';
    const [, , w, h] = room.rect;
    const across = !side || side === 'north' || side === 'south';
    return {
      view,
      coastSide: side === 'west' ? 'right' : 'left',
      mood: type.interior?.mood ?? 'day',
      ceiling: type.interior?.ceiling ?? 2.9,
      size: [clamp(across ? w : h, 3.4, 7.5), clamp(across ? h : w, 3.6, 6.5)],
      seed: `${project.id}:${unit.type}:${room.id}`,
    };
  }

  function mount(roomId, kind, element, focus, fade) {
    const layer = document.createElement('div');
    layer.className = 'room__layer';
    layer.append(element);
    stage.append(layer);

    const previous = current;
    previous?.stopZoom();
    if (fade) crossfade(layer, previous?.layer);
    else previous?.layer.remove();
    current = { roomId, kind, layer, stopZoom: slowZoom(element, focus) };
    controls.setShowing(kind === 'render');
  }

  function showDrawing(room, box, fade) {
    const visual = createVisual(room.visual, {
      width: Math.round(box.width),
      height: Math.round(box.height),
      ...interiorOptions(room),
      label: t('room.sceneLabel', { room: localize(room.label) }),
    });
    mount(room.id, 'drawing', visual.element, visual.focus ?? [box.width / 2, box.height / 2], fade);
  }

  // Render önbellekteyse hemen açılır. Değilse kısa bir süre beklenir; gecikirse önce çizim görünür,
  // render yüklenince üstüne solar. Yüklenemezse çizim kalır.
  function showRender(room, box, fade) {
    const request = ++renderRequest;
    const entry = loadRender(project, room.render);
    const place = (withFade) => {
      if (request !== renderRequest || getState().room !== room.id || !wantsRender(room.render)) return;
      const image = createRenderImage(project, room.render, {
        label: t('room.sceneLabel', { room: localize(room.label) }),
        mirror: Boolean(placement.mirror) !== Boolean(room.render.mirror),
      });
      mount(room.id, 'render', image.element, [box.width / 2, box.height / 2], withFade);
      current.src = room.render.src;
    };
    if (entry.loaded) {
      place(fade);
      return;
    }
    const timer = setTimeout(() => {
      if (request === renderRequest && current?.roomId !== room.id) showDrawing(room, box, fade);
    }, RENDER_WAIT);
    entry.promise.then(
      () => {
        clearTimeout(timer);
        place(fade || current?.roomId === room.id);
      },
      () => {
        clearTimeout(timer);
        if (request === renderRequest && current?.roomId !== room.id) showDrawing(room, box, fade);
      },
    );
  }

  function showRoom(roomId, { fade = true } = {}) {
    const room = rooms.find((entry) => entry.id === roomId);
    const box = layoutSize(stage);
    if (!room || !box.width || !box.height) return;
    controls.setAvailable(Boolean(room.render?.src));
    const shaped = { ...room, render: renderForBox(room.render, box) };
    if (wantsRender(shaped.render)) showRender(shaped, box, fade);
    else {
      renderRequest += 1;
      showDrawing(room, box, fade);
    }
  }

  function renderTexts() {
    const room = rooms.find((entry) => entry.id === getState().room);
    root.querySelector('.room__eyebrow').textContent = `${t('tower.floorTitle', { floor })} · ${t('unit.title', { id: unit.id })}`;
    root.querySelector('.room__title').textContent = room ? localize(room.label) : '';
    root.querySelector('.room__nav').setAttribute('aria-label', t('unit.roomList'));
    root.querySelector('[data-action="plan"]').textContent = t('room.backToPlan');
    root.querySelector('[data-action="primary"]').textContent = t(sold ? 'unit.similar' : 'unit.appointment');
    const sceneLabel = t('room.sceneLabel', { room: room ? localize(room.label) : '' });
    current?.layer.querySelector('svg')?.setAttribute('aria-label', sceneLabel);
    const image = current?.layer.querySelector('.render__img');
    if (image) image.alt = sceneLabel;

    tabs.replaceChildren(
      ...rooms.map((entry) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'room-tab';
        button.textContent = localize(entry.label);
        if (entry.id === room?.id) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => navigate({ ...planRoute, room: entry.id }, { replace: true }));
        item.append(button);
        return item;
      }),
    );
    tabs.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function step(offset) {
    const index = rooms.findIndex((entry) => entry.id === getState().room);
    const next = rooms[(index + offset + rooms.length) % rooms.length];
    navigate({ ...planRoute, room: next.id }, { replace: true });
  }

  root.querySelector('[data-action="plan"]').addEventListener('click', goBack);
  root.querySelector('[data-action="primary"]').addEventListener('click', () => {
    if (!sold) {
      setState({ leadUnit: unit.id });
      return;
    }
    setState({ similarFor: unit.id });
    goBack();
  });

  const onKeydown = (event) => {
    if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'ArrowLeft') step(-1);
  };
  document.addEventListener('keydown', onKeydown);

  const unsubscribe = subscribe((state, changed) => {
    if (changed.includes('room') && state.room !== null && state.room !== current?.roomId) {
      renderTexts();
      showRoom(state.room);
    } else if (changed.includes('visualMode') && current) {
      showRoom(current.roomId);
    } else if (changed.includes('lang')) {
      renderTexts();
    }
  });

  renderTexts();
  applyBindings(root);
  showRoom(getState().room, { fade: false });
  // Render CSS ile kaplanır; yalnızca çizimde ya da ekran yönü değişip render'ın diğer sürümü gerektiğinde yeniden kurulur.
  const stopObserving = observeSize(stage, () => {
    if (!current) return;
    const room = rooms.find((entry) => entry.id === current.roomId);
    const nextSrc = renderForBox(room?.render, layoutSize(stage))?.src;
    if (current.kind === 'drawing' || current.src !== nextSrc) showRoom(current.roomId, { fade: false });
  });

  return () => {
    renderRequest += 1;
    controls.destroy();
    unsubscribe();
    stopObserving();
    current?.stopZoom();
    document.removeEventListener('keydown', onKeydown);
  };
}
