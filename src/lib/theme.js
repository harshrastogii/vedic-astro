// Dark is the default look; the choice is remembered in this browser.
const KEY = 'vae.theme';
export function getTheme() {
  try { return localStorage.getItem(KEY) || 'dark'; } catch { return 'dark'; }
}
let fadeTimer;
export function setTheme(t) {
  const root = document.documentElement;
  if (root.dataset.theme && root.dataset.theme !== t) {
    root.classList.add('theme-fade');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => root.classList.remove('theme-fade'), 350);
  }
  root.dataset.theme = t;
  // Phone browser bar follows the theme.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#f4f4f5' : '#09090b');
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
}
