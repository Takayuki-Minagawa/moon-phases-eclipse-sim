// Application entry: state, inputs, render loop.

import { computeState, SIDEREAL_MONTH, SYNODIC_MONTH, findNext } from './simulation.js';
import { drawOverhead, clearTrail } from './overheadView.js';
import { drawMoonView } from './moonView.js';
import { setLang, getLang, applyStaticI18n, t } from './i18n.js';
import { buildExplain, buildTiltNote, buildEclipseLine, buildWhy } from './learningTexts.js';
import { buildQuestion } from './quiz.js';
import { initTheme, toggleTheme, currentTheme } from './theme.js';

const state = {
  day: 0,
  playing: false,
  speed: 1,        // simulated days per wall-clock second
  tilt: true,
  zoom: 1,
  rotateDeg: 0,
};

let quiz = null;

const el = id => document.getElementById(id);

function init() {
  initTheme();
  setLang('ja');
  applyStaticI18n();

  bindControls();
  bindTabs();
  bindThemeLang();
  newQuiz({ keepTime: true });  // prepare first quiz without jumping time
  loop(performance.now());
}

function bindControls() {
  el('playBtn').addEventListener('click', togglePlay);
  el('speedSelect').addEventListener('change', e => {
    state.speed = parseFloat(e.target.value);
  });
  el('angleSlider').addEventListener('input', e => {
    const angle = parseFloat(e.target.value);
    // Preserve the current cycle count, just change within the current sidereal cycle.
    const cycle = Math.floor(state.day / SIDEREAL_MONTH);
    state.day = cycle * SIDEREAL_MONTH + (angle / 360) * SIDEREAL_MONTH;
    syncDaySlider();
    clearTrail();
  });
  el('daySlider').addEventListener('input', e => {
    state.day = parseFloat(e.target.value);
    syncAngleSlider();
    clearTrail();
  });

  document.querySelectorAll('[data-jump]').forEach(btn => {
    btn.addEventListener('click', () => jumpToPhase(btn.dataset.jump));
  });
  el('jumpSolar').addEventListener('click', () => jumpToEclipse('solar'));
  el('jumpLunar').addEventListener('click', () => jumpToEclipse('lunar'));

  el('tiltToggle').addEventListener('change', e => {
    state.tilt = e.target.checked;
  });
  el('zoomSlider').addEventListener('input', e => {
    state.zoom = parseFloat(e.target.value);
  });
  el('rotateSlider').addEventListener('input', e => {
    state.rotateDeg = parseFloat(e.target.value);
  });
  el('viewReset').addEventListener('click', () => {
    state.zoom = 1; state.rotateDeg = 0;
    el('zoomSlider').value = '1';
    el('rotateSlider').value = '0';
    clearTrail();
  });
}

function bindTabs() {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = { explain: el('tabExplain'), quiz: el('tabQuiz') };

  function activateTab(tab) {
    tabs.forEach(t => {
      const active = t === tab;
      t.classList.toggle('tab--active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
    });
    const target = tab.dataset.tab;
    for (const [key, panel] of Object.entries(panels)) {
      const show = key === target;
      panel.classList.toggle('tabpane--active', show);
      panel.hidden = !show;
    }
    tab.focus();
  }

  tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab)));

  // Arrow-key navigation (roving tabindex)
  el('tabBtnExplain').parentElement.addEventListener('keydown', e => {
    let idx = tabs.indexOf(document.activeElement);
    if (idx < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      activateTab(tabs[(idx + 1) % tabs.length]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      activateTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      activateTab(tabs[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      activateTab(tabs[tabs.length - 1]);
    }
  });

  el('quizNew').addEventListener('click', newQuiz);
  el('quizKind').addEventListener('change', newQuiz);
}

function bindThemeLang() {
  el('themeToggle').addEventListener('click', () => {
    toggleTheme();
  });
  el('langSelect').addEventListener('change', e => {
    setLang(e.target.value);
    applyStaticI18n();
    document.title = t('app.title');
    retranslateQuiz();
  });
}

function togglePlay() {
  state.playing = !state.playing;
  el('playBtn').textContent = state.playing ? t('ui.pause') : t('ui.play');
}

function jumpToPhase(which) {
  const target = ({ new: 0, firstQuarter: 90, full: 180, lastQuarter: 270 })[which];
  // Find nearest day ahead that matches this synodic angle.
  // Search within one synodic month at 0.05-day resolution.
  let best = state.day, bestDelta = Infinity;
  for (let t = state.day; t < state.day + SYNODIC_MONTH + 1; t += 0.05) {
    const s = computeState(t, { tilt: state.tilt });
    let d = Math.abs(s.synodic - target);
    if (d > 180) d = 360 - d;
    if (d < bestDelta) { bestDelta = d; best = t; }
    if (d < 0.2) break;
  }
  state.day = best;
  syncAngleSlider(); syncDaySlider();
  clearTrail();
}

function jumpToEclipse(kind) {
  // Solar eclipses only happen around 2x/yr on average — widen the search.
  const maxDays = kind === 'solar' ? 900 : 500;
  const next = findNext(state.day + 0.2, { tilt: state.tilt },
    s => s.eclipse.kind === kind && s.eclipse.possible,
    maxDays, 0.05);
  if (next == null) return;
  state.day = next;
  syncAngleSlider(); syncDaySlider();
  clearTrail();
}

function syncAngleSlider() {
  const angle = ((state.day / SIDEREAL_MONTH) * 360) % 360;
  el('angleSlider').value = angle.toFixed(1);
}
function syncDaySlider() {
  const max = parseFloat(el('daySlider').max);
  if (state.day > max) {
    el('daySlider').max = String(Math.ceil(state.day + 30));
  }
  el('daySlider').value = state.day.toFixed(1);
}

let last = performance.now();
function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  if (state.playing) {
    state.day += dt * state.speed;
    syncAngleSlider(); syncDaySlider();
  }

  const s = computeState(state.day, { tilt: state.tilt });
  render(s);
  requestAnimationFrame(loop);
}

function render(s) {
  // Readouts
  el('angleOut').textContent = `${(((state.day / SIDEREAL_MONTH) * 360) % 360).toFixed(1)}°`;
  el('dayOut').textContent   = state.day.toFixed(1);
  el('phaseName').textContent = t(`phase.${s.phaseKey}`);
  el('moonAge').textContent   = s.moonAge.toFixed(1);
  el('phaseAngle').textContent = `${(s.phaseAngle * 180 / Math.PI).toFixed(1)}°`;
  el('illum').textContent      = `${Math.round(s.illumFrac * 100)}%`;

  // Canvases
  drawOverhead(el('overhead'), s, {
    theme: currentTheme(),
    zoom: state.zoom,
    rotateDeg: state.rotateDeg,
  });
  drawMoonView(el('moonView'), s);

  // Learning panel
  const explainHtml = `
    <h4>${t('explain.title')}</h4>
    <p>${escapeHtml(buildExplain(s))}</p>
    <p>${escapeHtml(buildTiltNote(state.tilt))}</p>
    <p>${escapeHtml(t('explain.hint'))}</p>
  `;
  el('explainBody').innerHTML = explainHtml;

  // Why-not-every-month
  const why = buildWhy();
  el('hintBody').innerHTML =
    `<strong>${escapeHtml(why.title)}</strong><br>${escapeHtml(why.body)}`;

  // Eclipse banner
  const line = buildEclipseLine(s.eclipse);
  const banner = el('eclipseBanner');
  if (line) {
    banner.hidden = false;
    banner.textContent = line;
  } else {
    banner.hidden = true;
    banner.textContent = '';
  }
}

function newQuiz(opts = {}) {
  const kind = el('quizKind').value;
  quiz = buildQuestion(kind, computeState(state.day, { tilt: state.tilt }),
    { useCurrentPhase: !!opts.keepTime });
  el('quizQuestion').textContent = quiz.text;
  el('quizFeedback').textContent = '';
  const choices = el('quizChoices');
  choices.innerHTML = '';
  for (const c of quiz.choices) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.type = 'button';
    b.textContent = c.label;
    b.addEventListener('click', () => answerQuiz(b, c.key));
    choices.appendChild(b);
  }
  // If the question targets a specific layout, advance the simulation
  if (quiz.targetSynodic != null && !opts.keepTime) {
    let best = state.day, bestDelta = Infinity;
    for (let t2 = state.day; t2 < state.day + SYNODIC_MONTH + 1; t2 += 0.05) {
      const s = computeState(t2, { tilt: state.tilt });
      let d = Math.abs(s.synodic - quiz.targetSynodic);
      if (d > 180) d = 360 - d;
      if (d < bestDelta) { bestDelta = d; best = t2; }
      if (d < 0.2) break;
    }
    state.day = best;
    syncAngleSlider(); syncDaySlider(); clearTrail();
  }
}

function retranslateQuiz() {
  if (!quiz) return;
  // Re-translate question text
  if (quiz.kind === 'phaseName') quiz.text = t('q.phaseName');
  else if (quiz.kind === 'layoutToPhase') quiz.text = t('q.layout');
  else if (quiz.kind === 'eclipseCond') quiz.text = t('q.eclipse');
  el('quizQuestion').textContent = quiz.text;
  // Re-translate choice labels
  for (const c of quiz.choices) {
    if (quiz.kind === 'eclipseCond') {
      c.label = t(`q.eclipse.${c.key}`);
    } else {
      c.label = t(`phase.${c.key}`);
    }
  }
  // Update button text
  const buttons = el('quizChoices').children;
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].textContent = quiz.choices[i].label;
  }
  // Re-translate feedback if present
  const fb = el('quizFeedback').textContent;
  if (fb) {
    // Check if it was correct or wrong by looking at existing button states
    const hasOk = Array.from(buttons).some(b => b.dataset.state === 'ok');
    const hasNg = Array.from(buttons).some(b => b.dataset.state === 'ng');
    if (hasNg) el('quizFeedback').textContent = t('quiz.wrong');
    else if (hasOk) el('quizFeedback').textContent = t('quiz.correct');
  }
}

function answerQuiz(btn, chosen) {
  const ok = chosen === quiz.answer;
  btn.dataset.state = ok ? 'ok' : 'ng';
  el('quizFeedback').textContent = ok ? t('quiz.correct') : t('quiz.wrong');
  if (!ok) {
    // highlight correct
    const kids = el('quizChoices').children;
    for (const k of kids) {
      if (k.textContent === labelForAnswer()) k.dataset.state = 'ok';
    }
  }
}

function labelForAnswer() {
  const found = quiz.choices.find(c => c.key === quiz.answer);
  return found ? found.label : '';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

init();
