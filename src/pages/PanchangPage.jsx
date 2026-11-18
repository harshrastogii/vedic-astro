import { useMemo, useState } from 'react';
import { useProfiles } from '../lib/store.jsx';
import { dayPanchang } from '../engine/index.js';
import { CITIES } from '../lib/places.js';
import { fmtDate, fmtTime, todayIn, untilLabel } from '../lib/tz.js';
import PlacePicker from '../components/PlacePicker.jsx';
import { Stat } from '../components/Common.jsx';
import { SunIcon, MoonIcon } from '../components/Icons.jsx';
import PageHead from '../components/PageHead.jsx';

function shiftDate(s, days) {
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

export default function PanchangPage() {
  const { active } = useProfiles();
  const [place, setPlace] = useState(() => active?.place ?? CITIES[0]);
  const [date, setDate] = useState(() => todayIn(place.tz));
  const tz = place.tz;

  const p = useMemo(() => dayPanchang(date, place.lat, place.lon, tz), [date, place.lat, place.lon, tz]);
  const now = new Date();
  const t = (d) => fmtTime(d, tz);
  const range = (r) => (r ? `${t(r.start)} – ${t(r.end)}` : '—');
  const nowIn = (r) => r && now >= r.start && now < r.end;
  const dayLabel = fmtDate(new Date(`${date}T12:00:00Z`), 'UTC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const limbs = [
    { label: 'Tithi', value: `${p.tithi.paksha} ${p.tithi.name}`, end: p.tithi.endsAt, next: p.tithi.next && `${p.tithi.next.paksha} ${p.tithi.next.name}` },
    { label: 'Nakshatra', value: `${p.nakshatra.name} · pada ${p.nakshatra.pada}`, end: p.nakshatra.endsAt, next: p.nakshatra.next?.name },
    { label: 'Yoga', value: p.yoga.name, end: p.yoga.endsAt },
    { label: 'Karana', value: p.karana.name, end: p.karana.endsAt },
    { label: 'Vaara', value: p.vaara.name, meta: `Ruled by ${p.vaara.lord}` },
  ];

  return (
    <>
      <PageHead title="Panchang" subtitle="Tithi, nakshatra, yoga, karana and the day’s muhurtas for any date and place." pill={false} />
      <section className="card">
        <div className="form-grid" style={{ alignItems: 'end' }}>
          <div className="field">
            <label htmlFor="pc-date">Date</label>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <button className="icon-btn" aria-label="Previous day" onClick={() => setDate(shiftDate(date, -1))}>‹</button>
              <input id="pc-date" type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
              <button className="icon-btn" aria-label="Next day" onClick={() => setDate(shiftDate(date, 1))}>›</button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="pc-place">Location</label>
            <PlacePicker id="pc-place" value={place} onChange={setPlace} />
          </div>
        </div>
      </section>

      <section className="hero" style={{ paddingBottom: 22 }}>
        <div className="eyebrow">{dayLabel}</div>
        <h2>{p.tithi.paksha} {p.tithi.name}, {p.lunarMonth.name}</h2>
        <p>
          Vikram Samvat {p.samvat.vikram} · Shaka {p.samvat.shaka} · Moon in {p.moonSign}, Sun in {p.sunSign}
          {p.ekadashi && ' · Ekadashi'}{p.purnima && ' · Purnima'}{p.amavasya && ' · Amavasya'}
        </p>
      </section>

      <section className="grid-4">
        <Stat label={<span className="row" style={{ gap: 6 }}><span style={{ width: 14, height: 14, display: 'inline-grid' }}><SunIcon /></span>Sunrise</span>} value={t(p.sunrise)} />
        <Stat label="Sunset" value={t(p.sunset)} />
        <Stat label="Day length" value={p.dayLength ? `${Math.floor(p.dayLength / 3600000)}h ${Math.round((p.dayLength % 3600000) / 60000)}m` : '—'} />
        <Stat label={<span className="row" style={{ gap: 6 }}><span style={{ width: 14, height: 14, display: 'inline-grid' }}><MoonIcon /></span>Next sunrise</span>} value={t(p.nextSunrise)} />
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-head"><h2>Five limbs</h2><span className="sub">At sunrise, with end times</span></div>
          <table className="t">
            <tbody>
              {limbs.map((l) => (
                <tr key={l.label}>
                  <td className="muted" style={{ fontWeight: 600, width: 100 }}>{l.label}</td>
                  <td style={{ whiteSpace: 'normal' }}>
                    <div style={{ fontWeight: 700 }}>{l.value}</div>
                    {l.end && <div className="small muted">till {untilLabel(l.end, date, tz)}{l.next ? ` · then ${l.next}` : ''}</div>}
                    {l.meta && <div className="small muted">{l.meta}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head"><h2>Muhurtas</h2><span className="sub">Times in {tz}</span></div>
          <table className="t">
            <tbody>
              <Row label="Brahma Muhurta" value={range(p.brahmaMuhurta)} tone="good" now={nowIn(p.brahmaMuhurta)} />
              <Row label="Abhijit" value={p.abhijit?.applicable ? range(p.abhijit) : 'Not observed on Wednesday'} tone="good" now={p.abhijit?.applicable && nowIn(p.abhijit)} />
              <Row label="Rahu Kaal" value={range(p.rahuKaal)} tone="bad" now={nowIn(p.rahuKaal)} />
              <Row label="Yamaganda" value={range(p.yamaganda)} tone="bad" now={nowIn(p.yamaganda)} />
              <Row label="Gulika Kaal" value={range(p.gulika)} tone="bad" now={nowIn(p.gulika)} />
            </tbody>
          </table>
        </div>
      </section>

      {p.choghadiya && (
        <section className="card">
          <div className="card-head"><h2>Choghadiya</h2><span className="sub">Green auspicious · red avoid · grey neutral</span></div>
          <div style={{ display: 'grid', gap: 16 }}>
            {[['Day', p.choghadiya.day], ['Night', p.choghadiya.night]].map(([label, list]) => (
              <div key={label}>
                <div className="small muted" style={{ fontWeight: 700, marginBottom: 8 }}>{label}</div>
                <div className="timeline-strip">
                  {list.map((c) => (
                    <div key={c.start.getTime()} className={`q-${c.quality}${nowIn(c) ? ' now-ring' : ''}`}>
                      {c.name}
                      <div className="t tnum">{t(c.start)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="note">
        Calculated with Lahiri ayanamsa. Limbs are read at local sunrise. Lunar months follow the amanta
        (new-moon to new-moon) system; adhika (leap) months are not flagged yet.
      </p>
    </>
  );
}

function Row({ label, value, tone, now }) {
  return (
    <tr>
      <td className="muted" style={{ fontWeight: 600 }}>{label}</td>
      <td className="tnum" style={{ fontWeight: 700, textAlign: 'right', whiteSpace: 'normal' }}>
        {now && <span className={`pill ${tone === 'good' ? 'good' : 'bad'}`} style={{ marginRight: 8 }}>Now</span>}{value}
      </td>
    </tr>
  );
}
