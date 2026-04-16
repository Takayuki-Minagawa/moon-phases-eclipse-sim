// Quiz module: three kinds of questions as specified in §3.5.

import { t } from './i18n.js';

const PHASE_KEYS = [
  'new', 'waxingCrescent', 'firstQuarter', 'waxingGibbous',
  'full', 'waningGibbous', 'lastQuarter', 'waningCrescent',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a question object for the current state / requested kind.
// For phaseName & layoutToPhase questions, the app should first jump the
// simulation to `target.day` so the user can look at the rendered state.
export function buildQuestion(kind, state, opts = {}) {
  if (kind === 'phaseName' || kind === 'layoutToPhase') {
    const truth = opts.useCurrentPhase ? state.phaseKey : pick(PHASE_KEYS);
    const targetSynodic = opts.useCurrentPhase ? null : synodicForPhase(truth);
    const choices = shuffle([truth, ...shuffle(PHASE_KEYS.filter(k => k !== truth)).slice(0, 3)])
      .map(k => ({ key: k, label: t(`phase.${k}`) }));
    return {
      kind,
      text: kind === 'phaseName' ? t('q.phaseName') : t('q.layout'),
      choices,
      answer: truth,
      targetSynodic,
    };
  }
  if (kind === 'eclipseCond') {
    const options = [
      { key: 'a', label: t('q.eclipse.a') },
      { key: 'b', label: t('q.eclipse.b') },
      { key: 'c', label: t('q.eclipse.c') },
      { key: 'd', label: t('q.eclipse.d') },
    ];
    return {
      kind,
      text: t('q.eclipse'),
      choices: shuffle(options),
      answer: 'c',
      targetSynodic: null,
    };
  }
  throw new Error(`unknown quiz kind ${kind}`);
}

function synodicForPhase(key) {
  switch (key) {
    case 'new':            return 2;
    case 'waxingCrescent': return 45;
    case 'firstQuarter':   return 90;
    case 'waxingGibbous':  return 135;
    case 'full':           return 180;
    case 'waningGibbous':  return 225;
    case 'lastQuarter':    return 270;
    case 'waningCrescent': return 315;
    default:               return 0;
  }
}
