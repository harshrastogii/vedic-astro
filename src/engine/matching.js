// ---------------------------------------------------------------------------
// Kundli Match — Ashtakoot (36-guna) compatibility scoring
// ---------------------------------------------------------------------------

import { NAKSHATRAS, GANA, VARNA, PLANET_FRIENDS, RASHI_LORD } from './constants.js';

// [web fix] Classical Nadi order runs Aadi-Madhya-Antya then back
// Antya-Madhya-Aadi (zig-zag), not a plain repeating cycle.
const NADI = [
  'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi',
  'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi',
  'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi',
  'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi',
  'Aadi', 'Madhya', 'Antya',
];

const VARNA_ORDER = ['Shudra', 'Vaishya', 'Kshatriya', 'Brahmin'];

/**
 * Score an Ashtakoot match.
 * @param {object} groom  { sign, nakshatra, longitude? }  (Moon; longitude = sidereal degrees,
 *                         used for the half-sign Vashya groups of Sagittarius/Capricorn)
 * @param {object} bride   { sign, nakshatra, longitude? }
 * @returns {object} per-koota breakdown + total out of 36
 */
export function ashtakoot(groom, bride) {
  const results = {};

  // 1. Varna (1 pt) — bride's varna must not be higher than groom's
  // [web fix] rank by VARNA_ORDER (was indexOf into the 12-sign table)
  const gV = VARNA_ORDER.indexOf(VARNA[groom.sign]);
  const bV = VARNA_ORDER.indexOf(VARNA[bride.sign]);
  results.varna = { points: bV <= gV ? 1 : 0, max: 1, groom: VARNA[groom.sign], bride: VARNA[bride.sign] };

  // 2. Vashya (2 pts) — mutual attraction based on sign groups
  // [web change, classical] five groups incl. half-signs; see vashyaGroup()
  const gVa = vashyaGroup(groom.sign, groom.longitude);
  const bVa = vashyaGroup(bride.sign, bride.longitude);
  results.vashya = { points: VASHYA_TABLE[gVa][bVa], max: 2, groom: VASHYA_NAMES[gVa], bride: VASHYA_NAMES[bVa] };

  // 3. Tara (3 pts)
  // [web change, classical] Count both ways (groom->bride and bride->groom),
  // 1.5 points each. Remainder 3, 5 or 7 after dividing by 9 (Vipat,
  // Pratyari, Vadha) is unfavourable; anything else is favourable.
  // Was: one direction only, all-or-nothing 3 points.
  const taraOk = (from, to) => ![3, 5, 7].includes(((((to - from + 27) % 27) + 1) % 9));
  const gToB = taraOk(groom.nakshatra, bride.nakshatra);
  const bToG = taraOk(bride.nakshatra, groom.nakshatra);
  results.tara = { points: (gToB ? 1.5 : 0) + (bToG ? 1.5 : 0), max: 3, groomToBride: gToB, brideToGroom: bToG };

  // 4. Yoni (4 pts) — animal-friendship of the nakshatras
  results.yoni = { points: yoniScore(groom.nakshatra, bride.nakshatra), max: 4 };

  // 5. Graha Maitri (5 pts) — friendship of the two moon-sign lords
  const gl = RASHI_LORD[groom.sign];
  const bl = RASHI_LORD[bride.sign];
  results.grahaMaitri = { points: grahaMaitriScore(gl, bl), max: 5, groom: gl, bride: bl };

  // 6. Gana (6 pts) — temperament compatibility
  results.gana = { points: ganaScore(GANA[groom.nakshatra], GANA[bride.nakshatra]), max: 6, groom: GANA[groom.nakshatra], bride: GANA[bride.nakshatra] };

  // 7. Bhakoot (7 pts) — moon-sign distance
  results.bhakoot = { points: bhakootScore(groom.sign, bride.sign), max: 7 };

  // 8. Nadi (8 pts) — must differ
  const gN = NADI[groom.nakshatra];
  const bN = NADI[bride.nakshatra];
  results.nadi = { points: gN !== bN ? 8 : 0, max: 8, groom: gN, bride: bN };

  const total = Object.values(results).reduce((s, r) => s + r.points, 0);
  const band = total >= 27 ? 'excellent' : total >= 18 ? 'good' : total >= 12 ? 'fair' : 'low';

  return { kootas: results, total, max: 36, band, percentage: Math.round((total / 36) * 100) };
}

// --- individual koota scorers --------------------------------------------

// [web change, classical] Vashya groups (Muhurta Chintamani / BPHS tradition):
//   Chatushpada (four-footed): Aries, Taurus, 2nd half of Sagittarius, 1st half of Capricorn
//   Manava (human):            Gemini, Virgo, Libra, 1st half of Sagittarius, Aquarius
//   Jalachara (water):         Cancer, Pisces, 2nd half of Capricorn
//   Vanachara (wild):          Leo
//   Keeta (insect):            Scorpio
// Was: four groups made by counting signs in a repeating pattern.
const VASHYA_NAMES = ['Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta'];
const C = 0, M = 1, J = 2, V = 3, K = 4;
const VASHYA_BY_SIGN = [C, C, M, J, V, M, M, K, null, null, M, J];

function vashyaGroup(sign, longitude) {
  if (sign === 8 || sign === 9) {
    // Without a degree, fall back to the half that holds most traditions' default.
    const firstHalf = longitude == null ? true : (longitude % 30) < 15;
    if (sign === 8) return firstHalf ? M : C;
    return firstHalf ? C : J;
  }
  return VASHYA_BY_SIGN[sign];
}

// Points by group (groom row, bride column), as printed in standard
// Ashtakoot tables. Some regional tables differ by half a point.
const VASHYA_TABLE = [
  //   C    M    J    V    K
  [2, 1, 1, 0.5, 1], // Chatushpada
  [1, 2, 0.5, 0, 1], // Manava
  [1, 0.5, 2, 1, 1], // Jalachara
  [0.5, 0, 1, 2, 0], // Vanachara
  [1, 1, 1, 0, 2],   // Keeta
];

function ganaScore(gGana, bGana) {
  if (gGana === bGana) return 6;
  const m = `${gGana}-${bGana}`;
  const table = {
    'Deva-Manushya': 5, 'Manushya-Deva': 5,
    'Deva-Rakshasa': 1, 'Rakshasa-Deva': 1,
    'Manushya-Rakshasa': 0, 'Rakshasa-Manushya': 0,
  };
  return table[m] ?? 0;
}

// [web change, classical] Graha Maitri looks at the friendship from BOTH
// sides and combines them:
//   friend+friend 5 · friend+neutral 4 · neutral+neutral 3 ·
//   friend+enemy 1 · neutral+enemy ½ · enemy+enemy 0 · same lord 5.
// Was: one side only (5 / 3 / 0).
function relation(from, to) {
  const r = PLANET_FRIENDS[from];
  if (r.friends.includes(to)) return 'F';
  if (r.enemies.includes(to)) return 'E';
  return 'N';
}
const MAITRI_POINTS = { FF: 5, FN: 4, NF: 4, NN: 3, FE: 1, EF: 1, NE: 0.5, EN: 0.5, EE: 0 };

function grahaMaitriScore(lordA, lordB) {
  if (lordA === lordB) return 5;
  return MAITRI_POINTS[relation(lordA, lordB) + relation(lordB, lordA)];
}

function bhakootScore(gSign, bSign) {
  const diff = ((bSign - gSign) % 12 + 12) % 12 + 1; // 1..12
  // [web fix] Classical Bhakoot dosha pairs are 2/12, 5/9 and 6/8
  // (7/7 "samsaptaka" is auspicious). Was [2, 12, 5, 8, 6, 7].
  const bad = [2, 12, 5, 9, 6, 8];
  return bad.includes(diff) ? 0 : 7;
}

function yoniScore(gNak, bNak) {
  // Yoni animals for the 27 nakshatras
  const YONI = [
    'Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog',
    'Cat', 'Goat', 'Cat', 'Rat', 'Rat', 'Cow',
    'Buffalo', 'Tiger', 'Buffalo', 'Tiger', 'Deer', 'Deer',
    'Dog', 'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Horse',
    'Lion', 'Cow', 'Elephant',
  ];
  // Friendship matrix (0=enemy, 1=neutral, 2=friend, 3=very friend... use 0/2/4)
  const FRIEND = {
    Horse: ['Horse', 'Buffalo', 'Lion'], Elephant: ['Elephant', 'Cow'],
    Sheep: ['Sheep', 'Tiger'], Serpent: ['Serpent', 'Dog'],
    Dog: ['Dog', 'Serpent'], Cat: ['Cat', 'Rat'],
    Goat: ['Goat', 'Monkey'], Rat: ['Rat', 'Cat'],
    Cow: ['Cow', 'Elephant'], Buffalo: ['Buffalo', 'Horse'],
    Tiger: ['Tiger', 'Sheep'], Monkey: ['Monkey', 'Goat'],
    Deer: ['Deer'], Lion: ['Lion', 'Horse'],
    Mongoose: ['Mongoose'],
  };
  const a = YONI[gNak], b = YONI[bNak];
  if (a === b) return 4;
  if (FRIEND[a]?.includes(b)) return 3;
  // enemy pairs
  const ENEMY = {
    Horse: ['Elephant', 'Buffalo'], Elephant: ['Horse', 'Lion'],
    Sheep: ['Monkey', 'Buffalo'], Serpent: ['Mongoose', 'Cat'],
    Dog: ['Cat', 'Monkey'], Cat: ['Serpent', 'Dog'],
    Goat: ['Serpent', 'Dog'], Rat: ['Serpent', 'Dog'],
    Cow: ['Tiger', 'Lion'], Buffalo: ['Horse', 'Tiger'],
    Tiger: ['Cow', 'Buffalo'], Monkey: ['Sheep', 'Cow'],
    Deer: ['Serpent'], Lion: ['Elephant', 'Cow'],
    Mongoose: ['Serpent'],
  };
  if (ENEMY[a]?.includes(b)) return 0;
  return 2; // neutral
}
