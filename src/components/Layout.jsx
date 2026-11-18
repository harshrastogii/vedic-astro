import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, takeReturnTo, rememberReturnTo } from '../lib/auth.jsx';
import { useProfiles } from '../lib/store.jsx';
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

const TITLES = { ...Object.fromEntries(NAV.map((n) => [n.to, n.label])), '/account': 'Account', '/login': 'Sign in', '/welcome': 'Welcome', '/profiles': 'Birth details', '/doshas': 'Doshas' };

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState(getTheme);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { ready, user } = useAuth();
  const { profiles, loading: profilesLoading } = useProfiles();
  const onLogin = pathname === '/login';
  const needsSetup = !!user && !profilesLoading && profiles.length === 0;

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
  } else if (needsSetup && !['/welcome', '/account'].includes(pathname)) {
    // First sign-in: set up your own birth details before anything else.
    content = <Navigate to="/welcome" replace />;
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
          {user && <UserMenu />}
          {user && (
            <button className="round-btn menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? <XIcon /> : <MenuIcon />}
            </button>
          )}
        </div>
      </header>
      {user && open && <nav className="mobile-menu" aria-label="Main">{links}<NavLink to="/profiles">My birth details</NavLink><NavLink to="/account">Account</NavLink></nav>}
      {/* Re-mount every page when the signed-in person changes (sign-out, or a
          different account signed in from another tab), so nothing from the
          previous account can stay on screen. */}
      <main className={`page${pathname === '/chat' ? ' page-chat' : ''}`} key={user?.id ?? 'guest'}>
        {content}
      </main>
    </>
  );
}

const PROVIDER_LABEL = { google: 'Google', github: 'GitHub' };

// Profile picture in the top-right corner: shows who is signed in and the
// places a person needs (their details, account, sign out).
function UserMenu() {
  const { user, displayName, avatarUrl, provider, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const initial = (displayName || user.email || '?').slice(0, 1).toUpperCase();
  return (
    <div className="user-menu" ref={ref}>
      <button className="avatar-btn" aria-label="Account menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : initial}
      </button>
      {open && (
        <div className="user-pop" role="menu">
          <div className="user-pop-head">
            <strong>{displayName || 'Signed in'}</strong>
            <span className="small muted">{PROVIDER_LABEL[provider] ?? 'Account'}{user.email ? ` · ${user.email}` : ''}</span>
          </div>
          <Link role="menuitem" to="/profiles">My birth details</Link>
          <Link role="menuitem" to="/account">Account</Link>
          <button role="menuitem" type="button" onClick={async () => { setOpen(false); await signOut(); navigate('/login', { replace: true }); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}
