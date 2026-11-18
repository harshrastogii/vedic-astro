import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfiles } from '../lib/store.jsx';
import { useAuth } from '../lib/auth.jsx';
import { supabase } from '../lib/supabase.js';
import { kundli, currentPeriod, doshas, nextIngress, taraFor, ordinal } from '../lib/astro.js';
import { dayPanchang, RASHIS } from '../engine/index.js';
import { fmtDate, fmtTime, todayIn, untilLabel } from '../lib/tz.js';
import ProfileForm from '../components/ProfileForm.jsx';
import { NorthChart } from '../components/Charts.jsx';
import { PlanetDot } from '../components/Common.jsx';
import { SignGlyph } from '../components/Astro.jsx';
import {
  SparkIcon, ChatIcon, ArrowUpIcon, ArrowRightIcon, CompassIcon, TimerIcon, BriefcaseIcon, PinIcon,
} from '../components/Icons.jsx';

const RISING_NOTE = [
  'brings drive, courage and a love of beginnings.',
  'brings steadiness, patience and an eye for comfort and beauty.',
  'brings curiosity, quick wit and a gift for words.',
  'brings warmth, care and strong intuition.',
  'brings confidence, generosity and a natural presence.',
  'brings precision, practicality and a wish to be useful.',
  'brings charm, balance and a talent for partnership.',
  'brings intensity, depth and determination.',
  'brings optimism, honesty and a love of learning.',
  'brings ambition, discipline and staying power.',
  'brings originality, independence and care for the wider world.',
  'brings imagination, empathy and a spiritual streak.',
];

export default function Home() {
  const { active, upsert, loading } = useProfiles();
  if (loading) return <div className="card">Loading your profiles…</div>;
  if (!active) {
    return (
      <>
        <section className="hero">
          <span className="tag"><SparkIcon />Free Vedic astrology</span>
          <h2>Your birth chart, dasha and panchang in one place</h2>
          <p className="lead">Enter birth details once. Every calculation runs in your browser, and nothing is locked behind a paywall.</p>
        </section>
        <section className="card">
          <div className="card-head"><h2>Create your first profile</h2></div>
          <ProfileForm onSave={upsert} submitLabel="Create my chart" />
        </section>
      </>
    );
  }
  return <Dashboard profile={active} />;
}

function Dashboard({ profile }) {
  const { profiles } = useProfiles();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [lastConv, setLastConv] = useState(null);

  const k = kundli(profile);
  const tz = profile.place.tz;
  const now = new Date();
  const cur = currentPeriod(k.dasha, now);
  const d = doshas(k, now);
  const asc = k.chart.ascendantSign;
  const first = profile.name.split(' ')[0];

  const today = useMemo(() => dayPanchang(todayIn(tz), profile.place.lat, profile.place.lon, tz), [tz, profile.place.lat, profile.place.lon]);
  const jup = useMemo(() => nextIngress('Jupiter', now), [profile.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const tara = taraFor(k.chart.planets.Moon.nakshatra, today.nakshatra.index);

  useEffect(() => {
    if (!user) { setLastConv(null); return; }
    supabase.from('conversations').select('id,title').order('updated_at', { ascending: false }).limit(1)
      .then(({ data }) => setLastConv(data?.[0] ?? null));
  }, [user]);

  const ask = (text) => text.trim() && navigate(`/chat?q=${encodeURIComponent(text.trim())}`);
  const chips = [
    { icon: CompassIcon, label: `My ${RASHIS[asc]} rising`, q: `What does my ${RASHIS[asc]} ascendant say about me?` },
    jup && { icon: TimerIcon, label: `What changes on ${fmtDate(jup.date, tz)}`, q: `Jupiter moves into ${RASHIS[jup.to]} on ${fmtDate(jup.date, tz)}. What could that change for me?` },
    { icon: BriefcaseIcon, label: 'Career', q: 'What does my chart say about my career right now?' },
  ].filter(Boolean);

  return (
    <>
      <div className="greet">
        <div className="date">{fmtDate(now, tz, { weekday: 'long', month: 'short', day: 'numeric', year: undefined })}</div>
        <h1>Namaste, <em>{first}</em></h1>
      </div>

      <div className="dash">
        <div className="col">
          <section className="hero">
            <span className="tag"><SparkIcon />AI Vedic Astrologer</span>
            <h2>Your rising sign is {RASHIS[asc]}. It {RISING_NOTE[asc]}</h2>
            {lastConv && (
              <Link to={`/chat?c=${lastConv.id}`} className="resume">
                <ChatIcon />
                <span><span className="k">continue your last conversation…</span><br /><span className="q">{lastConv.title}</span></span>
              </Link>
            )}
            <form className="ask-box" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about your future…" aria-label="Ask a question" />
              <button className="btn" type="submit" aria-label="Ask"><ArrowUpIcon /></button>
            </form>
            <div className="row">
              {chips.map(({ icon: Icon, label, q: cq }) => (
                <button key={label} className="chip" onClick={() => ask(cq)}><span className="ic"><Icon /></span>{label}</button>
              ))}
            </div>
          </section>

          <section className="hero amber">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ color: 'var(--gold)' }}>
                {tara.good === true ? `A supportive day for you, ${first}` : tara.good === false ? `A day to go carefully, ${first}` : `A reflective day for you, ${first}`}
              </h2>
              <span className="muted row" style={{ gap: 6 }}><span style={{ width: 18, height: 18, display: 'inline-grid' }}><PinIcon /></span>{profile.place.name.split(',')[0]}</span>
            </div>
            <p className="lead" style={{ color: 'var(--ink)' }}>
              Today the Moon is in {today.nakshatra.name}, the {ordinal(tara.count)} star from your birth star {k.chart.planets.Moon.nakshatraName}: <strong>{tara.name}</strong> tara. {tara.text}
            </p>
            <p className="muted small">
              {today.tithi.paksha} {today.tithi.name} till {untilLabel(today.tithi.endsAt, today.date, tz)} · Rahu Kaal {today.rahuKaal ? `${fmtTime(today.rahuKaal.start, tz)} – ${fmtTime(today.rahuKaal.end, tz)}` : '—'}
            </p>
            <button className="link" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', justifySelf: 'start' }} onClick={() => ask('What should I focus on today?')}>
              <ChatIcon />What should I focus on today? <ArrowRightIcon />
            </button>
          </section>
        </div>

        <div className="col">
          <section className="card">
            <div className="card-head"><h2>Your Kundli</h2><Link to="/chart" className="link">Open <ArrowRightIcon /></Link></div>
            <NorthChart chart={k.chart} title="Lagna" />
            <div className="trio" style={{ marginTop: 16 }}>
              <div><div className="v"><SignGlyph sign={asc} />{RASHIS[asc]}</div><div className="k">lagna</div></div>
              <div><div className="v"><SignGlyph sign={k.chart.planets.Moon.sign} />{RASHIS[k.chart.planets.Moon.sign]}</div><div className="k">moon</div></div>
              <div><div className="v"><SignGlyph sign={k.chart.planets.Sun.sign} />{RASHIS[k.chart.planets.Sun.sign]}</div><div className="k">sun</div></div>
            </div>
          </section>

          {cur && (
            <Link to="/dasha" className="card" style={{ display: 'grid', gap: 12 }}>
              <div className="card-head" style={{ marginBottom: 0 }}><h2>Current dasha</h2><ArrowRightIcon /></div>
              <div className="row" style={{ gap: 12 }}>
                <PlanetDot planet={cur.mahadasha.lord} />
                <div>
                  <div style={{ fontWeight: 700 }}>{cur.mahadasha.lord} – {cur.antardasha?.lord}{cur.pratyantar ? ` – ${cur.pratyantar.lord}` : ''}</div>
                  <div className="small muted">Antardasha until {fmtDate(cur.antardasha.endDate, tz)}</div>
                </div>
              </div>
              <div className="row">
                <span className={`pill ${d.mangal.present ? 'bad' : 'good'}`}>Mangal: {d.mangal.present ? d.mangal.severity : 'none'}</span>
                <span className={`pill ${d.kalsarp.present ? 'bad' : 'good'}`}>Kaal Sarp: {d.kalsarp.present ? 'yes' : 'none'}</span>
                <span className={`pill ${d.sadeSati.present ? 'warn' : 'good'}`}>Sade Sati: {d.sadeSati.present ? d.sadeSati.phaseKey : 'no'}</span>
              </div>
            </Link>
          )}

          <Link to="/profiles" className="card" style={{ display: 'grid', gap: 4 }}>
            <div className="card-head" style={{ marginBottom: 0 }}><h2>Family &amp; Friends</h2><ArrowRightIcon /></div>
            <span className="muted">{profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'} saved</span>
          </Link>
        </div>
      </div>
    </>
  );
}
