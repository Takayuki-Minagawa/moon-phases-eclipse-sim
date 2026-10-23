// Shared geometry for drawing a moon phase: the lit part of the disk is
// bounded by the bright limb (a half circle) and the terminator (a half
// ellipse whose x-radius is R·|cos i|). Waning phases are mirror images.

// Canvas path of the lit region, centred on (cx, cy).
export function litPath(ctx, cx, cy, R, illumFrac, waxing) {
  const cosI = 2 * illumFrac - 1;     // cos of the phase angle
  const rx = Math.abs(cosI) * R;
  const s = waxing ? 1 : -1;          // lit side: +x waxing, −x waning
  ctx.beginPath();
  // Bright limb: top → (lit side) → bottom
  ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2, s < 0);
  // Terminator: bottom → top. Gibbous bulges into the dark side,
  // crescent bulges into the lit side.
  const gibbous = cosI > 0;
  ctx.ellipse(cx, cy, Math.max(rx, 0.01), R, 0, Math.PI / 2, -Math.PI / 2,
    s > 0 ? !gibbous : gibbous);
  ctx.closePath();
}

// Small SVG icon of a moon phase, for buttons and cards.
export function moonIconSVG(illumFrac, waxing, size = 28, opts = {}) {
  const R = 10;
  const cosI = 2 * illumFrac - 1;
  const rx = (Math.abs(cosI) * R).toFixed(2);
  // Limb: top (0,-R) to bottom (0,R) through the right side (sweep=1).
  // Terminator back to top: through the left (sweep=1) when gibbous,
  // through the right (sweep=0) when crescent.
  const sweepT = cosI > 0 ? 1 : 0;
  const d = `M0 ${-R} A${R} ${R} 0 0 1 0 ${R} A${rx} ${R} 0 0 ${sweepT} 0 ${-R}Z`;
  const flip = waxing ? '' : ' transform="scale(-1 1)"';
  const dark = opts.dark ?? '#2a2f4a';
  const lit = opts.lit ?? '#f4f1e4';
  return `<svg class="moon-icon" width="${size}" height="${size}" viewBox="-12 -12 24 24" aria-hidden="true">`
    + `<circle r="${R}" fill="${dark}"/>`
    + (illumFrac > 0.005 ? `<path d="${d}" fill="${lit}"${flip}/>` : '')
    + `<circle r="${R}" fill="none" stroke="rgba(160,170,210,.55)" stroke-width="0.8"/>`
    + `</svg>`;
}

// Illuminated fraction for a given synodic angle (distant-Sun approximation).
export function illumForSynodic(synDeg) {
  return (1 - Math.cos(synDeg * Math.PI / 180)) / 2;
}

// Representative synodic angle of each named phase.
export const PHASE_SYNODIC = {
  new: 0, waxingCrescent: 45, firstQuarter: 90, waxingGibbous: 135,
  full: 180, waningGibbous: 225, lastQuarter: 270, waningCrescent: 315,
};

export function phaseIconSVG(key, size) {
  const syn = PHASE_SYNODIC[key];
  return moonIconSVG(illumForSynodic(syn), syn < 180, size);
}

// Pre-rendered lunar surface (maria + craters) used by the Earth view.
const MARIA = [
  // [x, y, rx, ry, rotation] in units of R (x to the right, y down)
  [-0.30, -0.38, 0.30, 0.20, 0.3],   // Imbrium
  [-0.02, -0.30, 0.20, 0.16, 0.0],   // Serenitatis
  [0.22, -0.10, 0.22, 0.20, 0.2],    // Tranquillitatis
  [0.48, -0.24, 0.13, 0.11, 0.0],    // Crisium
  [0.38, 0.22, 0.16, 0.13, -0.3],    // Fecunditatis
  [0.18, 0.30, 0.14, 0.12, 0.0],     // Nectaris
  [-0.55, 0.0, 0.26, 0.42, 0.1],     // Procellarum
  [-0.28, 0.36, 0.20, 0.14, 0.0],    // Nubium
  [-0.06, -0.02, 0.10, 0.10, 0.0],   // Vaporum
];
const CRATERS = [
  [-0.18, 0.66, 0.07],   // Tycho
  [-0.36, -0.06, 0.05],  // Copernicus
  [-0.70, -0.08, 0.035], // Kepler
  [-0.55, -0.48, 0.04],
  [0.40, 0.58, 0.05],
  [0.05, 0.55, 0.045],
  [0.62, 0.40, 0.03],
  [-0.05, -0.70, 0.04],
  [0.30, -0.58, 0.035],
];

const textureCache = new Map();

export function moonTexture(R) {
  const key = Math.round(R);
  if (textureCache.has(key)) return textureCache.get(key);
  const size = Math.ceil(2 * R) + 2;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const cx = size / 2, cy = size / 2;

  const base = g.createRadialGradient(cx - R * 0.25, cy - R * 0.25, R * 0.1, cx, cy, R);
  base.addColorStop(0, '#fbf8ec');
  base.addColorStop(1, '#d9d4c4');
  g.fillStyle = base;
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();

  g.save();
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
  g.filter = `blur(${Math.max(0.8, R * 0.018)}px)`;
  g.fillStyle = 'rgba(120, 118, 112, 0.32)';
  for (const [x, y, rx, ry, rot] of MARIA) {
    g.beginPath();
    g.ellipse(cx + x * R, cy + y * R, rx * R, ry * R, rot, 0, Math.PI * 2);
    g.fill();
  }
  g.filter = 'none';
  for (const [x, y, r] of CRATERS) {
    g.fillStyle = 'rgba(90, 88, 84, 0.25)';
    g.beginPath(); g.arc(cx + x * R, cy + y * R, r * R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255, 255, 250, 0.35)';
    g.lineWidth = Math.max(0.6, r * R * 0.25);
    g.beginPath(); g.arc(cx + x * R + r * R * 0.15, cy + y * R + r * R * 0.15, r * R, Math.PI, Math.PI * 1.6); g.stroke();
  }
  // Limb darkening
  const ld = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
  ld.addColorStop(0, 'rgba(0,0,0,0)');
  ld.addColorStop(1, 'rgba(40,36,30,0.28)');
  g.fillStyle = ld;
  g.fillRect(0, 0, size, size);
  g.restore();

  textureCache.set(key, c);
  return c;
}

// Draw a textured moon with the right phase. `earthshine` keeps the night
// side faintly visible.
export function drawTexturedMoon(ctx, cx, cy, R, illumFrac, waxing, opts = {}) {
  const tex = moonTexture(R);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(tex, cx - tex.width / 2, cy - tex.height / 2);

  // Night side: cover everything except the lit region, softly.
  ctx.filter = `blur(${Math.max(0.8, R * 0.012)}px)`;
  ctx.fillStyle = opts.nightColor ?? 'rgba(14, 18, 36, 0.9)';
  ctx.beginPath();
  ctx.rect(cx - R - 4, cy - R - 4, 2 * R + 8, 2 * R + 8);
  if (illumFrac > 0.002) {
    const tmp = new Path2D();
    // Build the lit path into a Path2D using the same geometry.
    const cosI = 2 * illumFrac - 1;
    const rx = Math.max(Math.abs(cosI) * R, 0.01);
    const s = waxing ? 1 : -1;
    const gibbous = cosI > 0;
    tmp.arc(cx, cy, R + 1, -Math.PI / 2, Math.PI / 2, s < 0);
    tmp.ellipse(cx, cy, rx, R + 1, 0, Math.PI / 2, -Math.PI / 2, s > 0 ? !gibbous : gibbous);
    tmp.closePath();
    const outer = new Path2D();
    outer.rect(cx - R - 4, cy - R - 4, 2 * R + 8, 2 * R + 8);
    outer.addPath(tmp);
    ctx.fill(outer, 'evenodd');
  } else {
    ctx.fill();
  }
  ctx.filter = 'none';
  ctx.restore();
}
