/* Frozen copy of the ORIGINAL (pre-redesign) script, used only by old/free.html and old/paid.html */
(() => {
  /* Burger menu drawer */
  const drawer = document.getElementById('menu-drawer');
  const burger = document.querySelector('.page-nav [data-name="Container"]');
  if (drawer && burger) {
    burger.setAttribute('role', 'button');
    burger.setAttribute('aria-label', 'মেনু খোলো');
    burger.setAttribute('aria-controls', 'menu-drawer');
    burger.setAttribute('aria-expanded', 'false');
    burger.tabIndex = 0;
    burger.style.cursor = 'pointer';
    const setOpen = (open) => {
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-locked', open);
      // preventScroll: focusing the off-screen close button would otherwise make the
      // browser scroll the clipped drawer and skip the slide-in animation
      drawer.scrollLeft = 0;
      (open ? drawer.querySelector('.menu-close') : burger).focus({ preventScroll: true });
    };
    burger.addEventListener('click', () => setOpen(true));
    burger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } });
    drawer.querySelector('.menu-close').addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false); });
    drawer.querySelectorAll('.menu-link').forEach((link) => link.addEventListener('click', (e) => {
      e.preventDefault();
      drawer.querySelectorAll('.menu-link').forEach((l) => { l.classList.toggle('is-active', l === link); l.toggleAttribute('aria-current', l === link); });
      setOpen(false);
    }));
  }

  const leftOf = (el) => {
    if (el.classList.contains('left-0')) return 0;
    const m = el.className.match(/left-\[(-?[\d.]+)px\]/);
    return m ? parseFloat(m[1]) : null;
  };

  /* Subject filter chips: scrollable row with a single active chip */
  const CHIP_ACTIVE = { border: 'border-[#85a4ff]', bg: 'bg-[#d5e7ff]', text: 'text-[#3b4ee3]' };
  const CHIP_IDLE = { border: 'border-[#e5e7eb]', bg: 'bg-[rgba(255,255,255,0)]', text: 'text-[#5b616d]' };

  document.querySelectorAll('.overflow-clip.justify-center.w-\\[412px\\]').forEach((row) => {
    row.classList.replace('justify-center', 'justify-start');
    row.classList.add('h-scroll');
    const chips = [...row.children];
    const setChip = (chip, s) => {
      const from = s === CHIP_ACTIVE ? CHIP_IDLE : CHIP_ACTIVE;
      chip.classList.replace(from.border, s.border);
      chip.querySelector('[aria-hidden]')?.classList.replace(from.bg, s.bg);
      chip.querySelector('p')?.classList.replace(from.text, s.text);
    };
    chips.forEach((chip) => {
      chip.setAttribute('role', 'button');
      chip.tabIndex = 0;
      chip.style.cursor = 'pointer';
      chip.addEventListener('click', () => {
        chips.forEach((c) => setChip(c, c === chip ? CHIP_ACTIVE : CHIP_IDLE));
      });
    });
  });

  /* Card rows & carousels: tracks of absolutely positioned slides */
  const tracks = [...document.querySelectorAll('div[class*="h-[2"]')].filter((t) => {
    const slides = [...t.children].filter((c) => c.classList.contains('absolute') && leftOf(c) !== null);
    return slides.length > 1 && /w-\[\d{4,}px\]/.test(t.className);
  });

  // Infinite loop like the live slick carousels: slides rotate through the fixed
  // Figma slots; the slide that wraps around jumps off-screen without animating.
  tracks.forEach((track) => {
    const slides = [...track.children].filter((c) => leftOf(c) !== null).sort((a, b) => leftOf(a) - leftOf(b));
    const slots = slides.map(leftOf);
    const n = slides.length;
    const step = slots[1] - slots[0];
    const viewport = track.parentElement;

    // Pagination dots live in the nearest ancestor that also holds "List Item" dots
    let dotsHost = viewport;
    while (dotsHost && !dotsHost.querySelector('[data-name="List Item"].rounded-\\[50px\\], [data-name="List Item"].rounded-\\[10px\\]')) {
      dotsHost = dotsHost.parentElement;
      if (dotsHost?.tagName === 'SECTION') { dotsHost = null; break; }
    }
    const dots = dotsHost ? [...dotsHost.querySelectorAll('[data-name="List Item"]')].filter((d) => d.className.includes('h-[6px]') || d.className.includes('size-[6px]')) : [];
    const initialDot = Math.max(0, dots.findIndex((d) => d.className.includes('bg-[#e2008d]')));

    let index = 0;
    const EASE = 'transform 350ms ease';
    track.style.transition = EASE;
    viewport.style.touchAction = 'pan-y';
    const mod = (v, m) => ((v % m) + m) % m;
    const slotOf = (j, k) => mod(j - k, n);

    const render = (prev = index) => {
      track.style.transform = 'translateX(0px)';
      slides.forEach((s, j) => {
        const from = slotOf(j, prev), to = slotOf(j, index);
        s.style.transition = Math.abs(to - from) > 1 ? 'none' : EASE;
        s.style.transform = `translateX(${slots[to] - slots[j]}px)`;
      });
      if (!dots.length) return;
      const active = (((index + initialDot) % dots.length) + dots.length) % dots.length;
      dots.forEach((d, i) => {
        const on = i === active;
        d.classList.toggle('bg-[#e2008d]', on);
        d.classList.toggle('bg-[#99b6d6]', !on);
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
      if (!dir) return render();
      const tick = () => {
        const prev = index;
        index += dir;
        render(prev);
        if (index !== target) setTimeout(tick, 60);
      };
      tick();
    };

    dots.forEach((d, i) => {
      d.style.cursor = 'pointer';
      d.addEventListener('click', () => go(index + (i - mod(index + initialDot, dots.length))));
    });

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
      if (Math.abs(dx) > step / 5) go(index + (dx < 0 ? 1 : -1)); else render();
    });
    viewport.addEventListener('click', (e) => { if (Math.abs(dx) > 5) e.preventDefault(); }, true);
    viewport.querySelectorAll('img').forEach((img) => (img.draggable = false));
    render();
  });
})();
