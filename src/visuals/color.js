// Renk yardımcıları: koyulaştırma ve açma (#rrggbb).

function channels(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [16, 8, 0].map((shift) => (value >> shift) & 255);
}

function toHex(values) {
  return `#${values.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

export function shade(hex, amount) {
  return toHex(channels(hex).map((c) => c * (1 - amount)));
}

export function lighten(hex, amount) {
  return toHex(channels(hex).map((c) => c + (255 - c) * amount));
}
