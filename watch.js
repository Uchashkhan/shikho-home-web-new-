/* Video player page (shikho-bkash reference: .watch). watch.html?list=important|guideline&v=<index>[&subject=…]
   Class streams need a login, so playback is simulated with a clock over the poster, like the reference. */
(() => {
  const main = document.querySelector('[data-watch]');
  const V = window.SHIKHO_VIDEOS;
  if (!main || !V) return;
  const { esc } = window.ShikhoSheet;
  const toast = (m) => window.ShikhoToast?.(m);

  const ICON = {
    play: '<path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor"/>',
    pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/>',
    prev: '<path d="M6 6h2v12H6zM18 6v12l-8.5-6L18 6Z" fill="currentColor"/>',
    next: '<path d="M16 6h2v12h-2zM6 6v12l8.5-6L6 6Z" fill="currentColor"/>',
    back10: '<path d="M12 5V2L7.5 5.5 12 9V6a6 6 0 1 1-6 6H4.5A7.5 7.5 0 1 0 12 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><text x="12" y="15.5" font-size="6.5" font-weight="700" text-anchor="middle" fill="currentColor">10</text>',
    fwd10: '<path d="M12 5V2l4.5 3.5L12 9V6a6 6 0 1 0 6 6h1.5A7.5 7.5 0 1 1 12 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><text x="12" y="15.5" font-size="6.5" font-weight="700" text-anchor="middle" fill="currentColor">10</text>',
    vol: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    mute: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="m16 9.5 5 5m0-5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    gear: '<path d="M12 3.5 19.4 7.75v8.5L12 20.5l-7.4-4.25v-8.5Z" fill="currentColor"/><circle cx="12" cy="12" r="2.6" fill="#111"/>',
    full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const icon = (n, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
  const toSec = (d) => d.split(':').reduce((a, n) => a * 60 + Number(n), 0);
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (s, long) => (long ? `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`);
  const normSubject = (s) => (s || '').replace(/ী/g, 'ি').trim();

  const q = new URLSearchParams(location.search);
  const key = q.get('list') in V ? q.get('list') : 'important';
  const L = V[key];
  const clampId = (n) => Math.max(0, Math.min(L.videos.length - 1, Number(n) || 0));
  const player = { id: clampId(q.get('v')), tab: q.get('subject') || 'সব', t: 0, total: 0, playing: false, muted: false, autoplay: true, timer: 0 };

  document.querySelector('.appbar-title').textContent = L.title;

  const ids = () => L.videos.map((v, i) => i)
    .filter((i) => player.tab === 'সব' || normSubject(L.videos[i].subject) === normSubject(player.tab));

  function render() {
    stop();
    const c = L.videos[player.id];
    Object.assign(player, { t: 0, total: toSec(c.duration), playing: false });
    document.title = `${c.title} | Shikho`;
    const long = player.total >= 3600;
    const chips = L.chips.length ? `
      <div class="chip-row h-scroll watch-chips" role="group" aria-label="বিষয় অনুযায়ী ফিল্টার">${L.chips.map(([label, img]) => `
        <button type="button" class="chip${label === player.tab ? ' is-active' : ''}" aria-pressed="${label === player.tab}" data-tab="${esc(label)}">${img ? `<img src="${img}" alt="" width="14" height="20">` : ''}${esc(label)}</button>`).join('')}
      </div>` : '';
    main.innerHTML = `
      <div class="player" data-player>
        <img class="pl-poster" src="${c.thumb}" alt="" width="640" height="360">
        <div class="pl-top">
          <button type="button" class="pl-auto" data-pl="autoplay" aria-pressed="${player.autoplay}" aria-label="অটোপ্লে"><span>${icon('pause', 12)}</span></button>
          <button type="button" data-pl="mute" aria-pressed="${player.muted}" aria-label="মিউট">${icon(player.muted ? 'mute' : 'vol')}</button>
          <button type="button" data-pl="settings" aria-label="সেটিংস">${icon('gear')}</button>
        </div>
        <div class="pl-mid">
          <button type="button" data-pl="prev" aria-label="আগের ক্লাস">${icon('prev', 20)}</button>
          <button type="button" data-pl="back10" aria-label="১০ সেকেন্ড পিছনে">${icon('back10', 28)}</button>
          <button type="button" class="pl-play" data-pl="play" aria-label="প্লে">${icon('play', 30)}</button>
          <button type="button" data-pl="fwd10" aria-label="১০ সেকেন্ড সামনে">${icon('fwd10', 28)}</button>
          <button type="button" data-pl="next" aria-label="পরের ক্লাস">${icon('next', 20)}</button>
        </div>
        <div class="pl-bottom">
          <span class="pl-cur">${fmt(0, long)}</span>
          <div class="pl-bar" data-pl="seek" role="slider" tabindex="0" aria-label="ভিডিওর অগ্রগতি" aria-valuemin="0" aria-valuemax="${player.total}" aria-valuenow="0" aria-valuetext="${fmt(0, long)}"><i></i></div>
          <span>${c.duration}</span>
          <button type="button" data-pl="full" aria-label="ফুলস্ক্রিন">${icon('full', 22)}</button>
        </div>
      </div>
      <div class="watch-info">
        <h2>${esc(c.title)}</h2>
        <div class="teacher"><img class="av" src="${c.avatar}" alt="" width="36" height="36"><div><b>${esc(c.teacher)}</b><small>${esc(c.subject || L.title)}</small></div></div>
      </div>
      <section class="watch-related" aria-labelledby="rel-h">
        <h3 id="rel-h">${L.related}</h3>
        ${chips}
        <div class="rel-list" data-rel></div>
      </section>`;
    renderRelated();
    const chip = main.querySelector('.watch-chips .is-active');
    if (chip) chip.parentElement.scrollLeft = Math.max(0, chip.offsetLeft - chip.parentElement.offsetLeft - 16);
  }

  function renderRelated() {
    const list = ids().filter((i) => i !== player.id);
    main.querySelector('[data-rel]').innerHTML = list.map((i) => {
      const c = L.videos[i];
      return `
        <a class="rel" href="${href(i)}" data-go="${i}">
          <span class="rel-thumb"><img src="${c.thumb}" alt="" width="128" height="72" loading="lazy"><span class="rel-play" aria-hidden="true">${icon('play', 14)}</span><span class="rel-dur">${c.duration}</span></span>
          <span class="rel-body">
            <span class="rel-title">${esc(c.title)}</span>
            <span class="rel-meta"><img src="${c.avatar}" alt="" width="18" height="18" loading="lazy"><span>${esc(c.teacher)}</span></span>
            ${c.subject ? `<span class="tag-pill">${esc(c.subject)}</span>` : ''}
          </span>
        </a>`;
    }).join('') || '<p class="rel-empty">এখানে আর কিছু নেই।</p>';
  }

  const href = (i) => `watch.html?list=${key}&v=${i}${player.tab !== 'সব' ? `&subject=${encodeURIComponent(player.tab)}` : ''}`;
  const go = (i, push = true) => {
    player.id = clampId(i);
    if (push) history.pushState({ v: player.id }, '', href(player.id));
    const swap = () => {
      render();
      window.scrollTo({ top: 0, behavior: 'instant' });
      main.querySelector('.pl-play').focus({ preventScroll: true });
    };
    // next class slides in like opening a new page
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { document.startViewTransition({ update: swap, types: ['forward'] }); } catch (err) { swap(); }
    } else swap();
  };
  window.addEventListener('popstate', () => { player.id = clampId(new URLSearchParams(location.search).get('v')); render(); });

  // ---------- Simulated playback ----------
  function paint() {
    const long = player.total >= 3600;
    const p = player.total ? (player.t / player.total) * 100 : 0;
    const el = main.querySelector('[data-player]');
    el.querySelector('.pl-bar i').style.width = `${p}%`;
    el.querySelector('.pl-cur').textContent = fmt(player.t, long);
    const bar = el.querySelector('.pl-bar');
    bar.setAttribute('aria-valuenow', player.t);
    bar.setAttribute('aria-valuetext', fmt(player.t, long));
    const play = el.querySelector('[data-pl="play"]');
    play.innerHTML = icon(player.playing ? 'pause' : 'play', 30);
    play.setAttribute('aria-label', player.playing ? 'পজ' : 'প্লে');
    el.classList.toggle('playing', player.playing);
  }
  function stop() { clearInterval(player.timer); player.playing = false; }
  function tick() {
    player.t = Math.min(player.total, player.t + 1);
    if (player.t >= player.total) {
      stop();
      const order = ids(), next = order[order.indexOf(player.id) + 1];
      if (player.autoplay && next !== undefined) return go(next);
    }
    paint();
  }
  const seek = (t) => { player.t = Math.max(0, Math.min(player.total, Math.round(t))); paint(); };
  const step = (dir) => {
    const order = ids(), at = order.indexOf(player.id);
    const to = order[(at < 0 ? 0 : at) + dir];
    if (to === undefined) return toast(dir > 0 ? 'এটাই শেষ ক্লাস' : 'এটাই প্রথম ক্লাস');
    go(to);
  };

  main.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      player.tab = tab.dataset.tab;
      main.querySelectorAll('[data-tab]').forEach((c) => { const on = c === tab; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', String(on)); });
      history.replaceState(history.state, '', href(player.id));
      return renderRelated();
    }
    const rel = e.target.closest('[data-go]');
    if (rel) { e.preventDefault(); return go(Number(rel.dataset.go)); }
    const btn = e.target.closest('[data-pl]');
    if (!btn) return;
    const act = btn.dataset.pl;
    if (act === 'play') {
      if (player.playing) stop();
      else { if (player.t >= player.total) player.t = 0; player.playing = true; player.timer = setInterval(tick, 1000); }
      paint();
    }
    if (act === 'back10') seek(player.t - 10);
    if (act === 'fwd10') seek(player.t + 10);
    if (act === 'prev') step(-1);
    if (act === 'next') step(1);
    if (act === 'mute') { player.muted = !player.muted; btn.setAttribute('aria-pressed', String(player.muted)); btn.innerHTML = icon(player.muted ? 'mute' : 'vol'); }
    if (act === 'autoplay') { player.autoplay = !player.autoplay; btn.setAttribute('aria-pressed', String(player.autoplay)); toast(player.autoplay ? 'অটোপ্লে চালু' : 'অটোপ্লে বন্ধ'); }
    if (act === 'settings') toast('ভিডিওর কোয়ালিটি ও স্পিড সেটিংস এখানে আসবে');
    if (act === 'full') {
      const el = main.querySelector('[data-player]');
      if (document.fullscreenElement) document.exitFullscreen?.();
      else el.requestFullscreen?.().catch(() => toast('এই ব্রাউজারে ফুলস্ক্রিন চালু হয়নি'));
    }
    if (act === 'seek') {
      const r = btn.getBoundingClientRect();
      seek(((e.clientX - r.left) / r.width) * player.total);
    }
  });
  main.addEventListener('keydown', (e) => {
    if (!e.target.matches('[data-pl="seek"]')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); seek(player.t + 10); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); seek(player.t - 10); }
  });

  render();
})();
