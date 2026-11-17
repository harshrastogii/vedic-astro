import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';
import { BASE } from '../config.js';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    const meta = user?.user_metadata ?? {};
    return {
      ready,
      session,
      user,
      displayName: meta.full_name || meta.name || meta.user_name || user?.email || '',
      avatarUrl: meta.avatar_url || '',
      githubLogin: meta.user_name || meta.preferred_username || '',
      async signIn() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: { redirectTo: `${window.location.origin}${BASE}account` },
        });
        if (error) throw error;
      },
      async signOut() { await supabase.auth.signOut(); },
    };
  }, [session, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
