// Chat endpoint for Vedic Astro, deployed on Vercel.
// - Answers any signed-in user (verified with Supabase). Each user's data stays
//   private through row-level security; this endpoint stores nothing itself.
// - Calls a free model through Vercel AI Gateway. On Vercel the gateway is
//   authenticated automatically (OIDC), so no API key is stored anywhere.
// - Streams plain text back. The browser saves the conversation in Supabase.

import { streamText } from 'ai';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

const PRIMARY_MODEL = process.env.CHAT_MODEL || 'nvidia/nemotron-3.5-lightning-free';
const FALLBACK_MODELS = (process.env.CHAT_FALLBACK_MODELS || 'reflection/beam-free').split(',').map((s) => s.trim()).filter(Boolean);

const MAX_HISTORY = 30;           // messages sent to the model
const MAX_MESSAGE_CHARS = 8000;   // per message
const MAX_CONTEXT_CHARS = 30000;  // chart summary

function cors(request) {
  const origin = request.headers.get('origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(request, status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(request) } });
}

// Returns the user, null for an invalid/expired token, or throws if Supabase
// itself can't be reached (so a network blip isn't reported as "signed out").
async function getUser(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error(`auth server ${res.status}`);
  return res.json();
}


// Writing rules shared by chat and reports. The free models default to a
// "report" voice (tables, emoji headings, em dashes); these keep replies readable.
const STYLE = `Writing style (important):
- Write in plain sentences, the way a thoughtful person talks. No em dashes or en dashes as punctuation; use commas, full stops or "and" instead.
- Do not use tables, emojis, horizontal rules or code blocks.
- Use ordinary hyphens (-) only, never special hyphen characters.
- **Bold** only a few key placements or dates, never whole sentences.`;

const SYSTEM_PROMPT = `You are a warm, knowledgeable Vedic astrology guide chatting with the user inside the "Vedic Astro" app.
You answer questions about the user's birth chart using the chart data supplied below, which the app
calculated (sidereal zodiac, Lahiri ayanamsa, whole-sign houses, Vimshottari dasha).

How to answer:
- This is a chat, not a report. Answer the question directly in the first sentence or two, then explain.
- Short questions get short answers (2 to 4 short paragraphs). Only use "### " headings when the user asks for a detailed or multi-part reading; a few bullet points are fine when listing things.
- Do not greet the user or sign off in every message, and do not repeat the question back.
- Base every statement on the supplied chart data. Name the placements you are using (for example
  "Saturn in your 12th house in Taurus", "your current Venus/Saturn period").
- Dasha periods: always name them exactly as given (mahadasha/antardasha/pratyantar, e.g. Venus/Saturn/Rahu). Use only the dates supplied; never invent or shift dates.
- Explain any Sanskrit term briefly the first time you use it.
- Be balanced: mention strengths as well as challenges, and avoid fear-based language.
- If the data needed is missing (for example a divisional chart that was not supplied), say so.
- For health, legal or money decisions, add one short line that astrology is not a substitute for a qualified professional. Do not add this disclaimer to other answers.
- Usually under 250 words unless the user asks for more.

${STYLE}`;

const REPORT_PROMPT = `You are an experienced Vedic astrologer writing a personal report inside the "Vedic Astro" app.
The app has already calculated everything: the chart data and the REPORT FACTS below are authoritative.

Rules:
- Use only the placements, verdicts, dates and yogas given. Never invent positions, yogas or dates.
- Do not contradict the report's verdict.
- Structure: a short opening paragraph with the overall picture, then 3 to 5 sections with "## " headings
  (for example: what it means, how it shows up in life, timing, practical guidance and remedies), ending with a brief summary.
- Plain, warm English. Explain each Sanskrit term briefly the first time.
- Balanced and non-fatalistic: say what helps, not just what is difficult. Traditional remedies may be suggested as optional.
- For health, legal or financial decisions, note that astrology is not a substitute for a professional.
- Length: about 450 to 700 words.

${STYLE}`;

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function POST(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json(request, 401, { error: 'Please sign in to chat.' });

  let user;
  try { user = await getUser(token); } catch (err) {
    console.error('auth check failed', err);
    return json(request, 503, { error: 'Could not check your sign-in just now. Please try again in a moment.' });
  }
  if (!user) return json(request, 401, { error: 'Your session has expired. Please sign in again.' });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: 'Invalid request.' }); }

  const history = Array.isArray(body.messages) ? body.messages : [];
  const messages = history
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  if (!messages.length || messages.at(-1).role !== 'user') return json(request, 400, { error: 'No question to answer.' });

  const context = typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT_CHARS) : '';
  const base = body.mode === 'report' ? REPORT_PROMPT : SYSTEM_PROMPT;
  const system = context ? `${base}\n\n--- CHART DATA ---\n${context}` : base;

  try {
    const result = streamText({
      model: PRIMARY_MODEL,
      system,
      messages,
      // The free models "think" before answering. Keep thinking short and leave
      // plenty of room, otherwise long chart questions can use the whole budget
      // on thinking and return an empty answer.
      reasoning: 'low',
      maxOutputTokens: 8000,
      providerOptions: { gateway: { models: FALLBACK_MODELS } },
      abortSignal: request.signal,
      onError: ({ error }) => console.error('stream error', error),
      onFinish: ({ finishReason, usage, text, response }) => console.log('chat finished', JSON.stringify({
        finishReason, chars: text.length, model: response?.modelId, usage,
      })),
    });
    return result.toTextStreamResponse({ headers: { ...cors(request), 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('chat error', err);
    return json(request, 502, { error: 'The AI service is unavailable right now. Please try again.' });
  }
}
