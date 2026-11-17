// ---------------------------------------------------------------------------
// Planetary ephemeris — low-precision series from Meeus, "Astronomical
// Algorithms" ch. 25 (Sun), ch. 47 (Moon), ch. 33 (planets).
// Accurate to ~1' for 1800-2050 for planets, ~20" for the Moon.
// Positions are GEOCENTRIC ECLIPTIC LONGITUDES, tropical, degrees.
// ---------------------------------------------------------------------------

const D2R = Math.PI / 180;
const norm = (x) => ((x % 360) + 360) % 360;

/** Sun's apparent geocentric longitude (tropical, degrees). */
export function sunPosition(jd) {
  const t = (jd - 2451545.0) / 36525;
  const l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  const m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const mr = m * D2R;
  const c =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(mr) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * mr) +
    0.000289 * Math.sin(3 * mr);
  const trueLon = l0 + c;
  const omega = 125.04452 - 1934.136261 * t;
  const nutation = -0.00478 * Math.sin(omega * D2R) - 0.0003 * Math.sin(2 * (280.4665 + 36000.7698 * t) * D2R);
  const aberration = -0.00569 - 0.00478 * Math.sin(omega * D2R);
  return norm(trueLon + nutation + aberration);
}

/**
 * Moon's geocentric longitude (tropical, degrees).
 * Meeus ch. 47 truncated to the largest terms (~20" accuracy).
 */
export function moonPosition(jd) {
  const t = (jd - 2451545.0) / 36525;
  const t2 = t * t, t3 = t2 * t, t4 = t3 * t;

  // Mean elements (Meeus 47.1-47.5)
  const lp = 218.3164477 + 481267.88123421 * t - 0.0015786 * t2 + t3 / 538841 - t4 / 65194000; // mean longitude
  const D  = 297.8501921 + 445267.1114034 * t - 0.0018819 * t2 + t3 / 545868 - t4 / 113065000;  // mean elongation
  const M  = 357.5291092 + 35999.0502909 * t - 0.0001536 * t2 + t3 / 24490000;                   // sun anomaly
  const Mp = 134.9633964 + 477198.8675055 * t + 0.0087414 * t2 + t3 / 69699 - t4 / 14712000;    // moon anomaly
  const F  = 93.2720950 + 483202.0175233 * t - 0.0036539 * t2 - t3 / 3526000 + t4 / 863310000;  // argument of latitude

  // Longitude terms: [coefficient (1e-6 deg), D, M, Mp, F]
  const TERMS = [
    [6288774, 0, 0, 1, 0],
    [1274027, 2, 0, -1, 0],
    [658314, 2, 0, 0, 0],
    [213618, 0, 0, 2, 0],
    [-185116, 0, 1, 0, 0],
    [-114332, 0, 0, 0, 2],
    [58793, 2, 0, -2, 0],
    [57066, 2, -1, -1, 0],
    [53322, 2, 0, 1, 0],
    [45758, 2, -1, 0, 0],
    [-40923, 0, 1, -1, 0],
    [-34720, 1, 0, 0, 0],
    [-30383, 0, 1, 1, 0],
    [15327, 2, 0, 0, -2],
    [-12528, 0, 0, 1, 2],
    [10980, 0, 0, 1, -2],
    [10675, 4, 0, -1, 0],
    [10034, 0, 0, 3, 0],
    [8548, 4, 0, -2, 0],
    [-7888, 2, 1, -1, 0],
    [-6766, 2, 1, 0, 0],
    [-5163, 1, 0, -1, 0],
    [4987, 1, 1, 0, 0],
    [4036, 2, -1, -2, 0],
    [3994, 2, 0, 2, 0],
    [3861, 4, 0, 0, 0],
    [3665, 2, 0, -3, 0],
    [-2689, 0, 1, -2, 0],
    [-2602, 2, 0, -1, 2],
    [2390, 2, -1, -1, 2],
    [-2348, 1, 0, 1, 0],
    [2236, 2, -2, 0, 0],
    [-2120, 0, 1, 2, 0],
    [-2069, 0, 2, 0, 0],
    [2048, 2, -2, -1, 0],
    [-1773, 0, 1, -1, 2],
    [-1595, 2, 0, 1, -2],
    [1215, 4, -1, -1, 0],
    [-1110, 0, 0, 2, 2],
    [-892, 3, 0, -1, 0],
    [-810, 2, 1, 1, 0],
    [759, 4, -1, -2, 0],
    [-713, 0, 2, -1, 0],
    [-700, 2, 2, -1, 0],
    [691, 2, 1, -2, 0],
    [596, 2, -1, 0, -2],
    [549, 4, 0, 1, 0],
    [537, 0, 0, 4, 0],
    [520, 4, -1, 0, 0],
    [-487, 1, 0, -2, 0],
    [-399, 2, 1, 0, -2],
    [-381, 0, 0, 2, -2],
    [351, 1, 1, 1, 0],
    [-340, 3, 0, -2, 0],
    [330, 4, 0, -3, 0],
    [327, 2, -1, 2, 0],
    [-323, 0, 2, 1, 0],
    [299, 1, 1, -1, 0],
    [294, 2, 0, 3, 0],
    [0, 0, 0, 0, 0],
  ];

  let sum = 0;
  for (const [coeff, d, m, mp, f] of TERMS) {
    if (coeff === 0) continue;
    sum += coeff * Math.sin((d * D + m * M + mp * Mp + f * F) * D2R);
  }
  const lon = lp + sum / 1e6;

  // Additive nutation in longitude
  const omega = 125.04452 - 1934.136261 * t;
  const nutation = -0.00478 * Math.sin(omega * D2R) - 0.0003 * Math.sin(2 * (280.4665 + 36000.7698 * t) * D2R);

  return norm(lon + nutation);
}

// --- Planets -------------------------------------------------------------
// Low-precision heliocentric orbital elements (Meeus ch. 33, table 33.A)
// [a, e, I, L, longPeri, longNode] and their per-century rates.
const PLANET_ELEMENTS = {
  Mercury: [
    [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593],
    [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
  ],
  Venus: [
    [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255],
    [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418],
  ],
  Earth: [
    [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0],
    [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0],
  ],
  Mars: [
    [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
    [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
  ],
  Jupiter: [
    [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847981, 100.47390909],
    [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
  ],
  Saturn: [
    [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
    [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
  ],
  Uranus: [
    [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503],
    [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
  ],
  Neptune: [
    [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
    [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664],
  ],
};

function heliocentricXYZ(name, jd) {
  const t = (jd - 2451545.0) / 36525;
  const [[a0, e0, I0, L0, w0, O0], [ad, ed, Id, Ld, wd, Od]] = PLANET_ELEMENTS[name];
  const a = a0 + ad * t;
  const e = e0 + ed * t;
  const I = (I0 + Id * t) * D2R;
  const L = L0 + Ld * t;
  const w = w0 + wd * t;   // longitude of perihelion
  const O = O0 + Od * t;   // longitude of ascending node

  const argPeri = (w - O) * D2R;      // argument of perihelion
  const M = ((L - w) % 360 + 360) % 360; // mean anomaly

  // Kepler's equation by Newton iteration
  let E = M * D2R;
  for (let i = 0; i < 12; i++) {
    const dE = (E - e * Math.sin(E) - M * D2R) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }

  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Rotate into ecliptic frame
  const cO = Math.cos(O * D2R), sO = Math.sin(O * D2R);
  const cw = Math.cos(argPeri), sw = Math.sin(argPeri);
  const cI = Math.cos(I), sI = Math.sin(I);

  const x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
  const y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
  const z = (sw * sI) * xp + (cw * sI) * yp;
  return [x, y, z];
}

/** Geocentric ecliptic longitude of a planet (tropical, degrees). */
export function planetPosition(name, jd) {
  const [x, y] = heliocentricXYZ(name, jd);
  const [ex, ey] = heliocentricXYZ('Earth', jd);
  const j2000Lon = Math.atan2(y - ey, x - ex) * (180 / Math.PI);
  // [web fix] The orbital elements above are referred to the J2000 equinox.
  // Shift to the equinox of date (general precession in longitude, IAU 1976)
  // plus the main nutation term, so the result matches Sun/Moon (which are
  // already "of date") before the Lahiri ayanamsa is subtracted.
  const t = (jd - 2451545.0) / 36525;
  const precession = (5029.0966 * t + 1.11113 * t * t) / 3600;
  const nutation = -0.00478 * Math.sin((125.04452 - 1934.136261 * t) * D2R);
  return norm(j2000Lon + precession + nutation);
}

// --- Lunar nodes ---------------------------------------------------------
/** True north node (Rahu) longitude, tropical degrees. Ketu = Rahu + 180. */
export function rahuPosition(jd) {
  const t = (jd - 2451545.0) / 36525;
  const omega =
    125.0445479 - 1934.1362891 * t + 0.0020754 * t * t +
    (t * t * t) / 467441 - (t * t * t * t) / 60616000;
  return norm(omega);
}

export function ketuPosition(jd) {
  return norm(rahuPosition(jd) + 180);
}

/** All classical planet longitudes, tropical degrees. */
export function allPositions(jd) {
  return {
    Sun: sunPosition(jd),
    Moon: moonPosition(jd),
    Mars: planetPosition('Mars', jd),
    Mercury: planetPosition('Mercury', jd),
    Jupiter: planetPosition('Jupiter', jd),
    Venus: planetPosition('Venus', jd),
    Saturn: planetPosition('Saturn', jd),
    Rahu: rahuPosition(jd),
    Ketu: ketuPosition(jd),
  };
}
