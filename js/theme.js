// Light/Dark theme management, persisted in localStorage.

const KEY = 'mpes-theme';

export function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch { /* ignore */ }
  const preferred = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = saved || preferred;
  setTheme(theme, false);
  return theme;
}

export function setTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  }
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function currentTheme() {
  return document.documentElement.dataset.theme || 'light';
}
