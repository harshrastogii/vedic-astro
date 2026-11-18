import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import SignInCard from '../components/SignInCard.jsx';
import { BASE } from '../config.js';

export default function LoginPage() {
  const { ready, user } = useAuth();
  if (!ready) return <div className="card">Loading…</div>;
  if (user) return <Navigate to="/account" replace />;
  return (
    <div className="login-wrap">
      <SignInCard
        title="Sign in to Vedic Astro"
        reason="Use your Google account. Your birth profiles, chats and readings are private to your account; no one else can see them."
      />
      <p className="small muted" style={{ textAlign: 'center' }}>
        Google checks your password; this site never sees it. <a href={`${BASE}privacy.html`}>Privacy policy</a>
      </p>
    </div>
  );
}
