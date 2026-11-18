// Chat endpoint for Vedic Astro, deployed on Vercel.
// - Verifies the caller's Supabase login and only answers allow-listed GitHub accounts.
// - Calls a free model through Vercel AI Gateway. On Vercel the gateway is
//   authenticated automatically (OIDC), so no API key is stored anywhere.
// - Streams plain text back. The browser saves the conversation in Supabase.

import { streamText } from 'ai';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const ALLOWED_GITHUB_IDS = (process.env.ALLOWED_GITHUB_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

const PRIMARY_MODEL = process.env.CHAT_MODEL || 'nvidia/nemotron-3.5-lightning-free';
const FALLBACK_MODELS = (process.env.CHAT_FALLBACK_MODELS || 'reflection/beam-free').split(',').map((s) => s.trim()).filter(Boolean);

const MAX_HISTORY = 30;           // messages sent to the model
const MAX_MESSAGE_CHARS = 8000;   // per message
const MAX_CONTEXT_CHARS = 20000;  // chart summary

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

async function getUser(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY },
  });
  if (!res.ok) return null;
  return res.json();
}

function githubId(user) {
  const gh = (user.identities || []).find((i) => i.provider === 'github');
  return String(gh?.identity_data?.provider_id ?? gh?.id ?? user.user_metadata?.provider_id ?? '');
}

const SYSTEM_PROMPT = `You are a warm, knowledgeable Vedic astrology guide inside the "Vedic Astro" app.
You answer questions about the user's birth chart using the chart data supplied below, which the app
calculated (sidereal zodiac, Lahiri ayanamsa, whole-sign houses, Vimshottari dasha).

How to answer:
- Base every statement on the supplied chart data. Name the placements you are using (for example
  "Saturn in your 10th house in Pisces", "your current Rahu–Mercury dasha").
- Use plain, friendly English. Briefly explain any Sanskrit term the first time you use it.
- Be balanced: mention strengths as well as challenges, and avoid fear-based language.
- Give timing using the dasha periods and dates supplied; do not invent dates.
- If the data needed is missing (for example a divisional chart that was not supplied), say so.
- For health, legal or money decisions, say astrology is not a substitute for a qualified professional.
- Keep answers focused: short paragraphs or a few bullet points, usually under 300 words unless asked for more.`;

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function POST(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json(request, 401, { error: 'Please sign in to chat.' });

  const user = await getUser(token);
  if (!user) return json(request, 401, { error: 'Your session has expired. Please sign in again.' });
  if (ALLOWED_GITHUB_IDS.length && !ALLOWED_GITHUB_IDS.includes(githubId(user))) {
    return json(request, 403, { error: 'Chat is not enabled for this account.' });
  }

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: 'Invalid request.' }); }

  const history = Array.isArray(body.messages) ? body.messages : [];
  const messages = history
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  if (!messages.length || messages.at(-1).role !== 'user') return json(request, 400, { error: 'No question to answer.' });

  const context = typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT_CHARS) : '';
  const system = context ? `${SYSTEM_PROMPT}\n\n--- CHART DATA ---\n${context}` : SYSTEM_PROMPT;

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
