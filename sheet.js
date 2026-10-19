/* Bottom sheet + bKash checkout (shikho-bkash reference: .sheet, "পাস কেনো", "ভর্তি হও", trial).
   Opened by any [data-sheet] control:
     enroll      course page "কোর্সে ভর্তি হও" (data-title, -thumb, -price, -old, -days)
     ai-package  Shikho AI paid plans (data-package = index in AI_PACKAGES)
     program     free-trial card "প্রোগ্রামে ভর্তি হও" (homepage, wired below)
     trial       free-trial card "২ দিন ফ্রিতে শিখো" (homepage, wired below)
   Payment is simulated: the prototype never charges anything. */
(() => {
  const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
  const en = (s) => Number(String(s).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/[^\d.]/g, ''));
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const bnNum = new Intl.NumberFormat('bn-BD');
  const taka = (n) => `৳${bnNum.format(n)}`; // ৳১,০০০ like the course pages
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Sheet shell ----------
  let backdrop, sheet, titleEl, body, returnFocus;
  const build = () => {
    backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
        <div class="sheet-head">
          <h2 class="sheet-title" id="sheet-title"></h2>
          <button type="button" class="sheet-close" data-sheet-close>বন্ধ করো</button>
        </div>
        <div class="sheet-body"></div>
      </div>`;
    document.body.append(backdrop);
    sheet = backdrop.querySelector('.sheet');
    titleEl = backdrop.querySelector('.sheet-title');
    body = backdrop.querySelector('.sheet-body');
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop || e.target.closest('[data-sheet-close]')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (backdrop.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // keep focus inside the sheet
        const f = [...sheet.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')].filter((n) => n.offsetParent);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  };

  let onClose = null;
  function open(title, html, opts = {}) {
    if (!backdrop) build();
    const fresh = backdrop.hidden;
    if (fresh) returnFocus = document.activeElement;
    titleEl.textContent = title;
    body.innerHTML = html;
    body.scrollTop = 0;
    onClose = opts.onClose || null;
    backdrop.hidden = false;
    document.documentElement.classList.add('sheet-open');
    if (fresh && !reduceMotion()) {
      backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
      sheet.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 320, easing: 'cubic-bezier(.32,.72,0,1)' });
    }
    (body.querySelector('[aria-checked="true"]') || sheet).focus({ preventScroll: true });
  }

  function close() {
    if (!backdrop || backdrop.hidden) return;
    const done = () => {
      backdrop.hidden = true;
      body.innerHTML = '';
      document.documentElement.classList.remove('sheet-open');
      returnFocus?.focus?.({ preventScroll: true });
      const cb = onClose; onClose = null; cb?.();
    };
    if (reduceMotion()) return done();
    sheet.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: 220, easing: 'cubic-bezier(.4,0,1,1)' });
    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 }).onfinish = done;
  }

  window.ShikhoSheet = { open, close, bn, esc, taka };

  // ---------- Checkout pieces ----------
  const user = window.SHIKHO_USER;
  const payFor = () => (user ? `
      <div class="pay-for"><span>কার জন্য: <b>${esc(user.name)}</b>${user.className ? ` · ${esc(user.className)}` : ''}${user.group ? ` · ${esc(user.group)}` : ''}</span><span lang="en">bKash 01•••••456</span></div>` : '');
  const checks = (items) => `<ul class="checks">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const thumb = (src, alt, filter) => `<div class="sheet-thumb"><img src="${esc(src)}" alt="${esc(alt)}"${filter ? ` style="filter:${esc(filter)}"` : ''}></div>`;
  const PROTO_NOTE = 'পেমেন্ট হবে bKash দিয়ে। এটি প্রোটোটাইপ, তাই কোনো টাকা কাটা হবে না।';

  // Pay button: a short "processing" state, then the success view
  const pay = (btn, success) => {
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.textContent = 'পেমেন্ট হচ্ছে…';
    setTimeout(success, 900);
  };
  const successView = (title, text, cta = '<button type="button" class="btn-primary btn-block" data-sheet-close>ঠিক আছে</button>') => `
      <div class="sheet-success">
        <span class="sheet-success-ic" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>
        <h3>${title}</h3>
        <p>${text}</p>
      </div>
      ${cta}`;

  // ---------- Views ----------
  // Course page: one course, one price
  function enroll(el) {
    const d = el.dataset, price = en(d.price);
    open('কোর্সে ভর্তি', `
      ${thumb(d.thumb, d.title)}
      <h3 class="sheet-h">${esc(d.title)}</h3>
      <p class="sheet-sub">কোর্সের মেয়াদ ${esc(d.days)} দিন</p>
      ${checks(['অ্যানিমেটেড ক্লাস', 'সাধারণ গণিত · ১৭টি অধ্যায়', 'জীববিজ্ঞান ও English', 'অভিজ্ঞ মেন্টর'])}
      <div class="sheet-total"><span>মোট মূল্য</span><span>${d.old ? `<s>${taka(en(d.old))}</s>` : ''}<b>${taka(price)}</b></span></div>
      ${payFor()}
      <div class="note">${PROTO_NOTE}</div>
      <button type="button" class="btn-primary btn-block" data-pay>bKash দিয়ে ${taka(price)} পে করো</button>`);
    body.querySelector('[data-pay]').addEventListener('click', (e) => pay(e.currentTarget, () => open('কোর্সে ভর্তি',
      successView('ভর্তি সম্পন্ন হয়েছে', `${esc(d.title)} কোর্সে তোমার ভর্তি সম্পন্ন হয়েছে। এখন থেকে সব ক্লাস দেখতে পারবে।`))));
  }

  // Free-trial card: the program (reference COURSES.academic: ৳৬০০০ → ৳৫০০০)
  const PROGRAM = { points: ['লাইভ ক্লাস', 'রেকর্ডেড ক্লাস', 'চ্যাপ্টার এক্সাম', 'নোটস ও বই', 'Shikho AI'], old: 6000, price: 5000 };
  function program(card) {
    open('প্রোগ্রামে ভর্তি', `
      ${thumb(card.img, card.title, card.filter)}
      <h3 class="sheet-h">${esc(card.title)}</h3>
      <p class="sheet-sub">একাডেমিক প্রোগ্রাম · পুরো বছরের প্রস্তুতি</p>
      ${checks(PROGRAM.points)}
      <div class="sheet-total"><span>মোট মূল্য</span><span><s>${taka(PROGRAM.old)}</s><b>${taka(PROGRAM.price)}</b></span></div>
      ${payFor()}
      <div class="note">${PROTO_NOTE}</div>
      <button type="button" class="btn-primary btn-block" data-pay>bKash দিয়ে ${taka(PROGRAM.price)} পে করো</button>`);
    body.querySelector('[data-pay]').addEventListener('click', (e) => pay(e.currentTarget, () => open('প্রোগ্রামে ভর্তি',
      successView('ভর্তি সম্পন্ন হয়েছে', `${esc(card.title)} প্রোগ্রামে তোমার ভর্তি সম্পন্ন হয়েছে।`))));
  }

  // Free-trial card: start the 2-day trial (no payment)
  function trial(card) {
    open('ফ্রি ট্রায়াল', `
      ${thumb(card.img, card.title, card.filter)}
      <h3 class="sheet-h">২ দিন সবকিছু ফ্রি</h3>
      <p class="sheet-sub">${esc(card.title)}</p>
      ${checks(['লাইভ ক্লাস', 'অ্যানিমেটেড লেসন ও রেকর্ডেড ক্লাস', 'লাইভ ও প্র্যাকটিস MCQ টেস্ট', 'স্মার্ট নোট, ক্লাস নোট ও প্র্যাকটিস বুক'])}
      ${payFor()}
      <div class="note">২ দিন শেষ হলে ট্রায়াল নিজে থেকে বন্ধ হয়ে যাবে, কোনো টাকা কাটা হবে না।</div>
      <button type="button" class="btn-primary btn-block" data-pay>ট্রায়াল শুরু করো</button>`);
    body.querySelector('[data-pay]').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      setTimeout(() => open('ফ্রি ট্রায়াল', successView('ট্রায়াল চালু হয়েছে', `আগামী ২ দিন ${esc(card.title)}-এর সবকিছু ফ্রি।`)), 500);
    });
  }

  // Shikho AI plans (ai.shikho.com), shown like the reference day-pass checkout
  const AI_PACKAGES = [
    { name: 'স্টার্টার', days: 3, price: 49 },
    { name: 'বুস্ট', days: 7, price: 79 },
    { name: 'প্রো', days: 30, price: 279, tag: 'মোস্ট পপুলার' },
    { name: 'এলিট', days: 90, price: 749 },
  ];
  function aiPackage(pick = 2) {
    const p = AI_PACKAGES[pick];
    open('প্যাকেজ কেনো', `
      <h3 class="sheet-h">Shikho AI প্যাকেজ</h3>
      <p class="sheet-sub">যত খুশি প্রশ্ন করো, উত্তর পাবে সম্পূর্ণ বাংলায়</p>
      <div class="pass-opts" role="radiogroup" aria-label="প্যাকেজ">${AI_PACKAGES.map((x, i) => `
        <button type="button" class="pass-opt" role="radio" aria-checked="${i === pick}" data-pick="${i}">
          <span class="po-days">${x.name}<small>${bn(x.days)} দিন</small>${x.tag ? `<span class="tag-now">${x.tag}</span>` : ''}</span>
          <span class="po-price"><b>${taka(x.price)}</b><small>দিনে ~${taka(Math.round(x.price / x.days))}</small></span>
        </button>`).join('')}</div>
      ${checks(['আনলিমিটেড প্রশ্ন', 'ছবি আপলোড করে প্রশ্ন', 'AI মডেল: Shikho AI Pro', 'সম্পূর্ণ বাংলায় ব্যাখ্যা'])}
      ${payFor()}
      <div class="note">${bn(p.days)} দিন শেষ হলে প্যাকেজ নিজে থেকে বন্ধ হয়ে যাবে, আর কোনো টাকা কাটা হবে না।</div>
      <button type="button" class="btn-primary btn-block" data-pay>bKash দিয়ে ${taka(p.price)} পে করো</button>`);
    body.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => aiPackage(Number(b.dataset.pick))));
    body.querySelector('[data-pay]').addEventListener('click', (e) => pay(e.currentTarget, () => {
      try { sessionStorage.setItem('shikho-ai-plan', p.name); } catch (err) { /* private mode: plan lasts this page only */ }
      open('প্যাকেজ কেনো', successView('প্যাকেজ চালু হয়েছে',
        `${p.name} প্যাকেজ চালু হয়েছে। আগামী ${bn(p.days)} দিন যত খুশি প্রশ্ন করতে পারবে।`,
        location.pathname.endsWith('ai-chat.html')
          ? '<button type="button" class="btn-primary btn-block" data-sheet-close>প্রশ্ন করো</button>'
          : '<a class="btn-primary btn-block" href="ai-chat.html">প্রশ্ন করো</a>'), { onClose: () => window.dispatchEvent(new Event('shikho-ai-plan')) });
    }));
  }

  // ---------- Triggers ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-sheet]');
    if (!el) return;
    e.preventDefault();
    const kind = el.dataset.sheet;
    if (kind === 'enroll') enroll(el);
    if (kind === 'ai-package') aiPackage(Number(el.dataset.package ?? 2));
    if (kind === 'program' || kind === 'trial') {
      const root = el.closest('.bg-white.rounded-\\[16px\\]');
      const img = root?.querySelector('img');
      const card = {
        title: root?.querySelector('[data-name="Heading 4"]')?.textContent.trim() || 'একাডেমিক প্রোগ্রাম',
        img: img?.getAttribute('src') || 'assets/academic-program.webp',
        filter: img?.style.filter || '',
      };
      (kind === 'trial' ? trial : program)(card);
    }
  });

  // Homepage free-trial buttons come from Figma as divs: make them real buttons
  document.querySelectorAll('[data-section="s05_freetrial"] .bk-btn').forEach((b) => {
    b.dataset.sheet = b.textContent.includes('ফ্রিতে') ? 'trial' : 'program';
    b.setAttribute('role', 'button');
    b.tabIndex = 0;
    b.style.cursor = 'pointer';
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } });
  });

  // ---------- bKash mini-app header: "⋯" menu and close ----------
  const MENU_IC = {
    home: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1Z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
    reload: '<path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/>',
  };
  const menuRow = (key, label) => `<button type="button" class="menu-row" data-menu="${key}"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${MENU_IC[key]}</svg>${label}</button>`;
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-appbar-close]')) {
      window.ShikhoToast?.('bKash অ্যাপে এখান থেকে Shikho বন্ধ হয়ে যাবে');
      return;
    }
    if (e.target.closest('[data-appbar-more]')) {
      open('Shikho', `<div class="menu-list">${menuRow('home', 'হোমে যাও')}${menuRow('link', 'লিংক কপি করো')}${menuRow('reload', 'রিলোড করো')}</div>`);
      return;
    }
    const item = e.target.closest('[data-menu]');
    if (!item) return;
    const act = item.dataset.menu;
    if (act === 'home') location.href = 'index.html';
    if (act === 'reload') location.reload();
    if (act === 'link') {
      const done = () => { close(); window.ShikhoToast?.('লিংক কপি হয়েছে'); };
      navigator.clipboard?.writeText(location.href).then(done, () => { close(); window.ShikhoToast?.('লিংক কপি করা যায়নি'); }) ?? done();
    }
  });
  // Hairline under the header once content scrolls beneath it
  const nav = document.querySelector('.page-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 4);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
