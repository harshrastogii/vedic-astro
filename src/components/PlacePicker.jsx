import { useEffect, useRef, useState } from 'react';
import { searchOffline, searchOnline, fmtCoord, parseLocationInput, isShortMapsLink, timezoneFor } from '../lib/places.js';
import { PinIcon } from './Icons.jsx';

const coordText = (p) => (p.exact ? `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}` : fmtCoord(p.lat, p.lon));

/**
 * Type a city, or paste a Google Maps link / coordinates for an exact spot.
 * Value: { name, lat, lon, tz, exact? } | null
 */
export default function PlacePicker({ value, onChange, id }) {
  const [q, setQ] = useState(value?.name ?? '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [hl, setHl] = useState(0);
  const boxRef = useRef(null);

  useEffect(() => { setQ(value?.name ?? ''); }, [value?.name]);

  useEffect(() => {
    if (!open) return;
    const exact = parseLocationInput(q);
    if (exact) { setResults([exact]); setStatus(''); return; }
    if (isShortMapsLink(q)) {
      setResults([]);
      setStatus('Short Maps links can’t be read here. Open the link, then copy the full address from the browser’s address bar and paste that.');
      return;
    }
    const local = searchOffline(q);
    setResults(local);
    setStatus('');
    if (q.trim().length < 2 || q === value?.name) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setStatus('Searching…');
      try {
        const online = await searchOnline(q, ctrl.signal);
        const seen = new Set(local.map((r) => r.name));
        setResults([...local, ...online.filter((r) => !seen.has(r.name))].slice(0, 10));
        setStatus('');
      } catch (e) {
        if (e.name !== 'AbortError') setStatus('Online search unavailable. Showing built-in cities.');
      }
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, open, value?.name]);

  useEffect(() => {
    const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function pick(r) {
    setQ(r.name);
    setOpen(false);
    if (r.tz) { onChange(r); return; }
    setStatus('Finding the time zone…');
    const { tz, guessed } = await timezoneFor(r.lat, r.lon);
    setStatus('');
    onChange({ name: r.name, lat: r.lat, lon: r.lon, tz, exact: true, ...(guessed ? { tzGuessed: true } : {}) });
  }

  return (
    <div className="picker" ref={boxRef}>
      <input
        id={id}
        className="input"
        placeholder="City or Google Maps link"
        value={q}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHl(0); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setHl((h) => Math.min(h + 1, results.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)); }
          if (e.key === 'Enter' && open && results[hl]) { e.preventDefault(); pick(results[hl]); }
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && (results.length > 0 || status) && (
        <ul className="picker-list" role="listbox">
          {results.map((r, i) => (
            <li key={`${r.name}-${r.lat}-${r.lon}`}>
              <button type="button" className={i === hl ? 'hl' : ''} onMouseEnter={() => setHl(i)} onClick={() => pick(r)}>
                <span className="row" style={{ gap: 6 }}>{r.exact && <span style={{ width: 15, height: 15, display: 'inline-grid', color: 'var(--brand)' }}><PinIcon /></span>}{r.name}</span>
                <span className="small">{r.exact ? `Exact spot · ${coordText(r)}` : `${fmtCoord(r.lat, r.lon)} · ${r.tz}`}</span>
              </button>
            </li>
          ))}
          {status && <li className="small" style={{ padding: '8px 10px' }}>{status}</li>}
        </ul>
      )}
      {!open && status && <div className="hint" style={{ marginTop: 6 }}>{status}</div>}
      {value && <div className="hint" style={{ marginTop: 6 }}>{coordText(value)} · {value.tz}{value.tzGuessed ? ' (estimated, please check)' : ''}</div>}
      {!value && <div className="hint" style={{ marginTop: 6 }}>For an exact birthplace, find it on Google Maps and paste the link here.</div>}
    </div>
  );
}
