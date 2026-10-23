// Application entry: state, inputs, render loop, learning panel.

import {
  computeState, dateToDay, dayToDate, findSynodic, findEclipse, newMoonBefore,
  dayForSynodicInLunation, inEclipseSeason, wrap180, SYNODIC_MONTH,
} from './simulation.js';
import { drawOverhead, hitMoon, pointerToSynodic } from './overheadView.js';
import { drawMoonView } from './moonView.js';
import { drawEclipseChart } from './eclipseChart.js';
import { drawTimeline, timelineDayAt, yearData } from './timeline.js';
import { setLang, getLang, initialLang, applyStaticI18n, t, tr, formatDateTime } from './i18n.js';
import { buildExplainHtml, buildFaqHtml, buildGlossaryHtml, eclipseName, escapeHtml } from './learningTexts.js';
import { buildQuestion } from './quiz.js';
import { MISSIONS, loadProgress, saveProgress, checkMissions } from './missions.js';
import { phaseIconSVG, PHASE_SYNODIC } from './moonShape.js';
import { initTheme, toggleTheme, currentTheme } from './theme.js';

const HOUR = 1 / 24;
const STATS_KEY = 'mpes-quiz';

const state = {
  day: dateToDay(new Date()),
  playing: false,
  speed: 1,              // simulated days per second
  tilt: true,
  mode: 'geo',
  showGuide: true,
  zoom: 1,
  rotateDeg: 0,
  autoPause: true,
  // interaction
  dragging: false,
  hover: false,
  everDragged: false,
  dragLunation: 0,
  dragPrevSyn: 0,
  dragAccum: 0,
  dragTurns: 0,
  userActed: false,
  tab: 'explain',
};

const quizStats = loadStats();
let quiz = null;
let progress = loadProgress();
let nextEclipseCache = null;   // { from, tilt, ec }
let lastSig = { explain: '', cal: '', missions: '', badge: '' };
let current = null;            // latest computed state

const el = id => document.getElementById(id);

// ---------- init ----------

function init() {
  initTheme();
  setLang(initialLang());
  readUrl();
  el('langSelect').value = getLang();
  refreshStatic();

  bindControls();
  bindOverhead();
  bindTimeline();
  bindTabs();
  bindLearn();
  bindTopbar();
  bindKeys();

  setMode(state.mode, false);
  el('tiltToggle').checked = state.tilt;
  updateTilt();
  newQuiz();
  renderMissions();

  let seen = null;
  try { seen = localStorage.getItem('mpes-help-seen'); } catch { /* ignore */ }
  if (!seen && !location.search) openHelp();

  requestAnimationFrame(loop);
}

function refreshStatic() {
  applyStaticI18n();
  document.title = t('app.title');
  document.querySelectorAll('[data-icon]').forEach(n => { n.innerHTML = phaseIconSVG(n.dataset.icon, 22); });
  el('faqBody').innerHTML = buildFaqHtml();
  el('glossaryBody').innerHTML = buildGlossaryHtml();
  updatePlayBtn();
  updateTilt();
  renderQuiz();
  renderMissions();
  renderStats();
  lastSig = { explain: '', cal: '', missions: '', badge: '' };
}

// ---------- time helpers ----------

function setDay(day, opts = {}) {
  state.day = day;
  nextEclipseCache = null;
  if (!opts.keepPlaying) setPlaying(false);
  if (opts.user !== false) state.userActed = true;
}

function setPlaying(on) {
  state.playing = on;
  updatePlayBtn();
}

function updatePlayBtn() {
  el('playBtn').textContent = state.playing ? `⏸ ${t('ui.pause')}` : `▶ ${t('ui.play')}`;
  el('playBtn').setAttribute('aria-pressed', String(state.playing));
}

function jumpToPhase(key) {
  setDay(findSynodic(state.day, PHASE_SYNODIC[key], 1));
}

function jumpToEclipse(kind, dir, type = null) {
  let from = state.day;
  for (let i = 0; i < 40; i++) {
    const ec = findEclipse(from, dir, kind, { tilt: state.tilt });
    if (!ec) break;
    if (!type || ec.type === type) { setDay(ec.day); return ec; }
    from = ec.day;
  }
  toast(t('ui.notFound'));
  return null;
}

// ---------- controls ----------

function bindControls() {
  el('playBtn').addEventListener('click', () => {
    setPlaying(!state.playing);
    if (state.playing) state.userActed = true;
  });
  el('speedSelect').addEventListener('change', e => { state.speed = parseFloat(e.target.value); });

  document.querySelectorAll('[data-step]').forEach(b => {
    b.addEventListener('click', () => setDay(state.day + parseFloat(b.dataset.step), { keepPlaying: true }));
  });
  el('dateInput').addEventListener('change', e => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    const cur = dayToDate(state.day);
    setDay(dateToDay(new Date(y, m - 1, d, cur.getHours(), cur.getMinutes())));
  });
  el('nowBtn').addEventListener('click', () => setDay(dateToDay(new Date())));

  const slider = el('angleSlider');
  let lunation = null;
  slider.addEventListener('input', () => {
    if (lunation == null) lunation = newMoonBefore(state.day);
    setDay(dayForSynodicInLunation(lunation, parseFloat(slider.value)));
  });
  slider.addEventListener('change', () => { lunation = null; });

  document.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => jumpToPhase(b.dataset.jump)));
  document.querySelectorAll('[data-eclipse]').forEach(b => {
    b.addEventListener('click', () => jumpToEclipse(b.dataset.eclipse, parseInt(b.dataset.dir, 10)));
  });
  el('autoPause').addEventListener('change', e => { state.autoPause = e.target.checked; });

  el('tiltToggle').addEventListener('change', e => {
    state.tilt = e.target.checked;
    state.userActed = true;
    nextEclipseCache = null;
    updateTilt();
  });

  el('guideToggle').addEventListener('change', e => { state.showGuide = e.target.checked; });
  el('zoomSlider').addEventListener('input', e => { state.zoom = parseFloat(e.target.value); });
  el('rotateSlider').addEventListener('input', e => { state.rotateDeg = parseFloat(e.target.value); });
  el('viewReset').addEventListener('click', () => {
    state.zoom = 1; state.rotateDeg = 0;
    el('zoomSlider').value = '1';
    el('rotateSlider').value = '0';
  });
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
}

function updateTilt() {
  el('tiltState').textContent = state.tilt ? t('ui.tiltOn') : t('ui.tiltOff');
}

function setMode(mode, user = true) {
  state.mode = mode;
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  if (user) state.userActed = true;
}

// Drag the Moon around Earth in the overhead view.
function bindOverhead() {
  const cv = el('overhead');
  const pos = e => {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  cv.addEventListener('pointerdown', e => {
    const [x, y] = pos(e);
    if (!hitMoon(x, y)) return;
    state.dragging = true;
    state.everDragged = true;
    state.dragLunation = newMoonBefore(state.day);
    state.dragPrevSyn = current ? current.synodic : 0;
    setPlaying(false);
    cv.setPointerCapture(e.pointerId);
    cv.classList.add('is-grabbing');
    e.preventDefault();
  });
  cv.addEventListener('pointermove', e => {
    const [x, y] = pos(e);
    if (!state.dragging) {
      state.hover = hitMoon(x, y);
      cv.style.cursor = state.hover ? 'grab' : 'default';
      return;
    }
    const syn = pointerToSynodic(x, y, current);
    if (syn == null) return;
    const d = wrap180(syn - state.dragPrevSyn);
    // Crossing new moon moves into the next / previous lunation
    if (state.dragPrevSyn > 270 && syn < 90) state.dragLunation = findSynodic(state.dragLunation + 1, 0, 1);
    else if (state.dragPrevSyn < 90 && syn > 270) state.dragLunation = findSynodic(state.dragLunation - 1, 0, -1);
    state.dragAccum += d;
    state.dragTurns = Math.max(state.dragTurns, Math.abs(state.dragAccum) / 360);
    state.dragPrevSyn = syn;
    setDay(dayForSynodicInLunation(state.dragLunation, syn));
  });
  const end = e => {
    if (!state.dragging) return;
    state.dragging = false;
    state.dragAccum = 0;
    cv.classList.remove('is-grabbing');
    if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId);
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', () => { if (!state.dragging) state.hover = false; });
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    state.zoom = Math.min(2.2, Math.max(0.6, state.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
    el('zoomSlider').value = String(state.zoom);
  }, { passive: false });
}

function bindTimeline() {
  const cv = el('timeline');
  let down = false;
  const at = e => {
    const r = cv.getBoundingClientRect();
    setDay(timelineDayAt(e.clientX - r.left, r.width, state.day));
  };
  cv.addEventListener('pointerdown', e => { down = true; cv.setPointerCapture(e.pointerId); at(e); });
  cv.addEventListener('pointermove', e => { if (down) at(e); });
  cv.addEventListener('pointerup', () => { down = false; });
  cv.addEventListener('pointercancel', () => { down = false; });
  cv.addEventListener('keydown', e => {
    const steps = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: 1, ArrowDown: -1, PageUp: SYNODIC_MONTH, PageDown: -SYNODIC_MONTH };
    if (e.key in steps) {
      e.preventDefault();
      setDay(state.day + steps[e.key] * (e.shiftKey && Math.abs(steps[e.key]) === 1 ? 7 : 1));
    }
  });
  el('yearPrev').addEventListener('click', () => shiftYear(-1));
  el('yearNext').addEventListener('click', () => shiftYear(1));
}

function shiftYear(n) {
  const d = dayToDate(state.day);
  d.setFullYear(d.getFullYear() + n);
  setDay(dateToDay(d));
}

function bindKeys() {
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'select', 'textarea', 'button'].includes(tag) || e.target.isContentEditable) return;
    if (e.target.id === 'timeline' || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === ' ') {
      e.preventDefault();
      setPlaying(!state.playing);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const sign = e.key === 'ArrowRight' ? 1 : -1;
      setDay(state.day + sign * (e.shiftKey ? 1 : HOUR), { keepPlaying: true });
    }
  });
}

function bindTopbar() {
  el('themeToggle').addEventListener('click', () => toggleTheme());
  el('langSelect').addEventListener('change', e => {
    setLang(e.target.value);
    refreshStatic();
  });
  el('helpBtn').addEventListener('click', openHelp);
  el('helpDialog').addEventListener('close', () => {
    try { localStorage.setItem('mpes-help-seen', '1'); } catch { /* ignore */ }
  });
  el('shareBtn').addEventListener('click', shareLink);
}

function openHelp() {
  const d = el('helpDialog');
  if (typeof d.showModal === 'function') d.showModal();
}

// ---------- tabs ----------

function bindTabs() {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const activate = (tab, focus = true) => {
    tabs.forEach(tb => {
      const on = tb === tab;
      tb.classList.toggle('tab--active', on);
      tb.setAttribute('aria-selected', String(on));
      tb.tabIndex = on ? 0 : -1;
      el(`tab-${tb.dataset.tab}`).hidden = !on;
    });
    state.tab = tab.dataset.tab;
    if (state.tab === 'quiz') applyQuizJump();
    if (focus) tab.focus();
  };
  tabs.forEach(tb => tb.addEventListener('click', () => activate(tb)));
  tabs[0].parentElement.addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const map = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 };
    if (e.key in map) {
      e.preventDefault();
      activate(tabs[(map[e.key] + tabs.length) % tabs.length]);
    }
  });
}

// ---------- learning panel ----------

function bindLearn() {
  el('quizKind').addEventListener('change', newQuiz);
  el('quizNext').addEventListener('click', newQuiz);
  el('quizDemo').addEventListener('click', () => quiz?.demo && runDemo(quiz.demo));
  el('missionReset').addEventListener('click', () => {
    progress = {};
    saveProgress(progress);
    state.dragTurns = 0;
    renderMissions();
  });
  el('glossaryBody').addEventListener('click', e => {
    const b = e.target.closest('[data-demo]');
    if (b) runDemo(b.dataset.demo);
  });
  el('calList').addEventListener('click', e => {
    const b = e.target.closest('[data-day]');
    if (b) { setDay(parseFloat(b.dataset.day)); revealViews(); }
  });
}

function runDemo(code) {
  const [kind, arg] = code.split(':');
  switch (kind) {
    case 'phase': jumpToPhase(arg); break;
    case 'mode': setMode(arg); break;
    case 'helio': setMode('helio'); setPlaying(true); el('speedSelect').value = '4'; state.speed = 4; break;
    case 'guide': setMode('geo'); state.showGuide = true; el('guideToggle').checked = true; break;
    case 'eclipse': jumpToEclipse(arg, 1); break;
    case 'solar': jumpToEclipse('solar', 1); break;
    case 'lunar': jumpToEclipse('lunar', 1); break;
    case 'totalLunar': jumpToEclipse('lunar', 1, 'total'); break;
    case 'penumbral': jumpToEclipse('lunar', 1, 'penumbral'); break;
    case 'annular': jumpToEclipse('solar', 1, 'annular'); break;
    case 'tiltOffSolar':
      state.tilt = false;
      el('tiltToggle').checked = false;
      updateTilt();
      jumpToPhase('new');
      break;
    default: break;
  }
  revealViews();
}

function revealViews() {
  if (window.innerWidth <= 1280) {
    document.querySelector('.panel--views').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Quiz ------------------------------------------------------------------

function loadStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
    return { ok: 0, total: 0, streak: 0, best: s.best || 0, lifetimeOk: s.lifetimeOk || 0 };
  } catch { return { ok: 0, total: 0, streak: 0, best: 0, lifetimeOk: 0 }; }
}
function saveStats() {
  try { localStorage.setItem(STATS_KEY, JSON.stringify({ best: quizStats.best, lifetimeOk: quizStats.lifetimeOk })); } catch { /* ignore */ }
}

function newQuiz() {
  quiz = buildQuestion(el('quizKind').value);
  quiz.answered = false;
  quiz.chosen = null;
  quiz.pendingJump = quiz.setPhase != null;
  if (state.tab === 'quiz') applyQuizJump();
  renderQuiz();
}

// Phase questions move the simulation to the phase being asked about — but
// only once the quiz tab is actually open.
function applyQuizJump() {
  if (!quiz?.pendingJump) return;
  quiz.pendingJump = false;
  // Land somewhere inside the phase's range, not always on the same angle.
  const jitter = quiz.setPhase === 'new' ? 4 : (Math.random() - 0.5) * 14;
  state.day = findSynodic(state.day, PHASE_SYNODIC[quiz.setPhase] + jitter, 1);
  nextEclipseCache = null;
  setPlaying(false);
}

function quizHides() {
  return quiz && !quiz.answered && state.tab === 'quiz' && quiz.setPhase != null;
}

function renderQuiz() {
  if (!quiz) return;
  el('quizQuestion').textContent = quiz.text();
  const box = el('quizChoices');
  box.innerHTML = '';
  for (const c of quiz.choices) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.type = 'button';
    b.innerHTML = `${c.icon ? phaseIconSVG(c.icon, 26) : ''}<span>${escapeHtml(c.label())}</span>`;
    if (quiz.answered) {
      b.disabled = true;
      if (c.key === quiz.answer) b.dataset.state = 'ok';
      else if (c.key === quiz.chosen) b.dataset.state = 'ng';
    }
    b.addEventListener('click', () => answerQuiz(c.key));
    box.appendChild(b);
  }
  const res = el('quizResult');
  res.hidden = !quiz.answered;
  if (quiz.answered) {
    const ok = quiz.chosen === quiz.answer;
    const fb = el('quizFeedback');
    const ans = quiz.choices.find(c => c.key === quiz.answer);
    fb.textContent = ok ? `🎉 ${t('quiz.correct')}` : t('quiz.wrong', { answer: ans ? ans.label() : '' });
    fb.className = `quiz__feedback ${ok ? 'is-ok' : 'is-ng'}`;
    el('quizWhy').textContent = quiz.why();
    el('quizDemo').hidden = !quiz.demo;
  }
  renderStats();
}

function answerQuiz(key) {
  if (!quiz || quiz.answered) return;
  quiz.answered = true;
  quiz.chosen = key;
  const ok = key === quiz.answer;
  quizStats.total++;
  if (ok) {
    quizStats.ok++;
    quizStats.lifetimeOk++;
    quizStats.streak++;
    quizStats.best = Math.max(quizStats.best, quizStats.streak);
    if (quizStats.streak >= 3 && quizStats.streak % 3 === 0) confetti();
  } else {
    quizStats.streak = 0;
  }
  saveStats();
  state.userActed = true;
  renderQuiz();
  el('quizNext').focus();
}

function renderStats() {
  el('quizScore').textContent = t('quiz.score', { ok: quizStats.ok, total: quizStats.total });
  el('quizStreak').textContent = `🔥 ${t('quiz.streak', { n: quizStats.streak })}`;
  el('quizBest').textContent = `🏆 ${t('quiz.best', { n: quizStats.best })}`;
}

// Missions --------------------------------------------------------------

function renderMissions() {
  const done = MISSIONS.filter(m => progress[m.id]).length;
  el('missionCount').textContent = `${done}/${MISSIONS.length}`;
  el('missionProgress').textContent = t('mission.progress', { done, total: MISSIONS.length });
  el('missionBar').style.width = `${(done / MISSIONS.length) * 100}%`;
  el('missionList').innerHTML = MISSIONS.map((m, i) => {
    const ok = !!progress[m.id];
    return `<li class="mission ${ok ? 'mission--done' : ''}">
      <span class="mission__mark">${ok ? '✓' : i + 1}</span>
      <span class="mission__title">${escapeHtml(tr(m.title))}</span>
      ${ok ? '' : `<details><summary>${escapeHtml(t('mission.hint'))}</summary>${escapeHtml(tr(m.hint))}</details>`}
    </li>`;
  }).join('');
}

function updateMissions(s) {
  if (!state.userActed) return;
  const ctx = {
    tilt: state.tilt,
    mode: state.mode,
    season: s.tilt && inEclipseSeason(s.sunLon, s.nodeLon),
    dragTurns: state.dragTurns,
    quizCorrect: quizStats.lifetimeOk,
  };
  const newly = checkMissions(s, ctx, progress);
  if (!newly.length) return;
  renderMissions();
  const all = MISSIONS.every(m => progress[m.id]);
  toast(all ? t('mission.all') : `🏅 ${t('mission.cleared', { title: tr(newly[0].title) })}`);
  confetti();
}

// Eclipse calendar ------------------------------------------------------

function renderCalendar(s) {
  const year = dayToDate(s.day).getFullYear();
  const data = yearData(year, state.tilt);
  const curEc = data.eclipses.find(ec => Math.abs(ec.day - s.day) < 0.3);
  const sig = `${year}|${state.tilt}|${getLang()}|${curEc ? curEc.day : ''}`;
  if (sig === lastSig.cal) return;
  lastSig.cal = sig;
  el('calTitle').textContent = t('cal.title', { year });
  el('calNote').textContent = state.tilt ? t('cal.note') : t('cal.noTilt');
  el('calList').innerHTML = data.eclipses.length ? data.eclipses.map(ec => `
    <li class="${ec === curEc ? 'is-current' : ''}">
      <span class="cal__ico cal__ico--${ec.kind}"></span>
      <span><span class="cal__name">${escapeHtml(eclipseName(ec))}</span><br>
        <span class="cal__date">${escapeHtml(formatDateTime(dayToDate(ec.day), { weekday: true }))}</span></span>
      <button class="btn btn--small" type="button" data-day="${ec.day}">${escapeHtml(t('cal.go'))}</button>
    </li>`).join('') : `<li><span></span><span>${escapeHtml(t('cal.none'))}</span></li>`;
}

// ---------- share link ----------

function readUrl() {
  const p = new URLSearchParams(location.search);
  const tt = p.get('t');
  if (tt) {
    const d = new Date(tt);
    if (!Number.isNaN(d.getTime())) state.day = dateToDay(d);
  }
  if (p.get('tilt') === '0') state.tilt = false;
  if (p.get('mode') === 'helio') state.mode = 'helio';
  if (p.get('lang') === 'en' || p.get('lang') === 'ja') setLang(p.get('lang'));
}

async function shareLink() {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('t', dayToDate(state.day).toISOString());
  if (!state.tilt) url.searchParams.set('tilt', '0');
  if (state.mode !== 'geo') url.searchParams.set('mode', state.mode);
  url.searchParams.set('lang', getLang());
  try {
    await navigator.clipboard.writeText(url.toString());
    toast(t('ui.shared'));
  } catch {
    window.prompt(t('ui.share'), url.toString());
  }
}

// ---------- feedback ----------

let toastTimer = null;
function toast(msg) {
  const n = el('toast');
  n.textContent = msg;
  n.hidden = false;
  n.style.animation = 'none';
  void n.offsetWidth;
  n.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { n.hidden = true; }, 2800);
}

function confetti() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const box = el('confetti');
  const colors = ['#ffb347', '#ff7a4a', '#7390ff', '#5fd39a', '#ffe08a', '#f4f1e4'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('i');
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = colors[i % colors.length];
    c.style.setProperty('--dx', `${(Math.random() - 0.5) * 200}px`);
    c.style.setProperty('--rot', `${Math.random() * 720}deg`);
    c.style.animationDelay = `${Math.random() * 0.3}s`;
    box.appendChild(c);
    setTimeout(() => c.remove(), 2000);
  }
}

// ---------- render loop ----------

function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (state.playing) advance(dt * state.speed);

  current = computeState(state.day, { tilt: state.tilt });
  render(current);
  requestAnimationFrame(loop);
}

// Move time forward, stopping at the moment of greatest eclipse if asked.
function advance(dd) {
  const from = state.day, to = from + dd;
  if (state.autoPause) {
    if (!nextEclipseCache || nextEclipseCache.tilt !== state.tilt || nextEclipseCache.from > from) {
      nextEclipseCache = { from, tilt: state.tilt, ec: findEclipse(from, 1, 'any', { tilt: state.tilt }) };
    }
    const ec = nextEclipseCache.ec;
    if (ec && ec.day <= to) {
      state.day = ec.day;
      nextEclipseCache = null;
      setPlaying(false);
      toast(`⏸ ${t('eclipse.paused', { name: eclipseName(ec) })}`);
      return;
    }
  }
  state.day = to;
}

function render(s) {
  const hideNames = quizHides();
  const hideMoon = hideNames && quiz.kind === 'layoutToPhase';

  // Readouts
  const date = dayToDate(state.day);
  el('dateOut').textContent = formatDateTime(date, { weekday: true });
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  if (document.activeElement !== el('dateInput') && el('dateInput').value !== iso) el('dateInput').value = iso;
  if (document.activeElement !== el('angleSlider')) el('angleSlider').value = s.synodic.toFixed(1);
  el('angleOut').textContent = `${Math.round(s.synodic)}°`;
  el('yearLabel').textContent = String(date.getFullYear());

  el('infoPhase').textContent = hideNames ? t('cv.hidden') : t(`phase.${s.phaseKey}`);
  el('infoAge').textContent = s.moonAge.toFixed(1);
  el('infoIllum').textContent = `${Math.round(s.illumFrac * 100)}%`;
  el('infoElong').textContent = `${Math.round(s.synodic)}°`;
  el('infoLat').textContent = `${s.moonLatDeg >= 0 ? '+' : ''}${s.moonLatDeg.toFixed(2)}°`;
  el('infoDist').textContent = getLang() === 'ja'
    ? `${(s.moonDistKm / 10000).toFixed(1)}万km`
    : `${Math.round(s.moonDistKm / 1000)}k km`;
  const tl = el('timeline');
  tl.setAttribute('aria-valuetext', formatDateTime(date));

  // Canvases
  const ov = el('overhead');
  drawOverhead(ov, s, {
    fit: fitCanvas(ov),
    mode: state.mode,
    zoom: state.zoom,
    rotateDeg: state.rotateDeg,
    showGuide: state.showGuide && !hideMoon,
    hideNames,
    dragging: state.dragging,
    hover: state.hover,
    everDragged: state.everDragged,
  });
  const mv = el('moonView');
  drawMoonView(mv, s, { fit: fitCanvas(mv), hidden: hideMoon });
  const ch = el('chart');
  drawEclipseChart(ch, s, { fit: fitCanvas(ch) });
  drawTimeline(tl, state.day, state.tilt, { fit: fitCanvas(tl), theme: currentTheme() });

  // Eclipse badge + banner
  const ec = s.eclipse;
  const badgeSig = ec.possible ? `${ec.kind}.${ec.type}.${getLang()}` : '';
  if (badgeSig !== lastSig.badge) {
    lastSig.badge = badgeSig;
    const badge = el('eclipseBadge');
    const banner = el('eclipseBanner');
    if (ec.possible) {
      const name = eclipseName(ec);
      badge.hidden = false;
      badge.className = `badge badge--${ec.kind}`;
      badge.textContent = `${ec.kind === 'solar' ? '☀️' : '🌕'} ${t('eclipse.now', { name })}`;
      banner.hidden = false;
      banner.className = `banner banner--${ec.kind}`;
      banner.innerHTML = `<strong>${escapeHtml(t('eclipse.now', { name }))}</strong><p>${escapeHtml(t(`eclipse.desc.${ec.kind}.${ec.type}`))}</p>`;
    } else {
      badge.hidden = true;
      banner.hidden = true;
    }
  }

  // Explanation cards (only rebuilt when something visible changes)
  if (state.tab === 'explain') {
    const sig = [s.phaseKey, s.synodic.toFixed(0), s.moonLatDeg.toFixed(2), s.moonAge.toFixed(1),
      ec.kind, ec.type, state.tilt, getLang(), hideNames, Math.round(s.transitHour)].join('|');
    if (sig !== lastSig.explain) {
      lastSig.explain = sig;
      el('explainBody').innerHTML = buildExplainHtml(s, { hideNames, tilt: state.tilt });
    }
  } else {
    lastSig.explain = '';
  }
  if (state.tab === 'calendar') renderCalendar(s);
  else lastSig.cal = '';

  updateMissions(s);
}

init();
