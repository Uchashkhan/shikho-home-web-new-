(() => {
  /* Signed-in student: data/user.js in this prototype; ?guest previews signed-out */
  const user = new URLSearchParams(location.search).has('guest') ? null : (window.SHIKHO_USER || null);

  /* App routes. Only the home page is built in this prototype; the others are real app
     routes (verified on app.shikho.dev) but are deliberately not linked to the live site. */
  const ROUTES = {
    home: { path: '/student/home', local: 'index.html' },
    profile: { path: '/student/profile', local: 'profile.html' },
    courses: { path: '/student/courses', local: 'courses.html' },
    ai: { path: 'ai.shikho.com', local: 'shikho-ai.html' }, // live app opens the separate Shikho AI site
    importantClasses: { path: '/student/videos/PopularVideo', local: 'important-classes.html' },
    guidelines: { path: '/student/videos/GuidelineVideo', local: 'guidelines.html' },
    course: { path: '/student/courses/[id]', local: 'course.html' },
    courseOther: { path: '/student/courses/[id]', local: null }, // only one course detail is built
    video: { path: '/student/watch', local: null },
    enroll: { path: null, local: null }, // payment flow
    paymentVideo: { path: null, local: null },
    aiChat: { path: 'ai.shikho.com/doubt-solving', local: null },
    aiPackage: { path: null, local: null }, // purchase flow
    admission: { path: '/student/admission', local: null },
    practiceQuiz: { path: null, local: null }, // no quiz route confirmed on live
    routine: { path: '/student/routine', local: null },
    liveClass: { path: '/student/live-class', local: null },
    homework: { path: null, local: null },
    reportCard: { path: '/student/report-card', local: null },
    syllabus: { path: null, local: null },
    login: { path: null, local: null },
    editProfile: { path: null, local: null }, // edit flow not confirmed on live
    logout: { path: null, local: null }, // needs the app's real sign-out
  };

  const toast = document.getElementById('proto-toast');
  let toastTimer;
  const notify = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  document.querySelectorAll('[data-route]').forEach((link) => {
    const route = ROUTES[link.dataset.route];
    if (route?.local && link.tagName === 'A') link.setAttribute('href', route.local);
    else link.dataset.unavailable = '';
  });
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-route]');
    if (!link) return;
    // Destructive actions (log out) ask first, inline
    if (link.dataset.confirm && !link.dataset.confirmed) { e.preventDefault(); askConfirm(link); return; }
    const route = ROUTES[link.dataset.route];
    if (route?.local && !link.hasAttribute('aria-current')) return; // real link: let the browser follow it
    e.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (route?.local) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else notify('এটি এখনো প্রোটোটাইপে চালু হয়নি');
  });

  const askConfirm = (link) => {
    const row = document.createElement('div');
    row.className = 'confirm-row';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', link.dataset.confirm);
    row.innerHTML = `<p>${link.dataset.confirm}</p><div class="confirm-actions">
      <button type="button" class="btn-secondary btn-sm" data-no>না</button>
      <button type="button" class="btn-danger" data-yes>হ্যাঁ, লগ আউট</button></div>`;
    link.hidden = true;
    link.after(row);
    const close = () => { row.remove(); link.hidden = false; };
    row.querySelector('[data-no]').addEventListener('click', () => { close(); link.focus(); });
    row.querySelector('[data-yes]').addEventListener('click', () => {
      close();
      link.dataset.confirmed = '1';
      link.click();
      delete link.dataset.confirmed;
    });
    row.querySelector('[data-no]').focus();
  };

  /* Homepage back arrow: only shown when there is a prototype page to go back to */
  const cameFromHere = document.referrer && new URL(document.referrer).origin === location.origin
    && new URL(document.referrer).pathname !== location.pathname;
  document.querySelectorAll('[data-back-optional]').forEach((a) => { a.hidden = !cameFromHere; });

  /* Inner pages: back goes to the previous page when it was part of this prototype */
  document.querySelectorAll('[data-back]').forEach((a) => a.addEventListener('click', (e) => {
    if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  }));

  const bnNumber = new Intl.NumberFormat('bn-BD'); // Bangla digits for counts read to screen readers

  /* The chosen subject filter is kept in the URL (?subject=…), so it can be shared and survives reload */
  const subjectParam = new URLSearchParams(location.search).get('subject');
  const setSubjectParam = (subject) => {
    const url = new URL(location.href);
    if (subject) url.searchParams.set('subject', subject); else url.searchParams.delete('subject');
    history.replaceState(null, '', url.toString().replace(/=(?=&|$)/g, ''));
  };

  /* List pages: subject chips filter the cards */
  document.querySelectorAll('.chip-row').forEach((row) => {
    const list = row.parentElement.querySelector('[data-filter-list]');
    const empty = row.parentElement.querySelector('.filter-empty');
    if (!list) return;
    const norm = (s) => (s || '').replace(/ী/g, 'ি').trim(); // ইংরেজী / ইংরেজি
    const apply = (chip) => {
      row.querySelectorAll('[data-filter]').forEach((c) => {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
      });
      const want = norm(chip.dataset.filter);
      let shown = 0;
      list.querySelectorAll('[data-subject]').forEach((card) => {
        const on = !want || norm(card.dataset.subject) === want;
        card.hidden = !on;
        shown += on;
      });
      if (empty) empty.hidden = shown > 0;
    };
    row.querySelectorAll('[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
      apply(chip);
      setSubjectParam(chip.dataset.filter);
    }));
    const start = subjectParam && [...row.querySelectorAll('[data-filter]')].find((c) => norm(c.dataset.filter) === norm(subjectParam));
    if (start) apply(start);
  });

  /* Course detail: section tabs follow the scroll position */
  const tabs = [...document.querySelectorAll('.course-tabs a')];
  if (tabs.length && 'IntersectionObserver' in window) {
    const setTab = (id) => tabs.forEach((t) => {
      const on = t.getAttribute('href') === `#${id}`;
      t.classList.toggle('is-active', on);
      if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    setTab(tabs[0].getAttribute('href').slice(1));
    tabs.forEach((t) => t.addEventListener('click', () => setTab(t.getAttribute('href').slice(1))));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setTab(en.target.id); });
    }, { rootMargin: '-120px 0px -60% 0px' });
    tabs.forEach((t) => { const s = document.querySelector(t.getAttribute('href')); if (s) io.observe(s); });
  }

  /* Prototype free/paid switch: same link, view changes in place and the URL follows */
  const planButtons = document.querySelectorAll('[data-plan-set]');
  const showPlan = (plan) => {
    document.documentElement.dataset.plan = plan;
    planButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.planSet === plan)));
  };
  planButtons.forEach((b) => b.addEventListener('click', () => {
    if (document.documentElement.dataset.plan === b.dataset.planSet) return;
    showPlan(b.dataset.planSet);
    const url = new URL(location.href);
    url.searchParams.delete('paid');
    url.searchParams.delete('free');
    url.searchParams.set(b.dataset.planSet, '');
    history.replaceState(null, '', url.toString().replace(/=(?=&|$)/g, ''));
    window.scrollTo(0, 0);
  }));
  if (planButtons.length) showPlan(document.documentElement.dataset.plan || 'free');

  /* Personalised header and profile */
  const join = (parts) => parts.filter(Boolean).join(' | ');
  const firstLetter = (name) => {
    if (window.Intl?.Segmenter) return new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(name)[Symbol.iterator]().next().value?.segment || '';
    return [...name][0] || '';
  };
  document.querySelectorAll('[data-auth]').forEach((el) => { el.hidden = (el.dataset.auth === 'in') !== !!user; });
  if (user) {
    const name = (user.name || '').trim();
    // Missing values are hidden, or shown as a muted fallback where the element has one
    const fill = (key, text) => document.querySelectorAll(`[data-user="${key}"]`).forEach((el) => {
      const fallback = el.dataset.fallback;
      el.textContent = text || fallback || '';
      el.title = text || '';
      el.hidden = !text && !fallback;
      el.classList.toggle('is-missing', !text && !!fallback);
    });
    fill('name', name);
    fill('class-line', join([user.className, user.group]));
    fill('details', join([user.className, user.group, user.exam]));
    fill('class', user.className || '');
    fill('group', user.group || '');
    fill('exam', user.exam || '');
    fill('institution', user.institution || '');
    document.querySelectorAll('[data-user="avatar"]').forEach((el) => {
      if (user.avatarUrl) {
        const img = new Image();
        img.src = user.avatarUrl;
        img.alt = '';
        img.className = 'size-full object-cover';
        el.replaceChildren(img);
      } else if (name) {
        el.textContent = firstLetter(name); // otherwise keep the default person icon
      }
    });
  }

  const leftOf = (el) => {
    if (el.classList.contains('left-0')) return 0;
    const m = el.className.match(/left-\[(-?[\d.]+)px\]/);
    return m ? parseFloat(m[1]) : null;
  };
  const mod = (v, m) => ((v % m) + m) % m;

  /* Card rows & carousels: tracks of absolutely positioned slides */
  const carousels = new Map();
  const tracks = [...document.querySelectorAll('div[class*="w-["]')].filter((t) => {
    const slides = [...t.children].filter((c) => c.classList.contains('absolute') && leftOf(c) !== null);
    return slides.length > 1 && /w-\[\d{4,}px\]/.test(t.className);
  });

  // Infinite loop like the live slick carousels: slides rotate through the fixed
  // Figma slots; the slide that wraps around jumps off-screen without animating.
  tracks.forEach((track) => {
    const all = [...track.children].filter((c) => leftOf(c) !== null).sort((a, b) => leftOf(a) - leftOf(b));
    const slots = all.map(leftOf);
    const own = new Map(all.map((s) => [s, leftOf(s)]));
    const step = slots[1] - slots[0];
    const viewport = track.parentElement;
    // First slot that shows on screen; slots before it sit off-screen to the left
    // (from the Figma offsets: layout may not be styled yet when this runs)
    const base = Math.max(0, slots.findIndex((x) => x + step > 0));

    // Pagination dots live in the nearest ancestor that also holds "List Item" dots
    let dotsHost = viewport;
    while (dotsHost && !dotsHost.querySelector('[data-name="List Item"].rounded-\\[50px\\], [data-name="List Item"].rounded-\\[10px\\]')) {
      dotsHost = dotsHost.parentElement;
      if (dotsHost?.tagName === 'SECTION') { dotsHost = null; break; }
    }
    const dots = dotsHost ? [...dotsHost.querySelectorAll('[data-name="List Item"]')].filter((d) => d.className.includes('h-[6px]') || d.className.includes('size-[6px]')) : [];
    const initialDot = Math.max(0, dots.findIndex((d) => d.className.includes('bg-[#E2136E]')));

    let visible = all, start = 0, index = 0;
    const EASE = 'transform 350ms ease';
    track.style.transition = EASE;
    viewport.style.touchAction = 'pan-y';
    const slotOf = (j, k) => start + mod(j - k, visible.length);
    const looping = () => visible.length >= 3;

    const render = (prev = index, instant = false) => {
      track.style.transform = 'translateX(0px)';
      visible.forEach((s, j) => {
        const from = slotOf(j, prev), to = slotOf(j, index);
        s.style.transition = instant || Math.abs(to - from) > 1 ? 'none' : EASE;
        s.style.transform = `translateX(${slots[to] - own.get(s)}px)`;
      });
      if (!dots.length) return;
      const active = mod(index + initialDot, dots.length);
      dots.forEach((d, i) => {
        const on = i === active;
        d.classList.toggle('bg-[#E2136E]', on);
        d.classList.toggle('bg-[#DDDDDD]', !on);
        d.classList.toggle('w-[12px]', on);
        d.classList.toggle('h-[6px]', on);
        d.classList.toggle('rounded-[50px]', on);
        d.classList.toggle('size-[6px]', !on);
        d.classList.toggle('rounded-[10px]', !on);
      });
    };
    // Step one slot at a time so only off-screen slides ever wrap
    const go = (target) => {
      const dir = Math.sign(target - index);
      if (!dir || !looping()) return render();
      const tick = () => {
        const prev = index;
        index += dir;
        render(prev);
        if (index !== target) setTimeout(tick, 60);
      };
      tick();
    };

    // Show only some slides (subject filter); null shows all of them again
    const empty = document.createElement('p');
    empty.className = 'filter-empty';
    empty.hidden = true;
    empty.textContent = 'এই বিষয়ের কোনো ক্লাস এখন নেই';
    viewport.after(empty);
    const subjectOf = (s) => s.querySelector('.rounded-\\[1000px\\].p-\\[6px\\] p')?.textContent.trim();
    const filter = (subject) => {
      const list = subject ? all.filter((s) => subjectOf(s) === subject) : all;
      all.forEach((s) => { s.style.display = list.includes(s) ? '' : 'none'; });
      // Keep one matching slide parked off-screen on the left so wrapping stays invisible
      if (list === all) {
        visible = all;
        start = 0;
      } else {
        const lead = Math.min(base, Math.max(0, list.length - 3));
        visible = [...list.slice(list.length - lead), ...list.slice(0, list.length - lead)];
        start = base - lead;
      }
      index = 0;
      viewport.hidden = !list.length;
      empty.hidden = !!list.length;
      if (list.length) render(index, true);
    };
    carousels.set(track, { filter });

    // Dots are keyboard buttons too
    dots.forEach((d, i) => {
      const goTo = () => go(index + (i - mod(index + initialDot, dots.length)));
      d.style.cursor = 'pointer';
      d.setAttribute('role', 'button');
      d.tabIndex = 0;
      d.setAttribute('aria-label', `স্লাইড ${bnNumber.format(i + 1)}`);
      d.addEventListener('click', goTo);
      d.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(); } });
    });

    // Keyboard alternative to swiping: arrow keys when the row is focused
    viewport.style.overscrollBehaviorX = 'contain';
    if (looping()) {
      const heading = viewport.closest('section')?.querySelector('h2, [data-name^="Heading"] p')?.textContent.trim();
      viewport.dataset.carousel = '';
      viewport.tabIndex = 0;
      viewport.setAttribute('role', 'region');
      viewport.setAttribute('aria-roledescription', 'ক্যারোসেল');
      if (heading) viewport.setAttribute('aria-label', heading);
      viewport.addEventListener('keydown', (e) => {
        if (e.target !== viewport) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
      });
    }

    // Swipe / drag
    let startX = null, dx = 0;
    viewport.addEventListener('pointerdown', (e) => {
      startX = e.clientX; dx = 0;
      track.style.transition = 'none';
    });
    window.addEventListener('pointermove', (e) => {
      if (startX === null) return;
      dx = e.clientX - startX;
      track.style.transform = `translateX(${dx}px)`;
    });
    window.addEventListener('pointerup', () => {
      if (startX === null) return;
      startX = null;
      track.style.transition = EASE;
      if (looping() && Math.abs(dx) > step / 5) go(index + (dx < 0 ? 1 : -1)); else render();
    });
    viewport.addEventListener('click', (e) => { if (Math.abs(dx) > 5) e.preventDefault(); }, true);
    viewport.querySelectorAll('img').forEach((img) => (img.draggable = false));
    render();
  });

  /* Subject filter chips: scrollable row with a single active chip that filters the cards */
  const CHIP_ACTIVE = { border: 'border-[#E2136E]', bg: 'bg-[#FEF3F8]', text: 'text-[#E2136E]' };
  const CHIP_IDLE = { border: 'border-[#DDDDDD]', bg: 'bg-white', text: 'text-[#505050]' };

  document.querySelectorAll('.overflow-clip.justify-center.h-\\[40px\\]').forEach((row) => {
    row.classList.replace('justify-center', 'justify-start');
    row.classList.add('h-scroll');
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'বিষয় অনুযায়ী ফিল্টার');
    // Figma markup draws chips as <div>s: swap each for a real <button> with the same look and content
    const chips = [...row.children].map((div) => {
      const b = document.createElement('button');
      b.type = 'button';
      for (const a of div.attributes) b.setAttribute(a.name, a.value);
      b.append(...div.childNodes);
      div.replaceWith(b);
      return b;
    });
    const section = row.closest('section');
    const carousel = [...carousels].find(([track]) => section?.contains(track))?.[1];
    const isActive = (chip) => chip.classList.contains(CHIP_ACTIVE.border);
    const setChip = (chip, s) => {
      const from = s === CHIP_ACTIVE ? CHIP_IDLE : CHIP_ACTIVE;
      chip.classList.replace(from.border, s.border);
      chip.querySelector('[aria-hidden]')?.classList.replace(from.bg, s.bg);
      const label = chip.querySelector('p');
      label?.classList.replace(from.text, s.text);
      // active chip in Semi Bold: pink on Bloom reads more clearly at 12px
      label?.classList.toggle('font-semibold', s === CHIP_ACTIVE);
      label?.classList.toggle('font-medium', s !== CHIP_ACTIVE);
      chip.setAttribute('aria-pressed', String(s === CHIP_ACTIVE));
    };
    const label = (chip) => chip.querySelector('p')?.textContent.trim();
    const select = (chip) => {
      chips.forEach((c) => setChip(c, c === chip ? CHIP_ACTIVE : CHIP_IDLE));
      carousel?.filter(chip === chips[0] ? null : label(chip)); // first chip is "সব"
    };
    chips.forEach((chip) => {
      chip.setAttribute('aria-pressed', String(isActive(chip)));
      chip.addEventListener('click', () => {
        select(chip);
        setSubjectParam(chip === chips[0] ? null : label(chip));
      });
    });
    chips.forEach((c) => setChip(c, isActive(c) ? CHIP_ACTIVE : CHIP_IDLE)); // apply the weight to the initial chip
    const start = subjectParam && chips.find((c) => label(c) === subjectParam);
    if (start) select(start);
    row.scrollLeft = 0;
  });
})();
