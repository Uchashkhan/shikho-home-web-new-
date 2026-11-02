/* প্র্যাকটিস কুইজ builder (Figma "Shikho x Bkash Feedback" 180:18267, Practice Quiz Journey):
   subjects → chapters & topics, one step per subject → question count → কুইজের সামারি sheet →
   the quiz itself (exam.html?type=quiz). Subjects and chapters are the SSC science syllabus
   (NCTB class 9–10), the student's own class and group. */
(() => {
  const root = document.querySelector('[data-quiz]');
  if (!root) return;
  const { bn, esc, open: openSheet } = window.ShikhoSheet;
  const bar = root.querySelector('[data-qz-bar]');
  const body = root.querySelector('[data-qz-body]');
  const foot = root.querySelector('[data-qz-foot]');
  const title = document.querySelector('.appbar-title');

  const SUBJECTS = window.SHIKHO_SYLLABUS || []; // data/syllabus.js
  const COUNTS = [10, 20, 30, 40]; // one minute per question, as in the design
  const byId = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));

  // picks: subject id → Set of "chapter:topic" keys
  const state = { step: 0, subjects: [], picks: {}, count: null, open: null };
  const steps = () => ['subjects', ...state.subjects, 'count'];
  const topicsOf = (s, c) => s.chapters[c][1].map((_, t) => `${c}:${t}`);
  const chosenChapters = (id) => new Set([...(state.picks[id] || [])].map((k) => k.split(':')[0])).size;

  const ICON = {
    check: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    next: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    prev: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    caret: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  };
  // Question-mark artwork, same layers as the quiz's own intro (exam.js QUIZ_ICON)
  const QUIZ_ICON = `<span class="ex-ic ex-ic--quiz" aria-hidden="true">${[
    ['0 11.7% 10.57% 12.12%', 'a'], ['3.36% 0 0 0', 'b'], ['66.67% 34.83% 17.38% 45.3%', 'c'], ['28.3% 36.33% 24.9% 36.74%', 'd'],
  ].map(([inset, x]) => `<i style="inset:${inset}"><img src="assets/exam-quiz-${x}.svg" alt=""></i>`).join('')}</span>`;
  const subjectIcon = (s, size = 28) => `<span class="qz-sic" style="--tint:${s.tint};--s:${size}px"><img src="${s.icon}" alt="" width="${Math.round(size * 0.57)}" height="${Math.round(size * 0.57)}"></span>`;
  const box = (state, label) => `<span class="qz-box${state ? ` is-${state}` : ''}" aria-hidden="true">${state === 'on' ? ICON.check : ''}</span>${label || ''}`;

  function render(focusSel) {
    const list = steps();
    const key = list[state.step];
    bar.style.width = `${(state.step / (list.length - 1)) * 100}%`;
    bar.parentElement.setAttribute('aria-valuenow', String(Math.round((state.step / (list.length - 1)) * 100)));
    let ready = false;
    if (key === 'subjects') {
      title.textContent = 'কুইজ তৈরি করো';
      body.innerHTML = `<h2 class="qz-h">সাবজেক্ট সিলেক্ট করো</h2>
        <div class="qz-subjects" role="group" aria-label="সাবজেক্ট">${SUBJECTS.map((s) => {
          const on = state.subjects.includes(s.id);
          return `<button type="button" class="qz-subject" aria-pressed="${on}" data-subject="${s.id}">
            ${on ? '<span class="qz-sic qz-sic--on" style="--s:28px"><img src="assets/quiz/check.svg" alt="" width="16" height="16"></span>' : subjectIcon(s)}<span>${s.name}</span></button>`;
        }).join('')}</div>`;
      ready = state.subjects.length > 0;
    } else if (key === 'count') {
      title.textContent = 'প্রশ্নের সংখ্যা সিলেক্ট করো';
      body.innerHTML = `<h2 class="qz-h">প্রশ্নের সংখ্যা</h2>
        <div class="qz-counts" role="radiogroup" aria-label="প্রশ্নের সংখ্যা">${COUNTS.map((n) => `
          <button type="button" class="qz-row qz-count" role="radio" aria-checked="${state.count === n}" data-count="${n}">
            <span class="qz-radio" aria-hidden="true"></span><span class="qz-row-label">${bn(n)} টি</span><span class="qz-min">${bn(n)} মি.</span>
          </button>`).join('')}</div>`;
      ready = state.count != null;
    } else {
      const s = byId[key];
      title.textContent = 'অধ্যায় ও টপিক সিলেক্ট করো';
      const picks = state.picks[s.id] || (state.picks[s.id] = new Set());
      const all = s.chapters.every((_, c) => topicsOf(s, c).every((k) => picks.has(k)));
      body.innerHTML = `<div class="qz-subject-head">
          ${subjectIcon(s, 40)}<h2>${s.name}</h2>
          <button type="button" class="qz-all" role="checkbox" aria-checked="${all}" data-all>${box(all ? 'on' : '', 'সকল অধ্যায়')}</button>
        </div>
        <ul class="qz-chapters">${s.chapters.map(([name, topics], c) => {
          const keys = topicsOf(s, c);
          const n = keys.filter((k) => picks.has(k)).length;
          const st = n === keys.length ? 'on' : n ? 'some' : '';
          const open = state.open === `${s.id}:${c}`;
          return `<li class="qz-chapter${st ? ' is-picked' : ''}">
            <div class="qz-chapter-row">
              <button type="button" class="qz-check" role="checkbox" aria-checked="${st === 'on' ? 'true' : st === 'some' ? 'mixed' : 'false'}" data-chapter="${c}">${box(st, `<span>অধ্যায় ${bn(c + 1)} - ${esc(name)}</span>`)}</button>
              <button type="button" class="qz-caret" aria-expanded="${open}" aria-controls="qz-t-${c}" data-toggle="${c}" aria-label="অধ্যায় ${bn(c + 1)}-এর টপিক">${ICON.caret}</button>
            </div>
            <ul class="qz-topics" id="qz-t-${c}"${open ? '' : ' hidden'}>${topics.map((t, i) => `
              <li><button type="button" class="qz-check qz-topic" role="checkbox" aria-checked="${picks.has(`${c}:${i}`)}" data-topic="${c}:${i}">${box(picks.has(`${c}:${i}`) ? 'on' : '', `<span>${esc(t)}</span>`)}</button></li>`).join('')}
            </ul>
          </li>`;
        }).join('')}</ul>`;
      ready = picks.size > 0;
    }
    foot.innerHTML = `${state.step ? `<button type="button" class="qz-back" data-qz="back" aria-label="আগের ধাপ">${ICON.prev}</button>` : ''}
      <button type="button" class="btn-primary qz-next" data-qz="next"${ready ? '' : ' disabled'}>এগিয়ে যাও${ICON.next}</button>`;
    if (focusSel) body.querySelector(focusSel)?.focus();
  }

  const go = (to) => {
    state.step = to;
    state.open = null;
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  };

  // কুইজের সামারি: count and time, then each subject's chapters and topics
  const summary = () => {
    const rows = state.subjects.map((id) => {
      const s = byId[id];
      return `<li>${subjectIcon(s)}<b>${s.name}</b><span class="qz-sum-meta">অধ্যায়: <b>${bn(chosenChapters(id))}টি</b><i aria-hidden="true"></i>টপিক: <b>${bn(state.picks[id].size)}টি</b></span></li>`;
    }).join('');
    openSheet('কুইজের সামারি', `
      <div class="ex-stats qz-stats">
        <div class="ex-stat">${QUIZ_ICON}<span>প্রশ্ন<b>${bn(state.count)} টি</b></span></div>
        <div class="ex-stat"><img class="ex-ic" src="assets/exam-clock.svg" alt="" width="40" height="40"><span>সময়<b>${bn(state.count)} মি.</b></span></div>
      </div>
      <section class="qz-sum"><h3>সাবজেক্ট</h3><ul>${rows}</ul></section>
      <button type="button" class="btn-primary btn-block" data-qz="start">কুইজ শুরু করো</button>`);
  };

  const start = () => {
    const quiz = {
      count: state.count,
      minutes: state.count,
      subjects: state.subjects.map((id) => byId[id].name),
      chapters: state.subjects.reduce((n, id) => n + chosenChapters(id), 0),
    };
    try { sessionStorage.setItem('shikho-quiz', JSON.stringify(quiz)); } catch (e) { /* the quiz falls back to its sample */ }
    location.replace('exam.html?type=quiz'); // back from the quiz returns to where the builder was opened
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    const list = steps();
    const key = list[state.step];
    if (t.dataset.subject) {
      const id = t.dataset.subject;
      state.subjects = state.subjects.includes(id) ? state.subjects.filter((x) => x !== id) : SUBJECTS.map((s) => s.id).filter((x) => x === id || state.subjects.includes(x));
      return render(`[data-subject="${id}"]`);
    }
    const s = byId[key];
    if (s && 'all' in t.dataset) {
      const picks = state.picks[s.id];
      const all = t.getAttribute('aria-checked') === 'true';
      picks.clear();
      if (!all) s.chapters.forEach((_, c) => topicsOf(s, c).forEach((k) => picks.add(k)));
      return render('[data-all]');
    }
    if (s && t.dataset.chapter) {
      const c = Number(t.dataset.chapter);
      const picks = state.picks[s.id];
      const keys = topicsOf(s, c);
      const full = keys.every((k) => picks.has(k));
      keys.forEach((k) => (full ? picks.delete(k) : picks.add(k)));
      return render(`[data-chapter="${c}"]`);
    }
    if (s && t.dataset.topic) {
      const picks = state.picks[s.id];
      const k = t.dataset.topic;
      if (picks.has(k)) picks.delete(k); else picks.add(k);
      return render(`[data-topic="${k}"]`);
    }
    if (s && t.dataset.toggle) {
      const k = `${s.id}:${t.dataset.toggle}`;
      state.open = state.open === k ? null : k;
      return render(`[data-toggle="${t.dataset.toggle}"]`);
    }
    if (t.dataset.count) { state.count = Number(t.dataset.count); return render(`[data-count="${t.dataset.count}"]`); }
    if (t.dataset.qz === 'back') return go(state.step - 1);
    if (t.dataset.qz === 'next') return state.step === list.length - 1 ? summary() : go(state.step + 1);
  });
  // The summary sheet lives outside [data-quiz]
  document.addEventListener('click', (e) => { if (e.target.closest('[data-qz="start"]')) start(); });

  // App-bar back steps back through the builder; on the first step it leaves
  document.querySelector('[data-back]')?.addEventListener('click', (e) => {
    if (state.step > 0) { e.preventDefault(); e.stopImmediatePropagation(); go(state.step - 1); }
  }, true);

  render();
})();
