import { PLANET_GLYPH, PLANET_TONE, SIGN_GLYPH, SIGN_COLOR } from '../lib/symbols.js';
import { RASHIS } from '../engine/index.js';

export function PlanetBadge({ planet, small }) {
  const [bg, fg] = PLANET_TONE[planet] ?? ['#666', '#fff'];
  return (
    <span className={`planet-badge glyph${small ? ' sm' : ''}`} style={{ background: bg, color: fg }} title={planet} aria-label={planet}>
      {PLANET_GLYPH[planet]}
    </span>
  );
}

export function SignGlyph({ sign, size }) {
  return <span className="glyph" style={{ color: SIGN_COLOR[sign], fontSize: size }} aria-hidden="true">{SIGN_GLYPH[sign]}</span>;
}

export function SignLabel({ sign, children, colored }) {
  return (
    <span className="sign-label" style={colored ? { color: SIGN_COLOR[sign] } : undefined}>
      <SignGlyph sign={sign} />{children ?? RASHIS[sign]}
    </span>
  );
}
