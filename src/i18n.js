// Arayüz dili: sözlükleri yükler, t('anahtar') ile metin verir, seçimi hatırlar.

import { getState, setState } from './state.js';
import { readPref, writePref } from './storage.js';

export const LANGUAGES = ['tr', 'en'];
const FALLBACK_LANG = 'en';
const STORAGE_KEY = 'lang';

const dictionaries = {};
const warned = new Set();

export async function initI18n() {
  const entries = await Promise.all(
    LANGUAGES.map(async (lang) => {
      const response = await fetch(`i18n/${lang}.json`);
      if (!response.ok) throw new Error(`i18n/${lang}.json: ${response.status}`);
      return [lang, await response.json()];
    }),
  );
  Object.assign(dictionaries, Object.fromEntries(entries));
  applyLang(detectLang());
}

function detectLang() {
  const saved = readPref(STORAGE_KEY);
  if (LANGUAGES.includes(saved)) return saved;

  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of preferred) {
    const base = String(tag || '').toLowerCase().split('-')[0];
    if (LANGUAGES.includes(base)) return base;
  }
  return FALLBACK_LANG;
}

function applyLang(lang) {
  document.documentElement.lang = lang;
  setState({ lang });
}

export function setLang(lang) {
  if (!LANGUAGES.includes(lang)) return;
  writePref(STORAGE_KEY, lang);
  applyLang(lang);
}

export function getLang() {
  return getState().lang ?? FALLBACK_LANG;
}

export function getLocale() {
  return lookup(dictionaries[getLang()], 'meta.locale') ?? getLang();
}

function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => node?.[part], dictionary);
}

// Önce seçili dil, sonra diğer diller; hiçbirinde yoksa anahtarın kendisi.
export function t(key, vars) {
  const order = [getLang(), ...LANGUAGES.filter((lang) => lang !== getLang())];
  const text = order.map((lang) => lookup(dictionaries[lang], key)).find((v) => typeof v === 'string');

  if (text === undefined) {
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`[i18n] missing key: ${key}`);
    }
    return key;
  }
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

// project.json'daki { "tr": "…", "en": "…" } nesnelerini seçili dile çevirir.
export function localize(value) {
  if (value == null || typeof value === 'string') return value ?? '';
  return value[getLang()] ?? LANGUAGES.map((lang) => value[lang]).find(Boolean) ?? '';
}
