import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth.jsx';
import { supabase } from './supabase.js';

// Signed out: profiles live in this browser (localStorage).
// Signed in: profiles live in the database (row-level security: only the owner
// can read them). Profiles made in this browser before signing in are never
// copied into an account automatically; the person signing in chooses to add
// or discard them (a shared computer must not leak one person's data to another).
const KEY = 'vae.profiles.v1';
const ACTIVE = 'vae.active.v1';

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

const fromRow = (r) => ({ id: r.id, name: r.name, gender: r.gender, date: r.birth_date, time: r.birth_time, place: r.place });
const toRow = (p) => ({ name: p.name, gender: p.gender, birth_date: p.date, birth_time: p.time, place: p.place });
const sameBirth = (a, b) => a.name === b.name && a.date === b.date && a.time === b.time && a.place?.name === b.place?.name;

const Ctx = createContext(null);

export function ProfilesProvider({ children }) {
  const { user: authUser, ready } = useAuth();
  // Depend on the account id, not the user object: the object is replaced on
  // every hourly token refresh, which must not reload or reset anything.
  const userId = authUser?.id ?? null;
  const user = userId ? authUser : null;
  const [local, setLocal] = useState(() => load(KEY, []));
  const [remote, setRemote] = useState(null); // null = not loaded
  const [activeId, setActiveId] = useState(() => load(ACTIVE, null));
  const [error, setError] = useState('');

  useEffect(() => save(KEY, local), [local]);
  useEffect(() => save(ACTIVE, activeId), [activeId]);

  // Load from the database on sign-in.
  useEffect(() => {
    if (!ready) return;
    if (!user) { setRemote(null); return; }
    let cancelled = false;
    (async () => {
      const { data, error: e } = await supabase.from('birth_profiles').select('*').order('created_at');
      if (cancelled) return;
      if (e) { setError(e.message); setRemote([]); return; }
      setRemote(data.map(fromRow));
    })();
    return () => { cancelled = true; };
  }, [userId, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Browser-only profiles waiting for the signed-in person's decision.
  const pending = useMemo(
    () => (user && remote ? local.filter((p) => !remote.some((r) => sameBirth(r, p))) : []),
    [userId, remote, local], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const importPending = useCallback(async () => {
    if (!pending.length) { setLocal([]); return; }
    const { data: inserted, error: e } = await supabase.from('birth_profiles').insert(pending.map(toRow)).select('*');
    if (e || !inserted) { setError(e?.message ?? 'Could not add those profiles.'); return; }
    setRemote((list) => [...(list ?? []), ...inserted.map(fromRow)]);
    setLocal([]);
  }, [pending]);

  const discardPending = useCallback(() => setLocal([]), []);

  const signedIn = !!user;
  // Signed out: nothing is shown (the whole site is behind sign-in).
  const profiles = signedIn ? (remote ?? []) : [];
  const loading = signedIn && remote === null;

  const upsert = useCallback(async (p) => {
    if (!signedIn) {
      const id = p.id ?? (crypto.randomUUID?.() ?? String(Date.now()));
      const next = { ...p, id };
      setLocal((list) => (list.some((x) => x.id === id) ? list.map((x) => (x.id === id ? next : x)) : [...list, next]));
      if (!p.id) setActiveId(id);
      return id;
    }
    if (p.id) {
      const { data, error: e } = await supabase.from('birth_profiles').update({ ...toRow(p), updated_at: new Date().toISOString() }).eq('id', p.id).select('*').single();
      if (e) { setError(e.message); return null; }
      setRemote((list) => list.map((x) => (x.id === p.id ? fromRow(data) : x)));
      return p.id;
    }
    const { data, error: e } = await supabase.from('birth_profiles').insert(toRow(p)).select('*').single();
    if (e) { setError(e.message); return null; }
    setRemote((list) => [...(list ?? []), fromRow(data)]);
    setActiveId(data.id);
    return data.id;
  }, [signedIn]);

  const remove = useCallback(async (id) => {
    if (signedIn) {
      const { error: e } = await supabase.from('birth_profiles').delete().eq('id', id);
      if (e) { setError(e.message); return; }
      setRemote((list) => list.filter((x) => x.id !== id));
    } else {
      setLocal((list) => list.filter((x) => x.id !== id));
    }
    if (activeId === id) setActiveId(null);
  }, [signedIn, activeId]);

  const value = useMemo(() => ({
    profiles,
    loading,
    pending,
    importPending,
    discardPending,
    error,
    clearError: () => setError(''),
    synced: signedIn,
    active: profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null,
    setActive: setActiveId,
    upsert,
    remove,
  }), [profiles, loading, pending, importPending, discardPending, error, signedIn, activeId, upsert, remove]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfiles() {
  return useContext(Ctx);
}
