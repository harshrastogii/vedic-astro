// ---------------------------------------------------------------------------
// Panchang — the five limbs of the day, computed from Sun & Moon longitudes
// ---------------------------------------------------------------------------

import { norm360, lahiriAyanamsa } from './time.js';
import { sunPosition, moonPosition } from './ephemeris.js';
import { NAKSHATRAS, RASHIS } from './constants.js';
import { nakshatraOf, padaOf } from './chart.js';

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];

const KARANA_NAMES = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];

// [web fix] Classical karana sequence over the 60 half-tithis of a lunar
// month: #0 Kimstughna, #1-56 the seven movable karanas repeating,
// #57 Shakuni, #58 Chatushpada, #59 Naga.
export function karanaName(k) {
  if (k === 0) return 'Kimstughna';
  if (k >= 57) return ['Shakuni', 'Chatushpada', 'Naga'][k - 57];
  return KARANA_NAMES[(k - 1) % 7];
}

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata',
  'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha',
  'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti',
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Compute the panchang for a moment.
 * @param {Date} date  moment (UTC)
 * @returns {object} five limbs
 */
export function panchang(date, { tz } = {}) {
  const jd = julianFrom(date);
  // [web fix] Nakshatra, yoga and the Moon/Sun signs are sidereal quantities.
  // Tithi and karana depend only on the Sun-Moon difference, so the ayanamsa
  // cancels there. Previously tropical longitudes were used throughout,
  // which put the nakshatra about two nakshatras off.
  const ayan = lahiriAyanamsa(jd);
  const sun = norm360(sunPosition(jd) - ayan);
  const moon = norm360(moonPosition(jd) - ayan);

  // Tithi = 12° elongation segments (30 tithis)
  const elong = norm360(moon - sun);
  const tithiIndex = Math.floor(elong / 12) % 30;
  const paksha = tithiIndex < 15 ? 'Shukla' : 'Krishna';
  const tithiWithin = (elong % 12) / 12;

  // Nakshatra of the Moon
  const nak = nakshatraOf(moon);
  const nakWithin = (moon % (360 / 27)) / (360 / 27);

  // Yoga = (sun + moon) / 13.333°
  const yogaLon = norm360(sun + moon);
  const yogaIndex = Math.floor(yogaLon / (360 / 27)) % 27;

  // Karana = half a tithi (6° segments)
  const karanaIndex = Math.floor(elong / 6) % 60;
  const fixedKarana = karanaName(karanaIndex);

  // [web fix] Vaara from the local calendar day when a timezone is given
  // (was always UTC). The sunrise-to-sunrise rule is applied in panchang-day.js.
  const weekday = tz
    ? new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: tz }).format(date)
    : WEEKDAYS[date.getUTCDay()];

  return {
    tithi: {
      index: tithiIndex,
      name: tithiNames(tithiIndex),
      number: (tithiIndex % 15) + 1,
      paksha,
      progress: tithiWithin,
    },
    nakshatra: {
      index: nak,
      name: NAKSHATRAS[nak],
      pada: padaOf(moon),
      progress: nakWithin,
    },
    yoga: { index: yogaIndex, name: YOGA_NAMES[yogaIndex] },
    karana: { index: karanaIndex, name: fixedKarana },
    vaara: { name: weekday },
    // auxiliary
    moonLongitude: moon,
    sunLongitude: sun,
    ayanamsa: ayan,
    elongation: elong,
    moonSign: RASHIS[Math.floor(moon / 30) % 12],
    sunSign: RASHIS[Math.floor(sun / 30) % 12],
  };
}

function tithiNames(i) {
  return TITHI_NAMES[i];
}

function julianFrom(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Nice display string, e.g. "Shukla Ekadashi". */
export function formatPanchang(p) {
  return `${p.tithi.paksha} ${p.tithi.name} · ${p.nakshatra.name} p${p.nakshatra.pada} · ${p.yoga.name} · ${p.karana.name} · ${p.vaara.name}`;
}
