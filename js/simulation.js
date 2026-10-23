// Sun / Moon positions, moon phase and eclipse detection.
//
// Time is measured in days since J2000.0 (2000-01-01 12:00 UT). Positions
// come from the low-precision series in J. Meeus, "Astronomical Algorithms"
// (ch. 25 and 47, main terms only). The Moon is good to roughly 0.05°, which
// is enough to reproduce the dates and types of real eclipses — but this is
// a teaching tool, not a predictor.

export const SYNODIC_MONTH  = 29.530589;  // days, new moon → new moon
export const SIDEREAL_MONTH = 27.321662;  // days, relative to the stars
export const DRACONIC_MONTH = 27.212221;  // days, node → node
export const TROPICAL_YEAR  = 365.24219;  // days
export const MOON_INCLINATION_DEG = 5.14;

export const J2000_MS = Date.UTC(2000, 0, 1, 12);
const MS_PER_DAY = 86400000;

const EARTH_RADIUS_KM = 6378.14;
const MOON_RADIUS_KM  = 1737.4;
const SUN_RADIUS_KM   = 696000;
const AU_KM           = 149597870.7;

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export function dateToDay(date) { return (date.getTime() - J2000_MS) / MS_PER_DAY; }
export function dayToDate(day)  { return new Date(J2000_MS + day * MS_PER_DAY); }

export function normalizeDeg(d) {
  const r = d % 360;
  return r < 0 ? r + 360 : r;
}
export function wrap180(d) {
  const r = normalizeDeg(d);
  return r > 180 ? r - 360 : r;
}
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// Periodic terms of the Moon's longitude / distance:
// [D, M, M', F, Σl (1e-6 °), Σr (1e-3 km)]
const MOON_LR_TERMS = [
  [0, 0, 1, 0, 6288774, -20905355],
  [2, 0, -1, 0, 1274027, -3699111],
  [2, 0, 0, 0, 658314, -2955968],
  [0, 0, 2, 0, 213618, -569925],
  [0, 1, 0, 0, -185116, 48888],
  [0, 0, 0, 2, -114332, -3149],
  [2, 0, -2, 0, 58793, 246158],
  [2, -1, -1, 0, 57066, -152138],
  [2, 0, 1, 0, 53322, -170733],
  [2, -1, 0, 0, 45758, -204586],
  [0, 1, -1, 0, -40923, -129620],
  [1, 0, 0, 0, -34720, 108743],
  [0, 1, 1, 0, -30383, 104755],
  [2, 0, 0, -2, 15327, 10321],
  [0, 0, 1, 2, -12528, 0],
  [0, 0, 1, -2, 10980, 79661],
  [4, 0, -1, 0, 10675, -34782],
  [0, 0, 3, 0, 10034, -23210],
  [4, 0, -2, 0, 8548, -21636],
  [2, 1, -1, 0, -7888, 24208],
  [2, 1, 0, 0, -6766, 30824],
  [1, 0, -1, 0, -5163, -8379],
  [1, 1, 0, 0, 4987, -16675],
  [2, -1, 1, 0, 4036, -12831],
  [2, 0, 2, 0, 3994, -10445],
  [4, 0, 0, 0, 3861, -11650],
  [2, 0, -3, 0, 3665, 14403],
  [0, 1, -2, 0, -2689, -7003],
];

// Periodic terms of the Moon's latitude: [D, M, M', F, Σb (1e-6 °)]
const MOON_B_TERMS = [
  [0, 0, 0, 1, 5128122],
  [0, 0, 1, 1, 280602],
  [0, 0, 1, -1, 277693],
  [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413],
  [2, 0, -1, -1, 46271],
  [2, 0, 0, 1, 32573],
  [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266],
  [0, 0, 2, -1, 8822],
  [2, -1, 0, -1, 8216],
  [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200],
  [2, 1, 0, -1, -3359],
];

// Raw ephemeris: ecliptic longitudes/latitude in degrees, distances.
export function ephemeris(day) {
  const T = day / 36525;

  // Sun (geometric, mean equinox of date)
  const L0 = 280.46646 + 36000.76983 * T;
  const Ms = 357.52911 + 35999.05029 * T;
  const MsR = Ms * DEG;
  const C = (1.914602 - 0.004817 * T) * Math.sin(MsR)
          + 0.019993 * Math.sin(2 * MsR)
          + 0.000289 * Math.sin(3 * MsR);
  const sunLon = normalizeDeg(L0 + C);
  const ecc = 0.016708634;
  const nu = (Ms + C) * DEG;
  const sunDistAU = 1.000001018 * (1 - ecc * ecc) / (1 + ecc * Math.cos(nu));

  // Moon
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D  = (297.8501921 + 445267.1114034 * T) * DEG;
  const M  = (357.5291092 + 35999.0502909 * T) * DEG;
  const Mp = (134.9633964 + 477198.8675055 * T) * DEG;
  const F  = (93.2720950 + 483202.0175233 * T) * DEG;
  const E  = 1 - 0.002516 * T;
  const A1 = (119.75 + 131.849 * T) * DEG;
  const A2 = (53.09 + 479264.290 * T) * DEG;
  const LpR = Lp * DEG;

  let sl = 0, sr = 0, sb = 0;
  for (const [d, m, mp, f, l, r] of MOON_LR_TERMS) {
    const arg = d * D + m * M + mp * Mp + f * F;
    const e = m === 0 ? 1 : (Math.abs(m) === 1 ? E : E * E);
    sl += l * e * Math.sin(arg);
    sr += r * e * Math.cos(arg);
  }
  for (const [d, m, mp, f, b] of MOON_B_TERMS) {
    const e = m === 0 ? 1 : E;
    sb += b * e * Math.sin(d * D + m * M + mp * Mp + f * F);
  }
  sl += 3958 * Math.sin(A1) + 1962 * Math.sin(LpR - F) + 318 * Math.sin(A2);
  sb += -2235 * Math.sin(LpR) + 175 * Math.sin(A1 - F) + 175 * Math.sin(A1 + F)
      + 127 * Math.sin(LpR - Mp) - 115 * Math.sin(LpR + Mp);

  return {
    sunLon,
    sunDistAU,
    moonLon: normalizeDeg(Lp + sl / 1e6),
    moonLat: sb / 1e6,
    moonDistKm: 385000.56 + sr / 1000,
    // Mean longitude of the ascending node (regresses once per 18.6 years)
    nodeLon: normalizeDeg(125.0445479 - 1934.1362891 * T),
  };
}

// Moon–Sun ecliptic longitude difference: 0 = new, 90 = first quarter, ...
export function synodicAt(day) {
  const e = ephemeris(day);
  return synodicOf(e);
}

// Synodic angle in [0, 360). Values a hair below 360 (as left by the
// new-moon search) are snapped to 0 so a new moon reads as age 0, not 29.5.
function synodicOf(e) {
  const s = normalizeDeg(e.moonLon - e.sunLon);
  return s > 360 - 1e-6 ? 0 : s;
}

// Time of the last new moon at or before `day`.
export function newMoonBefore(day) {
  let t = day - (synodicAt(day) / 360) * SYNODIC_MONTH;
  for (let i = 0; i < 6; i++) t -= (wrap180(synodicAt(t)) / 360) * SYNODIC_MONTH;
  return t > day + 1e-4 ? newMoonBefore(t - 1) : Math.min(t, day);
}

// Nearest time (strictly after for dir=+1, before for dir=-1) at which the
// synodic angle equals `targetDeg`.
export function findSynodic(day, targetDeg, dir = 1) {
  const s = synodicAt(day);
  let delta = dir > 0 ? normalizeDeg(targetDeg - s) : -normalizeDeg(s - targetDeg);
  if (Math.abs(delta) < 0.05) delta += dir * 360;
  let t = day + (delta / 360) * SYNODIC_MONTH;
  for (let i = 0; i < 8; i++) t -= (wrap180(synodicAt(t) - targetDeg) / 360) * SYNODIC_MONTH;
  return t;
}

// Day on which the synodic angle equals `targetDeg` inside the lunation that
// starts at `lunationStart` (a new moon).
export function dayForSynodicInLunation(lunationStart, targetDeg) {
  let t = lunationStart + (normalizeDeg(targetDeg) / 360) * SYNODIC_MONTH;
  for (let i = 0; i < 8; i++) {
    const diff = normalizeDeg(synodicAt(t)) - normalizeDeg(targetDeg);
    t -= (wrap180(diff) / 360) * SYNODIC_MONTH;
  }
  return t;
}

// Angular sizes (degrees) that drive the eclipse geometry.
function radii(e) {
  const sunKm = e.sunDistAU * AU_KM;
  const moonRad = Math.asin(MOON_RADIUS_KM / e.moonDistKm) * RAD;
  const sunRad  = Math.asin(SUN_RADIUS_KM / sunKm) * RAD;
  const moonPar = Math.asin(EARTH_RADIUS_KM / e.moonDistKm) * RAD;
  const sunPar  = Math.asin(EARTH_RADIUS_KM / sunKm) * RAD;
  return {
    moonRad, sunRad, moonPar, sunPar,
    // Earth's shadow at the Moon's distance (with the usual 2 % enlargement
    // for the atmosphere).
    umbra:    1.02 * (moonPar + sunPar - sunRad),
    penumbra: 1.02 * (moonPar + sunPar + sunRad),
  };
}

// Angular distance between a point (dLon, lat) and the origin of the ecliptic.
function angSep(dLonDeg, latDeg) {
  const c = Math.cos(latDeg * DEG) * Math.cos(dLonDeg * DEG);
  return Math.acos(clamp(c, -1, 1)) * RAD;
}

// Limits on the Moon's separation from the Sun / shadow centre.
export function eclipseLimits(r) {
  return {
    solar: r.moonPar - r.sunPar + r.sunRad + r.moonRad,   // seen somewhere on Earth
    solarCentral: r.moonPar - r.sunPar,                   // shadow axis hits Earth
    lunarPenumbral: r.penumbra + r.moonRad,
    lunarPartial: r.umbra + r.moonRad,
    lunarTotal: r.umbra - r.moonRad,
  };
}

function detectEclipse(synodic, lat, r) {
  const lim = eclipseLimits(r);
  const dSun = wrap180(synodic);
  if (Math.abs(dSun) < 90) {
    const sep = angSep(dSun, lat);
    if (sep < lim.solar) {
      let type = 'partial';
      if (sep < lim.solarCentral) {
        // Near the sub-lunar point the Moon is ~1 Earth radius closer.
        const topoMoon = r.moonRad * (1 + Math.sin(r.moonPar * DEG));
        type = topoMoon >= r.sunRad ? 'total' : 'annular';
      }
      return { kind: 'solar', type, possible: true, near: 'new', separationDeg: sep, limitDeg: lim.solar };
    }
    return { kind: 'none', possible: false, near: 'new', separationDeg: sep, limitDeg: lim.solar };
  }
  const dAnti = wrap180(synodic - 180);
  const sep = angSep(dAnti, lat);
  let type = null;
  if (sep < lim.lunarTotal) type = 'total';
  else if (sep < lim.lunarPartial) type = 'partial';
  else if (sep < lim.lunarPenumbral) type = 'penumbral';
  if (type) {
    return { kind: 'lunar', type, possible: true, near: 'full', separationDeg: sep, limitDeg: lim.lunarPenumbral };
  }
  return { kind: 'none', possible: false, near: 'full', separationDeg: sep, limitDeg: lim.lunarPenumbral };
}

const PHASE_KEYS = [
  'new', 'waxingCrescent', 'firstQuarter', 'waxingGibbous',
  'full', 'waningGibbous', 'lastQuarter', 'waningCrescent',
];

export function phaseKeyFromAngle(synodicDeg) {
  return PHASE_KEYS[Math.floor(normalizeDeg(synodicDeg + 22.5) / 45) % 8];
}

// Full simulation state for a given day.
export function computeState(day, opts = {}) {
  const tilt = opts.tilt !== false;
  const e = ephemeris(day);
  const moonLat = tilt ? e.moonLat : 0;
  const synodic = synodicOf(e);

  const elongDeg = angSep(synodic, moonLat);
  const R = e.sunDistAU * AU_KM;
  const E = elongDeg * DEG;
  // Phase angle i (Sun–Moon–Earth) and illuminated fraction k = (1 + cos i) / 2
  const phaseAngle = Math.atan2(R * Math.sin(E), e.moonDistKm - R * Math.cos(E));
  const illumFrac = (1 + Math.cos(phaseAngle)) / 2;

  const r = radii(e);
  const eclipse = detectEclipse(synodic, moonLat, r);

  return {
    day,
    sunLon: e.sunLon,
    moonLon: e.moonLon,
    nodeLon: e.nodeLon,
    moonLatDeg: moonLat,
    moonDistKm: e.moonDistKm,
    sunDistAU: e.sunDistAU,
    synodic,
    elongDeg,
    phaseAngle,
    illumFrac,
    waxing: synodic < 180,
    moonAge: day - newMoonBefore(day),
    phaseKey: phaseKeyFromAngle(synodic),
    // Local mean solar time at which the Moon crosses the meridian (hours).
    transitHour: normalizeDeg(180 + synodic) / 15,
    tilt,
    inclinationDeg: tilt ? MOON_INCLINATION_DEG : 0,
    radii: r,
    limits: eclipseLimits(r),
    eclipse,
  };
}

// The Sun is "in an eclipse season" while it is within ~17° of a lunar node.
export function inEclipseSeason(sunLon, nodeLon, limitDeg = 17) {
  const d = Math.abs(wrap180(sunLon - nodeLon));
  return Math.min(d, 180 - d) < limitDeg;
}

// Time of greatest eclipse (minimum separation) around a syzygy.
function greatest(t0, targetDeg, tilt) {
  const sep = t => {
    const e = ephemeris(t);
    const lat = tilt ? e.moonLat : 0;
    return angSep(wrap180(e.moonLon - e.sunLon - targetDeg), lat);
  };
  let a = t0 - 0.3, b = t0 + 0.3;
  const g = (Math.sqrt(5) - 1) / 2;
  let c = b - g * (b - a), d = a + g * (b - a);
  let fc = sep(c), fd = sep(d);
  for (let i = 0; i < 40; i++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = sep(c); }
    else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = sep(d); }
  }
  return (a + b) / 2;
}

// Successive syzygies (new or full moons) from `day` in direction `dir`.
function* syzygies(day, dir) {
  let t = day;
  for (;;) {
    const tn = findSynodic(t, 0, dir);
    const tf = findSynodic(t, 180, dir);
    const pickNew = dir > 0 ? tn < tf : tn > tf;
    const ts = pickNew ? tn : tf;
    yield { day: ts, target: pickNew ? 0 : 180 };
    t = ts + dir * 0.5;
  }
}

function eclipseAtSyzygy(sz, tilt) {
  const tg = greatest(sz.day, sz.target, tilt);
  const s = computeState(tg, { tilt });
  return s.eclipse.possible ? { day: tg, kind: s.eclipse.kind, type: s.eclipse.type } : null;
}

// Next (dir=+1) or previous (dir=-1) eclipse of `kind` ('solar' | 'lunar' | 'any').
export function findEclipse(day, dir, kind = 'any', opts = {}) {
  const tilt = opts.tilt !== false;
  let n = 0;
  for (const sz of syzygies(day - dir * 0.6, dir)) {
    if (++n > 80) return null;
    if (kind === 'solar' && sz.target !== 0) continue;
    if (kind === 'lunar' && sz.target !== 180) continue;
    const ec = eclipseAtSyzygy(sz, tilt);
    if (ec && (dir > 0 ? ec.day > day + 0.01 : ec.day < day - 0.01)) return ec;
  }
  return null;
}

// All eclipses between two days.
export function listEclipses(startDay, endDay, opts = {}) {
  const tilt = opts.tilt !== false;
  const out = [];
  for (const sz of syzygies(startDay - 0.6, 1)) {
    if (sz.day > endDay + 0.6) break;
    const ec = eclipseAtSyzygy(sz, tilt);
    if (ec && ec.day >= startDay && ec.day < endDay) out.push(ec);
  }
  return out;
}

// All new and full moons between two days.
export function listSyzygies(startDay, endDay) {
  const out = [];
  for (const sz of syzygies(startDay - 0.01, 1)) {
    if (sz.day >= endDay) break;
    out.push({ day: sz.day, kind: sz.target === 0 ? 'new' : 'full' });
  }
  return out;
}
