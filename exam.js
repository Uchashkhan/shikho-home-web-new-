/* Practice quiz (shikho-bkash reference: "Chapter Exam journey", Figma 117:2118).
   Rules → questions with a countdown, progress and number strip → "সবগুলো দেখো" overview →
   submit → result sheet. Questions are the reference's sample pool; scoring stays on this page. */
(() => {
  const root = document.querySelector('[data-exam]');
  if (!root) return;
  const { bn, open: openSheet, close: closeSheet } = window.ShikhoSheet;

  const META = { subject: 'রসায়ন', chapter: 'পদার্থের গঠন', count: 10, minutes: 10 };
  const POOL = [
    { q: 'পরমাণুর নিউক্লিয়াসে কোন কণাগুলো থাকে?', o: ['ইলেকট্রন ও প্রোটন', 'প্রোটন ও নিউট্রন', 'নিউট্রন ও ইলেকট্রন', 'শুধু প্রোটন'], a: 1 },
    { q: 'কোনো মৌলের পারমাণবিক সংখ্যা কিসের সমান?', o: ['নিউট্রন সংখ্যা', 'প্রোটন সংখ্যা', 'ভর সংখ্যা', 'শক্তিস্তরের সংখ্যা'], a: 1 },
    { q: 'সোডিয়ামের (Na) পারমাণবিক সংখ্যা কত?', o: ['10', '11', '12', '23'], a: 1 },
    { q: 'একই মৌলের আইসোটোপে কোনটি ভিন্ন হয়?', o: ['প্রোটন সংখ্যা', 'ইলেকট্রন সংখ্যা', 'নিউট্রন সংখ্যা', 'পারমাণবিক সংখ্যা'], a: 2 },
    { q: 'M শক্তিস্তরে সর্বোচ্চ কয়টি ইলেকট্রন থাকতে পারে?', o: ['8', '18', '32', '2'], a: 1 },
    { q: 'রাদারফোর্ডের পরমাণু মডেলকে কিসের সাথে তুলনা করা হয়?', o: ['সৌরজগৎ', 'তরমুজ', 'কিশমিশ পুডিং', 'মেঘ'], a: 0 },
    { q: 'ক্লোরিনের (Cl, Z = 17) ইলেকট্রন বিন্যাস কোনটি?', o: ['2, 8, 7', '2, 8, 8', '2, 7, 8', '2, 8, 6, 1'], a: 0 },
    { q: 'নিচের কোনটি তেজস্ক্রিয় আইসোটোপ?', o: ['¹²C', '¹⁴C', '¹⁶O', '²³Na'], a: 1 },
    { q: 'কার্বনের আপেক্ষিক পারমাণবিক ভর কত?', o: ['6', '12', '14', '16'], a: 1 },
    { q: 'নিউট্রনের আধান কেমন?', o: ['ধনাত্মক', 'ঋণাত্মক', 'নিরপেক্ষ', 'পরিবর্তনশীল'], a: 2 },
    { q: 'বোর মডেল অনুযায়ী ইলেকট্রন শক্তি শোষণ করলে কী ঘটে?', o: ['নিম্ন শক্তিস্তরে নামে', 'উচ্চ শক্তিস্তরে ওঠে', 'নিউক্লিয়াসে পড়ে যায়', 'কিছুই হয় না'], a: 1 },
    { q: 'Mg²⁺ আয়নে মোট ইলেকট্রন সংখ্যা কত?', o: ['12', '10', '14', '8'], a: 1 },
  ];
  const LETTERS = ['ক', 'খ', 'গ', 'ঘ'];
  const qAt = (i) => POOL[i % POOL.length];
  const n = META.count;
  const exam = { step: 'intro', cur: 0, answers: Array(n).fill(null), visited: new Set(), left: META.minutes * 60, timer: 0, done: false };

  const head = root.querySelector('[data-exam-head]');
  const body = root.querySelector('[data-exam-body]');
  const foot = root.querySelector('[data-exam-foot]');
  const mmss = (s) => `${bn(pad(Math.floor(s / 60)))} : ${bn(pad(s % 60))}`;
  const pad = (x) => String(x).padStart(2, '0');
  const answered = () => exam.answers.filter((a) => a != null).length;
  const numState = (i) => (i === exam.cur ? 'current' : exam.answers[i] != null ? 'answered' : exam.visited.has(i) ? 'skipped' : '');
  const CHEV = (d) => `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  const GRID = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="9" height="9" rx="1.5"/><rect x="13" y="2" width="9" height="9" rx="1.5"/><rect x="2" y="13" width="9" height="9" rx="1.5"/><rect x="13" y="13" width="9" height="9" rx="1.5"/></svg>';
  const RULE = {
    red: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M8 1.33a6.67 6.67 0 1 1 0 13.34A6.67 6.67 0 0 1 8 1.33Zm0 1.34a5.33 5.33 0 1 0 0 10.66A5.33 5.33 0 0 0 8 2.67ZM8 4c1.03 0 2.05.39 2.83 1.17a4 4 0 0 1 0 5.66 4 4 0 0 1-5.66 0L8 8V4Z"/></svg>',
    green: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m4.9 8 2.5 2.4 3.9-4.2" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    yellow: '<svg aria-hidden="true" width="14" height="16" viewBox="0 0 14 16" fill="currentColor"><path d="M5.3 2.77h2.94v10.78c0 .08-.92 2.12-.96 2.12a.56.56 0 0 1-1.02 0l-.93-2.01a.4.4 0 0 1-.03-.11V2.77ZM6.27.25h1a1 1 0 0 1 1 1v1.19H5.25V1.26a1 1 0 0 1 1.02-1ZM0 11.07h4.1v3.36H0zm.9-1.57h2.3c.5 0 .9.4.9.9v.33H0v-.33c0-.5.4-.9.9-.9ZM0 14.76h4.1v.33c0 .5-.41.91-.91.91H.91a.9.9 0 0 1-.91-.9v-.34ZM10.39 0h2.75c.41 0 .75.33.75.74v14.52c0 .4-.34.74-.75.74h-2.75a.74.74 0 0 1-.74-.74v-.88h1.23a.25.25 0 0 0 0-.5H9.65v-1.03h1.23a.25.25 0 0 0 0-.5H9.65v-1.04h1.23a.25.25 0 0 0 0-.5H9.65V9.78h1.23a.25.25 0 0 0 0-.5H9.65V8.25h1.23a.25.25 0 0 0 0-.5H9.65V6.71h1.23a.25.25 0 0 0 0-.49H9.65V5.18h1.23a.25.25 0 0 0 0-.5H9.65V3.65h1.23a.25.25 0 0 0 0-.5H9.65V2.12h1.23a.25.25 0 0 0 0-.5H9.65V.74c0-.4.34-.74.74-.74Z"/></svg>',
  };
  // Question-mark artwork (reference FEATURE_ICON.quiz): four layers placed in %
  const QUIZ_ICON = `<span class="ex-ic ex-ic--quiz" aria-hidden="true">${[
    ['0 11.7% 10.57% 12.12%', 'a'], ['3.36% 0 0 0', 'b'], ['66.67% 34.83% 17.38% 45.3%', 'c'], ['28.3% 36.33% 24.9% 36.74%', 'd'],
  ].map(([inset, x]) => `<i style="inset:${inset}"><img src="assets/exam-quiz-${x}.svg" alt=""></i>`).join('')}</span>`;

  const topRow = () => `<div class="ex-top"><b>${META.subject} · ${META.chapter}</b>
      <span class="ex-timer${exam.left <= 60 ? ' low' : ''}" role="timer" aria-label="বাকি সময়"><img src="assets/exam-clock.svg" alt="" width="24" height="24"><span data-ex-timer>${mmss(exam.left)}</span></span></div>`;

  function render() {
    if (exam.step === 'intro') {
      head.innerHTML = '';
      body.innerHTML = `
        <div class="ex-stats">
          <div class="ex-stat">${QUIZ_ICON}<span>প্রশ্ন<b>${bn(n)}টি</b></span></div>
          <div class="ex-stat"><img class="ex-ic" src="assets/exam-clock.svg" alt="" width="40" height="40"><span>সময়<b>${bn(META.minutes)} মিনিট</b></span></div>
        </div>
        <p class="ex-chapter">${META.subject} · ${META.chapter}</p>
        <section class="ex-rules">
          <h2>টেস্টের নিয়মাবলী</h2>
          <ul>
            <li><span class="ex-rule-ic red">${RULE.red}</span>নির্ধারিত সময়ের মধ্যে টেস্ট শেষ করে শেখার অবস্থা যাচাই করে নাও</li>
            <li><span class="ex-rule-ic green">${RULE.green}</span>সঠিক উত্তরটি সিলেক্ট করে এগিয়ে যাও</li>
            <li><span class="ex-rule-ic yellow">${RULE.yellow}</span>টেস্ট শুরুর আগে রাফখাতা, কলম ও দরকারি উপকরণ সাথে নাও</li>
          </ul>
        </section>`;
      foot.innerHTML = '<button type="button" class="btn-primary ex-btn" data-ex="start">টেস্ট শুরু করো</button>';
      return;
    }
    if (exam.step === 'q') {
      const i = exam.cur, q = qAt(i), done = answered();
      exam.visited.add(i);
      head.innerHTML = `${topRow()}
        <div class="ex-progress"><span class="ex-track" role="progressbar" aria-label="উত্তর দেওয়া হয়েছে" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${done}"><span class="ex-fill" style="width:${(done / n) * 100}%"></span></span><span class="ex-count">${bn(done)}/${bn(n)}</span></div>
        <div class="ex-strip-wrap">
          <button type="button" class="ex-nav prev" data-ex="prev" aria-label="আগের প্রশ্ন">${CHEV('m15 18-6-6 6-6')}</button>
          <div class="ex-strip" data-ex-strip>${Array.from({ length: n }, (_, k) => `<button type="button" class="ex-num ${numState(k)}" data-ex-go="${k}" aria-label="প্রশ্ন ${bn(k + 1)}"${k === i ? ' aria-current="step"' : ''}>${bn(k + 1)}</button>`).join('')}</div>
          <button type="button" class="ex-nav next" data-ex="next" aria-label="পরের প্রশ্ন">${CHEV('m9 18 6-6-6-6')}</button>
        </div>`;
      body.innerHTML = `
        <p class="ex-q" id="ex-q">${bn(i + 1)}) ${q.q}</p>
        <div class="ex-opts" role="radiogroup" aria-labelledby="ex-q">${q.o.map((o, k) => `
          <button type="button" class="ex-opt" role="radio" aria-checked="${exam.answers[i] === k}" data-ex-pick="${k}"><b>${LETTERS[k]}.</b><span>${o}</span></button>`).join('')}</div>`;
      foot.innerHTML = `
        <button type="button" class="btn-soft ex-btn" data-ex="grid">${GRID}সবগুলো দেখো</button>
        <button type="button" class="btn-primary ex-btn ex-grow" data-ex="next">${i === n - 1 ? 'শেষ করো' : 'এগিয়ে যাও'}${CHEV('m9 18 6-6-6-6')}</button>`;
      const cur = head.querySelector('.ex-num.current');
      const strip = head.querySelector('[data-ex-strip]');
      strip.style.scrollBehavior = 'auto';
      strip.scrollLeft = cur.offsetLeft - strip.clientWidth / 2 + cur.clientWidth / 2;
      strip.style.scrollBehavior = '';
      return;
    }
    // Overview grid
    head.innerHTML = topRow();
    body.innerHTML = `
      <div class="ex-summary">
        <p>উত্তর সিলেক্ট করেছো <b>${bn(answered())}/${bn(n)}</b></p>
        <div class="ex-legend"><span><i class="answered"></i>পূরণ</span><span><i class="empty"></i>পূরণ না</span><span><i class="current"></i>বর্তমান অবস্থান</span></div>
      </div>
      <div class="ex-grid">${Array.from({ length: n }, (_, k) => {
        const st = k === exam.cur ? 'current' : exam.answers[k] != null ? 'answered' : '';
        return `<button type="button" class="ex-cell ${st}" data-ex-go="${k}" aria-label="প্রশ্ন ${bn(k + 1)}${st === 'answered' ? ', উত্তর দেওয়া হয়েছে' : ''}">${bn(k + 1)}</button>`;
      }).join('')}</div>`;
    foot.innerHTML = '<button type="button" class="btn-primary ex-btn ex-grow" data-ex="submit">সাবমিট করো</button>';
  }

  // dir 1 slides in from the right (forward), -1 from the left (back)
  function setStep(step, dir = 1) {
    exam.step = step;
    render();
    window.scrollTo({ top: 0 });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      body.animate([{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.32,.72,0,1)' });
    }
  }

  function tickTimer() {
    exam.left = Math.max(0, exam.left - 1);
    root.querySelectorAll('[data-ex-timer]').forEach((t) => { t.textContent = mmss(exam.left); t.parentElement.classList.toggle('low', exam.left <= 60); });
    if (!exam.left) submit();
  }

  function submit() {
    if (exam.done) return;
    exam.done = true;
    clearInterval(exam.timer);
    const a = answered();
    const correct = exam.answers.filter((x, i) => x != null && x === qAt(i).a).length;
    const used = META.minutes * 60 - exam.left;
    openSheet('এক্সাম জমা হয়েছে', `
      <div class="ex-score"><b>${bn(correct)}/${bn(n)}</b><span>সঠিক উত্তর · ${META.subject}, ${META.chapter}</span></div>
      <div class="ex-rows">
        <div><span>উত্তর দিয়েছো</span><b>${bn(a)}টি</b></div>
        <div><span>উত্তর দাওনি</span><b>${bn(n - a)}টি</b></div>
        <div><span>সময় লেগেছে</span><b>${bn(Math.floor(used / 60))} মিনিট ${bn(used % 60)} সেকেন্ড</b></div>
      </div>
      <button type="button" class="btn-primary btn-block" data-ex-finish>ঠিক আছে</button>`, { onClose: leave });
  }

  // Leave the quiz: back to where it was opened from (the homepage in this prototype)
  function leave() {
    const fromHere = document.referrer && new URL(document.referrer).origin === location.origin;
    if (fromHere && history.length > 1) history.back(); else location.href = 'index.html';
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-ex-finish]')) return closeSheet();
    const goEl = e.target.closest('[data-ex-go]');
    if (goEl) { const to = Number(goEl.dataset.exGo); const dir = to < exam.cur ? -1 : 1; exam.cur = to; return setStep('q', exam.step === 'grid' ? -1 : dir); }
    const pick = e.target.closest('[data-ex-pick]');
    if (pick) { exam.answers[exam.cur] = Number(pick.dataset.exPick); render(); return body.querySelector(`[data-ex-pick="${pick.dataset.exPick}"]`)?.focus(); }
    const act = e.target.closest('[data-ex]')?.dataset.ex;
    if (!act) return;
    if (act === 'start') { exam.timer = setInterval(tickTimer, 1000); setStep('q'); }
    if (act === 'prev' && exam.cur > 0) { exam.cur--; setStep('q', -1); }
    if (act === 'next') { if (exam.cur < n - 1) { exam.cur++; setStep('q'); } else setStep('grid'); }
    if (act === 'grid') setStep('grid');
    if (act === 'submit') submit();
  });

  // Options: arrow keys move between answers (radio group behaviour)
  body.addEventListener('keydown', (e) => {
    const opt = e.target.closest('[data-ex-pick]');
    if (!opt || !['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const opts = [...body.querySelectorAll('[data-ex-pick]')];
    const k = (opts.indexOf(opt) + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + opts.length) % opts.length;
    opts[k].click();
  });

  // App-bar back: from the overview go back to the question; otherwise leave (main.js handles it)
  document.querySelector('[data-back]')?.addEventListener('click', (e) => {
    if (exam.step === 'grid' && !exam.done) { e.preventDefault(); e.stopImmediatePropagation(); setStep('q', -1); }
  }, true);

  render();
})();
