// Tek kaçış noktalı perspektif kamera. Oda kutusu metre cinsinden:
// x ∈ [-w/2, w/2] (sol → sağ), y ∈ [0, h] (zemin → tavan), z ∈ [near, back] (kameradan uzaklık).
// Kaçış noktası arka duvarın ortasında, göz hizasında; ufuk çizgisi de oradan geçer.

import { toPoints } from '../svg.js';

export function createCamera({ width, height, room, eye = 1.5 }) {
  const portrait = height > width;
  const cx = width / 2;
  const cy = height * (portrait ? 0.42 : 0.47);
  const share = portrait ? 0.84 : 0.5;
  const focal = (back) => Math.min((share * width * back) / room.w, (0.58 * height * back) / room.h);

  // Ön kesit ekranı tümüyle kaplayacak kadar yakın olmalı.
  let near = room.d;
  for (let i = 0; i < 3; i += 1) {
    const f = focal(near + room.d);
    near = 0.92 * Math.min((f * room.w) / width, (f * eye) / (height - cy), (f * (room.h - eye)) / cy);
  }
  const back = near + room.d;
  const f = focal(back);

  const project = (x, y, z) => [cx + (f * x) / z, cy + (f * (eye - y)) / z];

  return {
    width,
    height,
    cx,
    cy,
    f,
    eye,
    near,
    back,
    room,
    project,
    poly: (points) => toPoints(points.map(([x, y, z]) => project(x, y, z))),
    size: (metres, z) => (f * metres) / z,
  };
}
