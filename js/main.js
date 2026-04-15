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
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
      tab.classList.add('tab--active');
      const target = tab.dataset.tab;
      el('tabExplain').classList.toggle('tabpane--active', target === 'explain');
      el('tabQuiz').classList.toggle('tabpane--active', target === 'quiz');
    });
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
    // Refresh phase label, speed etc.
    document.title = t('app.title');
    // Rebuild quiz to re-translate its text
    newQuiz();
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
  quiz = buildQuestion(kind, computeState(state.day, { tilt: state.tilt }));
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
