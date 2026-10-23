// "The Moon from Earth": the Moon in the southern sky at the time it is
// highest, with the correct phase. During eclipses it switches to an
// eclipse picture drawn from the actual geometry (shadow / disk positions).

import { t, formatHour } from './i18n.js';
import { drawTexturedMoon } from './moonShape.js';
import { wrap180 } from './simulation.js';

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: ((i * 7919) % 997) / 997,
  y: ((i * 104729) % 991) / 991,
  r: i % 5 === 0 ? 1.3 : 0.7,
}));

export function drawMoonView(canvas, s, ui = {}) {
  const { ctx, w, h } = ui.fit;
  ctx.clearRect(0, 0, w, h);

  if (ui.hidden) {
    drawHidden(ctx, w, h);
    return;
  }
  if (s.eclipse.possible && s.eclipse.kind === 'solar') {
    drawSolarEclipse(ctx, w, h, s);
    return;
  }

  // Sky colour at the time the Moon is highest in the south.
  const hour = s.transitHour;
  const dayF = (Math.cos(((hour - 12) / 24) * 2 * Math.PI) + 1) / 2;   // 1 noon … 0 midnight
  const sun = smooth((dayF - 0.25) / 0.5);
  const top = mix([6, 10, 30], [52, 118, 205], sun);
  const bot = mix([16, 26, 66], [150, 196, 238], sun);
  // Twilight glow when the moon culminates around sunset / sunrise
  const twilight = Math.max(0, 1 - Math.abs(dayF - 0.5) / 0.22);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, rgb(top));
  g.addColorStop(0.75, rgb(bot));
  g.addColorStop(1, rgb(mix(bot, [245, 150, 90], twilight * 0.7)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Stars at night
  const starA = Math.max(0, 1 - sun * 2.2);
  if (starA > 0.02) {
    ctx.fillStyle = `rgba(255,255,255,${0.75 * starA})`;
    for (const st of STARS) {
      ctx.beginPath();
      ctx.arc(st.x * w, st.y * h * 0.8, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const cx = w / 2;
  const cy = h * 0.44;
  const R = Math.min(w, h) * 0.3;

  const lunar = s.eclipse.possible && s.eclipse.kind === 'lunar';
  const isNew = s.illumFrac < 0.02 && !lunar;

  // Glow around the bright moon
  if (!isNew) {
    const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.9);
    const ga = (lunar && s.eclipse.type !== 'penumbral' ? 0.05 : 0.22) * s.illumFrac * (1 - sun * 0.7);
    glow.addColorStop(0, `rgba(255, 250, 230, ${ga})`);
    glow.addColorStop(1, 'rgba(255, 250, 230, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.save();
  if (isNew) ctx.globalAlpha = 0.35;
  // In daylight the night side blends with the sky
  // In daylight the unlit part is invisible against the sky, so paint it
  // with the sky gradient itself; at night keep a faint earthshine.
  const night = sun > 0.5 ? g : 'rgba(14, 18, 36, 0.9)';
  drawTexturedMoon(ctx, cx, cy, R, s.illumFrac, s.waxing, { nightColor: night });
  ctx.restore();

  if (lunar) drawEarthShadowOnMoon(ctx, cx, cy, R, s);

  // Horizon silhouette
  drawHorizon(ctx, w, h, sun);

  // Captions
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  label(ctx, isNew ? t('cv.newMoonSky') : t('cv.skyAt', { h: formatHour(hour) }), 10, 10);
  ctx.font = '10.5px system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(230, 236, 255, 0.75)';
  ctx.fillText(t('cv.northHemi'), 10, h - 8);
}

function drawHidden(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0b1230');
  g.addColorStop(1, '#1b2550');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.44, Math.min(w, h) * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${Math.round(Math.min(w, h) * 0.22)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', w / 2, h * 0.44);
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText(t('cv.quizHidden'), w / 2, h * 0.86);
  ctx.textAlign = 'left';
}

// Earth's umbra and penumbra overlaid on the Moon, using the real angular
// sizes. Sky orientation: north up, east to the left.
function drawEarthShadowOnMoon(ctx, cx, cy, R, s) {
  const r = s.radii;
  const scale = R / r.moonRad;                  // px per degree
  const dLon = wrap180(s.synodic - 180);         // Moon east of shadow centre
  const sx = cx + dLon * scale;                  // shadow centre (east → left)
  const sy = cy + s.moonLatDeg * scale;
  const ru = r.umbra * scale, rp = r.penumbra * scale;

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  const pg = ctx.createRadialGradient(sx, sy, ru, sx, sy, rp);
  pg.addColorStop(0, 'rgba(20, 12, 10, 0.55)');
  pg.addColorStop(1, 'rgba(20, 12, 10, 0)');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(sx, sy, rp, 0, Math.PI * 2); ctx.fill();

  const ug = ctx.createRadialGradient(sx, sy, ru * 0.2, sx, sy, ru * 1.02);
  ug.addColorStop(0, 'rgba(70, 14, 6, 0.93)');
  ug.addColorStop(0.85, 'rgba(150, 50, 20, 0.85)');
  ug.addColorStop(1, 'rgba(170, 70, 30, 0.6)');
  ctx.fillStyle = ug;
  ctx.beginPath(); ctx.arc(sx, sy, ru, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Solar eclipse as seen from the place on Earth closest to the shadow axis.
function drawSolarEclipse(ctx, w, h, s) {
  const r = s.radii;
  const type = s.eclipse.type;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  if (type === 'total') {
    g.addColorStop(0, '#020410'); g.addColorStop(1, '#141c3c');
  } else {
    g.addColorStop(0, '#2a4f86'); g.addColorStop(1, '#6f98c9');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (type === 'total') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const st of STARS.slice(0, 25)) {
      ctx.beginPath(); ctx.arc(st.x * w, st.y * h * 0.8, st.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  const cx = w / 2, cy = h * 0.46;
  const Rs = Math.min(w, h) * 0.24;
  const scale = Rs / r.sunRad;
  const topoMoon = r.moonRad * (1 + Math.sin(r.moonPar * Math.PI / 180));
  const Rm = topoMoon * scale;

  // Parallax lets an observer on Earth shift the Moon by up to (π☾ − π☉).
  const dLon = wrap180(s.synodic);
  const lat = s.moonLatDeg;
  const sep = Math.hypot(dLon, lat);
  const apparent = Math.max(0, sep - (r.moonPar - r.sunPar));
  const ux = sep > 1e-6 ? -dLon / sep : 0;
  const uy = sep > 1e-6 ? -lat / sep : 0;
  const mx = cx + ux * apparent * scale;
  const my = cy + uy * apparent * scale;

  // Corona (total) or glare
  if (type === 'total') {
    const cg = ctx.createRadialGradient(cx, cy, Rs * 0.9, cx, cy, Rs * 3);
    cg.addColorStop(0, 'rgba(240, 245, 255, 0.85)');
    cg.addColorStop(0.3, 'rgba(200, 215, 255, 0.25)');
    cg.addColorStop(1, 'rgba(200, 215, 255, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, Rs * 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(230, 236, 255, 0.25)';
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.2;
      const len = Rs * (1.5 + ((i * 37) % 10) / 8);
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * Rs, cy + Math.sin(a) * Rs);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }
  } else {
    const glare = ctx.createRadialGradient(cx, cy, Rs, cx, cy, Rs * 2.4);
    glare.addColorStop(0, 'rgba(255, 245, 200, 0.6)');
    glare.addColorStop(1, 'rgba(255, 245, 200, 0)');
    ctx.fillStyle = glare;
    ctx.beginPath(); ctx.arc(cx, cy, Rs * 2.4, 0, Math.PI * 2); ctx.fill();
  }

  if (type !== 'total') {
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rs);
    sg.addColorStop(0, '#fffbe6');
    sg.addColorStop(0.8, '#ffe28a');
    sg.addColorStop(1, '#ffb347');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(cx, cy, Rs, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#05060c';
  ctx.beginPath(); ctx.arc(mx, my, Rm, 0, Math.PI * 2); ctx.fill();

  drawHorizon(ctx, w, h, type === 'total' ? 0 : 0.6);

  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  label(ctx, t('cv.solarView'), 10, 10);
}

function drawHorizon(ctx, w, h, sun) {
  const base = h * 0.9;
  ctx.fillStyle = sun > 0.5 ? '#2c3d2f' : '#070a14';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, base);
  // gentle hills with a few houses
  for (let x = 0; x <= w; x += w / 24) {
    ctx.lineTo(x, base - Math.sin(x / w * 7) * h * 0.015 - (x / w > 0.55 && x / w < 0.75 ? h * 0.02 : 0));
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  // houses
  const houses = [[0.12, 0.05], [0.2, 0.035], [0.82, 0.045]];
  for (const [fx, fh] of houses) {
    const x = fx * w, bw = w * 0.05, hh = h * fh;
    ctx.fillRect(x, base - hh, bw, hh + 2);
    ctx.beginPath();
    ctx.moveTo(x - 3, base - hh); ctx.lineTo(x + bw / 2, base - hh - h * 0.03); ctx.lineTo(x + bw + 3, base - hh);
    ctx.fill();
    if (sun < 0.5) {
      ctx.fillStyle = 'rgba(255, 210, 120, 0.85)';
      ctx.fillRect(x + bw * 0.35, base - hh * 0.6, bw * 0.25, hh * 0.25);
      ctx.fillStyle = '#070a14';
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(t('cv.south.dir'), w / 2, h - 6);
  ctx.textAlign = 'left';
}

function label(ctx, text, x, y) {
  const m = ctx.measureText(text);
  ctx.fillStyle = 'rgba(5, 8, 20, 0.55)';
  roundRect(ctx, x - 6, y - 4, m.width + 12, 22, 8);
  ctx.fill();
  ctx.fillStyle = '#eef2ff';
  ctx.fillText(text, x, y + 1);
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function smooth(x) { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); }
function mix(a, b, f) { return a.map((v, i) => Math.round(v + (b[i] - v) * f)); }
function rgb(c) { return `rgb(${c[0]}, ${c[1]}, ${c[2]})`; }
