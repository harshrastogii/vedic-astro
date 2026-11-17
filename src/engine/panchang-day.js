// ---------------------------------------------------------------------------
// [web addition] Day-level panchang: sunrise/sunset, when each limb ends,
// lunar month, samvat, and the classical day divisions (Rahu Kaal,
// Yamaganda, Gulika, Abhijit, Brahma muhurta, Choghadiya).
//
// Built only on the engine's own sunPosition / panchang() — no other
// ephemeris. Classical tables follow the common Muhurta Chintamani /
// almanac conventions; each table is commented below.
// ---------------------------------------------------------------------------

import { sunPosition } from './ephemeris.js';
import { obliquity, lst, norm360, julianDay } from './time.js';
import { panchang } from './panchang.js';
import { RASHIS } from './constants.js';
import { zonedToUtc } from '../lib/tz.js';

const D2R = Math.PI / 180;
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// --- Sun altitude & rise/set ---------------------------------------------

/** Apparent altitude of the Sun's centre (degrees, no refraction). */
export function sunAltitude(date, lat, lon) {
  const jd = julianDay(date);
  const lam = sunPosition(jd) * D2R;
  const eps = obliquity(jd) * D2R;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const H = (lst(jd, lon) * D2R) - ra;
  const phi = lat * D2R;
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / D2R;
}

// Standard almanac definition: upper limb on the horizon with mean refraction.
const RISE_ALT = -0.833;

function findCrossing(fn, start, end, rising, step = 10 * MIN) {
  let t0 = start.getTime();
  let f0 = fn(new Date(t0));
  for (let t = t0 + step; t <= end.getTime(); t += step) {
    const f1 = fn(new Date(t));
    if ((rising && f0 < 0 && f1 >= 0) || (!rising && f0 > 0 && f1 <= 0)) {
      let a = t - step, b = t;
      while (b - a > 15 * 1000) {
        const m = (a + b) / 2;
        const fm = fn(new Date(m));
        if ((rising && fm < 0) || (!rising && fm > 0)) a = m; else b = m;
      }
      return new Date((a + b) / 2);
    }
    f0 = f1;
  }
  return null;
}

/** Sunrise and sunset on the local calendar day starting at `dayStart`. */
export function sunTimes(dayStart, lat, lon) {
  const end = new Date(dayStart.getTime() + 24 * HOUR);
  const f = (d) => sunAltitude(d, lat, lon) - RISE_ALT;
  return {
    sunrise: findCrossing(f, dayStart, end, true),
    sunset: findCrossing(f, dayStart, end, false),
  };
}

// --- When does the current limb end? -------------------------------------

/** First instant after `from` when integer-valued fn changes. */
function nextChange(fn, from, maxHours = 40, step = 20 * MIN) {
  const v0 = fn(from);
  let prev = from.getTime();
  const limit = prev + maxHours * HOUR;
  for (let t = prev + step; t <= limit; t += step) {
    if (fn(new Date(t)) !== v0) {
      let a = prev, b = t;
      while (b - a > 20 * 1000) {
        const m = (a + b) / 2;
        if (fn(new Date(m)) === v0) a = m; else b = m;
      }
      return new Date(b);
    }
    prev = t;
  }
  return null;
}

const tithiIdx = (d) => panchang(d).tithi.index;
const nakIdx = (d) => panchang(d).nakshatra.index;
const yogaIdx = (d) => panchang(d).yoga.index;
const karanaIdx = (d) => panchang(d).karana.index;

// --- Lunar month & samvat ------------------------------------------------

// Amanta months, named for the sidereal sign the Sun occupies at the new
// moon that begins the month: Sun in Pisces -> Chaitra, Aries -> Vaishakha …
export const LUNAR_MONTHS = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

function previousNewMoon(date) {
  // elongation decreases going back in time; find where it wraps 0°
  const el = (d) => panchang(d).elongation;
  let t = date.getTime();
  let e0 = el(date);
  for (let k = 0; k < 140; k++) {
    const t1 = t - 6 * HOUR;
    const e1 = el(new Date(t1));
    if (e1 > e0 + 180) {
      let a = t1, b = t;
      while (b - a > MIN) {
        const m = (a + b) / 2;
        if (el(new Date(m)) > 180) a = m; else b = m;
      }
      return new Date(b);
    }
    t = t1; e0 = e1;
  }
  return null;
}

export function lunarMonth(date) {
  const nm = previousNewMoon(date);
  const sunSign = Math.floor(panchang(nm).sunLongitude / 30) % 12;
  const index = (sunSign + 1) % 12;
  return { index, name: LUNAR_MONTHS[index], newMoon: nm };
}

export function samvat(date, lunarMonthIndex, gregorianYear, gregorianMonth) {
  // The Vikram and Shaka years turn at Chaitra Shukla Pratipada.
  const beforeNewYear = gregorianMonth <= 4 && lunarMonthIndex >= 9;
  return {
    vikram: gregorianYear + (beforeNewYear ? 56 : 57),
    shaka: gregorianYear - (beforeNewYear ? 79 : 78),
  };
}

// --- Day divisions -------------------------------------------------------

// Eighth-of-daytime slot (1-based) for each weekday, Sunday first.
const RAHU_KAAL = [8, 2, 7, 5, 6, 4, 3];
const YAMAGANDA = [5, 4, 3, 2, 1, 7, 6];
const GULIKA = [7, 6, 5, 4, 3, 2, 1];

function eighth(sunrise, sunset, slot) {
  const len = (sunset - sunrise) / 8;
  const start = new Date(sunrise.getTime() + (slot - 1) * len);
  return { start, end: new Date(start.getTime() + len) };
}

// Choghadiya: daytime and night each split into 8 parts.
const CHOG_DAY_CYCLE = ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'];
const CHOG_NIGHT_CYCLE = ['Shubh', 'Amrit', 'Char', 'Rog', 'Kaal', 'Labh', 'Udveg'];
const CHOG_DAY_FIRST = ['Udveg', 'Amrit', 'Rog', 'Labh', 'Shubh', 'Char', 'Kaal'];
const CHOG_NIGHT_FIRST = ['Shubh', 'Char', 'Kaal', 'Udveg', 'Amrit', 'Rog', 'Labh'];
export const CHOG_QUALITY = {
  Amrit: 'good', Shubh: 'good', Labh: 'good', Char: 'neutral',
  Udveg: 'bad', Kaal: 'bad', Rog: 'bad',
};

function choghadiya(start, end, firstName, cycle) {
  const len = (end - start) / 8;
  let i = cycle.indexOf(firstName);
  const out = [];
  for (let k = 0; k < 8; k++) {
    const name = cycle[(i + k) % 7];
    const s = new Date(start.getTime() + k * len);
    out.push({ name, quality: CHOG_QUALITY[name], start: s, end: new Date(s.getTime() + len) });
  }
  return out;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const VAARA_LORD = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/**
 * Full panchang for a local calendar day.
 * The day's limbs are read at local sunrise (the classical rule), with the
 * time each one ends.
 */
export function dayPanchang(dateStr, lat, lon, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayStart = zonedToUtc(y, m, d, 0, 0, tz);
  const prevStart = zonedToUtc(...prevDay(y, m, d), 0, 0, tz);
  const nextStart = zonedToUtc(...nextDay(y, m, d), 0, 0, tz);

  const { sunrise, sunset } = sunTimes(dayStart, lat, lon);
  const nextSunrise = sunTimes(nextStart, lat, lon).sunrise;
  const prevSunset = sunTimes(prevStart, lat, lon).sunset;

  const ref = sunrise ?? new Date(dayStart.getTime() + 6 * HOUR);
  const p = panchang(ref, { tz });
  const weekdayIdx = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

  const ends = {
    tithi: nextChange(tithiIdx, ref),
    nakshatra: nextChange(nakIdx, ref),
    yoga: nextChange(yogaIdx, ref),
    karana: nextChange(karanaIdx, ref),
  };
  // what follows each limb
  const next = {
    tithi: ends.tithi && panchang(new Date(ends.tithi.getTime() + MIN)),
    nakshatra: ends.nakshatra && panchang(new Date(ends.nakshatra.getTime() + MIN)),
  };

  const lm = lunarMonth(ref);
  const sv = samvat(ref, lm.index, y, m);

  const result = {
    date: dateStr, tz, lat, lon,
    sunrise, sunset, nextSunrise,
    vaara: { name: WEEKDAYS[weekdayIdx], lord: VAARA_LORD[weekdayIdx] },
    tithi: { ...p.tithi, endsAt: ends.tithi, next: next.tithi?.tithi },
    nakshatra: { ...p.nakshatra, endsAt: ends.nakshatra, next: next.nakshatra?.nakshatra },
    yoga: { ...p.yoga, endsAt: ends.yoga },
    karana: { ...p.karana, endsAt: ends.karana },
    moonSign: RASHIS[Math.floor(p.moonLongitude / 30) % 12],
    sunSign: RASHIS[Math.floor(p.sunLongitude / 30) % 12],
    ayanamsa: p.ayanamsa,
    lunarMonth: lm,
    samvat: sv,
    ekadashi: p.tithi.number === 11,
    purnima: p.tithi.index === 14,
    amavasya: p.tithi.index === 29,
  };

  if (sunrise && sunset) {
    const dayLen = sunset - sunrise;
    const muhurta = dayLen / 15;
    result.dayLength = dayLen;
    result.rahuKaal = eighth(sunrise, sunset, RAHU_KAAL[weekdayIdx]);
    result.yamaganda = eighth(sunrise, sunset, YAMAGANDA[weekdayIdx]);
    result.gulika = eighth(sunrise, sunset, GULIKA[weekdayIdx]);
    // Abhijit = 8th of the 15 daytime muhurtas (traditionally skipped on Wednesdays)
    result.abhijit = {
      start: new Date(sunrise.getTime() + 7 * muhurta),
      end: new Date(sunrise.getTime() + 8 * muhurta),
      applicable: weekdayIdx !== 3,
    };
    if (prevSunset) {
      const nightMuhurta = (sunrise - prevSunset) / 15;
      // Brahma muhurta = 14th of the 15 night muhurtas (the one before last)
      result.brahmaMuhurta = {
        start: new Date(sunrise.getTime() - 2 * nightMuhurta),
        end: new Date(sunrise.getTime() - nightMuhurta),
      };
    }
    result.choghadiya = {
      day: choghadiya(sunrise, sunset, CHOG_DAY_FIRST[weekdayIdx], CHOG_DAY_CYCLE),
      night: nextSunrise ? choghadiya(sunset, nextSunrise, CHOG_NIGHT_FIRST[weekdayIdx], CHOG_NIGHT_CYCLE) : [],
    };
  }
  return result;
}

function prevDay(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d - 1));
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}
function nextDay(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}

