/* Sign-up / profile setup (shikho-bkash reference: .onboard). Name + class (+ group for 9/10).
   The profile is kept in this browser (data/user.js reads it back) and the student lands on Home. */
(() => {
  const form = document.querySelector('[data-signup]');
  if (!form) return;
  const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
  const CLASSES = [6, 7, 8, 9, 10];
  const GROUPS = ['বিজ্ঞান', 'ব্যবসায় শিক্ষা', 'মানবিক'];
  const hasGroup = (c) => c === '9' || c === '10';
  const { name, class: cls, group } = form.elements;
  const submit = form.querySelector('.ob-submit');
  const reveal = form.querySelector('[data-group-reveal]');

  cls.innerHTML = '<option value="" disabled selected>ক্লাস বাছাই করো</option>' + CLASSES.map((c) => `<option value="${c}">ক্লাস ${bn(c)}</option>`).join('');
  group.innerHTML = '<option value="" disabled selected>গ্রুপ বাছাই করো</option>' + GROUPS.map((g) => `<option value="${g}">${g}</option>`).join('');

  const check = () => { submit.disabled = !(name.value.trim() && cls.value && (!hasGroup(cls.value) || group.value)); };
  // Show Group only for class 9/10. Hiding clears it; moving between 9 and 10 keeps the choice.
  const syncGroup = () => {
    const on = hasGroup(cls.value);
    reveal.classList.toggle('open', on);
    reveal.inert = !on;
    group.required = on;
    if (!on) group.value = '';
  };
  name.addEventListener('input', check);
  cls.addEventListener('change', () => { syncGroup(); check(); });
  group.addEventListener('change', check);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    const profile = { name: name.value.trim(), className: `ক্লাস ${bn(cls.value)}`, group: group.value || null };
    try { localStorage.setItem('shikho-profile', JSON.stringify(profile)); } catch (err) { /* private mode: lasts this visit only */ }
    submit.disabled = true;
    submit.textContent = 'প্রোফাইল তৈরি হচ্ছে…';
    setTimeout(() => { location.href = 'index.html'; }, 400);
  });
  name.focus();
})();
