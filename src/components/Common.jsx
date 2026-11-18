import { Link } from 'react-router-dom';
import { useProfiles } from '../lib/store.jsx';
import { Orbit } from './Icons.jsx';
import { PLANET_GLYPH, PLANET_TONE } from '../lib/symbols.js';


export function PlanetDot({ planet, size = 40 }) {
  const [bg, fg] = PLANET_TONE[planet] ?? ['#666', '#fff'];
  return <span className="planet-dot glyph" style={{ background: bg, color: fg, width: size, height: size }} title={planet}>{PLANET_GLYPH[planet]}</span>;
}

export function NeedProfile({ what = 'this page' }) {
  const { loading } = useProfiles();
  if (loading) return <div className="card">Loading your profiles…</div>;
  return (
    <div className="card empty">
      <Orbit className="muted" />
      <h2 style={{ fontSize: 20 }}>Add a birth profile to see {what}</h2>
      <p className="muted">Date, time and place of birth are all that’s needed. Profiles stay in this browser.</p>
      <Link to="/profiles?new=1" className="btn">Add a profile</Link>
    </div>
  );
}

export function Stat({ label, value, meta }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {meta && <div className="meta">{meta}</div>}
    </div>
  );
}
