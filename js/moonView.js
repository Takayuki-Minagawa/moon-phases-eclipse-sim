// Earth-view moon disk renderer. Renders the moon with the correct
// illumination fraction and waxing/waning orientation.

const CRATERS = [
  { x: -0.35, y: -0.20, r: 0.08 },
  { x:  0.15, y: -0.35, r: 0.05 },
  { x:  0.30, y:  0.15, r: 0.07 },
  { x: -0.10, y:  0.25, r: 0.06 },
  { x: -0.45, y:  0.30, r: 0.04 },
  { x:  0.05, y:  0.05, r: 0.03 },
];

export function drawMoonView(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background: sky gradient that depends on synodic angle (day/night cue).
  const t = state.synodic / 360;
  const top    = sampleSkyTop(t);
  const bottom = sampleSkyBot(t);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Stars for a night-ish background
  if (state.synodic < 90 || state.synodic > 270) {
    drawStars(ctx, w, h, 40);
  } else if (state.synodic > 135 && state.synodic < 225) {
    drawStars(ctx, w, h, 14);
  }

  const cx = w / 2;
  const cy = h / 2 + 6;
  const R  = Math.min(w, h) * 0.38;

  drawMoonDisk(ctx, cx, cy, R, state.illumFrac, state.waxing);

  // Craters — tinted by local shadow via composite
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(10, 12, 24, 0.22)';
  for (const c of CRATERS) {
    ctx.beginPath();
    ctx.arc(cx + c.x * R, cy + c.y * R, c.r * R, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Moon outline for definition
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Eclipse overlay on the moon view
  if (state.eclipse.kind === 'lunar' && state.eclipse.possible) {
    drawLunarOverlay(ctx, cx, cy, R, state.eclipse.type);
  } else if (state.eclipse.kind === 'solar' && state.eclipse.possible) {
    drawSolarInset(ctx, w, h, state.eclipse.type);
  }
}

function drawMoonDisk(ctx, cx, cy, R, k, waxing) {
  ctx.save();

  // Base dark disk
  ctx.fillStyle = '#2b2f48';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  // Clip to disk so rectangle fills don't bleed
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Lit hemisphere fill
  ctx.fillStyle = '#eef2ff';
  if (waxing) {
    ctx.fillRect(cx, cy - R - 2, R + 2, 2 * R + 4);
  } else {
    ctx.fillRect(cx - R - 2, cy - R - 2, R + 2, 2 * R + 4);
  }

  // Terminator ellipse correction
  const cosI = 2 * k - 1;          // -1..1
  const rx   = R * Math.abs(cosI); // ellipse minor radius
  if (rx > 0.5) {
    ctx.fillStyle = (k < 0.5) ? '#2b2f48' : '#eef2ff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, R, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (Math.abs(cosI) < 0.02) {
    // Quarter: nothing extra needed; ellipse is a line.
  }

  // Subtle limb darkening
  const lg = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R);
  lg.addColorStop(0, 'rgba(0,0,0,0)');
  lg.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawLunarOverlay(ctx, cx, cy, R, type) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  if (type === 'total') {
    ctx.fillStyle = 'rgba(180, 40, 40, 0.55)'; // blood moon
  } else if (type === 'partial') {
    ctx.fillStyle = 'rgba(150, 40, 40, 0.40)';
  } else {
    ctx.fillStyle = 'rgba(80, 80, 130, 0.35)';
  }
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawSolarInset(ctx, w, h, type) {
  // Small icon in corner showing a solar eclipse diagram
  const x = w - 54, y = 22, r = 16;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x - 20, y - 20, 68, 40);
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1d2b';
  const dx = (type === 'annular') ? r * 0.1 : r * 0.2;
  ctx.beginPath(); ctx.arc(x + dx, y, r * 0.92, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function sampleSkyTop(t) {
  // t ∈ [0,1]. 0 = new moon (daylight direction), 0.5 = full (night)
  // Around 0: brighter blue; around 0.5: deep navy
  const night = Math.sin(t * Math.PI);        // 0..1 with peak at t=0.5
  const r = lerp(16, 5, night);
  const g = lerp(28, 8, night);
  const b = lerp(60, 22, night);
  return `rgb(${r|0}, ${g|0}, ${b|0})`;
}
function sampleSkyBot(t) {
  const night = Math.sin(t * Math.PI);
  const r = lerp(30, 2, night);
  const g = lerp(45, 4, night);
  const b = lerp(90, 15, night);
  return `rgb(${r|0}, ${g|0}, ${b|0})`;
}
function lerp(a, b, t) { return a + (b - a) * t; }

function drawStars(ctx, w, h, n) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < n; i++) {
    // Deterministic pseudo-random placement based on i
    const x = ((i * 97) % w);
    const y = ((i * 53) % (h - 20)) + 6;
    const r = (i % 3 === 0) ? 1.4 : 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
