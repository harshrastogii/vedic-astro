import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth.jsx';
import { supabase } from './supabase.js';

// Signed out: profiles live in this browser (localStorage).
// Signed in: profiles live in the database, and any browser-only profiles are
// uploaded once on sign-in so nothing is lost.
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
  const { user, ready } = useAuth();
  const [local, setLocal] = useState(() => load(KEY, []));
  const [remote, setRemote] = useState(null); // null = not loaded
  const [activeId, setActiveId] = useState(() => load(ACTIVE, null));
  const [error, setError] = useState('');

  useEffect(() => save(KEY, local), [local]);
  useEffect(() => save(ACTIVE, activeId), [activeId]);

  // Load from the database on sign-in; upload browser-only profiles once.
  useEffect(() => {
    if (!ready) return;
    if (!user) { setRemote(null); return; }
    let cancelled = false;
    (async () => {
      const { data, error: e } = await supabase.from('birth_profiles').select('*').order('created_at');
      if (cancelled) return;
      if (e) { setError(e.message); setRemote([]); return; }
      let rows = data.map(fromRow);
      const pending = load(KEY, []).filter((p) => !rows.some((r) => sameBirth(r, p)));
      let uploaded = true;
      if (pending.length) {
        const { data: inserted, error: e2 } = await supabase.from('birth_profiles').insert(pending.map(toRow)).select('*');
        if (cancelled) return;
        if (e2 || !inserted) {
          uploaded = false;
          setError(e2?.message ?? 'Could not upload saved profiles.');
        } else {
          rows = [...rows, ...inserted.map(fromRow)];
          const moved = pending.findIndex((p) => p.id === load(ACTIVE, null));
          if (moved >= 0) setActiveId(inserted[moved].id);
        }
      }
      if (uploaded) setLocal([]); // keep browser copies if the upload failed
      setRemote(rows);
    })();
    return () => { cancelled = true; };
  }, [user, ready]);

  const signedIn = !!user;
  const profiles = signedIn ? (remote ?? []) : local;
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
    error,
    clearError: () => setError(''),
    synced: signedIn,
    active: profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null,
    setActive: setActiveId,
    upsert,
    remove,
  }), [profiles, loading, error, signedIn, activeId, upsert, remove]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfiles() {
  return useContext(Ctx);
}
