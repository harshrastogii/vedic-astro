import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, takeReturnTo, rememberReturnTo } from '../lib/auth.jsx';
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

const TITLES = { ...Object.fromEntries(NAV.map((n) => [n.to, n.label])), '/account': 'Account', '/login': 'Sign in', '/profiles': 'Profiles', '/doshas': 'Doshas' };

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState(getTheme);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { ready, user, displayName, avatarUrl } = useAuth();
  const onLogin = pathname === '/login';

  // After signing in (Google/GitHub bring people back to /account), continue
  // to the page they originally tried to open.
  useEffect(() => {
    if (!user) return;
    const to = takeReturnTo();
    if (to && to !== `${pathname}${search}`) navigate(to, { replace: true });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // The whole site is private: nothing renders until a person is signed in.
  let content;
  if (!ready) content = <div className="card" role="status">Checking your sign-in…</div>;
  else if (!user && !onLogin) {
    rememberReturnTo(`${pathname}${search}`);
    content = <Navigate to="/login" replace />;
  } else content = <Outlet />;

  const links = NAV.map(({ to, label, end }) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
  ));

  return (
    <>
      <header className="topnav">
        <Link to="/" className="logo"><img src={`${BASE}mark.svg`} alt="" /><span>Vedic <em>Astro</em></span></Link>
        {user && <nav className="navlinks" aria-label="Main">{links}</nav>}
        <div className="nav-right">
          <button className="round-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <MoonStarIcon /> : <SunIcon />}
          </button>
          {user && (
            <Link to="/account" className="avatar-btn" aria-label="Account">
              {avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : displayName.slice(0, 1).toUpperCase()}
            </Link>
          )}
          {user && (
            <button className="round-btn menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? <XIcon /> : <MenuIcon />}
            </button>
          )}
        </div>
      </header>
      {user && open && <nav className="mobile-menu" aria-label="Main">{links}<NavLink to="/profiles">Profiles</NavLink></nav>}
      {/* Re-mount every page when the signed-in person changes (sign-out, or a
          different account signed in from another tab), so nothing from the
          previous account can stay on screen. */}
      <main className="page" key={user?.id ?? 'guest'}>
        {content}
      </main>
    </>
  );
}
