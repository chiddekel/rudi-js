/* Rudi Design System — mascot + UI helpers. No build step, no dependencies.
   Usage: <div data-rudi data-mood="happy" style="--rudi-size:140px"></div>
          Rudi.toast("Saved"), Rudi.confetti(), Rudi.sheet(el, "success"|"danger"), Rudi.theme("dark") */
(function () {
  "use strict";

  var FUR = "#E8622C", FUR_DARK = "#C64A17", MARK = "#8F3210", INK = "#2E1C13", CREAM = "#FFFFFF", BLUSH = "#FF8FA3";

  var EYES = {
    happy: '<ellipse cx="72" cy="106" rx="9" ry="11" fill="' + INK + '"/><ellipse cx="128" cy="106" rx="9" ry="11" fill="' + INK + '"/>' +
           '<circle cx="75" cy="102" r="3.4" fill="#fff"/><circle cx="131" cy="102" r="3.4" fill="#fff"/>',
    joy:   '<path d="M62 108q10-13 20 0M118 108q10-13 20 0" fill="none" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>',
    wow:   '<circle cx="72" cy="105" r="12" fill="' + INK + '"/><circle cx="128" cy="105" r="12" fill="' + INK + '"/>' +
           '<circle cx="76" cy="100" r="4.5" fill="#fff"/><circle cx="132" cy="100" r="4.5" fill="#fff"/>',
    sad:   '<ellipse cx="72" cy="108" rx="8" ry="10" fill="' + INK + '"/><ellipse cx="128" cy="108" rx="8" ry="10" fill="' + INK + '"/>' +
           '<circle cx="74" cy="105" r="3" fill="#fff"/><circle cx="130" cy="105" r="3" fill="#fff"/>' +
           '<path d="M58 90l20 6M142 90l-20 6" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>',
    wink:  '<ellipse cx="72" cy="106" rx="9" ry="11" fill="' + INK + '"/><circle cx="75" cy="102" r="3.4" fill="#fff"/>' +
           '<path d="M118 108q10-11 20 0" fill="none" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>'
  };

  var MOUTH = {
    happy: '<path d="M88 143q12 11 24 0" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>',
    joy:   '<path d="M84 141q16 2 32 0q-2 20-16 20t-16-20z" fill="' + INK + '"/><path d="M92 153q8-6 16 0q-4 6-8 6t-8-6z" fill="#FF7A8A"/>',
    wow:   '<ellipse cx="100" cy="149" rx="8" ry="10" fill="' + INK + '"/>',
    sad:   '<path d="M88 152q12-10 24 0" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>',
    wink:  '<path d="M86 142q14 14 28 0" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><path d="M104 147q4 8 9 2" fill="#FF7A8A"/>'
  };

  /* Original red panda head. viewBox 0 0 200 190 */
  function mascot(mood, label) {
    mood = EYES[mood] ? mood : "happy";
    return '' +
      '<svg class="rudi" viewBox="0 0 200 190" role="img" aria-label="' + (label || "Rudi, czerwona panda") + '">' +
      // ears
      '<g><circle cx="42" cy="56" r="31" fill="' + CREAM + '"/><circle cx="42" cy="58" r="22" fill="' + FUR_DARK + '"/><circle cx="44" cy="62" r="13" fill="' + MARK + '"/>' +
      '<circle cx="158" cy="56" r="31" fill="' + CREAM + '"/><circle cx="158" cy="58" r="22" fill="' + FUR_DARK + '"/><circle cx="156" cy="62" r="13" fill="' + MARK + '"/></g>' +
      // head
      '<ellipse cx="100" cy="116" rx="82" ry="68" fill="' + FUR_DARK + '"/>' +
      '<ellipse cx="100" cy="111" rx="82" ry="66" fill="' + FUR + '"/>' +
      '<ellipse cx="100" cy="70" rx="40" ry="14" fill="#fff" opacity=".12"/>' +
      // white patches
      '<ellipse cx="68" cy="84" rx="12" ry="7" fill="' + CREAM + '"/><ellipse cx="132" cy="84" rx="12" ry="7" fill="' + CREAM + '"/>' +
      '<ellipse cx="42" cy="126" rx="23" ry="21" fill="' + CREAM + '"/><ellipse cx="158" cy="126" rx="23" ry="21" fill="' + CREAM + '"/>' +
      // tear marks
      '<path d="M72 118q-6 16 2 36M128 118q6 16-2 36" fill="none" stroke="' + MARK + '" stroke-width="11" stroke-linecap="round"/>' +
      // muzzle
      '<ellipse cx="100" cy="143" rx="36" ry="27" fill="' + CREAM + '"/>' +
      EYES[mood] +
      '<ellipse cx="48" cy="142" rx="10" ry="6" fill="' + BLUSH + '" opacity=".6"/><ellipse cx="152" cy="142" rx="10" ry="6" fill="' + BLUSH + '" opacity=".6"/>' +
      // nose
      '<path d="M90 126q10-6 20 0q-2 9-10 11q-8-2-10-11z" fill="' + INK + '"/>' +
      MOUTH[mood] +
      '</svg>';
  }

  function renderAll(root) {
    (root || document).querySelectorAll("[data-rudi]").forEach(function (el) {
      el.innerHTML = mascot(el.dataset.mood, el.dataset.label);
      if (el.hasAttribute("data-bouncy")) el.firstChild.classList.add("is-bouncy");
    });
  }

  function setMood(el, mood) { el.dataset.mood = mood; renderAll(el.parentNode); }

  /* ---------- Toast ---------- */
  function toast(msg, ms) {
    var stack = document.querySelector(".toast-stack");
    if (!stack) { stack = document.createElement("div"); stack.className = "toast-stack"; stack.setAttribute("aria-live", "polite"); document.body.appendChild(stack); }
    var t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    stack.appendChild(t);
    setTimeout(function () { t.classList.add("is-leaving"); setTimeout(function () { t.remove(); }, 300); }, ms || 2200);
  }

  /* ---------- Confetti ---------- */
  function confetti(n) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var colors = ["#E8622C", "#14B3A2", "#FFC12E", "#3AA6F0", "#E8457A", "#8D6BEE"];
    var box = document.createElement("div"); box.className = "confetti";
    for (var i = 0; i < (n || 70); i++) {
      var p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--dx", (Math.random() * 200 - 100) + "px");
      p.style.setProperty("--rot", (Math.random() * 900 - 450) + "deg");
      p.style.setProperty("--dur", (1 + Math.random() * 1.2) + "s");
      p.style.animationDelay = Math.random() * .3 + "s";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 2800);
  }

  /* ---------- Feedback sheet ---------- */
  function sheet(el, kind) {
    el.classList.remove("sheet--success", "sheet--danger", "is-open");
    if (!kind) return;
    el.classList.add("sheet--" + kind);
    requestAnimationFrame(function () { el.classList.add("is-open"); });
  }

  /* ---------- Theme ---------- */
  var KEY = "rudi-theme";
  function theme(mode) {
    var html = document.documentElement;
    if (mode === "light" || mode === "dark") html.dataset.theme = mode; else delete html.dataset.theme;
    try { mode ? localStorage.setItem(KEY, mode) : localStorage.removeItem(KEY); } catch (e) {}
  }
  try { var saved = localStorage.getItem(KEY); if (saved) document.documentElement.dataset.theme = saved; } catch (e) {}
  function isDark() {
    var t = document.documentElement.dataset.theme;
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }

  /* ---------- Choice groups (single select) ---------- */
  function bindChoices(root) {
    (root || document).querySelectorAll("[data-choices]").forEach(function (group) {
      group.addEventListener("click", function (e) {
        var btn = e.target.closest(".choice");
        if (!btn || btn.disabled) return;
        group.querySelectorAll(".choice").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        group.dispatchEvent(new CustomEvent("rudi:select", { detail: btn, bubbles: true }));
      });
    });
  }

  function progress(el, value) { el.style.setProperty("--value", Math.max(0, Math.min(100, value))); }

  /* ---------- Icons (inline, currentColor) ---------- */
  var ICONS = {
    flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3.5 5.5 6 5.5 11a5.5 5.5 0 0 1-11 0c0-2.2 1-3.8 2.2-5 .2 1.6 1 2.7 2.1 3.2C10.3 8.3 10.8 5 12 2z"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10l4 6-9 12L3 9z"/><path d="M3 9h18M12 21 8.5 9 12 3l3.5 6z" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-5.2-8-11.2A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.8C20 15.8 12 21 12 21z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm2 0h6V8a3 3 0 0 0-6 0z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    chest: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 10a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v1H3zM3 12h18v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><rect x="10" y="10" width="4" height="5" rx="1" fill="#fff" fill-opacity=".6"/></svg>',
    path: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 3 7v10l9 5 9-5V7zm0 3.2 5.8 3.2L12 11.6 6.2 8.4z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v2h3v2a5 5 0 0 1-4.3 5A5 5 0 0 1 13 15v3h3v3H8v-3h3v-3a5 5 0 0 1-2.7-3A5 5 0 0 1 4 7V5h3zm0 4H6a3 3 0 0 0 1 2.2zm10 0v2.2A3 3 0 0 0 18 7z"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4.5"/><path d="M3.5 21a8.5 8.5 0 0 1 17 0z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>'
  };
  function renderIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      if (ICONS[el.dataset.icon]) el.innerHTML = ICONS[el.dataset.icon];
    });
  }

  function init(root) { renderAll(root); renderIcons(root); bindChoices(root); }

  window.Rudi = { mascot: mascot, render: renderAll, setMood: setMood, toast: toast, confetti: confetti, sheet: sheet,
                  theme: theme, isDark: isDark, progress: progress, icons: ICONS, init: init };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); });
  else init();
})();
