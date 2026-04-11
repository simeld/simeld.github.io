/* Nav: scroll background + mobile toggle */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

/* ── Hero animation loop ───────────────────────────────
   simen eldevik → simeld → simple → simen eldevik (repeat)

   Proportional-font safe: JS measures every element's actual
   rendered width, then drives width transitions via inline styles.
   ──────────────────────────────────────────────────────── */
(function heroAnimation() {
  const root    = document.getElementById('heroAnim');
  const elMe    = document.getElementById('haMe');
  const elOcto  = document.getElementById('haOcto');
  const elEuler = document.getElementById('haEuler');
  if (!root) return;

  /* ── Gather + measure DOM ──────────────────────────── */
  const fadeEls = Array.from(root.querySelectorAll('.ha-fade'));
  const space   = root.querySelector('.ha-space');

  /* Measure natural widths of every fade letter and the space */
  fadeEls.forEach(el => {
    const w = el.getBoundingClientRect().width;
    el.dataset.origW = w;
    el.style.width = w + 'px';
  });
  if (space) {
    const sw = space.getBoundingClientRect().width;
    space.dataset.origW = sw;
    space.style.width = sw + 'px';
  }

  /* Wrap [data-eld] letters in a group for joint rotation */
  const eldLetters = root.querySelectorAll('[data-eld]');
  let eldGroup;
  if (eldLetters.length) {
    eldGroup = document.createElement('span');
    eldGroup.className = 'ha-eld-group';
    eldLetters[0].parentNode.insertBefore(eldGroup, eldLetters[0]);
    eldLetters.forEach(l => eldGroup.appendChild(l));
  }

  /* Measure eld group width and set the CSS variable for rotation offset */
  if (eldGroup) {
    const eldW = eldGroup.getBoundingClientRect().width;
    root.style.setProperty('--ha-eld-w', eldW + 'px');
  }

  /* Lock the hero title height so the box never jumps */
  const titleH = root.getBoundingClientRect().height;
  root.style.minHeight = titleH + 'px';

  /* ── Timing (ms) ───────────────────────────────────── */
  const HOLD_NAME   = 3000;
  const T_FADE      = 2000;
  const HOLD_HANDLE = 3000;
  const T_ROTATE    = 1800;
  const HOLD_SIMPLE = 3000;
  const T_RETURN    = 1800;
  const PAUSE       = 500;

  /* ── Helpers ───────────────────────────────────────── */
  function cls(el, add, rm) {
    if (!el) return;
    if (rm)  el.classList.remove(rm);
    if (add) el.classList.add(add);
  }

  function shrink(el) {
    el.classList.remove('ha--grow');
    el.classList.add('ha--shrink');
    el.style.width = '0px';
    el.style.opacity = '0';
  }

  function grow(el) {
    el.classList.remove('ha--shrink');
    el.classList.add('ha--grow');
    el.style.width = el.dataset.origW + 'px';
    el.style.opacity = '1';
  }

  /* ── Animation cycle ───────────────────────────────── */
  function cycle() {

    /* STATE A: "simen eldevik" + "me:" — already visible, just hold */
    setTimeout(() => {

      /* TRANSITION 1 → simeld:
         shrink faded letters + space, me: → octocat */
      fadeEls.forEach(shrink);
      shrink(space);
      cls(elMe,    'ha--hide', 'ha--show');
      cls(elOcto,  'ha--show', 'ha--hide');
      cls(elEuler, 'ha--hide', 'ha--show');

      setTimeout(() => {
        /* STATE B: "simeld" + octocat — hold */

        setTimeout(() => {
          /* TRANSITION 2 → simple:
             rotate eld -180° CCW + slide, octocat → Euler */
          cls(elOcto,  'ha--hide', 'ha--show');
          cls(elEuler, 'ha--show', 'ha--hide');

          if (eldGroup) {
            eldGroup.classList.remove('ha--rotate-back', 'ha--reset');
            eldGroup.classList.add('ha--rotate-ccw');
          }

          setTimeout(() => {
            /* STATE C: "simple" + Euler — hold */

            setTimeout(() => {
              /* TRANSITION 3 → simen eldevik:
                 rotate eld another -180° back, restore letters, Euler → me: */
              if (eldGroup) {
                eldGroup.classList.remove('ha--rotate-ccw');
                eldGroup.classList.add('ha--rotate-back');
              }
              fadeEls.forEach(grow);
              grow(space);
              cls(elEuler, 'ha--hide', 'ha--show');
              cls(elMe,    'ha--show', 'ha--hide');

              setTimeout(() => {
                /* Reset rotation to 0 instantly for next loop */
                if (eldGroup) {
                  eldGroup.classList.remove('ha--rotate-back');
                  eldGroup.classList.add('ha--reset');
                  void eldGroup.offsetWidth;   // force reflow
                  eldGroup.classList.remove('ha--reset');
                }

                setTimeout(cycle, PAUSE);
              }, T_RETURN);

            }, HOLD_SIMPLE);
          }, T_ROTATE);
        }, HOLD_HANDLE);
      }, T_FADE);
    }, HOLD_NAME);
  }

  cycle();
})();
