// Missions: small goals that are checked automatically against the
// simulation state. Progress is kept in localStorage.

import { wrap180 } from './simulation.js';

const KEY = 'mpes-missions';

export const MISSIONS = [
  {
    id: 'crescent',
    title: { ja: '三日月をつくろう', en: 'Make a waxing crescent' },
    hint: { ja: '月の位置スライダーを少しだけ右へ。月が太陽から東へ 30〜60° ほどはなれると三日月です。', en: 'Move the Moon-position slider a little. About 30–60° east of the Sun gives a crescent.' },
    check: s => s.phaseKey === 'waxingCrescent',
  },
  {
    id: 'firstQuarter',
    title: { ja: '上弦の月（右半分が光る）をつくろう', en: 'Make a first-quarter Moon' },
    hint: { ja: '太陽 − 地球 − 月 が直角になる位置です。俯瞰ビューで月をドラッグしてみよう。', en: 'Sun – Earth – Moon at a right angle. Try dragging the Moon in the overhead view.' },
    check: s => Math.abs(wrap180(s.synodic - 90)) < 6,
  },
  {
    id: 'drag',
    title: { ja: '俯瞰ビューの月をドラッグして 1 周させよう', en: 'Drag the Moon all the way round' },
    hint: { ja: '俯瞰ビューの月をつかんで、地球のまわりを反時計回りに回してみよう。', en: 'Grab the Moon in the overhead view and take it round Earth.' },
    check: (s, c) => c.dragTurns >= 1,
  },
  {
    id: 'fullNoEclipse',
    title: { ja: '「満月なのに月食なし」を確かめよう', en: 'Find a full moon with no eclipse' },
    hint: { ja: '白道の傾き ON のまま「満月」ボタンへ。食の判定図で、月が影の上か下を通るのを見よう。', en: 'With tilt ON, jump to a full moon and look at the eclipse check.' },
    check: (s, c) => c.tilt && Math.abs(wrap180(s.synodic - 180)) < 3 && !s.eclipse.possible,
  },
  {
    id: 'noTiltEclipse',
    title: { ja: '傾きを OFF にして日食を起こそう', en: 'Turn the tilt OFF and make a solar eclipse' },
    hint: { ja: '「白道の傾き」を OFF にして、新月にしてみよう。', en: 'Switch the tilt OFF, then go to new moon.' },
    check: (s, c) => !c.tilt && s.eclipse.possible && s.eclipse.kind === 'solar',
  },
  {
    id: 'totalLunar',
    title: { ja: '本物の皆既月食を見つけよう', en: 'Find a real total lunar eclipse' },
    hint: { ja: '傾き ON で「次の月食」をくり返し押すか、食カレンダーから探そう。', en: 'With tilt ON, press “Next lunar” or use the eclipse list.' },
    check: (s, c) => c.tilt && s.eclipse.kind === 'lunar' && s.eclipse.type === 'total',
  },
  {
    id: 'annular',
    title: { ja: '金環日食を見つけよう', en: 'Find an annular solar eclipse' },
    hint: { ja: '月が地球から遠いときの日食です。「次の日食」で探してみよう。', en: 'It happens when the Moon is far away. Use “Next solar”.' },
    check: (s, c) => c.tilt && s.eclipse.kind === 'solar' && s.eclipse.type === 'annular',
  },
  {
    id: 'season',
    title: { ja: '太陽中心モードで「食の季節」を見つけよう', en: 'Spot an eclipse season in Sun-centred mode' },
    hint: { ja: '表示を「太陽中心」にして時間を進め、交点線が太陽を向く時期を探そう。', en: 'Switch to Sun-centred and play until the node line points at the Sun.' },
    check: (s, c) => c.mode === 'helio' && c.season,
  },
  {
    id: 'quiz5',
    title: { ja: 'クイズで 5 問正解しよう', en: 'Answer 5 quiz questions correctly' },
    hint: { ja: '学習パネルの「クイズ」タブから挑戦しよう。', en: 'Open the Quiz tab in the Learn panel.' },
    check: (s, c) => c.quizCorrect >= 5,
  },
];

export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch { return {}; }
}

export function saveProgress(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

// Returns the missions newly completed by this state.
export function checkMissions(s, ctx, progress) {
  const done = [];
  for (const m of MISSIONS) {
    if (progress[m.id]) continue;
    if (m.check(s, ctx)) { progress[m.id] = true; done.push(m); }
  }
  if (done.length) saveProgress(progress);
  return done;
}
