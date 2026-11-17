// Timezone helpers built on the browser's Intl database (no extra library).

const partsCache = new Map();
function formatter(tz) {
  if (!partsCache.has(tz)) {
    partsCache.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }
  return partsCache.get(tz);
}

/** Wall-clock fields of an instant in a timezone. */
export function wallClock(date, tz) {
  const o = {};
  for (const p of formatter(tz).formatToParts(date)) if (p.type !== 'literal') o[p.type] = +p.value;
  return o; // { year, month, day, hour, minute, second }
}

/** Offset of tz from UTC at an instant, in milliseconds. */
export function tzOffsetMs(date, tz) {
  const w = wallClock(date, tz);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Convert a local wall-clock time in tz to a UTC Date. */
export function zonedToUtc(y, m, d, hh = 0, mm = 0, tz = 'UTC') {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let utc = guess - tzOffsetMs(new Date(guess), tz);
  // second pass handles DST transitions
  utc = guess - tzOffsetMs(new Date(utc), tz);
  return new Date(utc);
}

/** Parse "YYYY-MM-DD" + "HH:MM" in tz. */
export function parseLocal(dateStr, timeStr, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '12:00').split(':').map(Number);
  return zonedToUtc(y, m, d, hh, mm, tz);
}

export function fmtTime(date, tz, opts = {}) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true, ...opts }).format(date);
}

export function fmtDate(date, tz, opts = {}) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', { timeZone: tz, day: 'numeric', month: 'short', year: 'numeric', ...opts }).format(date);
}

export function fmtDateTime(date, tz) {
  return `${fmtDate(date, tz)}, ${fmtTime(date, tz)}`;
}

/** "07:08 am" or "07:08 am, 19 Nov" when the instant is not on dateStr (YYYY-MM-DD) locally. */
export function untilLabel(date, dateStr, tz) {
  if (!date) return '—';
  const w = wallClock(date, tz);
  const ds = `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
  return ds === dateStr ? fmtTime(date, tz) : `${fmtTime(date, tz)}, ${fmtDate(date, tz, { year: undefined })}`;
}

export function todayIn(tz) {
  const w = wallClock(new Date(), tz);
  return `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
}

export function utcOffsetLabel(date, tz) {
  const mins = Math.round(tzOffsetMs(date, tz) / 60000);
  const sign = mins >= 0 ? '+' : '−';
  const a = Math.abs(mins);
  return `UTC${sign}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`;
}
