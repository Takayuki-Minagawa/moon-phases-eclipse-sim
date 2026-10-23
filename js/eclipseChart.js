// "Eclipse check" chart: the sky around the Sun (near new moon) or around
// Earth's shadow (near full moon), in real angular units, with the Moon's
// track. It shows directly why the Moon usually passes above or below.
// Orientation: north up, east to the left, like looking south.

import { t } from './i18n.js';
import { ephemeris, wrap180, SYNODIC_MONTH } from './simulation.js';
import { roundRect } from './moonView.js';

const HALF_W_DEG = 8;

export function drawEclipseChart(canvas, s, ui) {
  const { ctx, w, h } = ui.fit;
  const scale = w / (2 * HALF_W_DEG);              // px per degree
  const cx = w / 2, cy = h / 2 + 8;
  const r = s.radii;

  const nearNew = Math.abs(wrap180(s.synodic)) <= 90;
  const target = nearNew ? 0 : 180;
  const limit = nearNew ? s.limits.solar : s.limits.lunarPenumbral;

  // Background
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, nearNew ? '#0d1838' : '#070b1c');
  g.addColorStop(1, nearNew ? '#18295a' : '#0d1430');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Degree grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let d = -HALF_W_DEG; d <= HALF_W_DEG; d++) {
    ctx.beginPath(); ctx.moveTo(cx + d * scale, 0); ctx.lineTo(cx + d * scale, h); ctx.stroke();
  }
  for (let d = -6; d <= 6; d++) {
    ctx.beginPath(); ctx.moveTo(0, cy + d * scale); ctx.lineTo(w, cy + d * scale); ctx.stroke();
  }

  // Eclipse zone: the Moon's centre must pass within ±limit
  ctx.fillStyle = 'rgba(255, 170, 60, 0.13)';
  ctx.fillRect(0, cy - limit * scale, w, 2 * limit * scale);
  ctx.strokeStyle = 'rgba(255, 170, 60, 0.45)';
  ctx.setLineDash([4, 4]);
  for (const sgn of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, cy + sgn * limit * scale); ctx.lineTo(w, cy + sgn * limit * scale); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Ecliptic
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.55)';
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

  // Target: the Sun, or Earth's shadow
  if (nearNew) {
    const glow = ctx.createRadialGradient(cx, cy, r.sunRad * scale, cx, cy, r.sunRad * scale * 3);
    glow.addColorStop(0, 'rgba(255, 220, 120, 0.5)');
    glow.addColorStop(1, 'rgba(255, 220, 120, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, r.sunRad * scale * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd56b';
    ctx.beginPath(); ctx.arc(cx, cy, r.sunRad * scale, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(120, 130, 170, 0.22)';
    ctx.beginPath(); ctx.arc(cx, cy, r.penumbra * scale, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(130, 40, 30, 0.6)';
    ctx.beginPath(); ctx.arc(cx, cy, r.umbra * scale, 0, Math.PI * 2); ctx.fill();
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 220, 210, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(t('cv.umbra'), cx, cy + 3);
    ctx.fillStyle = 'rgba(210, 215, 240, 0.75)';
    ctx.fillText(t('cv.penumbra'), cx, cy + r.penumbra * scale - 5);
    ctx.textAlign = 'left';
  }

  // Moon track around the current time (±1.5 days)
  const pts = [];
  for (let dt = -1.5; dt <= 1.5001; dt += 0.1) {
    const e = ephemeris(s.day + dt);
    const lat = s.tilt ? e.moonLat : 0;
    const dl = wrap180(e.moonLon - e.sunLon - target);
    pts.push([cx - dl * scale, cy - lat * scale]);
  }
  ctx.strokeStyle = 'rgba(190, 205, 255, 0.55)';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.setLineDash([]);
  // direction arrow (Moon moves east = left)
  const [ax, ay] = pts[pts.length - 1], [bx, by] = pts[pts.length - 4];
  arrowHead(ctx, bx, by, ax, ay, 'rgba(190, 205, 255, 0.8)');

  // The Moon
  const dLon = wrap180(s.synodic - target);
  const mx = cx - dLon * scale, my = cy - s.moonLatDeg * scale;
  const mr = Math.max(3, r.moonRad * scale);
  const onChart = mx > -mr && mx < w + mr;
  if (onChart) {
    if (nearNew) {
      ctx.fillStyle = 'rgba(30, 34, 52, 0.95)';
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c8d2ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      const inUmbra = s.eclipse.kind === 'lunar' && s.eclipse.type !== 'penumbral';
      ctx.fillStyle = inUmbra ? '#d0704a' : '#f2efe2';
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // Off-chart arrow at the edge
    const ex = dLon < 0 ? w - 14 : 14;
    const ey = Math.max(16, Math.min(h - 16, my));
    ctx.fillStyle = '#c8d2ff';
    ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
  }

  // Captions
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  pill(ctx, t(nearNew ? 'cv.chart.solar' : 'cv.chart.lunar'), 8, 8, 'rgba(5,8,20,0.6)', '#eef2ff');
  const hit = s.eclipse.possible;
  ctx.textAlign = 'right';
  pill(ctx, hit ? t('cv.hit') : t('cv.miss'), w - 8, 8,
    hit ? 'rgba(255, 140, 60, 0.9)' : 'rgba(80, 90, 130, 0.7)', hit ? '#1d0d00' : '#eef2ff');
  ctx.textAlign = 'left';

  ctx.font = '11px system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255, 190, 110, 0.9)';
  ctx.fillText(t('cv.zone'), 8, cy - limit * scale - 4);
  ctx.fillStyle = 'rgba(255, 220, 120, 0.75)';
  ctx.textAlign = 'right';
  ctx.fillText(t('cv.ecliptic'), w - 8, cy - 4);
  // Sky orientation (looking south): east is on the left
  ctx.fillStyle = 'rgba(230, 236, 255, 0.55)';
  ctx.fillText(`${t('cv.west')} →`, w - 8, cy + 14);
  ctx.textAlign = 'left';
  ctx.fillText(`← ${t('cv.east')}`, 8, cy + 14);

  // Bottom line: latitude and time to syzygy
  const days = Math.abs(dLon) / (360 / SYNODIC_MONTH);
  const key = dLon < 0 ? (nearNew ? 'cv.toSyzygy.new' : 'cv.toSyzygy.full')
                       : (nearNew ? 'cv.fromSyzygy.new' : 'cv.fromSyzygy.full');
  const lat = (s.moonLatDeg >= 0 ? '+' : '') + s.moonLatDeg.toFixed(2);
  ctx.fillStyle = 'rgba(230, 236, 255, 0.85)';
  ctx.fillText(t('cv.lat', { lat }), 8, h - 8);
  ctx.textAlign = 'right';
  ctx.fillText(t(key, { d: days.toFixed(1) }), w - 8, h - 8);
  ctx.textAlign = 'left';
}

function pill(ctx, text, x, y, bg, fg) {
  const m = ctx.measureText(text);
  const left = ctx.textAlign === 'right' ? x - m.width : x;
  ctx.fillStyle = bg;
  roundRect(ctx, left - 7, y - 3, m.width + 14, 21, 10);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.fillText(text, x, y + 1);
}

function arrowHead(ctx, x0, y0, x1, y1, color) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - 9 * Math.cos(a - 0.4), y1 - 9 * Math.sin(a - 0.4));
  ctx.lineTo(x1 - 9 * Math.cos(a + 0.4), y1 - 9 * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
}
