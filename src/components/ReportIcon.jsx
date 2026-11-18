import { PLANET_GLYPH } from '../lib/symbols.js';
import { MatchIcon, WheelIcon, GemIcon, CrownIcon, SunIcon, PlaneIcon } from './Icons.jsx';

const GLYPH = { mars: PLANET_GLYPH.Mars, saturn: PLANET_GLYPH.Saturn, snake: PLANET_GLYPH.Rahu };
const SVG = { heart: MatchIcon, wheel: WheelIcon, gem: GemIcon, crown: CrownIcon, sun: SunIcon, plane: PlaneIcon };

export default function ReportGlyph({ icon, size = 44 }) {
  const Svg = SVG[icon];
  return (
    <span className="report-ic" style={{ width: size, height: size }}>
      {Svg ? <span style={{ width: size * 0.5, height: size * 0.5, display: 'grid' }}><Svg /></span> : <span className="glyph" style={{ fontSize: size * 0.5 }}>{GLYPH[icon]}</span>}
    </span>
  );
}
