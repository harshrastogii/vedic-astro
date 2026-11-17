// Minimal, safe Markdown for chat replies: paragraphs, headings, bullet and
// numbered lists, **bold**, *italic*. Builds React elements (no innerHTML).

function inline(text, keyBase) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    out.push(tok.startsWith('**')
      ? <strong key={`${keyBase}-${i++}`}>{tok.slice(2, -2)}</strong>
      : <em key={`${keyBase}-${i++}`}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks = [];
  let list = null;
  let para = [];

  const flushPara = () => { if (para.length) { blocks.push({ t: 'p', text: para.join(' ') }); para = []; } };
  const flushList = () => { if (list) { blocks.push(list); list = null; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const head = line.match(/^#{1,4}\s+(.*)$/);
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if (head) { flushPara(); flushList(); blocks.push({ t: 'h', text: head[1] }); continue; }
    if (bullet || num) {
      flushPara();
      const type = bullet ? 'ul' : 'ol';
      if (!list || list.t !== type) { flushList(); list = { t: type, items: [] }; }
      list.items.push((bullet || num)[1]);
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();

  return (
    <div className="md">
      {blocks.map((b, i) => {
        if (b.t === 'h') return <h4 key={i}>{inline(b.text, i)}</h4>;
        if (b.t === 'p') return <p key={i}>{inline(b.text, i)}</p>;
        const L = b.t;
        return <L key={i}>{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</L>;
      })}
    </div>
  );
}
