// One-year timeline: eclipse seasons, new / full moons, eclipses and a
// cursor for the current time. Click or drag to move through the year.

import { t } from './i18n.js';
import {
  dateToDay, dayToDate, ephemeris, inEclipseSeason, listEclipses, listSyzygies, synodicAt,
} from './simulation.js';

const cache = new Map();

export function yearRange(year) {
  return [dateToDay(new Date(year, 0, 1)), dateToDay(new Date(year + 1, 0, 1))];
}

// Year data (computed once per year and tilt setting).
export function yearData(year, tilt) {
  const key = `${year}:${tilt}`;
  if (cache.has(key)) return cache.get(key);
  const [start, end] = yearRange(year);
  const seasons = [];
  let open = null;
  for (let d = start; d <= end; d += 0.5) {
    const e = ephemeris(d);
    const inS = !tilt || inEclipseSeason(e.sunLon, e.nodeLon);
    if (inS && open == null) open = d;
    if ((!inS || d + 0.5 > end) && open != null) { seasons.push([open, d]); open = null; }
  }
  const illum = [];
  for (let d = start; d <= end; d += 0.25) {
    illum.push((1 - Math.cos(synodicAt(d) * Math.PI / 180)) / 2);
  }
  const data = {
    year, start, end, seasons, illum,
    syzygies: listSyzygies(start, end),
    eclipses: listEclipses(start, end, { tilt }),
  };
  cache.set(key, data);
  if (cache.size > 12) cache.delete(cache.keys().next().value);
  return data;
}

const PAD_L = 10, PAD_R = 10;

export function drawTimeline(canvas, day, tilt, ui) {
  const { ctx, w, h } = ui.fit;
  const year = dayToDate(day).getFullYear();
  const data = yearData(year, tilt);
  const span = data.end - data.start;
  const X = d => PAD_L + ((d - data.start) / span) * (w - PAD_L - PAD_R);

  const dark = ui.theme === 'dark';
  const fg = dark ? '#c9d2ee' : '#3b4260';
  const muted = dark ? 'rgba(200,210,240,0.45)' : 'rgba(40,50,80,0.4)';
  ctx.clearRect(0, 0, w, h);

  const top = 18, waveH = h - top - 30;

  // Eclipse seasons
  ctx.fillStyle = dark ? 'rgba(255, 160, 60, 0.16)' : 'rgba(255, 150, 40, 0.18)';
  for (const [a, b] of data.seasons) ctx.fillRect(X(a), top - 4, Math.max(1, X(b) - X(a)), waveH + 8);

  // Month grid & labels
  const months = t('cv.months').split(',');
  ctx.font = '11px system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  for (let m = 0; m < 12; m++) {
    const d0 = dateToDay(new Date(year, m, 1));
    const d1 = dateToDay(new Date(year, m + 1, 1));
    ctx.strokeStyle = muted;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(d0) + 0.5, top - 4); ctx.lineTo(X(d0) + 0.5, h - 18); ctx.stroke();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.fillText(months[m], (X(d0) + X(d1)) / 2, h - 5);
  }
  ctx.textAlign = 'left';

  // Illumination wave (how bright the Moon is through the year)
  const base = top + waveH;
  ctx.beginPath();
  ctx.moveTo(X(data.start), base);
  data.illum.forEach((v, i) => ctx.lineTo(X(data.start + i * 0.25), base - v * waveH));
  ctx.lineTo(X(data.end), base);
  ctx.closePath();
  const wg = ctx.createLinearGradient(0, top, 0, base);
  wg.addColorStop(0, dark ? 'rgba(240, 236, 210, 0.55)' : 'rgba(110, 120, 190, 0.45)');
  wg.addColorStop(1, dark ? 'rgba(240, 236, 210, 0.05)' : 'rgba(110, 120, 190, 0.05)');
  ctx.fillStyle = wg;
  ctx.fill();

  // New / full moon ticks
  for (const z of data.syzygies) {
    const x = X(z.day);
    const y = z.kind === 'full' ? top : base;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = z.kind === 'full' ? (dark ? '#f5f1dc' : '#ffffff') : (dark ? '#20263f' : '#3a4060');
    ctx.fill();
    ctx.strokeStyle = dark ? 'rgba(220,226,255,0.6)' : 'rgba(40,50,80,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Eclipses
  for (const ec of data.eclipses) {
    const x = X(ec.day);
    const y = ec.kind === 'lunar' ? top : base;
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = ec.kind === 'lunar' ? '#d8572a' : '#ffc23d';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = dark ? '#0b0f1d' : '#fff';
    ctx.stroke();
    if (ec.kind === 'solar') {
      ctx.fillStyle = '#1a1d2b';
      ctx.beginPath(); ctx.arc(x + (ec.type === 'partial' ? 3 : 0), y, ec.type === 'annular' ? 4 : 5.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Cursor
  const cx = X(day);
  ctx.strokeStyle = dark ? '#8fa6ff' : '#3b6bff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, 2); ctx.lineTo(cx, h - 18); ctx.stroke();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath(); ctx.moveTo(cx - 6, 0); ctx.lineTo(cx + 6, 0); ctx.lineTo(cx, 8); ctx.closePath(); ctx.fill();

  return { data, X };
}

// Pointer x (CSS px) → day in the year being shown.
export function timelineDayAt(px, w, day) {
  const [start, end] = yearRange(dayToDate(day).getFullYear());
  const f = Math.max(0, Math.min(0.99999, (px - PAD_L) / (w - PAD_L - PAD_R)));
  return start + f * (end - start);
}
