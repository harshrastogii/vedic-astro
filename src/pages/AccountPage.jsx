import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useProfiles } from '../lib/store.jsx';
import { kundli } from '../lib/astro.js';
import PageHead from '../components/PageHead.jsx';
import { PlusIcon, ChatIcon, ArrowRightIcon } from '../components/Icons.jsx';

const PROVIDER_LABEL = { google: 'Google', github: 'GitHub' };

export default function AccountPage() {
  const { user, displayName, avatarUrl, githubLogin, provider, signOut } = useAuth();
  const { profiles, active, pending, importPending, discardPending, error, clearError } = useProfiles();
  const navigate = useNavigate();
  if (!user) return null; // the layout sends signed-out visitors to Sign in

  const via = PROVIDER_LABEL[provider] ?? 'your account';
  const others = profiles.filter((p) => p.id !== active?.id);

  return (
    <>
      <PageHead title="Account" pill={false} />

      <section className="card account-head">
        {avatarUrl
          ? <img src={avatarUrl} alt="" width="64" height="64" referrerPolicy="no-referrer" className="account-photo" />
          : <span className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>{(displayName || user.email || '?').slice(0, 1).toUpperCase()}</span>}
        <div className="account-info">
          <div className="eyebrow">Signed in with {via}</div>
          <h2 style={{ fontSize: 20, margin: '2px 0' }}>{displayName || user.email}</h2>
          <div className="small muted" style={{ overflowWrap: 'anywhere' }}>
            {user.email}{provider === 'github' && githubLogin ? ` · @${githubLogin}` : ''}
          </div>
          <div className="small muted" style={{ marginTop: 4 }}>Everything below is private to this account.</div>
        </div>
        <button className="btn ghost small" onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}>Sign out</button>
      </section>

      {error && <div className="pill bad" style={{ whiteSpace: 'normal' }}>{error} <button className="btn ghost small" onClick={clearError}>Dismiss</button></div>}

      <section className="card" style={{ display: 'grid', gap: 14 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <h2>Your birth details</h2>
          {active && <Link className="btn small" to={`/profiles?edit=${active.id}`}>Edit details</Link>}
        </div>
        {active ? <DetailsSummary profile={active} /> : (
          <div className="row" style={{ gap: 10 }}>
            <span className="muted">You haven’t added your birth details yet.</span>
            <Link className="btn small" to="/welcome">Set up my details</Link>
          </div>
        )}
      </section>

      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <h2>Family &amp; friends</h2>
          <Link className="btn ghost small" to="/profiles?new=1"><PlusIcon />Add someone</Link>
        </div>
        {others.length === 0
          ? <p className="muted">Add a partner, parent or friend to see their chart or check a Kundli match.</p>
          : (
            <ul className="list-reset" style={{ display: 'grid', gap: 8 }}>
              {others.map((p) => (
                <li key={p.id} className="row" style={{ gap: 10 }}>
                  <span className="avatar" style={{ width: 34, height: 34, fontSize: 14 }}>{p.name.slice(0, 1).toUpperCase()}</span>
                  <span style={{ flex: 1, minWidth: 0 }}><strong>{p.name}</strong> <span className="small muted">· {p.date} · {p.place.name}</span></span>
                </li>
              ))}
            </ul>
          )}
        <Link className="link" to="/profiles">Manage all profiles <ArrowRightIcon /></Link>
      </section>

      {pending.length > 0 && (
        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 17 }}>Profiles found in this browser</h2>
            <p className="small muted" style={{ marginTop: 4 }}>
              {pending.length === 1 ? 'One profile was' : `${pending.length} profiles were`} saved on this device before you signed in
              ({pending.map((p) => p.name).join(', ')}). If they’re yours, add them to your account. If someone else made them, discard them.
            </p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn small" onClick={importPending}>Add to my account</button>
            <button className="btn ghost small" onClick={discardPending}>Discard</button>
          </div>
        </section>
      )}

      <Link to="/chat" className="card" style={{ display: 'grid', gap: 6 }}>
        <div className="card-head" style={{ marginBottom: 0 }}><h2><span className="ic"><ChatIcon /></span>AI chat</h2><ArrowRightIcon /></div>
        <span className="muted">Your conversations are saved to this account and can be continued any time.</span>
      </Link>
    </>
  );
}

function DetailsSummary({ profile: p }) {
  const k = kundli(p);
  const rows = [
    ['Name', p.name],
    ['Born', `${p.date} at ${p.time}`],
    ['Place', p.place.name],
    ['Ascendant', k.chart.ascendantSignName],
    ['Moon sign', `${k.chart.planets.Moon.signName} (${k.chart.planets.Moon.nakshatraName})`],
  ];
  return (
    <dl className="details-grid">
      {rows.map(([dt, dd]) => (<div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>))}
    </dl>
  );
}
