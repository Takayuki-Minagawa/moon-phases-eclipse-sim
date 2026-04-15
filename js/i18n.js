// Minimal i18n: JP / EN translations shared by UI and learning panel.

export const MESSAGES = {
  ja: {
    'app.title': '月の満ち欠け・日食月食シミュレーター',
    'app.note':  '教育用途のシミュレーションで、数値は近似です。実スケールではなく視認優先で描画しています。',

    'panel.controls': '操作パネル',
    'panel.learn':    '学習パネル',

    'ui.language': '言語',
    'ui.play':     '再生',
    'ui.pause':    '一時停止',
    'ui.speed':    '速度',
    'ui.moonAngle':'月の公転角',
    'ui.day':      '経過日数',
    'ui.tilt':     '白道傾斜 (5.14°) を有効化',
    'ui.zoom':     'ズーム',
    'ui.rotate':   '俯瞰回転',
    'ui.reset':    'リセット',
    'ui.jumpSolar':'日食位置へ',
    'ui.jumpLunar':'月食位置へ',
    'ui.phaseName':'月相名',
    'ui.moonAge':  '月齢',
    'ui.phaseAngle':'位相角',
    'ui.illum':    '照度',
    'ui.explain':  '解説',
    'ui.quiz':     'クイズ',

    'view.overhead':'俯瞰ビュー',
    'view.moon':    '地球視点ビュー',

    'phase.new':            '新月',
    'phase.waxingCrescent': '三日月',
    'phase.firstQuarter':   '上弦',
    'phase.waxingGibbous':  '十三夜',
    'phase.full':           '満月',
    'phase.waningGibbous':  '十六夜',
    'phase.lastQuarter':    '下弦',
    'phase.waningCrescent': '二十六夜',

    'explain.title':   '現在の状態',
    'explain.phase':   '月相は {name}（月齢 {age} 日、照度 {illum}%）。位相角は {pa}°、白道緯度は {lat}°。',
    'explain.noTilt':  '白道傾斜が OFF のため、新月・満月のたびに日食・月食が起こりえます。',
    'explain.tiltOn':  '白道傾斜 (5.14°) が ON のため、新月・満月でも月が節点付近にいないと食は起きません。',
    'explain.hint':    '観察の着眼点: 俯瞰ビューで太陽・地球・月の並びを確認し、地球視点ビューで明暗のラインがどの向きから差しているかを見てください。',

    'eclipse.solar.total':    '皆既日食: 月が太陽の視直径をすっぽり隠しています。',
    'eclipse.solar.annular':  '金環日食: 月が遠く見かけが小さく、太陽の縁がリング状に残ります。',
    'eclipse.solar.partial':  '部分日食: 月が太陽の一部を隠しています。',
    'eclipse.lunar.total':    '皆既月食: 満月が地球の本影に完全に入っています。',
    'eclipse.lunar.partial':  '部分月食: 満月の一部が本影に入っています。',
    'eclipse.lunar.penumbral':'半影月食: 満月が半影のみに入り、わずかに暗く見えます。',

    'why.title':   'なぜ毎月食が起きないの？',
    'why.body':    '月の軌道は地球の公転面（黄道）に対して約 5.14° 傾いています。新月・満月のときでも、月が黄道面から離れていると太陽・地球・月が一直線には並ばず、食は起きません。一直線に近くなるのは月が節点（軌道面と黄道面の交点）付近にいるときだけです。',

    'quiz.kind.phaseName':      '月相名を答える',
    'quiz.kind.layoutToPhase':  '配置から月相',
    'quiz.kind.eclipseCond':    '食の条件',
    'quiz.new':                 '新しい問題',
    'quiz.correct':             '正解！',
    'quiz.wrong':               '残念。もう一度考えてみましょう。',

    'q.phaseName':  '今表示されている月相は？',
    'q.layout':     '太陽・地球・月の並びから、この配置の月相はどれ？',
    'q.eclipse':    '次のうち、正しいのはどれ？',

    'q.eclipse.a':  '日食は新月のたびに必ず起きる',
    'q.eclipse.b':  '月食は満月のたびに必ず起きる',
    'q.eclipse.c':  '月の軌道の傾きのため、食は新月・満月のうち節点付近にある時だけ起きる',
    'q.eclipse.d':  '月食は新月のとき、日食は満月のときに起きる',
  },

  en: {
    'app.title': 'Moon Phases & Eclipse Simulator',
    'app.note':  'Educational simulation — values are approximate. Distances are compressed for visibility.',

    'panel.controls': 'Controls',
    'panel.learn':    'Learn',

    'ui.language': 'Language',
    'ui.play':     'Play',
    'ui.pause':    'Pause',
    'ui.speed':    'Speed',
    'ui.moonAngle':'Moon orbit angle',
    'ui.day':      'Day',
    'ui.tilt':     'Enable 5.14° orbital tilt',
    'ui.zoom':     'Zoom',
    'ui.rotate':   'Rotate view',
    'ui.reset':    'Reset',
    'ui.jumpSolar':'Jump to solar eclipse',
    'ui.jumpLunar':'Jump to lunar eclipse',
    'ui.phaseName':'Phase',
    'ui.moonAge':  'Age',
    'ui.phaseAngle':'Phase angle',
    'ui.illum':    'Illumination',
    'ui.explain':  'Explain',
    'ui.quiz':     'Quiz',

    'view.overhead':'Overhead view',
    'view.moon':    'Earth view',

    'phase.new':            'New moon',
    'phase.waxingCrescent': 'Waxing crescent',
    'phase.firstQuarter':   'First quarter',
    'phase.waxingGibbous':  'Waxing gibbous',
    'phase.full':           'Full moon',
    'phase.waningGibbous':  'Waning gibbous',
    'phase.lastQuarter':    'Last quarter',
    'phase.waningCrescent': 'Waning crescent',

    'explain.title':   'Current state',
    'explain.phase':   'Phase: {name} (age {age} d, illumination {illum}%). Phase angle {pa}°, ecliptic latitude {lat}°.',
    'explain.noTilt':  'Orbital tilt is OFF — every new/full moon would produce an eclipse.',
    'explain.tiltOn':  'Orbital tilt (5.14°) is ON — eclipses only happen when the moon is near a node at new or full moon.',
    'explain.hint':    'Observe: check the alignment of Sun / Earth / Moon in the overhead view, and which side the light is coming from in the Earth view.',

    'eclipse.solar.total':    'Total solar eclipse: the Moon fully covers the Sun.',
    'eclipse.solar.annular':  'Annular solar eclipse: the Moon is too far to cover the Sun — a ring remains.',
    'eclipse.solar.partial':  'Partial solar eclipse: the Moon covers part of the Sun.',
    'eclipse.lunar.total':    'Total lunar eclipse: the full Moon is entirely inside Earth’s umbra.',
    'eclipse.lunar.partial':  'Partial lunar eclipse: part of the full Moon is in the umbra.',
    'eclipse.lunar.penumbral':'Penumbral lunar eclipse: the Moon is only in the penumbra — a subtle dimming.',

    'why.title':   'Why not every month?',
    'why.body':    'The Moon’s orbit is tilted about 5.14° to Earth’s orbital plane. At a new or full moon the three bodies usually don’t line up, so the Moon misses the Sun or Earth’s shadow. Alignment only happens when the Moon is near a node — the crossing of its orbit with the ecliptic.',

    'quiz.kind.phaseName':      'Name this phase',
    'quiz.kind.layoutToPhase':  'Layout to phase',
    'quiz.kind.eclipseCond':    'Eclipse conditions',
    'quiz.new':                 'New question',
    'quiz.correct':             'Correct!',
    'quiz.wrong':               'Not quite. Try again.',

    'q.phaseName':  'Which phase is shown?',
    'q.layout':     'Given the Sun–Earth–Moon layout, what phase is this?',
    'q.eclipse':    'Which statement is correct?',

    'q.eclipse.a':  'Solar eclipses happen at every new moon',
    'q.eclipse.b':  'Lunar eclipses happen at every full moon',
    'q.eclipse.c':  'Because of the orbital tilt, eclipses only happen when the Moon is near a node at new/full moon',
    'q.eclipse.d':  'Lunar eclipses happen at new moon and solar at full moon',
  },
};

let currentLang = 'ja';

export function setLang(lang) {
  currentLang = MESSAGES[lang] ? lang : 'ja';
}
export function getLang() { return currentLang; }

export function t(key, vars) {
  const dict = MESSAGES[currentLang] || MESSAGES.ja;
  let s = dict[key] ?? MESSAGES.ja[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

// Apply all `data-i18n` attributes on the document.
export function applyStaticI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
}
