// ---------------------------------------------------------------------------
// Dosha (affliction) detectors — Mangal, Kalsarp, Pitra, Sade Sati
// Each returns a structured result with severity and cancellation factors,
// mirroring the shape the original app uses.
// ---------------------------------------------------------------------------

import { norm360 } from './time.js';
import { RASHIS, NAKSHATRAS } from './constants.js';
import { buildChart } from './chart.js';

// --- Mangal Dosha ---------------------------------------------------------
// Mars in houses 1, 2, 4, 7, 8, 12 counted from Lagna, Moon OR Venus.
const MANGAL_HOUSES = [1, 2, 4, 7, 8, 12];

/**
 * @param {object} chart output of buildChart()
 * @returns {object} dosha result
 */
export function mangalDosha(chart) {
  const mars = chart.planets.Mars;
  const venus = chart.planets.Venus;
  const moon = chart.planets.Moon;

  // Count houses from three reference points (whole-sign)
  const fromLagna = mars.house;
  const fromMoon = relativeHouse(chart.ascendantSign, moon.sign, mars.sign);
  const fromVenus = relativeHouse(chart.ascendantSign, venus.sign, mars.sign);

  const triggers = [];
  if (MANGAL_HOUSES.includes(fromLagna)) triggers.push('Lagna');
  if (MANGAL_HOUSES.includes(fromMoon)) triggers.push('Moon');
  if (MANGAL_HOUSES.includes(fromVenus)) triggers.push('Venus');

  const present = triggers.length > 0;

  // Cancellation factors (classical)
  const cancellations = [];
  // 1. Mars in its own sign (Aries/Scorpio) or exalted (Capricorn)
  if (['Aries', 'Scorpio', 'Capricorn'].includes(mars.signName)) {
    cancellations.push('Mars in own or exalted sign');
  }
  // 2. Mars in a friend's sign
  if (['Leo', 'Sagittarius', 'Gemini'].includes(mars.signName)) {
    cancellations.push('Mars in friendly sign');
  }
  // 3. Jupiter aspects Mars (Jupiter in a house that aspects Mars)
  if (jupiterAspects(chart, mars.house)) {
    cancellations.push('Jupiter aspects Mars');
  }
  // 4. Mars in 1st/4th/7th/8th/12th but aspected by benefic
  // 5. Aries or Scorpio lagna (Mars rules lagna)
  if (chart.ascendantSignName === 'Aries' || chart.ascendantSignName === 'Scorpio') {
    cancellations.push('Mars rules the ascendant');
  }

  const cancelled = present && cancellations.length >= 2;

  let severity = 'none';
  if (present && !cancelled) {
    severity = triggers.length >= 2 ? 'strong' : 'mild';
  } else if (present && cancelled) {
    severity = 'cancelled';
  }

  return {
    type: 'mangal',
    present: present && !cancelled,
    raw: present,
    cancelled,
    triggers,
    severity,
    cancellationFactors: cancellations,
    marsHouse: fromLagna,
    presentationTier: severity === 'none' ? 'non_manglik_clean'
      : cancelled ? 'cancelled_full'
      : severity === 'strong' ? 'manglik_strong'
      : severity === 'mild' ? 'manglik_mild'
      : 'manglik_moderate',
  };
}

// --- Kalsarp Dosha --------------------------------------------------------
// All seven classical planets hemmed between Rahu and Ketu.
export function kalsarpDosha(chart) {
  const rahu = chart.planets.Rahu.longitude;
  const ketu = chart.planets.Ketu.longitude;

  // Arc from Rahu to Ketu going clockwise (increasing longitude)
  const arc = norm360(ketu - rahu); // 180 by construction

  const classical = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  let hemmed = [];
  let outside = [];

  for (const name of classical) {
    const lon = chart.planets[name].longitude;
    const fromRahu = norm360(lon - rahu);
    // Inside the Rahu->Ketu half if 0 < fromRahu < 180
    if (fromRahu > 0 && fromRahu < arc) hemmed.push(name);
    else outside.push(name);
  }

  // [web fix] Planets can be hemmed on either side of the nodal axis
  // (Rahu->Ketu, or Ketu->Rahu which some texts call Kaal Amrit).
  // Previously only the Rahu->Ketu half was checked.
  const side = hemmed.length >= outside.length ? 'rahu-to-ketu' : 'ketu-to-rahu';
  if (side === 'ketu-to-rahu') [hemmed, outside] = [outside, hemmed];

  const complete = hemmed.length === 7;
  // Partial kalsarp: most planets hemmed
  const partial = !complete && hemmed.length >= 5;

  let doshaType = 'none';
  if (complete) {
    // Sub-type by where Rahu sits
    const rahuSign = RASHIS[signIndex(rahu)];
    doshaType = `complete_${rahuSign.toLowerCase()}`;
  } else if (partial) {
    doshaType = 'partial';
  }

  return {
    type: 'kalsarp',
    present: complete || partial,
    complete,
    doshaType,
    presentationTier: complete ? 'complete' : partial ? 'partial' : 'none',
    hemmedPlanets: hemmed,
    outsidePlanets: outside,
    side,
    hemmedCount: hemmed.length,
    severity: complete ? (hemmed.length === 7 ? 'full' : 'high') : partial ? 'mild' : 'none',
    rahuSign: RASHIS[signIndex(rahu)],
    ketuSign: RASHIS[signIndex(ketu)],
  };
}

// --- Pitra Dosha ----------------------------------------------------------
// Afflicted Sun: with Rahu/Saturn, or Sun in specific dusthana houses.
export function pitraDosha(chart) {
  const sun = chart.planets.Sun;
  const rahu = chart.planets.Rahu;
  const saturn = chart.planets.Saturn;

  const factors = [];

  // Sun conjunct Rahu within 8°
  if (angularSep(sun.longitude, rahu.longitude) < 8) {
    factors.push('Sun conjunct Rahu');
  }
  // Sun conjunct Saturn within 8°
  if (angularSep(sun.longitude, saturn.longitude) < 8) {
    factors.push('Sun conjunct Saturn');
  }
  // Sun in 6th, 8th or 12th house
  if ([6, 8, 12].includes(sun.house)) {
    factors.push(`Sun in ${sun.house}th house`);
  }
  // Sun with malefic aspects
  if (saturn.house === sun.house) factors.push('Saturn in Sun house');

  const present = factors.length > 0;

  // Cancellation: Jupiter aspects Sun, or Sun in own/exalted sign
  const cancellations = [];
  if (['Aries', 'Leo', 'Sagittarius'].includes(sun.signName)) {
    cancellations.push('Sun in friendly sign');
  }
  if (jupiterAspects(chart, sun.house)) cancellations.push('Jupiter aspects Sun');

  const cancelled = present && cancellations.length >= 2;

  return {
    type: 'pitra',
    present: present && !cancelled,
    raw: present,
    cancelled,
    factors,
    cancellationFactors: cancellations,
    severity: factors.length >= 2 ? 'high' : factors.length === 1 ? 'mild' : 'none',
    presentationTier: cancelled ? 'cancelled' : factors.length >= 2 ? 'strong' : factors.length === 1 ? 'mild' : 'none',
  };
}

// --- Sade Sati ------------------------------------------------------------
// Saturn transiting the 12th, 1st or 2nd sign from the Moon.
export function saturnSadeSati(natalMoonSign, transitSaturnSign) {
  const offset = ((transitSaturnSign - natalMoonSign) % 12 + 12) % 12;
  // 11 = 12th from Moon, 0 = 1st, 1 = 2nd
  const inPhase = offset === 11 || offset === 0 || offset === 1;
  const phaseName = offset === 11 ? 'Rising (ascending)'
    : offset === 0 ? 'Peak (culminating)'
    : offset === 1 ? 'Setting (descending)'
    : 'Not in Sade Sati';

  const rising = offset === 11;
  const peak = offset === 0;

  return {
    type: 'sadesati',
    present: inPhase,
    phase: phaseName,
    phaseKey: offset === 11 ? 'rising' : offset === 0 ? 'peak' : offset === 1 ? 'setting' : 'none',
    severity: peak ? 'high' : inPhase ? 'moderate' : 'none',
    presentationTier: !inPhase ? 'none' : peak ? 'peak' : rising ? 'rising' : 'setting',
    moonSign: RASHIS[natalMoonSign],
    saturnSign: RASHIS[transitSaturnSign],
  };
}

// --- helpers --------------------------------------------------------------

function relativeHouse(ascSign, refSign, targetSign) {
  // House of targetSign counted from refSign, using whole-sign from ascendant
  const refHouse = ((refSign - ascSign + 12) % 12) + 1;
  const targetHouse = ((targetSign - ascSign + 12) % 12) + 1;
  return ((targetHouse - refHouse + 12) % 12) + 1;
}

function angularSep(a, b) {
  const d = Math.abs(norm360(a - b));
  return d > 180 ? 360 - d : d;
}

function signIndex(lon) {
  return Math.floor(norm360(lon) / 30) % 12;
}

/** Does Jupiter aspect the given whole-sign house? (5th, 7th, 9th from Jupiter) */
function jupiterAspects(chart, targetHouse) {
  const jupHouse = chart.planets.Jupiter.house;
  for (const asp of [5, 7, 9]) {
    const from = ((jupHouse - 1 + asp - 1) % 12) + 1;
    if (from === targetHouse) return true;
  }
  return false;
}
