/* Live class portal (shikho-bkash reference: "Live class portal", app.js). Opened from a live
   class: the homepage's আজকের রুটিন, ক্লাস রুটিন or the calendar. The video loops and a simulated
   chat keeps the room feeling live: students post every few seconds, the teacher sometimes replies
   in a thread, the viewer count drifts. The class is today's live রসায়ন class (routine.js).
   TODO: replace the simulation with the real live stream and chat feed. */
(() => {
  const live = document.querySelector('[data-live]');
  if (!live) return;
  const { bn, esc } = window.ShikhoSheet;
  const user = window.SHIKHO_USER;
  const chat = live.querySelector('[data-live-chat]');
  const meta = live.querySelector('[data-live-meta]');
  const jump = live.querySelector('[data-live-jump]');
  const form = live.querySelector('[data-live-form]');
  const input = form.elements.msg;
  const send = form.querySelector('.live-send');
  const video = live.querySelector('video');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const TEACHER = { name: 'Sourav Sir', photo: 'assets/live-class/av-sourav.jpg' };
  const COLORS = ['#E2136E', '#01846C', '#D93549', '#349D89', '#E8428B', '#505050'];
  const STARTED_MIN = 30; // the class began at 5:00 pm; the prototype's clock is 5:30 pm (routine.js)
  // Opening chat, then a pool that keeps arriving. `reply` = what the teacher may answer.
  const SEED = [
    { name: 'Mahir Ahmed', text: 'স্যার, সাবান আর ডিটারজেন্টের পার্থক্যটা আরেকবার বলবেন?' },
    { name: 'Sadia Rahman', text: 'খর পানিতে সাবান ফেনা দেয় না কেন?', reply: 'খর পানির Ca²⁺ ও Mg²⁺ আয়ন সাবানের সাথে অদ্রবণীয় তলানি তৈরি করে, তাই ফেনা হয় না।' },
    { name: 'Tanvir Ahmed', text: 'উদাহরণ দিয়ে বোঝানোর পর অনেক clear হলো। ধন্যবাদ স্যার 💖' },
    { name: 'Nusrat Jahan', text: 'ফরমালিন দিয়ে খাবার সংরক্ষণ কেন ক্ষতিকর? একটু confused 😕' },
    { name: 'Arafat Rahman', text: 'স্যার, এই অধ্যায় থেকে সৃজনশীল প্রশ্ন কেমন আসে?' },
    { name: 'Israt Fatema', text: 'খুব ভালো বোঝাচ্ছেন স্যার, আজ অনেক clear হয়েছে 😊' },
  ];
  const POOL = [
    { name: 'Rafi Hasan', text: 'লবণ দিয়ে মাছ সংরক্ষণ কীভাবে কাজ করে?', reply: 'লবণ অভিস্রবণে কোষ থেকে পানি বের করে দেয়, তাই জীবাণু বাড়তে পারে না।' },
    { name: 'Mim Akter', text: 'ডিটারজেন্ট কি খর পানিতেও কাজ করে?', reply: 'হ্যাঁ, তাই খর পানিতে ডিটারজেন্ট সাবানের চেয়ে ভালো কাজ করে।' },
    { name: 'Sakib Khan', text: 'স্যার একটু জোরে বলবেন? আওয়াজ কম আসছে' },
    { name: 'Priya Das', text: 'এটা কি বোর্ড পরীক্ষায় আসবে?', reply: 'হ্যাঁ, প্রায় প্রতি বছরই এই অধ্যায় থেকে প্রশ্ন আসে।' },
    { name: 'Jubayer Hossain', text: 'Done স্যার ✅' },
    { name: 'Anika Tabassum', text: 'সাবানের অণুর কোন অংশ তেল ধরে রাখে?', reply: 'লম্বা হাইড্রোকার্বন লেজটা, ওটা তেলে দ্রবীভূত হয়।' },
    { name: 'Fahim Shahriar', text: 'বিক্রিয়াটা খাতায় লিখে নিলাম 📝' },
    { name: 'Tasnia Islam', text: 'স্যার নোটসটা কি PDF এ পাবো?', reply: 'ক্লাস শেষে Smart Note এ পেয়ে যাবে।' },
    { name: 'Nabil Chowdhury', text: 'এভাবে আগে কখনো বুঝিনি 😮' },
    { name: 'Riya Sultana', text: 'গ্রিনহাউস প্রভাব কি এই অধ্যায়ে আছে?', reply: 'হ্যাঁ, পরিবেশ দূষণ অংশে আছে, একটু পরে দেখাবো।' },
    { name: 'Mahir Ahmed', text: 'বুঝেছি স্যার, ধন্যবাদ!' },
    { name: 'Sadia Rahman', text: 'সাবানীকরণ বিক্রিয়াটা আবার দেখাবেন?' },
  ];
  const initials = (n) => n.replace(/\s*\(তুমি\)$/, '').split(/\s+/).map((w) => [...w][0]).join('').slice(0, 2).toUpperCase();
  const colorFor = (n) => COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const clock = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const nearBottom = () => chat.scrollHeight - chat.scrollTop - chat.clientHeight < 60;
  const MORE = '<button type="button" class="lc-more" aria-label="আরও" data-route="liveMessageMenu"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg></button>';
  const state = { timers: [], viewers: 87, openedAt: Date.now(), pool: 0, to: 'teacher', hand: false };

  function line({ name, text, teacher = false, me = false, at = new Date(), reply = false }) {
    const av = teacher ? `<span class="lc-av"><img src="${TEACHER.photo}" alt=""></span>`
      : `<span class="lc-av" style="background:${colorFor(name)}" aria-hidden="true">${esc(initials(name))}</span>`;
    return `<div class="lc-msg${reply ? ' lc-reply' : ''}${me ? ' lc-me' : ''}">${av}
      <div class="lc-body"><div class="lc-head"><b>${esc(name)}</b>${teacher ? '<span class="lc-tag">শিক্ষক</span>' : ''}<time>${clock(at)}</time></div><p>${esc(text)}</p></div>
      ${teacher ? '' : MORE}</div>`;
  }
  // `under`: a message to thread this one beneath (after any replies it already has); otherwise it goes last
  function post(html, animateIn = true, under = null) {
    const stick = nearBottom();
    let el;
    if (under?.isConnected) {
      let at = under;
      while (at.nextElementSibling?.classList.contains('lc-reply')) at = at.nextElementSibling;
      at.insertAdjacentHTML('afterend', html);
      el = at.nextElementSibling;
    } else {
      chat.insertAdjacentHTML('beforeend', html);
      el = chat.lastElementChild;
    }
    while (chat.children.length > 80) chat.firstElementChild.remove();
    if (animateIn && !reduceMotion.matches) el.animate([{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }], { duration: 260, easing: 'ease-out' });
    if (stick) chat.scrollTop = chat.scrollHeight; else jump.hidden = false;
  }
  const teacherReplies = (text, after, question) => {
    state.timers.push(setTimeout(() => post(line({ name: TEACHER.name, text, teacher: true, reply: true }), true, question), after));
  };
  const renderMeta = () => {
    const mins = STARTED_MIN + Math.floor((Date.now() - state.openedAt) / 60000);
    const ago = [Math.floor(mins / 60) && `${bn(Math.floor(mins / 60))} ঘণ্টা`, `${bn(mins % 60)} মিনিট`].filter(Boolean).join(' ');
    meta.innerHTML = `${bn(state.viewers)} জন দেখছে · শুরু হয়েছে ${ago} আগে · <span class="rec">রেকর্ড হচ্ছে</span>`;
  };
  const tick = () => {
    const m = POOL[state.pool++ % POOL.length];
    post(line({ name: m.name, text: m.text }));
    if (m.reply && Math.random() < 0.6) teacherReplies(m.reply, 2500 + Math.random() * 2500, chat.lastElementChild);
    state.timers.push(setTimeout(tick, 2500 + Math.random() * 3500));
  };

  // Open the room: earlier chat, then the stream and new messages
  const now = Date.now();
  SEED.forEach((m, k) => {
    const at = new Date(now - (SEED.length - k) * 60000);
    post(line({ name: m.name, text: m.text, at }), false);
    if (m.reply) post(line({ name: TEACHER.name, text: m.reply, teacher: true, reply: true, at }), false);
  });
  jump.hidden = true;
  renderMeta();
  chat.scrollTop = chat.scrollHeight;
  video.play().catch(() => {}); // stays on the poster frame if the device can't play it
  state.timers.push(setTimeout(tick, 2000));
  state.timers.push(setInterval(() => { state.viewers = Math.max(60, state.viewers + Math.round(Math.random() * 6 - 2)); renderMeta(); }, 4000));
  // Leaving the page (back) stops the simulation; a page restored from the back cache starts it again
  addEventListener('pagehide', () => { state.timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); state.timers = []; video.pause(); });
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    video.play().catch(() => {});
    state.timers.push(setTimeout(tick, 2000));
  });

  chat.addEventListener('scroll', () => { if (nearBottom()) jump.hidden = true; });
  jump.addEventListener('click', () => { chat.scrollTo({ top: chat.scrollHeight, behavior: reduceMotion.matches ? 'auto' : 'smooth' }); jump.hidden = true; });
  input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    chat.scrollTop = chat.scrollHeight; // your own message always brings you to the bottom
    post(line({ name: `${user?.name || 'তুমি'} (তুমি)`, text, me: true }));
    const mine = chat.lastElementChild;
    input.value = '';
    send.disabled = true;
    if (state.to === 'teacher') teacherReplies('ভালো প্রশ্ন! একটু পরে বোর্ডে দেখাচ্ছি।', 3000 + Math.random() * 2000, mine);
  });
  live.addEventListener('click', (e) => {
    const to = e.target.closest('[data-live-to]');
    if (to) {
      state.to = state.to === 'teacher' ? 'all' : 'teacher';
      const label = state.to === 'teacher' ? 'শিক্ষক' : 'সবাই';
      to.querySelector('[data-live-to-label]').textContent = label;
      to.setAttribute('aria-label', `কাকে পাঠাবে: ${label}`);
      return;
    }
    const hand = e.target.closest('[data-live-hand]');
    if (hand) {
      state.hand = !state.hand;
      hand.setAttribute('aria-pressed', String(state.hand));
      hand.setAttribute('aria-label', state.hand ? 'হাত নামাও' : 'হাত তোলো');
      post(`<p class="lc-note">${state.hand ? 'তুমি হাত তুলেছ ✋ স্যার তোমাকে কথা বলার সুযোগ দেবেন' : 'তুমি হাত নামিয়েছ'}</p>`);
    }
  });
})();
