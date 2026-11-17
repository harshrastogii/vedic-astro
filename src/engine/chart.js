// ---------------------------------------------------------------------------
// Chart builder — turns birth data into a full Vedic birth chart (Rasi chart)
// ---------------------------------------------------------------------------

import {
  julianDay, ascendant, midheaven, lahiriAyanamsa, norm360, lst,
} from './time.js';
import { allPositions } from './ephemeris.js';
import { NAKSHATRAS, RASHIS, RASHI_LORD, NAKSHATRA_LORD } from './constants.js';

const NAK_SPAN = 360 / 27; // 13.3333° per nakshatra
const SIGN_SPAN = 30;

/** Sign index (0-11) from a tropical-or-sidereal longitude. */
export function signOf(lon) {
  return Math.floor(norm360(lon) / SIGN_SPAN) % 12;
}

/** Degree within the sign (0-30). */
export function degreeInSign(lon) {
  return norm360(lon) % SIGN_SPAN;
}

/** Nakshatra index (0-26) from longitude. */
export function nakshatraOf(lon) {
  return Math.floor(norm360(lon) / NAK_SPAN) % 27;
}

/** Pada (1-4) within the nakshatra. */
export function padaOf(lon) {
  const within = norm360(lon) % NAK_SPAN;
  return Math.floor(within / (NAK_SPAN / 4)) + 1;
}

/**
 * Build a Vedic birth chart.
 *
 * @param {object} input
 * @param {Date}   input.birthDate   birth moment (as a JS Date, in UTC)
 * @param {number} input.latitude    geographic latitude
 * @param {number} input.longitude   geographic longitude (east positive)
 * @param {string} [input.tzOffset]  IANA zone, informational only — pass the
 *                                   Date already converted to UTC
 * @returns {object} full chart
 */
export function buildChart({ birthDate, latitude, longitude }) {
  const jd = julianDay(birthDate);
  const ayan = lahiriAyanamsa(jd);

  // Ascendant & midheaven — tropical, then shifted to sidereal
  const ascTropical = ascendant(jd, latitude, longitude);
  const mcTropical = midheaven(jd, longitude);
  const asc = norm360(ascTropical - ayan);
  const mc = norm360(mcTropical - ayan);

  // Planetary positions — tropical then sidereal
  const tropical = allPositions(jd);
  const planets = {};
  for (const [name, lon] of Object.entries(tropical)) {
    const sid = norm360(lon - ayan);
    const sign = signOf(sid);
    const nak = nakshatraOf(sid);
    planets[name] = {
      longitude: sid,
      tropicalLongitude: lon,
      sign,
      signName: RASHIS[sign],
      signLord: RASHI_LORD[sign],
      degree: degreeInSign(sid),
      nakshatra: nak,
      nakshatraName: NAKSHATRAS[nak],
      nakshatraLord: NAKSHATRA_LORD[nak],
      pada: padaOf(sid),
      house: houseOf(asc, sid),
      retrograde: false, // set below if we can detect it
    };
  }

  // Detect retrograde by comparing position a short time later
  const jdLater = jd + 0.5;
  const later = allPositions(jdLater);
  for (const name of Object.keys(planets)) {
    const delta = norm360(later[name] - tropical[name]);
    const signed = delta > 180 ? delta - 360 : delta;
    planets[name].retrograde = signed < 0 && name !== 'Sun' && name !== 'Moon';
  }

  // Houses: whole-sign from the ascendant (standard in Vedic)
  const ascSign = signOf(asc);
  const houseToSign = [];
  for (let i = 0; i < 12; i++) houseToSign.push((ascSign + i) % 12);

  const signToPlanets = {};
  for (let i = 0; i < 12; i++) signToPlanets[i] = [];
  for (const [name, p] of Object.entries(planets)) signToPlanets[p.sign].push(name);

  return {
    birthDate,
    latitude,
    longitude,
    jd,
    ayanamsa: ayan,
    ascendant: asc,
    ascendantSign: ascSign,
    ascendantSignName: RASHIS[ascSign],
    midheaven: mc,
    planets,
    houseToSign,
    signToPlanets,
    retrogrades: Object.entries(planets).filter(([, p]) => p.retrograde).map(([n]) => n),
  };
}

/** Whole-sign house number (1-12) a planet sits in, given ascendant longitude. */
function houseOf(ascLon, planetLon) {
  const ascSign = signOf(ascLon);
  const pSign = signOf(planetLon);
  return ((pSign - ascSign + 12) % 12) + 1;
}

/** Human-readable summary line for a planet. */
export function describePlanet(p) {
  const ret = p.retrograde ? ' R' : '';
  return `${p.signName} ${p.degree.toFixed(2)}°${ret} | ${p.nakshatraName} p${p.pada} | H${p.house}`;
}
