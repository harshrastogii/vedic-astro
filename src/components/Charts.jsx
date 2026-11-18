// Kundli charts in North, South and East Indian styles.
// chart: { ascendantSign, planets: { Name: { sign } } }
// ascSign (optional): sign of the true ascendant, labelled "Asc" (defaults to house 1).

import { PLANET_ABBR, PLANET_ORDER } from '../lib/astro.js';
import { HOUSE_COLOR, SIGN_ABBR } from '../lib/symbols.js';

function bySign(chart) {
  const out = Array.from({ length: 12 }, () => []);
  for (const n of PLANET_ORDER) {
    const p = chart.planets[n];
    if (p) out[p.sign].push(PLANET_ABBR[n]);
  }
  return out;
}

const chunk = (arr, n) => {
  const rows = [];
  for (let i = 0; i < arr.length; i += n) rows.push(arr.slice(i, i + n).join(' '));
  return rows;
};

// ---------------------------------------------------------------- North
// 420 × 280 canvas. Per house (H1 = top diamond, then anticlockwise):
// sign-number position, label centre, planets per line.
const NW = 420, NH = 280;
const NORTH = [
  { s: [210, 21], c: [210, 70], per: 3 },
  { s: [46.2, 16.8], c: [105, 46.2], per: 3 },
  { s: [21, 70], c: [58.8, 70], per: 2 },
  { s: [31.5, 140], c: [105, 140], per: 3 },
  { s: [21, 210], c: [58.8, 210], per: 2 },
  { s: [46.2, 263.2], c: [105, 233.8], per: 3 },
  { s: [210, 259], c: [210, 210], per: 3 },
  { s: [373.8, 263.2], c: [315, 233.8], per: 3 },
  { s: [399, 210], c: [361.2, 210], per: 2 },
  { s: [388.5, 140], c: [315, 140], per: 3 },
  { s: [399, 70], c: [361.2, 70], per: 2 },
  { s: [373.8, 16.8], c: [315, 46.2], per: 3 },
];

export function NorthChart({ chart, ascSign = chart.ascendantSign, title = 'Chart' }) {
  const by = bySign(chart);
  return (
    <svg className="chart-svg rect" viewBox={`-1 -1 ${NW + 2} ${NH + 2}`} role="img" aria-label={`${title}, North Indian style`}>
      <path className="lagna-fill" d="M210 0L315 70L210 140L105 70Z" />
      <rect className="ln" x="0" y="0" width={NW} height={NH} />
      <path className="ln" d={`M0 0L${NW} ${NH}M${NW} 0L0 ${NH}M210 0L${NW} 140L210 ${NH}L0 140Z`} />
      {NORTH.map((h, i) => {
        const sign = (chart.ascendantSign + i) % 12;
        const lines = chunk(by[sign], h.per);
        const asc = sign === ascSign;
        const [cx, cy] = h.c;
        const n = lines.length + (asc ? 1 : 0);
        const shift = n ? 11.2 + (n - 1) * 7 : 0;
        const top = cy - shift;
        return (
          <g key={i}>
            <text x={h.s[0]} y={h.s[1]} className="sno" textAnchor="middle" dominantBaseline="central">{sign + 1}</text>
            <text x={cx} y={top} className="hlabel" fill={HOUSE_COLOR[i]} textAnchor="middle" dominantBaseline="central">H{i + 1}</text>
            {lines.map((t, j) => (
              <text key={j} x={cx} y={top + 14.7 + j * 14} className="pl" textAnchor="middle" dominantBaseline="central">{t}</text>
            ))}
            {asc && <text x={cx} y={top + 14.7 + lines.length * 14 + (lines.length ? 0.7 : 0)} className="pl" style={{ fontSize: 11.9 }} textAnchor="middle" dominantBaseline="central">Asc</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------- South
// 280 × 280, 4 × 4 cells of 70; signs fixed, Pisces top-left, clockwise.
const SC = 70;
const SOUTH = [[11, 0, 0], [0, 1, 0], [1, 2, 0], [2, 3, 0], [3, 3, 1], [4, 3, 2], [5, 3, 3], [6, 2, 3], [7, 1, 3], [8, 0, 3], [9, 0, 2], [10, 0, 1]];

export function SouthChart({ chart, ascSign = chart.ascendantSign, title = 'Chart' }) {
  const by = bySign(chart);
  return (
    <svg className="chart-svg square" viewBox="-1 -1 282 282" role="img" aria-label={`${title}, South Indian style`}>
      {SOUTH.map(([sign, col, row]) => sign === chart.ascendantSign && (
        <rect key="lf" className="lagna-fill" x={col * SC} y={row * SC} width={SC} height={SC} />
      ))}
      <path className="ln" d="M0 0H280V280H0ZM70 0V280M210 0V280M140 0V70M140 210V280M0 70H280M0 210H280M0 140H70M210 140H280" />
      {SOUTH.map(([sign, col, row]) => {
        const x = col * SC, y = row * SC;
        const house = ((sign - chart.ascendantSign + 12) % 12) + 1;
        const lines = chunk(by[sign], 2);
        const isLagna = house === 1;
        const numY = lines.length ? y + 22.5 : y + 34.5;
        const blockTop = y + 42.5 - (lines.length - 1) * 7;
        return (
          <g key={sign}>
            <text x={x + 8} y={y + 16} className="sno">{SIGN_ABBR[sign]}</text>
            {sign === ascSign && <path className="cross" d={`M${x + 4} ${y + 4}L${x + 24} ${y + 22}M${x + 24} ${y + 4}L${x + 4} ${y + 22}`} />}
            <text x={x + 35} y={numY} className={`hno${isLagna ? ' lagna' : ''}`} textAnchor="middle" dominantBaseline="central">{house}</text>
            {lines.map((t, j) => (
              <text key={j} x={x + 35} y={blockTop + j * 15} className="pl sm" textAnchor="middle" dominantBaseline="central">{t}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------- East
// 280 × 280, 3 × 3 grid; corner cells split diagonally; Aries top-middle,
// signs run anticlockwise.
const EC = 280 / 3;
// [sign, cell col, cell row, region] — region: mid | ur | ll | ul | lr (triangle within the corner)
const EAST = [
  [0, 1, 0, 'mid'], [1, 0, 0, 'ur'], [2, 0, 0, 'll'], [3, 0, 1, 'mid'],
  [4, 0, 2, 'ul'], [5, 0, 2, 'lr'], [6, 1, 2, 'mid'], [7, 2, 2, 'll'],
  [8, 2, 2, 'ur'], [9, 2, 1, 'mid'], [10, 2, 0, 'lr'], [11, 2, 0, 'ul'],
];
const TRI_CENTRE = { ur: [2 / 3, 1 / 3], ll: [1 / 3, 2 / 3], ul: [1 / 3, 1 / 3], lr: [2 / 3, 2 / 3] };

export function EastChart({ chart, ascSign = chart.ascendantSign, title = 'Chart' }) {
  const by = bySign(chart);
  const c = EC, c2 = 2 * EC;
  return (
    <svg className="chart-svg square" viewBox="-1 -1 282 282" role="img" aria-label={`${title}, East Indian style`}>
      {EAST.filter(([s]) => s === chart.ascendantSign).map(([s, col, row, reg]) => {
        const x = col * c, y = row * c;
        const pts = {
          mid: `${x},${y} ${x + c},${y} ${x + c},${y + c} ${x},${y + c}`,
          ur: `${x},${y} ${x + c},${y} ${x + c},${y + c}`,
          ll: `${x},${y} ${x},${y + c} ${x + c},${y + c}`,
          ul: `${x},${y} ${x + c},${y} ${x},${y + c}`,
          lr: `${x + c},${y} ${x + c},${y + c} ${x},${y + c}`,
        }[reg];
        return <polygon key={s} className="lagna-fill" points={pts} />;
      })}
      <path className="ln" d={`M0 0H280V280H0ZM${c} 0V280M${c2} 0V280M0 ${c}H280M0 ${c2}H280
        M0 0L${c} ${c}M${c2} ${c}L280 0M0 280L${c} ${c2}M${c2} ${c2}L280 280`} />
      {EAST.map(([sign, col, row, reg]) => {
        const x = col * c, y = row * c;
        const house = ((sign - chart.ascendantSign + 12) % 12) + 1;
        const isLagna = house === 1;
        if (reg === 'mid') {
          const lines = chunk(by[sign], 3);
          return (
            <g key={sign}>
              <text x={x + c / 2} y={y + 28.5} className="sno" textAnchor="middle" dominantBaseline="central">{SIGN_ABBR[sign]}</text>
              <text x={x + c / 2} y={y + 45.5} className={`hno${isLagna ? ' lagna' : ''}`} textAnchor="middle" dominantBaseline="central">{house}</text>
              {lines.map((t, j) => <text key={j} x={x + c / 2} y={y + 62.5 + j * 14} className="pl sm" textAnchor="middle" dominantBaseline="central">{t}</text>)}
              {sign === ascSign && !isLagna && <text x={x + c / 2} y={y + 62.5 + lines.length * 14} className="pl sm" textAnchor="middle" dominantBaseline="central">Asc</text>}
            </g>
          );
        }
        const lines = chunk(by[sign], 2);
        const [fx, fy] = TRI_CENTRE[reg];
        const n = 1 + lines.length;
        const blockH = (n > 1 ? 17.5 : 0) + Math.max(0, lines.length - 1) * 14;
        const top = y + fy * c - 3 - blockH / 2;
        const cx = x + fx * c;
        return (
          <g key={sign}>
            <text x={cx} y={top} className={`hno${isLagna ? ' lagna' : ''}`} textAnchor="middle" dominantBaseline="central">{house}</text>
            {lines.map((t, j) => <text key={j} x={cx} y={top + 17.5 + j * 14} className="pl sm" textAnchor="middle" dominantBaseline="central">{t}</text>)}
          </g>
        );
      })}
    </svg>
  );
}

export function ChartView({ chart, style, title, ascSign }) {
  if (style === 'south') return <SouthChart chart={chart} title={title} ascSign={ascSign} />;
  if (style === 'east') return <EastChart chart={chart} title={title} ascSign={ascSign} />;
  return <NorthChart chart={chart} title={title} ascSign={ascSign} />;
}

export function ChartLegend() {
  return (
    <div className="legend">
      <span><i className="sw" />Ascendant</span>
      <span><b>Su</b>Planets</span>
    </div>
  );
}
