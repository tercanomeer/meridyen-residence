// Render görseli (projects/<id>/renders/…). Alanlar: src, small (yarı genişlik), size [w, h], focus [0–1, 0–1].
// Aynı görsel bir kez yüklenir; loadRender çözülünce <img> önbellekten anında açılır.

import { projectUrl } from '../data/load-project.js';

const cache = new Map();

function applySources(img, project, render) {
  const src = projectUrl(project.id, render.src);
  if (render.small && render.size) {
    img.srcset = `${projectUrl(project.id, render.small)} ${Math.floor(render.size[0] / 2)}w, ${src} ${render.size[0]}w`;
    img.sizes = '100vw';
  }
  img.src = src;
}

export function loadRender(project, render) {
  const key = `${project.id}:${render.src}`;
  if (!cache.has(key)) {
    const img = new Image();
    const entry = { loaded: false, promise: null };
    entry.promise = new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      applySources(img, project, render);
    }).then(() => {
      entry.loaded = true;
    });
    entry.promise.catch(() => cache.delete(key));
    cache.set(key, entry);
  }
  return cache.get(key);
}

// Tam kaplayan görsel (oda): odak noktası kırpmada görünür kalır, aynalı dairede yatay çevrilir.
export function createRenderImage(project, render, { label = '', mirror = false } = {}) {
  const element = document.createElement('div');
  element.className = 'render';
  const img = document.createElement('img');
  img.className = 'render__img';
  img.alt = label;
  img.decoding = 'async';
  applySources(img, project, render);
  const [fx, fy] = render.focus ?? [0.5, 0.5];
  img.style.objectPosition = `${fx * 100}% ${fy * 100}%`;
  img.classList.toggle('is-mirrored', mirror);
  element.append(img);
  return { element, img };
}

// Kutuya sığdırılmış görsel (kule): görselin tamamı rect içinde, kalan alan aynı görselin bulanık hâli.
export function createFittedRender(project, render, { width, height, area, focusX = 0.5, label = '' }) {
  const [iw, ih] = render.size;
  const [ax, ay, aw, ah] = area;
  const scale = Math.min(aw / iw, ah / ih);
  const w = iw * scale;
  const h = ih * scale;
  const x = Math.min(Math.max(ax + aw * focusX - w / 2, ax), ax + aw - w);
  const y = ay + (ah - h) / 2;

  const element = document.createElement('div');
  element.className = 'render render--fitted';
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', label);
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;

  const backdrop = document.createElement('img');
  backdrop.className = 'render__backdrop';
  backdrop.alt = '';
  const img = document.createElement('img');
  img.className = 'render__img';
  img.alt = '';
  [backdrop, img].forEach((node) => applySources(node, project, render));
  Object.assign(img.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  element.append(backdrop, img);

  // Görsel içindeki 0–1 noktayı sahne içindeki 0–1 noktaya çevirir.
  const toScene = ([px, py]) => [(x + px * w) / width, (y + py * h) / height];
  return { element, toScene };
}
