import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProfiles } from '../lib/store.jsx';
import { useAuth, authedFetch } from '../lib/auth.jsx';
import { supabase } from '../lib/supabase.js';
import { REPORT_TYPES, buildReport } from '../lib/reports.js';
import { chartContext } from '../lib/chartContext.js';
import { CHAT_API_URL } from '../config.js';
import PageHead from '../components/PageHead.jsx';
import { NeedProfile } from '../components/Common.jsx';
import ReportGlyph from '../components/ReportIcon.jsx';
import Markdown from '../components/Markdown.jsx';
import { CheckIcon, SparkIcon, ChatIcon, ArrowRightIcon } from '../components/Icons.jsx';

export default function ReportPage() {
  const { type } = useParams();
  const { active } = useProfiles();
  const meta = REPORT_TYPES.find((t) => t.id === type);
  const report = useMemo(() => (active && meta ? buildReport(type, active) : null), [active, meta, type]);
  if (!meta) return <div className="card empty"><h2>Report not found</h2><Link className="btn" to="/reports">All reports</Link></div>;
  if (!active) return <NeedProfile what={`your ${meta.title} report`} />;

  return (
    <>
      <PageHead title={report.title} subtitle={report.tagline}>
        <Link to="/reports" className="link">All reports</Link>
      </PageHead>

      <section className="hero">
        <div className="row" style={{ gap: 16 }}>
          <ReportGlyph icon={report.icon} size={52} />
          <div style={{ display: 'grid', gap: 6 }}>
            <span className={`pill ${report.verdict.tone}`} style={{ justifySelf: 'start', fontSize: 14 }}>{report.verdict.label}</span>
            <p className="lead" style={{ color: 'var(--ink)' }}>{report.summary}</p>
          </div>
        </div>
      </section>

      <div className="split">
        <div className="col">
          {report.sections.map((s) => (
            <section key={s.title} className="card">
              <div className="card-head"><h2>{s.title}</h2></div>
              {s.items && (
                <ul className="list-reset" style={{ display: 'grid', gap: 6 }}>
                  {s.items.map((i) => <li key={i} className="factor"><span style={{ color: 'var(--brand)' }}><CheckIcon /></span><span>{i}</span></li>)}
                </ul>
              )}
              {s.rows && (s.rows.length ? (
                <div className="table-wrap">
                  <table className={`t${(s.head?.length ?? s.rows[0].length) >= 3 ? ' stack' : ''}`}>
                    {s.head && <thead><tr>{s.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>}
                    <tbody>{s.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className={j === 0 ? 'c0' : 'cx'} data-label={s.head?.[j] ?? ''}>{cell}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              ) : <p className="muted">None found.</p>)}
            </section>
          ))}
        </div>
        <div className="col">
          <AiReading report={report} profile={active} />
          <Link to={`/chat?q=${encodeURIComponent(`I just read my ${report.title} report (${report.verdict.label}). What does it mean for me in practice?`)}`} className="card" style={{ display: 'grid', gap: 6 }}>
            <div className="card-head" style={{ marginBottom: 0 }}><h2><span className="ic"><ChatIcon /></span>Ask a follow-up</h2><ArrowRightIcon /></div>
            <p className="muted">Discuss this report with the AI astrologer.</p>
          </Link>
        </div>
      </div>
    </>
  );
}

const inputKey = (p) => [p.date, p.time, p.place.lat, p.place.lon, 'v1'].join('|');

function AiReading({ report, profile }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(null); // { content, created_at }
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    setSaved(null); setText(''); setError('');
    if (!user) return;
    supabase.from('reports').select('content, input_key, created_at').eq('profile_id', profile.id).eq('type', report.id).maybeSingle()
      .then(({ data }) => { if (data && data.input_key === inputKey(profile)) setSaved(data); });
    return () => abortRef.current?.abort();
  }, [user?.id, profile, report.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setBusy(true); setError(''); setText('');
    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const res = await authedFetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'report',
          messages: [{ role: 'user', content: `Write my ${report.title} report.` }],
          context: `${chartContext(profile)}\n\n--- REPORT FACTS (${report.title}) ---\n${report.facts}`,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `The server answered ${res.status}.`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        setText(full);
      }
      if (!full.trim()) throw new Error('The free AI model returned nothing. It may be busy; please try again.');
      const row = { profile_id: profile.id, type: report.id, input_key: inputKey(profile), content: full, created_at: new Date().toISOString() };
      const { error: e } = await supabase.from('reports').upsert(row, { onConflict: 'profile_id,type' });
      if (e) throw e;
      setSaved(row); setText('');
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || String(e));
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  const body = text || saved?.content;
  return (
    <section className="card">
      <div className="card-head">
        <h2><span className="ic"><SparkIcon /></span>Written reading</h2>
        {saved && !busy && <button className="btn ghost small" onClick={generate}>Rewrite</button>}
      </div>
      {!user && (
        <div style={{ display: 'grid', gap: 10 }}>
          <p className="muted">Sign in to get an AI-written explanation of this report. It is saved to your account.</p>
          <Link to="/login" className="btn small" style={{ justifySelf: 'start' }}>Sign in</Link>
        </div>
      )}
      {user && !body && !busy && (
        <div style={{ display: 'grid', gap: 10 }}>
          <p className="muted">The AI astrologer explains the results above in plain language, using only what was calculated.</p>
          <button className="btn small" style={{ justifySelf: 'start' }} onClick={generate}><SparkIcon />Write my reading</button>
        </div>
      )}
      {busy && !text && <p className="muted"><span className="typing"><i /><i /><i /></span> Writing your reading… this can take up to a minute.</p>}
      {body && <Markdown text={body} />}
      {saved && !busy && <p className="faint small" style={{ marginTop: 12 }}>Saved {new Date(saved.created_at).toLocaleDateString()}</p>}
      {error && <p className="pill bad" style={{ whiteSpace: 'normal', marginTop: 10 }}>{error}</p>}
    </section>
  );
}
