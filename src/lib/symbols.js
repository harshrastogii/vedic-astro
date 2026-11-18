// Astrological symbols drawn from Unicode (text presentation, not emoji),
// with our own colour palette.
const T = '︎';
export const PLANET_GLYPH = {
  Sun: '☉' + T, Moon: '☽' + T, Mars: '♂' + T, Mercury: '☿' + T, Jupiter: '♃' + T,
  Venus: '♀' + T, Saturn: '♄' + T, Rahu: '☊' + T, Ketu: '☋' + T,
};
// [background, foreground]
export const PLANET_TONE = {
  Sun: ['#f59e0b', '#fff7e6'], Moon: ['#cbd5e1', '#1e293b'], Mars: ['#ef4444', '#fff1f1'],
  Mercury: ['#10b981', '#ecfdf5'], Jupiter: ['#eab308', '#422006'], Venus: ['#ec4899', '#fdf2f8'],
  Saturn: ['#6366f1', '#eef2ff'], Rahu: ['#8b5cf6', '#f5f3ff'], Ketu: ['#14b8a6', '#f0fdfa'],
};
export const SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((g) => g + T);
export const SIGN_COLOR = [
  '#f87171', '#4ade80', '#facc15', '#38bdf8', '#fb923c', '#a3e635',
  '#f472b6', '#fb7185', '#a78bfa', '#94a3b8', '#60a5fa', '#2dd4bf',
];
export const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Ca', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
// House-label colours in the North chart (one per house).
export const HOUSE_COLOR = [
  '#ef4444', '#10b981', '#f59e0b', '#0ea5e9', '#f97316', '#14b8a6',
  '#ec4899', '#f43f5e', '#8b5cf6', '#78716c', '#3b82f6', '#6366f1',
];
// What each bhava (house) traditionally governs.
export const HOUSE_MEANING = [
  'Self & Personality', 'Wealth & Speech', 'Courage & Siblings', 'Home & Mother',
  'Children & Creativity', 'Health & Rivals', 'Marriage & Partners', 'Change & Longevity',
  'Fortune & Dharma', 'Career & Status', 'Gains & Friends', 'Expenses & Release',
];
