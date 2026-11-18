import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfiles } from '../lib/store.jsx';
import { kundli } from '../lib/astro.js';
import ProfileForm from '../components/ProfileForm.jsx';
import { PlusIcon } from '../components/Icons.jsx';
import PageHead from '../components/PageHead.jsx';

export default function Profiles() {
  const { profiles, active, upsert, remove, setActive } = useProfiles();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState(() => params.get('edit'));
  const navigate = useNavigate();
  // /profiles?edit=<id> (from the Account page) opens that profile's form.
  useEffect(() => {
    const id = params.get('edit');
    if (id) { setEditing(id); setParams({}, { replace: true }); }
  }, [params, setParams]);
  const adding = params.get('new') === '1' || profiles.length === 0;

  return (
    <>
      <PageHead title="Birth details" subtitle="Your own details, and anyone else whose chart you want to see." pill={false} />
      {adding && (
        <section className="card">
          <div className="card-head"><h2>New profile</h2></div>
          <ProfileForm
            onSave={(p) => { upsert(p); setParams({}); navigate('/'); }}
            onCancel={profiles.length ? () => setParams({}) : undefined}
          />
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Saved profiles</h2>
          {!adding && <button className="btn small" onClick={() => setParams({ new: '1' })}><PlusIcon />Add profile</button>}
        </div>
        {profiles.length === 0 && <p className="muted">No profiles yet.</p>}
        <ul className="list-reset" style={{ display: 'grid', gap: 10 }}>
          {profiles.map((p) => {
            if (editing === p.id) {
              return (
                <li key={p.id} className="card" style={{ boxShadow: 'none' }}>
                  <ProfileForm initial={p} onSave={(np) => { upsert(np); setEditing(null); }} onCancel={() => setEditing(null)} />
                </li>
              );
            }
            const k = kundli(p);
            const isActive = active?.id === p.id;
            return (
              <li key={p.id} className="stat profile-card" style={isActive ? { borderColor: 'var(--brand)' } : undefined}>
                <span className="avatar">{p.name.slice(0, 1).toUpperCase()}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{p.name} {isActive && <span className="pill brand" style={{ marginLeft: 6 }}>Active</span>}</div>
                  <div className="small muted">{p.date} · {p.time} · {p.place.name}</div>
                  <div className="small muted">{k.chart.ascendantSignName} ascendant · Moon in {k.chart.planets.Moon.signName}</div>
                </div>
                <div className="row">
                  {!isActive && <button className="btn ghost small" onClick={() => setActive(p.id)}>Use</button>}
                  <button className="btn ghost small" onClick={() => setEditing(p.id)}>Edit</button>
                  <button className="btn danger small" onClick={() => { if (confirm(`Delete ${p.name}?`)) remove(p.id); }}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
