import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProfiles } from '../lib/store.jsx';
import { kundli, currentPeriod, doshas } from '../lib/astro.js';
import { dayPanchang, RASHI_LORD } from '../engine/index.js';
import { fmtDate, fmtTime, todayIn, untilLabel } from '../lib/tz.js';
import ProfileForm from '../components/ProfileForm.jsx';
import { Orbit, ChartIcon, DashaIcon, PanchangIcon, DoshaIcon, MatchIcon } from '../components/Icons.jsx';
import { Stat, PlanetDot } from '../components/Common.jsx';
import { NorthChart } from '../components/Charts.jsx';

export default function Home() {
  const { active, upsert, loading } = useProfiles();

  if (loading) return <div className="card">Loading your profiles…</div>;
  if (!active) {
    return (
      <>
        <section className="hero">
          <Orbit className="hero-orbit" />
          <div className="eyebrow">Free Vedic astrology</div>
          <h2>Your birth chart, dasha and panchang</h2>
          <p>Enter birth details once. Everything is calculated right here in your browser, with nothing locked.</p>
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
  const k = kundli(profile);
  const now = new Date();
  const cur = currentPeriod(k.dasha, now);
  const d = doshas(k, now);
  const tz = profile.place.tz;
  const today = useMemo(() => dayPanchang(todayIn(tz), profile.place.lat, profile.place.lon, tz), [tz, profile.place.lat, profile.place.lon]);
  const moon = k.chart.planets.Moon;
  const sun = k.chart.planets.Sun;

  const links = [
    { to: '/chart', icon: ChartIcon, title: 'Birth chart', text: 'Rasi and Navamsa charts with every planet’s position' },
    { to: '/dasha', icon: DashaIcon, title: 'Vimshottari dasha', text: 'Your full 120-year timeline, down to pratyantar' },
    { to: '/panchang', icon: PanchangIcon, title: 'Panchang', text: 'Tithi, nakshatra, muhurtas and choghadiya for any day' },
    { to: '/doshas', icon: DoshaIcon, title: 'Doshas', text: 'Mangal, Kaal Sarp, Pitra and Sade Sati checks' },
    { to: '/matching', icon: MatchIcon, title: 'Kundli matching', text: 'Ashtakoot score out of 36 for two profiles' },
  ];

  return (
    <>
      <section className="hero">
        <Orbit className="hero-orbit" />
        <div className="eyebrow">Namaste</div>
        <h2>{profile.name}</h2>
        <p>
          {k.chart.ascendantSignName} ascendant · Moon in {moon.signName} ({moon.nakshatraName}) · Sun in {sun.signName}
        </p>
      </section>

      <section className="grid-4">
        <Stat label="Ascendant" value={k.chart.ascendantSignName} meta={`Lord ${RASHI_LORD[k.chart.ascendantSign]}`} />
        <Stat label="Moon sign" value={moon.signName} meta={`${moon.nakshatraName}, pada ${moon.pada}`} />
        <Stat label="Mahadasha" value={cur?.mahadasha.lord ?? '—'} meta={cur ? `until ${fmtDate(cur.mahadasha.endDate, tz)}` : ''} />
        <Stat label="Antardasha" value={cur?.antardasha?.lord ?? '—'} meta={cur?.antardasha ? `until ${fmtDate(cur.antardasha.endDate, tz)}` : ''} />
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-head"><h2>Rasi chart</h2><Link className="btn ghost small" to="/chart">Open</Link></div>
          <NorthChart chart={k.chart} title="Rasi" />
        </div>
        <div className="card" style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <div className="card-head" style={{ marginBottom: 0 }}>
            <h2>Today in {profile.place.name.split(',')[0]}</h2>
            <span className="sub">{fmtDate(new Date(), tz, { weekday: 'long' })}</span>
          </div>
          <dl className="kv">
            <dt>Tithi</dt><dd>{today.tithi.paksha} {today.tithi.name}{today.tithi.endsAt && <span className="muted small"> · till {untilLabel(today.tithi.endsAt, today.date, tz)}</span>}</dd>
            <dt>Nakshatra</dt><dd>{today.nakshatra.name}{today.nakshatra.endsAt && <span className="muted small"> · till {untilLabel(today.nakshatra.endsAt, today.date, tz)}</span>}</dd>
            <dt>Yoga</dt><dd>{today.yoga.name}</dd>
            <dt>Sunrise</dt><dd>{fmtTime(today.sunrise, tz)}</dd>
            <dt>Sunset</dt><dd>{fmtTime(today.sunset, tz)}</dd>
            {today.rahuKaal && <><dt>Rahu Kaal</dt><dd>{fmtTime(today.rahuKaal.start, tz)} – {fmtTime(today.rahuKaal.end, tz)}</dd></>}
          </dl>
          <div>
            <div className="small muted" style={{ fontWeight: 700, marginBottom: 8 }}>Dosha check</div>
            <div className="row">
              <span className={`pill ${d.mangal.present ? 'bad' : 'good'}`}>Mangal: {d.mangal.present ? d.mangal.severity : d.mangal.cancelled ? 'cancelled' : 'none'}</span>
              <span className={`pill ${d.kalsarp.present ? 'bad' : 'good'}`}>Kaal Sarp: {d.kalsarp.present ? (d.kalsarp.complete ? 'complete' : 'partial') : 'none'}</span>
              <span className={`pill ${d.sadeSati.present ? 'warn' : 'good'}`}>Sade Sati: {d.sadeSati.present ? d.sadeSati.phaseKey : 'no'}</span>
            </div>
          </div>
          {cur && (
            <div className="row" style={{ gap: 12 }}>
              <PlanetDot planet={cur.mahadasha.lord} />
              <div>
                <div style={{ fontWeight: 700 }}>{cur.mahadasha.lord} – {cur.antardasha?.lord}{cur.pratyantar ? ` – ${cur.pratyantar.lord}` : ''}</div>
                <div className="small muted">Current dasha · pratyantar till {cur.pratyantar ? fmtDate(cur.pratyantar.endDate, tz) : '—'}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid-3">
        {links.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="card" style={{ display: 'grid', gap: 8 }}>
            <span className="planet-dot" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><span style={{ width: 20, height: 20, display: 'grid' }}><Icon /></span></span>
            <h2 style={{ fontSize: 16 }}>{title}</h2>
            <p className="muted small">{text}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
