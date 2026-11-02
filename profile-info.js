/* তোমার তথ্য (live app.shikho.dev/student/profile): four tabs switched in place, ?tab= opens one.
     info       what bKash registration asks for (name, class, group, batch) + photo/name edit
     syllabus   class / batch / group + change (bottom sheet, same rules as sign-up)
     admission  programs bought through bKash + other courses (empty state for free students)
     program    pick the program whose content is shown       (empty state under 2 programs)
   Edits are kept in this browser's profile (data/user.js reads it back on every page). */
(() => {
  const root = document.querySelector('[data-profile-info]');
  if (!root) return;
  const { open, close, bn, esc, successView } = window.ShikhoSheet;
  const toast = (m) => window.ShikhoToast?.(m);
  const paid = document.documentElement.dataset.plan === 'paid';
  let user = window.SHIKHO_USER || {};
  const programs = paid ? (user.programs || []) : []; // a free student isn't enrolled in any
  const NONE = 'দেওয়া হয়নি';
  // Edit pencil from the live "সিলেবাস পরিবর্তন করো" button
  const PENCIL = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M17.2574 4.69276C17.5824 5.01776 17.5824 5.54276 17.2574 5.86776L15.7324 7.39276L12.6074 4.26776L14.1324 2.74276C14.288 2.58672 14.4994 2.49902 14.7199 2.49902C14.9403 2.49902 15.1517 2.58672 15.3074 2.74276L17.2574 4.69276ZM2.49902 17.0844V14.5511C2.49902 14.4344 2.54069 14.3344 2.62402 14.2511L11.7157 5.15943L14.8407 8.28443L5.74069 17.3761C5.66569 17.4594 5.55736 17.5011 5.44902 17.5011H2.91569C2.68236 17.5011 2.49902 17.3178 2.49902 17.0844Z"/></svg>';

  // The same profile the sign-up screen saves (signup.js): only what bKash registration asks for,
  // plus the profile photo and when the name was last changed (live rule: once every 60 days;
  // registering isn't a change)
  const KEYS = ['name', 'className', 'group', 'exam', 'nameChangedAt', 'avatarUrl'];
  const save = (changes) => {
    user = Object.assign({}, user, changes);
    try { localStorage.setItem('shikho-profile', JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, user[k] ?? null])))); } catch (e) { /* storage blocked: this page only */ }
    render();
  };

  // ---------- Tabs ----------
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const select = (key, focus) => {
    const tab = tabs.find((t) => t.dataset.tab === key) || tabs[0];
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      root.querySelector(`#${t.getAttribute('aria-controls')}`).hidden = !on;
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const url = new URL(location.href);
    url.searchParams.set('tab', tab.dataset.tab);
    history.replaceState(null, '', url);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      select(tabs[(i + step + tabs.length) % tabs.length].dataset.tab, true);
    });
  });
  // "···": the tabs that don't fully fit, in a menu (live's ant-tabs "more" button)
  const strip = root.querySelector('.pi-tabs');
  const more = root.querySelector('.pi-more');
  const menu = root.querySelector('.pi-more-menu');
  const hiddenTabs = () => {
    const box = strip.getBoundingClientRect();
    return tabs.filter((t) => { const r = t.getBoundingClientRect(); return r.left < box.left - 1 || r.right > box.right + 1; });
  };
  const closeMore = (refocus) => {
    if (menu.hidden) return;
    menu.hidden = true;
    more.setAttribute('aria-expanded', 'false');
    if (refocus) more.focus();
  };
  const syncMore = () => { more.hidden = !hiddenTabs().length; if (more.hidden) closeMore(); };
  more.addEventListener('click', () => {
    if (!menu.hidden) return closeMore();
    menu.innerHTML = hiddenTabs().map((t) => `<li role="menuitem" tabindex="-1" data-to="${t.dataset.tab}">${t.querySelector('svg').outerHTML}${t.textContent.trim()}</li>`).join('');
    menu.hidden = false;
    more.setAttribute('aria-expanded', 'true');
    menu.querySelector('li')?.focus();
  });
  menu.addEventListener('click', (e) => {
    const li = e.target.closest('[data-to]');
    if (!li) return;
    closeMore();
    select(li.dataset.to, true);
  });
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('li')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.activeElement.click(); }
    if (e.key === 'Escape' || e.key === 'Tab') closeMore(e.key === 'Escape');
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.pi-tabbar')) closeMore(); });
  strip.addEventListener('scroll', syncMore, { passive: true });
  addEventListener('resize', syncMore);
  const panel = (key) => root.querySelector(`[data-panel="${key}"]`);
  // Section actions sit beside the heading; only full-width confirm buttons go to the bottom (.pi-cta)
  const head = (title, action, icon = PENCIL) => `<div class="pi-head"><h2>${title}</h2>${action ? `<button type="button" class="pi-action" data-action="${action[0]}">${icon}${action[1]}</button>` : ''}</div>`;

  // ---------- তোমার তথ্য ----------
  // Only what bKash registration collects; group and batch exist for class 9/10 only
  const field = (label, value, wide) => `<div class="pi-field${wide ? ' pi-field--wide' : ''}"><dt>${label}</dt><dd${value ? '' : ' class="is-missing"'}>${esc(value || NONE)}</dd></div>`;
  // Name changes: once every 60 days
  const NAME_LOCK_DAYS = 60;
  const DAY = 864e5;
  const dateBn = (t) => new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(t);
  const nameUnlocksAt = () => (user.nameChangedAt ? new Date(user.nameChangedAt).getTime() + NAME_LOCK_DAYS * DAY : 0);
  const nameLocked = () => nameUnlocksAt() > Date.now();
  const LOCK = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 9V7A5 5 0 0 0 7 7v2a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3ZM9 7a3 3 0 0 1 6 0v2H9Z"/></svg>';

  const initial = (name) => (!name ? '' : window.Intl?.Segmenter ? [...new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(name)][0].segment : [...name][0]);
  const avatar = (photo, name, cls) => `<div class="${cls}" aria-hidden="true">${photo ? `<img src="${esc(photo)}" alt="">` : esc(initial(name))}</div>`;

  const renderInfo = () => {
    const name = (user.name || '').trim();
    const locked = nameLocked();
    panel('info').innerHTML = `
      ${head('ব্যক্তিগত তথ্য', ['edit', 'পরিবর্তন করো'])}
      ${avatar(user.avatarUrl, name, 'pi-avatar')}
      <dl class="pi-fields">
        <div class="pi-field pi-field--wide"><dt>তোমার নাম</dt><dd${name ? '' : ' class="is-missing"'}>${esc(name || NONE)}</dd>${locked ? `<p class="pi-field-note">${LOCK}আবার পরিবর্তন করতে পারবে ${dateBn(nameUnlocksAt())} থেকে</p>` : ''}</div>
        ${field('ক্লাস', user.className, !hasGroup(user.className))}
        ${hasGroup(user.className) ? field('গ্রুপ', user.group) + field('পরীক্ষার ব্যাচ', user.exam, true) : ''}
      </dl>`;
  };

  // Photo (live: camera on the avatar at the top of the edit drawer): cropped to a 256px square
  // so it stays small enough to keep in this browser
  const toPhoto = (file) => new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('not an image'));
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = Object.assign(document.createElement('canvas'), { width: 256, height: 256 });
      canvas.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('unreadable image'));
    img.src = URL.createObjectURL(file);
  });

  // Edit: photo + name (class, group and batch change in the সিলেবাস tab).
  // Journey: form → confirm (only when the name changes: 60-day rule) → saving → success → page flashes what changed.
  // The photo can change any time; inside the 60 days the name field is locked and says until when.
  const editInfo = (draft = {}) => {
    const locked = nameLocked();
    let photo = 'photo' in draft ? draft.photo : user.avatarUrl || null;
    open('তোমার তথ্য', `
      <form class="pi-form" id="pi-edit" novalidate>
        <div class="pi-photo">
          <button type="button" class="pi-photo-pick" data-photo-pick aria-label="প্রোফাইল ছবি পরিবর্তন করো">
            <span data-photo-preview></span>
            <span class="pi-photo-cam" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9.2 4a2 2 0 0 0-1.7 1L6.9 6H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-1.9l-.6-1a2 2 0 0 0-1.7-1H9.2ZM12 9a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/></svg></span>
          </button>
          <div class="pi-photo-actions">
            <button type="button" class="pi-link" data-photo-pick>ছবি পরিবর্তন করো</button>
            <button type="button" class="pi-link pi-link--muted" data-photo-remove>ছবি সরাও</button>
          </div>
          <input type="file" accept="image/*" data-photo-file hidden>
        </div>
        <div class="field">
          <label for="pi-name">শিক্ষার্থীর নাম</label>
          <input id="pi-name" name="name" type="text" autocomplete="off" maxlength="40" value="${esc(draft.name ?? user.name)}" required aria-describedby="pi-name-hint"${locked ? ' readonly' : ''}>
          ${locked
            ? `<small class="hint pi-field-note" id="pi-name-hint">${LOCK}আবার পরিবর্তন করতে পারবে ${dateBn(nameUnlocksAt())} থেকে</small>`
            : '<small class="hint" id="pi-name-hint">যে পড়বে তার নাম লেখো</small>'}
          <small class="hint pi-err" id="pi-name-err" role="alert" hidden>নাম খালি রাখা যাবে না</small>
        </div>
        ${locked ? '' : `<p class="pi-note pi-note--warn">${LOCK}নাম পরিবর্তন করলে ৬০ দিনের মধ্যে আর পরিবর্তন করতে পারবে না</p>`}
        <p class="pi-note">ক্লাস, গ্রুপ আর ব্যাচ বদলাতে সিলেবাস ট্যাবে যাও</p>
      </form>
      <button type="submit" form="pi-edit" class="btn-primary btn-block">আপডেট করো</button>`);
    const form = document.getElementById('pi-edit');
    const input = form.elements.name;
    const submit = document.querySelector('.sheet [form="pi-edit"]');
    const err = form.querySelector('#pi-name-err');
    const file = form.querySelector('[data-photo-file]');
    const removeBtn = form.querySelector('[data-photo-remove]');
    const showPhoto = () => {
      form.querySelector('[data-photo-preview]').outerHTML = `<span data-photo-preview>${avatar(photo, input.value.trim() || user.name, 'pi-avatar pi-avatar--edit')}</span>`;
      form.querySelector('.pi-photo-pick').classList.toggle('has-photo', !!photo); // camera over the photo, or a corner badge on the letter
      removeBtn.hidden = !photo;
    };
    // Update once something really changed; an empty name explains itself
    const check = () => {
      const name = input.value.trim();
      const nameChanged = !locked && name !== (user.name || '').trim();
      submit.disabled = !name || (!nameChanged && photo === (user.avatarUrl || null));
      err.hidden = !!name;
      input.setAttribute('aria-invalid', String(!name));
    };
    form.querySelectorAll('[data-photo-pick]').forEach((b) => b.addEventListener('click', () => file.click()));
    file.addEventListener('change', () => {
      toPhoto(file.files[0]).then((url) => { photo = url; showPhoto(); check(); }, () => toast('এই ফাইলটি ছবি হিসেবে নেওয়া যায়নি'));
      file.value = '';
    });
    removeBtn.addEventListener('click', () => { photo = null; showPhoto(); check(); form.querySelector('.pi-photo-pick').focus(); });
    input.addEventListener('input', () => { if (!photo) showPhoto(); check(); }); // the letter follows the name
    showPhoto();
    check();
    if (!locked) input.focus();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submit.disabled) return;
      const changes = {};
      const name = input.value.trim();
      if (!locked && name !== (user.name || '').trim()) changes.name = name;
      if (photo !== (user.avatarUrl || null)) changes.avatarUrl = photo;
      if ('name' in changes) confirmName(changes, photo);
      else saveInfo(changes, submit);
    });
  };

  const confirmName = (changes, photo) => {
    const until = dateBn(Date.now() + NAME_LOCK_DAYS * DAY);
    open('নাম পরিবর্তন', `
      <h3 class="sheet-h">নাম পরিবর্তন নিশ্চিত করো</h3>
      <dl class="pi-compare">
        <div><dt>আগের নাম</dt><dd>${esc(user.name || NONE)}</dd></div>
        <div><dt>নতুন নাম</dt><dd>${esc(changes.name)}</dd></div>
      </dl>
      ${'avatarUrl' in changes ? `<p class="pi-also">${changes.avatarUrl ? 'নতুন প্রোফাইল ছবিও সেভ হবে' : 'প্রোফাইল ছবি সরিয়ে ফেলা হবে'}</p>` : ''}
      <div class="note pi-warn">${LOCK}<span>পরিবর্তনের পর ৬০ দিন, মানে ${until} পর্যন্ত আর নাম পরিবর্তন করতে পারবে না।</span></div>
      <div class="sheet-actions">
        <button type="button" class="btn-secondary" data-prev>ফিরে যাও</button>
        <button type="button" class="btn-primary" data-yes>হ্যাঁ, পরিবর্তন করো</button>
      </div>`);
    const sheet = document.querySelector('.sheet');
    sheet.querySelector('[data-prev]').addEventListener('click', () => editInfo({ name: changes.name, photo }));
    sheet.querySelector('[data-yes]').addEventListener('click', (e) => {
      sheet.querySelector('[data-prev]').disabled = true;
      saveInfo(Object.assign({}, changes, { nameChangedAt: new Date().toISOString() }), e.currentTarget);
    });
  };

  // Saving → success view in the same sheet (like the bKash checkout) → page flashes what changed
  const saveInfo = (changes, btn) => {
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.textContent = 'আপডেট হচ্ছে…';
    setTimeout(() => {
      save(changes);
      const named = 'name' in changes;
      const pictured = 'avatarUrl' in changes;
      const title = named && pictured ? 'তোমার তথ্য আপডেট হয়েছে' : named ? 'তোমার নাম পরিবর্তন হয়েছে' : changes.avatarUrl ? 'তোমার ছবি আপডেট হয়েছে' : 'তোমার ছবি সরানো হয়েছে';
      const text = named
        ? `এখন থেকে Shikho-তে তোমার নাম দেখাবে <b>${esc(changes.name)}</b>। আবার নাম পরিবর্তন করতে পারবে ${dateBn(nameUnlocksAt())} থেকে।`
        : changes.avatarUrl ? 'এখন থেকে Shikho-তে তোমার নতুন ছবি দেখাবে।' : 'ছবির জায়গায় এখন তোমার নামের প্রথম অক্ষর দেখাবে।';
      open('তোমার তথ্য', successView(title, text), {
        onClose: () => {
          const flash = [named && panel('info').querySelector('.pi-field'), pictured && panel('info').querySelector('.pi-avatar')].filter(Boolean);
          flash.forEach((el) => {
            el.classList.add('is-updated');
            el.addEventListener('animationend', () => el.classList.remove('is-updated'), { once: true });
          });
        },
      });
    }, 700);
  };

  // ---------- সিলেবাস ----------
  // Row icons copied from the live সিলেবাস tab (app.shikho.dev/student/profile?selected=1)
  // (full paths spelled out so build_standalone.py bundles them)
  const IC = { class: 'assets/icons/syllabus-class.svg', batch: 'assets/icons/syllabus-batch.svg', group: 'assets/icons/syllabus-group.svg' };
  const row = (ic, label, value) => `<li class="pi-row"><img class="pi-ic" src="${IC[ic]}" alt="" width="48" height="48"><span class="pi-row-text"><small>${label}</small><b${value ? '' : ' class="is-missing"'}>${esc(value || NONE)}</b></span></li>`;
  const hasGroup = (cls) => cls === 'ক্লাস ৯' || cls === 'ক্লাস ১০';
  const renderSyllabus = () => {
    panel('syllabus').innerHTML = `
      ${head('ক্লাস ও গ্রুপ', ['syllabus', 'সিলেবাস পরিবর্তন করো'])}
      <ul class="pi-rows">
        ${row('class', 'ক্লাস', user.className)}
        ${hasGroup(user.className) ? row('batch', 'পরীক্ষার ব্যাচ', user.exam) + row('group', 'গ্রুপ', user.group) : ''}
      </ul>`;
  };

  // Same choices as sign-up: class 6–10; class 9/10 also pick a group and an SSC batch
  const CLASSES = [6, 7, 8, 9, 10];
  const GROUPS = ['বিজ্ঞান', 'ব্যবসায় শিক্ষা', 'মানবিক'];
  const THIS_YEAR = new Date().getFullYear();
  const batches = (cls) => { const main = THIS_YEAR + (cls === 'ক্লাস ৯' ? 2 : 1); return [main - 1, main, main + 1].map((y) => `এসএসসি ${bn(y)}`); };
  const radioList = (name, items, picked, num) => `<div class="pass-opts" role="radiogroup" aria-label="${name}">${items.map((x) => `
      <button type="button" class="pass-opt pi-opt" role="radio" aria-checked="${x === picked}" value="${esc(x)}">
        <span class="pi-opt-text">${num ? `<span class="pi-num" aria-hidden="true">${esc(x.replace('ক্লাস ', ''))}</span>` : ''}${esc(x)}</span>
        <span class="prog-radio" aria-hidden="true"></span>
      </button>`).join('')}</div>`;
  const pickIn = (box, onPick) => box.addEventListener('click', (e) => {
    const b = e.target.closest('[role="radio"]');
    if (!b) return;
    box.querySelectorAll('[role="radio"]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    onPick(b.value);
  });
  const changeSyllabus = () => {
    let cls = user.className;
    const stepClass = () => {
      open('সিলেবাস পরিবর্তন', `
        <h3 class="sheet-h">তুমি এখন কোন ক্লাসে লেখাপড়া করছো?</h3>
        ${radioList('ক্লাস', CLASSES.map((c) => `ক্লাস ${bn(c)}`), cls, true)}
        <button type="button" class="btn-primary btn-block" data-next${cls ? '' : ' disabled'}>${hasGroup(cls) ? 'এগিয়ে যাও' : 'সেভ করো'}</button>`);
      const next = document.querySelector('.sheet [data-next]');
      pickIn(document.querySelector('.sheet .pass-opts'), (v) => { cls = v; next.disabled = false; next.textContent = hasGroup(v) ? 'এগিয়ে যাও' : 'সেভ করো'; });
      next.addEventListener('click', () => (hasGroup(cls) ? stepGroup() : done({ className: cls, group: null, exam: null })));
    };
    const stepGroup = () => {
      const options = batches(cls);
      let group = GROUPS.includes(user.group) ? user.group : null;
      // A new class gets that class's usual batch; the same class keeps the student's choice
      let exam = cls === user.className && options.includes(user.exam) ? user.exam : options[1];
      open('সিলেবাস পরিবর্তন', `
        <h3 class="sheet-h">তোমার গ্রুপ আর ব্যাচ বাছাই করো</h3>
        <p class="sheet-sub">${esc(cls)}</p>
        <p class="pi-step-label">গ্রুপ</p>
        <div data-groups>${radioList('গ্রুপ', GROUPS, group)}</div>
        <p class="pi-step-label" id="pi-batch-label">পরীক্ষার ব্যাচ</p>
        <div class="pi-chips" role="radiogroup" aria-labelledby="pi-batch-label" data-batches>${options.map((b) => `<button type="button" class="chip${b === exam ? ' is-active' : ''}" role="radio" aria-checked="${b === exam}" value="${esc(b)}">${esc(b)}</button>`).join('')}</div>
        <div class="sheet-actions">
          <button type="button" class="btn-secondary" data-prev>ফিরে যাও</button>
          <button type="button" class="btn-primary" data-next${group ? '' : ' disabled'}>সেভ করো</button>
        </div>`);
      const sheet = document.querySelector('.sheet');
      const next = sheet.querySelector('[data-next]');
      pickIn(sheet.querySelector('[data-groups]'), (v) => { group = v; next.disabled = false; });
      pickIn(sheet.querySelector('[data-batches]'), (v) => {
        exam = v;
        sheet.querySelectorAll('[data-batches] .chip').forEach((c) => c.classList.toggle('is-active', c.value === v));
      });
      sheet.querySelector('[data-prev]').addEventListener('click', stepClass);
      next.addEventListener('click', () => done({ className: cls, group, exam }));
    };
    const done = (changes) => { save(changes); close(); toast('সিলেবাস পরিবর্তন হয়েছে'); };
    stepClass();
  };

  // ---------- ভর্তির বিস্তারিত ----------
  // What bKash sells: whole-year programs (sheet.js PROGRAM) and single courses (course page)
  const CHECK = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  // Empty-state art from live (app.shikho.dev/images/empty-list-icon.svg, /icons/empty-state/sad-bag.svg)
  const EMPTY = { list: 'assets/icons/empty-list.svg', bag: 'assets/icons/empty-sad-bag.svg' };
  const empty = (img, title, note, action = '') => `
      <div class="pi-empty"><img src="${img}" alt="" width="96" height="96"><p class="pi-empty-title">${title}</p>${note ? `<p>${note}</p>` : ''}${action}</div>`;
  const renderAdmission = () => {
    panel('admission').innerHTML = `
      <div class="pi-head"><h2>তোমার একাডেমিক প্রোগ্রাম</h2></div>
      ${programs.length ? `<ul class="pi-progs">${programs.map((p) => `
        <li class="pi-prog">
          <div class="pi-prog-top">
            <span class="pi-tag pi-tag--on">${CHECK}ভর্তি হয়েছো</span>
            <h3>${esc(p.name)}</h3>
            <p>একাডেমিক প্রোগ্রাম · পুরো বছরের প্রস্তুতি</p>
          </div>
          <p class="pi-valid"><span>ভর্তির মেয়াদ</span><b>${esc(p.validTill)}</b></p>
        </li>`).join('')}</ul>` : empty(EMPTY.list, 'তোমার কোনো প্রোগ্রামে ভর্তি হওয়া নেই', '', '<a href="#" class="btn-secondary" data-sheet="program">প্রোগ্রামে ভর্তি হও</a>')}
      <div class="pi-head pi-head--gap"><h2>তোমার অন্যান্য কোর্স</h2></div>
      ${empty(EMPTY.list, 'তোমার কোনো কোর্সে এনরোল করা নেই', '', '<a href="courses.html" class="btn-secondary">কোর্স দেখো</a>')}`;
  };

  // ---------- প্রোগ্রাম পরিবর্তন ----------
  const PROGRAM_KEY = 'shikho-program'; // same choice as the profile tab's switcher (sheet.js)
  const currentProgram = () => { try { return Math.min(Number(localStorage.getItem(PROGRAM_KEY)) || 0, programs.length - 1); } catch (e) { return 0; } };
  const renderProgram = () => {
    const now = currentProgram();
    let pick = now;
    const box = panel('program');
    if (programs.length < 2) {
      box.innerHTML = empty(EMPTY.bag, 'তুমি অন্য কোনো প্রোগ্রামে ভর্তি হওনি!', 'একই ক্লাসে একাধিক প্রোগ্রামে ভর্তি হলে এখানে দেখতে পাবে।');
      return;
    }
    box.innerHTML = `
      <div class="pi-head pi-head--stack"><h2>একাডেমিক প্রোগ্রাম পরিবর্তন করো</h2><p>যে প্রোগ্রাম সিলেক্ট করবে শুধু সে প্রোগ্রামের কনটেন্ট দেখতে পাবে</p></div>
      <div class="pass-opts" role="radiogroup" aria-label="তোমার প্রোগ্রাম">${programs.map((p, i) => `
        <button type="button" class="pass-opt prog-opt" role="radio" aria-checked="${i === now}" value="${i}">
          <span class="prog-opt-text"><span class="tag-enrolled">ভর্তি হয়েছো</span>${esc(p.name)}</span>
          <span class="prog-radio" aria-hidden="true"></span>
        </button>`).join('')}</div>
      <div class="pi-cta"><button type="button" class="btn-primary btn-block pi-confirm" disabled>হ্যাঁ, পরিবর্তন করতে চাই</button></div>`;
    const confirm = box.querySelector('.pi-confirm');
    pickIn(box.querySelector('.pass-opts'), (v) => { pick = Number(v); confirm.disabled = pick === now; });
    confirm.addEventListener('click', () => {
      try { localStorage.setItem(PROGRAM_KEY, String(pick)); } catch (e) { /* this page only */ }
      renderProgram();
      toast(`${programs[pick].name}-এ পরিবর্তন হয়েছে`);
    });
  };

  const render = () => {
    renderInfo();
    renderSyllabus();
    renderAdmission();
    renderProgram();
  };
  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-action]')?.dataset.action;
    if (act === 'edit') editInfo();
    if (act === 'syllabus') changeSyllabus();
  });
  render();
  select(new URLSearchParams(location.search).get('tab') || 'info');
  syncMore();
  document.fonts?.ready.then(syncMore); // tab widths settle once the Bangla font is in
})();
