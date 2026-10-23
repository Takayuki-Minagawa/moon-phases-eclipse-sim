// Quiz: phase names, layout → shape, when/where the Moon is visible, and how
// eclipses work. Each question carries an explanation and, where useful, an
// action that lets the learner check the answer in the simulator.

import { t, tr } from './i18n.js';
import { PHASE_INFO } from './learningTexts.js';
import { PHASE_SYNODIC } from './moonShape.js';

export const PHASE_KEYS = Object.keys(PHASE_SYNODIC);
export const QUIZ_KINDS = ['phaseName', 'layoutToPhase', 'visibleTime', 'eclipseCond'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const VISIBLE = [
  { q: { ja: '夕方（18 時ごろ）、南の空高くに見える月は？', en: 'Which Moon is high in the south at about 6 pm?' }, a: 'firstQuarter' },
  { q: { ja: '真夜中（0 時ごろ）、南の空高くに見える月は？', en: 'Which Moon is high in the south around midnight?' }, a: 'full' },
  { q: { ja: '明け方（6 時ごろ）、南の空高くに見える月は？', en: 'Which Moon is high in the south at about 6 am?' }, a: 'lastQuarter' },
  { q: { ja: '夕方、東の空から昇ってくる月は？', en: 'Which Moon rises in the east at sunset?' }, a: 'full' },
  { q: { ja: '日の入り直後、西の空の低いところに見える細い月は？', en: 'Which thin Moon is low in the west just after sunset?' }, a: 'waxingCrescent' },
  { q: { ja: '日の出前、東の空の低いところに見える細い月は？', en: 'Which thin Moon is low in the east just before sunrise?' }, a: 'waningCrescent' },
  { q: { ja: '真夜中ごろに東の空から昇ってくる月は？', en: 'Which Moon rises in the east around midnight?' }, a: 'lastQuarter' },
  { q: { ja: '正午ごろに東の空から昇ってくる月は？', en: 'Which Moon rises in the east around noon?' }, a: 'firstQuarter' },
];
const VISIBLE_CHOICES = ['waxingCrescent', 'firstQuarter', 'full', 'lastQuarter', 'waningCrescent'];

const ECLIPSE_BANK = [
  {
    q: { ja: '日食・月食について、正しいのはどれ？', en: 'Which statement about eclipses is correct?' },
    choices: [
      { ja: '日食は新月のたびに必ず起きる', en: 'A solar eclipse happens at every new moon' },
      { ja: '月食は満月のたびに必ず起きる', en: 'A lunar eclipse happens at every full moon' },
      { ja: '月の軌道が傾いているため、交点付近で新月・満月になるときだけ食が起きる', en: 'Because the orbit is tilted, eclipses only happen when new/full moon is near a node' },
      { ja: '月食は新月のとき、日食は満月のときに起きる', en: 'Lunar eclipses happen at new moon and solar ones at full moon' },
    ],
    answer: 2,
    why: { ja: '白道は黄道に対して約 5.1° 傾いています。ふだんの新月・満月では月が上か下にずれるので、食は起きません。', en: 'The Moon’s path is tilted ~5.1°; at most new and full moons it passes above or below.' },
    demo: 'tiltOffSolar',
  },
  {
    q: { ja: '月の満ち欠けが起こる理由は？', en: 'Why does the Moon have phases?' },
    choices: [
      { ja: '地球の影が月にかかる部分が変わるから', en: 'Earth’s shadow covers different parts of it' },
      { ja: '太陽に照らされた半分を、地球から見る角度が変わるから', en: 'We see its sunlit half from changing angles' },
      { ja: '月が自分で出す光の強さが変わるから', en: 'The light the Moon gives off changes' },
      { ja: '月と地球の距離が変わるから', en: 'Its distance from Earth changes' },
    ],
    answer: 1,
    why: { ja: '月はいつも半分が照らされています。地球の影が月にかかるのは月食のときだけです。', en: 'Half of the Moon is always lit. Earth’s shadow falls on it only during a lunar eclipse.' },
    demo: 'guide',
  },
  {
    q: { ja: '日食のときの並び順は？', en: 'What is the order during a solar eclipse?' },
    choices: [
      { ja: '太陽 − 月 − 地球', en: 'Sun – Moon – Earth' },
      { ja: '太陽 − 地球 − 月', en: 'Sun – Earth – Moon' },
      { ja: '月 − 太陽 − 地球', en: 'Moon – Sun – Earth' },
      { ja: '直角に並ぶ', en: 'At right angles' },
    ],
    answer: 0,
    why: { ja: '月が太陽と地球の間に入り、月の影が地球に落ちると日食です。月の形は新月です。', en: 'The Moon passes between Sun and Earth and its shadow falls on Earth — at new moon.' },
    demo: 'solar',
  },
  {
    q: { ja: '月食が起こるときの月の形は？', en: 'What phase is the Moon in during a lunar eclipse?' },
    choices: [
      { ja: '新月', en: 'New moon' }, { ja: '上弦の月', en: 'First quarter' },
      { ja: '満月', en: 'Full moon' }, { ja: '下弦の月', en: 'Last quarter' },
    ],
    answer: 2,
    why: { ja: '太陽 − 地球 − 月 と並び、月が地球の影に入るのは満月のときだけです。', en: 'Only at full moon can the Moon enter Earth’s shadow (Sun – Earth – Moon).' },
    demo: 'lunar',
  },
  {
    q: { ja: '皆既日食と金環日食のちがいが生まれる理由は？', en: 'Why are some solar eclipses total and others annular?' },
    choices: [
      { ja: '太陽の大きさが季節で変わるから', en: 'The Sun changes size with the seasons' },
      { ja: '月と地球の距離が変わり、月の見かけの大きさが変わるから', en: 'The Moon’s distance — and so its apparent size — changes' },
      { ja: '地球の大気の厚さが変わるから', en: 'Earth’s atmosphere changes thickness' },
      { ja: '月の自転の速さが変わるから', en: 'The Moon’s spin speed changes' },
    ],
    answer: 1,
    why: { ja: '月の軌道はわずかにだ円なので、遠いときは月が太陽より小さく見え、縁が残って金環日食になります。', en: 'The orbit is slightly elliptical. When far, the Moon looks smaller than the Sun and leaves a ring.' },
    demo: 'annular',
  },
  {
    q: { ja: '皆既月食で月が赤銅色に見えるのはなぜ？', en: 'Why is the totally eclipsed Moon coppery red?' },
    choices: [
      { ja: '月の表面が熱くなって光るから', en: 'The Moon’s surface heats up and glows' },
      { ja: '地球の大気で曲げられた赤い光が本影に届くから', en: 'Red light bent by Earth’s atmosphere reaches the umbra' },
      { ja: '太陽が赤くなるから', en: 'The Sun turns red' },
      { ja: '半影の色が赤いから', en: 'The penumbra is red' },
    ],
    answer: 1,
    why: { ja: '大気を通ると青い光は散らばり、残った赤い光が屈折して影の中を照らします。', en: 'Blue light is scattered by the air; the remaining red light is bent into the shadow.' },
    demo: 'totalLunar',
  },
  {
    q: { ja: '月食を見られる場所について正しいのは？', en: 'Where can a lunar eclipse be seen?' },
    choices: [
      { ja: '月が出ている地域ならどこでも同時に見られる', en: 'Anywhere the Moon is above the horizon, at the same moment' },
      { ja: '幅数百 km の細い帯の中だけ', en: 'Only in a narrow band a few hundred km wide' },
      { ja: '赤道付近だけ', en: 'Only near the equator' },
      { ja: '昼の地域だけ', en: 'Only on the daytime side' },
    ],
    answer: 0,
    why: { ja: '月そのものが暗くなる現象なので、月が見える夜側ならどこでも見られます。細い帯でしか見られないのは皆既・金環日食です。', en: 'The Moon itself darkens, so the whole night side sees it. Narrow bands are a solar-eclipse thing.' },
    demo: 'lunar',
  },
  {
    q: { ja: '白道（月の通り道）は黄道に対して約何度傾いている？', en: 'How much is the Moon’s path tilted to the ecliptic?' },
    choices: [
      { ja: '約 0.5°', en: 'About 0.5°' }, { ja: '約 5°', en: 'About 5°' },
      { ja: '約 23.4°', en: 'About 23.4°' }, { ja: '約 45°', en: 'About 45°' },
    ],
    answer: 1,
    why: { ja: '約 5.1° です。23.4° は地球の自転軸の傾きなので混同に注意。', en: 'About 5.1°. 23.4° is the tilt of Earth’s axis — don’t mix them up.' },
    demo: 'tiltOffSolar',
  },
  {
    q: { ja: '食の季節は 1 年に約何回？', en: 'About how many eclipse seasons are there per year?' },
    choices: [
      { ja: '1 回', en: 'One' }, { ja: '2 回', en: 'Two' }, { ja: '4 回', en: 'Four' }, { ja: '12 回', en: 'Twelve' },
    ],
    answer: 1,
    why: { ja: '交点線が太陽の方を向くのは、地球が公転する間に 2 回（約 173 日ごと）です。', en: 'The node line points at the Sun twice per orbit — about every 173 days.' },
    demo: 'helio',
  },
  {
    q: { ja: '新月のとき月が見えない理由は？', en: 'Why can’t we see the new moon?' },
    choices: [
      { ja: '地球の影に入っているから', en: 'It is inside Earth’s shadow' },
      { ja: '太陽と同じ方向にあり、照らされていない面が地球を向くから', en: 'It is near the Sun in the sky with its dark side toward us' },
      { ja: '地平線の下にずっとあるから', en: 'It stays below the horizon' },
      { ja: '月が遠ざかるから', en: 'It moves too far away' },
    ],
    answer: 1,
    why: { ja: '新月は昼間、太陽の近くの空にあります。地球の影に入る（月食）のは満月のときです。', en: 'The new moon is up in the daytime near the Sun; entering Earth’s shadow happens at full moon.' },
    demo: 'phase:new',
  },
  {
    q: { ja: '半影月食の見え方として正しいのは？', en: 'What does a penumbral lunar eclipse look like?' },
    choices: [
      { ja: '月が赤銅色になる', en: 'The Moon turns coppery red' },
      { ja: '月が大きく欠ける', en: 'A large bite is taken out' },
      { ja: 'わずかに暗くなるだけで気づきにくい', en: 'It dims slightly and is easy to miss' },
      { ja: '月が見えなくなる', en: 'The Moon disappears' },
    ],
    answer: 2,
    why: { ja: '半影では太陽の光が一部しかさえぎられないので、うっすら暗くなるだけです。', en: 'In the penumbra only part of the Sun is blocked, so the Moon just dims a little.' },
    demo: 'penumbral',
  },
];

// Four shuffled phase choices that include `truth`.
export function phaseChoices(truth, withIcons) {
  const others = shuffle(PHASE_KEYS.filter(x => x !== truth)).slice(0, 3);
  return shuffle([truth, ...others]).map(key => ({ key, label: () => t(`phase.${key}`), icon: withIcons ? key : null }));
}

// Build a question. `kind` may be 'mix'.
export function buildQuestion(kind) {
  const k = kind === 'mix' ? pick(QUIZ_KINDS) : kind;
  if (k === 'phaseName' || k === 'layoutToPhase') {
    const truth = pick(PHASE_KEYS);
    return {
      kind: k,
      text: () => t(k === 'phaseName' ? 'q.phaseName' : 'q.layout'),
      choices: phaseChoices(truth, k === 'layoutToPhase'),
      answer: truth,
      why: (ans = truth) => tr(PHASE_INFO[ans].layout),
      setPhase: truth,           // move the simulation before asking
      demo: null,
    };
  }
  if (k === 'visibleTime') {
    const item = pick(VISIBLE);
    const others = shuffle(VISIBLE_CHOICES.filter(x => x !== item.a)).slice(0, 3);
    return {
      kind: k,
      text: () => tr(item.q),
      choices: shuffle([item.a, ...others]).map(key => ({ key, label: () => t(`phase.${key}`), icon: key })),
      answer: item.a,
      why: () => tr(PHASE_INFO[item.a].look),
      setPhase: null,
      demo: `phase:${item.a}`,
    };
  }
  const item = pick(ECLIPSE_BANK);
  return {
    kind: 'eclipseCond',
    text: () => tr(item.q),
    choices: shuffle(item.choices.map((c, i) => ({ key: String(i), label: () => tr(c), icon: null }))),
    answer: String(item.answer),
    why: () => tr(item.why),
    setPhase: null,
    demo: item.demo,
  };
}
