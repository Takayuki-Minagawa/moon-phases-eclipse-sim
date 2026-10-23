// Overhead (plan) view, looking down from above Earth's North Pole, so the
// Moon goes round counter-clockwise. Two modes:
//  - 'geo'   Earth-centred, sunlight from the left. Best for phases.
//  - 'helio' Sun-centred, Earth on its yearly orbit. Shows why the node line
//            only points at the Sun twice a year (eclipse seasons).
// Sizes and distances are exaggerated for visibility.

import { t } from './i18n.js';
import { litPath, illumForSynodic, PHASE_SYNODIC } from './moonShape.js';
import { ephemeris, dateToDay, dayToDate, wrap180, inEclipseSeason } from './simulation.js';

const DEG = Math.PI / 180;

// Last layout, used to map pointer positions back to angles.
let layout = null;

export function drawOverhead(canvas, s, ui) {
  const { ctx, w, h } = ui.fit;
  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  bg.addColorStop(0, '#111a3d');
  bg.addColorStop(1, '#03050d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  drawBackgroundStars(ctx, w, h);

  // World units: the scene is designed to fit a circle of radius ~270.
  const k = (Math.min(w, h) / (ui.mode === 'helio' ? 520 : 545)) * (ui.zoom ?? 1);
  const rot = (ui.rotateDeg ?? 0) * DEG;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rot);
  ctx.scale(k, k);
  // Half-extent of the visible area in world units (generous when rotated).
  const ext = rot === 0 ? [w / (2 * k), h / (2 * k)] : Array(2).fill(Math.hypot(w, h) / (2 * k));

  if (ui.mode === 'helio') drawHelio(ctx, s, ui, k);
  else drawGeo(ctx, s, ui, k, ext);

  ctx.restore();

  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(200, 210, 240, 0.55)';
  ctx.textAlign = 'right';
  ctx.fillText(t('cv.notScale'), w - 10, h - 10);
  ctx.textAlign = 'left';

  layout = { ...layout, w, h, k, rot };
}

// ---------- Earth-centred ----------

const G = { earthR: 24, moonR: 11, orbitR: 165, guideR: 222 };

function drawGeo(ctx, s, ui, k, [hw, hh]) {
  const syn = s.synodic * DEG;
  const theta = Math.PI - syn;                        // screen angle of the Moon
  const mx = Math.cos(theta) * G.orbitR, my = Math.sin(theta) * G.orbitR;
  const fs = 1 / Math.max(0.6, k);                    // keep text readable

  // Sun peeking in from the left, and parallel sunlight
  const sunX = -hw - 70;
  const sg = ctx.createRadialGradient(sunX, 0, 10, sunX, 0, 170);
  sg.addColorStop(0, '#fff6c8');
  sg.addColorStop(0.55, '#ffbb3d');
  sg.addColorStop(1, 'rgba(255, 140, 30, 0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(sunX, 0, 170, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = 'rgba(255, 214, 110, 0.16)';
  ctx.lineWidth = 1.2;
  const rows = Math.ceil(hh / 44);
  for (let i = -rows; i <= rows; i++) {
    const y = i * 44;
    ctx.beginPath(); ctx.moveTo(sunX + 120, y); ctx.lineTo(hw + 10, y); ctx.stroke();
    for (let x = -hw + 90; x < hw; x += 150) arrow(ctx, x, y, 0, 'rgba(255, 214, 110, 0.35)', 6);
  }
  ctx.font = `600 ${13 * fs}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.fillText(`${t('cv.sunlight')} →`, -hw + 14, -hh + 24);

  // Earth's shadow (penumbra then umbra), pointing away from the Sun
  const len = hw + 20;
  ctx.fillStyle = 'rgba(70, 90, 150, 0.16)';
  ctx.beginPath();
  ctx.moveTo(0, -G.earthR); ctx.lineTo(len, -G.earthR * 1.55);
  ctx.lineTo(len, G.earthR * 1.55); ctx.lineTo(0, G.earthR);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(4, 6, 16, 0.6)';
  ctx.beginPath();
  ctx.moveTo(0, -G.earthR); ctx.lineTo(len, -G.earthR * 0.55);
  ctx.lineTo(len, G.earthR * 0.55); ctx.lineTo(0, G.earthR);
  ctx.closePath(); ctx.fill();
  ctx.font = `${11 * fs}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(170, 185, 230, 0.75)';
  ctx.fillText(t('cv.umbra'), 104, 4);
  ctx.fillText(t('cv.penumbra'), 104, -G.earthR * 1.3 - 4);

  // Moon's orbit: the half north of the ecliptic solid, the southern half dashed
  if (s.tilt) {
    const thN = Math.PI - wrap180(s.nodeLon - s.sunLon) * DEG;   // ascending node
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(130, 190, 255, 0.75)';
    ctx.beginPath(); ctx.arc(0, 0, G.orbitR, thN - Math.PI, thN); ctx.stroke();
    ctx.strokeStyle = 'rgba(130, 190, 255, 0.4)';
    ctx.setLineDash([5, 6]);
    ctx.beginPath(); ctx.arc(0, 0, G.orbitR, thN, thN + Math.PI); ctx.stroke();
    ctx.setLineDash([]);

    // Node line and markers
    ctx.strokeStyle = 'rgba(255, 170, 80, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.cos(thN) * (G.orbitR + 18), Math.sin(thN) * (G.orbitR + 18));
    ctx.lineTo(-Math.cos(thN) * (G.orbitR + 18), -Math.sin(thN) * (G.orbitR + 18));
    ctx.stroke();
    ctx.setLineDash([]);
    nodeMarker(ctx, thN, G.orbitR, t('cv.ascNode'), fs);
    nodeMarker(ctx, thN + Math.PI, G.orbitR, t('cv.descNode'), fs);

    // "north half" label at the middle of the solid arc
    // (skipped while the Moon sits right on top of the label)
    const thMid = thN - Math.PI / 2;
    const near = a => Math.abs(Math.atan2(Math.sin(a - theta), Math.cos(a - theta))) < 0.6;
    ctx.font = `${10.5 * fs}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    if (!near(thMid)) {
      ctx.fillStyle = 'rgba(150, 200, 255, 0.85)';
      ctx.fillText(t('cv.north'), Math.cos(thMid) * (G.orbitR - 22), Math.sin(thMid) * (G.orbitR - 22));
    }
    if (!near(thMid + Math.PI)) {
      ctx.fillStyle = 'rgba(150, 200, 255, 0.55)';
      ctx.fillText(t('cv.south'), -Math.cos(thMid) * (G.orbitR - 22), -Math.sin(thMid) * (G.orbitR - 22));
    }
    ctx.textAlign = 'left';
  } else {
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(130, 190, 255, 0.6)';
    ctx.beginPath(); ctx.arc(0, 0, G.orbitR, 0, Math.PI * 2); ctx.stroke();
  }
  // direction-of-motion arrows on the orbit
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    arrow(ctx, Math.cos(a) * G.orbitR, Math.sin(a) * G.orbitR, a - Math.PI / 2, 'rgba(150, 200, 255, 0.8)', 7);
  }

  // 8-phase guide: top-down moons on the orbit and their look from Earth
  if (ui.showGuide) {
    for (const [key, sDeg] of Object.entries(PHASE_SYNODIC)) {
      const a = Math.PI - sDeg * DEG;
      const ox = Math.cos(a) * G.orbitR, oy = Math.sin(a) * G.orbitR;
      // ghost top-down moon (lit half toward the Sun)
      ctx.globalAlpha = 0.35;
      halfLitMoon(ctx, ox, oy, 8);
      ctx.globalAlpha = 1;
      // appearance as seen from Earth (upright, northern hemisphere)
      const gx = Math.cos(a) * G.guideR, gy = Math.sin(a) * G.guideR;
      const current = s.phaseKey === key && !ui.hideNames;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(-(ui.rotateDeg ?? 0) * DEG);            // keep icons upright
      ctx.fillStyle = '#272c48';
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f4f1e4';
      if (sDeg !== 0) { litPath(ctx, 0, 0, 15, illumForSynodic(sDeg), sDeg < 180); ctx.fill(); }
      ctx.lineWidth = current ? 3 : 1;
      ctx.strokeStyle = current ? '#ffb347' : 'rgba(180, 190, 230, 0.5)';
      ctx.beginPath(); ctx.arc(0, 0, current ? 18 : 15, 0, Math.PI * 2); ctx.stroke();
      if (!ui.hideNames) {
        ctx.font = `${(current ? 600 : 400)} ${10.5 * fs}px system-ui, sans-serif`;
        ctx.fillStyle = current ? '#ffd08a' : 'rgba(210, 218, 245, 0.85)';
        ctx.textAlign = 'center';
        ctx.fillText(t(`phase.${key}`), 0, 31);
        ctx.textAlign = 'left';
      }
      ctx.restore();
    }
  }

  // Angle from the Sun direction to the Moon
  ctx.strokeStyle = 'rgba(255, 200, 110, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 52, Math.PI - syn, Math.PI);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 200, 110, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-G.orbitR, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(mx, my); ctx.stroke();
  ctx.setLineDash([]);
  const am = Math.PI - syn / 2;
  ctx.font = `700 ${12 * fs}px system-ui, sans-serif`;
  ctx.fillStyle = '#ffd08a';
  ctx.textAlign = 'center';
  ctx.fillText(t('cv.elong', { deg: Math.round(s.synodic) }), Math.cos(am) * 72, Math.sin(am) * 72 + 4);
  ctx.textAlign = 'left';

  // Moon's shadow reaching Earth during a solar eclipse
  if (s.eclipse.possible && s.eclipse.kind === 'solar') {
    ctx.fillStyle = 'rgba(10, 10, 20, 0.7)';
    ctx.beginPath();
    ctx.moveTo(mx, my - G.moonR); ctx.lineTo(G.earthR * 0.2, 4); ctx.lineTo(G.earthR * 0.2, -4);
    ctx.lineTo(mx, my + G.moonR); ctx.closePath(); ctx.fill();
  }

  // Earth: day side faces the Sun
  drawEarth(ctx, 0, 0, G.earthR, Math.PI);
  if (s.eclipse.possible && s.eclipse.kind === 'solar') {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath(); ctx.arc(-G.earthR * 0.85, 0, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.font = `600 ${12 * fs}px system-ui, sans-serif`;
  ctx.fillStyle = '#cfe6ff';
  ctx.textAlign = 'center';
  ctx.fillText(t('cv.earth'), 0, G.earthR + 18);
  ctx.textAlign = 'left';

  // The Moon (half lit toward the Sun)
  const lunar = s.eclipse.possible && s.eclipse.kind === 'lunar';
  if (ui.dragging || ui.hover) {
    ctx.fillStyle = 'rgba(255, 200, 110, 0.25)';
    ctx.beginPath(); ctx.arc(mx, my, G.moonR + 9, 0, Math.PI * 2); ctx.fill();
  }
  halfLitMoon(ctx, mx, my, G.moonR, lunar ? (s.eclipse.type === 'penumbral' ? '#b9a99a' : '#c0583a') : null);
  ctx.strokeStyle = 'rgba(255, 210, 140, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(mx, my, G.moonR + 3, 0, Math.PI * 2); ctx.stroke();

  // Moon label: name + latitude above/below the ecliptic
  // Label just inside the orbit, so it never collides with the phase guide.
  const lx = mx - Math.cos(theta) * 36, ly = my - Math.sin(theta) * 36 - 4;
  ctx.font = `600 ${12 * fs}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(t('cv.moon'), lx, ly);
  if (s.tilt) {
    const lat = s.moonLatDeg;
    ctx.font = `${10.5 * fs}px system-ui, sans-serif`;
    ctx.fillStyle = Math.abs(lat) < s.limits.solar ? '#ffc070' : 'rgba(170, 200, 255, 0.9)';
    ctx.fillText(`${lat >= 0 ? '▲' : '▼'} ${Math.abs(lat).toFixed(1)}°`, lx, ly + 14 * fs);
  }
  if (!ui.everDragged) {
    ctx.font = `600 ${10.5 * fs}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255, 220, 160, 0.95)';
    ctx.fillText(`👆 ${t('cv.dragMe')}`, lx, ly - 16 * fs);
  }
  ctx.textAlign = 'left';

  layout = { mode: 'geo', earth: [0, 0], moon: [mx, my], moonR: G.moonR };
}

// ---------- Sun-centred ----------

const H = { sunR: 30, orbitR: 190, earthR: 9, moonOrbitR: 58, moonR: 5 };

function drawHelio(ctx, s, ui, k) {
  const fs = 1 / Math.max(0.6, k);
  const lamE = (s.sunLon + 180) * DEG;
  const ex = Math.cos(-lamE) * H.orbitR, ey = Math.sin(-lamE) * H.orbitR;

  // Earth orbit with month marks for the current year
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, H.orbitR, 0, Math.PI * 2); ctx.stroke();
  const year = dayToDate(s.day).getFullYear();
  const months = t('cv.months').split(',');
  ctx.font = `${10 * fs}px system-ui, sans-serif`;
  for (let m = 0; m < 12; m++) {
    const d = dateToDay(new Date(year, m, 1));
    const e = ephemeris(d);
    const a = -(e.sunLon + 180) * DEG;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(Math.cos(a) * H.orbitR, Math.sin(a) * H.orbitR, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200, 210, 240, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(months[m], Math.cos(a) * (H.orbitR + 18), Math.sin(a) * (H.orbitR + 18) + 3);

    // Ghost node lines every two months: the line keeps its direction in space
    if (s.tilt && m % 2 === 0) {
      const gx = Math.cos(a) * H.orbitR, gy = Math.sin(a) * H.orbitR;
      const n = -e.nodeLon * DEG;
      const aligned = inEclipseSeason(e.sunLon, e.nodeLon);
      ctx.strokeStyle = aligned ? 'rgba(255, 170, 80, 0.55)' : 'rgba(150, 190, 255, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx - Math.cos(n) * 22, gy - Math.sin(n) * 22);
      ctx.lineTo(gx + Math.cos(n) * 22, gy + Math.sin(n) * 22);
      ctx.stroke();
    }
  }
  ctx.textAlign = 'left';

  // Sun
  const sunG = ctx.createRadialGradient(0, 0, 3, 0, 0, H.sunR * 1.8);
  sunG.addColorStop(0, '#fff8d0');
  sunG.addColorStop(0.5, '#ffbb3d');
  sunG.addColorStop(1, 'rgba(255, 140, 30, 0)');
  ctx.fillStyle = sunG;
  ctx.beginPath(); ctx.arc(0, 0, H.sunR * 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.font = `600 ${12 * fs}px system-ui, sans-serif`;
  ctx.fillStyle = '#ffe2a0';
  ctx.textAlign = 'center';
  ctx.fillText(t('cv.sun'), 0, H.sunR + 24);
  ctx.textAlign = 'left';

  // Earth's shadow
  const ux = ex / H.orbitR, uy = ey / H.orbitR;
  ctx.fillStyle = 'rgba(4, 6, 16, 0.55)';
  ctx.beginPath();
  ctx.moveTo(ex - uy * H.earthR, ey + ux * H.earthR);
  ctx.lineTo(ex + ux * 110, ey + uy * 110);
  ctx.lineTo(ex + uy * H.earthR, ey - ux * H.earthR);
  ctx.closePath(); ctx.fill();

  // Moon orbit and node line
  const season = s.tilt && inEclipseSeason(s.sunLon, s.nodeLon);
  ctx.strokeStyle = 'rgba(130, 190, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(ex, ey, H.moonOrbitR, 0, Math.PI * 2); ctx.stroke();
  if (s.tilt) {
    const n = -s.nodeLon * DEG;
    if (season) {
      ctx.strokeStyle = 'rgba(255, 170, 80, 0.25)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(ex - Math.cos(n) * (H.moonOrbitR + 30), ey - Math.sin(n) * (H.moonOrbitR + 30));
      ctx.lineTo(ex + Math.cos(n) * (H.moonOrbitR + 30), ey + Math.sin(n) * (H.moonOrbitR + 30));
      ctx.stroke();
    }
    ctx.strokeStyle = season ? '#ffb347' : 'rgba(150, 200, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - Math.cos(n) * (H.moonOrbitR + 30), ey - Math.sin(n) * (H.moonOrbitR + 30));
    ctx.lineTo(ex + Math.cos(n) * (H.moonOrbitR + 30), ey + Math.sin(n) * (H.moonOrbitR + 30));
    ctx.stroke();
    ctx.font = `${10.5 * fs}px system-ui, sans-serif`;
    ctx.fillStyle = season ? '#ffc070' : 'rgba(170, 200, 255, 0.85)';
    ctx.fillText(t('cv.nodeLine'), ex + Math.cos(n) * (H.moonOrbitR + 34), ey + Math.sin(n) * (H.moonOrbitR + 34));
  }

  drawEarth(ctx, ex, ey, H.earthR, Math.atan2(-ey, -ex));
  ctx.font = `600 ${12 * fs}px system-ui, sans-serif`;
  ctx.fillStyle = '#cfe6ff';
  ctx.fillText(t('cv.earth'), ex + 12, ey + 22);

  // Moon
  const am = -s.moonLon * DEG;
  const mx = ex + Math.cos(am) * H.moonOrbitR, my = ey + Math.sin(am) * H.moonOrbitR;
  if (ui.dragging || ui.hover) {
    ctx.fillStyle = 'rgba(255, 200, 110, 0.25)';
    ctx.beginPath(); ctx.arc(mx, my, H.moonR + 8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(Math.atan2(-my, -mx) - Math.PI);          // lit half toward the Sun
  const lunar = s.eclipse.possible && s.eclipse.kind === 'lunar';
  halfLitMoon(ctx, 0, 0, H.moonR, lunar ? '#c0583a' : null);
  ctx.restore();
  ctx.font = `600 ${11 * fs}px system-ui, sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.fillText(t('cv.moon'), mx + 8, my - 8);

  if (season) {
    ctx.font = `700 ${13 * fs}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffc070';
    ctx.textAlign = 'center';
    ctx.fillText(`★ ${t('cv.season')}`, 0, H.orbitR + 48);
    ctx.textAlign = 'left';
  }

  layout = { mode: 'helio', earth: [ex, ey], moon: [mx, my], moonR: H.moonR + 4 };
}

// ---------- helpers ----------

function drawEarth(ctx, x, y, r, sunAngle) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, '#6ec0ff');
  g.addColorStop(1, '#1b4f9c');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // continents hint
  ctx.fillStyle = 'rgba(90, 170, 100, 0.65)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.2, y - r * 0.25, r * 0.35, r * 0.22, 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.3, r * 0.22, r * 0.3, -0.3, 0, Math.PI * 2); ctx.fill();
  // night side
  ctx.fillStyle = 'rgba(2, 4, 14, 0.7)';
  ctx.beginPath();
  ctx.arc(x, y, r + 0.5, sunAngle + Math.PI / 2, sunAngle + Math.PI * 1.5);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(160, 210, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, r + 1.5, 0, Math.PI * 2); ctx.stroke();
}

// A moon whose left half (local −x, toward the Sun in 'geo') is lit.
function halfLitMoon(ctx, x, y, r, tint) {
  ctx.fillStyle = '#2b3050';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = tint ?? '#f2efe2';
  ctx.beginPath(); ctx.arc(x, y, r, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); ctx.fill();
  if (tint) { ctx.globalAlpha *= 0.6; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha /= 0.6; }
}

function nodeMarker(ctx, th, R, text, fs) {
  const x = Math.cos(th) * R, y = Math.sin(th) * R;
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.moveTo(x, y - 6); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 6, y);
  ctx.closePath(); ctx.fill();
  ctx.font = `${10 * fs}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 190, 110, 0.9)';
  ctx.textAlign = 'center';
  ctx.fillText(text, Math.cos(th) * (R + 32), Math.sin(th) * (R + 32) + 4);
  ctx.textAlign = 'left';
}

function arrow(ctx, x, y, angle, color, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size, 0); ctx.lineTo(-size * 0.6, -size * 0.6); ctx.lineTo(-size * 0.6, size * 0.6);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

const BG_STARS = Array.from({ length: 90 }, (_, i) => [((i * 7919) % 1009) / 1009, ((i * 6151) % 1013) / 1013, i % 7 === 0 ? 1.2 : 0.6]);
function drawBackgroundStars(ctx, w, h) {
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  for (const [x, y, r] of BG_STARS) {
    ctx.beginPath(); ctx.arc(x * w, y * h, r, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------- pointer interaction ----------

function toWorld(px, py) {
  if (!layout) return null;
  const { w, h, k, rot } = layout;
  const dx = px - w / 2, dy = py - h / 2;
  const c = Math.cos(-rot), s = Math.sin(-rot);
  return [(dx * c - dy * s) / k, (dx * s + dy * c) / k];
}

// Is the pointer (CSS px in the canvas) on the Moon?
export function hitMoon(px, py) {
  const p = toWorld(px, py);
  if (!p || !layout.moon) return false;
  const tol = layout.moonR + 14 / Math.max(0.5, layout.k);
  return Math.hypot(p[0] - layout.moon[0], p[1] - layout.moon[1]) <= tol;
}

// Synodic angle (deg) for a pointer position, measured around Earth.
export function pointerToSynodic(px, py, s) {
  const p = toWorld(px, py);
  if (!p) return null;
  const a = Math.atan2(p[1] - layout.earth[1], p[0] - layout.earth[0]);
  if (layout.mode === 'geo') return ((180 - a / DEG) % 360 + 360) % 360;
  const moonLon = -a / DEG;
  return ((moonLon - s.sunLon) % 360 + 360) % 360;
}
