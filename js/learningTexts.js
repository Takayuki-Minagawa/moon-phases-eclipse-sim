// Build learning-panel texts from the current state.
// Extracted so future localisation additions stay isolated.

import { t } from './i18n.js';

export function buildExplain(state) {
  const illumPct = Math.round(state.illumFrac * 100);
  const pa = (state.phaseAngle * 180 / Math.PI).toFixed(1);
  const lat = state.moonLatDeg.toFixed(2);
  const age = state.moonAge.toFixed(1);
  const name = t(`phase.${state.phaseKey}`);

  return t('explain.phase', { name, age, illum: illumPct, pa, lat });
}

export function buildTiltNote(tiltEnabled) {
  return tiltEnabled ? t('explain.tiltOn') : t('explain.noTilt');
}

export function buildEclipseLine(eclipse) {
  if (!eclipse?.possible) return null;
  if (eclipse.kind === 'solar') return t(`eclipse.solar.${eclipse.type}`);
  if (eclipse.kind === 'lunar') return t(`eclipse.lunar.${eclipse.type}`);
  return null;
}

export function buildWhy() {
  return { title: t('why.title'), body: t('why.body') };
}
