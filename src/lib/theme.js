// Dark is the default look; the choice is remembered in this browser.
const KEY = 'vae.theme';
export function getTheme() {
  try { return localStorage.getItem(KEY) || 'dark'; } catch { return 'dark'; }
}
export function setTheme(t) {
  document.documentElement.dataset.theme = t;
  // Phone browser bar follows the theme.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#f4f4f5' : '#09090b');
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
}
