import { useState } from 'react';
import { useProfiles } from '../lib/store.jsx';
import { kundli, currentPeriod } from '../lib/astro.js';
import { pratyantardashas } from '../engine/index.js';
import { fmtDate } from '../lib/tz.js';
import { NeedProfile, PlanetDot, Stat } from '../components/Common.jsx';
import { ChevronIcon } from '../components/Icons.jsx';

const within = (now, p) => now >= p.startDate && now < p.endDate;
const yrs = (y) => (y >= 1 ? `${y.toFixed(1)} yrs` : `${Math.round(y * 12)} mo`);

export default function DashaPage() {
  const { active } = useProfiles();
  const now = new Date();
  const k = active && kundli(active);
  const cur = k && currentPeriod(k.dasha, now);
  const [openMd, setOpenMd] = useState(() => cur?.mahadasha.startDate.getTime() ?? null);
  const [openAd, setOpenAd] = useState(() => cur?.antardasha?.startDate.getTime() ?? null);

  if (!active) return <NeedProfile what="your dasha timeline" />;
  const tz = active.place.tz;
  const { dasha } = k;

  return (
    <>
      <section className="grid-4">
        <Stat label="Birth nakshatra" value={dasha.nakshatraName} meta={`Lord ${dasha.startingLord}`} />
        <Stat label="Balance at birth" value={`${dasha.startingLord} ${yrs(dasha.balanceYears)}`} />
        <Stat label="Current" value={cur ? `${cur.mahadasha.lord} / ${cur.antardasha?.lord}` : 'Beyond 120 years'} meta={cur?.pratyantar ? `Pratyantar ${cur.pratyantar.lord}` : ''} />
        <Stat label="Antardasha ends" value={cur?.antardasha ? fmtDate(cur.antardasha.endDate, tz) : '—'} />
      </section>

      <section className="card">
        <div className="card-head"><h2>Vimshottari mahadashas</h2><span className="sub">Tap a period to see its antardashas</span></div>
        {dasha.mahadashas.map((md) => {
          const key = md.startDate.getTime();
          const isCur = within(now, md);
          const isOpen = openMd === key;
          const span = md.endDate - md.startDate;
          const pct = isCur ? ((now - md.startDate) / span) * 100 : now >= md.endDate ? 100 : 0;
          return (
            <div key={key} className={`dasha-row${isCur ? ' current' : ''}${isOpen ? ' open' : ''}`}>
              <button onClick={() => setOpenMd(isOpen ? null : key)} aria-expanded={isOpen}>
                <PlanetDot planet={md.lord} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>
                    {md.lord} Mahadasha {isCur && <span className="pill brand" style={{ marginLeft: 6 }}>Now</span>}
                    {md.partial && <span className="pill neutral" style={{ marginLeft: 6 }}>Balance at birth</span>}
                  </div>
                  <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                </div>
                <div className="small muted tnum" style={{ textAlign: 'right' }}>
                  {fmtDate(md.startDate, tz)} – {fmtDate(md.endDate, tz)}<br />{yrs(md.years)}
                </div>
                <ChevronIcon className="chev" />
              </button>
              {isOpen && (
                <div className="sub-list">
                  {md.antardashas.map((ad) => {
                    const ak = ad.startDate.getTime();
                    const adCur = within(now, ad);
                    const adOpen = openAd === ak;
                    return (
                      <div key={ak}>
                        <button className={`sub-item${adCur ? ' current' : ''}`} onClick={() => setOpenAd(adOpen ? null : ak)} aria-expanded={adOpen}>
                          <span>{md.lord} – {ad.lord}{ad.partial ? ' (from birth)' : ''}</span>
                          <span className="tnum small">{fmtDate(ad.startDate, tz)} – {fmtDate(ad.endDate, tz)}</span>
                        </button>
                        {adOpen && (
                          <div className="pd-list tnum">
                            {pratyantardashas(ad).map((pd) => (
                              <div key={pd.startDate.getTime()} className={within(now, pd) ? 'current' : ''}>
                                <span>{ad.lord} – {pd.lord}</span>
                                <span>{fmtDate(pd.startDate, tz)} – {fmtDate(pd.endDate, tz)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}
