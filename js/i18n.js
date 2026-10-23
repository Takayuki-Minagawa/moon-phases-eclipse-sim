// Minimal i18n: JP / EN UI strings. Longer bilingual learning content lives
// next to the code that uses it as { ja, en } objects; use `tr()` for those.

export const MESSAGES = {
  ja: {
    'app.title':    '月の満ち欠け・日食月食シミュレーター',
    'app.subtitle': '太陽・地球・月の位置関係から、満ち欠けと食のしくみを体験しよう',
    'app.note':     '教育用のシミュレーションです。天体の位置は近似計算で、距離や大きさは見やすさを優先して描いています。',

    'panel.controls': '操作パネル',
    'panel.learn':    '学習パネル',

    'ui.language':  '言語',
    'ui.theme':     'ライト／ダーク切替',
    'ui.help':      '使い方',
    'ui.share':     'リンクをコピー',
    'ui.shared':    'この状態へのリンクをコピーしました',
    'ui.play':      '再生',
    'ui.pause':     '一時停止',
    'ui.speed':     '速さ',
    'ui.speed.1h':  '1秒 = 1時間',
    'ui.speed.6h':  '1秒 = 6時間',
    'ui.speed.1d':  '1秒 = 1日',
    'ui.speed.4d':  '1秒 = 4日',
    'ui.speed.16d': '1秒 = 16日',
    'ui.speed.64d': '1秒 = 64日',
    'ui.time':      '日時',
    'ui.today':     '今日',
    'ui.step.dm':   '−1日',
    'ui.step.hm':   '−1時間',
    'ui.step.hp':   '+1時間',
    'ui.step.dp':   '+1日',
    'ui.moonPos':   '月の位置（太陽からの角度）',
    'ui.moonPosHint':'スライダーか、俯瞰ビューの月をドラッグして動かせます',
    'ui.nextPhase': '次の月相へジャンプ',
    'tick.new': '新月', 'tick.fq': '上弦', 'tick.full': '満月', 'tick.lq': '下弦',
    'ui.eclipses':  '日食・月食',
    'ui.prevSolar': '◀ 前の日食',
    'ui.nextSolar': '次の日食 ▶',
    'ui.prevLunar': '◀ 前の月食',
    'ui.nextLunar': '次の月食 ▶',
    'ui.notFound':  '見つかりませんでした',
    'ui.autoPause': '再生中、食が起きたら一時停止',
    'ui.tilt':      '白道の傾き（5.14°）',
    'ui.tiltOn':    'ON：実際の月',
    'ui.tiltOff':   'OFF：傾きなし',
    'ui.tiltHelp':  'OFF にすると、新月・満月のたびに食が起きる「もしも」の世界になります。',
    'ui.display':   '表示',
    'ui.mode.geo':  '地球中心',
    'ui.mode.helio':'太陽中心',
    'ui.guide':     '8つの月相ガイド',
    'ui.zoom':      'ズーム',
    'ui.rotate':    '回転',
    'ui.reset':     '視点リセット',
    'ui.keys':      'キーボード: Space 再生/停止・← → 1時間・Shift+← → 1日',
    'ui.year':      '年',
    'ui.close':     '閉じる',
    'ui.start':     'はじめる',

    'view.overhead': '俯瞰ビュー（北極側から見た図）',
    'view.moon':     '地球から見た月',
    'view.chart':    '食の判定図',
    'view.timeline': 'タイムライン',
    'view.legend.season': '食の季節',
    'view.legend.new':    '新月',
    'view.legend.full':   '満月',
    'view.legend.solar':  '日食',
    'view.legend.lunar':  '月食',

    'cv.sunlight':  '太陽の光',
    'cv.sun':       '太陽',
    'cv.earth':     '地球',
    'cv.moon':      '月',
    'cv.umbra':     '本影',
    'cv.penumbra':  '半影',
    'cv.ascNode':   '昇交点',
    'cv.descNode':  '降交点',
    'cv.north':     '黄道面より北',
    'cv.south':     '黄道面より南',
    'cv.elong':     '{deg}°',
    'cv.notScale':  '距離・大きさは実際とは異なります',
    'cv.dragMe':    'ドラッグで動かせます',
    'cv.season':    '食の季節！ 交点の方向に太陽がある',
    'cv.nodeLine':  '交点を結ぶ線',
    'cv.months':    '1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月',
    'cv.south.dir': '南',
    'cv.east':      '東',
    'cv.west':      '西',
    'cv.skyAt':     '南の空・{h}ごろ',
    'cv.newMoonSky':'新月：太陽と同じ方向にあり見えません',
    'cv.northHemi': '北半球から見た形',
    'cv.solarView': 'もっともよく見える場所からの眺め',
    'cv.chart.solar':'太陽のまわり（新月のころ）',
    'cv.chart.lunar':'地球の影のまわり（満月のころ）',
    'cv.ecliptic':  '黄道',
    'cv.zone':      '食が起こるゾーン',
    'cv.lat':       '月の黄緯 {lat}°',
    'cv.toSyzygy.new': '新月まで あと {d} 日',
    'cv.toSyzygy.full':'満月まで あと {d} 日',
    'cv.fromSyzygy.new': '新月から {d} 日後',
    'cv.fromSyzygy.full':'満月から {d} 日後',
    'cv.hit':       '食あり',
    'cv.miss':      '食なし',
    'cv.hidden':    '？',
    'cv.quizHidden':'クイズ中は隠しています',

    'info.phase':   '月相',
    'info.age':     '月齢',
    'info.illum':   '輝面比',
    'info.elong':   '離角',
    'info.lat':     '黄緯',
    'info.transit': '南中',
    'info.dist':    '距離',

    'tab.explain':  '解説',
    'tab.mission':  'ミッション',
    'tab.quiz':     'クイズ',
    'tab.calendar': '食カレンダー',
    'tab.glossary': '用語',

    'phase.new':            '新月',
    'phase.waxingCrescent': '三日月',
    'phase.firstQuarter':   '上弦の月',
    'phase.waxingGibbous':  '十三夜',
    'phase.full':           '満月',
    'phase.waningGibbous':  '十六夜',
    'phase.lastQuarter':    '下弦の月',
    'phase.waningCrescent': '二十六夜',

    'eclipse.solar.total':    '皆既日食',
    'eclipse.solar.annular':  '金環日食',
    'eclipse.solar.partial':  '部分日食',
    'eclipse.lunar.total':    '皆既月食',
    'eclipse.lunar.partial':  '部分月食',
    'eclipse.lunar.penumbral':'半影月食',
    'eclipse.desc.solar.total':    '月が太陽をすっぽり隠しています。昼なのに空が暗くなり、コロナが見えます。',
    'eclipse.desc.solar.annular':  '月が地球から遠く、見かけが太陽より小さいため、太陽の縁がリング状に残ります。',
    'eclipse.desc.solar.partial':  '月が太陽の一部だけを隠しています。月の影の中心は地球を外れています。',
    'eclipse.desc.lunar.total':    '満月が地球の本影にすっぽり入りました。大気で曲げられた赤い光で、月が赤銅色に見えます。',
    'eclipse.desc.lunar.partial':  '満月の一部が地球の本影に入り、欠けて見えます。',
    'eclipse.desc.lunar.penumbral':'満月が半影だけに入っています。わずかに暗くなるだけで、気づきにくい食です。',
    'eclipse.now':   'いま {name} が起きています！',
    'eclipse.paused':'{name} で一時停止しました',

    'mission.progress': '{done} / {total} 達成',
    'mission.hint':     'ヒント',
    'mission.done':     '達成！',
    'mission.reset':    '進捗をリセット',
    'mission.cleared':  'ミッション達成：{title}',
    'mission.all':      'すべてのミッションを達成しました！ おめでとう！',

    'quiz.kind':        '出題',
    'quiz.kind.mix':    'ミックス',
    'quiz.kind.phaseName':     '月の形 → 名前',
    'quiz.kind.layoutToPhase': '配置 → 月の形',
    'quiz.kind.visibleTime':   '見える時刻・方角',
    'quiz.kind.eclipseCond':   '食のしくみ',
    'quiz.new':         '次の問題',
    'quiz.correct':     '正解！',
    'quiz.wrong':       '残念…正解は「{answer}」',
    'quiz.score':       '正解 {ok} / {total}',
    'quiz.streak':      '連続 {n}',
    'quiz.best':        '最高 {n}',
    'quiz.show':        'シミュレーターで確かめる',
    'q.phaseName':      '「地球から見た月」に表示されている月の名前は？',
    'q.layout':         '俯瞰ビューの月の位置のとき、地球からはどんな形に見える？',

    'cal.title':    '{year}年の日食・月食',
    'cal.none':     'この年には食がありません',
    'cal.go':       '見る',
    'cal.note':     '食は約半年ごとの「食の季節」にまとまって起こります。同じ季節の日食と月食は約2週間はなれています。',
    'cal.noTilt':   '白道の傾きが OFF のため、すべての新月・満月で食が起きています。',
    'cal.utc':      '日時はお使いの端末の時刻で表示しています。',

    'gl.show':      'シミュレーターで見る',

    'help.title':   'このシミュレーターの使い方',
    'help.s1.t':    '時間を動かす',
    'help.s1.b':    '「再生」や日時ボタン、下のタイムラインで時間を進めると、月が地球のまわりを回り、形が変わります。',
    'help.s2.t':    '月をドラッグ',
    'help.s2.b':    '俯瞰ビューの月をドラッグして、好きな位置に動かしてみましょう。右の「地球から見た月」が連動します。',
    'help.s3.t':    '食の条件を見る',
    'help.s3.b':    '「食の判定図」で、月が太陽や地球の影に重なるかを確認。白道の傾きを OFF にすると何が変わるかな？',
    'help.s4.t':    'ミッションとクイズ',
    'help.s4.b':    '学習パネルのミッションに挑戦し、クイズで理解をチェックしよう。',

    'ex.now':       'いまの月',
    'ex.layout':    '太陽・地球・月の位置関係',
    'ex.cond':      '食の条件チェック',
    'ex.watch':     '観察のポイント',
    'ex.faq':       'よくある疑問',
    'ex.age':       '月齢 {age} 日・輝面比 {illum}%',
    'ex.wa':        '暦の呼び名：{name}（{yomi}）',
    'ex.rise':      '月の出',
    'ex.transit':   '南中',
    'ex.set':       '月の入',
    'ex.timeNote':  '時刻は春分・秋分ごろの目安です。',
    'ex.elong':     '地球から見て、月は太陽から東へ {deg}° はなれた方向にあります。',
    'ex.elongW':    '地球から見て、月は太陽から西へ {deg}° の方向にあります（東回りに数えると {deg360}°）。',
    'ex.c1':        '① 太陽・地球・月が一直線（新月か満月）',
    'ex.c2':        '② 月が黄道面の近く（黄緯が ±{lim}° 以内）',
    'ex.c1.ok':     '{which}の位置です',
    'ex.c1.ng':     '{which}まで あと {d} 日',
    'ex.c2.ok':     '黄緯 {lat}° → 条件内',
    'ex.c2.ng':     '黄緯 {lat}° → はなれすぎ',
    'ex.c2.noTilt': '傾き OFF のため、月はいつも黄道面上',
    'ex.res.yes':   '両方の条件がそろい、{name} が起きています！',
    'ex.res.no':    '条件がそろっていないので、いまは食は起きません。',
    'ex.newWord':   '新月',
    'ex.fullWord':  '満月',
  },

  en: {
    'app.title':    'Moon Phases & Eclipse Simulator',
    'app.subtitle': 'Explore how the Sun, Earth and Moon line up to make phases and eclipses',
    'app.note':     'Educational simulation. Positions are approximate, and sizes/distances are drawn for clarity, not to scale.',

    'panel.controls': 'Controls',
    'panel.learn':    'Learn',

    'ui.language':  'Language',
    'ui.theme':     'Toggle light / dark',
    'ui.help':      'How to use',
    'ui.share':     'Copy link',
    'ui.shared':    'Link to this view copied',
    'ui.play':      'Play',
    'ui.pause':     'Pause',
    'ui.speed':     'Speed',
    'ui.speed.1h':  '1 s = 1 hour',
    'ui.speed.6h':  '1 s = 6 hours',
    'ui.speed.1d':  '1 s = 1 day',
    'ui.speed.4d':  '1 s = 4 days',
    'ui.speed.16d': '1 s = 16 days',
    'ui.speed.64d': '1 s = 64 days',
    'ui.time':      'Date & time',
    'ui.today':     'Now',
    'ui.step.dm':   '−1 day',
    'ui.step.hm':   '−1 h',
    'ui.step.hp':   '+1 h',
    'ui.step.dp':   '+1 day',
    'ui.moonPos':   'Moon position (angle from the Sun)',
    'ui.moonPosHint':'Use the slider, or drag the Moon in the overhead view',
    'ui.nextPhase': 'Jump to the next…',
    'tick.new': 'New', 'tick.fq': '1st Q', 'tick.full': 'Full', 'tick.lq': 'Last Q',
    'ui.eclipses':  'Eclipses',
    'ui.prevSolar': '◀ Prev solar',
    'ui.nextSolar': 'Next solar ▶',
    'ui.prevLunar': '◀ Prev lunar',
    'ui.nextLunar': 'Next lunar ▶',
    'ui.notFound':  'Not found',
    'ui.autoPause': 'Pause playback when an eclipse happens',
    'ui.tilt':      'Moon’s orbital tilt (5.14°)',
    'ui.tiltOn':    'ON: real Moon',
    'ui.tiltOff':   'OFF: no tilt',
    'ui.tiltHelp':  'Turn it OFF to see a “what if” world with an eclipse at every new and full moon.',
    'ui.display':   'Display',
    'ui.mode.geo':  'Earth-centred',
    'ui.mode.helio':'Sun-centred',
    'ui.guide':     '8-phase guide',
    'ui.zoom':      'Zoom',
    'ui.rotate':    'Rotate',
    'ui.reset':     'Reset view',
    'ui.keys':      'Keys: Space play/pause · ← → 1 hour · Shift+← → 1 day',
    'ui.year':      'Year',
    'ui.close':     'Close',
    'ui.start':     'Get started',

    'view.overhead': 'Overhead view (from above the North Pole)',
    'view.moon':     'The Moon from Earth',
    'view.chart':    'Eclipse check',
    'view.timeline': 'Timeline',
    'view.legend.season': 'Eclipse season',
    'view.legend.new':    'New',
    'view.legend.full':   'Full',
    'view.legend.solar':  'Solar',
    'view.legend.lunar':  'Lunar',

    'cv.sunlight':  'Sunlight',
    'cv.sun':       'Sun',
    'cv.earth':     'Earth',
    'cv.moon':      'Moon',
    'cv.umbra':     'Umbra',
    'cv.penumbra':  'Penumbra',
    'cv.ascNode':   'Asc. node',
    'cv.descNode':  'Desc. node',
    'cv.north':     'North of ecliptic',
    'cv.south':     'South of ecliptic',
    'cv.elong':     '{deg}°',
    'cv.notScale':  'Not to scale',
    'cv.dragMe':    'Drag me',
    'cv.season':    'Eclipse season! The node line points at the Sun',
    'cv.nodeLine':  'Node line',
    'cv.months':    'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
    'cv.south.dir': 'S',
    'cv.east':      'E',
    'cv.west':      'W',
    'cv.skyAt':     'Southern sky · around {h}',
    'cv.newMoonSky':'New moon: same direction as the Sun — invisible',
    'cv.northHemi': 'As seen from the Northern Hemisphere',
    'cv.solarView': 'Seen from the best spot on Earth',
    'cv.chart.solar':'Around the Sun (new moon)',
    'cv.chart.lunar':'Around Earth’s shadow (full moon)',
    'cv.ecliptic':  'Ecliptic',
    'cv.zone':      'Eclipse zone',
    'cv.lat':       'Moon latitude {lat}°',
    'cv.toSyzygy.new': 'New moon in {d} d',
    'cv.toSyzygy.full':'Full moon in {d} d',
    'cv.fromSyzygy.new': '{d} d after new moon',
    'cv.fromSyzygy.full':'{d} d after full moon',
    'cv.hit':       'Eclipse',
    'cv.miss':      'No eclipse',
    'cv.hidden':    '?',
    'cv.quizHidden':'Hidden during the quiz',

    'info.phase':   'Phase',
    'info.age':     'Age',
    'info.illum':   'Lit',
    'info.elong':   'Elongation',
    'info.lat':     'Latitude',
    'info.transit': 'Highest at',
    'info.dist':    'Distance',

    'tab.explain':  'Explain',
    'tab.mission':  'Missions',
    'tab.quiz':     'Quiz',
    'tab.calendar': 'Eclipses',
    'tab.glossary': 'Terms',

    'phase.new':            'New moon',
    'phase.waxingCrescent': 'Waxing crescent',
    'phase.firstQuarter':   'First quarter',
    'phase.waxingGibbous':  'Waxing gibbous',
    'phase.full':           'Full moon',
    'phase.waningGibbous':  'Waning gibbous',
    'phase.lastQuarter':    'Last quarter',
    'phase.waningCrescent': 'Waning crescent',

    'eclipse.solar.total':    'Total solar eclipse',
    'eclipse.solar.annular':  'Annular solar eclipse',
    'eclipse.solar.partial':  'Partial solar eclipse',
    'eclipse.lunar.total':    'Total lunar eclipse',
    'eclipse.lunar.partial':  'Partial lunar eclipse',
    'eclipse.lunar.penumbral':'Penumbral lunar eclipse',
    'eclipse.desc.solar.total':    'The Moon completely covers the Sun. The sky darkens in daytime and the corona appears.',
    'eclipse.desc.solar.annular':  'The Moon is far from Earth and looks smaller than the Sun, so a bright ring remains.',
    'eclipse.desc.solar.partial':  'The Moon covers only part of the Sun; the centre of its shadow misses Earth.',
    'eclipse.desc.lunar.total':    'The full Moon is entirely inside Earth’s umbra. Light bent by our atmosphere turns it coppery red.',
    'eclipse.desc.lunar.partial':  'Part of the full Moon is inside Earth’s umbra and looks bitten.',
    'eclipse.desc.lunar.penumbral':'The Moon is only in the penumbra — a subtle dimming that is easy to miss.',
    'eclipse.now':   '{name} in progress!',
    'eclipse.paused':'Paused at a {name}',

    'mission.progress': '{done} / {total} done',
    'mission.hint':     'Hint',
    'mission.done':     'Done!',
    'mission.reset':    'Reset progress',
    'mission.cleared':  'Mission complete: {title}',
    'mission.all':      'All missions complete — well done!',

    'quiz.kind':        'Topic',
    'quiz.kind.mix':    'Mix',
    'quiz.kind.phaseName':     'Shape → name',
    'quiz.kind.layoutToPhase': 'Layout → shape',
    'quiz.kind.visibleTime':   'When & where visible',
    'quiz.kind.eclipseCond':   'How eclipses work',
    'quiz.new':         'Next question',
    'quiz.correct':     'Correct!',
    'quiz.wrong':       'Not quite… the answer is “{answer}”',
    'quiz.score':       'Score {ok} / {total}',
    'quiz.streak':      'Streak {n}',
    'quiz.best':        'Best {n}',
    'quiz.show':        'Check it in the simulator',
    'q.phaseName':      'What is the name of the Moon shown in “The Moon from Earth”?',
    'q.layout':         'With the Moon where it is in the overhead view, what shape do we see from Earth?',

    'cal.title':    'Eclipses in {year}',
    'cal.none':     'No eclipses this year',
    'cal.go':       'View',
    'cal.note':     'Eclipses cluster in “eclipse seasons” about six months apart. A solar and a lunar eclipse in the same season are about two weeks apart.',
    'cal.noTilt':   'Orbital tilt is OFF, so every new and full moon is an eclipse.',
    'cal.utc':      'Times are shown in your device’s time zone.',

    'gl.show':      'Show in simulator',

    'help.title':   'How to use this simulator',
    'help.s1.t':    'Move time',
    'help.s1.b':    'Use Play, the date buttons or the timeline. The Moon circles Earth and its shape changes.',
    'help.s2.t':    'Drag the Moon',
    'help.s2.b':    'Drag the Moon in the overhead view. “The Moon from Earth” updates to match.',
    'help.s3.t':    'Check for eclipses',
    'help.s3.b':    'The eclipse check shows whether the Moon meets the Sun or Earth’s shadow. What changes if you switch the tilt OFF?',
    'help.s4.t':    'Missions & quiz',
    'help.s4.b':    'Try the missions in the Learn panel, then test yourself with the quiz.',

    'ex.now':       'The Moon now',
    'ex.layout':    'Sun–Earth–Moon layout',
    'ex.cond':      'Eclipse conditions',
    'ex.watch':     'Things to notice',
    'ex.faq':       'Common questions',
    'ex.age':       'Age {age} d · {illum}% lit',
    'ex.wa':        '',
    'ex.rise':      'Rises',
    'ex.transit':   'Highest',
    'ex.set':       'Sets',
    'ex.timeNote':  'Times are rough values for the equinoxes.',
    'ex.elong':     'Seen from Earth, the Moon is {deg}° east of the Sun.',
    'ex.elongW':    'Seen from Earth, the Moon is {deg}° west of the Sun.',
    'ex.c1':        '① Sun, Earth and Moon in a line (new or full moon)',
    'ex.c2':        '② Moon close to the ecliptic plane (latitude within ±{lim}°)',
    'ex.c1.ok':     'At {which}',
    'ex.c1.ng':     '{which} in {d} d',
    'ex.c2.ok':     'Latitude {lat}° → inside',
    'ex.c2.ng':     'Latitude {lat}° → too far',
    'ex.c2.noTilt': 'Tilt is OFF — the Moon always stays on the ecliptic',
    'ex.res.yes':   'Both conditions are met — a {name} is happening!',
    'ex.res.no':    'The conditions aren’t both met, so there is no eclipse now.',
    'ex.newWord':   'new moon',
    'ex.fullWord':  'full moon',
  },
};

const LANG_KEY = 'mpes-lang';
let currentLang = 'ja';

export function setLang(lang) {
  currentLang = MESSAGES[lang] ? lang : 'ja';
  document.documentElement.lang = currentLang;
  try { localStorage.setItem(LANG_KEY, currentLang); } catch { /* ignore */ }
}
export function getLang() { return currentLang; }

export function initialLang() {
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch { /* ignore */ }
  if (saved && MESSAGES[saved]) return saved;
  return (navigator.language || 'ja').toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function t(key, vars) {
  const dict = MESSAGES[currentLang] || MESSAGES.ja;
  let s = dict[key] ?? MESSAGES.ja[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

// Pick the current language from a { ja, en } content object.
export function tr(obj, vars) {
  if (obj == null) return '';
  let s = typeof obj === 'string' ? obj : (obj[currentLang] ?? obj.ja ?? '');
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

// Apply `data-i18n`, `data-i18n-title` and `data-i18n-aria` attributes.
export function applyStaticI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
}

export function formatDateTime(date, opts = {}) {
  const locale = currentLang === 'ja' ? 'ja-JP' : 'en-GB';
  return date.toLocaleString(locale, {
    year: 'numeric', month: opts.short ? 'numeric' : 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', ...(opts.weekday ? { weekday: 'short' } : {}),
  });
}

export function formatHour(h) {
  const hh = Math.round(h) % 24;
  return currentLang === 'ja' ? `${hh}時` : `${String(hh).padStart(2, '0')}:00`;
}
