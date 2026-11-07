/* Rudi.js — app shell: hash router, progress state, path, lessons, playground, ranking, profile. */
(function () {
  "use strict";

  var COURSE = window.RUDI_COURSE, E = window.RudiEngine, R = window.Rudi;
  var root = document.getElementById("app");
  var main = document.getElementById("main");

  R.icons.code = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"/></svg>';
  R.icons.map = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/></svg>';
  R.icons.play = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>';
  R.icons.book = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13"/></svg>';
  R.icons.clock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  /* ================= State ================= */
  var KEY = "rudijs-state-v1";
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function yesterday() { var d = new Date(Date.now() - 864e5); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  var fresh = function () { return { xp: 0, gems: 50, hearts: 5, heartsDay: today(), streak: 0, lastDay: null, done: {}, chests: {} }; };
  var S = fresh();
  try { var raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) {}
  if (S.heartsDay !== today()) { S.hearts = 5; S.heartsDay = today(); }
  if (S.lastDay && S.lastDay !== today() && S.lastDay !== yesterday()) S.streak = 0;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  var LESSONS = [];
  COURSE.forEach(function (m, mi) { m.lessons.forEach(function (l, li) { LESSONS.push({ lesson: l, module: m, mi: mi, li: li }); }); });
  function lessonIndex(id) { for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].lesson.id === id) return i; return -1; }
  function isUnlocked(id) { var i = lessonIndex(id); return i === 0 || (i > 0 && !!S.done[LESSONS[i - 1].lesson.id]); }
  function currentId() { for (var i = 0; i < LESSONS.length; i++) if (!S.done[LESSONS[i].lesson.id]) return LESSONS[i].lesson.id; return null; }
  function moduleDone(m) { return m.lessons.every(function (l) { return S.done[l.id]; }); }

  /* ================= Utils ================= */
  var V = window.RudiViz, esc = V.esc, highlight = V.highlight, codeCard = V.codeCard, tileHTML = V.tileHTML, tileText = V.tileText;
  function icon(name) { return R.icons[name] || ""; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ================= Chrome ================= */
  function statsHTML() {
    return '<span class="stat stat--streak' + (S.streak ? "" : " is-muted") + '" title="Seria dni">' + icon("flame") + S.streak + "</span>" +
           '<span class="stat stat--gems" title="Klejnoty">' + icon("gem") + S.gems + "</span>" +
           '<span class="stat stat--hearts' + (S.hearts ? "" : " is-muted") + '" title="Serca">' + icon("heart") + S.hearts + "</span>";
  }
  function topbar(title) {
    return '<header class="topbar">' + (title ? '<span class="topbar__title">' + esc(title) + "</span>" :
      '<span class="topbar__brand"><span data-rudi data-mood="happy"></span>Rudi.js</span>') + statsHTML() + "</header>";
  }
  function setTab(name) {
    document.querySelectorAll(".tabbar__item").forEach(function (a) {
      if (a.dataset.tab === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }
  function focusMode(on) { root.classList.toggle("is-focus", !!on); }
  function mount(html, tab) {
    focusMode(!tab); setTab(tab);
    main.innerHTML = html;
    R.init(main);
    window.scrollTo(0, 0);
  }

  var modal = document.getElementById("modal");
  function openModal(html) {
    modal.innerHTML = html; R.init(modal);
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
  }
  function closeModal() { if (modal.open) modal.close(); }
  modal.addEventListener("click", function (e) { if (e.target === modal || e.target.closest("[data-close]")) closeModal(); });

  /* ================= Path ================= */
  var OFFSETS = [0, 52, 76, 52, 0, -52, -76, -52];
  function viewPath() {
    var cur = currentId(), html = topbar() + '<div class="view">', n = 0;
    COURSE.forEach(function (m, mi) {
      var unlocked = isUnlocked(m.lessons[0].id);
      html += '<section class="unit unit--' + m.color + (unlocked ? "" : " is-locked") + '">' +
        '<div class="unit__top"><span class="unit__eyebrow">Moduł ' + (mi + 1) + "</span>" +
        (unlocked ? '<button class="btn btn--sm" data-guide="' + mi + '">' + icon("book") + "Przewodnik</button>" : '<span style="width:26px;color:var(--ink-mute)">' + icon("lock") + "</span>") + "</div>" +
        "<h2>" + esc(m.title) + "</h2><p>" + esc(m.subtitle) + "</p></section>";
      html += '<div class="lpath">';
      m.lessons.forEach(function (l) {
        var done = S.done[l.id], isCur = l.id === cur, open = isUnlocked(l.id);
        var cls = done ? "is-done" : isCur ? "is-current" : open ? "" : "is-locked";
        var stars = done ? done.stars : 0, starsHTML = "";
        if (done) { for (var s = 0; s < 3; s++) starsHTML += '<span class="' + (s < stars ? "" : "is-off") + '">' + icon("star") + "</span>"; }
        html += '<div class="lnode' + (open ? "" : " is-locked") + '" style="transform:translateX(' + OFFSETS[n++ % OFFSETS.length] + 'px)">' +
          '<button class="path__node ' + cls + '" data-lesson="' + l.id + '" aria-label="' + esc(l.title) + (open ? "" : " (zablokowane)") + '">' +
          (isCur ? '<span class="path__label">Start</span>' : "") + icon(done ? "check" : open ? l.icon : "lock") + "</button>" +
          (done ? '<span class="lnode__stars">' + starsHTML + "</span>" : "") +
          '<span class="lnode__name">' + esc(l.title) + "</span>" +
          (isCur ? '<span class="lnode__buddy"><span data-rudi data-mood="wink" data-bouncy></span><span class="bubble">Dasz radę!</span></span>' : "") +
          "</div>";
      });
      var chestOpen = moduleDone(m), got = S.chests[m.id];
      html += '<div class="lnode' + (chestOpen ? "" : " is-locked") + '" style="transform:translateX(' + OFFSETS[n++ % OFFSETS.length] + 'px)">' +
        '<button class="path__node ' + (got ? "is-done" : chestOpen ? "" : "is-locked") + '" data-chest="' + m.id + '" aria-label="Skrzynia" style="' + (chestOpen && !got ? "--n-bg:var(--reward);--n-shade:var(--reward-shade)" : "") + '">' + icon("chest") + "</button>" +
        '<span class="lnode__name">' + (got ? "Otwarta" : "Skrzynia +20") + "</span></div>";
      html += "</div>";
    });
    html += '<div class="speaker" style="justify-content:center;padding:24px 0"><span data-rudi data-mood="joy" style="--rudi-size:80px"></span><div class="bubble">Na końcu: Twój własny silnik JS!</div></div></div>';
    mount(html, "path");

    main.querySelectorAll("[data-lesson]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!isUnlocked(b.dataset.lesson)) { R.toast("🔒 Najpierw ukończ poprzednie lekcje"); return; }
        if (S.hearts <= 0) { noHearts(); return; }
        location.hash = "#/lesson/" + b.dataset.lesson;
      });
    });
    main.querySelectorAll("[data-chest]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = COURSE.filter(function (x) { return x.id === b.dataset.chest; })[0];
        if (!moduleDone(m)) { R.toast("🔒 Ukończ moduł, żeby otworzyć skrzynię"); return; }
        if (S.chests[m.id]) { R.toast("Ta skrzynia jest już pusta"); return; }
        S.chests[m.id] = true; S.gems += 20; save(); R.confetti(); R.toast("💎 +20 klejnotów!"); viewPath();
      });
    });
    main.querySelectorAll("[data-guide]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = COURSE[+b.dataset.guide];
        openModal('<div data-rudi data-mood="happy" style="--rudi-size:100px"></div><h2>Moduł ' + (+b.dataset.guide + 1) + ": " + esc(m.title) + "</h2>" +
          '<p class="text-soft">' + esc(m.subtitle) + '</p><ul class="list" style="text-align:left;margin-bottom:16px">' +
          m.lessons.map(function (l) { return '<li class="list__item"><span class="list__main">' + esc(l.title) + '</span><span class="list__meta">' + (S.done[l.id] ? "★".repeat(S.done[l.id].stars) : l.exercises.length + " zad.") + "</span></li>"; }).join("") +
          '</ul><button class="btn btn--block" data-close>Jasne</button>');
      });
    });
    var curBtn = main.querySelector(".path__node.is-current");
    if (curBtn && curBtn.getBoundingClientRect().top > innerHeight * .8) curBtn.scrollIntoView({ block: "center" });
  }

  function noHearts() {
    openModal('<div data-rudi data-mood="sad" style="--rudi-size:120px"></div><h2>Brak serc</h2><p class="text-soft">Serca odnawiają się codziennie. Możesz też je uzupełnić.</p>' +
      '<div class="stack" style="--gap:10px">' +
      '<button class="btn btn--info btn--block" id="refill"' + (S.gems < 30 ? " disabled" : "") + ">" + icon("gem") + "Uzupełnij za 30</button>" +
      '<a class="btn btn--ghost btn--block" href="#/play" data-close>Poćwicz na placu zabaw</a></div>');
    var r = document.getElementById("refill");
    r && r.addEventListener("click", function () { S.gems -= 30; S.hearts = 5; save(); closeModal(); R.toast("❤️ Serca uzupełnione"); route(); });
  }

  /* ================= Lesson ================= */
  var lastResult = null, lessonKeys = null;
  function viewLesson(id) {
    if (lessonKeys) { document.removeEventListener("keydown", lessonKeys); lessonKeys = null; }
    var idx = lessonIndex(id);
    if (idx < 0) { location.hash = "#/"; return; }
    if (!isUnlocked(id)) { R.toast("🔒 Ta lekcja jest zablokowana"); location.hash = "#/"; return; }
    if (S.hearts <= 0) { location.hash = "#/"; setTimeout(noHearts, 50); return; }
    var L = LESSONS[idx].lesson, exs = L.exercises;
    var queue = exs.map(function (_, i) { return i; }), solved = {}, firstTry = 0, attempts = {}, started = Date.now();
    var state = null; // per-exercise answer state

    mount('<div class="lesson">' +
      '<div class="lesson__head"><button class="btn btn--flat btn--icon" id="quit" aria-label="Zakończ lekcję" style="--btn-fg:var(--ink-mute)">' + icon("close") + "</button>" +
      '<div class="progress" id="lp"><div class="progress__fill"></div></div>' +
      '<span class="stat stat--hearts">' + icon("heart") + '<span id="lh">' + S.hearts + "</span></span></div>" +
      '<div class="lesson__body" id="lb"></div>' +
      '<div class="lesson__foot"><div><button class="btn btn--block btn--lg" id="check" disabled>Sprawdź</button></div></div>' +
      '<div class="sheet" id="sheet" role="status" aria-live="polite"><div class="sheet__inner">' +
      '<div><div class="sheet__title"><span id="sIcon"></span><span id="sTitle"></span></div><p class="sheet__explain" id="sExplain"></p></div>' +
      '<button class="btn btn--lg" id="sBtn">Dalej</button></div></div></div>', null);

    var body = document.getElementById("lb"), check = document.getElementById("check"), sheet = document.getElementById("sheet");
    function setProgress() { R.progress(document.getElementById("lp"), Object.keys(solved).length / exs.length * 100); }
    setProgress();

    document.getElementById("quit").addEventListener("click", function () {
      openModal('<div data-rudi data-mood="sad" style="--rudi-size:110px"></div><h2>Na pewno?</h2><p class="text-soft">Postęp tej lekcji przepadnie.</p>' +
        '<div class="stack" style="--gap:10px"><button class="btn btn--block" data-close>Zostaję</button><button class="btn btn--ghost btn--block" id="reallyQuit">Wyjdź</button></div>');
      document.getElementById("reallyQuit").addEventListener("click", function () { closeModal(); location.hash = "#/"; });
    });

    function render() {
      var ex = exs[queue[0]]; state = { kind: ex.kind, value: null, placed: [] };
      var kindLabel = { choice: "Wybierz odpowiedź", order: "Ułóż w kolejności", input: "Wpisz wynik" }[ex.kind];
      var h = '<span class="lesson__kind">' + kindLabel + (attempts[queue[0]] ? " · powtórka" : "") + "</span>" +
        '<div class="speaker"><span data-rudi data-mood="happy" id="lr" style="--rudi-size:72px"></span><div class="bubble"><p class="lesson__q">' + esc(ex.q) + "</p></div></div>";
      if (ex.code) h += codeCard(ex.code, ex.kind === "input" && /PUSH/.test(ex.code) ? "bytecode.txt" : "engine_input.js");
      if (ex.kind === "choice") {
        h += '<div class="choices" data-choices>' + ex.options.map(function (o, i) {
          return '<button class="choice" aria-pressed="false" data-i="' + i + '"><span class="choice__key">' + (i + 1) + "</span>" + esc(o) + "</button>";
        }).join("") + "</div>";
      } else if (ex.kind === "order") {
        var all = ex.tiles.concat(ex.extra || []);
        state.bank = shuffle(all.map(function (t, i) { return i; }));
        state.all = all;
        h += '<div class="answer-row" id="ans" data-placeholder="Dotknij kafelków poniżej"></div><div class="bank" id="bank">' +
          state.bank.map(function (i) { return tileHTML(all[i], i); }).join("") + "</div>";
      } else {
        h += '<input class="big-input" id="inp" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="?" aria-label="Twoja odpowiedź">';
      }
      body.innerHTML = h; R.init(body);
      check.disabled = true;

      if (ex.kind === "choice") {
        body.querySelector("[data-choices]").addEventListener("rudi:select", function (e) { state.value = +e.detail.dataset.i; check.disabled = false; });
      } else if (ex.kind === "order") {
        var ans = document.getElementById("ans"), bank = document.getElementById("bank");
        bank.addEventListener("click", function (e) {
          var b = e.target.closest(".ttile"); if (!b || b.classList.contains("is-used") || sheet.classList.contains("is-open")) return;
          b.classList.add("is-used"); state.placed.push(+b.dataset.i);
          ans.insertAdjacentHTML("beforeend", tileHTML(state.all[+b.dataset.i], +b.dataset.i));
          check.disabled = false;
        });
        ans.addEventListener("click", function (e) {
          var b = e.target.closest(".ttile"); if (!b || sheet.classList.contains("is-open")) return;
          var i = +b.dataset.i; state.placed.splice(state.placed.indexOf(i), 1); b.remove();
          bank.querySelector('.ttile[data-i="' + i + '"]').classList.remove("is-used");
          check.disabled = state.placed.length === 0;
        });
      } else {
        var inp = document.getElementById("inp");
        inp.addEventListener("input", function () { state.value = inp.value; check.disabled = !inp.value.trim(); });
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !check.disabled) check.click(); });
        setTimeout(function () { inp.focus(); }, 50);
      }
    }

    function correctText(ex) {
      if (ex.kind === "choice") return ex.options[ex.answer];
      if (ex.kind === "order") return ex.tiles.map(tileText).join(" → ");
      return [].concat(ex.answer)[0];
    }

    check.addEventListener("click", function () {
      var qi = queue[0], ex = exs[qi], ok;
      if (ex.kind === "choice") ok = state.value === ex.answer;
      else if (ex.kind === "order") ok = state.placed.map(function (i) { return tileText(state.all[i]); }).join("\u0000") === ex.tiles.map(tileText).join("\u0000");
      else ok = [].concat(ex.answer).some(function (a) { return String(a).replace(/\s+/g, "").toLowerCase() === String(state.value).replace(/\s+/g, "").toLowerCase(); });

      if (ex.kind === "choice") {
        body.querySelectorAll(".choice").forEach(function (b) {
          b.disabled = true;
          if (+b.dataset.i === ex.answer) b.classList.add("is-correct");
          else if (+b.dataset.i === state.value) b.classList.add("is-wrong");
        });
      }
      if (ex.kind === "input") document.getElementById("inp").disabled = true;

      if (ok) { if (!attempts[qi]) firstTry++; solved[qi] = true; queue.shift(); setProgress(); }
      else { attempts[qi] = (attempts[qi] || 0) + 1; S.hearts = Math.max(0, S.hearts - 1); save(); document.getElementById("lh").textContent = S.hearts; queue.push(queue.shift()); }
      attempts[qi] = attempts[qi] || 0;

      R.setMood(document.getElementById("lr"), ok ? "joy" : "sad");
      document.getElementById("sIcon").innerHTML = icon(ok ? "check" : "close");
      document.getElementById("sTitle").textContent = ok ? ["Świetnie!", "Dokładnie!", "Brawo!", "Tak jest!"][Math.floor(Math.random() * 4)] : "Poprawnie: " + correctText(ex);
      document.getElementById("sExplain").textContent = ex.explain || "";
      document.getElementById("sBtn").textContent = ok ? "Dalej" : "Rozumiem";
      check.disabled = true;
      R.sheet(sheet, ok ? "success" : "danger");
      setTimeout(function () { document.getElementById("sBtn").focus(); }, 60);
    });

    document.getElementById("sBtn").addEventListener("click", function () {
      R.sheet(sheet, null);
      if (S.hearts <= 0) { location.hash = "#/"; setTimeout(noHearts, 50); return; }
      if (!queue.length) { finish(); return; }
      render();
    });

    function finish() {
      var acc = Math.round(firstTry / exs.length * 100);
      var stars = acc === 100 ? 3 : acc >= 75 ? 2 : 1;
      var xp = 10 + (acc === 100 ? 5 : 0);
      var prev = S.done[L.id];
      S.done[L.id] = { stars: Math.max(stars, prev ? prev.stars : 0) };
      S.xp += xp; S.gems += 5;
      if (S.lastDay !== today()) { S.streak = S.lastDay === yesterday() ? S.streak + 1 : 1; S.lastDay = today(); }
      save();
      lastResult = { id: L.id, title: L.title, xp: xp, acc: acc, stars: stars, secs: Math.round((Date.now() - started) / 1000) };
      location.hash = "#/done";
    }

    // keyboard shortcuts 1-4 for choices
    function onKey(e) {
      if (!body.isConnected) { document.removeEventListener("keydown", onKey); lessonKeys = null; return; }
      var n = +e.key;
      if (state && state.kind === "choice" && n >= 1 && n <= 4 && !sheet.classList.contains("is-open")) { var b = body.querySelectorAll(".choice")[n - 1]; b && !b.disabled && b.click(); }
      if (e.key === "Enter" && sheet.classList.contains("is-open") && document.activeElement !== document.getElementById("sBtn")) document.getElementById("sBtn").click();
    }
    lessonKeys = onKey;
    document.addEventListener("keydown", onKey);
    render();
  }

  /* ================= Done ================= */
  function viewDone() {
    var r = lastResult;
    if (!r) { location.hash = "#/"; return; }
    var mm = Math.floor(r.secs / 60), ss = ("0" + (r.secs % 60)).slice(-2), starsHTML = "";
    for (var s = 0; s < 3; s++) starsHTML += '<span style="color:' + (s < r.stars ? "var(--reward)" : "var(--line-strong)") + ';width:40px">' + icon("star") + "</span>";
    mount('<div class="done"><div data-rudi data-mood="joy" data-bouncy></div><h1>Lekcja ukończona!</h1><p class="text-soft" style="margin:0">' + esc(r.title) + "</p>" +
      '<div class="row" style="justify-content:center;--gap:4px">' + starsHTML + "</div>" +
      '<div class="done__stats">' +
      '<div class="dstat dstat--xp"><div class="dstat__h">XP</div><div class="dstat__v">' + icon("bolt") + r.xp + "</div></div>" +
      '<div class="dstat dstat--time"><div class="dstat__h">Czas</div><div class="dstat__v">' + icon("clock") + mm + ":" + ss + "</div></div>" +
      '<div class="dstat dstat--acc"><div class="dstat__h">Trafność</div><div class="dstat__v">' + icon("target") + r.acc + "%</div></div></div>" +
      '<div class="done__actions"><a class="btn btn--block btn--lg" href="#/">Dalej</a><a class="btn btn--ghost btn--block" href="#/lesson/' + r.id + '">Powtórz</a></div></div>', null);
    R.confetti();
  }

  /* ================= Playground ================= */
  var EXAMPLES = [
    { name: "Dodawanie", code: "const a = 40 + 2;\nconsole.log(a);" },
    { name: "Precedencja", code: "console.log(2 + 3 * 4);\nconsole.log(2 ** 3 ** 2);\nconsole.log((10 - 4) - 3);" },
    { name: "Domknięcie", code: "function makeCounter() {\n  let n = 0;\n  return function () {\n    n += 1;\n    return n;\n  };\n}\n\nconst c = makeCounter();\nc();\nc();\nconsole.log(\"licznik:\", c());" },
    { name: "Fibonacci", code: "function fib(n) {\n  if (n < 2) return n;\n  return fib(n - 1) + fib(n - 2);\n}\n\nlet i = 0;\nwhile (i < 10) {\n  console.log(i, fib(i));\n  i += 1;\n}" },
    { name: "Błąd", code: "const k = 1;\nk = 2; // TypeError w czasie wykonania" }
  ];
  var playSrc = null, playTab = "tokens";
  try { playSrc = localStorage.getItem("rudijs-play"); } catch (e) {}
  if (!playSrc) playSrc = EXAMPLES[0].code;

  var astHTML = V.astHTML;

  function viewPlay() {
    mount(topbar("Plac zabaw") + '<div class="view stack" style="padding-top:16px">' +
      '<div class="speaker"><span data-rudi data-mood="wink" style="--rudi-size:64px"></span><div class="bubble">Wpisz kod i zobacz, jak silnik Rudi.js go przetwarza!</div></div>' +
      '<div class="chips">' + EXAMPLES.map(function (x, i) { return '<button class="btn btn--ghost btn--sm" data-ex="' + i + '">' + esc(x.name) + "</button>"; }).join("") + "</div>" +
      '<div class="code"><div class="code__bar"><i></i><i></i><i></i>main.js<span class="code__tag">RudiScript</span></div>' +
      '<div class="editor"><pre id="hl" aria-hidden="true"></pre><textarea id="src" wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Kod źródłowy"></textarea></div></div>' +
      '<div class="seg" role="tablist"><button role="tab" data-t="tokens">Tokeny</button><button role="tab" data-t="ast">Drzewo AST</button><button role="tab" data-t="bytecode">Bytecode</button></div>' +
      '<div class="card panel" id="panel"></div>' +
      '<button class="btn btn--block btn--lg" id="run">' + icon("play") + "Uruchom silnik</button>" +
      '<div class="console" id="out"><div class="console__head"><span>Konsola (stdout)</span><span class="console__status">gotowe</span></div><div class="console__line is-dim">Naciśnij „Uruchom silnik”</div></div>' +
      "</div>", "play");

    var ta = document.getElementById("src"), hl = document.getElementById("hl"), panel = document.getElementById("panel");
    ta.value = playSrc;
    function sync() { hl.innerHTML = highlight(ta.value) + "\n"; hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; }
    function analyze() {
      var src = ta.value, tokens, ast, bc, err = null;
      try { tokens = E.tokenize(src); ast = E.parse(tokens); bc = E.compile(ast); } catch (e) { err = e; }
      main.querySelectorAll(".seg button").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.t === playTab)); });
      var h = "";
      if (playTab === "tokens") {
        h = tokens ? '<div class="tokens-list">' + tokens.filter(function (t) { return t.type !== "eof"; }).map(function (t, i) {
          return tileHTML({ t: t.type === "string" ? t.raw : t.value, type: t.type }, i, "tabindex=\"-1\"");
        }).join("") + '</div><p class="text-mute" style="margin:12px 0 0;font-size:.8125rem">' + (tokens.length - 1) + " tokenów + EOF</p>" : "";
      } else if (playTab === "ast") {
        h = ast ? '<div class="ast"><ul>' + astHTML(ast) + "</ul></div>" : "";
      } else {
        h = bc ? '<div class="bytecode">' + bc.map(function (c) {
          return "<div><h4>" + esc(c.name) + "</h4><ol>" + c.code.map(function (ins) {
            return "<li><div><b>" + esc(ins.op) + "</b>" + (ins.arg !== undefined ? " <span>" + esc(ins.arg) + "</span>" : "") + "</div></li>";
          }).join("") + "</ol></div>";
        }).join("") + "</div>" : "";
      }
      if (err) h += '<div class="console" style="margin-top:' + (h ? "12px" : "0") + '"><div class="console__line is-error">' + esc((err.stage === "lexer" ? "Lekser" : "Parser") + ": " + err.message + (err.pos ? " (linia " + err.pos.line + ", kol. " + err.pos.col + ")" : "")) + "</div></div>";
      panel.innerHTML = h;
    }
    var t;
    ta.addEventListener("input", function () {
      sync(); playSrc = ta.value;
      try { localStorage.setItem("rudijs-play", playSrc); } catch (e) {}
      clearTimeout(t); t = setTimeout(analyze, 150);
    });
    ta.addEventListener("scroll", function () { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; });
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Tab" && !e.shiftKey && !e.altKey) { e.preventDefault(); document.execCommand ? document.execCommand("insertText", false, "  ") : null; }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); document.getElementById("run").click(); }
    });
    main.querySelectorAll("[data-ex]").forEach(function (b) {
      b.addEventListener("click", function () { ta.value = playSrc = EXAMPLES[+b.dataset.ex].code; sync(); analyze(); try { localStorage.setItem("rudijs-play", playSrc); } catch (e) {} });
    });
    main.querySelectorAll(".seg button").forEach(function (b) { b.addEventListener("click", function () { playTab = b.dataset.t; analyze(); }); });
    document.getElementById("run").addEventListener("click", function () {
      var t0 = performance.now(), res = E.evaluate(ta.value), ms = (performance.now() - t0).toFixed(1);
      var out = document.getElementById("out"), lines = "";
      if (res.run) lines = res.run.output.map(function (l) { return '<div class="console__line">' + esc(l) + "</div>"; }).join("") ||
        '<div class="console__line is-dim">(brak wyjścia) wynik: ' + esc(E.show(res.run.result)) + "</div>";
      if (res.error) lines += '<div class="console__line is-error">' + esc(res.error.message) + "</div>";
      out.innerHTML = '<div class="console__head"><span>Konsola (stdout)</span><span class="console__status' + (res.error ? " is-error" : "") + '">' +
        (res.error ? "błąd: " + res.error.stage : "gotowe · " + ms + " ms · " + res.run.steps + " kroków") + "</span></div>" + lines;
    });
    sync(); analyze();
  }

  /* ================= Ranking ================= */
  var RIVALS = [
    { n: "Marta K.", xp: 340, c: "var(--c-berry-500)" }, { n: "Tomek J.", xp: 210, c: "var(--c-sky-500)" },
    { n: "Ania N.", xp: 150, c: "var(--c-plum-500)" }, { n: "Bartek W.", xp: 95, c: "var(--c-teal-500)" },
    { n: "Ola P.", xp: 60, c: "var(--c-sun-600)" }, { n: "Kuba L.", xp: 25, c: "var(--c-bark-600)" }
  ];
  function viewRank() {
    var list = RIVALS.concat([{ n: "Ty", xp: S.xp, c: "var(--primary)", me: true }]).sort(function (a, b) { return b.xp - a.xp; });
    mount(topbar("Ranking") + '<div class="view stack" style="padding-top:20px">' +
      '<div class="card card--tint center"><div class="medal medal--fox" style="margin:0 auto 10px">' + '<span style="width:36px">' + icon("trophy") + "</span></div>" +
      '<h2 style="margin:0">Liga Bytecode</h2><p class="text-soft" style="margin:4px 0 0">Top 3 awansują do Ligi JIT</p></div>' +
      '<div class="card"><ul class="list">' + list.map(function (p, i) {
        return '<li class="list__item' + (p.me ? " is-me" : "") + '"><span class="list__rank"' + (i < 3 ? ' style="color:var(--reward-shade)"' : "") + ">" + (i + 1) + "</span>" +
          '<span class="avatar" style="--avatar-c:' + p.c + '">' + (p.me ? '<span data-rudi data-mood="happy" style="--rudi-size:34px"></span>' : esc(p.n.slice(0, 1) + p.n.split(" ")[1].slice(0, 1))) + "</span>" +
          '<span class="list__main">' + esc(p.n) + '</span><span class="list__meta">' + p.xp + " XP</span></li>";
      }).join("") + "</ul></div></div>", "rank");
  }

  /* ================= Profile ================= */
  function viewProfile() {
    var doneCount = Object.keys(S.done).length;
    var medalColor = { fox: "fox", sky: "sky", teal: "teal", plum: "plum", berry: "berry", sun: "sun" };
    mount(topbar("Profil") + '<div class="view stack">' +
      '<div class="profile-head"><span data-rudi data-mood="wink"></span><div><h1 style="margin:0">Konstruktor silników</h1><p class="text-soft" style="margin:0">Kurs: jak zbudować silnik JavaScript</p></div></div>' +
      '<div class="card kpis">' +
      '<div class="kpi" style="color:var(--c-fox-500)">' + icon("flame") + '<div><b style="color:var(--ink)">' + S.streak + "</b><span>dni serii</span></div></div>" +
      '<div class="kpi" style="color:var(--c-sun-600)">' + icon("bolt") + '<div><b style="color:var(--ink)">' + S.xp + "</b><span>XP łącznie</span></div></div>" +
      '<div class="kpi" style="color:var(--c-sky-500)">' + icon("gem") + '<div><b style="color:var(--ink)">' + S.gems + "</b><span>klejnoty</span></div></div>" +
      '<div class="kpi" style="color:var(--c-teal-500)">' + icon("check") + '<div><b style="color:var(--ink)">' + doneCount + "/" + LESSONS.length + "</b><span>lekcji</span></div></div></div>" +
      '<h2 style="margin:12px 0 0">Odznaki</h2><div class="card"><div class="medals">' + COURSE.map(function (m) {
        var ok = moduleDone(m);
        return '<figure><div class="medal medal--' + medalColor[m.color] + (ok ? "" : " is-locked") + '"><span style="width:34px">' + icon(ok ? "star" : "lock") + "</span></div>" + esc(m.title) + "</figure>";
      }).join("") + "</div></div>" +
      '<h2 style="margin:12px 0 0">Ustawienia</h2><div class="card stack" style="--gap:14px">' +
      '<label class="switch"><input type="checkbox" id="dark"' + (R.isDark() ? " checked" : "") + '><span class="switch__track"></span>Tryb ciemny</label>' +
      '<a class="btn btn--ghost btn--block" href="design-system.html">Design system</a>' +
      '<button class="btn btn--danger btn--block" id="reset">Resetuj postęp</button></div></div>', "profile");
    document.getElementById("dark").addEventListener("change", function () { R.theme(this.checked ? "dark" : "light"); });
    document.getElementById("reset").addEventListener("click", function () {
      openModal('<div data-rudi data-mood="wow" style="--rudi-size:110px"></div><h2>Zresetować postęp?</h2><p class="text-soft">Stracisz XP, serię i ukończone lekcje.</p>' +
        '<div class="stack" style="--gap:10px"><button class="btn btn--danger btn--block" id="doReset">Tak, resetuj</button><button class="btn btn--ghost btn--block" data-close>Anuluj</button></div>');
      document.getElementById("doReset").addEventListener("click", function () { S = fresh(); save(); closeModal(); R.toast("Postęp wyczyszczony"); viewProfile(); });
    });
  }

  /* ================= Router ================= */
  function route() {
    closeModal();
    var h = location.hash.replace(/^#\/?/, "").split("/");
    switch (h[0]) {
      case "lesson": return viewLesson(h[1]);
      case "done": return viewDone();
      case "play": return viewPlay();
      case "rank": return viewRank();
      case "profile": return viewProfile();
      default: return viewPath();
    }
  }
  window.addEventListener("hashchange", route);
  route();
})();
