import { useProfiles } from '../lib/store.jsx';
import { kundli, doshas, ordinal } from '../lib/astro.js';
import { NeedProfile } from '../components/Common.jsx';
import { CheckIcon, XIcon } from '../components/Icons.jsx';
import PageHead from '../components/PageHead.jsx';

function Verdict({ present, cancelled, label }) {
  if (present) return <span className="pill bad">{label ?? 'Present'}</span>;
  if (cancelled) return <span className="pill warn">Present but cancelled</span>;
  return <span className="pill good">Not present</span>;
}

function Factors({ items, good }) {
  if (!items?.length) return null;
  return (
    <ul className="list-reset">
      {items.map((f) => (
        <li key={f} className="factor" style={{ color: good ? 'var(--good)' : 'var(--bad)' }}>
          {good ? <CheckIcon /> : <XIcon />}<span style={{ color: 'var(--ink)' }}>{f}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DoshaPage() {
  const { active } = useProfiles();
  if (!active) return <NeedProfile what="dosha checks" />;
  const k = kundli(active);
  const d = doshas(k);
  const { mangal, kalsarp, pitra, sadeSati } = d;

  return (
    <>
    <PageHead title="Doshas" subtitle="Mangal, Kaal Sarp, Pitra and Sade Sati checks from your chart." />
    <section className="grid-2">
      <article className="card">
        <div className="card-head">
          <h2>Mangal dosha</h2>
          <Verdict present={mangal.present} cancelled={mangal.cancelled} label={`Present · ${mangal.severity}`} />
        </div>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Checks whether Mars falls in the 1st, 2nd, 4th, 7th, 8th or 12th house counted from the ascendant, the Moon and Venus.
        </p>
        <dl className="kv" style={{ marginBottom: 12 }}>
          <dt>Mars</dt><dd>{k.chart.planets.Mars.signName}, {ordinal(mangal.marsHouse)} house</dd>
          <dt>Triggered from</dt><dd>{mangal.triggers.length ? mangal.triggers.join(', ') : 'None'}</dd>
        </dl>
        {mangal.cancellationFactors.length > 0 && <>
          <div className="small muted" style={{ fontWeight: 700 }}>Cancellation factors</div>
          <Factors items={mangal.cancellationFactors} good />
        </>}
      </article>

      <article className="card">
        <div className="card-head">
          <h2>Kaal Sarp dosha</h2>
          <Verdict present={kalsarp.present} label={kalsarp.complete ? 'Complete' : 'Partial'} />
        </div>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Checks whether the seven planets all sit on one side of the Rahu–Ketu axis.
        </p>
        <dl className="kv">
          <dt>Rahu / Ketu</dt><dd>{kalsarp.rahuSign} / {kalsarp.ketuSign}</dd>
          <dt>On one side</dt><dd>{kalsarp.hemmedCount} of 7 ({kalsarp.side === 'rahu-to-ketu' ? 'Rahu → Ketu' : 'Ketu → Rahu'})</dd>
          <dt>Planets there</dt><dd style={{ whiteSpace: 'normal' }}>{kalsarp.hemmedPlanets.join(', ') || '—'}</dd>
          <dt>Outside</dt><dd style={{ whiteSpace: 'normal' }}>{kalsarp.outsidePlanets.join(', ') || 'None'}</dd>
        </dl>
      </article>

      <article className="card">
        <div className="card-head">
          <h2>Pitra dosha</h2>
          <Verdict present={pitra.present} cancelled={pitra.cancelled} label={`Present · ${pitra.severity}`} />
        </div>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Looks for an afflicted Sun: joined with Rahu or Saturn, or placed in the 6th, 8th or 12th house.
        </p>
        {pitra.factors.length ? <Factors items={pitra.factors} /> : <p className="small">No afflicting factors found.</p>}
        {pitra.cancellationFactors.length > 0 && <>
          <div className="small muted" style={{ fontWeight: 700, marginTop: 10 }}>Mitigating factors</div>
          <Factors items={pitra.cancellationFactors} good />
        </>}
      </article>

      <article className="card">
        <div className="card-head">
          <h2>Sade Sati</h2>
          {sadeSati.present ? <span className={`pill ${sadeSati.phaseKey === 'peak' ? 'bad' : 'warn'}`}>{sadeSati.phase}</span> : <span className="pill good">Not running</span>}
        </div>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Saturn’s current transit through the 12th, 1st or 2nd sign from your natal Moon.
        </p>
        <dl className="kv">
          <dt>Natal Moon</dt><dd>{sadeSati.moonSign}</dd>
          <dt>Saturn today</dt><dd>{sadeSati.saturnSign}</dd>
        </dl>
      </article>
    </section>
    </>
  );
}
