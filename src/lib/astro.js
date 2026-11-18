import {
  buildChart, navamsaChart, vimshottari, periodAt, pratyantardashas,
  mangalDosha, kalsarpDosha, pitraDosha, saturnSadeSati, allPositions,
  julianDay, lahiriAyanamsa, norm360, ashtakoot,
} from '../engine/index.js';
import { parseLocal } from './tz.js';

const cache = new Map();

/** Everything derived from one birth profile. Pure; memoised by profile content. */
export function kundli(profile) {
  if (!profile) return null;
  const key = JSON.stringify([profile.date, profile.time, profile.place]);
  if (cache.has(key)) return cache.get(key);

  const { lat, lon, tz } = profile.place;
  const birthDate = parseLocal(profile.date, profile.time, tz);
  const chart = buildChart({ birthDate, latitude: lat, longitude: lon });
  const d9 = navamsaChart(chart);
  const dasha = vimshottari(chart.planets.Moon.longitude, birthDate);

  const result = { birthDate, chart, d9, dasha };
  cache.set(key, result);
  return result;
}

export function currentPeriod(dasha, when = new Date()) {
  const at = periodAt(dasha, when);
  if (!at) return null;
  const pd = at.antardasha ? pratyantardashas(at.antardasha).find((p) => when >= p.startDate && when < p.endDate) : null;
  return { ...at, pratyantar: pd ?? null };
}

/** Saturn's sidereal sign right now (for Sade Sati). */
export function transitSaturnSign(when = new Date()) {
  const jd = julianDay(when);
  const lon = norm360(allPositions(jd).Saturn - lahiriAyanamsa(jd));
  return Math.floor(lon / 30) % 12;
}

export function doshas(k, when = new Date()) {
  return {
    mangal: mangalDosha(k.chart),
    kalsarp: kalsarpDosha(k.chart),
    pitra: pitraDosha(k.chart),
    sadeSati: saturnSadeSati(k.chart.planets.Moon.sign, transitSaturnSign(when)),
  };
}

export function match(groomProfile, brideProfile) {
  const g = kundli(groomProfile).chart.planets.Moon;
  const b = kundli(brideProfile).chart.planets.Moon;
  return {
    groomMoon: g, brideMoon: b,
    ...ashtakoot(
      { sign: g.sign, nakshatra: g.nakshatra, longitude: g.longitude },
      { sign: b.sign, nakshatra: b.nakshatra, longitude: b.longitude },
    ),
  };
}

export const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
export const PLANET_ABBR = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
export const SIGN_SHORT = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];

export function fmtDeg(deg) {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}′${String(s === 60 ? 59 : s).padStart(2, '0')}″`;
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Next time a planet changes sidereal sign after `from` (searched day by day, then refined). */
export function nextIngress(planet, from = new Date(), maxDays = 1200) {
  const signAt = (d) => {
    const jd = julianDay(d);
    return Math.floor(norm360(allPositions(jd)[planet] - lahiriAyanamsa(jd)) / 30) % 12;
  };
  const DAY = 86400000;
  const s0 = signAt(from);
  let prev = from.getTime();
  for (let k = 1; k <= maxDays; k++) {
    const t = from.getTime() + k * DAY;
    const s = signAt(new Date(t));
    if (s !== s0) {
      let a = prev, b = t;
      while (b - a > 60000) { const m = (a + b) / 2; if (signAt(new Date(m)) === s0) a = m; else b = m; }
      return { date: new Date(b), from: s0, to: s };
    }
    prev = t;
  }
  return null;
}

/** Tara (star strength) of a day's Moon nakshatra counted from the birth nakshatra. */
export const TARAS = [
  { name: 'Janma', good: null, text: 'Your own birth star returns. A sensitive, inward day: go gently and avoid big risks.' },
  { name: 'Sampat', good: true, text: 'The star of wealth. Good for money matters, purchases and practical gains.' },
  { name: 'Vipat', good: false, text: 'The star of obstacles. Expect friction; keep plans simple and avoid new starts.' },
  { name: 'Kshema', good: true, text: 'The star of wellbeing. Comfortable and secure; good for health and home.' },
  { name: 'Pratyari', good: false, text: 'The star of opposition. Avoid confrontations and hold back from hard negotiations.' },
  { name: 'Sadhaka', good: true, text: 'The star of accomplishment. Good for finishing work and pushing goals through.' },
  { name: 'Vadha', good: false, text: 'The most challenging star. Rest, review and postpone anything important.' },
  { name: 'Mitra', good: true, text: 'The friendly star. Good for meetings, cooperation and asking for help.' },
  { name: 'Ati Mitra', good: true, text: 'The very friendly star. One of the best days of the cycle for any start.' },
];
export function taraFor(birthNak, dayNak) {
  const count = ((dayNak - birthNak + 27) % 27) + 1;
  return { count, ...TARAS[(count - 1) % 9] };
}
