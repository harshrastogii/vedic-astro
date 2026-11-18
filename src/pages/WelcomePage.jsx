import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useProfiles } from '../lib/store.jsx';
import ProfileForm from '../components/ProfileForm.jsx';

// First stop after someone signs in for the first time: their own birth details.
export default function WelcomePage() {
  const { displayName, user } = useAuth();
  const { profiles, loading, upsert } = useProfiles();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  if (loading) return <div className="card" role="status">Loading…</div>;
  if (profiles.length > 0 && !saving) return <Navigate to="/" replace />;

  const first = (displayName || '').split(' ')[0];
  return (
    <div className="welcome-wrap">
      <section className="card welcome-card">
        <div>
          <span className="eyebrow">Getting started</span>
          <h1 className="welcome-title">Welcome{first ? `, ${first}` : ''}! Let’s set up your details</h1>
          <p className="muted">
            Your chart, dasha, reports and AI chat are all calculated from your date, time and place of birth.
            These details are saved privately to your account{user?.email ? ` (${user.email})` : ''}. You can change them any time.
          </p>
        </div>
        <ProfileForm
          initial={{ name: displayName || '' }}
          submitLabel="Save and continue"
          onSave={async (p) => {
            setSaving(true);
            const id = await upsert(p);
            if (id) navigate('/', { replace: true });
            else setSaving(false);
          }}
        />
      </section>
    </div>
  );
}
