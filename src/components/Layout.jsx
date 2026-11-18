import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { BASE } from '../config.js';
import { getTheme, setTheme } from '../lib/theme.js';
import { MenuIcon, XIcon, MoonStarIcon, SunIcon } from './Icons.jsx';
import { REPORT_TYPES } from '../lib/reports.js';

export const APP_NAME = 'Vedic Astro';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/chat', label: 'Chat' },
  { to: '/reports', label: 'Reports' },
  { to: '/matching', label: 'Kundli Match' },
  { to: '/chart', label: 'Lagna Chart' },
  { to: '/dasha', label: 'Dasha' },
  { to: '/panchang', label: 'Panchang' },
];

const TITLES = { ...Object.fromEntries(NAV.map((n) => [n.to, n.label])), '/account': 'Account', '/profiles': 'Profiles', '/doshas': 'Doshas' };

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState(getTheme);
  const { pathname } = useLocation();
  const { user, displayName, avatarUrl } = useAuth();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    const report = pathname.startsWith('/reports/') && REPORT_TYPES.find((t) => pathname.endsWith(`/${t.id}`));
    const name = TITLES[pathname] ?? (report ? report.title : null);
    document.title = name ? `${name} | ${APP_NAME}` : APP_NAME;
  }, [pathname]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  const links = NAV.map(({ to, label, end }) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
  ));

  return (
    <>
      <header className="topnav">
        <Link to="/" className="logo"><img src={`${BASE}mark.svg`} alt="" /><span>Vedic <em>Astro</em></span></Link>
        <nav className="navlinks" aria-label="Main">{links}</nav>
        <div className="nav-right">
          <button className="round-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <MoonStarIcon /> : <SunIcon />}
          </button>
          <Link to="/account" className="avatar-btn" aria-label={user ? 'Account' : 'Sign in'}>
            {user && avatarUrl ? <img src={avatarUrl} alt="" /> : (user ? displayName.slice(0, 1).toUpperCase() : '?')}
          </Link>
          <button className="round-btn menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>
      {open && <nav className="mobile-menu" aria-label="Main">{links}<NavLink to="/profiles">Profiles</NavLink></nav>}
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
