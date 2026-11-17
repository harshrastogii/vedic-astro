import { Link } from 'react-router-dom';
import { useProfiles } from '../lib/store.jsx';
import { Orbit } from './Icons.jsx';

export const PLANET_TONE = {
  Sun: ['#fdecd3', '#b4610b'], Moon: ['#e9eef6', '#4a5d7a'], Mars: ['#fbe3dc', '#b33a22'],
  Mercury: ['#e2f3e8', '#2c7a4b'], Jupiter: ['#fbf0d2', '#9a6a0c'], Venus: ['#f7e6f0', '#9b3d72'],
  Saturn: ['#e6e7f3', '#3f4380'], Rahu: ['#e9e6e1', '#5b5249'], Ketu: ['#efe7dd', '#7a5a35'],
};

export function PlanetDot({ planet, size = 40 }) {
  const [bg, fg] = PLANET_TONE[planet] ?? ['#eee', '#333'];
  return <span className="planet-dot" style={{ background: bg, color: fg, width: size, height: size }}>{planet.slice(0, 2)}</span>;
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
