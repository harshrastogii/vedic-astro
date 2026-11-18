import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfiles } from '../lib/store.jsx';
import { kundli, currentPeriod, doshas, nextIngress, PLANET_ORDER, ordinal } from '../lib/astro.js';
import { RASHIS, panchang } from '../engine/index.js';
import { fmtDate, fmtTime } from '../lib/tz.js';
import { HOUSE_MEANING } from '../lib/symbols.js';
import { ChartView, ChartLegend } from '../components/Charts.jsx';
import { NeedProfile } from '../components/Common.jsx';
import PageHead from '../components/PageHead.jsx';
import { PlanetBadge, SignGlyph, SignLabel } from '../components/Astro.jsx';
import {
  ChatIcon, CompassIcon, CalendarIcon, ClockIcon, PinIcon, WheelIcon, HourglassIcon, TimerIcon,
  ArrowRightIcon, HouseSmIcon, RetroIcon, BookIcon,
} from '../components/Icons.jsx';

function usePersisted(key, initial) {
  const [v, setV] = useState(() => { try { return localStorage.getItem(key) || initial; } catch { return initial; } });
  useEffect(() => { try { localStorage.setItem(key, v); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}

const VIEWS = [
  { id: 'lagna', label: 'Lagna' },
  { id: 'moon', label: 'Moon' },
  { id: 'venus', label: 'Venus' },
  { id: 'navamsa', label: 'Navamsa' },
];

export default function ChartPage() {
  const { active } = useProfiles();
  const [style, setStyle] = usePersisted('vae.chartStyle', 'north');
  const [view, setView] = useState('lagna');
  if (!active) return <NeedProfile what="your birth chart" />;
  return <ChartBody profile={active} style={style} setStyle={setStyle} view={view} setView={setView} />;
}

function ChartBody({ profile, style, setStyle, view, setView }) {
  const k = kundli(profile);
  const { chart, d9 } = k;
  const tz = profile.place.tz;

  const shown = useMemo(() => {
    if (view === 'navamsa') return { chart: d9, ascSign: d9.ascendantSign, title: 'Navamsa' };
    if (view === 'moon') return { chart: { ...chart, ascendantSign: chart.planets.Moon.sign }, ascSign: chart.ascendantSign, title: 'Moon chart' };
    if (view === 'venus') return { chart: { ...chart, ascendantSign: chart.planets.Venus.sign }, ascSign: chart.ascendantSign, title: 'Venus chart' };
    return { chart, ascSign: chart.ascendantSign, title: 'Lagna chart' };
  }, [view, chart, d9]);

  return (
    <>
      <PageHead title="Lagna Chart">
        <div className="seg lg" role="tablist" aria-label="Chart">
          {VIEWS.map((v) => (
            <button key={v.id} role="tab" aria-selected={view === v.id} className={view === v.id ? 'on' : ''} onClick={() => setView(v.id)}>{v.label}</button>
          ))}
        </div>
        <Link to={`/chat?q=${encodeURIComponent('Give me an overview of my birth chart: my ascendant, Moon sign, strongest planets and key themes.')}`} className="btn soft small">
          <ChatIcon />Ask about this Kundli
        </Link>
      </PageHead>

      <div className="split">
        <div className="col">
          <section className="card chart-card">
            <div className="seg" role="tablist" aria-label="Chart style">
              {[['north', 'North'], ['south', 'South'], ['east', 'East']].map(([id, label]) => (
                <button key={id} role="tab" aria-selected={style === id} className={style === id ? 'on' : ''} onClick={() => setStyle(id)}>{label}</button>
              ))}
            </div>
            <ChartView chart={shown.chart} ascSign={shown.ascSign} style={style} title={shown.title} />
            <ChartLegend />
          </section>

          <BirthCard profile={profile} k={k} tz={tz} />
          <RightNow k={k} tz={tz} />
          <BirthPanchang k={k} tz={tz} />
        </div>

        <div className="col">
          <section className="card flush">
            <div className="card-head"><h2><span className="ic"><CompassIcon /></span>Planet Positions</h2></div>
            <ul className="rows">
              <li>
                <span className="planet-badge" style={{ background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: 13 }}>As</span>
                <span className="name">Ascendant</span>
                <span className="right">
                  <SignLabel sign={chart.ascendantSign}>{RASHIS[chart.ascendantSign]} {(chart.ascendant % 30).toFixed(1)}°</SignLabel>
                  <span className="hs"><HouseSmIcon />1</span>
                </span>
              </li>
              {PLANET_ORDER.map((n) => {
                const p = chart.planets[n];
                return (
                  <li key={n}>
                    <PlanetBadge planet={n} />
                    <span className="name">{n}</span>
                    {p.retrograde && <span className="pill warn tiny" title="Retrograde" aria-label="Retrograde"><RetroIcon /><span className="lbl">Retrograde</span></span>}
                    <span className="right">
                      <SignLabel sign={p.sign}>{p.signName} {p.degree.toFixed(1)}°</SignLabel>
                      <span className="hs" title={`${ordinal(p.house)} house`}><HouseSmIcon />{p.house}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card flush">
            <div className="card-head"><h2><span className="ic"><HouseSmIcon /></span>Houses</h2><span className="sub">Whole-sign houses from your ascendant</span></div>
            <div className="house-grid">
              {chart.houseToSign.map((sign, i) => {
                const occ = PLANET_ORDER.filter((n) => chart.planets[n].sign === sign);
                return (
                  <div key={i} className={`house-cell${i === 0 ? ' lagna' : ''}`}>
                    <span className="hn"><span className="ic"><HouseSmIcon /></span>{i + 1}</span>
                    <span className="sn"><SignGlyph sign={sign} />{RASHIS[sign]}</span>
                    <span className="mean">{HOUSE_MEANING[i]}</span>
                    {occ.length > 0 && <span className="occ">{occ.map((n) => <PlanetBadge key={n} planet={n} small />)}</span>}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function BirthCard({ profile, k, tz }) {
  const { chart } = k;
  return (
    <section className="card birth-meta">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="ln"><CalendarIcon />{fmtDate(k.birthDate, tz, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span className="ln"><ClockIcon />{fmtTime(k.birthDate, tz)}</span>
      </div>
      <span className="ln"><PinIcon />{profile.place.name}</span>
      <div className="trio">
        <div><div className="v"><SignLabel sign={chart.ascendantSign} colored /></div><div className="k">lagna</div></div>
        <div><div className="v"><SignLabel sign={chart.planets.Moon.sign} colored /></div><div className="k">moon</div></div>
        <div><div className="v"><SignLabel sign={chart.planets.Sun.sign} colored /></div><div className="k">sun</div></div>
      </div>
    </section>
  );
}

function RightNow({ k, tz }) {
  const now = new Date();
  const cur = currentPeriod(k.dasha, now);
  const d = doshas(k, now);
  const jup = useMemo(() => nextIngress('Jupiter', now), []); // eslint-disable-line react-hooks/exhaustive-deps
  const sat = d.sadeSati;
  return (
    <section className="card">
      <div className="card-head"><h2>Right now</h2>
        <Link className="link" to={`/chat?q=${encodeURIComponent('What is happening in my chart right now, with my current dasha and transits?')}`}><ChatIcon />Ask about this</Link>
      </div>
      <div className="now-list">
        {cur && (
          <div className="now-item">
            <span className="ic"><WheelIcon /></span>
            <div>
              <h3>{cur.mahadasha.lord} Mahadasha · {cur.antardasha?.lord} Antardasha</h3>
              <p>{cur.antardasha?.lord} Antardasha runs until {fmtDate(cur.antardasha.endDate, tz)}</p>
              <Link className="link" to="/dasha">See the Dasha timeline <ArrowRightIcon /></Link>
            </div>
          </div>
        )}
        <div className="now-item">
          <span className="ic"><HourglassIcon /></span>
          <div>
            <h3>{sat.present ? `Sade Sati: ${sat.phase.toLowerCase()} phase` : 'Saturn is quiet for you right now'}</h3>
            <p>Saturn is in {sat.saturnSign}; your Moon is in {sat.moonSign}.</p>
            <Link className="link" to="/doshas">See the Saturn check <ArrowRightIcon /></Link>
          </div>
        </div>
        {jup && (
          <div className="now-item">
            <span className="ic"><TimerIcon /></span>
            <div>
              <h3>Jupiter moves into {RASHIS[jup.to]} on {fmtDate(jup.date, tz)}</h3>
              <p>That falls in your {ordinal(((jup.to - k.chart.ascendantSign + 12) % 12) + 1)} house. Ask the AI what it may bring.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BirthPanchang({ k, tz }) {
  const p = panchang(k.birthDate, { tz });
  const items = [
    ['Tithi', `${p.tithi.paksha} ${p.tithi.name}`],
    ['Nakshatra', `${p.nakshatra.name} (pada ${p.nakshatra.pada})`],
    ['Yoga', p.yoga.name],
    ['Karana', p.karana.name],
    ['Weekday', p.vaara.name],
    ['Moon sign', p.moonSign],
  ];
  return (
    <section className="card flush">
      <div className="card-head"><h2><span className="ic" style={{ color: 'var(--good)' }}><BookIcon /></span>Panchang at Birth</h2></div>
      <div className="house-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
        {items.map(([kk, v], i) => (
          <div key={kk} className="house-cell" style={{ minHeight: 0, borderRight: i % 2 === 0 ? '1px solid var(--line)' : 0, borderBottom: i < items.length - 2 ? '1px solid var(--line)' : 0 }}>
            <span className="hn" style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, fontSize: 12 }}>{kk}</span>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
