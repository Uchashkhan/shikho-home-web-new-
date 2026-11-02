/* ক্লাস রুটিন (routine.html) and রুটিন ক্যালেন্ডার (calendar.html), from live app.shikho.dev:
   homepage "রুটিন ক্যালেন্ডার দেখো" → /student/routine (week strip + the picked day's classes and tests),
   the calendar icon → /student/calendar (month grid; tap a class for its details).
   Classes come from the program the student bought through bKash; recorded ones are the
   মোস্ট ইমপর্ট্যান্ট ক্লাস videos (data/videos.js). Today matches the homepage's আজকের রুটিন. */
(() => {
  const routineRoot = document.querySelector('[data-routine]');
  const calendarRoot = document.querySelector('[data-calendar]');
  if (!routineRoot && !calendarRoot) return;
  const { bn, esc } = window.ShikhoSheet;
  const VIDEOS = window.SHIKHO_VIDEOS?.important.videos || [];
  const paid = document.documentElement.dataset.plan === 'paid';

  // ---------- Dates ----------
  const MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
  const DAYS_LONG = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const DAY_MS = 864e5;
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const TODAY = startOf(new Date());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const same = (a, b) => a.getTime() === b.getTime();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; };
  const monthLabel = (d) => `${MONTHS[d.getMonth()]} ${bn(d.getFullYear())}`;
  const dayLabel = (d) => `${bn(d.getDate())} ${MONTHS[d.getMonth()]}, ${DAYS_LONG[d.getDay()]}`;
  const weekStart = (d) => addDays(d, -d.getDay()); // weeks run রবি–শনি, like live
  // "সকাল ১০:০০"; minutes since midnight
  const clock = (min) => {
    const h = Math.floor(min / 60), m = min % 60;
    const part = h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকেল' : h < 19 ? 'সন্ধ্যা' : 'রাত';
    return `${part} ${bn((h % 12) || 12)}:${bn(String(m).padStart(2, '0'))}`;
  };
  const span = (min) => {
    const h = Math.floor(min / 60), m = min % 60;
    return [h && `${bn(h)} ঘন্টা`, m && `${bn(m)} মিনিট`].filter(Boolean).join(' ');
  };
  const toMin = (d) => d.split(':').reduce((a, n) => a * 60 + Number(n), 0) / 60; // "1:11:02" → minutes
  const NOW_MIN = 17 * 60 + 30; // prototype clock: 5:30 pm today, so the homepage's live class is on

  // ---------- Schedule ----------
  // Today: the homepage's three items. Other days: one or two classes (no classes on Friday),
  // a chapter exam every Thursday; past ones are attended or missed.
  const TODAY_ITEMS = [
    { kind: 'lecture', subject: 'ইংরেজি ১ম পত্র', title: 'Reading Part Class - 3', start: 14 * 60, dur: 60, video: 2 },
    { kind: 'lecture', subject: 'রসায়ন', title: 'রসায়ন আমাদের জীবনে রসায়ন Live Class', start: 17 * 60, dur: 87, video: 6 },
    { kind: 'test', subject: 'রসায়ন', title: 'পদার্থের গঠন', start: 20 * 60, dur: 40 },
  ];
  const SLOTS = [[15 * 60], [10 * 60, 17 * 60], [16 * 60], [11 * 60, 19 * 60]];
  const TESTS = ['পদার্থের গঠন', 'বল', 'কোষ বিভাজন', 'সেট ও ফাংশন'];
  const dayNo = (d) => Math.round((d - new Date(2026, 0, 4)) / DAY_MS); // stable index per date
  const cache = new Map();
  const itemsOn = (d) => {
    const key = iso(d);
    if (cache.has(key)) return cache.get(key);
    const n = dayNo(d);
    let items = [];
    if (same(d, TODAY)) items = TODAY_ITEMS.map((x) => ({ ...x }));
    else if (d.getDay() !== 5 && VIDEOS.length) {
      items = SLOTS[((n % 4) + 4) % 4].map((start, j) => {
        const video = ((n * 2 + j) % VIDEOS.length + VIDEOS.length) % VIDEOS.length;
        const v = VIDEOS[video];
        return { kind: 'lecture', subject: v.subject, title: v.title, start, dur: Math.round(toMin(v.duration)), video };
      });
      if (d.getDay() === 4) items.push({ kind: 'test', subject: 'রসায়ন', title: TESTS[((n % 4) + 4) % 4], start: 20 * 60 + 30, dur: 40 });
    }
    items.forEach((x, i) => {
      x.id = `${key}-${i}`;
      x.date = d;
      const end = x.start + x.dur;
      x.state = d < TODAY || (same(d, TODAY) && end <= NOW_MIN) ? 'past'
        : same(d, TODAY) && x.start <= NOW_MIN ? 'live' : 'upcoming';
      x.missed = x.state === 'past' && !same(d, TODAY) && (n + i) % 5 === 0;
    });
    cache.set(key, items);
    return items;
  };

  // ---------- Shared pieces ----------
  const KIND = { lecture: 'লেকচার ক্লাস', test: 'চ্যাপ্টার এক্সাম' };
  const tag = (x) => (x.state === 'live' ? '<span class="rt-tag rt-tag--live"><i class="live-blink" aria-hidden="true"></i>লাইভ চলছে</span>'
    : x.missed ? '<span class="rt-tag rt-tag--missed">মিসড</span>'
    : x.state === 'past' ? '<span class="rt-tag rt-tag--done">অংশ নিয়েছো</span>'
    : '<span class="rt-tag">আসন্ন</span>');
  // The class's own action: recorded video after it ends, join while live, practise a test
  const action = (x) => {
    if (x.kind === 'test') return x.state === 'upcoming' ? null : { label: x.missed ? 'পরীক্ষা দাও' : 'আবার প্র্যাকটিস করো', href: 'exam.html?type=chapter', route: 'chapterExam' };
    if (x.state === 'live') return { label: 'লাইভ ক্লাসে যোগ দাও', href: 'live.html', route: 'liveClass', primary: true };
    if (x.state === 'past') return { label: 'রেকর্ডেড ভিডিও দেখো', href: `watch.html?list=important&v=${x.video}&mode=class&date=${iso(x.date)}&start=${x.start}`, route: 'video' };
    return null;
  };
  const cta = (x, block) => {
    const a = action(x);
    if (!a) return x.state === 'upcoming' ? `<p class="rt-later">${clock(x.start)}-এ শুরু হবে</p>` : '';
    return `<a class="${a.primary ? 'btn-primary' : 'btn-secondary'} rt-cta${block ? ' btn-block' : ''}" href="${a.href}" data-route="${a.route}">${a.label}</a>`;
  };
  const top = (x) => `<span class="rt-top"><span class="subject-chip" data-subject-chip="${esc(x.subject)}">${esc(x.subject)}</span><span class="rt-kind">${KIND[x.kind]}</span>${tag(x)}</span>`;
  const empty = (img, title, action = '') => `<div class="pi-empty rt-empty"><img src="${img}" alt="" width="64" height="64"><p class="pi-empty-title">${title}</p>${action}</div>`;
  // Empty-state art from live: /icons/empty-state/penguin.svg, /images/empty-list-icon.svg
  const PENGUIN = 'assets/icons/empty-penguin.svg';
  const EMPTY_LIST = 'assets/icons/empty-list.svg';
  // A free student has no program, so no routine: same empty state on both screens
  const notEnrolled = () => empty(EMPTY_LIST, 'প্রোগ্রামে ভর্তি হলে তোমার ক্লাস রুটিন এখানে দেখতে পাবে',
    '<a href="#" class="btn-secondary" data-sheet="program">প্রোগ্রামে ভর্তি হও</a>');

  // ---------- ক্লাস রুটিন ----------
  if (routineRoot) {
    if (!paid) { routineRoot.innerHTML = notEnrolled(); return; }
    const q = new URLSearchParams(location.search);
    let day = parse(q.get('date')) || TODAY;
    const head = routineRoot.querySelector('[data-month]');
    const strip = routineRoot.querySelector('[data-week]');
    const list = routineRoot.querySelector('[data-day-list]');
    const calLink = routineRoot.querySelector('.rt-cal-btn');
    const render = (focusDay) => {
      const ws = weekStart(day);
      head.textContent = monthLabel(day);
      strip.innerHTML = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(ws, i);
        const on = same(d, day);
        return `<button type="button" class="rt-day${same(d, TODAY) ? ' is-today' : ''}" aria-pressed="${on}" data-date="${iso(d)}"
          aria-label="${dayLabel(d)}${same(d, TODAY) ? ' (আজ)' : ''}">
          <span class="rt-day-name">${DAYS[d.getDay()]}</span><span class="rt-day-num">${bn(d.getDate())}</span>
          <span class="rt-dot"${itemsOn(d).length ? '' : ' hidden'}></span></button>`;
      }).join('');
      const items = itemsOn(day);
      list.innerHTML = `<h2 class="rt-date">${same(day, TODAY) ? 'আজ, ' : ''}${dayLabel(day)}</h2>${items.length ? items.map((x) => `
        <article class="rt-card${x.state === 'live' ? ' rt-card--live' : ''}">
          ${top(x)}
          <h3 class="rt-title">${esc(x.title)}</h3>
          <p class="rt-time">${clock(x.start)} – ${clock(x.start + x.dur)}<span aria-hidden="true">·</span>${span(x.dur)}</p>
          ${cta(x)}
        </article>`).join('') : empty(PENGUIN, `${same(day, TODAY) ? 'আজ' : 'এই দিনে'} তোমার কোনো লাইভ ক্লাস বা টেস্ট নেই!`)}`;
      const url = new URL(location.href);
      url.searchParams.set('date', iso(day));
      history.replaceState(null, '', url);
      calLink.href = `calendar.html?date=${iso(day)}`; // the calendar opens on this day's month
      if (focusDay) strip.querySelector('[aria-pressed="true"]').focus();
    };
    strip.addEventListener('click', (e) => {
      const b = e.target.closest('[data-date]');
      if (b) { day = parse(b.dataset.date); render(); }
    });
    strip.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (step) { e.preventDefault(); day = addDays(day, step); render(true); }
    });
    routineRoot.querySelectorAll('[data-week-step]').forEach((b) => b.addEventListener('click', () => {
      day = addDays(day, 7 * Number(b.dataset.weekStep));
      render();
    }));
    render();
  }

  // ---------- রুটিন ক্যালেন্ডার ----------
  // Layout copied from live /student/calendar: outlined month bar, program/course radios, tall day
  // cells with time chips; a chip opens a card pinned under it. bKash Cerise in place of live's blue.
  if (calendarRoot) {
    if (!paid) { calendarRoot.innerHTML = notEnrolled(); return; }
    const q = new URLSearchParams(location.search);
    const from = parse(q.get('date')) || TODAY;
    let month = new Date(from.getFullYear(), from.getMonth(), 1);
    let source = 'program';
    const head = calendarRoot.querySelector('[data-month]');
    const grid = calendarRoot.querySelector('[data-grid]');
    // live's chip and card times: "১০.০০ সকাল", "সকাল ১০:০০ - রাত ০৮:২৮"
    const partOf = (min) => clock(min).split(' ')[0];
    const hhmm = (min, sep) => `${bn(String((Math.floor(min / 60) % 12) || 12).padStart(2, '0'))}${sep}${bn(String(min % 60).padStart(2, '0'))}`;
    const chipTime = (min) => `${hhmm(min, '.').replace(/^০/, '')} ${partOf(min)}`;
    const cardTime = (min) => `${partOf(min)} ${hhmm(min, ':')}`;
    const chapter = (t) => (/ পর্ব/.test(t) ? t.replace(/ পর্ব.*$/, '') : '');
    const render = () => {
      closeCard();
      head.textContent = monthLabel(month);
      if (source === 'other') {
        grid.innerHTML = empty(EMPTY_LIST, 'তোমার কোনো কোর্সে এনরোল করা নেই', '<a href="courses.html" class="btn-secondary">কোর্স দেখো</a>');
        return;
      }
      const first = weekStart(month);
      const weeks = Math.ceil((month.getDay() + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7);
      const cells = Array.from({ length: weeks * 7 }, (_, i) => {
        const d = addDays(first, i);
        const items = itemsOn(d);
        return `<div class="cal-cell" role="gridcell">
          <a class="cal-num${same(d, TODAY) ? ' is-today' : ''}" href="routine.html?date=${iso(d)}" aria-label="${dayLabel(d)}: ${items.length ? `${bn(items.length)}টি ক্লাস/টেস্ট` : 'কোনো ক্লাস নেই'}">${bn(d.getDate())}</a>
          ${items.map((x) => `<button type="button" class="cal-ev cal-ev--${x.kind}" data-ev="${x.id}" aria-expanded="false" aria-label="${esc(x.subject)}: ${esc(x.title)}, ${clock(x.start)}">${chipTime(x.start)}</button>`).join('')}
        </div>`;
      });
      grid.innerHTML = `<div class="cal-grid" role="grid" aria-label="${monthLabel(month)}">
        <div class="cal-row cal-head" role="row">${DAYS.map((n) => `<span role="columnheader">${n}</span>`).join('')}</div>
        ${Array.from({ length: weeks }, (_, w) => `<div class="cal-row" role="row">${cells.slice(w * 7, w * 7 + 7).join('')}</div>`).join('')}
      </div>`;
    };

    // The class card, pinned under its chip with a notch pointing at it (live's popover)
    const CAL_SMALL = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20"><rect x="2" y="3.5" width="16" height="14.5" rx="2" fill="currentColor"/><path d="M2 7.5h16" stroke="#fff" stroke-width="1.2"/><path d="M6 2v3M14 2v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><g fill="#fff"><rect x="4.5" y="9.5" width="2" height="2" rx=".4"/><rect x="9" y="9.5" width="2" height="2" rx=".4"/><rect x="13.5" y="9.5" width="2" height="2" rx=".4"/><rect x="4.5" y="13.5" width="2" height="2" rx=".4"/><rect x="9" y="13.5" width="2" height="2" rx=".4"/></g></svg>';
    let card = null;
    let anchor = null;
    function closeCard(refocus) {
      if (!card) return;
      card.remove();
      card = null;
      anchor?.setAttribute('aria-expanded', 'false');
      anchor?.classList.remove('is-open');
      if (refocus) anchor?.focus();
      anchor = null;
    }
    const showCard = (btn, fromKeyboard) => {
      const id = btn.dataset.ev;
      const x = itemsOn(parse(id.slice(0, 10))).find((it) => it.id === id);
      if (!x) return;
      const again = anchor === btn;
      closeCard();
      if (again) return; // tapping the open chip again closes it
      anchor = btn;
      const a = action(x);
      const sub = x.kind === 'lecture' ? chapter(x.title) : '';
      card = document.createElement('div');
      card.className = 'cal-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-label', x.title);
      card.innerHTML = `
        <p class="cal-card-meta"><span class="cal-card-subject">${esc(x.subject)}</span><span aria-hidden="true">•</span><span>${KIND[x.kind]}</span></p>
        <h3 class="cal-card-title">${esc(x.title)}</h3>
        ${sub ? `<p class="cal-card-sub">${esc(sub)}</p>` : ''}
        <p class="cal-card-when">${CAL_SMALL}<span>${bn(x.date.getDate())} ${MONTHS[x.date.getMonth()]}, ${DAYS_LONG[x.date.getDay()]}</span><span aria-hidden="true">|</span><span>${cardTime(x.start)} - ${cardTime(x.start + x.dur)}</span></p>
        ${a ? `<a class="cal-card-btn" href="${a.href}" data-route="${a.route}">${x.kind === 'lecture' && x.state === 'past' ? 'ভিডিও দেখো' : a.label}</a>`
          : `<p class="cal-card-later">${clock(x.start)}-এ শুরু হবে</p>`}`;
      const wrap = grid.querySelector('.cal-grid');
      wrap.append(card);
      // place under the chip, kept inside the grid; the notch follows the chip
      const g = wrap.getBoundingClientRect(), b = btn.getBoundingClientRect();
      const w = Math.min(card.offsetWidth, g.width - 8);
      const left = Math.max(4, Math.min(b.left - g.left + b.width / 2 - w / 2, g.width - w - 4));
      card.style.left = `${left}px`;
      card.style.top = `${b.bottom - g.top + 10}px`;
      card.style.setProperty('--notch', `${b.left - g.left + b.width / 2 - left}px`);
      btn.setAttribute('aria-expanded', 'true');
      btn.classList.add('is-open');
      if (fromKeyboard) card.querySelector('a')?.focus({ preventScroll: true }); // taps don't move focus
    };
    calendarRoot.addEventListener('click', (e) => {
      const ev = e.target.closest('[data-ev]');
      if (ev) { showCard(ev, e.detail === 0); return; }
      if (card && !e.target.closest('.cal-card')) closeCard();
      const step = e.target.closest('[data-month-step]');
      if (step) { month = new Date(month.getFullYear(), month.getMonth() + Number(step.dataset.monthStep), 1); render(); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCard(true); });
    window.addEventListener('resize', () => closeCard());
    const radios = [...calendarRoot.querySelectorAll('[data-source] [role="radio"]')];
    radios.forEach((r) => r.addEventListener('click', () => {
      source = r.value;
      radios.forEach((o) => { o.setAttribute('aria-checked', String(o === r)); o.tabIndex = o === r ? 0 : -1; });
      render();
    }));
    render();
  }
})();
