// Public configuration. These values are safe to ship to the browser:
// the publishable key only allows what the database's row-level security permits.
export const SUPABASE_URL = 'https://dhyzxfotmntbaiuvdaed.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_QGoZMrOk9Qrol4H0qltZQQ_VhT8yGSS';

// Chat server (Vercel). Override for local testing with VITE_CHAT_API_URL.
export const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'https://vedic-astro-chat.vercel.app/api/chat';

export const BASE = import.meta.env.BASE_URL; // "/" locally, "/vedic-astro/" on GitHub Pages
