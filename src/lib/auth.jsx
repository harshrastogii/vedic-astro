import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';
import { BASE } from '../config.js';

const Ctx = createContext(null);

// Sign-in state for the whole app.
//
// Robustness rules (each one fixes a real way people got "locked out"):
// - "ready" comes from Supabase's INITIAL_SESSION event, which always fires,
//   even when the token refresh on startup fails. A safety timer makes sure a
//   tab can never hang on "Loading…".
// - Every tab shares one session (localStorage + BroadcastChannel inside
//   Supabase), so signing in or out in one tab updates all open tabs.
// - Calls to our own API never reuse a token held in React state, which can be
//   stale in a tab the browser paused. They ask Supabase for a fresh one and
//   retry once after a refresh (see authedFetch).

const READY_FALLBACK_MS = 6000;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState(() => readOAuthError());

  useEffect(() => {
    let alive = true;
    let hadSession = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!alive) return;
      setSession(s);
      if (event === 'INITIAL_SESSION') setReady(true);
      if (s) hadSession = true;
      if (event === 'SIGNED_OUT') {
        // Signed out here or in another tab. Only explain it if this tab
        // didn't ask for it (signOut below sets the flag).
        if (hadSession && !signingOut) setNotice('You were signed out. Please sign in again.');
        hadSession = false;
      }
    });
    const t = setTimeout(() => { if (alive) setReady(true); }, READY_FALLBACK_MS);
    return () => { alive = false; clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    const meta = user?.user_metadata ?? {};
    return {
      ready,
      session,
      user,
      notice,
      clearNotice: () => setNotice(''),
      displayName: meta.full_name || meta.name || meta.user_name || user?.email || '',
      avatarUrl: meta.avatar_url || meta.picture || '',
      githubLogin: meta.user_name || meta.preferred_username || '',
      provider: user?.app_metadata?.provider || '',
      async signIn(provider = 'google') {
        setNotice('');
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}${BASE}account`,
            ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
          },
        });
        if (error) throw error;
      },
      async signOut() {
        // Ends this browser's session on the server and removes the stored tokens.
        signingOut = true;
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } finally {
          signingOut = false;
          try { localStorage.removeItem('vae.active.v1'); } catch { /* ignore */ }
        }
      },
    };
  }, [session, ready, notice]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

let signingOut = false;

export const useAuth = () => useContext(Ctx);

/** A valid access token right now (refreshed if it is about to expire), or null. */
export async function freshAccessToken({ force = false } = {}) {
  if (force) {
    const { data } = await supabase.auth.refreshSession();
    return data.session?.access_token ?? null;
  }
  const { data } = await supabase.auth.getSession(); // refreshes an expired token
  const s = data.session;
  if (!s) return null;
  if ((s.expires_at ?? 0) * 1000 - Date.now() < 60_000) {
    const { data: r } = await supabase.auth.refreshSession();
    return r.session?.access_token ?? s.access_token;
  }
  return s.access_token;
}

export class SignedOutError extends Error {
  constructor() { super('Please sign in again to continue.'); this.name = 'SignedOutError'; }
}

/** fetch() to our own API with a fresh token; retries once after a forced refresh on 401. */
export async function authedFetch(url, init = {}) {
  const send = (token) => fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
  const token = await freshAccessToken();
  if (!token) throw new SignedOutError();
  const res = await send(token);
  if (res.status !== 401) return res;
  const again = await freshAccessToken({ force: true });
  if (!again) throw new SignedOutError();
  return send(again);
}

// Google/GitHub send people back with ?error=… or #error=… when sign-in is
// cancelled or fails. Show a plain message and tidy the address bar.
function readOAuthError() {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const err = url.searchParams.get('error') || hash.get('error');
  if (!err) return '';
  const desc = url.searchParams.get('error_description') || hash.get('error_description') || '';
  ['error', 'error_code', 'error_description'].forEach((k) => url.searchParams.delete(k));
  if (hash.get('error')) url.hash = '';
  window.history.replaceState(window.history.state, '', url.toString());
  if (err === 'access_denied') return 'Sign-in was cancelled. You can try again whenever you like.';
  return `Sign-in didn't complete${desc ? `: ${desc.replace(/\+/g, ' ')}` : ''}. Please try again.`;
}
