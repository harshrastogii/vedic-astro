// Place lookup. A built-in list works offline; online search uses the free
// Open-Meteo geocoding API (no key), which also returns the IANA timezone.

export const CITIES = [
  ['New Delhi, India', 28.6139, 77.209, 'Asia/Kolkata'],
  ['Mumbai, India', 19.076, 72.8777, 'Asia/Kolkata'],
  ['Kolkata, India', 22.5726, 88.3639, 'Asia/Kolkata'],
  ['Chennai, India', 13.0827, 80.2707, 'Asia/Kolkata'],
  ['Bengaluru, India', 12.9716, 77.5946, 'Asia/Kolkata'],
  ['Hyderabad, India', 17.385, 78.4867, 'Asia/Kolkata'],
  ['Ahmedabad, India', 23.0225, 72.5714, 'Asia/Kolkata'],
  ['Pune, India', 18.5204, 73.8567, 'Asia/Kolkata'],
  ['Jaipur, India', 26.9124, 75.7873, 'Asia/Kolkata'],
  ['Lucknow, India', 26.8467, 80.9462, 'Asia/Kolkata'],
  ['Varanasi, India', 25.3176, 82.9739, 'Asia/Kolkata'],
  ['Patna, India', 25.5941, 85.1376, 'Asia/Kolkata'],
  ['Bhopal, India', 23.2599, 77.4126, 'Asia/Kolkata'],
  ['Chandigarh, India', 30.7333, 76.7794, 'Asia/Kolkata'],
  ['Amritsar, India', 31.634, 74.8723, 'Asia/Kolkata'],
  ['Dehradun, India', 30.3165, 78.0322, 'Asia/Kolkata'],
  ['Ujjain, India', 23.1765, 75.7885, 'Asia/Kolkata'],
  ['Indore, India', 22.7196, 75.8577, 'Asia/Kolkata'],
  ['Nagpur, India', 21.1458, 79.0882, 'Asia/Kolkata'],
  ['Surat, India', 21.1702, 72.8311, 'Asia/Kolkata'],
  ['Kochi, India', 9.9312, 76.2673, 'Asia/Kolkata'],
  ['Thiruvananthapuram, India', 8.5241, 76.9366, 'Asia/Kolkata'],
  ['Guwahati, India', 26.1445, 91.7362, 'Asia/Kolkata'],
  ['Bhubaneswar, India', 20.2961, 85.8245, 'Asia/Kolkata'],
  ['Kathmandu, Nepal', 27.7172, 85.324, 'Asia/Kathmandu'],
  ['Dhaka, Bangladesh', 23.8103, 90.4125, 'Asia/Dhaka'],
  ['Karachi, Pakistan', 24.8607, 67.0011, 'Asia/Karachi'],
  ['Colombo, Sri Lanka', 6.9271, 79.8612, 'Asia/Colombo'],
  ['Dubai, UAE', 25.2048, 55.2708, 'Asia/Dubai'],
  ['Singapore', 1.3521, 103.8198, 'Asia/Singapore'],
  ['London, UK', 51.5074, -0.1278, 'Europe/London'],
  ['New York, USA', 40.7128, -74.006, 'America/New_York'],
  ['San Francisco, USA', 37.7749, -122.4194, 'America/Los_Angeles'],
  ['Chicago, USA', 41.8781, -87.6298, 'America/Chicago'],
  ['Toronto, Canada', 43.6532, -79.3832, 'America/Toronto'],
  ['Sydney, Australia', -33.8688, 151.2093, 'Australia/Sydney'],
  ['Melbourne, Australia', -37.8136, 144.9631, 'Australia/Melbourne'],
  ['Darwin, Australia', -12.4634, 130.8456, 'Australia/Darwin'],
  ['Perth, Australia', -31.9505, 115.8605, 'Australia/Perth'],
  ['Auckland, New Zealand', -36.8485, 174.7633, 'Pacific/Auckland'],
].map(([name, lat, lon, tz]) => ({ name, lat, lon, tz }));

export function searchOffline(q) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return CITIES.filter((c) => c.name.toLowerCase().includes(s)).slice(0, 8);
}

export async function searchOnline(q, signal) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&format=json&name=${encodeURIComponent(q.trim())}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude, lon: r.longitude, tz: r.timezone,
  }));
}

export function fmtCoord(lat, lon) {
  const a = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const b = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${a}, ${b}`;
}

// ---------------------------------------------------------------------------
// Exact locations: Google Maps links and raw coordinates.

const num = '(-?\\d{1,3}(?:\\.\\d+)?)';

/**
 * Reads a Google Maps URL or "lat, lon" text.
 * Returns { name, lat, lon, exact } or null.
 * Prefers the place pin (!3d…!4d…) over the map view centre (@lat,lon).
 */
export function parseLocationInput(text) {
  const s = (text || '').trim();
  if (!s) return null;
  let lat, lon, name = '';
  const pin = s.match(new RegExp(`!3d${num}!4d${num}`));
  const at = s.match(new RegExp(`@${num},${num}`));
  const q = s.match(new RegExp(`[?&](?:q|query|ll|center|destination)=${num}(?:,|%2C)\\s*${num}`, 'i'));
  const plain = s.match(new RegExp(`^${num}\\s*°?\\s*([NS])?[,\\s]+${num}\\s*°?\\s*([EW])?$`, 'i'));
  if (pin) { lat = +pin[1]; lon = +pin[2]; }
  else if (q) { lat = +q[1]; lon = +q[2]; }
  else if (at) { lat = +at[1]; lon = +at[2]; }
  else if (plain) {
    lat = +plain[1] * (/s/i.test(plain[2] || '') ? -1 : 1);
    lon = +plain[3] * (/w/i.test(plain[4] || '') ? -1 : 1);
  } else return null;
  if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return null;
  const placeSeg = s.match(/\/maps\/place\/([^/@?]+)/);
  if (placeSeg) {
    try { name = decodeURIComponent(placeSeg[1].replace(/\+/g, ' ')); } catch { name = placeSeg[1].replace(/\+/g, ' '); }
  }
  return { name: name || `Exact location (${fmtCoord(lat, lon)})`, lat: +lat.toFixed(6), lon: +lon.toFixed(6), exact: true };
}

export const isShortMapsLink = (s) => /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(s || '');

function nearestCityTz(lat, lon) {
  let best = CITIES[0], bd = Infinity;
  for (const c of CITIES) {
    const d = (c.lat - lat) ** 2 + ((c.lon - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best.tz;
}

async function fetchJson(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } finally { clearTimeout(t); }
}

/** IANA timezone for coordinates (online lookup, nearest built-in city as fallback). */
export async function timezoneFor(lat, lon) {
  try {
    const d = await fetchJson(`https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`);
    if (d.timeZone) return { tz: d.timeZone, guessed: false };
  } catch { /* try next */ }
  try {
    const d = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto&forecast_days=1`);
    if (d.timezone) return { tz: d.timezone, guessed: false };
  } catch { /* fall back */ }
  return { tz: nearestCityTz(lat, lon), guessed: true };
}

export function allTimezones() {
  try { return Intl.supportedValuesOf('timeZone'); } catch { return [...new Set(CITIES.map((c) => c.tz))]; }
}
