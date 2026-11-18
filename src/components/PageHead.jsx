import { useNavigate } from 'react-router-dom';
import { useProfiles } from '../lib/store.jsx';
import { ChevronIcon } from './Icons.jsx';

/** Profile switcher shown as a small pill. */
export function ProfilePill() {
  const { profiles, active, setActive } = useProfiles();
  const navigate = useNavigate();
  if (!active) return null;
  return (
    <label className="profile-pill">
      <span className="dot">{active.name.slice(0, 1).toUpperCase()}</span>
      {active.name}
      <ChevronIcon />
      <select
        aria-label="Choose profile"
        value={active.id}
        onChange={(e) => (e.target.value === '__manage' ? navigate('/profiles') : setActive(e.target.value))}
      >
        {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        <option value="__manage">Manage profiles…</option>
      </select>
    </label>
  );
}

/** Centred page header: profile pill, big title, optional subtitle and controls. */
export default function PageHead({ title, subtitle, children, pill = true }) {
  return (
    <div className="page-head">
      {pill && <ProfilePill />}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  );
}
