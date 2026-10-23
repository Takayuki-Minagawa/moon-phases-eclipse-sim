// Learning-panel content built from the current state. Bilingual content is
// kept here as { ja, en } objects so the text stays next to its logic.

import { t, tr, getLang, formatHour } from './i18n.js';
import { phaseIconSVG, moonIconSVG } from './moonShape.js';
import { wrap180, SYNODIC_MONTH } from './simulation.js';

export const PHASE_INFO = {
  new: {
    look: { ja: '月は太陽と同じ方向にあり、照らされていない面が地球を向くので見えません。', en: 'The Moon is in the same direction as the Sun and turns its unlit side to us, so we cannot see it.' },
    layout: { ja: '太陽 − 月 − 地球 の順にほぼ並んでいます。日食が起こりうる並びです。', en: 'Sun – Moon – Earth are roughly in a line. This is the line-up for a solar eclipse.' },
  },
  waxingCrescent: {
    look: { ja: '右側が細く光る月。夕方、西の空の低いところに見え、太陽を追うように沈みます。', en: 'A thin sliver lit on the right. Seen low in the west after sunset, setting soon after the Sun.' },
    layout: { ja: '月は太陽から東へ少しはなれた位置。地球からは光っている面がわずかに見えます。', en: 'The Moon is a little east of the Sun, so we see only a sliver of its lit half.' },
  },
  firstQuarter: {
    look: { ja: '右半分が光る半月。昼ごろ東から昇り、夕方に南の空高く見え、真夜中に西へ沈みます。', en: 'Right half lit. Rises around noon, is highest in the south at sunset and sets around midnight.' },
    layout: { ja: '太陽 − 地球 − 月 が直角（90°）。光っている半分のうち、ちょうど半分が見えます。', en: 'Sun – Earth – Moon make a right angle (90°). We see half of the lit half.' },
  },
  waxingGibbous: {
    look: { ja: '満月に向けてふくらんでいく月。夕方には南東の空に見えます。', en: 'Swelling toward full. In the evening it is in the south-east.' },
    layout: { ja: '月は太陽と反対側に近づいています。光っている面の大部分が地球を向きます。', en: 'The Moon is moving toward the side opposite the Sun; most of its lit half faces us.' },
  },
  full: {
    look: { ja: 'まん丸に光る月。夕方に東から昇り、真夜中に南の空高く、明け方に西へ沈みます。', en: 'Fully lit. Rises at sunset, is highest at midnight and sets at sunrise.' },
    layout: { ja: '太陽 − 地球 − 月 の順にほぼ並んでいます。月食が起こりうる並びです。', en: 'Sun – Earth – Moon are roughly in a line. This is the line-up for a lunar eclipse.' },
  },
  waningGibbous: {
    look: { ja: '満月を過ぎ、右側から欠けていく月。夜遅くに昇ります。', en: 'Past full, shrinking from the right. Rises late in the evening.' },
    layout: { ja: '月は太陽と反対側を過ぎ、太陽の西側へ回りこんでいきます。', en: 'The Moon has passed the anti-Sun point and is coming round toward the Sun from the west.' },
  },
  lastQuarter: {
    look: { ja: '左半分が光る半月。真夜中ごろ東から昇り、明け方に南の空高く見えます。', en: 'Left half lit. Rises around midnight and is highest in the south at dawn.' },
    layout: { ja: '太陽 − 地球 − 月 が再び直角（270°）。上弦とは逆側が光って見えます。', en: 'Sun – Earth – Moon make a right angle again (270°); the opposite half is lit compared with first quarter.' },
  },
  waningCrescent: {
    look: { ja: '左側が細く光る月。明け方、東の空の低いところに見えます。', en: 'A thin sliver lit on the left, low in the east before sunrise.' },
    layout: { ja: '月は太陽の西側すぐ近く。まもなく新月です。', en: 'The Moon is just west of the Sun — new moon is coming soon.' },
  },
};

// Traditional Japanese names by day of the lunar month (1 = new moon day).
const WA_NAMES = {
  1: ['朔（新月）', 'さく'], 2: ['既朔・二日月', 'きさく・ふつかづき'], 3: ['三日月', 'みかづき'],
  4: ['四日月', 'よっかづき'], 7: ['上弦の月（七日月）', 'じょうげん'], 8: ['上弦の月（八日月）', 'じょうげん'],
  9: ['九夜月', 'くやづき'], 10: ['十日夜の月', 'とおかんや'], 13: ['十三夜月', 'じゅうさんや'],
  14: ['小望月（待宵月）', 'こもちづき・まつよいづき'], 15: ['十五夜・望月', 'じゅうごや・もちづき'],
  16: ['十六夜', 'いざよい'], 17: ['立待月', 'たちまちづき'], 18: ['居待月', 'いまちづき'],
  19: ['寝待月（臥待月）', 'ねまちづき・ふしまちづき'], 20: ['更待月', 'ふけまちづき'],
  22: ['下弦の月', 'かげん'], 23: ['下弦の月（二十三夜）', 'かげん・にじゅうさんや'],
  26: ['二十六夜', 'にじゅうろくや'], 27: ['有明月', 'ありあけづき'], 30: ['晦日月', 'みそかづき'],
};

export function waName(moonAge) {
  if (getLang() !== 'ja') return null;
  const dayNo = Math.min(30, Math.floor(moonAge) + 1);
  const hit = WA_NAMES[dayNo];
  return hit ? { name: hit[0], yomi: hit[1] } : null;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

export function eclipseName(ec) {
  return t(`eclipse.${ec.kind}.${ec.type}`);
}

// Explanation cards for the current state.
export function buildExplainHtml(s, ctx) {
  const hide = ctx.hideNames;
  const illum = Math.round(s.illumFrac * 100);
  const name = hide ? t('cv.hidden') : t(`phase.${s.phaseKey}`);
  const wa = hide ? null : waName(s.moonAge);
  const info = PHASE_INFO[s.phaseKey];
  const tr0 = s.transitHour;

  const nowCard = `
    <section class="card card--now">
      <div class="card__icon">${hide ? '<span class="qmark">?</span>' : moonIconSVG(s.illumFrac, s.waxing, 56)}</div>
      <div class="card__body">
        <h4 class="card__title">${escapeHtml(t('ex.now'))}</h4>
        <p class="card__big">${escapeHtml(name)}</p>
        <p class="card__sub">${escapeHtml(t('ex.age', { age: s.moonAge.toFixed(1), illum }))}</p>
        ${wa ? `<p class="card__sub">${escapeHtml(t('ex.wa', wa))}</p>` : ''}
        ${hide ? '' : `<p>${escapeHtml(tr(info.look))}</p>`}
        <div class="times">
          <span><b>${escapeHtml(t('ex.rise'))}</b> ${escapeHtml(formatHour(tr0 + 18))}</span>
          <span><b>${escapeHtml(t('ex.transit'))}</b> ${escapeHtml(formatHour(tr0))}</span>
          <span><b>${escapeHtml(t('ex.set'))}</b> ${escapeHtml(formatHour(tr0 + 6))}</span>
        </div>
        <p class="card__note">${escapeHtml(t('ex.timeNote'))}</p>
      </div>
    </section>`;

  const layoutCard = `
    <section class="card">
      <h4 class="card__title">${escapeHtml(t('ex.layout'))}</h4>
      <p>${escapeHtml(s.synodic <= 180
        ? t('ex.elong', { deg: Math.round(s.synodic) })
        : t('ex.elongW', { deg: Math.round(360 - s.synodic), deg360: Math.round(s.synodic) }))}</p>
      ${hide ? '' : `<p>${escapeHtml(tr(info.layout))}</p>`}
    </section>`;

  return nowCard + layoutCard + buildConditionCard(s) + buildWatchCard(s);
}

// Two conditions for an eclipse, shown as meters.
function buildConditionCard(s) {
  const dNew = wrap180(s.synodic), dFull = wrap180(s.synodic - 180);
  const nearNew = Math.abs(dNew) <= 90;
  const d = nearNew ? dNew : dFull;
  const which = t(nearNew ? 'ex.newWord' : 'ex.fullWord');
  const daysTo = Math.abs(d) / (360 / SYNODIC_MONTH);
  const lim = nearNew ? s.limits.solar : s.limits.lunarPenumbral;
  const ok1 = Math.abs(d) < 1.6;
  const ok2 = Math.abs(s.moonLatDeg) < lim;
  const ec = s.eclipse;

  // meter 1: closeness to syzygy (0..90°)
  const m1 = Math.max(0, 1 - Math.abs(d) / 90);
  // meter 2: latitude in −5.3..+5.3 with the allowed band
  const latPos = 50 + (s.moonLatDeg / 5.4) * 50;
  const bandW = (lim / 5.4) * 100;
  const lat = (s.moonLatDeg >= 0 ? '+' : '') + s.moonLatDeg.toFixed(2);

  const c1Text = ok1 ? t('ex.c1.ok', { which }) : t('ex.c1.ng', { which, d: daysTo.toFixed(1) });
  const c2Text = !s.tilt ? t('ex.c2.noTilt') : (ok2 ? t('ex.c2.ok', { lat }) : t('ex.c2.ng', { lat }));
  const result = ec.possible
    ? `<p class="cond__result cond__result--yes">🎉 ${escapeHtml(t('ex.res.yes', { name: eclipseName(ec) }))}</p>`
    : `<p class="cond__result">${escapeHtml(t('ex.res.no'))}</p>`;

  return `
    <section class="card">
      <h4 class="card__title">${escapeHtml(t('ex.cond'))}</h4>
      <div class="cond ${ok1 || ec.possible ? 'cond--ok' : ''}">
        <div class="cond__head"><span>${escapeHtml(t('ex.c1'))}</span><span class="cond__mark">${ok1 || ec.possible ? '✔' : '…'}</span></div>
        <div class="meter"><div class="meter__fill" style="width:${(m1 * 100).toFixed(1)}%"></div></div>
        <div class="cond__val">${escapeHtml(c1Text)}</div>
      </div>
      <div class="cond ${ok2 ? 'cond--ok' : ''}">
        <div class="cond__head"><span>${escapeHtml(t('ex.c2', { lim: lim.toFixed(1) }))}</span><span class="cond__mark">${ok2 ? '✔' : '✖'}</span></div>
        <div class="meter meter--lat">
          <div class="meter__band" style="left:${(50 - bandW / 2).toFixed(1)}%;width:${bandW.toFixed(1)}%"></div>
          <div class="meter__zero"></div>
          <div class="meter__dot" style="left:${Math.max(0, Math.min(100, latPos)).toFixed(1)}%"></div>
        </div>
        <div class="cond__val">${escapeHtml(c2Text)}</div>
      </div>
      ${result}
    </section>`;
}

// Context-dependent observation tips.
function buildWatchCard(s) {
  const tips = [];
  const ec = s.eclipse;
  const dNew = wrap180(s.synodic), dFull = wrap180(s.synodic - 180);
  const lat = Math.abs(s.moonLatDeg).toFixed(1);
  const dir = s.moonLatDeg >= 0
    ? { ja: '北（上）', en: 'north (above)' }
    : { ja: '南（下）', en: 'south (below)' };

  if (ec.possible && ec.kind === 'lunar') {
    tips.push({ ja: '「地球から見た月」で、地球の影が月のどちら側からかかっているか観察しよう。時間を1時間ずつ進めると影が動きます。', en: 'Watch which side Earth’s shadow covers the Moon from. Step time by an hour to see it move.' });
    if (ec.type === 'total') tips.push({ ja: '皆既中も月は真っ暗にならず赤く見えます。地球の大気が夕焼けの赤い光を影の中へ曲げるためです。', en: 'Even in totality the Moon stays red: Earth’s atmosphere bends sunset-red light into the shadow.' });
  } else if (ec.possible && ec.kind === 'solar') {
    tips.push({ ja: '俯瞰ビューで、月の影が地球に届いていることを確認しよう。日食は影が通る狭い地域でしか見られません。', en: 'In the overhead view the Moon’s shadow reaches Earth. A solar eclipse is only seen along the narrow track of that shadow.' });
    if (ec.type === 'annular') tips.push({ ja: `月までの距離は約 ${Math.round(s.moonDistKm).toLocaleString()} km。遠いと月が小さく見え、金環日食になります。`, en: `The Moon is about ${Math.round(s.moonDistKm).toLocaleString()} km away. When it is far it looks smaller — hence an annular eclipse.` });
  } else if (Math.abs(dFull) < 4 && s.tilt) {
    tips.push({ ja: `満月なのに月食が起きていません。月が黄道面より ${lat}° ${dir.ja}にずれ、地球の影をよけて通るからです。下の「食の判定図」を見てみよう。`, en: `Full moon, but no eclipse: the Moon is ${lat}° ${dir.en} the ecliptic and misses Earth’s shadow. See the eclipse check below.` });
  } else if (Math.abs(dNew) < 4 && s.tilt) {
    tips.push({ ja: `新月なのに日食が起きていません。月が黄道面より ${lat}° ${dir.ja}にずれ、太陽の前を通らないからです。`, en: `New moon, but no eclipse: the Moon is ${lat}° ${dir.en} the ecliptic and passes clear of the Sun.` });
  } else if (!s.tilt) {
    tips.push({ ja: '白道の傾きが OFF です。新月・満月のたびに食が起きることを、タイムラインや「次の日食」ボタンで確かめよう。', en: 'Tilt is OFF. Use the timeline or “Next solar” to confirm there is an eclipse at every new and full moon.' });
  } else {
    tips.push({ ja: '俯瞰ビューで、月の「光っている半分」はいつも太陽の方を向いていることに注目。地球からはその一部だけが見えるので形が変わります。', en: 'In the overhead view the lit half always faces the Sun. From Earth we see only part of it — that is why the shape changes.' });
    tips.push({ ja: '太陽中心モードにすると、交点を結ぶ線が太陽を向く「食の季節」が年2回あることがわかります。', en: 'Switch to Sun-centred mode: the node line points at the Sun only twice a year — the eclipse seasons.' });
  }

  return `
    <section class="card card--tip">
      <h4 class="card__title">💡 ${escapeHtml(t('ex.watch'))}</h4>
      ${tips.map(x => `<p>${escapeHtml(tr(x))}</p>`).join('')}
    </section>`;
}

export const FAQ = [
  {
    q: { ja: 'なぜ毎月、日食や月食が起きないの？', en: 'Why isn’t there an eclipse every month?' },
    a: { ja: '月の通り道（白道）は、地球の通り道（黄道）に対して約 5.1° 傾いています。新月や満月のときでも、たいていは月が黄道面の上か下にずれていて、太陽や地球の影と重なりません。月が黄道面を横切る点（交点）の近くで新月・満月になったときだけ、食が起こります。',
         en: 'The Moon’s path is tilted about 5.1° to the ecliptic. At most new and full moons the Moon is above or below the plane and misses the Sun or Earth’s shadow. Eclipses happen only when new or full moon falls near a node, where the Moon crosses the ecliptic.' },
  },
  {
    q: { ja: '月の満ち欠けは、地球の影のせい？', en: 'Are the phases caused by Earth’s shadow?' },
    a: { ja: 'いいえ。月はいつも半分が太陽に照らされています。満ち欠けは、その光っている半分を地球からどの角度で見ているかで決まります。地球の影が月にかかるのは月食のときだけです。',
         en: 'No. Half of the Moon is always lit by the Sun; the phase depends on how much of that lit half we see from Earth. Earth’s shadow only falls on the Moon during a lunar eclipse.' },
  },
  {
    q: { ja: '皆既日食と金環日食のちがいは？', en: 'Total vs. annular solar eclipse?' },
    a: { ja: '月の軌道は少しだけだ円で、地球との距離は約 36 万〜41 万 km の間で変わります。月が近いと太陽を完全に隠して皆既日食、遠いと太陽より小さく見えて縁が残り金環日食になります。',
         en: 'The Moon’s orbit is slightly elliptical (about 360,000–410,000 km). When it is close it covers the Sun completely (total); when far it looks smaller and leaves a ring (annular).' },
  },
  {
    q: { ja: '皆既月食で月が赤く見えるのはなぜ？', en: 'Why is the Moon red in a total lunar eclipse?' },
    a: { ja: '太陽の光が地球の大気を通るとき、青い光は散らばり、赤い光は曲がって本影の中に届きます。世界中の朝焼け・夕焼けの光が月を照らしているイメージです。',
         en: 'Sunlight passing through Earth’s atmosphere loses its blue light, while red light is bent into the umbra — the Moon is lit by all the world’s sunrises and sunsets.' },
  },
  {
    q: { ja: '「食の季節」とは？', en: 'What is an eclipse season?' },
    a: { ja: '交点を結ぶ線（交点線）は宇宙空間でほぼ同じ向きを保つため、地球が太陽のまわりを回ると、この線が太陽の方を向く時期が約半年ごとに訪れます。その前後約 1 か月が食の季節で、日食と月食がおよそ 2 週間おきに続けて起こることもあります。',
         en: 'The node line keeps nearly the same direction in space, so as Earth orbits the Sun it points at the Sun about every six months. Around those times — eclipse seasons — solar and lunar eclipses can follow each other two weeks apart.' },
  },
  {
    q: { ja: '月食はどこから見える？ 日食は？', en: 'Where can eclipses be seen?' },
    a: { ja: '月食は、月が出ている（夜の）地域ならどこからでも同時に見られます。日食は月の影が通る地域でしか見られず、皆既日食・金環日食が見られるのは幅数百 km 以下の細い帯の中だけです。',
         en: 'A lunar eclipse can be seen from everywhere the Moon is up (the night side). A solar eclipse is seen only where the Moon’s shadow passes; totality or annularity only in a narrow band at most a few hundred km wide.' },
  },
];

export function buildFaqHtml() {
  return `<h4 class="faq__title">${escapeHtml(t('ex.faq'))}</h4>` + FAQ.map(f => `
    <details class="faq">
      <summary>${escapeHtml(tr(f.q))}</summary>
      <p>${escapeHtml(tr(f.a))}</p>
    </details>`).join('');
}

// Glossary with optional demo actions handled by main.js.
export const GLOSSARY = [
  { term: { ja: '月相（げっそう）', en: 'Lunar phase' }, icon: 'firstQuarter', demo: 'phase:firstQuarter',
    body: { ja: '地球から見た月の形。新月 → 三日月 → 上弦 → 満月 → 下弦 → 新月 と約 29.5 日（朔望月）でくり返します。', en: 'The Moon’s shape as seen from Earth, cycling new → crescent → first quarter → full → last quarter in about 29.5 days (the synodic month).' } },
  { term: { ja: '月齢（げつれい）', en: 'Moon age' }, demo: null,
    body: { ja: '直前の新月からの経過日数。月齢 0 が新月、約 7 で上弦、約 15 で満月、約 22 で下弦。', en: 'Days since the last new moon: 0 new, ~7 first quarter, ~15 full, ~22 last quarter.' } },
  { term: { ja: '離角（りかく）', en: 'Elongation' }, demo: 'phase:lastQuarter',
    body: { ja: '地球から見た太陽と月の間の角度。このシミュレーターでは東回りに 0〜360° で表し（正確には月と太陽の黄経の差）、0° が新月、90° が上弦、180° が満月、270° が下弦です。', en: 'The angle between the Sun and the Moon as seen from Earth. Here it is measured eastward from 0 to 360° (strictly, the difference in ecliptic longitude): 0° new, 90° first quarter, 180° full, 270° last quarter.' } },
  { term: { ja: '輝面比（きめんひ）', en: 'Illuminated fraction' }, demo: 'phase:waxingCrescent',
    body: { ja: '月の円盤のうち光って見える部分の割合。半月で 50%、満月で 100%。', en: 'The fraction of the disk that is lit: 50% at quarter, 100% at full.' } },
  { term: { ja: '黄道と白道', en: 'Ecliptic & the Moon’s path' }, demo: 'mode:helio',
    body: { ja: '黄道は太陽が星空の中を 1 年かけて動く道すじ（地球の公転面）。白道は月の通り道で、黄道に対して約 5.1° 傾いています。', en: 'The ecliptic is the Sun’s yearly path (Earth’s orbital plane). The Moon’s path is tilted about 5.1° to it.' } },
  { term: { ja: '交点（昇交点・降交点）', en: 'Nodes' }, demo: 'phase:full',
    body: { ja: '白道が黄道面を横切る 2 つの点。月が南から北へ横切る点が昇交点、北から南へが降交点。交点線は 18.6 年で 1 周、西向きに回ります。', en: 'The two points where the Moon’s path crosses the ecliptic: ascending (going north) and descending. The node line turns westward once every 18.6 years.' } },
  { term: { ja: '本影と半影', en: 'Umbra & penumbra' }, demo: 'eclipse:lunar',
    body: { ja: '本影は太陽の光が完全にさえぎられた濃い影、半影は一部だけさえぎられたうすい影。月が本影に入ると皆既・部分月食、半影だけなら半影月食です。', en: 'The umbra is the dark core where sunlight is fully blocked; the penumbra is the partial shadow around it.' } },
  { term: { ja: '皆既・金環・部分日食', en: 'Total, annular & partial solar eclipses' }, demo: 'eclipse:solar',
    body: { ja: '月が太陽を完全に隠すと皆既、月が小さく見えて縁が残ると金環、一部だけ隠すと部分日食。', en: 'Total: the Moon covers the whole Sun. Annular: a ring remains. Partial: only part is covered.' } },
  { term: { ja: '食の季節', en: 'Eclipse season' }, demo: 'mode:helio',
    body: { ja: '太陽が交点の近くにある約 1 か月の期間。年に約 2 回、約 173 日ごとに訪れます。', en: 'The ~month when the Sun is near a node. It comes about twice a year, every ~173 days.' } },
  { term: { ja: 'サロス周期', en: 'Saros cycle' }, demo: null,
    body: { ja: '約 18 年 11 日 8 時間。この周期で太陽・月・交点の位置関係がほぼ元に戻り、よく似た食がくり返されます。', en: 'About 18 years 11 days 8 hours, after which Sun, Moon and node line up almost the same way and similar eclipses recur.' } },
];

export function buildGlossaryHtml() {
  return GLOSSARY.map((g, i) => `
    <article class="gl">
      <h4 class="gl__term">${g.icon ? phaseIconSVG(g.icon, 22) : ''}${escapeHtml(tr(g.term))}</h4>
      <p>${escapeHtml(tr(g.body))}</p>
      ${g.demo ? `<button class="btn btn--small" type="button" data-demo="${g.demo}" data-gl="${i}">▶ ${escapeHtml(t('gl.show'))}</button>` : ''}
    </article>`).join('');
}
