// "svg:<ad>" görsellerinin üretici kaydı. Üreticiler sonraki fazlarda eklenecek.

const generators = new Map();

export function registerVisual(name, generator) {
  generators.set(name, generator);
}

export function renderVisual(name, options = {}) {
  const generator = generators.get(name);
  if (!generator) throw new Error(`unknown visual: svg:${name}`);
  return generator(options);
}
