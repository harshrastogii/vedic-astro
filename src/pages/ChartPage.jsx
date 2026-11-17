import { useEffect, useState } from 'react';
import { useProfiles } from '../lib/store.jsx';
import { kundli, PLANET_ORDER, fmtDeg, ordinal } from '../lib/astro.js';
import { RASHIS, RASHI_LORD, NAKSHATRAS, NAKSHATRA_LORD, nakshatraOf, padaOf } from '../engine/index.js';
import { fmtDateTime, utcOffsetLabel } from '../lib/tz.js';
import { fmtCoord } from '../lib/places.js';
import { ChartView } from '../components/Charts.jsx';
import { NeedProfile, Stat } from '../components/Common.jsx';

function useChartStyle() {
  const [style, setStyle] = useState(() => { try { return localStorage.getItem('vae.chartStyle') || 'north'; } catch { return 'north'; } });
  useEffect(() => { try { localStorage.setItem('vae.chartStyle', style); } catch { /* ignore */ } }, [style]);
  return [style, setStyle];
}

export default function ChartPage() {
  const { active } = useProfiles();
  const [style, setStyle] = useChartStyle();
  if (!active) return <NeedProfile what="your birth chart" />;

  const k = kundli(active);
  const { chart, d9 } = k;
  const tz = active.place.tz;
  const asc = chart.ascendant;
  const ascNak = nakshatraOf(asc);

  const styleToggle = (
    <div className="seg" role="group" aria-label="Chart style">
      <button className={style === 'north' ? 'on' : ''} onClick={() => setStyle('north')}>North</button>
      <button className={style === 'south' ? 'on' : ''} onClick={() => setStyle('south')}>South</button>
    </div>
  );

  return (
    <>
      <section className="grid-4">
        <Stat label="Born" value={fmtDateTime(k.birthDate, tz)} meta={`${utcOffsetLabel(k.birthDate, tz)} · ${tz}`} />
        <Stat label="Place" value={active.place.name.split(',')[0]} meta={fmtCoord(active.place.lat, active.place.lon)} />
        <Stat label="Ascendant" value={`${RASHIS[chart.ascendantSign]} ${fmtDeg(asc % 30)}`} meta={`${NAKSHATRAS[ascNak]} pada ${padaOf(asc)}`} />
        <Stat label="Ayanamsa" value={fmtDeg(chart.ayanamsa)} meta="Lahiri (Chitrapaksha)" />
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-head"><div><h2>Rasi (D1)</h2><div className="sub">Whole-sign houses from the ascendant</div></div>{styleToggle}</div>
          <ChartView chart={chart} style={style} title="Rasi" />
        </div>
        <div className="card">
          <div className="card-head"><div><h2>Navamsa (D9)</h2><div className="sub">Ascendant {d9.ascendantSignName}</div></div>{styleToggle}</div>
          <ChartView chart={d9} style={style} title="Navamsa" />
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Planetary positions</h2><span className="sub">Sidereal · ᴿ = retrograde</span></div>
        <div className="table-wrap">
          <table className="t tnum">
            <thead>
              <tr><th>Planet</th><th>Sign</th><th>Degree</th><th>Nakshatra</th><th>Pada</th><th>Nak. lord</th><th>House</th><th>Sign lord</th><th>Navamsa</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--brand)' }}>Ascendant</td>
                <td>{RASHIS[chart.ascendantSign]}</td>
                <td>{fmtDeg(asc % 30)}</td>
                <td>{NAKSHATRAS[ascNak]}</td>
                <td>{padaOf(asc)}</td>
                <td>{NAKSHATRA_LORD[ascNak]}</td>
                <td>1st</td>
                <td>{RASHI_LORD[chart.ascendantSign]}</td>
                <td>{d9.ascendantSignName}</td>
              </tr>
              {PLANET_ORDER.map((name) => {
                const p = chart.planets[name];
                return (
                  <tr key={name}>
                    <td style={{ fontWeight: 700 }}>{name}{p.retrograde && name !== 'Rahu' && name !== 'Ketu' && <span style={{ color: 'var(--bad)' }}> ᴿ</span>}</td>
                    <td>{p.signName}</td>
                    <td>{fmtDeg(p.degree)}</td>
                    <td>{p.nakshatraName}</td>
                    <td>{p.pada}</td>
                    <td>{p.nakshatraLord}</td>
                    <td>{ordinal(p.house)}</td>
                    <td>{p.signLord}</td>
                    <td>{d9.planets[name].signName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Houses</h2><span className="sub">Sign and occupants of each bhava</span></div>
        <div className="grid-4">
          {chart.houseToSign.map((sign, i) => {
            const occ = PLANET_ORDER.filter((n) => chart.planets[n].sign === sign);
            return (
              <div key={i} className="stat">
                <div className="label">{ordinal(i + 1)} house</div>
                <div className="value" style={{ fontSize: 15 }}>{RASHIS[sign]}</div>
                <div className="meta">Lord {RASHI_LORD[sign]}{occ.length ? ` · ${occ.join(', ')}` : ''}</div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
