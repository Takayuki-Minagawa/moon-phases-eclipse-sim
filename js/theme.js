// Light/Dark theme management, persisted in localStorage.

const KEY = 'mpes-theme';

export function initTheme() {
  const saved = localStorage.getItem(KEY);
  const preferred = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = saved || preferred;
  setTheme(theme);
  return theme;
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
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
