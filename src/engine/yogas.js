// ---------------------------------------------------------------------------
// [web addition] Classical rules used by the Reports section.
// Each rule names its source. Abbreviations:
//   BPHS  = Brihat Parashara Hora Shastra (Santhanam translation, chapter noted)
//   PD    = Phaladeepika (Mantreswara)
//   SA    = Saravali (Kalyanavarma)
// Houses are whole-sign from the ascendant, as in the rest of the engine.
// ---------------------------------------------------------------------------

import { RASHIS, RASHI_LORD, PLANET_FRIENDS } from './constants.js';

export const SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
export const NINE = [...SEVEN, 'Rahu', 'Ketu'];

// --- Dignity (BPHS ch. 3) ---------------------------------------------------
export const EXALTATION = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 };
export const OWN_SIGNS = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
  Rahu: [10], Ketu: [7],
};
export const MOOLATRIKONA = { Sun: 4, Moon: 1, Mars: 0, Mercury: 5, Jupiter: 8, Venus: 6, Saturn: 10 };

/** 'exalted' | 'moolatrikona' | 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated' */
export function dignity(planet, sign) {
  const ex = EXALTATION[planet];
  if (ex === sign) return 'exalted';
  if ((ex + 6) % 12 === sign) return 'debilitated';
  if (MOOLATRIKONA[planet] === sign) return 'moolatrikona';
  if (OWN_SIGNS[planet]?.includes(sign)) return 'own';
  const lord = RASHI_LORD[sign];
  const rel = PLANET_FRIENDS[planet];
  if (!rel) return 'neutral';
  if (rel.friends.includes(lord)) return 'friend';
  if (rel.enemies.includes(lord)) return 'enemy';
  return 'neutral';
}
export const DIGNITY_TEXT = {
  exalted: 'exalted', moolatrikona: 'in its moolatrikona sign', own: 'in its own sign',
  friend: 'in a friendly sign', neutral: 'in a neutral sign', enemy: 'in an enemy sign', debilitated: 'debilitated',
};
export const isStrong = (d) => d === 'exalted' || d === 'moolatrikona' || d === 'own';
export const isWeak = (d) => d === 'debilitated' || d === 'enemy';

// --- Houses ------------------------------------------------------------------
export const KENDRA = [1, 4, 7, 10];
export const TRIKONA = [1, 5, 9];
export const DUSTHANA = [6, 8, 12];

export const houseOfSign = (chart, sign) => ((sign - chart.ascendantSign + 12) % 12) + 1;
export const signOfHouse = (chart, house) => (chart.ascendantSign + house - 1) % 12;
export const lordOfHouse = (chart, house) => RASHI_LORD[signOfHouse(chart, house)];
export const housesRuledBy = (chart, planet) =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => lordOfHouse(chart, h) === planet);
export const planetsInHouse = (chart, house) => NINE.filter((p) => chart.planets[p].house === house);

// --- Aspects: full (7th) for all; special for Mars 4/8, Jupiter 5/9, Saturn 3/10 (BPHS ch. 26)
const SPECIAL = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] };
export function aspectsHouse(chart, planet, house) {
  const from = chart.planets[planet].house;
  const dist = ((house - from + 12) % 12) + 1;
  if (planet === 'Rahu' || planet === 'Ketu') return false;
  return dist === 7 || (SPECIAL[planet] ?? []).includes(dist);
}
export const aspectsPlanet = (chart, a, b) => aspectsHouse(chart, a, chart.planets[b].house);
export const conjunct = (chart, a, b) => chart.planets[a].sign === chart.planets[b].sign;

/** Two planets "connected": conjunction, mutual aspect, or exchange of signs (BPHS ch. 39). */
export function connection(chart, a, b) {
  if (a === b) return 'same planet';
  if (conjunct(chart, a, b)) return 'conjunction';
  if (aspectsPlanet(chart, a, b) && aspectsPlanet(chart, b, a)) return 'mutual aspect';
  if (RASHI_LORD[chart.planets[a].sign] === b && RASHI_LORD[chart.planets[b].sign] === a) return 'exchange of signs';
  return null;
}

// --- Yogas -------------------------------------------------------------------
/**
 * Detects Raj Yogas and related power/wealth combinations.
 * Returns [{ name, kind, planets, rule, source, note }].
 */
export function findYogas(chart) {
  const out = [];
  const P = chart.planets;
  const hasDup = new Set();
  const push = (y) => { const k = y.name + y.planets.join(); if (!hasDup.has(k)) { hasDup.add(k); out.push(y); } };

  // Raj Yoga: lord of a kendra connected with lord of a trikona (BPHS ch. 39 v. 1-6)
  for (const k of [4, 7, 10, 1]) for (const t of [5, 9, 1]) {
    if (k === t) continue;
    const a = lordOfHouse(chart, k), b = lordOfHouse(chart, t);
    if (a === b) {
      if (k !== 1 && t !== 1) push({ name: 'Raj Yoga (Yogakaraka)', kind: 'raj', planets: [a], rule: `${a} rules both the ${k}th (kendra) and ${t}th (trikona) houses, making it a yogakaraka for this ascendant.`, source: 'BPHS ch. 34, 39' });
      continue;
    }
    const c = connection(chart, a, b);
    if (c) push({ name: 'Raj Yoga', kind: 'raj', planets: [a, b], rule: `${a} (lord of house ${k}) and ${b} (lord of house ${t}) are linked by ${c}.`, source: 'BPHS ch. 39' });
  }

  // Dharma-Karmadhipati: 9th and 10th lords connected (BPHS ch. 39)
  {
    const a = lordOfHouse(chart, 9), b = lordOfHouse(chart, 10);
    const c = a !== b && connection(chart, a, b);
    if (c) push({ name: 'Dharma-Karmadhipati Yoga', kind: 'raj', planets: [a, b], rule: `The lords of fortune (9th, ${a}) and career (10th, ${b}) are linked by ${c}.`, source: 'BPHS ch. 39' });
  }

  // Pancha Mahapurusha (BPHS ch. 75): Mars/Mercury/Jupiter/Venus/Saturn in own or exalted sign in a kendra
  const MAHA = { Mars: 'Ruchaka', Mercury: 'Bhadra', Jupiter: 'Hamsa', Venus: 'Malavya', Saturn: 'Sasa' };
  for (const [pl, nm] of Object.entries(MAHA)) {
    const d = dignity(pl, P[pl].sign);
    if (KENDRA.includes(P[pl].house) && isStrong(d)) {
      push({ name: `${nm} Yoga`, kind: 'mahapurusha', planets: [pl], rule: `${pl} is ${DIGNITY_TEXT[d]} (${RASHIS[P[pl].sign]}) in the ${P[pl].house}th house, a kendra.`, source: 'BPHS ch. 75' });
    }
  }

  // Gaja Kesari: Jupiter in a kendra from the Moon (BPHS ch. 36 v. 3; PD ch. 6)
  {
    const d = ((P.Jupiter.sign - P.Moon.sign + 12) % 12) + 1;
    if ([1, 4, 7, 10].includes(d)) push({ name: 'Gaja Kesari Yoga', kind: 'auspicious', planets: ['Jupiter', 'Moon'], rule: `Jupiter is in the ${d === 1 ? '1st' : `${d}th`} sign from the Moon.`, source: 'BPHS ch. 36; Phaladeepika ch. 6' });
  }

  // Budhaditya: Sun and Mercury together (PD ch. 6)
  if (conjunct(chart, 'Sun', 'Mercury')) push({ name: 'Budhaditya Yoga', kind: 'auspicious', planets: ['Sun', 'Mercury'], rule: `Sun and Mercury are together in ${RASHIS[P.Sun.sign]}.`, source: 'Phaladeepika ch. 6' });

  // Chandra-Mangala: Moon and Mars together (PD ch. 6)
  if (conjunct(chart, 'Moon', 'Mars')) push({ name: 'Chandra-Mangala Yoga', kind: 'wealth', planets: ['Moon', 'Mars'], rule: `Moon and Mars are together in ${RASHIS[P.Moon.sign]}.`, source: 'Phaladeepika ch. 6' });

  // Dhana Yoga: lords of 2/11 linked with lords of 5/9 (BPHS ch. 41)
  for (const w of [2, 11]) for (const t of [5, 9]) {
    const a = lordOfHouse(chart, w), b = lordOfHouse(chart, t);
    const c = a !== b && connection(chart, a, b);
    if (c) push({ name: 'Dhana Yoga', kind: 'wealth', planets: [a, b], rule: `${a} (lord of house ${w}) and ${b} (lord of house ${t}) are linked by ${c}.`, source: 'BPHS ch. 41' });
  }

  // Viparita Raj Yoga: lords of 6, 8, 12 placed in 6, 8 or 12 (BPHS ch. 39 v. 33-35)
  const VR = { 6: 'Harsha', 8: 'Sarala', 12: 'Vimala' };
  for (const h of DUSTHANA) {
    const l = lordOfHouse(chart, h);
    if (DUSTHANA.includes(P[l].house)) push({ name: `Viparita Raj Yoga (${VR[h]})`, kind: 'raj', planets: [l], rule: `${l}, lord of the ${h}th house, sits in the ${P[l].house}th house.`, source: 'BPHS ch. 39' });
  }

  // Neecha Bhanga (cancelled debilitation): debilitated planet whose sign lord is in a kendra from lagna or Moon (PD ch. 7)
  for (const pl of SEVEN) {
    if (dignity(pl, P[pl].sign) !== 'debilitated') continue;
    const dispositor = RASHI_LORD[P[pl].sign];
    const fromMoon = ((P[dispositor].sign - P.Moon.sign + 12) % 12) + 1;
    if (KENDRA.includes(P[dispositor].house) || KENDRA.includes(fromMoon)) {
      push({ name: 'Neecha Bhanga Raj Yoga', kind: 'raj', planets: [pl, dispositor], rule: `${pl} is debilitated, but its sign lord ${dispositor} is in a kendra, which cancels the debilitation.`, source: 'Phaladeepika ch. 7' });
    }
  }
  return out;
}

// --- Videsh (foreign) yoga indicators ---------------------------------------
// Common rules from Jataka texts as used in modern practice (12th = foreign
// lands, 9th = long journeys, 7th = travel/business abroad, 4th = homeland,
// Rahu = foreign influence, movable signs = movement).
export function videshFactors(chart) {
  const P = chart.planets;
  const f = [];
  const l12 = lordOfHouse(chart, 12), l9 = lordOfHouse(chart, 9), l1 = lordOfHouse(chart, 1), l4 = lordOfHouse(chart, 4), l7 = lordOfHouse(chart, 7);
  const add = (weight, text) => f.push({ weight, text });
  if ([9, 12].includes(P[l12].house)) add(2, `The 12th lord ${l12} sits in the ${P[l12].house}th house (foreign lands linked to ${P[l12].house === 9 ? 'long journeys' : 'itself'}).`);
  if ([12, 9].includes(P[l9].house) && l9 !== l12) add(2, `The 9th lord ${l9} sits in the ${P[l9].house}th house.`);
  if (P[l1].house === 12) add(2, `The ascendant lord ${l1} is in the 12th house, pointing to life away from the birthplace.`);
  if (P[l4].house === 12 || [6, 8].includes(P[l4].house)) add(1, `The 4th lord ${l4} (homeland) is in the ${P[l4].house}th house, which weakens ties to home.`);
  if ([7, 9, 12].includes(P[l7].house) && l7 !== l12) add(1, `The 7th lord ${l7} is in the ${P[l7].house}th house (travel through work or partnership).`);
  if ([9, 12, 7].includes(P.Rahu.house)) add(2, `Rahu, the significator of foreign things, is in the ${P.Rahu.house}th house.`);
  if (P.Moon.house === 12) add(1, 'The Moon is in the 12th house, a restless mind drawn to distant places.');
  const linked = connection(chart, l9, l12);
  if (linked && l9 !== l12) add(2, `The 9th lord ${l9} and 12th lord ${l12} are linked by ${linked}.`);
  if (planetsInHouse(chart, 12).length >= 2) add(1, `Several planets occupy the 12th house (${planetsInHouse(chart, 12).join(', ')}).`);
  const movable = [0, 3, 6, 9];
  if (movable.includes(chart.ascendantSign) && movable.includes(P[l1].sign)) add(1, `A movable ascendant (${RASHIS[chart.ascendantSign]}) with its lord also in a movable sign favours movement.`);
  const score = f.reduce((s, x) => s + x.weight, 0);
  const level = score >= 6 ? 'strong' : score >= 3 ? 'moderate' : score >= 1 ? 'mild' : 'none';
  return { factors: f, score, level, lord12: l12, lord9: l9 };
}

// --- Love & relationships ----------------------------------------------------
export function loveFactors(chart) {
  const P = chart.planets;
  const l5 = lordOfHouse(chart, 5), l7 = lordOfHouse(chart, 7);
  const venusD = dignity('Venus', P.Venus.sign);
  const pos = [], neg = [], notes = [];
  const c57 = l5 !== l7 && connection(chart, l5, l7);
  if (c57 || l5 === l7) pos.push(`The 5th lord (romance, ${l5}) and 7th lord (marriage, ${l7}) are ${c57 ? `linked by ${c57}` : 'the same planet'}: a classic sign of love leading to marriage.`);
  if (P[l5].house === 7 || P[l7].house === 5) pos.push(`${P[l5].house === 7 ? `The 5th lord ${l5} sits in the 7th house` : `The 7th lord ${l7} sits in the 5th house`}, joining romance and commitment.`);
  if (isStrong(venusD)) pos.push(`Venus, the planet of love, is ${DIGNITY_TEXT[venusD]} (${RASHIS[P.Venus.sign]}), giving charm and a rich love life.`);
  if (venusD === 'debilitated') neg.push(`Venus is debilitated in ${RASHIS[P.Venus.sign]}: high expectations in love; patience and realism help.`);
  if (conjunct(chart, 'Venus', 'Mars')) notes.push('Venus and Mars are together: strong attraction and passion.');
  if (aspectsHouse(chart, 'Jupiter', 7) || P.Jupiter.house === 7) pos.push('Jupiter blesses the 7th house, a protective influence on marriage.');
  if (P.Saturn.house === 7 || aspectsHouse(chart, 'Saturn', 7)) notes.push('Saturn influences the 7th house: commitment may come later in life, but tends to last.');
  if ([5, 7].includes(P.Rahu.house)) notes.push(`Rahu in the ${P.Rahu.house}th house: attraction to unconventional or cross-cultural partners.`);
  if ([5, 7].includes(P.Ketu.house)) neg.push(`Ketu in the ${P.Ketu.house}th house: a detached streak in relationships; conscious effort keeps closeness.`);
  if ([6, 8, 12].includes(P[l7].house)) neg.push(`The 7th lord ${l7} is in the ${P[l7].house}th house, which can bring delays or tests in marriage.`);
  if (P.Mars.house === 7) neg.push('Mars in the 7th house adds heat to partnerships; avoid needless arguments.');
  return { lord5: l5, lord7: l7, venus: { sign: P.Venus.sign, house: P.Venus.house, dignity: venusD }, positives: pos, challenges: neg, notes };
}

// --- Gemstones (traditional Navaratna; lagna, 5th and 9th lords — PD and later practice)
export const GEMS = {
  Sun: { stone: 'Ruby (Manik)', substitute: 'Red garnet', metal: 'Gold', finger: 'Ring finger', day: 'Sunday' },
  Moon: { stone: 'Pearl (Moti)', substitute: 'Moonstone', metal: 'Silver', finger: 'Little finger', day: 'Monday' },
  Mars: { stone: 'Red Coral (Moonga)', substitute: 'Carnelian', metal: 'Gold or copper', finger: 'Ring finger', day: 'Tuesday' },
  Mercury: { stone: 'Emerald (Panna)', substitute: 'Peridot', metal: 'Gold', finger: 'Little finger', day: 'Wednesday' },
  Jupiter: { stone: 'Yellow Sapphire (Pukhraj)', substitute: 'Citrine', metal: 'Gold', finger: 'Index finger', day: 'Thursday' },
  Venus: { stone: 'Diamond (Heera)', substitute: 'White sapphire or zircon', metal: 'Silver or platinum', finger: 'Middle or ring finger', day: 'Friday' },
  Saturn: { stone: 'Blue Sapphire (Neelam)', substitute: 'Amethyst', metal: 'Silver or panchdhatu', finger: 'Middle finger', day: 'Saturday' },
  Rahu: { stone: 'Hessonite (Gomed)', substitute: 'Orange zircon', metal: 'Silver', finger: 'Middle finger', day: 'Saturday' },
  Ketu: { stone: "Cat's Eye (Lehsunia)", substitute: 'Tiger’s eye', metal: 'Silver', finger: 'Little finger', day: 'Thursday' },
};

export function gemstoneAdvice(chart) {
  const roles = [
    { house: 1, role: 'Life stone', why: 'ascendant lord: health, confidence and overall direction' },
    { house: 5, role: 'Lucky stone', why: '5th lord: intelligence, creativity and good fortune' },
    { house: 9, role: 'Fortune stone', why: '9th lord: luck, blessings and higher purpose' },
  ];
  const seen = new Set();
  const recs = [];
  for (const r of roles) {
    const pl = lordOfHouse(chart, r.house);
    if (seen.has(pl)) { recs.find((x) => x.planet === pl).roles.push(r.role); continue; }
    seen.add(pl);
    const p = chart.planets[pl];
    const d = dignity(pl, p.sign);
    const caution = [];
    if (DUSTHANA.includes(p.house)) caution.push(`${pl} sits in the ${p.house}th house; try the stone on a trial basis first.`);
    const alsoRules = housesRuledBy(chart, pl).filter((h) => DUSTHANA.includes(h));
    if (alsoRules.length && r.house !== 1) caution.push(`${pl} also rules the ${alsoRules.join(' & ')}th house, so results can be mixed.`);
    recs.push({ planet: pl, roles: [r.role], why: r.why, dignity: d, house: p.house, ...GEMS[pl], caution });
  }
  // Stones to avoid: lords of 6, 8, 12 that rule no kendra/trikona (common practice)
  const avoid = [];
  for (const h of DUSTHANA) {
    const pl = lordOfHouse(chart, h);
    const good = housesRuledBy(chart, pl).some((x) => [1, 5, 9, 4, 7, 10].includes(x));
    if (!good && !seen.has(pl) && !avoid.some((a) => a.planet === pl)) avoid.push({ planet: pl, stone: GEMS[pl].stone, reason: `${pl} rules only difficult houses (${housesRuledBy(chart, pl).join(', ')}) for your ascendant.` });
  }
  return { recommendations: recs, avoid };
}

/** Short themes for each house, used in dasha predictions. */
export const HOUSE_THEMES = [
  'self, health and personal direction', 'money, family and speech', 'courage, effort, siblings and short travel',
  'home, mother, property and inner peace', 'children, studies, romance and creativity', 'work routines, health issues, debts and competition',
  'marriage, partnerships and public dealings', 'sudden changes, research, inheritance and transformation', 'luck, teachers, faith and long journeys',
  'career, status and public reputation', 'income, gains, friends and wishes fulfilled', 'expenses, foreign lands, sleep and spiritual release',
];

/** What a dasha lord brings, from its placement, rulership and dignity. */
export function dashaLordProfile(chart, lord) {
  const p = chart.planets[lord];
  const rules = housesRuledBy(chart, lord);
  const d = dignity(lord, p.sign);
  const tone = isStrong(d) ? 'strong' : d === 'debilitated' ? 'weak' : d === 'enemy' ? 'strained' : 'balanced';
  const goodHouse = [1, 2, 4, 5, 7, 9, 10, 11].includes(p.house);
  return {
    lord, house: p.house, sign: p.sign, dignity: d, tone, rules, retrograde: p.retrograde,
    placementTheme: HOUSE_THEMES[p.house - 1],
    ruledThemes: rules.map((h) => HOUSE_THEMES[h - 1]),
    favourable: (isStrong(d) || goodHouse) && !(d === 'debilitated' && DUSTHANA.includes(p.house)),
  };
}
