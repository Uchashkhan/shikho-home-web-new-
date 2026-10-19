/* Sign-up / profile setup (shikho-bkash reference: .onboard). Name + class (+ group for 9/10).
   The profile is kept in this browser (data/user.js reads it back) and the student lands on Home. */
(() => {
  const form = document.querySelector('[data-signup]');
  if (!form) return;
  const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
  const CLASSES = [6, 7, 8, 9, 10];
  const GROUPS = ['বিজ্ঞান', 'ব্যবসায় শিক্ষা', 'মানবিক'];
  const hasGroup = (c) => c === '9' || c === '10';
  // SSC batch: class 9 sits SSC two years on, class 10 next year (from this year). The main one is
  // picked for the student; one year either side is offered for repeaters / early starters.
  const THIS_YEAR = new Date().getFullYear();
  const mainBatch = (c) => THIS_YEAR + (c === '9' ? 2 : 1);
  const batchLabel = (y) => `এসএসসি ${bn(y)}`;
  const batchBox = form.querySelector('[data-batch]');
  let batch = '';
  const { name, class: cls, group } = form.elements;
  const submit = form.querySelector('.ob-submit');
  const reveal = form.querySelector('[data-group-reveal]');

  cls.innerHTML = '<option value="" disabled selected>ক্লাস বাছাই করো</option>' + CLASSES.map((c) => `<option value="${c}">ক্লাস ${bn(c)}</option>`).join('');
  group.innerHTML = '<option value="" disabled selected>গ্রুপ বাছাই করো</option>' + GROUPS.map((g) => `<option value="${g}">${g}</option>`).join('');

  const check = () => { submit.disabled = !(name.value.trim() && cls.value && (!hasGroup(cls.value) || (group.value && batch))); };
  const renderBatch = () => {
    if (!hasGroup(cls.value)) { batch = ''; batchBox.innerHTML = ''; return; }
    const main = mainBatch(cls.value);
    batch = batchLabel(main);
    batchBox.innerHTML = [main - 1, main, main + 1].map((y) => {
      const on = y === main;
      return `<button type="button" class="chip${on ? ' is-active' : ''}" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-batch-year="${y}">${batchLabel(y)}</button>`;
    }).join('');
  };
  const pickBatch = (b) => {
    batch = batchLabel(Number(b.dataset.batchYear));
    batchBox.querySelectorAll('[role="radio"]').forEach((x) => {
      const on = x === b;
      x.classList.toggle('is-active', on);
      x.setAttribute('aria-checked', String(on));
      x.tabIndex = on ? 0 : -1;
    });
    check();
  };
  batchBox.addEventListener('click', (e) => { const b = e.target.closest('[data-batch-year]'); if (b) pickBatch(b); });
  batchBox.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const all = [...batchBox.querySelectorAll('[role="radio"]')];
    const i = all.indexOf(document.activeElement) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
    const to = all[(i + all.length) % all.length];
    pickBatch(to); to.focus();
  });
  // Show Group only for class 9/10. Hiding clears it; moving between 9 and 10 keeps the choice.
  const syncGroup = () => {
    const on = hasGroup(cls.value);
    reveal.classList.toggle('open', on);
    reveal.inert = !on;
    group.required = on;
    if (!on) group.value = '';
  };
  name.addEventListener('input', check);
  cls.addEventListener('change', () => { syncGroup(); renderBatch(); check(); });
  group.addEventListener('change', check);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    const profile = { name: name.value.trim(), className: `ক্লাস ${bn(cls.value)}`, group: group.value || null, exam: batch || null };
    try { localStorage.setItem('shikho-profile', JSON.stringify(profile)); } catch (err) { /* private mode: lasts this visit only */ }
    submit.disabled = true;
    submit.textContent = 'প্রোফাইল তৈরি হচ্ছে…';
    setTimeout(() => { location.href = 'index.html'; }, 400);
  });
  name.focus();
})();
