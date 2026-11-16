/* Program details (program-detail.html): ভর্তি হও → enrolment drawer, as on live
   app.shikho.com/student/academic-program/[id] minus its batch check popup.
   Payment is simulated (prototype). */
(() => {
  const drawer = document.querySelector('[data-enroll-drawer]');
  if (!drawer) return;
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let returnFocus = null;

  const show = (el, focus) => {
    el.hidden = false;
    document.documentElement.classList.add('sheet-open');
    if (!reduceMotion()) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
      const panel = el.querySelector('.pd-drawer-panel');
      if (panel) panel.animate([{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], { duration: 300, easing: 'cubic-bezier(.32,.72,0,1)' });
    }
    (focus || el.querySelector('button')).focus({ preventScroll: true });
  };
  const hide = (el, restore = true) => {
    el.hidden = true;
    document.documentElement.classList.remove('sheet-open');
    if (restore) returnFocus?.focus?.({ preventScroll: true });
  };

  // ভর্তি হও → drawer
  document.querySelector('[data-enroll-open]')?.addEventListener('click', (e) => {
    returnFocus = e.currentTarget;
    show(drawer, drawer.querySelector('[data-close]'));
  });
  // Close: back button, tap outside, Esc
  drawer.addEventListener('click', (e) => { if (e.target === drawer || e.target.closest('[data-close]')) hide(drawer); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden) hide(drawer);
  });

  // Promo code: button turns on when something is typed; codes aren't checked in the prototype
  const promo = drawer.querySelector('[data-promo]');
  const apply = drawer.querySelector('[data-promo-apply]');
  const msg = drawer.querySelector('[data-promo-msg]');
  promo.addEventListener('input', () => { apply.disabled = !promo.value.trim(); msg.hidden = true; });
  apply.addEventListener('click', () => {
    msg.textContent = 'এই প্রোমো কোডটি সঠিক নয়';
    msg.hidden = false;
  });

  // Both agreements must stay ticked to enrol
  const agrees = [...drawer.querySelectorAll('[data-agree]')];
  const pay = drawer.querySelector('[data-enroll-pay]');
  const sync = () => { pay.disabled = !agrees.every((c) => c.checked); };
  agrees.forEach((c) => c.addEventListener('change', sync));
  sync();

  // পেমেন্ট করো এখনই → simulated bKash payment → success
  pay.addEventListener('click', () => {
    pay.disabled = true;
    pay.textContent = 'পেমেন্ট হচ্ছে…';
    setTimeout(() => {
      hide(drawer, false);
      pay.textContent = 'পেমেন্ট করো এখনই';
      sync();
      const S = window.ShikhoSheet;
      if (S?.open && S.successView) {
        S.open('প্রোগ্রামে ভর্তি', S.successView('ভর্তি সম্পন্ন হয়েছে',
          `${S.esc(drawer.querySelector('#pd-drawer-title').textContent)} প্রোগ্রামে তোমার ভর্তি সম্পন্ন হয়েছে।`));
      }
    }, 900);
  });
})();
