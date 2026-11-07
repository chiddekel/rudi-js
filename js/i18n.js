/* Rudi.js i18n — locale detect, catalog load, t(), RTL, course materialize.
   String interpolation uses Mustache.js against JSON locale catalogs ({{var}}). */
(function (global) {
  "use strict";

  var SUPPORTED = [
    { code: "en", name: "English" },
    { code: "pl", name: "Polski" },
    { code: "de", name: "Deutsch" },
    { code: "fr", name: "Français" },
    { code: "es", name: "Español" },
    { code: "it", name: "Italiano" },
    { code: "pt-BR", name: "Português (Brasil)" },
    { code: "uk", name: "Українська" },
    { code: "ar", name: "العربية" },
    { code: "hi", name: "हिन्दी" },
    { code: "zh-CN", name: "中文（简体）" },
    { code: "zh-TW", name: "中文（繁體）" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "tr", name: "Türkçe" }
  ];

  var KEY = "rudijs-locale";
  var cache = Object.create(null);
  var pack = null;
  var code = "en";
  var listeners = [];

  function supportedCodes() { return SUPPORTED.map(function (l) { return l.code; }); }

  function normalize(tag) {
    if (!tag) return null;
    tag = String(tag).replace(/_/g, "-");
    var exact = SUPPORTED.filter(function (l) { return l.code.toLowerCase() === tag.toLowerCase(); })[0];
    if (exact) return exact.code;
    var base = tag.split("-")[0].toLowerCase();
    if (base === "zh") {
      var lower = tag.toLowerCase();
      if (/tw|hk|hant/.test(lower)) return "zh-TW";
      return "zh-CN";
    }
    if (base === "pt") return "pt-BR";
    var hit = SUPPORTED.filter(function (l) { return l.code.toLowerCase() === base || l.code.toLowerCase().indexOf(base + "-") === 0; })[0];
    return hit ? hit.code : null;
  }

  function detect() {
    try {
      var q = new URLSearchParams(location.search).get("lang");
      var fromQ = normalize(q);
      if (fromQ) return fromQ;
    } catch (e) {}
    try {
      var saved = normalize(localStorage.getItem(KEY));
      if (saved) return saved;
    } catch (e) {}
    var nav = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]);
    for (var i = 0; i < nav.length; i++) {
      var n = normalize(nav[i]);
      if (n) return n;
    }
    return "en";
  }

  function deepGet(obj, path) {
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function mustache() {
    if (global.Mustache) return global.Mustache;
    if (global.Rudi && global.Rudi.mustache) return global.Rudi.mustache;
    return null;
  }

  function format(str, vars) {
    if (str == null) return str;
    var template = String(str);
    if (!vars) return template;
    var M = mustache();
    if (M && typeof M.render === "function") {
      return M.render(template, vars);
    }
    // Fallback when Mustache is not loaded (keeps {{var}} and legacy {var}).
    return template.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, function (_, a, b) {
      var k = a || b;
      return vars[k] != null ? String(vars[k]) : (a ? "{{" + k + "}}" : "{" + k + "}");
    });
  }

  function render(template, view, partials, config) {
    var M = mustache();
    if (M && typeof M.render === "function") {
      return M.render(String(template), view || {}, partials, config);
    }
    return format(template, view || {});
  }

  function t(key, vars) {
    if (!pack) return key;
    var v = deepGet(pack.ui, key);
    if (v == null) v = deepGet(pack, key);
    if (v == null) return key;
    return format(v, vars);
  }

  function fetchJson(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch (e) { reject(e); }
        } else reject(new Error("locale HTTP " + xhr.status + " for " + url));
      };
      xhr.onerror = function () { reject(new Error("locale network error for " + url)); };
      xhr.send(null);
    });
  }

  function loadPack(locale) {
    if (cache[locale]) return Promise.resolve(cache[locale]);
    var base = document.currentScript && document.currentScript.src
      ? document.currentScript.src.replace(/\/js\/[^/]+$/, "/")
      : "";
    // Prefer relative to page (works for Pages, http.server, Android file:// assets)
    var url = "locales/" + locale + ".json";
    return fetchJson(url).then(function (data) {
      cache[locale] = data;
      return data;
    }, function (err) {
      if (locale === "en") throw err;
      return loadPack("en");
    });
  }

  function applyDocument() {
    if (!pack) return;
    var html = document.documentElement;
    html.lang = pack.meta && pack.meta.code || code;
    html.dir = (pack.meta && pack.meta.dir) || "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var attr = el.getAttribute("data-i18n-attr");
      var val = t(key);
      if (attr) el.setAttribute(attr, val);
      else if (el.hasAttribute("data-i18n-html")) el.innerHTML = val;
      else el.textContent = val;
    });
    var titleKey = document.body && document.body.getAttribute("data-i18n-title");
    if (titleKey) document.title = t(titleKey);
  }

  function materializeCourse(schema) {
    if (!pack || !pack.course || !schema) return schema;
    var C = pack.course;
    return schema.map(function (m) {
      var mt = (C.modules && C.modules[m.id]) || {};
      return {
        id: m.id,
        color: m.color,
        title: mt.title != null ? mt.title : m.title,
        subtitle: mt.subtitle != null ? mt.subtitle : m.subtitle,
        lessons: m.lessons.map(function (l) {
          var lt = (C.lessons && C.lessons[l.id]) || {};
          var exT = (C.exercises && C.exercises[l.id]) || [];
          return {
            id: l.id,
            icon: l.icon,
            title: lt.title != null ? lt.title : l.title,
            exercises: l.exercises.map(function (ex, i) {
              var et = exT[i] || {};
              var out = {
                kind: ex.kind,
                q: et.q != null ? et.q : ex.q,
                explain: et.explain != null ? et.explain : ex.explain,
                code: ex.code,
                answer: ex.answer
              };
              if (ex.kind === "choice") {
                out.options = et.options || ex.options;
              } else if (ex.kind === "order") {
                var tilesSrc = et.tiles || ex.tiles.map(function (x) { return typeof x === "string" ? x : x.t; });
                out.tiles = ex.tiles.map(function (tile, j) {
                  var text = tilesSrc[j];
                  return typeof tile === "string" ? text : { t: text, type: tile.type };
                });
                if (ex.extra) {
                  var extraSrc = et.extra || ex.extra.map(function (x) { return typeof x === "string" ? x : x.t; });
                  out.extra = ex.extra.map(function (tile, j) {
                    var text = extraSrc[j];
                    return typeof tile === "string" ? text : { t: text, type: tile.type };
                  });
                }
              }
              return out;
            })
          };
        })
      };
    });
  }

  function setLocale(next) {
    var n = normalize(next) || "en";
    return loadPack(n).then(function (data) {
      code = n;
      pack = data;
      try { localStorage.setItem(KEY, n); } catch (e) {}
      applyDocument();
      if (global.window && window.RUDI_COURSE_SCHEMA) {
        window.RUDI_COURSE = materializeCourse(window.RUDI_COURSE_SCHEMA);
      }
      listeners.forEach(function (fn) { try { fn(code, pack); } catch (e) {} });
      return pack;
    });
  }

  function boot(preferred) {
    return setLocale(preferred || detect());
  }

  function onChange(fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }

  global.RudiI18n = {
    SUPPORTED: SUPPORTED,
    supportedCodes: supportedCodes,
    detect: detect,
    normalize: normalize,
    boot: boot,
    setLocale: setLocale,
    t: t,
    format: format,
    render: render,
    code: function () { return code; },
    pack: function () { return pack; },
    materializeCourse: materializeCourse,
    applyDocument: applyDocument,
    onChange: onChange
  };
})(typeof window !== "undefined" ? window : globalThis);
