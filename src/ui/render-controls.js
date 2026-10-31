// Çizim / Render düğmesi ve "Temsilidir" etiketi. Yalnızca render'ı olan ekranlarda görünür.

import { getState, subscribe } from '../state.js';
import { VISUAL_MODES, setVisualMode } from '../visual-mode.js';
import { buildGroup } from './toggles.js';

export function createRenderControls() {
  const element = document.createElement('div');
  element.className = 'render-controls';
  element.hidden = true;

  const group = buildGroup({
    stateKey: 'visualMode',
    labelKey: 'visual.label',
    onSelect: setVisualMode,
    options: VISUAL_MODES.map((mode) => ({
      value: mode,
      textKey: `visual.${mode}`,
      nameKey: `visual.${mode}Name`,
    })),
  });
  const note = document.createElement('p');
  note.className = 'render-note';
  note.dataset.i18n = 'visual.illustrative';
  note.hidden = true;
  element.append(group.element, note);

  group.sync(getState().visualMode);
  const unsubscribe = subscribe((state, changed) => {
    if (changed.includes('visualMode')) group.sync(state.visualMode);
  });

  return {
    element,
    // Ekranda render seçeneği var mı?
    setAvailable(available) {
      element.hidden = !available;
    },
    // Şu an gerçekten render mı görünüyor? (yüklenemezse çizim görünür, etiket kalkar)
    setShowing(showing) {
      note.hidden = !showing;
    },
    destroy: unsubscribe,
  };
}
