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

// Kutuya yerleştirilmiş görsel (kule).
//   contain: görselin tamamı area içinde; kalan alan görselin kenarlarından uzatılarak doldurulur.
//   cover: görsel area'yı kaplar; taşan kısım focus'a göre kırpılır (geniş görsel).
// edges: görselin sol ve sağ kenarından yanlara uzatılabilecek şerit (0–1); kule bu şeritlere girmemeli.
export function createFittedRender(project, render, { width, height, area, fit = 'contain', focus = [0.5, 0.5], edges = [0.2, 0.2], label = '' }) {
  const [iw, ih] = render.size;
  const [ax, ay, aw, ah] = area;
  const [fx, fy] = focus;
  const cover = fit === 'cover';
  const scale = (cover ? Math.max : Math.min)(aw / iw, ah / ih);
  // Tam piksele yuvarlanır; kesirli kenar uzatmayla görsel arasında ince çizgi bırakır.
  const w = Math.round(iw * scale);
  const h = Math.round(ih * scale);
  const x = Math.round(cover ? ax + (aw - w) * fx : Math.min(Math.max(ax + aw * fx - w / 2, ax), ax + aw - w));
  const y = Math.round(cover ? ay + (ah - h) * fy : ay + (ah - h) / 2);

  const element = document.createElement('div');
  element.className = 'render render--fitted';
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', label);
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;

  const img = document.createElement('img');
  img.className = 'render__img';
  img.alt = '';
  applySources(img, project, render);
  Object.assign(img.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });

  if (!cover) {
    const canvas = document.createElement('canvas');
    canvas.className = 'render__extension';
    canvas.setAttribute('aria-hidden', 'true');
    element.append(canvas);
    // srcset'li <img>'nin naturalWidth'i yoğunluğa göre düzeltilmiş gelir; canvas için düz bir görsel kullanılır.
    const source = new Image();
    source.addEventListener('load', () => paintExtension(canvas, source, { width, height, rect: [x, y, w, h], edges }), { once: true });
    source.src = projectUrl(project.id, render.small ?? render.src);
  }
  element.append(img);

  // Görsel içindeki 0–1 noktayı sahne içindeki 0–1 noktaya çevirir.
  const toScene = ([px, py]) => [(x + px * w) / width, (y + py * h) / height];
  return { element, toScene };
}

// Görselin dışında kalan alanı görselin kendisiyle doldurur: yanlarda kenar şeridi aynalanarak
// (ileri-geri) tekrarlanır, üst ve alt bantta en üst/en alt satır uzatılır (gökyüzü ve su).
function paintExtension(canvas, img, { width, height, rect: [x, y, w, h], edges: [left, right] }) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const strip = (fraction, fromRight, dx, mirrored) => {
    const sw = fraction * iw;
    const sx = fromRight ? iw - sw : 0;
    const dw = fraction * w;
    ctx.save();
    if (mirrored) {
      ctx.translate(dx + dw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, 0, sw, ih, 0, y, dw, h);
    } else {
      ctx.drawImage(img, sx, 0, sw, ih, dx, y, dw, h);
    }
    ctx.restore();
  };

  ctx.drawImage(img, x, y, w, h);
  if (left > 0) {
    for (let k = 1, dx = x - left * w; dx + left * w > 0; k += 1, dx -= left * w) strip(left, false, dx, k % 2 === 1);
  }
  if (right > 0) {
    for (let k = 1, dx = x + w; dx < width; k += 1, dx += right * w) strip(right, true, dx, k % 2 === 1);
  }

  // Üst ve alt bant: görsel bandının ilk ve son satırı dikeyde uzatılır.
  const px = (value) => Math.round(value * ratio);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (y > 0) ctx.drawImage(canvas, 0, px(y) + 1, canvas.width, 1, 0, 0, canvas.width, px(y) + 1);
  const bottom = y + h;
  if (bottom < height) ctx.drawImage(canvas, 0, px(bottom) - 2, canvas.width, 1, 0, px(bottom) - 1, canvas.width, canvas.height - px(bottom) + 1);
}
