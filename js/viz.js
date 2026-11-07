/* Rudi.js shared visual helpers: syntax highlighting, token tiles, AST tree. Used by app.html and index.html. */
(function () {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var KW = /^(let|const|var|function|return|if|else|while|for|true|false|null|undefined|new|class|this)$/;
  /* Tolerant highlighter (never throws, keeps whitespace) */
  function highlight(src) {
    var re = /(\/\/[^\n]*)|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(===|!==|\*\*|==|!=|<=|>=|&&|\|\||\+=|-=|[+\-*/%<>=!])|([(){}\[\],;.])|(\s+|.)/g;
    var out = "", m;
    while ((m = re.exec(src))) {
      var t = esc(m[0]);
      if (m[1]) out += '<span class="tk-comment">' + t + "</span>";
      else if (m[2]) out += '<span class="tk-string">' + t + "</span>";
      else if (m[3]) out += '<span class="tk-number">' + t + "</span>";
      else if (m[4]) out += '<span class="' + (KW.test(m[4]) ? "tk-keyword" : "tk-identifier") + '">' + t + "</span>";
      else if (m[5]) out += '<span class="tk-operator">' + t + "</span>";
      else if (m[6]) out += '<span class="tk-punctuation">' + t + "</span>";
      else out += t;
    }
    return out;
  }
  function codeCard(code, file) {
    return '<div class="code"><div class="code__bar"><i></i><i></i><i></i>' + esc(file || "main.js") + '</div><pre>' + highlight(code) + "</pre></div>";
  }
  var TYPE_LABEL = { keyword: "KW", identifier: "ID", number: "NUM", string: "STR", operator: "OP", punctuation: "PUNCT" };
  function tileHTML(tile, idx, extraAttrs) {
    var t = typeof tile === "string" ? { t: tile, type: "plain" } : tile;
    return '<button type="button" class="ttile is-' + t.type + '" data-i="' + idx + '" ' + (extraAttrs || "") + ">" + esc(t.t) +
      (TYPE_LABEL[t.type] ? "<small>" + TYPE_LABEL[t.type] + "</small>" : "") + "</button>";
  }
  function tileText(t) { return typeof t === "string" ? t : t.t; }

  function nodeKind(t) {
    if (t === "Program") return "Program";
    if (t === "VariableDeclaration" || t === "FunctionDeclaration" || t === "VariableDeclarator") return "decl";
    if (/Statement$/.test(t)) return "stmt";
    if (t === "Literal" || t === "Identifier") return "leaf";
    if (t === "FunctionExpression") return "fn";
    return "expr";
  }
  function nodeSummary(n) {
    switch (n.type) {
      case "Literal": return n.raw;
      case "Identifier": return n.name;
      case "BinaryExpression": case "LogicalExpression": case "AssignmentExpression": case "UnaryExpression": return n.operator;
      case "VariableDeclaration": return n.kind;
      case "FunctionDeclaration": case "FunctionExpression": return (n.id ? n.id.name : "anonymous") + "(" + n.params.map(function (p) { return p.name; }).join(", ") + ")";
      case "Program": case "BlockStatement": return "body: " + n.body.length;
      case "CallExpression": return "args: " + n.arguments.length;
    }
    return "";
  }
  var CHILD_KEYS = ["declarations", "id", "init", "test", "consequent", "alternate", "body", "expression", "argument", "callee", "arguments", "object", "property", "left", "right"];
  function astHTML(n, key) {
    var s = nodeSummary(n), kids = [];
    CHILD_KEYS.forEach(function (k) {
      var v = n[k];
      if (!v) return;
      if ((n.type === "FunctionDeclaration" || n.type === "FunctionExpression") && k === "id") return;
      if (Array.isArray(v)) v.forEach(function (c, i) { kids.push(astHTML(c, k + "[" + i + "]")); });
      else if (typeof v === "object" && v.type) kids.push(astHTML(v, k));
    });
    return "<li>" + (key ? '<span class="anode__key">' + esc(key) + "</span>" : "") +
      '<span class="anode anode--' + nodeKind(n.type) + '">' + esc(n.type) + (s ? " <code>" + esc(s) + "</code>" : "") + "</span>" +
      (kids.length ? "<ul>" + kids.join("") + "</ul>" : "") + "</li>";
  }

  window.RudiViz = { esc: esc, highlight: highlight, codeCard: codeCard, tileHTML: tileHTML, tileText: tileText, astHTML: astHTML };
})();
