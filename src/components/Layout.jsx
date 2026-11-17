import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useProfiles } from '../lib/store.jsx';
import { useAuth } from '../lib/auth.jsx';
import { BASE } from '../config.js';
import {
  HomeIcon, ChartIcon, DashaIcon, PanchangIcon, DoshaIcon, MatchIcon, ProfilesIcon, MenuIcon, ChatIcon,
} from './Icons.jsx';

export const APP_NAME = 'Vedic Astro';

const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/chat', label: 'AI Chat', icon: ChatIcon },
  { to: '/chart', label: 'Birth Chart', icon: ChartIcon },
  { to: '/dasha', label: 'Dasha', icon: DashaIcon },
  { to: '/panchang', label: 'Panchang', icon: PanchangIcon },
  { to: '/doshas', label: 'Doshas', icon: DoshaIcon },
  { to: '/matching', label: 'Kundli Matching', icon: MatchIcon },
  { to: '/profiles', label: 'Profiles', icon: ProfilesIcon },
];

const TITLES = { ...Object.fromEntries(NAV.map((n) => [n.to, n.label])), '/account': 'Account' };

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { profiles, active, setActive } = useProfiles();
  const navigate = useNavigate();
  const { user, displayName, avatarUrl } = useAuth();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.title = pathname === '/' ? APP_NAME : `${TITLES[pathname] ?? APP_NAME} · ${APP_NAME}`;
  }, [pathname]);

  return (
    <div className={`shell${open ? ' open' : ''}`}>
      <aside className="sidebar">
        <div className="brand"><img src={`${BASE}mark.svg`} alt="" />{APP_NAME}</div>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon />{label}
          </NavLink>
        ))}
        <NavLink to="/account" className={({ isActive }) => `account-link${isActive ? ' active' : ''}`}>
          {user
            ? <>{avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar sm">{displayName.slice(0, 1)}</span>}<span><strong>{displayName}</strong><br /><span className="small muted">Synced account</span></span></>
            : <><span className="avatar sm">?</span><span><strong>Sign in</strong><br /><span className="small muted">Save profiles and chats</span></span></>}
        </NavLink>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}><MenuIcon /></button>
          <h1>{TITLES[pathname] ?? APP_NAME}</h1>
          <div className="spacer" />
          {profiles.length > 0 && (
            <select
              className="select switcher"
              aria-label="Active profile"
              value={active?.id ?? ''}
              onChange={(e) => (e.target.value === '__new' ? navigate('/profiles?new=1') : setActive(e.target.value))}
            >
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              <option value="__new">+ Add profile</option>
            </select>
          )}
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
