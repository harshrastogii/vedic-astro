// ---------------------------------------------------------------------------
// Vimshottari Dasha — 120-year cycle, lord-by-lord
// Balance is computed from the Moon's nakshatra at birth.
// ---------------------------------------------------------------------------

import { VIMSHOTTARI, NAKSHATRAS } from './constants.js';
import { nakshatraOf } from './chart.js';

const TOTAL_YEARS = 120;
const NAK_SPAN = 360 / 27;
const MS_PER_YEAR = 365.2425 * 24 * 3600 * 1000;

/** Find the index in VIMSHOTTARI of the lord owning a nakshatra. */
function lordIndexForNakshatra(nakIdx) {
  // [web fix] The nine lords repeat every nine nakshatras (Ashwini Ketu,
  // Bharani Venus, Krittika Sun, … Magha Ketu again), matching NAKSHATRA_LORD.
  // Was Math.floor(nakIdx / 3) % 9, which gave the wrong starting dasha for
  // most Moon positions and shifted the whole timeline.
  return nakIdx % 9;
}

/**
 * Compute the full Vimshottari dasha tree for a Moon position.
 *
 * @param {number} moonLongitude  sidereal longitude of the Moon (degrees)
 * @param {Date}   birthDate      birth moment
 * @returns {{mahadashas: Array}}
 */
export function vimshottari(moonLongitude, birthDate) {
  const nak = nakshatraOf(moonLongitude);
  const withinNak = moonLongitude % NAK_SPAN; // degrees into the nakshatra
  const fractionRemaining = 1 - withinNak / NAK_SPAN;

  const startIdx = lordIndexForNakshatra(nak);
  const startLord = VIMSHOTTARI[startIdx];
  const balanceYears = startLord.years * fractionRemaining;

  const t0 = birthDate.getTime();

  const mahadashas = [];
  let cursor = t0;
  // First (balance) mahadasha is partial
  for (let i = 0; i < 9; i++) {
    const entry = VIMSHOTTARI[(startIdx + i) % 9];
    const isFirst = i === 0;
    const fullYears = entry.years;
    const years = isFirst ? balanceYears : fullYears;
    const end = cursor + years * MS_PER_YEAR;

    const md = {
      lord: entry.lord,
      startDate: new Date(cursor),
      endDate: new Date(end),
      years,
      partial: isFirst,
      antardashas: [],
    };

    // Antardashas: each sub-lord gets a share proportional to its own
    // year-value over the full 120-year cycle, applied to the FULL length of
    // the mahadasha.
    // [web fix] For the birth (balance) mahadasha the antardashas are laid out
    // from its nominal start (before birth); the ones that had already ended
    // at birth are dropped and the running one is clipped to start at birth.
    // Previously all nine were compressed into the balance period.
    const nominalStart = end - fullYears * MS_PER_YEAR;
    let subCursor = nominalStart;
    for (let j = 0; j < 9; j++) {
      const sub = VIMSHOTTARI[(startIdx + i + j) % 9];
      const subYears = fullYears * (sub.years / TOTAL_YEARS);
      const subEnd = subCursor + subYears * MS_PER_YEAR;
      if (subEnd > cursor) {
        const start = Math.max(subCursor, cursor);
        md.antardashas.push({
          lord: sub.lord,
          startDate: new Date(start),
          endDate: new Date(subEnd),
          years: (subEnd - start) / MS_PER_YEAR,
          nominalStart: new Date(subCursor),
          nominalYears: subYears,
          partial: start !== subCursor,
        });
      }
      subCursor = subEnd;
    }
    md.nominalStart = new Date(nominalStart);

    mahadashas.push(md);
    cursor = end;
  }

  return {
    nakshatra: nak,
    nakshatraName: NAKSHATRAS[nak],
    startingLord: startLord.lord,
    balanceYears,
    mahadashas,
  };
}

/**
 * [web addition] Pratyantar dashas (third level) inside one antardasha.
 * Same proportional rule one level down, starting with the antardasha lord;
 * laid out from the antardasha's nominal start and clipped at birth.
 */
export function pratyantardashas(ad) {
  const startIdx = VIMSHOTTARI.findIndex((v) => v.lord === ad.lord);
  const nominalStart = (ad.nominalStart ?? ad.startDate).getTime();
  const nominalYears = ad.nominalYears ?? ad.years;
  const clipFrom = ad.startDate.getTime();
  const out = [];
  let cursor = nominalStart;
  for (let k = 0; k < 9; k++) {
    const p = VIMSHOTTARI[(startIdx + k) % 9];
    const end = cursor + nominalYears * (p.years / TOTAL_YEARS) * MS_PER_YEAR;
    if (end > clipFrom) {
      out.push({ lord: p.lord, startDate: new Date(Math.max(cursor, clipFrom)), endDate: new Date(end) });
    }
    cursor = end;
  }
  return out;
}

/** Which mahadasha + antardasha was running at a given moment. */
export function periodAt(tree, when) {
  const t = when.getTime();
  for (const md of tree.mahadashas) {
    const s = md.startDate.getTime(), e = md.endDate.getTime();
    if (t >= s && t < e) {
      const ad = md.antardashas.find((a) => {
        const as = a.startDate.getTime(), ae = a.endDate.getTime();
        return t >= as && t < ae;
      });
      return { mahadasha: md, antardasha: ad ?? null };
    }
  }
  return null;
}
