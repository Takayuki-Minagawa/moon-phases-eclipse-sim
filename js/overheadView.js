// Canvas 2D overhead (plan view) of Sun, Earth, Moon, orbits and shadow cones.
// Distances in this view are visually exaggerated: the Sun–Earth segment is
// shortened and the Earth–Moon radius is blown up so both are visible.

const ORBIT_R_SUN_EARTH = 230;   // px in base coords
const ORBIT_R_EARTH_MOON = 70;   // px — not to scale, for visibility
const SUN_PX   = 26;
const EARTH_PX = 8;
const MOON_PX  = 4;
const SHADOW_LENGTH_PX = 220;    // behind the earth / behind the moon

const trail = [];                // rolling moon trail
const TRAIL_LEN = 240;

export function drawOverhead(canvas, state, uiOpts) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const theme = uiOpts.theme ?? 'light';

  // Background
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  const bg = ctx.createRadialGradient(w * 0.35, h * 0.3, 20, w * 0.5, h * 0.5, Math.max(w, h));
  bg.addColorStop(0, '#0d1432');
  bg.addColorStop(1, '#04060f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Camera: translate to centre, rotate, zoom
  const zoom = uiOpts.zoom ?? 1;
  const rot  = ((uiOpts.rotateDeg ?? 0) * Math.PI) / 180;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rot);
  ctx.scale(zoom, zoom);
  // Shift so the sun sits left of center to leave room for earth system.
  ctx.translate(-90, 0);

  // Sun orbit of Earth
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, ORBIT_R_SUN_EARTH, 0, Math.PI * 2);
  ctx.stroke();

  // Sun
  const sunGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, SUN_PX);
  sunGrad.addColorStop(0, '#fff6bf');
  sunGrad.addColorStop(1, '#ff9a1f');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(0, 0, SUN_PX, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,200,80,0.16)';
  ctx.beginPath();
  ctx.arc(0, 0, SUN_PX + 10, 0, Math.PI * 2);
  ctx.fill();

  // Earth position in 2D view. Use state.earth angle as longitude.
  const earthAngle = Math.atan2(state.earth.y, state.earth.x);
  const ex = Math.cos(earthAngle) * ORBIT_R_SUN_EARTH;
  const ey = Math.sin(earthAngle) * ORBIT_R_SUN_EARTH;

  // Direction sun→earth (for shadow cone)
  const dirX = ex / ORBIT_R_SUN_EARTH;
  const dirY = ey / ORBIT_R_SUN_EARTH;

  // Earth's umbra cone (behind Earth, away from sun). Simple triangle.
  drawShadowCone(ctx, ex, ey, dirX, dirY, SHADOW_LENGTH_PX, 12, 28,
                 'rgba(12, 18, 40, 0.75)', 'rgba(40, 60, 120, 0.35)');

  // Moon orbit circle around Earth
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(ex, ey, ORBIT_R_EARTH_MOON, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // If inclination > 0, indicate node line (intersection with ecliptic).
  if (state.inclinationDeg > 0) {
    const nx = Math.cos(state.nodeLongitude);
    const ny = Math.sin(state.nodeLongitude);
    ctx.strokeStyle = 'rgba(120, 180, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ex - nx * ORBIT_R_EARTH_MOON * 1.25, ey - ny * ORBIT_R_EARTH_MOON * 1.25);
    ctx.lineTo(ex + nx * ORBIT_R_EARTH_MOON * 1.25, ey + ny * ORBIT_R_EARTH_MOON * 1.25);
    ctx.stroke();
  }

  // Moon position (use ecliptic-plane projection; exaggerate z for lat cue).
  const mDir = state.moonRel;
  const mx = ex + mDir.x * ORBIT_R_EARTH_MOON;
  const my = ey + mDir.y * ORBIT_R_EARTH_MOON;
  // Offset the moon slightly visually to indicate latitude
  const latCueY = mDir.z * ORBIT_R_EARTH_MOON * 6;

  // Moon's own shadow (toward anti-sun): useful in solar eclipse config.
  if (state.eclipse.kind === 'solar') {
    drawShadowCone(ctx, mx, my, dirX, dirY, 160, 5, 14,
                   'rgba(240, 80, 50, 0.65)', 'rgba(255, 150, 80, 0.25)');
  }

  // Rolling trail
  trail.push({ x: mx, y: my + latCueY });
  if (trail.length > TRAIL_LEN) trail.shift();
  ctx.strokeStyle = 'rgba(180,200,255,0.35)';
  ctx.beginPath();
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // Earth
  const earthGrad = ctx.createRadialGradient(ex - 2, ey - 2, 1, ex, ey, EARTH_PX);
  earthGrad.addColorStop(0, '#7dc8ff');
  earthGrad.addColorStop(1, '#1d57a8');
  ctx.fillStyle = earthGrad;
  ctx.beginPath();
  ctx.arc(ex, ey, EARTH_PX, 0, Math.PI * 2);
  ctx.fill();

  // Moon
  ctx.fillStyle = '#d7dce6';
  ctx.beginPath();
  ctx.arc(mx, my + latCueY, MOON_PX, 0, Math.PI * 2);
  ctx.fill();
  // Show the unlit side on the moon dot
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.arc(mx - dirX * MOON_PX * 0.35, my + latCueY - dirY * MOON_PX * 0.35,
          MOON_PX * 0.88, 0, Math.PI * 2);
  ctx.fill();

  // Labels
  ctx.fillStyle = 'rgba(230, 236, 255, 0.85)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Sun', 6 + SUN_PX, 4);
  ctx.fillText('Earth', ex + 10, ey - 8);
  ctx.fillText('Moon', mx + 8, my + latCueY - 6);

  ctx.restore();
}

function drawShadowCone(ctx, x, y, dirX, dirY, length, near, far,
                        umbraColor, penumbraColor) {
  const px = -dirY, py = dirX; // perpendicular
  const tipX = x + dirX * length;
  const tipY = y + dirY * length;

  // Penumbra (wider)
  ctx.fillStyle = penumbraColor;
  ctx.beginPath();
  ctx.moveTo(x + px * far, y + py * far);
  ctx.lineTo(x - px * far, y - py * far);
  ctx.lineTo(tipX - px * (far * 0.3), tipY - py * (far * 0.3));
  ctx.lineTo(tipX + px * (far * 0.3), tipY + py * (far * 0.3));
  ctx.closePath();
  ctx.fill();

  // Umbra (core)
  ctx.fillStyle = umbraColor;
  ctx.beginPath();
  ctx.moveTo(x + px * near, y + py * near);
  ctx.lineTo(x - px * near, y - py * near);
  ctx.lineTo(tipX, tipY);
  ctx.closePath();
  ctx.fill();
}

export function clearTrail() { trail.length = 0; }
