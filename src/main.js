// Giriş noktası: proje ve sözlükleri yükler, düğmeleri kurar, ekranı çizer.

import { initI18n, localize } from './i18n.js';
import { initCurrency } from './currency.js';
import { getState, subscribe } from './state.js';
import { initRouter } from './router.js';
import { loadProject } from './data/load-project.js';
import { loadUnits } from './data/load-units.js';
import { applyBindings } from './ui/bindings.js';
import { mountToggles } from './ui/toggles.js';
import { mountScreens } from './screens/manager.js';
import { mountLeadForm } from './screens/lead-form.js';

async function boot() {
  const projectId = document.body.dataset.project;
  const [project] = await Promise.all([loadProject(projectId), initI18n()]);
  initCurrency(project.currency);
  const units = await loadUnits(project);
  initRouter();

  const syncToggles = mountToggles(document.querySelector('[data-slot="toggles"]'));
  const refresh = () => {
    document.title = localize(project.name);
    applyBindings();
  };

  refresh();
  syncToggles(getState());
  document.body.dataset.ready = 'true';
  mountScreens(document.querySelector('[data-slot="screen"]'), { project, units });
  mountLeadForm({ project, units });

  subscribe((state, changed) => {
    if (changed.includes('lang') || changed.includes('currency')) refresh();
  });
}

boot().catch((error) => {
  console.error('[boot]', error);
  document.body.dataset.ready = 'error';
});
