// Görsel türü: "render" (fotogerçekçi görsel varsa o) ya da "drawing" (her zaman svg çizim).
// Seçim localStorage'da hatırlanır; render'ı olmayan ekranlar bu ayardan etkilenmez.

import { getState, setState } from './state.js';
import { readPref, writePref } from './storage.js';

export const VISUAL_MODES = ['drawing', 'render'];
const DEFAULT_MODE = 'render';
const STORAGE_KEY = 'visual';

export function initVisualMode() {
  const saved = readPref(STORAGE_KEY);
  setState({ visualMode: VISUAL_MODES.includes(saved) ? saved : DEFAULT_MODE });
}

export function setVisualMode(mode) {
  if (!VISUAL_MODES.includes(mode)) return;
  writePref(STORAGE_KEY, mode);
  setState({ visualMode: mode });
}

// Bu slot için render gösterilmeli mi?
export function wantsRender(render) {
  return Boolean(render?.src) && getState().visualMode === 'render';
}
