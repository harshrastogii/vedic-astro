import { useEffect, useRef, useState } from 'react';
import { searchOffline, searchOnline, fmtCoord } from '../lib/places.js';

/** Type a place, pick a result. Value: { name, lat, lon, tz } | null */
export default function PlacePicker({ value, onChange, id }) {
  const [q, setQ] = useState(value?.name ?? '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [hl, setHl] = useState(0);
  const boxRef = useRef(null);

  useEffect(() => { setQ(value?.name ?? ''); }, [value?.name]);

  useEffect(() => {
    if (!open || q.trim().length < 2 || q === value?.name) { setResults(searchOffline(q)); return; }
    const local = searchOffline(q);
    setResults(local);
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

  function pick(r) {
    onChange(r);
    setQ(r.name);
    setOpen(false);
  }

  return (
    <div className="picker" ref={boxRef}>
      <input
        id={id}
        className="input"
        placeholder="Start typing a city…"
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
            <li key={`${r.name}-${r.lat}`}>
              <button type="button" className={i === hl ? 'hl' : ''} onMouseEnter={() => setHl(i)} onClick={() => pick(r)}>
                <span>{r.name}</span>
                <span className="small">{fmtCoord(r.lat, r.lon)} · {r.tz}</span>
              </button>
            </li>
          ))}
          {status && <li className="small" style={{ padding: '8px 10px' }}>{status}</li>}
        </ul>
      )}
      {value && <div className="hint" style={{ marginTop: 6 }}>{fmtCoord(value.lat, value.lon)} · {value.tz}</div>}
    </div>
  );
}
