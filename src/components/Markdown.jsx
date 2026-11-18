// Safe Markdown for AI replies. Builds React elements (no innerHTML).
// Handles what the models actually send: paragraphs, headings, bullet and
// numbered lists (one level of nesting), tables, quotes, horizontal rules,
// **bold**, *italic*, `code` and links. Also tidies typography the models
// overuse (em dashes, non-breaking hyphens, emoji in headings).

/** Cleans model typography so replies read like normal writing. */
export function tidy(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[‐‑‒]/g, '-')               // odd hyphens -> plain hyphen
    .replace(/ | /g, ' ')                      // non-breaking spaces
    .replace(/(\d)\s*—\s*(\d)/g, '$1 to $2')        // 2011—2031 -> 2011 to 2031
    .replace(/^(\s*(?:[-*•]|\d+[.)])?\s*)—\s*/gm, '$1') // dash opening a line
    .replace(/\s*—\s*/g, ', ')                      // other em dashes -> comma
    .replace(/,\s*([,.;:!?)])/g, '$1')                   // ", ." -> "."
    .replace(/[ \t]+$/gm, '');                           // trailing spaces ("  " line breaks)
}

const EMOJI = /^(?:[\p{Extended_Pictographic}\p{Emoji_Component}️‍]|\s)+/u;
const stripEmoji = (s) => {
  const out = s.replace(EMOJI, '');
  return /[A-Za-z0-9]/.test(out) ? out : s;
};

function inline(text, keyBase) {
  const out = [];
  const re = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith('***')) out.push(<strong key={key}><em>{tok.slice(3, -3)}</em></strong>);
    else if (tok.startsWith('**') || tok.startsWith('__')) out.push(<strong key={key}>{inline(tok.slice(2, -2), key)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('[')) {
      const [, label, href] = tok.match(/^\[([^\]]+)\]\((.+)\)$/);
      out.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer">{label}</a>);
    } else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l) || (/\S\s*\|\s*\S/.test(l) && l.split('|').length >= 3);
const isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

export default function Markdown({ text }) {
  const lines = tidy(text).split('\n');
  const blocks = [];
  let list = null;
  let para = [];
  let quote = [];

  const flushPara = () => { if (para.length) { blocks.push({ t: 'p', lines: para }); para = []; } };
  const flushList = () => { if (list) { blocks.push(list); list = null; } };
  const flushQuote = () => { if (quote.length) { blocks.push({ t: 'quote', text: quote.join(' ') }); quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (!line.trim()) { flushAll(); continue; }

    // Table: a header row followed by a |---|---| separator.
    if (isTableRow(line) && idx + 1 < lines.length && isTableSep(lines[idx + 1])) {
      flushAll();
      const head = cells(line);
      const rows = [];
      idx += 2;
      while (idx < lines.length && lines[idx].trim() && isTableRow(lines[idx]) && !isTableSep(lines[idx])) {
        rows.push(cells(lines[idx]));
        idx++;
      }
      idx--;
      blocks.push({ t: 'table', head, rows });
      continue;
    }
    if (isTableSep(line) && line.includes('|')) continue; // stray separator

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flushAll(); blocks.push({ t: 'hr' }); continue; }

    const head = line.match(/^\s*#{1,6}\s+(.*?)\s*#*\s*$/);
    if (head) { flushAll(); blocks.push({ t: 'h', text: stripEmoji(head[1]) }); continue; }

    const q = line.match(/^\s*>\s?(.*)$/);
    if (q) { flushPara(); flushList(); quote.push(q[1]); continue; }

    const item = line.match(/^(\s*)(?:([-*+•])|(\d+)[.)])\s+(.*)$/);
    if (item) {
      flushPara(); flushQuote();
      const nested = item[1].replace(/\t/g, '    ').length >= 2 && list && list.items.length;
      const type = item[2] ? 'ul' : 'ol';
      if (nested) {
        const parent = list.items[list.items.length - 1];
        if (!parent.sub || parent.sub.t !== type) parent.sub = { t: type, items: [] };
        parent.sub.items.push({ text: item[4] });
        continue;
      }
      if (!list || list.t !== type) { flushList(); list = { t: type, items: [] }; }
      list.items.push({ text: item[4] });
      continue;
    }

    // A line under a list item that isn't a new item continues that item.
    if (list && /^\s{2,}\S/.test(line)) {
      const last = list.items[list.items.length - 1];
      last.text += ` ${line.trim()}`;
      continue;
    }
    flushList(); flushQuote();
    para.push(line.trim());
  }
  flushAll();

  const renderList = (b, key) => {
    const L = b.t;
    return (
      <L key={key}>
        {b.items.map((it, j) => (
          <li key={j}>{inline(it.text, `${key}-${j}`)}{it.sub && renderList(it.sub, `${key}-${j}s`)}</li>
        ))}
      </L>
    );
  };

  return (
    <div className="md">
      {blocks.map((b, i) => {
        if (b.t === 'h') return <h4 key={i}>{inline(b.text, i)}</h4>;
        if (b.t === 'p') return <p key={i}>{b.lines.map((l, j) => [j > 0 && <br key={`b${j}`} />, ...inline(l, `${i}-${j}`)])}</p>;
        if (b.t === 'hr') return <hr key={i} />;
        if (b.t === 'quote') return <blockquote key={i}>{inline(b.text, i)}</blockquote>;
        if (b.t === 'table') {
          return (
            <div key={i} className="md-table">
              <table>
                <thead><tr>{b.head.map((c, j) => <th key={j}>{inline(c, `${i}-h${j}`)}</th>)}</tr></thead>
                <tbody>
                  {b.rows.map((r, j) => (
                    <tr key={j}>{b.head.map((_, k) => <td key={k}>{inline(r[k] ?? '', `${i}-${j}-${k}`)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return renderList(b, i);
      })}
    </div>
  );
}
