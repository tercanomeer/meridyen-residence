// "svg:tower" üreticisi: akşam saatinde deniz kenarında kule, komşu siluetler ve su yansıması.
// Sahne verilen genişlik/yüksekliğe göre kurulur; her kat için 0–1 oransal tıklama alanı döndürür.

import { svgEl, uniqueId } from './svg.js';
import { towerGeometry, levelOutline } from './tower/geometry.js';
import { backdropDefs, drawSky, drawLand, drawSea, reflectionMask, drawWaterSurface } from './tower/backdrop.js';
import { buildingDefs, drawTower } from './tower/building.js';

const ID_KEYS = ['sky', 'sun', 'sea', 'glass', 'sheen', 'rim', 'glow', 'lights', 'land', 'reflection', 'reflectionFade', 'blur'];

export function towerSvg({
  width,
  height,
  floors,
  plate,
  seed = 'tower',
  focusX = 0.5,
  topInset = 0,
  amenityFloors = [],
  terraceFloors = [],
  label = '',
}) {
  const geo = towerGeometry({ width, height, floors, plate, focusX, topInset });
  const ids = Object.fromEntries(ID_KEYS.map((key) => [key, uniqueId(`tw-${key}`)]));

  const towerOptions = {
    seed,
    ids,
    amenityFloors,
    terraceFloors,
    bays: Math.max(3, Math.round(plate[0] / 4)),
    sideBays: Math.max(2, Math.round(plate[1] / 4.5)),
  };

  const land = svgEl('g', { id: ids.land }, [drawLand(geo, seed), drawTower(geo, towerOptions)]);

  const reflection = svgEl('g', { mask: `url(#${ids.reflection})`, filter: `url(#${ids.blur})`, opacity: 0.6 }, [
    svgEl('g', { transform: `translate(0 ${geo.shoreY * 2}) scale(1 -1)` }, [svgEl('use', { href: `#${ids.land}` })]),
  ]);

  const element = svgEl(
    'svg',
    {
      class: 'tower-scene',
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': label,
    },
    [
      svgEl('defs', {}, [
        ...backdropDefs(geo, ids),
        ...buildingDefs(geo, ids),
        reflectionMask(geo, seed, ids),
        svgEl('filter', { id: ids.blur, x: 0, y: '-5%', width: '100%', height: '110%' }, [
          svgEl('feGaussianBlur', { stdDeviation: '0.6 1.8' }),
        ]),
      ]),
      drawSky(geo, seed, ids),
      land,
      drawSea(geo, ids),
      reflection,
      drawWaterSurface(geo, seed),
    ],
  );

  const toUnit = (points) => points.map(([x, y]) => [x / width, y / height]);
  const hitPad = geo.floorH * 1.2;
  const hotspots = geo.levels.map((level) => ({
    id: level.floor,
    outline: toUnit(levelOutline(geo, level)),
    points: toUnit(levelOutline(geo, level, hitPad)),
  }));

  return { element, viewBox: [width, height], hotspots };
}
