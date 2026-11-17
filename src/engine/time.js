// ---------------------------------------------------------------------------
// Time & coordinate primitives (Meeus, "Astronomical Algorithms", ch. 7-13)
// All angles in degrees unless noted. All times UTC.
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** Julian Day Number from a JS Date (UTC). */
export function julianDay(date) {
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const day =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400 +
    date.getUTCMilliseconds() / 86400000;

  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

/** Centuries since J2000.0 from Julian Day. */
export function centuries(jd) {
  return (jd - 2451545.0) / 36525;
}

/** Normalize an angle to [0, 360). */
export function norm360(x) {
  x = x % 360;
  return x < 0 ? x + 360 : x;
}

/** Normalize an angle to (-180, 180]. */
export function norm180(x) {
  x = norm360(x);
  return x > 180 ? x - 360 : x;
}

/** Mean obliquity of the ecliptic (Laskar 1986), degrees. */
export function obliquity(jd) {
  const t = centuries(jd);
  const seconds =
    21.448 -
    t * (46.815 + t * (0.00059 - t * 0.001813));
  return 23 + (26 + seconds / 60) / 60;
}

/**
 * Greenwich Mean Sidereal Time in degrees.
 * Meeus eq. 22.2 / 22.4 (includes the +0.0003879 T^2 term).
 */
export function gmst(jd) {
  const t = centuries(jd);
  const d = jd - 2451545.0;
  let theta =
    280.46061837 +
    360.98564736629 * d +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  return norm360(theta);
}

/** Local Sidereal Time in degrees for a longitude (east positive). */
export function lst(jd, longitudeEast) {
  return norm360(gmst(jd) + longitudeEast);
}

/**
 * Precession-corrected apparent solar longitude (degrees, tropical).
 * Uses the Sun's geometric longitude + nutation in longitude + aberration.
 */
export function sunLongitude(jd) {
  const t = centuries(jd);
  // Geometric mean longitude referred to the mean equinox of date
  const l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  // Mean anomaly
  const m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const mr = m * DEG;
  // Equation of center
  const c =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(mr) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * mr) +
    0.000289 * Math.sin(3 * mr);
  // True longitude
  const trueLon = l0 + c;
  // Nutation in longitude (simplified, main term)
  const omega = 125.04452 - 1934.136261 * t;
  const nutation =
    -0.00478 * Math.sin(omega * DEG) -
    0.0003 * Math.sin(2 * (280.4665 + 36000.7698 * t) * DEG);
  // Aberration
  const aberration = -0.00569 - 0.00478 * Math.sin(omega * DEG);
  return norm360(trueLon + nutation + aberration);
}

/**
 * Ascendant (Lagna) — the ecliptic point rising in the east.
 * @param {number} jd  Julian Day
 * @param {number} latitude  geographic latitude, north positive
 * @param {number} longitudeEast  geographic longitude, east positive
 * @returns {number} ecliptic longitude of the ascendant (tropical, degrees)
 */
export function ascendant(jd, latitude, longitudeEast) {
  const ramc = lst(jd, longitudeEast); // right ascension of MC = LST
  const eps = obliquity(jd) * DEG;
  const phi = latitude * DEG;
  const ramcR = ramc * DEG;

  // Meeus-style ascendant formula
  const y = Math.cos(ramcR);
  const x = -(Math.sin(ramcR) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  let asc = Math.atan2(y, x) * RAD;
  asc = norm360(asc);

  // The ascendant must be in the eastern half of the sky.
  // If it landed in the wrong quadrant, shift by 180°.
  const mcLon = norm360(Math.atan2(Math.sin(ramcR), Math.cos(ramcR) * Math.cos(eps)) * RAD);
  const diff = norm360(asc - mcLon);
  if (diff > 180) asc = norm360(asc + 180);

  return asc;
}

/** Midheaven (MC) ecliptic longitude, tropical. */
export function midheaven(jd, longitudeEast) {
  const ramc = lst(jd, longitudeEast) * DEG;
  const eps = obliquity(jd) * DEG;
  return norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * RAD);
}

/**
 * Lahiri (Chitrapaksha) ayanamsa — tropical-to-sidereal offset in degrees.
 * Linear fit to published Lahiri values (accurate ~0.01° for 1900-2100).
 */
export function lahiriAyanamsa(jd) {
  const t = centuries(jd);
  // 23°51'11" at J2000.0 = 23.8531°, rate 50.2905"/yr = 0.013969°/yr
  // per century: 1.3969°
  const years = t * 100;
  return 23.8531 + years * 0.0139689 + t * t * 0.00013;
}

/** Convert tropical longitude to sidereal (Vedic) using Lahiri ayanamsa. */
export function toSidereal(tropicalLon, jd) {
  return norm360(tropicalLon - lahiriAyanamsa(jd));
}
