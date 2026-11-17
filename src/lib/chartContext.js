// Turns a profile's computed chart into a compact text summary for the AI.
// Everything here comes from the local engine; the AI never calculates positions itself.

import { kundli, currentPeriod, doshas, PLANET_ORDER, fmtDeg, ordinal } from './astro.js';
import {
  RASHIS, RASHI_LORD, NAKSHATRAS, nakshatraOf, padaOf, dayPanchang, pratyantardashas,
  allPositions, julianDay, lahiriAyanamsa, norm360,
} from '../engine/index.js';
import { fmtDate, fmtDateTime, todayIn } from './tz.js';

export function chartContext(profile, now = new Date()) {
  if (!profile) return '';
  const k = kundli(profile);
  const { chart, d9, dasha } = k;
  const tz = profile.place.tz;
  const L = [];

  L.push(`Name: ${profile.name} (${profile.gender})`);
  L.push(`Birth: ${fmtDateTime(k.birthDate, tz)} (${tz}), ${profile.place.name} (${profile.place.lat.toFixed(2)}, ${profile.place.lon.toFixed(2)})`);
  L.push(`Today: ${fmtDate(now, tz, { weekday: 'long' })}`);
  L.push(`Ayanamsa (Lahiri): ${fmtDeg(chart.ayanamsa)}`);
  L.push('');

  const asc = chart.ascendant;
  L.push(`ASCENDANT: ${RASHIS[chart.ascendantSign]} ${fmtDeg(asc % 30)}, nakshatra ${NAKSHATRAS[nakshatraOf(asc)]} pada ${padaOf(asc)}, lord ${RASHI_LORD[chart.ascendantSign]}`);
  L.push('PLANETS (sidereal, whole-sign houses):');
  for (const n of PLANET_ORDER) {
    const p = chart.planets[n];
    const retro = p.retrograde && n !== 'Rahu' && n !== 'Ketu' ? ', retrograde' : '';
    L.push(`- ${n}: ${p.signName} ${fmtDeg(p.degree)}, ${ordinal(p.house)} house, ${p.nakshatraName} pada ${p.pada} (nakshatra lord ${p.nakshatraLord}), sign lord ${p.signLord}${retro}; navamsa ${d9.planets[n].signName}`);
  }
  L.push(`Navamsa ascendant: ${d9.ascendantSignName}`);
  L.push('HOUSES:');
  chart.houseToSign.forEach((s, i) => {
    const occ = PLANET_ORDER.filter((n) => chart.planets[n].sign === s);
    L.push(`- ${ordinal(i + 1)}: ${RASHIS[s]} (lord ${RASHI_LORD[s]})${occ.length ? `, contains ${occ.join(', ')}` : ''}`);
  });
  L.push('');

  // Dasha
  const cur = currentPeriod(dasha, now);
  L.push(`VIMSHOTTARI DASHA (birth nakshatra ${dasha.nakshatraName}, balance ${dasha.startingLord} ${dasha.balanceYears.toFixed(2)} yrs):`);
  for (const md of dasha.mahadashas) {
    const mark = cur && md === cur.mahadasha ? '  <- current' : '';
    L.push(`- ${md.lord} mahadasha: ${fmtDate(md.startDate, tz)} to ${fmtDate(md.endDate, tz)}${mark}`);
  }
  if (cur) {
    L.push(`Antardashas in current ${cur.mahadasha.lord} mahadasha:`);
    for (const ad of cur.mahadasha.antardashas) {
      const mark = ad === cur.antardasha ? '  <- current' : '';
      L.push(`  - ${cur.mahadasha.lord}/${ad.lord}: ${fmtDate(ad.startDate, tz)} to ${fmtDate(ad.endDate, tz)}${mark}`);
    }
    if (cur.antardasha) {
      L.push(`Pratyantar dashas in current ${cur.mahadasha.lord}/${cur.antardasha.lord}:`);
      for (const pd of pratyantardashas(cur.antardasha)) {
        const mark = cur.pratyantar && pd.startDate.getTime() === cur.pratyantar.startDate.getTime() ? '  <- current' : '';
        L.push(`  - ${pd.lord}: ${fmtDate(pd.startDate, tz)} to ${fmtDate(pd.endDate, tz)}${mark}`);
      }
    }
  }
  L.push('');

  // Doshas
  const d = doshas(k, now);
  L.push('DOSHAS:');
  L.push(`- Mangal: ${d.mangal.present ? `present (${d.mangal.severity}), triggered from ${d.mangal.triggers.join(', ')}` : d.mangal.cancelled ? `present but cancelled (${d.mangal.cancellationFactors.join('; ')})` : 'not present'}`);
  L.push(`- Kaal Sarp: ${d.kalsarp.present ? `${d.kalsarp.complete ? 'complete' : 'partial'} (${d.kalsarp.hemmedCount}/7 on one side)` : 'not present'}`);
  L.push(`- Pitra: ${d.pitra.present ? `present (${d.pitra.factors.join('; ')})` : 'not present'}`);
  L.push(`- Sade Sati: ${d.sadeSati.present ? d.sadeSati.phase : 'not running'} (natal Moon ${d.sadeSati.moonSign}, Saturn now in ${d.sadeSati.saturnSign})`);
  L.push('');

  // Current transits
  const jd = julianDay(now);
  const ay = lahiriAyanamsa(jd);
  const pos = allPositions(jd);
  L.push('CURRENT TRANSITS (sidereal sign, house counted from natal ascendant / from natal Moon):');
  for (const n of PLANET_ORDER) {
    const s = Math.floor(norm360(pos[n] - ay) / 30) % 12;
    const fromAsc = ((s - chart.ascendantSign + 12) % 12) + 1;
    const fromMoon = ((s - chart.planets.Moon.sign + 12) % 12) + 1;
    L.push(`- ${n}: ${RASHIS[s]} (${ordinal(fromAsc)} from ascendant, ${ordinal(fromMoon)} from Moon)`);
  }
  L.push('');

  // Today's panchang at the birth place's timezone
  const p = dayPanchang(todayIn(tz), profile.place.lat, profile.place.lon, tz);
  L.push(`TODAY'S PANCHANG (${profile.place.name}): ${p.tithi.paksha} ${p.tithi.name}, nakshatra ${p.nakshatra.name}, yoga ${p.yoga.name}, karana ${p.karana.name}, ${p.vaara.name}; lunar month ${p.lunarMonth.name}`);

  return L.join('\n');
}
