// Kart içerikleri: kat özeti ve daire özeti (hover-card biçiminde).

import { t, localize } from '../i18n.js';
import { formatPrice } from '../currency.js';

export function floorCard(summary) {
  const base = { id: summary.floor, title: t('tower.floorTitle', { floor: summary.floor }) };
  if (summary.kind === 'amenity') {
    return { ...base, meta: localize(summary.amenity.label), note: localize(summary.amenity.features?.[0]) };
  }
  return {
    ...base,
    meta: `${t('tower.unitCount', { count: summary.total })} · ${t('tower.availableCount', { count: summary.available })}`,
    price: summary.fromPrice !== null ? { label: t('tower.startingFrom'), value: formatPrice(summary.fromPrice) } : null,
    note: summary.fromPrice === null ? t(summary.soldOut ? 'tower.soldOut' : 'tower.noneAvailable') : null,
    action: t('tower.explore'),
  };
}

export function unitCard(unit, type) {
  return {
    id: unit.id,
    title: t('unit.title', { id: unit.id }),
    meta: `${localize(type.label)} · ${t('unit.areaValue', { area: type.area })}`,
    price: unit.status === 'sold' ? null : { value: formatPrice(unit.price) },
    status: { key: unit.status, text: t(`status.${unit.status}`) },
    action: t('tower.explore'),
  };
}

export function floorDescription(summary) {
  const card = floorCard(summary);
  return [card.title, card.meta, card.price && `${card.price.label} ${card.price.value}`, card.note]
    .filter(Boolean)
    .join(', ');
}

export function unitDescription(unit, type) {
  const card = unitCard(unit, type);
  return [card.title, card.meta, card.price?.value, card.status.text].filter(Boolean).join(', ');
}
