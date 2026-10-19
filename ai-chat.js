/* Shikho AI doubt screen (shikho-bkash reference: Shikho AI tab, Figma "AI - Chatbot").
   Free students get 3 questions a day; then the AI package sheet (sheet.js) is offered.
   Paid students (and anyone who bought a package here) ask without a limit. */
(() => {
  const screen = document.querySelector('[data-ai]');
  if (!screen) return;
  const { bn, esc } = window.ShikhoSheet;

  const SUBJECTS = ['পদার্থবিজ্ঞান', 'রসায়ন', 'জীববিজ্ঞান', 'গণিত', 'ইংরেজি']; // subjects Shikho AI answers today
  const PROMPTS = [
    { q: "Newton's 3rd law সহজ করে বুঝাও",
      a: 'প্রতিটি ক্রিয়ার একটি সমান ও বিপরীত প্রতিক্রিয়া আছে। যেমন: তুমি দেয়ালে ধাক্কা দিলে দেয়ালও তোমাকে সমান বলে উল্টো দিকে ধাক্কা দেয়। তাই নৌকা থেকে লাফ দিলে নৌকা পেছনে সরে যায়।' },
    { q: 'এই অংকটা বুঝিয়ে দাও',
      a: 'অংকটা লিখে বা ছবি তুলে পাঠাও। আমি ধাপে ধাপে সমাধান করে দেখাব, আর প্রতিটা ধাপ কেন করছি সেটাও বলব।' },
  ];
  const FREE_PER_DAY = 3;

  // Free questions left today; kept for this browser tab so the count survives moving between pages
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode: count lasts this page only */ } },
  };
  let left = Math.max(0, Math.min(FREE_PER_DAY, Number(store.get('shikho-ai-left') ?? FREE_PER_DAY)));
  const unlimited = () => document.documentElement.dataset.plan === 'paid' || !!store.get('shikho-ai-plan');

  const form = screen.querySelector('[data-ai-form]');
  const text = form.elements.q;
  const send = form.querySelector('.ai-send');
  const chat = screen.querySelector('[data-ai-chat]');
  const intro = screen.querySelector('.ai-intro');
  const popular = screen.querySelector('[data-ai-popular]');

  form.elements.subject.innerHTML = SUBJECTS.map((s) => `<option>${s}</option>`).join('');
  screen.querySelector('[data-ai-prompts]').innerHTML =
    PROMPTS.map((p, i) => `<button type="button" class="ai-chip" data-ai-prompt="${i}">${esc(p.q)}</button>`).join('');

  function renderUsage() {
    const el = screen.querySelector('[data-ai-usage]');
    if (unlimited()) {
      const plan = store.get('shikho-ai-plan');
      el.innerHTML = `<span class="ai-unlimited">${plan ? `${esc(plan)} প্যাকেজ: আনলিমিটেড প্রশ্ন` : 'তোমার কোর্সে আনলিমিটেড প্রশ্ন'}</span>`;
      return;
    }
    el.innerHTML = `<span>আজকের ফ্রি প্রশ্ন: <b>${bn(left)}/${bn(FREE_PER_DAY)}</b> বাকি</span>
      <span class="ai-track" role="progressbar" aria-label="আজকের ফ্রি প্রশ্ন" aria-valuemin="0" aria-valuemax="${FREE_PER_DAY}" aria-valuenow="${left}"><span class="ai-fill" style="width:${(left / FREE_PER_DAY) * 100}%"></span></span>`;
  }

  function ask(q, a) {
    intro.hidden = true;
    popular.hidden = true;
    chat.hidden = false;
    if (!unlimited()) {
      if (!left) {
        // Out of free questions: offer a Shikho AI package (cheapest first)
        if (!chat.querySelector('.ai-limit')) {
          chat.insertAdjacentHTML('beforeend', `
            <div class="ai-limit">
              <b>আজকের ফ্রি প্রশ্ন শেষ</b>
              <span>প্যাকেজ নিলে যত খুশি প্রশ্ন করতে পারবে, ছবি তুলেও</span>
              <button type="button" class="btn-primary btn-sm" data-sheet="ai-package" data-package="0">মাত্র ৳৪৯-এ প্যাকেজ নাও</button>
            </div>`);
        }
        chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }
      left -= 1;
      store.set('shikho-ai-left', String(left));
      renderUsage();
    }
    const subject = form.elements.subject.value;
    chat.insertAdjacentHTML('beforeend', `
      <div class="bubble me">${q}</div>
      <div class="bubble ai"><small>${esc(subject)}</small>${a || 'Placeholder: শিখো AI-এর উত্তর এখানে আসবে। ধাপে ধাপে সমাধান আর ব্যাখ্যা দেখানো হবে।'}</div>`);
    chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  text.addEventListener('input', () => {
    screen.querySelector('[data-ai-count]').textContent = `${bn(text.value.length)}/৫০০`;
    send.disabled = !text.value.trim();
  });
  // Enter sends, Shift+Enter makes a new line
  text.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = text.value.trim();
    if (!q) return;
    ask(esc(q));
    text.value = '';
    text.dispatchEvent(new Event('input'));
  });
  screen.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-ai-prompt]');
    if (chip) { const p = PROMPTS[Number(chip.dataset.aiPrompt)]; ask(esc(p.q), p.a); }
    if (e.target.closest('[data-ai-photo]')) window.ShikhoToast?.('ছবি তুলে প্রশ্ন করার সুবিধা এখানে আসবে');
  });
  // A package bought from the sheet lifts the limit right away
  window.addEventListener('shikho-ai-plan', () => { chat.querySelector('.ai-limit')?.remove(); renderUsage(); });

  renderUsage();
})();
