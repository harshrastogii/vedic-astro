import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth, authedFetch } from '../lib/auth.jsx';
import { useProfiles } from '../lib/store.jsx';
import { supabase } from '../lib/supabase.js';
import { chartContext } from '../lib/chartContext.js';
import { CHAT_API_URL } from '../config.js';
import Markdown from '../components/Markdown.jsx';
import { NeedProfile } from '../components/Common.jsx';
import { PlusIcon, XIcon } from '../components/Icons.jsx';
import SignInCard from '../components/SignInCard.jsx';

const STARTERS = [
  'What does my birth chart say about my career?',
  'What should I expect in my current dasha?',
  'How are my relationships and marriage indicated?',
  'Which planets are strongest in my chart?',
  'What do the current transits mean for me this month?',
  'Explain my ascendant and Moon sign in simple words.',
];

export default function ChatPage() {
  const { user, ready } = useAuth();
  const { active, profiles, loading } = useProfiles();
  if (!ready || loading) return <div className="card">Loading…</div>;
  if (!user) return <SignInCard reason="Sign in to chat about your chart. Your conversations are saved to your account so you can pick up where you left off." />;
  if (!active) return <NeedProfile what="chat about your chart" />;
  return <Chat user={user} active={active} profiles={profiles} />;
}

function Chat({ active, profiles }) {
  const [params, setParams] = useSearchParams();
  const convId = params.get('c');
  const [convs, setConvs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(null); // assistant text being streamed
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showList, setShowList] = useState(false);
  const endRef = useRef(null);
  const abortRef = useRef(null);
  const askedRef = useRef(null);

  const conv = convs.find((c) => c.id === convId);
  const convProfile = profiles.find((p) => p.id === conv?.profile_id) ?? active;

  const loadConvs = useCallback(async () => {
    const { data, error: e } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false });
    if (e) setError(e.message); else setConvs(data);
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    setMessages([]); setError('');
    if (!convId) return;
    let cancelled = false;
    supabase.from('messages').select('id, role, content, created_at').eq('conversation_id', convId).order('created_at')
      .then(({ data, error: e }) => { if (!cancelled) { if (e) setError(e.message); else setMessages(data); } });
    return () => { cancelled = true; };
  }, [convId]);

  // Keep the newest message in view by scrolling the message panel itself
  // (scrollIntoView would also scroll the whole page on phones).
  useEffect(() => {
    if (!messages.length && streaming === null) return;
    const box = endRef.current?.closest('.chat-scroll');
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, streaming]);

  // A question passed in the link (from the dashboard or chart page) starts a new chat.
  // Also works when the chat page is already open and a new ?q= arrives.
  const qParam = params.get('q');
  useEffect(() => {
    if (!qParam || askedRef.current === qParam) return;
    askedRef.current = qParam;
    setParams({}, { replace: true });
    send(qParam, [], true);
  }, [qParam]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text, base = messages, fresh = false) {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true); setError(''); setDraft('');

    let id = fresh ? null : convId;
    let profileForChat = id ? convProfile : active;
    try {
      if (!id) {
        profileForChat = active;
        const { data, error: e } = await supabase.from('conversations')
          .insert({ title: q.slice(0, 80), profile_id: active.id })
          .select('*').single();
        if (e) throw e;
        id = data.id;
        setConvs((list) => [data, ...list]);
        setParams({ c: id }, { replace: true });
      }
      const { data: um, error: e1 } = await supabase.from('messages')
        .insert({ conversation_id: id, role: 'user', content: q }).select('id, role, content, created_at').single();
      if (e1) throw e1;
      const history = [...(id === convId ? base : []), um];
      setMessages(history);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const res = await authedFetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          context: chartContext(profileForChat),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `The chat server answered ${res.status}.`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '';
      setStreaming('');
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        setStreaming(full);
      }
      setStreaming(null);
      if (!full.trim()) throw new Error('The AI returned an empty answer. The free model may be busy; please try again.');

      const { data: am, error: e2 } = await supabase.from('messages')
        .insert({ conversation_id: id, role: 'assistant', content: full }).select('id, role, content, created_at').single();
      if (e2) throw e2;
      setMessages((m) => [...m, am]);
      const now = new Date().toISOString();
      await supabase.from('conversations').update({ updated_at: now }).eq('id', id);
      setConvs((list) => [{ ...list.find((c) => c.id === id), updated_at: now }, ...list.filter((c) => c.id !== id)]);
    } catch (e) {
      setStreaming(null);
      if (e.name !== 'AbortError') setError(e.message || String(e));
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  async function removeConv(id) {
    if (!confirm('Delete this conversation?')) return;
    const { error: e } = await supabase.from('conversations').delete().eq('id', id);
    if (e) { setError(e.message); return; }
    setConvs((list) => list.filter((c) => c.id !== id));
    if (id === convId) setParams({});
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const needsRetry = error && lastUser && messages.at(-1)?.role === 'user';

  return (
    <div className="chat-shell">
      <aside className={`chat-list card${showList ? ' open' : ''}`}>
        <button className="btn small" onClick={() => { setParams({}); setShowList(false); }}><PlusIcon />New chat</button>
        <ul className="list-reset">
          {convs.map((c) => (
            <li key={c.id} className={`chat-item${c.id === convId ? ' on' : ''}`}>
              <button onClick={() => { setParams({ c: c.id }); setShowList(false); }}>
                <span className="title">{c.title}</span>
                <span className="small muted">{profiles.find((p) => p.id === c.profile_id)?.name ?? '—'} · {new Date(c.updated_at).toLocaleDateString()}</span>
              </button>
              <button className="del" aria-label="Delete conversation" onClick={() => removeConv(c.id)}><XIcon /></button>
            </li>
          ))}
          {convs.length === 0 && <li className="small muted" style={{ padding: 8 }}>No conversations yet.</li>}
        </ul>
      </aside>

      <section className="chat-main card">
        <div className="chat-head">
          <button className="btn ghost small chat-list-toggle" onClick={() => setShowList((v) => !v)}>Chats ({convs.length})</button>
          <div className="small muted">About <strong style={{ color: 'var(--ink)' }}>{(conv ? convProfile : active).name}</strong>’s chart</div>
        </div>

        <div className="chat-scroll">
          {messages.length === 0 && streaming === null && (
            <div className="chat-empty">
              <h2>Ask anything about {active.name.split(' ')[0]}’s chart</h2>
              <p className="muted small">Answers use the chart, dasha and transits calculated by this app.</p>
              <div className="starters">
                {STARTERS.map((s) => <button key={s} className="starter" onClick={() => send(s)} disabled={busy}>{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`bubble ${m.role}`}>
              {m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}
            </div>
          ))}
          {streaming !== null && (
            <div className="bubble assistant">{streaming ? <Markdown text={streaming} /> : <span className="typing"><i /><i /><i /></span>}</div>
          )}
          {busy && streaming === null && messages.at(-1)?.role === 'user' && (
            <div className="bubble assistant"><span className="typing"><i /><i /><i /></span></div>
          )}
          {error && (
            <div className="pill bad" style={{ whiteSpace: 'normal', justifySelf: 'start' }}>
              {error}
              {needsRetry && !busy && <button className="btn ghost small" style={{ marginLeft: 8 }} onClick={() => resend(lastUser.content)}>Retry</button>}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          <textarea
            className="input"
            rows={1}
            placeholder="Ask about career, relationships, timing…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft); } }}
            disabled={busy}
          />
          {busy
            ? <button type="button" className="btn ghost" onClick={() => abortRef.current?.abort()}>Stop</button>
            : <button type="submit" className="btn" disabled={!draft.trim()}>Send</button>}
        </form>
      </section>
    </div>
  );

  // Retrying re-asks the last question without saving it twice.
  async function resend(q) {
    const base = messages.slice(0, -1);
    setMessages(base);
    await supabase.from('messages').delete().eq('id', lastUser.id);
    send(q, base);
  }
}
