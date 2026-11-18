// Builds the nine reports from the engine. Every statement here comes from a
// calculation; the optional AI reading only explains these facts in prose.

import {
  RASHIS, allPositions, julianDay, lahiriAyanamsa, norm360,
  findYogas, videshFactors, loveFactors, gemstoneAdvice, dashaLordProfile, dignity, HOUSE_THEMES, DIGNITY_TEXT,
  lordOfHouse, housesRuledBy,
} from '../engine/index.js';
import { kundli, currentPeriod, doshas, ordinal } from './astro.js';
import { fmtDate } from './tz.js';

export const REPORT_TYPES = [
  { id: 'mangal', title: 'Mangal Dosh', tagline: 'Is Mars affecting marriage? With cancellations checked.', icon: 'mars' },
  { id: 'love', title: 'Love & Romance', tagline: 'Romance, marriage indications and your best periods for love.', icon: 'heart' },
  { id: 'saturn', title: 'Saturn & Sade Sati', tagline: 'Every Sade Sati and Dhaiya of your life, with dates.', icon: 'saturn' },
  { id: 'dasha', title: 'Dasha Prediction', tagline: 'What your current and coming planetary periods bring.', icon: 'wheel' },
  { id: 'gemstone', title: 'Gemstone Guide', tagline: 'Your life, lucky and fortune stones, and ones to avoid.', icon: 'gem' },
  { id: 'kalsarp', title: 'Kaal Sarp Dosh', tagline: 'Are all planets hemmed between Rahu and Ketu?', icon: 'snake' },
  { id: 'rajyoga', title: 'Raj Yog', tagline: 'Power, wealth and success combinations in your chart.', icon: 'crown' },
  { id: 'pitra', title: 'Pitra Dosh', tagline: 'Ancestral affliction to the Sun, with mitigations.', icon: 'sun' },
  { id: 'videsh', title: 'Videsh Yog', tagline: 'Foreign travel and settlement potential.', icon: 'plane' },
];

const sentence = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const factsOf = (r) => [
  `Verdict: ${r.verdict.label}`, r.summary,
  ...r.sections.flatMap((s) => [`${s.title}:`, ...(s.items ?? []).map((i) => `- ${i}`), ...(s.rows ?? []).map((row) => `- ${row.join(' | ')}`)]),
].join('\n');

export function buildReport(type, profile, now = new Date()) {
  const k = kundli(profile);
  const tz = profile.place.tz;
  const c = k.chart;
  const d = doshas(k, now);
  const meta = REPORT_TYPES.find((t) => t.id === type);
  let r;

  if (type === 'mangal') {
    const m = d.mangal;
    r = {
      verdict: m.present ? { label: `Manglik (${m.severity})`, tone: 'bad' } : m.cancelled ? { label: 'Present but cancelled', tone: 'warn' } : { label: 'Not Manglik', tone: 'good' },
      summary: `Mars is in ${RASHIS[c.planets.Mars.sign]}, in your ${ordinal(m.marsHouse)} house from the ascendant.`,
      sections: [
        { title: 'How it was checked', items: ['Mars in the 1st, 2nd, 4th, 7th, 8th or 12th house counted from the ascendant, the Moon and Venus (classical rule).'] },
        { title: 'Triggered from', items: m.triggers.length ? m.triggers.map((t) => `${t}`) : ['None of the three reference points'] },
        ...(m.raw ? [{ title: 'Cancellation factors found', items: m.cancellationFactors.length ? m.cancellationFactors : ['None'] }] : []),
      ],
    };
  }

  if (type === 'kalsarp') {
    const ks = d.kalsarp;
    r = {
      verdict: ks.present ? { label: ks.complete ? 'Complete Kaal Sarp' : 'Partial Kaal Sarp', tone: ks.complete ? 'bad' : 'warn' } : { label: 'No Kaal Sarp', tone: 'good' },
      summary: `Rahu is in ${ks.rahuSign} and Ketu in ${ks.ketuSign}. ${ks.hemmedCount} of the 7 planets fall on one side of their axis.`,
      sections: [
        { title: 'Planets on the hemmed side', items: ks.hemmedPlanets.length ? ks.hemmedPlanets : ['None'] },
        { title: 'Planets outside', items: ks.outsidePlanets.length ? ks.outsidePlanets : ['None (all seven are hemmed)'] },
        ...(ks.present ? [{ title: 'Direction', items: [ks.side === 'rahu-to-ketu' ? 'Planets lie from Rahu towards Ketu (Kaal Sarp proper).' : 'Planets lie from Ketu towards Rahu (sometimes called Kaal Amrit).'] }] : []),
      ],
    };
  }

  if (type === 'pitra') {
    const p = d.pitra;
    r = {
      verdict: p.present ? { label: `Present (${p.severity})`, tone: 'bad' } : p.cancelled ? { label: 'Present but mitigated', tone: 'warn' } : { label: 'Not present', tone: 'good' },
      summary: `The Sun (significator of father and ancestors) is in ${c.planets.Sun.signName}, ${ordinal(c.planets.Sun.house)} house. The 9th house (ancestors, father) is ${RASHIS[(c.ascendantSign + 8) % 12]}, ruled by ${lordOfHouse(c, 9)}.`,
      sections: [
        { title: 'Afflicting factors', items: p.factors.length ? p.factors : ['None found'] },
        ...(p.raw ? [{ title: 'Mitigating factors', items: p.cancellationFactors.length ? p.cancellationFactors : ['None'] }] : []),
      ],
    };
  }

  if (type === 'saturn') {
    const periods = saturnPeriods(c.planets.Moon.sign, k.birthDate, 100);
    const ss = d.sadeSati;
    const upcoming = periods.filter((x) => x.end > now);
    r = {
      verdict: ss.present ? { label: `Sade Sati: ${ss.phaseKey} phase`, tone: ss.phaseKey === 'peak' ? 'bad' : 'warn' } : { label: 'Not in Sade Sati now', tone: 'good' },
      summary: `Your Moon is in ${RASHIS[c.planets.Moon.sign]}. Saturn is now in ${ss.saturnSign}. Natal Saturn is in ${c.planets.Saturn.signName} in your ${ordinal(c.planets.Saturn.house)} house, ${DIGNITY_TEXT[dignity('Saturn', c.planets.Saturn.sign)]}.`,
      sections: [
        { title: 'Upcoming and current Saturn periods', rows: upcoming.slice(0, 6).map((x) => [x.label, `${fmtDate(x.start, tz)} – ${fmtDate(x.end, tz)}`]), head: ['Period', 'Dates'] },
        { title: 'All Sade Sati cycles in life', rows: sadeSatiCycles(periods).map((x, i) => [`Cycle ${i + 1}`, `${fmtDate(x.start, tz)} – ${fmtDate(x.end, tz)}`, x.end < now ? 'Completed' : x.start > now ? 'Upcoming' : 'Running now']), head: ['Cycle', 'Dates', 'Status'] },
        { title: 'What the phases mean', items: ['Rising: Saturn in the 12th from the Moon — expenses, sleep and letting go.', 'Peak: Saturn over the Moon — pressure on the mind and responsibilities; the most demanding phase.', 'Setting: Saturn in the 2nd from the Moon — money and family adjustments.', 'Dhaiya (Kantaka Shani): Saturn in the 4th or 8th from the Moon for about 2½ years.'] },
      ],
    };
  }

  if (type === 'dasha') {
    const cur = currentPeriod(k.dasha, now);
    const md = cur && dashaLordProfile(c, cur.mahadasha.lord);
    const ad = cur?.antardasha && dashaLordProfile(c, cur.antardasha.lord);
    const describe = (p) => `${p.lord} is in your ${ordinal(p.house)} house (${p.placementTheme}) in ${RASHIS[p.sign]}, ${DIGNITY_TEXT[p.dignity]}${p.retrograde && !['Rahu', 'Ketu'].includes(p.lord) ? ', retrograde' : ''}${p.rules.length ? `, and rules the ${p.rules.map(ordinal).join(' and ')} house${p.rules.length > 1 ? 's' : ''} (${p.ruledThemes.join('; ')})` : ''}.`;
    const nextADs = cur ? cur.mahadasha.antardashas.filter((a) => a.endDate > now).slice(0, 6) : [];
    const nextMD = k.dasha.mahadashas.find((m) => m.startDate > now);
    r = {
      verdict: cur ? { label: `${cur.mahadasha.lord} – ${cur.antardasha?.lord}`, tone: md?.favourable && ad?.favourable ? 'good' : md?.favourable || ad?.favourable ? 'neutral' : 'warn' } : { label: 'Outside 120-year cycle', tone: 'neutral' },
      summary: cur ? `You are in ${cur.mahadasha.lord} Mahadasha (until ${fmtDate(cur.mahadasha.endDate, tz)}) and ${cur.antardasha?.lord} Antardasha (until ${fmtDate(cur.antardasha.endDate, tz)}).` : '',
      sections: cur ? [
        { title: `Mahadasha lord: ${md.lord}`, items: [describe(md), `Overall tone: ${md.tone}.`] },
        { title: `Antardasha lord: ${ad.lord}`, items: [describe(ad), `Overall tone: ${ad.tone}.`] },
        { title: 'Coming antardashas', rows: nextADs.map((a) => { const p = dashaLordProfile(c, a.lord); return [`${cur.mahadasha.lord}–${a.lord}`, `${fmtDate(a.startDate, tz)} – ${fmtDate(a.endDate, tz)}`, sentence(p.placementTheme)]; }), head: ['Period', 'Dates', 'Focus'] },
        ...(nextMD ? [{ title: 'Next mahadasha', items: [`${nextMD.lord} Mahadasha begins ${fmtDate(nextMD.startDate, tz)}. ${describe(dashaLordProfile(c, nextMD.lord))}`] }] : []),
      ] : [],
    };
  }

  if (type === 'gemstone') {
    const g = gemstoneAdvice(c);
    r = {
      verdict: { label: g.recommendations[0].stone, tone: 'good' },
      summary: `For a ${RASHIS[c.ascendantSign]} ascendant, the stones of the ascendant, 5th and 9th lords are the traditional choices.`,
      sections: [
        { title: 'Recommended stones', rows: g.recommendations.map((x) => [`${x.roles.join(' + ')}: ${x.stone}`, `${x.planet} (${x.why})`, `${x.metal}, ${x.finger}, on a ${x.day}`, `Substitute: ${x.substitute}`]), head: ['Stone', 'Planet', 'How to wear', 'Budget option'] },
        { title: 'Cautions', items: g.recommendations.flatMap((x) => x.caution).length ? g.recommendations.flatMap((x) => x.caution) : ['No special cautions for these stones.'] },
        { title: 'Stones to avoid', items: g.avoid.length ? g.avoid.map((a) => `${a.stone}: ${a.reason}`) : ['None in particular.'] },
        { title: 'Before you buy', items: ['Use natural, untreated stones of reasonable clarity.', 'Wear on the planet’s day, ideally in the morning, after cleansing in raw milk or Ganga water.', 'Gemstones are a traditional remedy, not medical or financial advice.'] },
      ],
    };
  }

  if (type === 'rajyoga') {
    const ys = findYogas(c);
    const raj = ys.filter((y) => ['raj', 'mahapurusha'].includes(y.kind));
    r = {
      verdict: raj.length ? { label: `${raj.length} Raj Yog${raj.length > 1 ? 's' : ''} found`, tone: 'good' } : ys.length ? { label: 'Supportive yogas found', tone: 'neutral' } : { label: 'No major yogas', tone: 'neutral' },
      summary: `${ys.length} classical combination${ys.length === 1 ? '' : 's'} found for your ${RASHIS[c.ascendantSign]} ascendant.`,
      sections: [
        ...['raj', 'mahapurusha', 'wealth', 'auspicious'].map((kind) => ({
          title: { raj: 'Raj Yogas (power and status)', mahapurusha: 'Pancha Mahapurusha Yogas', wealth: 'Wealth yogas', auspicious: 'Other auspicious yogas' }[kind],
          rows: ys.filter((y) => y.kind === kind).map((y) => [y.name, y.rule, y.source]),
          head: ['Yoga', 'Why', 'Source'],
        })).filter((s) => s.rows.length),
        { title: 'When they give results', items: ['A yoga gives its strongest results during the dasha or antardasha of the planets that form it.'] },
      ],
    };
  }

  if (type === 'videsh') {
    const v = videshFactors(c);
    r = {
      verdict: { label: { strong: 'Strong Videsh Yog', moderate: 'Moderate Videsh Yog', mild: 'Mild indications', none: 'No clear Videsh Yog' }[v.level], tone: v.level === 'strong' ? 'good' : v.level === 'none' ? 'neutral' : 'warn' },
      summary: `The 12th house (foreign lands) is ${RASHIS[(c.ascendantSign + 11) % 12]}, ruled by ${v.lord12}; the 9th house (long journeys) is ruled by ${v.lord9}. Score ${v.score}.`,
      sections: [
        { title: 'Indications found', items: v.factors.length ? v.factors.map((f) => f.text) : ['None of the classical foreign-travel indications are present.'] },
        { title: 'Timing', items: [`Travel or settlement abroad is most likely during dashas of ${[...new Set([v.lord12, v.lord9, 'Rahu'])].join(', ')}.`] },
      ],
    };
  }

  if (type === 'love') {
    const L = loveFactors(c);
    const tree = k.dasha;
    const lovePlanets = [...new Set(['Venus', L.lord5, L.lord7])];
    const windows = [];
    for (const m of tree.mahadashas) for (const a of m.antardashas) {
      if (a.endDate < now || windows.length >= 5) continue;
      if (lovePlanets.includes(a.lord) || (lovePlanets.includes(m.lord) && lovePlanets.includes(a.lord))) windows.push([`${m.lord}–${a.lord}`, `${fmtDate(a.startDate, tz)} – ${fmtDate(a.endDate, tz)}`]);
    }
    r = {
      verdict: { label: L.positives.length > L.challenges.length ? 'Favourable for love' : L.challenges.length > L.positives.length ? 'Love needs patience' : 'Balanced', tone: L.positives.length > L.challenges.length ? 'good' : L.challenges.length > L.positives.length ? 'warn' : 'neutral' },
      summary: `Venus is in ${RASHIS[L.venus.sign]}, ${DIGNITY_TEXT[L.venus.dignity]}, in your ${ordinal(L.venus.house)} house. Romance is ruled by ${L.lord5} (5th lord) and marriage by ${L.lord7} (7th lord). Your Moon is in ${c.planets.Moon.signName}.`,
      sections: [
        { title: 'Strengths', items: L.positives.length ? L.positives : ['No special strengths stand out; ordinary, steady prospects.'] },
        { title: 'Challenges', items: L.challenges.length ? L.challenges : ['No significant challenges found.'] },
        ...(L.notes.length ? [{ title: 'Other notes', items: L.notes }] : []),
        { title: 'Best upcoming periods for love', rows: windows, head: ['Dasha period', 'Dates'] },
      ],
    };
  }

  r.facts = factsOf(r);
  return { ...meta, ...r };
}

/** Sade Sati (12th, 1st, 2nd from Moon) and Dhaiya (4th, 8th from Moon) windows from birth. */
export function saturnPeriods(moonSign, from, years = 100) {
  const DAY = 86400000;
  const satSign = (t) => {
    const jd = julianDay(new Date(t));
    return Math.floor(norm360(allPositions(jd).Saturn - lahiriAyanamsa(jd)) / 30) % 12;
  };
  const classify = (s) => {
    const off = ((s - moonSign + 12) % 12);
    if (off === 11) return ['sadesati', 'Sade Sati – rising'];
    if (off === 0) return ['sadesati', 'Sade Sati – peak'];
    if (off === 1) return ['sadesati', 'Sade Sati – setting'];
    if (off === 3) return ['dhaiya', 'Dhaiya (4th from Moon)'];
    if (off === 7) return ['dhaiya', 'Dhaiya (8th from Moon)'];
    return [null, null];
  };
  const refine = (a, b, sa) => { while (b - a > DAY / 4) { const m = (a + b) / 2; if (satSign(m) === sa) a = m; else b = m; } return b; };
  const out = [];
  const start = from.getTime(), end = start + years * 365.25 * DAY;
  let t = start, s = satSign(t), segStart = t;
  const step = 5 * DAY;
  while (t < end) {
    const t2 = t + step;
    const s2 = satSign(t2);
    if (s2 !== s) {
      const edge = refine(t, t2, s);
      const [kind, label] = classify(s);
      if (kind) out.push({ kind, label, start: new Date(segStart), end: new Date(edge) });
      segStart = edge; s = s2;
    }
    t = t2;
  }
  const [kind, label] = classify(s);
  if (kind) out.push({ kind, label, start: new Date(segStart), end: new Date(end) });
  // merge back-to-back segments with the same label (retrograde re-entries)
  const merged = [];
  for (const p of out) {
    const last = merged.at(-1);
    if (last && last.label === p.label && p.start - last.end < 2 * DAY) last.end = p.end; else merged.push({ ...p });
  }
  return merged;
}

/** Joins consecutive Sade Sati phases into whole ~7½-year cycles. */
export function sadeSatiCycles(periods) {
  const DAY = 86400000;
  const cycles = [];
  for (const p of periods) {
    if (p.kind !== 'sadesati') continue;
    const last = cycles.at(-1);
    // Saturn's retrograde loops can briefly leave and re-enter the zone; gaps under ~14 months are the same cycle.
    if (last && p.start - last.end < 420 * DAY) last.end = p.end; else cycles.push({ start: p.start, end: p.end });
  }
  return cycles;
}

export { HOUSE_THEMES, housesRuledBy };
