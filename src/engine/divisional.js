// ---------------------------------------------------------------------------
// [web addition] Divisional charts.
// Navamsa (D9): each sign is split into nine 3°20' parts. Counting those parts
// continuously from 0° Aries, the D9 sign is (part number mod 12) — this
// reproduces the classical rule (movable signs start from themselves, fixed
// signs from the 9th, dual signs from the 5th). Source: Brihat Parashara
// Hora Shastra, ch. 6 (Shodashavarga).
// ---------------------------------------------------------------------------

import { RASHIS } from './constants.js';
import { norm360 } from './time.js';

export function navamsaSign(siderealLon) {
  return Math.floor((norm360(siderealLon) * 9) / 30) % 12;
}

/**
 * Build a navamsa chart from a rasi chart (output of buildChart).
 * Houses are whole-sign from the navamsa ascendant.
 */
export function navamsaChart(chart) {
  const ascSign = navamsaSign(chart.ascendant);
  const planets = {};
  for (const [name, p] of Object.entries(chart.planets)) {
    const sign = navamsaSign(p.longitude);
    planets[name] = {
      sign,
      signName: RASHIS[sign],
      house: ((sign - ascSign + 12) % 12) + 1,
      retrograde: p.retrograde,
    };
  }
  return { ascendantSign: ascSign, ascendantSignName: RASHIS[ascSign], planets };
}
