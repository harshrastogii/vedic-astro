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
