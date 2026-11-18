// Cross-checks the web engine against astronomy-engine (independent reference,
// used ONLY here for testing — the app itself never imports it).
import * as E from '../src/engine/index.js';
import { zonedToUtc } from '../src/lib/tz.js';
import * as A from 'astronomy-engine';

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`); cond ? pass++ : fail++; };
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

// 1. planets within 15 arcmin, 1940-2040
let worst = 0;
for (let y = 1940; y <= 2040; y += 2) for (const mo of [0, 4, 8]) {
  const d = new Date(Date.UTC(y, mo, 9, 5));
  const mine = E.allPositions(E.julianDay(d));
  for (const b of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) {
    const r = A.RotateVector(A.Rotation_EQJ_ECT(d), A.GeoVector(A.Body[b], d, true));
    worst = Math.max(worst, angDiff(mine[b], Math.atan2(r.y, r.x) * 180 / Math.PI));
  }
  worst = Math.max(worst, angDiff(mine.Sun, A.SunPosition(d).elon), angDiff(mine.Moon, A.EclipticGeoMoon(d).lon));
}
ok('Planet longitudes within 15′ of reference (1940–2040)', worst * 60 < 15, `worst ${(worst * 60).toFixed(1)}′`);

// 2. sunrise/sunset within 2 minutes
let worstMin = 0;
const places = [[28.61, 77.21, 'Asia/Kolkata'], [19.07, 72.88, 'Asia/Kolkata'], [51.5, -0.12, 'Europe/London'], [-33.87, 151.2, 'Australia/Sydney'], [40.71, -74.0, 'America/New_York']];
for (const [lat, lon, tz] of places) for (const ds of ['2026-01-15', '2026-06-21', '2026-11-18']) {
  const [y, m, d] = ds.split('-').map(Number);
  const start = zonedToUtc(y, m, d, 0, 0, tz);
  const { sunrise, sunset } = E.sunTimes(start, lat, lon);
  const obs = new A.Observer(lat, lon, 0);
  const rr = A.SearchRiseSet(A.Body.Sun, obs, +1, start, 1).date;
  const ss = A.SearchRiseSet(A.Body.Sun, obs, -1, start, 1).date;
  worstMin = Math.max(worstMin, Math.abs(sunrise - rr) / 60000, Math.abs(sunset - ss) / 60000);
}
ok('Sunrise/sunset within 2 min of reference', worstMin < 2, `worst ${worstMin.toFixed(2)} min`);

// 3. tithi end = Moon-Sun elongation multiple of 12° (check against reference)
const dp = E.dayPanchang('2026-11-18', 28.61, 77.21, 'Asia/Kolkata');
const el = A.PairLongitude(A.Body.Moon, A.Body.Sun, dp.tithi.endsAt);
const off = Math.min(el % 12, 12 - (el % 12));
ok('Tithi end time lands on a 12° elongation boundary', off < 0.05, `${dp.tithi.paksha} ${dp.tithi.name} ends ${dp.tithi.endsAt.toISOString()}, off by ${(off * 60).toFixed(1)}′`);

// 4. new moon search vs reference
const nm = A.SearchMoonPhase(0, new Date('2026-11-01T00:00Z'), 40).date;
const lm = E.lunarMonth(new Date(nm.getTime() + 86400000 * 3));
ok('New-moon search within 10 min of reference', Math.abs(lm.newMoon - nm) / 60000 < 10, `${lm.newMoon.toISOString()} vs ${nm.toISOString()} → month ${lm.name}`);

// 5. nakshatra is sidereal: Moon sidereal lon consistent
const p = E.panchang(new Date('2026-11-18T06:00Z'));
const moonSid = (A.EclipticGeoMoon(new Date('2026-11-18T06:00Z')).lon - p.ayanamsa + 360) % 360;
ok('Panchang nakshatra uses sidereal Moon', Math.floor(moonSid / (360 / 27)) === p.nakshatra.index, `${p.nakshatra.name} pada ${p.nakshatra.pada}`);

// 6. dasha: antardashas tile each mahadasha with no gaps, birth one clipped
const chart = E.buildChart({ birthDate: new Date('1995-06-15T04:30:00Z'), latitude: 28.61, longitude: 77.21 });
const tree = E.vimshottari(chart.planets.Moon.longitude, chart.birthDate);
let gaps = 0;
for (const md of tree.mahadashas) {
  if (md.antardashas[0].startDate.getTime() !== md.startDate.getTime()) gaps++;
  if (Math.abs(md.antardashas.at(-1).endDate - md.endDate) > 1000) gaps++;
  for (let i = 1; i < md.antardashas.length; i++) if (md.antardashas[i].startDate.getTime() !== md.antardashas[i - 1].endDate.getTime()) gaps++;
}
ok('Antardashas tile every mahadasha exactly', gaps === 0, `birth MD ${tree.mahadashas[0].lord}: ${tree.mahadashas[0].antardashas.length} antardashas remain after birth`);

// 6b. birth dasha lord = lord of the Moon's nakshatra, for every nakshatra
let lordMismatch = 0;
for (let n = 0; n < 27; n++) {
  const t = E.vimshottari(n * (360 / 27) + 1, new Date('2000-01-01T00:00Z'));
  if (t.startingLord !== E.NAKSHATRA_LORD[n]) lordMismatch++;
}
ok('Birth dasha lord matches the Moon nakshatra lord (all 27)', lordMismatch === 0, `${lordMismatch} mismatches`);

// 6c. balance: Moon at the very start of a nakshatra gets (almost) the full period
const fresh = E.vimshottari(0.0001, new Date('2000-01-01T00:00Z'));
ok('Moon at 0° Ashwini → ~7 years of Ketu', Math.abs(fresh.balanceYears - 7) < 0.001);

// 7. navamsa rule spot checks (BPHS): 1° Aries -> Aries, 1° Taurus -> Capricorn, 1° Gemini -> Libra
ok('Navamsa: 1° Aries→Aries, 1° Taurus→Capricorn, 1° Gemini→Libra',
  E.navamsaSign(1) === 0 && E.navamsaSign(31) === 9 && E.navamsaSign(61) === 6);

// 8. matching: same nakshatra → Nadi 0; 7/7 bhakoot gets 7
const m1 = E.ashtakoot({ sign: 0, nakshatra: 0 }, { sign: 0, nakshatra: 0 });
const m2 = E.ashtakoot({ sign: 0, nakshatra: 0 }, { sign: 6, nakshatra: 14 });
ok('Ashtakoot: same nakshatra has Nadi dosha; 1/7 signs get full Bhakoot', m1.kootas.nadi.points === 0 && m2.kootas.bhakoot.points === 7);

// 9. Graha Maitri — both-sided table (standard printed values)
// Moon-sign lords: Aries=Mars, Taurus=Venus, Gemini=Mercury, Cancer=Moon, Leo=Sun, Sagittarius=Jupiter, Capricorn=Saturn
const gm = (gs, bs) => E.ashtakoot({ sign: gs, nakshatra: 0 }, { sign: bs, nakshatra: 0 }).kootas.grahaMaitri.points;
const gmCases = [
  [4, 2, 4, 'Sun–Mercury'], [3, 2, 1, 'Moon–Mercury'], [0, 1, 3, 'Mars–Venus'], [0, 9, 0.5, 'Mars–Saturn'],
  [4, 1, 0, 'Sun–Venus'], [8, 9, 3, 'Jupiter–Saturn'], [2, 9, 4, 'Mercury–Saturn'], [3, 1, 0.5, 'Moon–Venus'],
];
const gmBad = gmCases.filter(([g, b, want]) => gm(g, b) !== want).map(([, , want, n]) => `${n} want ${want}`);
ok('Graha Maitri matches the standard table (8 pairs)', gmBad.length === 0, gmBad.join('; '));

// 10. Vashya groups incl. half-signs
const va = (g, b) => E.ashtakoot(g, b).kootas.vashya;
const v1 = va({ sign: 8, nakshatra: 0, longitude: 245 }, { sign: 8, nakshatra: 0, longitude: 260 }); // Sag 5° (human) vs Sag 20° (four-footed)
const v2 = va({ sign: 4, nakshatra: 0 }, { sign: 7, nakshatra: 0 }); // Leo (wild) vs Scorpio (insect)
ok('Vashya: Sagittarius halves differ; Leo–Scorpio scores 0',
  v1.groom === 'Manava' && v1.bride === 'Chatushpada' && v1.points === 1 && v2.points === 0, `${v1.groom}/${v1.bride}=${v1.points}`);

// 11. Tara both ways: Ashwini(0)→Krittika(2) is the 3rd star (bad), Krittika→Ashwini is the 26th (26%9=8, good) → 1.5
const tr = E.ashtakoot({ sign: 0, nakshatra: 0 }, { sign: 0, nakshatra: 2 }).kootas.tara;
ok('Tara scores each direction separately (1.5 + 0)', tr.points === 1.5 && !tr.groomToBride && tr.brideToGroom);

// 12. Reports: Sade Sati for a Sagittarius Moon ran Nov 2014 – Jan 2023 (Lahiri, widely published)
const { saturnPeriods, sadeSatiCycles, buildReport, REPORT_TYPES } = await import('../src/lib/reports.js');
const cyc = sadeSatiCycles(saturnPeriods(8, new Date('1990-01-01T00:00Z'), 40)).find((c) => c.start.getUTCFullYear() === 2014);
ok('Sade Sati (Sagittarius Moon) Nov 2014 – Jan 2023', cyc && cyc.start.getUTCMonth() === 10 && cyc.end.getUTCFullYear() === 2023 && cyc.end.getUTCMonth() === 0,
  cyc ? `${cyc.start.toISOString().slice(0, 10)} → ${cyc.end.toISOString().slice(0, 10)}` : 'not found');

// 13. Yogas: Taurus ascendant → Saturn is yogakaraka (rules 9 & 10); Venus exalted in Pisces in a kendra → Malavya
const fake = (asc, pl) => ({ ascendantSign: asc, planets: Object.fromEntries(Object.entries(pl).map(([n, s]) => [n, { sign: s, house: ((s - asc + 12) % 12) + 1 }])) });
const base = { Sun: 0, Moon: 3, Mars: 5, Mercury: 0, Jupiter: 8, Venus: 11, Saturn: 4, Rahu: 2, Ketu: 8 };
const y1 = E.findYogas(fake(1, base)).map((y) => y.name);
const y2 = E.findYogas(fake(2, base)).map((y) => y.name);
ok('Yogakaraka for Taurus; Malavya for exalted Venus in a kendra', y1.includes('Raj Yoga (Yogakaraka)') && y2.includes('Malavya Yoga'), `${y1.length} / ${y2.length} yogas`);

// 14. Gemstones: Gemini ascendant life stone is Emerald (Mercury)
ok('Gemini ascendant life stone = Emerald', E.gemstoneAdvice(fake(2, base)).recommendations[0].stone.startsWith('Emerald'));

// 15. All nine reports build without errors
const prof = { id: 't', name: 'T', gender: 'male', date: '2001-04-04', time: '11:14', place: { name: 'Delhi', lat: 28.59, lon: 77.05, tz: 'Asia/Kolkata' } };
let built = 0; for (const t of REPORT_TYPES) { const r = buildReport(t.id, prof); if (r.verdict && r.facts) built++; }
ok('All nine reports build', built === 9, `${built}/9`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
