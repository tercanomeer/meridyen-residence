// Kule render'ında kat bantları. İşaret: { floor, edge: "bottom" | "top", left: [x, y], right: [x, y] } (görselde 0–1).
// En az iki işaret gerekir (ör. 1. katın altı, son katın üstü); aradaki kat kenarları doğrusal ara değerle bulunur.
// Cephenin değiştiği yerde iki işaret konur (ör. 29. katın üstü dar, 30. katın altı geniş); bant orada kırılır.

const EPS = 1e-4;
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPoint = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// Kenarın yüksekliği: n. katın üstü ile n+1. katın altı aynı seviyededir; alttaki kat aşağıda sayılır.
function markerPosition({ floor, edge }) {
  return edge === 'top' ? floor - EPS : floor - 1 + EPS;
}

function sortedMarkers(markers) {
  const byPosition = new Map();
  markers.forEach((marker) => {
    if (marker?.left && marker?.right && Number.isFinite(marker.floor)) byPosition.set(markerPosition(marker), marker);
  });
  return [...byPosition.entries()].sort(([a], [b]) => a - b);
}

function edgeAt(sorted, position) {
  let index = sorted.findIndex(([markerPos]) => markerPos >= position);
  index = Math.min(Math.max(index === -1 ? sorted.length - 1 : index, 1), sorted.length - 1);
  const [fromPos, from] = sorted[index - 1];
  const [toPos, to] = sorted[index];
  const t = (position - fromPos) / (toPos - fromPos);
  return { left: lerpPoint(from.left, to.left, t), right: lerpPoint(from.right, to.right, t) };
}

// Her kat için dörtgen tıklama alanı: alt sol, alt sağ, üst sağ, üst sol.
export function calibratedFloors(markers = [], floors) {
  const sorted = sortedMarkers(markers);
  if (sorted.length < 2) return [];
  return Array.from({ length: floors }, (_, index) => {
    const floor = index + 1;
    const bottom = edgeAt(sorted, markerPosition({ floor, edge: 'bottom' }));
    const top = edgeAt(sorted, markerPosition({ floor, edge: 'top' }));
    return { id: floor, points: [bottom.left, bottom.right, top.right, top.left] };
  });
}

const usableRender = (render) => Boolean(render?.src && render.size && render.floors?.length >= 2);

// Kule render'ları: dikey görsel (render) ve isteğe bağlı geniş görsel (render.wide, yatay ekranlar için).
export function towerRenderVariants(project) {
  const render = project.tower.render;
  return [
    usableRender(render) && { ...render, shape: 'portrait', fit: 'contain' },
    usableRender(render?.wide) && { ...render.wide, shape: 'wide', fit: 'cover' },
  ].filter(Boolean);
}

// Yatay ekranda geniş görsel (varsa), dikey ekranda dikey görsel; biri yoksa diğeri.
export function pickTowerRender(variants, { width, height }) {
  const preferred = width > height ? 'wide' : 'portrait';
  return variants.find((variant) => variant.shape === preferred) ?? variants[0] ?? null;
}
