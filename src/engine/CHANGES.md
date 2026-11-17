# Engine changes in this web copy

This folder is a copy of the original engine; the original is kept unchanged elsewhere.
Every edit below is marked in the code with `[web fix]` or `[web addition]`,
so you can review or revert it. `npm test` cross-checks the results against
the independent `astronomy-engine` library (used only by the test, never by the app).

## Fixes to existing code

| File | What was wrong | Effect before the fix |
|---|---|---|
| `ephemeris.js` `planetPosition` | Orbital elements are J2000-referred; no precession to the equinox of date was applied. | Mercury–Saturn off by up to ~50′ (about 1°) for dates far from 2000. Now ≤ ~10′. |
| `dasha.js` `lordIndexForNakshatra` | Gave each lord 3 *consecutive* nakshatras (`floor(n/3) % 9`). The lords actually repeat every 9 nakshatras (`n % 9`), as your own `NAKSHATRA_LORD` table shows. | Wrong starting dasha for most charts, so every dasha date was wrong. Example: Moon in Uttara Ashadha started a Jupiter dasha instead of the Sun's. |
| `dasha.js` `vimshottari` | For the birth mahadasha, all 9 antardashas were squeezed into the remaining balance. | Wrong antardasha dates for the first mahadasha. Now laid out from the nominal start; the ones already over at birth are dropped. |
| `panchang.js` `panchang` | Nakshatra, yoga and Moon/Sun sign used tropical longitudes. | Nakshatra about 2 nakshatras off; yoga wrong. Now sidereal (Lahiri). |
| `panchang.js` karana | Mapping from index to name was scrambled. | Wrong karana names. Now uses the classical 60-karana sequence. |
| `panchang.js` vaara | Weekday taken in UTC. | Wrong day for early-morning times in India. Now local; the day page reads it at sunrise. |
| `matching.js` Varna | `VARNA.indexOf(...)` looked up a sign index, not a varna rank. | Random Varna points. Now ranks by `VARNA_ORDER`. |
| `matching.js` Bhakoot | Bad pairs were 2/12, 5/8, 6/7. | Classical bad pairs are 2/12, 5/9, 6/8 (7/7 is good). |
| `matching.js` Nadi | Plain Aadi-Madhya-Antya cycle. | Classical order zig-zags (Aadi, Madhya, Antya, Antya, Madhya, Aadi, …). |
| `matching.js` Vashya | Four groups made by counting signs in a repeating pattern. | Switched (at your request) to the classical five groups, incl. half-signs of Sagittarius and Capricorn, with the standard points table. |
| `matching.js` Tara | One direction only; 1-3-5-7-9 treated as good; 3 points or 0. | Switched to classical: both directions, 1.5 points each; 3rd, 5th and 7th stars are the unfavourable ones. |
| `matching.js` Graha Maitri | One side only (5 / 3 / 0). | Switched to classical: both sides combined (5 / 4 / 3 / 1 / ½ / 0). |
| `constants.js` `PLANET_FRIENDS` Mars | Mars listed Venus and Saturn as enemies, Mercury as neutral. | Classical (BPHS ch. 3): Venus and Saturn neutral, Mercury enemy. Only used by Graha Maitri. |
| `dosha.js` Kaal Sarp | Only the Rahu→Ketu half was checked. | Missed charts where all planets sit in the Ketu→Rahu half. |

## Left as you designed them (not classical-standard; change if you want)

- Mangal dosha needs 2+ cancellation factors to count as cancelled; partial Kaal Sarp at 5+ planets.
- Rahu/Ketu use the mean node.

## New files

- `divisional.js` — Navamsa (D9).
- `panchang-day.js` — sunrise/sunset, limb end times, lunar month, samvat,
  Rahu Kaal, Yamaganda, Gulika, Abhijit, Brahma muhurta, Choghadiya.
- `index.js` — also exports the two files above.
