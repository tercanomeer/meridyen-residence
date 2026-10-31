// Kule kalibrasyon aracı: görsel üzerinde kat kenarlarını işaretler, project.json için "render" alanını üretir.
// Hesap sitenin kullandığı modülle aynıdır (src/model/tower-calibration.js).

import { calibratedFloors } from '../src/model/tower-calibration.js';

const SVG = 'http://www.w3.org/2000/svg';
const $ = (selector) => document.querySelector(selector);
const round = (value) => Math.round(value * 10000) / 10000;

const stage = $('[data-stage]');
const markerList = $('[data-markers]');
const floorsInput = $('[data-floors]');
const srcInput = $('[data-src]');
const output = $('[data-output]');

let image = null;
let overlay = null;
let size = null;
let render = {};
let markers = [];
let target = { index: 0, corner: 'left' };

function defaultMarkers(floors) {
  return [
    { floor: 1, edge: 'bottom' },
    { floor: floors, edge: 'top' },
  ];
}

function el(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== undefined) node.textContent = text;
  return node;
}

function showImage(url) {
  image = new Image();
  image.alt = '';
  image.draggable = false;
  image.onload = () => {
    size = [image.naturalWidth, image.naturalHeight];
    overlay = el('svg', { viewBox: `0 0 ${size[0]} ${size[1]}`, preserveAspectRatio: 'none' });
    stage.replaceChildren(image, overlay);
    draw();
  };
  image.src = url;
}

async function loadProject() {
  const id = $('[data-project]').value.trim();
  const response = await fetch(`../projects/${encodeURIComponent(id)}/project.json`, { cache: 'reload' });
  if (!response.ok) {
    alert(`project.json bulunamadı (${response.status})`);
    return;
  }
  const project = await response.json();
  floorsInput.value = project.tower?.floors ?? 32;
  render = { ...(project.tower?.render ?? {}) };
  markers = render.floors?.length ? render.floors.map((marker) => ({ ...marker })) : defaultMarkers(Number(floorsInput.value));
  target = nextTarget(0);
  srcInput.value = render.src ?? '';
  renderMarkerList();
  if (render.src) showImage(`../projects/${encodeURIComponent(id)}/${render.src}`);
  else draw();
}

// Noktası eksik ilk köşe; hepsi doluysa son hedef korunur.
function nextTarget(from) {
  for (let index = from; index < markers.length; index += 1) {
    if (!markers[index].left) return { index, corner: 'left' };
    if (!markers[index].right) return { index, corner: 'right' };
  }
  return target;
}

function setPoint(index, corner, point) {
  markers[index][corner] = point.map(round);
  draw();
}

function pointFromEvent(event) {
  const box = image.getBoundingClientRect();
  return [
    Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1),
    Math.min(Math.max((event.clientY - box.top) / box.height, 0), 1),
  ];
}

function draw() {
  renderOutput();
  if (!overlay) return;
  const [w, h] = size;
  const floors = Number(floorsInput.value);
  const bands = el('g');
  calibratedFloors(markers, floors).forEach(({ points }) => {
    bands.append(el('polygon', { class: 'band', points: points.map(([x, y]) => `${x * w},${y * h}`).join(' ') }));
  });
  const labels = el('g');
  calibratedFloors(markers, floors).forEach(({ id, points }) => {
    const [x, y] = [(points[1][0] + points[2][0]) / 2, (points[1][1] + points[2][1]) / 2];
    labels.append(el('text', { class: 'band-label', x: x * w + 6, y: y * h + 4, 'font-size': Math.max(10, h / 120) }, id));
  });
  const handles = el('g');
  const radius = Math.max(6, w / 140);
  markers.forEach((marker, index) => {
    ['left', 'right'].forEach((corner) => {
      if (!marker[corner]) return;
      const isTarget = target.index === index && target.corner === corner;
      const handle = el('circle', {
        class: `handle${isTarget ? ' is-target' : ''}`,
        cx: marker[corner][0] * w,
        cy: marker[corner][1] * h,
        r: radius,
      });
      handle.dataset.index = index;
      handle.dataset.corner = corner;
      handles.append(handle);
    });
  });
  overlay.replaceChildren(bands, labels, handles);
  syncTargetButtons();
}

function renderMarkerList() {
  markerList.replaceChildren(
    ...markers.map((marker, index) => {
      const row = document.createElement('div');
      row.className = 'marker';
      row.innerHTML = `
        <input type="number" min="1" aria-label="Kat" value="${marker.floor}">
        <select aria-label="Kenar"><option value="bottom">altı</option><option value="top">üstü</option></select>
        <div class="row"><button type="button" data-corner="left">Sol</button><button type="button" data-corner="right">Sağ</button></div>
        <button type="button" aria-label="İşareti sil" data-remove>×</button>`;
      row.querySelector('select').value = marker.edge;
      row.querySelector('input').addEventListener('input', (event) => {
        marker.floor = Number(event.target.value);
        draw();
      });
      row.querySelector('select').addEventListener('change', (event) => {
        marker.edge = event.target.value;
        draw();
      });
      row.querySelectorAll('[data-corner]').forEach((button) => {
        button.addEventListener('click', () => {
          target = { index, corner: button.dataset.corner };
          draw();
        });
      });
      row.querySelector('[data-remove]').addEventListener('click', () => {
        markers.splice(index, 1);
        target = nextTarget(0);
        renderMarkerList();
      });
      return row;
    }),
  );
  draw();
}

function syncTargetButtons() {
  markerList.querySelectorAll('.marker').forEach((row, index) => {
    row.querySelectorAll('[data-corner]').forEach((button) => {
      const corner = button.dataset.corner;
      button.classList.toggle('is-target', target.index === index && target.corner === corner);
      button.classList.toggle('is-set', Boolean(markers[index]?.[corner]));
    });
  });
}

function renderOutput() {
  const complete = markers.filter((marker) => marker.left && marker.right);
  const result = {
    src: srcInput.value.trim() || 'renders/tower.webp',
    ...(render.small ? { small: render.small } : {}),
    size: size ?? render.size ?? [0, 0],
    floors: complete.map(({ floor, edge, left, right }) => ({ floor, edge, left, right })),
  };
  const lines = JSON.stringify({ ...result, floors: [] }, null, 2).split('\n');
  const floorLines = result.floors.map((marker, index) => `    ${JSON.stringify(marker).replaceAll(',', ', ').replaceAll(':', ': ')}${index < result.floors.length - 1 ? ',' : ''}`);
  const json = lines
    .join('\n')
    .replace(/"size": \[\s*(\d+),\s*(\d+)\s*\]/, '"size": [$1, $2]')
    .replace('"floors": []', `"floors": [\n${floorLines.join('\n')}\n  ]`);
  output.value = `"render": ${json}`;
}

// Tıklama: hedef köşeyi koyar. Sürükleme: mevcut noktayı taşır.
let dragging = null;
stage.addEventListener('pointerdown', (event) => {
  if (!image || !overlay) return;
  const handle = event.target.closest?.('.handle');
  if (handle) {
    dragging = { index: Number(handle.dataset.index), corner: handle.dataset.corner };
    target = dragging;
  } else {
    if (!markers[target.index]) return;
    setPoint(target.index, target.corner, pointFromEvent(event));
    target = target.corner === 'left' ? { index: target.index, corner: 'right' } : nextTarget(target.index + 1);
    draw();
    return;
  }
  stage.setPointerCapture(event.pointerId);
  draw();
});
stage.addEventListener('pointermove', (event) => {
  if (dragging) setPoint(dragging.index, dragging.corner, pointFromEvent(event));
});
stage.addEventListener('pointerup', () => {
  dragging = null;
});

$('[data-load]').addEventListener('click', loadProject);
$('[data-file]').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!srcInput.value) srcInput.value = `renders/${file.name.replace(/\.(png|jpe?g)$/i, '.webp')}`;
  showImage(URL.createObjectURL(file));
});
$('[data-add]').addEventListener('click', () => {
  const last = markers[markers.length - 1];
  markers.push({ floor: last ? Math.max(1, last.floor - 1) : 1, edge: 'bottom' });
  target = { index: markers.length - 1, corner: 'left' };
  renderMarkerList();
});
floorsInput.addEventListener('input', draw);
srcInput.addEventListener('input', renderOutput);
$('[data-copy]').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    $('[data-copied]').textContent = 'Kopyalandı';
  } catch {
    output.select();
    $('[data-copied]').textContent = 'Seçildi, ⌘C ile kopyalayın';
  }
});

markers = defaultMarkers(Number(floorsInput.value));
renderMarkerList();
loadProject();
