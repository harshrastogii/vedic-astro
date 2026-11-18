import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useProfiles } from '../lib/store.jsx';
import SignInCard from '../components/SignInCard.jsx';
import PageHead from '../components/PageHead.jsx';

export default function AccountPage() {
  const { ready, user, displayName, avatarUrl, githubLogin, signOut } = useAuth();
  const { profiles, error, clearError } = useProfiles();
  if (!ready) return <div className="card">Loading…</div>;
  if (!user) {
    return <SignInCard reason="Sign in to keep your birth profiles and chat history in your account, available on any device. Profiles you've already saved in this browser are uploaded when you sign in." />;
  }
  return (
    <>
      <PageHead title="Account" pill={false} />
      <section className="card profile-card">
        {avatarUrl ? <img src={avatarUrl} alt="" width="56" height="56" style={{ borderRadius: 16 }} /> : <span className="avatar">{displayName.slice(0, 1)}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 18 }}>{displayName}</h2>
          <div className="small muted">{githubLogin ? `GitHub · @${githubLogin}` : user.email}</div>
        </div>
        <button className="btn ghost small" onClick={signOut}>Sign out</button>
      </section>
      {error && <div className="pill bad" style={{ whiteSpace: 'normal' }}>{error} <button className="btn ghost small" onClick={clearError}>Dismiss</button></div>}
      <section className="grid-2">
        <Link to="/profiles" className="card">
          <div className="stat" style={{ border: 0, padding: 0 }}>
            <div className="label">Saved profiles</div>
            <div className="value">{profiles.length}</div>
            <div className="meta">Synced to your account</div>
          </div>
        </Link>
        <Link to="/chat" className="card">
          <div className="stat" style={{ border: 0, padding: 0 }}>
            <div className="label">AI chat</div>
            <div className="value">Open chat</div>
            <div className="meta">Conversations are saved and can be continued anytime</div>
          </div>
        </Link>
      </section>
    </>
  );
}
