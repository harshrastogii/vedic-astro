import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useProfiles } from '../lib/store.jsx';
import { REPORT_TYPES, buildReport } from '../lib/reports.js';
import PageHead from '../components/PageHead.jsx';
import { NeedProfile } from '../components/Common.jsx';
import ReportGlyph from '../components/ReportIcon.jsx';
import { ArrowRightIcon } from '../components/Icons.jsx';

export default function ReportsPage() {
  const { active } = useProfiles();
  const verdicts = useMemo(() => (active ? Object.fromEntries(REPORT_TYPES.map((t) => [t.id, buildReport(t.id, active).verdict])) : {}), [active]);
  if (!active) return <NeedProfile what="your reports" />;
  return (
    <>
      <PageHead title="Reports" subtitle="Detailed readings calculated from your chart, each with an optional AI-written explanation." />
      <div className="grid-3">
        {REPORT_TYPES.map((t) => (
          <Link key={t.id} to={`/reports/${t.id}`} className="card report-card">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <ReportGlyph icon={t.icon} />
              <span className={`pill ${verdicts[t.id].tone}`}>{verdicts[t.id].label}</span>
            </div>
            <h2>{t.title}</h2>
            <p className="muted">{t.tagline}</p>
            <span className="link">Open report <ArrowRightIcon /></span>
          </Link>
        ))}
      </div>
    </>
  );
}
