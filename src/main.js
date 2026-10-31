// Giriş noktası: proje ve sözlükleri yükler, düğmeleri kurar, ekranı çizer.

import { initI18n, localize } from './i18n.js';
import { initCurrency } from './currency.js';
import { getState, subscribe } from './state.js';
import { loadProject } from './data/load-project.js';
import { loadUnits } from './data/load-units.js';
import { applyBindings } from './ui/bindings.js';
import { mountToggles } from './ui/toggles.js';
import { renderWelcome } from './screens/welcome.js';

async function boot() {
  const projectId = document.body.dataset.project;
  const [project] = await Promise.all([loadProject(projectId), initI18n()]);
  initCurrency(project.currency);
  const units = await loadUnits(project);

  const screen = document.querySelector('[data-slot="screen"]');
  const syncToggles = mountToggles(document.querySelector('[data-slot="toggles"]'));

  const render = () => {
    document.title = localize(project.name);
    renderWelcome(screen, { project, units });
    applyBindings();
  };

  render();
  syncToggles(getState());
  subscribe((state, changed) => {
    if (changed.includes('lang') || changed.includes('currency')) render();
  });

  document.body.dataset.ready = 'true';
}

boot().catch((error) => {
  console.error('[boot]', error);
  document.body.dataset.ready = 'error';
});
