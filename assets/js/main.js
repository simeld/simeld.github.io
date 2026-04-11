/* Nav: scroll background + mobile toggle */
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const themeToggle = document.getElementById("themeToggle");
const themeToggleLabel = document.getElementById("themeToggleLabel");
const themeToggleIcon = document.getElementById("themeToggleIcon");

const themeQuery = window.matchMedia("(prefers-color-scheme: light)");

function getResolvedTheme() {
  const explicitTheme = document.documentElement.dataset.theme;
  if (explicitTheme === "light" || explicitTheme === "dark") {
    return explicitTheme;
  }

  return themeQuery.matches ? "light" : "dark";
}

function updateThemeToggle() {
  if (!themeToggle || !themeToggleLabel || !themeToggleIcon) return;

  const currentTheme = getResolvedTheme();
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  themeToggle.dataset.theme = currentTheme;
  themeToggle.setAttribute("aria-label", "Switch to " + nextTheme + " mode");
  themeToggle.setAttribute("title", "Switch to " + nextTheme + " mode");
  themeToggleLabel.textContent = nextTheme === "dark" ? "Dark" : "Light";
  themeToggleIcon.textContent = nextTheme === "dark" ? "☾" : "☀";
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = getResolvedTheme() === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;

    try {
      localStorage.setItem("theme", nextTheme);
    } catch (error) {
      void error;
    }

    updateThemeToggle();
  });

  updateThemeToggle();
}

themeQuery.addEventListener("change", () => {
  let savedTheme;

  try {
    savedTheme = localStorage.getItem("theme");
  } catch (error) {
    void error;
    savedTheme = null;
  }

  if (!savedTheme) {
    updateThemeToggle();
  }
});

window.addEventListener(
  "scroll",
  () => {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  },
  { passive: true },
);

navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));

navLinks
  .querySelectorAll("a")
  .forEach((a) =>
    a.addEventListener("click", () => navLinks.classList.remove("open")),
  );

/* Keep hero figure centerline one eyebrow-height above the eyebrow text. */
(function alignHeroFigureToEyebrow() {
  const hero = document.querySelector(".hero");
  const eyebrow = document.querySelector(".hero__eyebrow");
  if (!hero || !eyebrow) return;

  function syncFigureCenter() {
    const heroRect = hero.getBoundingClientRect();
    const eyebrowRect = eyebrow.getBoundingClientRect();
    const eyebrowFontSize =
      parseFloat(getComputedStyle(eyebrow).fontSize) || eyebrowRect.height;
    const centerY = eyebrowRect.top - heroRect.top - eyebrowFontSize;
    hero.style.setProperty("--hero-figure-center-y", centerY + "px");
  }

  let resizeTimer;
  function scheduleSync() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncFigureCenter, 80);
  }

  syncFigureCenter();
  window.addEventListener("load", syncFigureCenter);
  window.addEventListener("resize", scheduleSync);

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(scheduleSync);
    observer.observe(eyebrow);
  }
})();

/* ── Hero animation loop ───────────────────────────────
   simen eldevik → simeld → simple → simen eldevik (repeat)

   Proportional-font safe: JS measures every element's actual
   rendered width, then drives width transitions via inline styles.
   ──────────────────────────────────────────────────────── */
(function heroAnimation() {
  const root = document.getElementById("heroAnim");
  const elMe = document.getElementById("haMe");
  const elOcto = document.getElementById("haOcto");
  const elEuler = document.getElementById("haEuler");
  if (!root) return;

  /* Ignore formatting whitespace so animation spacing is controlled by spans only. */
  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.nodeValue.trim()) {
      node.remove();
    }
  });

  /* ── Gather + measure DOM ──────────────────────────── */
  const fadeEls = Array.from(root.querySelectorAll(".ha-fade"));
  const space = root.querySelector(".ha-space");

  /* Wrap [data-eld] letters in a group for joint rotation */
  const eldLetters = root.querySelectorAll("[data-eld]");
  let eldGroup;
  if (eldLetters.length) {
    eldGroup = document.createElement("span");
    eldGroup.className = "ha-eld-group";
    eldLetters[0].parentNode.insertBefore(eldGroup, eldLetters[0]);
    eldLetters.forEach((l) => eldGroup.appendChild(l));
  }

  function measureNaturalWidth(el, isCollapsed) {
    const prevTransition = el.style.transition;
    const prevWidth = el.style.width;

    el.style.transition = "none";
    el.style.width = "auto";

    const w = el.getBoundingClientRect().width;
    el.dataset.origW = w;
    el.style.width = isCollapsed ? "0px" : w + "px";

    void el.offsetWidth;
    el.style.transition = prevTransition;
    if (!prevWidth && !isCollapsed) {
      el.style.width = w + "px";
    }
  }

  function refreshMeasurements() {
    fadeEls.forEach((el) =>
      measureNaturalWidth(el, el.classList.contains("ha--shrink")),
    );
    if (space) {
      measureNaturalWidth(space, space.classList.contains("ha--shrink"));
    }

    if (eldGroup) {
      const eldW = eldGroup.getBoundingClientRect().width;
      root.style.setProperty("--ha-eld-w", eldW + "px");
    }

    const titleH = root.getBoundingClientRect().height;
    root.style.minHeight = titleH + "px";
  }

  refreshMeasurements();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refreshMeasurements, 120);
  });

  /* ── Timing (ms) ───────────────────────────────────── */
  const HOLD_NAME = 3000;
  const T_FADE = 2000;
  const HOLD_HANDLE = 3000;
  const T_ROTATE = 1800;
  const T_ROTATE_STEP = T_ROTATE / 2;
  const HOLD_SIMPLE = 3000;
  const T_RETURN = 1800;
  const PAUSE = 500;

  /* ── Helpers ───────────────────────────────────────── */
  function cls(el, add, rm) {
    if (!el) return;
    if (rm) el.classList.remove(rm);
    if (add) el.classList.add(add);
  }

  function shrink(el) {
    el.classList.remove("ha--grow");
    el.classList.add("ha--shrink");
    el.style.width = "0px";
    el.style.opacity = "0";
  }

  function grow(el) {
    el.classList.remove("ha--shrink");
    el.classList.add("ha--grow");
    el.style.width = el.dataset.origW + "px";
    el.style.opacity = "1";
  }

  /* ── Animation cycle ───────────────────────────────── */
  function cycle() {
    /* STATE A: "simen eldevik" + "me:" — already visible, just hold */
    setTimeout(() => {
      /* TRANSITION 1 → simeld:
         shrink faded letters + space, me: → octocat */
      fadeEls.forEach(shrink);
      shrink(space);
      cls(elMe, "ha--hide", "ha--show");
      cls(elOcto, "ha--show", "ha--hide");
      cls(elEuler, "ha--hide", "ha--show");

      setTimeout(() => {
        /* STATE B: "simeld" + octocat — hold */

        setTimeout(() => {
          /* TRANSITION 2 → simple:
             rotate eld -180° CCW + slide, octocat → Euler */
          cls(elOcto, "ha--hide", "ha--show");
          cls(elEuler, "ha--show", "ha--hide");

          if (eldGroup) {
            eldGroup.classList.remove("ha--rotated-back", "ha--reset");
            eldGroup.classList.add("ha--rotated-ccw");

            setTimeout(() => {
              eldGroup.classList.add("ha--translated-ccw");
            }, T_ROTATE_STEP);
          }

          setTimeout(() => {
            /* STATE C: "simple" + Euler — hold */

            setTimeout(() => {
              /* TRANSITION 3 → simen eldevik:
                 rotate eld another -180° back, restore letters, Euler → me: */
              if (eldGroup) {
                eldGroup.classList.remove(
                  "ha--rotated-ccw",
                  "ha--translated-ccw",
                );
                eldGroup.classList.add("ha--rotated-back");
              }
              fadeEls.forEach(grow);
              grow(space);
              cls(elEuler, "ha--hide", "ha--show");
              cls(elMe, "ha--show", "ha--hide");

              setTimeout(() => {
                /* Reset rotation to 0 instantly for next loop */
                if (eldGroup) {
                  eldGroup.classList.remove("ha--rotated-back");
                  eldGroup.classList.add("ha--reset");
                  void eldGroup.offsetWidth; // force reflow
                  eldGroup.classList.remove("ha--reset");
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
