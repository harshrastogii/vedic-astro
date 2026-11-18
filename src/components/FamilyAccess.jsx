import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { TrashIcon } from './Icons.jsx';

/**
 * Owner-only list of people allowed to use the AI chat and AI readings.
 * Everyone can sign in and keep their own profiles; this only gates the AI.
 */
export default function FamilyAccess() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data, error } = await supabase.from('chat_members').select('email, name, created_at').order('created_at');
    if (error) setErr(error.message); else setMembers(data);
  }

  useEffect(() => {
    supabase.rpc('is_app_admin').then(({ data }) => {
      if (data === true) { setIsAdmin(true); load(); }
    });
  }, []);

  async function add(e) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setErr('Enter a valid email address.');
    setBusy(true); setErr('');
    const { error } = await supabase.from('chat_members').upsert({ email: em, name: name.trim() || null });
    setBusy(false);
    if (error) return setErr(error.message);
    setEmail(''); setName('');
    load();
  }

  async function remove(em) {
    if (!window.confirm(`Turn off AI chat for ${em}? Their profiles and past chats stay in their account.`)) return;
    const { error } = await supabase.from('chat_members').delete().eq('email', em);
    if (error) setErr(error.message); else load();
  }

  if (!isAdmin) return null;

  return (
    <section className="card" style={{ display: 'grid', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 18 }}>Family access</h2>
        <p className="small muted" style={{ marginTop: 4 }}>
          Anyone can sign in and keep their own private profiles. The AI chat and AI readings work only for you and the
          emails below. Add the email they sign in with (their Google account, or the email on their GitHub).
        </p>
      </div>
      <div>
        {members.length === 0 && <div className="small muted">No one added yet.</div>}
        {members.map((m) => (
          <div key={m.email} className="family-row">
            <span className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>{(m.name || m.email).slice(0, 1).toUpperCase()}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {m.name && <div style={{ fontWeight: 600 }}>{m.name}</div>}
              <div className="small muted" style={{ overflowWrap: 'anywhere' }}>{m.email}</div>
            </div>
            <button className="btn ghost small" onClick={() => remove(m.email)} aria-label={`Remove ${m.email}`}>
              <span style={{ width: 15, height: 15, display: 'inline-grid' }}><TrashIcon /></span>Remove
            </button>
          </div>
        ))}
      </div>
      <form className="family-add" onSubmit={add} noValidate>
        <input className="input" type="email" placeholder="Email, e.g. sister@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <input className="input" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
      </form>
      {err && <div className="pill bad" style={{ justifySelf: 'start', whiteSpace: 'normal' }}>{err}</div>}
    </section>
  );
}
