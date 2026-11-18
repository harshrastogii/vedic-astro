import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfiles } from '../lib/store.jsx';
import { match } from '../lib/astro.js';
import { NeedProfile } from '../components/Common.jsx';
import PageHead from '../components/PageHead.jsx';

const KOOTA_INFO = {
  varna: ['Varna', 'Spiritual and working temperament'],
  vashya: ['Vashya', 'Mutual attraction and influence'],
  tara: ['Tara', 'Birth-star compatibility and wellbeing'],
  yoni: ['Yoni', 'Physical and instinctive nature'],
  grahaMaitri: ['Graha Maitri', 'Friendship of the Moon-sign lords'],
  gana: ['Gana', 'Temperament: Deva, Manushya, Rakshasa'],
  bhakoot: ['Bhakoot', 'Moon-sign distance: family and prosperity'],
  nadi: ['Nadi', 'Constitution and progeny'],
};

const BAND = {
  excellent: ['Excellent match', 'good'],
  good: ['Good match', 'good'],
  fair: ['Average match', 'warn'],
  low: ['Below the usual 18-point minimum', 'bad'],
};

function Ring({ value, max }) {
  const r = 62, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 150 150" className="score-ring" role="img" aria-label={`${value} of ${max}`}>
      <circle cx="75" cy="75" r={r} fill="none" stroke="var(--neutral-soft)" strokeWidth="12" />
      <circle cx="75" cy="75" r={r} fill="none" stroke="var(--brand)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${(value / max) * c} ${c}`} transform="rotate(-90 75 75)" />
      <text x="75" y="70" textAnchor="middle" style={{ fontSize: 34, fontWeight: 800, fill: 'var(--ink)' }}>{value}</text>
      <text x="75" y="94" textAnchor="middle" style={{ fontSize: 13, fontWeight: 600, fill: 'var(--ink-3)' }}>of {max}</text>
    </svg>
  );
}

export default function MatchingPage() {
  const { profiles } = useProfiles();
  const boys = profiles.filter((p) => p.gender !== 'female');
  const girls = profiles.filter((p) => p.gender !== 'male');
  const [gId, setG] = useState(() => boys[0]?.id ?? '');
  const [bId, setB] = useState(() => girls.find((p) => p.id !== boys[0]?.id)?.id ?? '');

  if (profiles.length === 0) return <NeedProfile what="kundli matching" />;
  if (profiles.length < 2) {
    return (
      <div className="card empty">
        <h2 style={{ fontSize: 20 }}>Matching needs two profiles</h2>
        <p className="muted">Add the second person’s birth details to compare charts.</p>
        <Link to="/profiles?new=1" className="btn">Add another profile</Link>
      </div>
    );
  }

  const groom = profiles.find((p) => p.id === gId);
  const bride = profiles.find((p) => p.id === bId);
  const m = groom && bride && groom.id !== bride.id ? match(groom, bride) : null;

  return (
    <>
      <PageHead title="Kundli Match" subtitle="Ashtakoot compatibility out of 36 points." pill={false} />
      <section className="card">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="m-g">Groom</label>
            <select id="m-g" className="select" value={gId} onChange={(e) => setG(e.target.value)}>
              <option value="">Choose…</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-b">Bride</label>
            <select id="m-b" className="select" value={bId} onChange={(e) => setB(e.target.value)}>
              <option value="">Choose…</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      {!m && <p className="note">Choose two different profiles to see the Ashtakoot score.</p>}

      {m && (
        <>
          <section className="card row" style={{ gap: 24, flexWrap: 'wrap' }}>
            <Ring value={m.total} max={m.max} />
            <div style={{ display: 'grid', gap: 8, flex: '1 1 260px', minWidth: 0 }}>
              <span className={`pill ${BAND[m.band][1]}`} style={{ justifySelf: 'start' }}>{BAND[m.band][0]}</span>
              <h2 style={{ fontSize: 22 }}>{groom.name} &amp; {bride.name}</h2>
              <p className="muted small">
                {groom.name}: Moon in {m.groomMoon.signName}, {m.groomMoon.nakshatraName} · {bride.name}: Moon in {m.brideMoon.signName}, {m.brideMoon.nakshatraName}
              </p>
              {m.kootas.nadi.points === 0 && <span className="pill bad" style={{ justifySelf: 'start' }}>Nadi dosha: both {m.kootas.nadi.groom}</span>}
              {m.kootas.bhakoot.points === 0 && <span className="pill bad" style={{ justifySelf: 'start' }}>Bhakoot dosha</span>}
            </div>
          </section>

          <section className="card">
            <div className="card-head"><h2>Ashtakoot breakdown</h2><span className="sub">8 kootas, 36 points</span></div>
            <div className="table-wrap">
              <table className="t tnum">
                <thead><tr><th>Koota</th><th>What it reflects</th><th style={{ textAlign: 'right' }}>Score</th><th style={{ width: 140 }}></th></tr></thead>
                <tbody>
                  {Object.entries(m.kootas).map(([key, r]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 700 }}>{KOOTA_INFO[key][0]}</td>
                      <td className="muted" style={{ whiteSpace: 'normal', minWidth: 160 }}>{KOOTA_INFO[key][1]}{r.groom ? ` (${r.groom} / ${r.bride})` : ''}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.points} / {r.max}</td>
                      <td><div className="bar" style={{ marginTop: 0 }}><i style={{ width: `${(r.points / r.max) * 100}%`, background: r.points === 0 ? 'var(--bad)' : undefined }} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
