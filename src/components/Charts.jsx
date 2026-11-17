import { PLANET_ABBR, PLANET_ORDER, SIGN_SHORT } from '../lib/astro.js';

const W = 400;
const q = W / 4, h = W / 2, tq = (3 * W) / 4;
const C = [h, h];

// North Indian: house polygons (anticlockwise from the top diamond), label centre, inner vertex.
const NORTH = [
  { poly: [[h, 0], [tq, q], [h, h], [q, q]], c: [h, q], inner: C },
  { poly: [[0, 0], [h, 0], [q, q]], c: [q, W / 10], inner: [q, q] },
  { poly: [[0, 0], [q, q], [0, h]], c: [W / 10, q], inner: [q, q] },
  { poly: [[0, h], [q, q], [h, h], [q, tq]], c: [q, h], inner: C },
  { poly: [[0, h], [q, tq], [0, W]], c: [W / 10, tq], inner: [q, tq] },
  { poly: [[0, W], [q, tq], [h, W]], c: [q, W - W / 10], inner: [q, tq] },
  { poly: [[h, W], [q, tq], [h, h], [tq, tq]], c: [h, tq], inner: C },
  { poly: [[h, W], [tq, tq], [W, W]], c: [tq, W - W / 10], inner: [tq, tq] },
  { poly: [[W, W], [tq, tq], [W, h]], c: [W - W / 10, tq], inner: [tq, tq] },
  { poly: [[W, h], [tq, tq], [h, h], [tq, q]], c: [tq, h], inner: C },
  { poly: [[W, h], [tq, q], [W, 0]], c: [W - W / 10, q], inner: [tq, q] },
  { poly: [[W, 0], [tq, q], [h, 0]], c: [tq, W / 10], inner: [tq, q] },
];

function planetsBySign(chart) {
  const by = Array.from({ length: 12 }, () => []);
  for (const name of PLANET_ORDER) {
    const p = chart.planets[name];
    // Rahu/Ketu (mean nodes) always move backwards, so charts don't mark them.
    const retro = p.retrograde && name !== 'Rahu' && name !== 'Ketu';
    by[p.sign].push({ name, abbr: PLANET_ABBR[name], retro, deg: p.degree });
  }
  return by;
}

function Stack({ x, y, items, asc, lineH = 15 }) {
  const all = [...(asc ? [{ abbr: 'Asc', asc: true }] : []), ...items];
  // two columns when crowded
  const cols = all.length > 3 ? 2 : 1;
  const rows = Math.ceil(all.length / cols);
  return all.map((it, i) => {
    const col = cols === 2 ? i % 2 : 0;
    const row = cols === 2 ? Math.floor(i / 2) : i;
    const dx = cols === 2 ? (col === 0 ? -16 : 16) : 0;
    const dy = (row - (rows - 1) / 2) * lineH;
    return (
      <text key={i} x={x + dx} y={y + dy} textAnchor="middle" dominantBaseline="central"
        className={`pl${it.asc ? ' asc' : ''}${it.retro ? ' retro' : ''}`}>
        {it.abbr}{it.retro ? 'ᴿ' : ''}
        {it.deg != null && <title>{`${it.name} ${it.deg.toFixed(2)}°${it.retro ? ' retrograde' : ''}`}</title>}
      </text>
    );
  });
}

/** chart: { ascendantSign, planets: {Name: {sign, retrograde, degree?}} } */
export function NorthChart({ chart, title }) {
  const by = planetsBySign(chart);
  return (
    <svg className="chart-svg" viewBox={`-2 -2 ${W + 4} ${W + 4}`} role="img" aria-label={`${title} — North Indian style`}>
      <rect className="frame" x="0" y="0" width={W} height={W} />
      <path className="line" d={`M0 0L${W} ${W}M${W} 0L0 ${W}M${h} 0L${W} ${h}L${h} ${W}L0 ${h}Z`} />
      {NORTH.map((hs, i) => {
        const sign = (chart.ascendantSign + i) % 12;
        const [cx, cy] = hs.c;
        const [ix, iy] = hs.inner;
        const vx = cx - ix, vy = cy - iy, len = Math.hypot(vx, vy);
        const nx = ix + (vx / len) * 16, ny = iy + (vy / len) * 16;
        return (
          <g key={i}>
            <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central" className="signno">{sign + 1}</text>
            <Stack x={cx} y={cy} items={by[sign]} asc={i === 0} />
          </g>
        );
      })}
    </svg>
  );
}

// South Indian: signs are fixed; Pisces top-left, running clockwise.
const SOUTH_CELLS = [
  [11, 0, 0], [0, 1, 0], [1, 2, 0], [2, 3, 0],
  [10, 0, 1], [3, 3, 1],
  [9, 0, 2], [4, 3, 2],
  [8, 0, 3], [7, 1, 3], [6, 2, 3], [5, 3, 3],
];

export function SouthChart({ chart, title }) {
  const by = planetsBySign(chart);
  const s = W / 4;
  return (
    <svg className="chart-svg" viewBox={`-2 -2 ${W + 4} ${W + 4}`} role="img" aria-label={`${title} — South Indian style`}>
      {SOUTH_CELLS.map(([sign, col, row]) => {
        const x = col * s, y = row * s;
        const lagna = sign === chart.ascendantSign;
        return (
          <g key={sign}>
            <rect className={`cell${lagna ? ' lagna' : ''}`} x={x} y={y} width={s} height={s} />
            {lagna && <path className="line" d={`M${x} ${y + 22}L${x + 22} ${y}`} />}
            <text x={x + s - 8} y={y + 14} textAnchor="end" className="signno">{SIGN_SHORT[sign]}</text>
            <Stack x={x + s / 2} y={y + s / 2 + 6} items={by[sign]} asc={lagna} />
          </g>
        );
      })}
      <rect className="cell" x={s} y={s} width={2 * s} height={2 * s} style={{ fill: 'transparent' }} />
      <text x={h} y={h} textAnchor="middle" dominantBaseline="central" className="center-text">{title}</text>
    </svg>
  );
}

export function ChartView({ chart, style, title }) {
  return style === 'south' ? <SouthChart chart={chart} title={title} /> : <NorthChart chart={chart} title={title} />;
}
