// Orbital simulation, moon phase, and eclipse detection.
// Scales are pedagogical (not to real scale). Angular sizes and distances
// are used only where they matter for eclipse judgement.

export const SIDEREAL_MONTH = 27.32166;   // days
export const SYNODIC_MONTH  = 29.53059;   // days
export const TROPICAL_YEAR  = 365.2422;   // days
export const ANOMALISTIC_MONTH = 27.55455; // days (for moon-distance variation)
export const NODE_REGRESSION_YEARS = 18.6;
export const MOON_INCLINATION_DEG = 5.14;

// Angular radii in degrees (approximate, constant for the Sun).
export const SUN_ANG_RAD_DEG = 0.266;         // ~16'
export const MOON_ANG_RAD_DEG_BASE = 0.259;   // mean; varied by anomaly
export const MOON_ANG_RAD_ECC = 0.055;        // fractional variation

// Earth shadow at moon distance (approximate, constant in our model).
export const UMBRA_RAD_DEG    = 0.75;
export const PENUMBRA_RAD_DEG = 1.27;

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const PHASE_BOUNDS = [
  { maxDeg: 22.5,  key: 'new' },
  { maxDeg: 67.5,  key: 'waxingCrescent' },
  { maxDeg: 112.5, key: 'firstQuarter' },
  { maxDeg: 157.5, key: 'waxingGibbous' },
  { maxDeg: 202.5, key: 'full' },
  { maxDeg: 247.5, key: 'waningGibbous' },
  { maxDeg: 292.5, key: 'lastQuarter' },
  { maxDeg: 337.5, key: 'waningCrescent' },
  { maxDeg: 360.1, key: 'new' },
];

export function normalizeDeg(d) {
  const r = d % 360;
  return r < 0 ? r + 360 : r;
}

export function phaseKeyFromAngle(synodicDeg) {
  const a = normalizeDeg(synodicDeg);
  for (const b of PHASE_BOUNDS) if (a < b.maxDeg) return b.key;
  return 'new';
}

// Compute the full simulation state for a given day t and options.
export function computeState(day, opts = {}) {
  const tiltEnabled = opts.tilt !== false;
  const inclDeg = tiltEnabled ? MOON_INCLINATION_DEG : 0;
  const incl = inclDeg * DEG;

  // Earth heliocentric longitude
  const Le = (2 * Math.PI * day) / TROPICAL_YEAR;
  // Earth position (unit = 1 AU-ish, purely visual)
  const earth = { x: Math.cos(Le), y: Math.sin(Le), z: 0 };

  // Moon around Earth: argument of latitude from ascending node
  const u = (2 * Math.PI * day) / SIDEREAL_MONTH;
  // Lunar node longitude, regresses westward over 18.6 years
  const node = -(2 * Math.PI * day) / (NODE_REGRESSION_YEARS * TROPICAL_YEAR);

  // Moon position relative to Earth in ecliptic frame
  // Start in orbital plane (cos u, sin u, 0), rotate by inclination around
  // the node line (ecliptic x'), then rotate to place the node at angle `node`.
  const cosU = Math.cos(u), sinU = Math.sin(u);
  const cosI = Math.cos(incl), sinI = Math.sin(incl);
  const cosN = Math.cos(node), sinN = Math.sin(node);
  // In orbit frame before node rotation:
  const xOrb = cosU;
  const yOrb = sinU * cosI;
  const zOrb = sinU * sinI;
  // Rotate by node around z
  const mxRel = cosN * xOrb - sinN * yOrb;
  const myRel = sinN * xOrb + cosN * yOrb;
  const mzRel = zOrb;

  // Moon display distance (visual unit scaled to earth orbit by moonScale in view).
  // For phase math only direction matters, but we also want a visual length here.
  const moonRelUnit = { x: mxRel, y: myRel, z: mzRel };

  // Vectors from Earth
  const sunFromEarth = { x: -earth.x, y: -earth.y, z: 0 };
  const moonFromEarth = moonRelUnit;

  // Synodic ecliptic-longitude difference (projection onto ecliptic plane)
  const lambdaSun  = Math.atan2(sunFromEarth.y, sunFromEarth.x);
  const lambdaMoon = Math.atan2(moonFromEarth.y, moonFromEarth.x);
  const synodic = normalizeDeg(((lambdaMoon - lambdaSun) * RAD));
  // Ecliptic latitude of moon as seen from Earth
  const moonLatDeg = Math.atan2(moonFromEarth.z,
    Math.hypot(moonFromEarth.x, moonFromEarth.y)) * RAD;

  // Elongation (3D angle between sun and moon directions at Earth)
  const dotSM = dot(sunFromEarth, moonFromEarth);
  const magS  = Math.hypot(sunFromEarth.x, sunFromEarth.y, sunFromEarth.z);
  const magM  = Math.hypot(moonFromEarth.x, moonFromEarth.y, moonFromEarth.z);
  const elongRad = Math.acos(clamp(dotSM / (magS * magM), -1, 1));
  const elongDeg = elongRad * RAD;

  // Phase angle i at the Moon (Sun-Moon-Earth). k = (1+cos i)/2.
  // Relation: i ≈ π - elongation (for distant sun); use that.
  const phaseAngle = Math.PI - elongRad;
  const illumFrac  = (1 + Math.cos(phaseAngle)) / 2;
  // Waxing if synodic ∈ (0, 180), waning if (180, 360)
  const waxing = synodic < 180;

  // Moon age in synodic days
  const moonAge = (synodic / 360) * SYNODIC_MONTH;
  const phaseKey = phaseKeyFromAngle(synodic);

  // Angular radii for eclipse detection
  const mAnom = (2 * Math.PI * day) / ANOMALISTIC_MONTH;
  const moonAngRadDeg = MOON_ANG_RAD_DEG_BASE * (1 + MOON_ANG_RAD_ECC * Math.cos(mAnom));

  const eclipse = detectEclipse({
    synodic, moonLatDeg, elongDeg,
    moonAngRadDeg,
    sunAngRadDeg: SUN_ANG_RAD_DEG,
    umbraDeg: UMBRA_RAD_DEG,
    penumbraDeg: PENUMBRA_RAD_DEG,
  });

  return {
    day,
    earth,
    moonRel: moonRelUnit,
    sunFromEarth, moonFromEarth,
    synodic,
    moonLatDeg,
    elongDeg,
    phaseAngle,
    illumFrac,
    waxing,
    moonAge,
    phaseKey,
    moonAngRadDeg,
    nodeLongitude: node,
    inclinationDeg: inclDeg,
    eclipse,
  };
}

function detectEclipse({ synodic, moonLatDeg, elongDeg, moonAngRadDeg,
                         sunAngRadDeg, umbraDeg, penumbraDeg }) {
  // Near new moon: possible solar eclipse.
  const nearNew  = Math.min(synodic, 360 - synodic) < 18; // ±18° syn
  const nearFull = Math.abs(synodic - 180) < 18;

  // Solar eclipse: sun and moon must be within r_sun + r_moon of each other
  // seen from Earth. Approx separation = elongation (moon near sun).
  if (nearNew) {
    const sep = elongDeg;
    const sum = sunAngRadDeg + moonAngRadDeg;
    if (sep <= sum) {
      let type = 'partial';
      if (sep + sunAngRadDeg <= moonAngRadDeg) type = 'total';
      else if (sep + moonAngRadDeg <= sunAngRadDeg) type = 'annular';
      return { kind: 'solar', type, separationDeg: sep,
               moonLatDeg, possible: true };
    }
    return { kind: 'none', near: 'new', separationDeg: sep,
             moonLatDeg, possible: false };
  }

  // Lunar eclipse: moon enters Earth's shadow cone opposite the sun.
  if (nearFull) {
    // Separation = angle between moon and the anti-sun direction.
    const sep = 180 - elongDeg;
    if (sep + moonAngRadDeg <= umbraDeg) {
      return { kind: 'lunar', type: 'total',
               separationDeg: sep, moonLatDeg, possible: true };
    }
    if (sep <= umbraDeg + moonAngRadDeg) {
      return { kind: 'lunar', type: 'partial',
               separationDeg: sep, moonLatDeg, possible: true };
    }
    if (sep <= penumbraDeg + moonAngRadDeg) {
      return { kind: 'lunar', type: 'penumbral',
               separationDeg: sep, moonLatDeg, possible: true };
    }
    return { kind: 'none', near: 'full', separationDeg: sep,
             moonLatDeg, possible: false };
  }

  return { kind: 'none', near: null, possible: false, moonLatDeg };
}

function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// Given the current day, find the nearest day in the future whose state
// matches the predicate. Used for "jump to nearest solar/lunar eclipse".
export function findNext(day, opts, predicate, maxDays = 400, stepDays = 0.1) {
  let t = day;
  const limit = day + maxDays;
  while (t < limit) {
    if (predicate(computeState(t, opts))) return t;
    t += stepDays;
  }
  return null;
}
