// ---------------------------------------------------------------------------
// Traditional Vedic reference tables (public domain — centuries old)
// ---------------------------------------------------------------------------

// 27 Nakshatras with their ruling planet (lord)
export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

export const NAKSHATRA_LORD = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun',
  'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury',
];

// 12 Rashis (zodiac signs) with their lord
export const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const RASHI_LORD = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];

// Sanskrit names (commonly used on charts)
export const RASHI_SANSKRIT = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

export const NAKSHATRA_SANSKRIT = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Phalguni', 'U.Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Ashadha', 'U.Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Bhadrapada', 'U.Bhadrapada', 'Revati',
];

// Vimshottari dasha lords and their year lengths (total = 120 years)
export const VIMSHOTTARI = [
  { lord: 'Ketu', years: 7 },
  { lord: 'Venus', years: 20 },
  { lord: 'Sun', years: 6 },
  { lord: 'Moon', years: 10 },
  { lord: 'Mars', years: 7 },
  { lord: 'Rahu', years: 18 },
  { lord: 'Jupiter', years: 16 },
  { lord: 'Saturn', years: 19 },
  { lord: 'Mercury', years: 17 },
];

// Ashtakoot kootas and their maximum points (total 36)
export const KOOTAS = [
  { key: 'varna', points: 1 },
  { key: 'vashya', points: 2 },
  { key: 'tara', points: 3 },
  { key: 'yoni', points: 4 },
  { key: 'grahaMaitri', points: 5 },
  { key: 'gana', points: 6 },
  { key: 'bhakoot', points: 7 },
  { key: 'nadi', points: 8 },
];

// Gana classification of each nakshatra (index-aligned with NAKSHATRAS)
// Deva (9), Manushya (8), Rakshasa (10)
export const GANA = [
  'Deva', 'Manushya', 'Rakshasa', 'Manushya', 'Deva', 'Rakshasa',
  'Deva', 'Deva', 'Rakshasa', 'Rakshasa', 'Manushya', 'Manushya',
  'Deva', 'Rakshasa', 'Deva', 'Rakshasa', 'Deva', 'Rakshasa',
  'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa', 'Rakshasa',
  'Manushya', 'Rakshasa', 'Deva',
];

// Varna (caste) of each rashi — Brahmin/Kshatriya/Vaishya/Shudra
// index-aligned with RASHIS
export const VARNA = [
  'Kshatriya', 'Vaishya', 'Shudra', 'Brahmin', 'Brahmin', 'Shudra',
  'Vaishya', 'Kshatriya', 'Kshatriya', 'Vaishya', 'Shudra', 'Brahmin',
];

// Planet relationships (friend / neutral / enemy) for Graha Maitri
export const PLANET_FRIENDS = {
  Sun:     { friends: ['Moon', 'Mars', 'Jupiter'], neutral: ['Mercury'], enemies: ['Venus', 'Saturn'] },
  Moon:    { friends: ['Sun', 'Mercury'], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'], enemies: [] },
  // [web fix] Classical (BPHS ch. 3): Mars is neutral to Venus and Saturn and
  // hostile to Mercury. Was neutral: Mercury, enemies: Venus, Saturn.
  Mars:    { friends: ['Sun', 'Moon', 'Jupiter'], neutral: ['Venus', 'Saturn'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], neutral: ['Mars', 'Jupiter', 'Saturn'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], neutral: ['Saturn'], enemies: ['Mercury', 'Venus'] },
  Venus:   { friends: ['Mercury', 'Saturn'], neutral: ['Mars', 'Jupiter'], enemies: ['Sun', 'Moon'] },
  Saturn:  { friends: ['Mercury', 'Venus'], neutral: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] },
  Rahu:    { friends: ['Venus', 'Saturn', 'Mercury'], neutral: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] },
  Ketu:    { friends: ['Venus', 'Saturn', 'Mercury'], neutral: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] },
};
