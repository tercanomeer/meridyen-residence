// Randevu formu: ad, telefon, e-posta, ilgilenilen daire (otomatik dolu), tercih edilen gün.
// state.leadUnit dolunca modal olarak açılır; gönderim submit-lead.js üzerinden yapılır.

import { t, getLang } from '../i18n.js';
import { getState, setState, subscribe } from '../state.js';
import { submitLead } from '../data/submit-lead.js';
import { fadeIn } from '../motion.js';

const DAY = 24 * 60 * 60 * 1000;
const BOOKING_WINDOW = 60;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS = /^[+\d\s().-]+$/;

const FIELDS = [
  { name: 'name', type: 'text', autocomplete: 'name' },
  { name: 'phone', type: 'tel', autocomplete: 'tel', inputmode: 'tel' },
  { name: 'email', type: 'email', autocomplete: 'email', inputmode: 'email' },
  { name: 'unit', type: 'select' },
  { name: 'date', type: 'date' },
];

function isoDay(offsetDays) {
  const date = new Date(Date.now() + offsetDays * DAY);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Boşsa "zorunlu", biçimi yanlışsa alana özel hata anahtarı döner.
function validate(name, value) {
  const text = value.trim();
  if (!text) return 'lead.errors.required';
  if (name === 'name' && text.length < 2) return 'lead.errors.name';
  if (name === 'phone') {
    const digits = text.replace(/\D/g, '').length;
    if (!PHONE_CHARS.test(text) || digits < 10 || digits > 15) return 'lead.errors.phone';
  }
  if (name === 'email' && !EMAIL.test(text)) return 'lead.errors.email';
  if (name === 'date' && (text < isoDay(1) || text > isoDay(BOOKING_WINDOW))) return 'lead.errors.date';
  return null;
}

function fieldMarkup({ name, type, autocomplete, inputmode }) {
  const control = type === 'select'
    ? `<select id="lead-${name}" name="${name}" required aria-describedby="lead-${name}-error"></select>`
    : `<input id="lead-${name}" name="${name}" type="${type}" required aria-describedby="lead-${name}-error"${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${inputmode ? ` inputmode="${inputmode}"` : ''}>`;
  return `
    <div class="field" data-field="${name}">
      <label for="lead-${name}"></label>
      ${control}
      <p class="field__error" id="lead-${name}-error"></p>
    </div>`;
}

export function mountLeadForm({ project, units }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'lead';
  dialog.setAttribute('aria-labelledby', 'lead-title');
  dialog.innerHTML = `
    <div class="lead__sheet">
      <button type="button" class="lead__close" data-action="close"><span aria-hidden="true">×</span></button>
      <form class="lead__form" novalidate>
        <h2 class="lead__title" id="lead-title"></h2>
        <p class="lead__intro"></p>
        ${FIELDS.map(fieldMarkup).join('')}
        <p class="lead__status" role="alert"></p>
        <button type="submit" class="button button--primary lead__submit"></button>
      </form>
      <div class="lead__done" hidden>
        <span class="lead__done-mark" aria-hidden="true"></span>
        <h2 class="lead__title lead__done-title" tabindex="-1"></h2>
        <p class="lead__intro lead__done-text"></p>
        <button type="button" class="button button--primary" data-action="close"></button>
      </div>
    </div>`;
  document.body.append(dialog);

  const form = dialog.querySelector('form');
  const done = dialog.querySelector('.lead__done');
  const status = dialog.querySelector('.lead__status');
  const submit = dialog.querySelector('.lead__submit');
  const control = (name) => form.elements.namedItem(name);
  let attempted = false;
  let sending = false;
  let opener = null;

  function renderUnitOptions(selectedId) {
    const select = control('unit');
    const choices = units.filter((unit) => unit.status !== 'sold' || unit.id === selectedId);
    const floors = [...new Set(choices.map((unit) => unit.floor))];
    select.replaceChildren(
      ...floors.map((floor) => {
        const group = document.createElement('optgroup');
        group.label = t('tower.floorTitle', { floor });
        choices
          .filter((unit) => unit.floor === floor)
          .forEach((unit) => {
            const option = document.createElement('option');
            option.value = unit.id;
            option.textContent = `${t('unit.title', { id: unit.id })} · ${t('unit.areaValue', { area: project.unitTypes[unit.type].area })}`;
            group.append(option);
          });
        return group;
      }),
    );
    select.value = selectedId ?? select.value;
  }

  function renderTexts() {
    dialog.querySelector('.lead__close').setAttribute('aria-label', t('lead.close'));
    form.querySelector('.lead__title').textContent = t('lead.title');
    form.querySelector('.lead__intro').textContent = t('lead.intro');
    FIELDS.forEach(({ name }) => {
      form.querySelector(`label[for="lead-${name}"]`).textContent = t(`lead.fields.${name}`);
    });
    control('date').min = isoDay(1);
    control('date').max = isoDay(BOOKING_WINDOW);
    renderUnitOptions(control('unit').value || getState().leadUnit);
    submit.textContent = t(sending ? 'lead.sending' : 'lead.submit');
    done.querySelector('.lead__done-title').textContent = t('lead.doneTitle');
    done.querySelector('.lead__done-text').textContent = t('lead.doneText');
    done.querySelector('[data-action="close"]').textContent = t('lead.close');
    if (attempted) validateAll();
  }

  function showError(name, key) {
    const field = form.querySelector(`[data-field="${name}"]`);
    field.classList.toggle('is-invalid', Boolean(key));
    control(name).setAttribute('aria-invalid', String(Boolean(key)));
    field.querySelector('.field__error').textContent = key ? t(key) : '';
  }

  function validateAll() {
    const invalid = FIELDS.map(({ name }) => {
      const key = validate(name, control(name).value);
      showError(name, key);
      return key ? name : null;
    }).filter(Boolean);
    status.textContent = invalid.length ? t('lead.errors.summary') : '';
    return invalid;
  }

  function open(unitId) {
    opener = document.activeElement;
    attempted = false;
    sending = false;
    form.hidden = false;
    done.hidden = true;
    renderTexts();
    renderUnitOptions(unitId);
    FIELDS.forEach(({ name }) => showError(name, null));
    status.textContent = '';
    document.documentElement.classList.add('is-locked');
    dialog.showModal();
    fadeIn(dialog.querySelector('.lead__sheet'), { y: 16 });
    control('name').focus();
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('is-locked');
    if (getState().leadUnit !== null) setState({ leadUnit: null });
    opener?.focus?.({ preventScroll: true });
  });

  // Esc yalnızca formu kapatır; yönlendiricinin "geri"sine ulaşmaz.
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-action="close"]')) close();
  });

  form.addEventListener('input', (event) => {
    if (attempted && event.target.name) showError(event.target.name, validate(event.target.name, event.target.value));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    attempted = true;
    const invalid = validateAll();
    if (invalid.length) {
      control(invalid[0]).focus();
      return;
    }

    sending = true;
    submit.disabled = true;
    submit.textContent = t('lead.sending');
    try {
      await submitLead(project, {
        unitId: control('unit').value,
        name: control('name').value.trim(),
        phone: control('phone').value.trim(),
        email: control('email').value.trim(),
        date: control('date').value,
        lang: getLang(),
      });
      form.hidden = true;
      done.hidden = false;
      done.querySelector('.lead__done-title').focus();
    } catch {
      status.textContent = t('lead.errors.submit');
    } finally {
      sending = false;
      submit.disabled = false;
      submit.textContent = t('lead.submit');
    }
  });

  subscribe((state, changed) => {
    if (changed.includes('leadUnit') && state.leadUnit !== null && !dialog.open) open(state.leadUnit);
    if (changed.includes('lang') && dialog.open) renderTexts();
  });
}
