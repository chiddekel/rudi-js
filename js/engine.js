/* RudiScript — a tiny teaching JavaScript engine.
   Pipeline: source → tokenize() → parse() (Pratt) → AST → run() (tree-walking) | compile() (stack bytecode, display only).
   Supported subset: let/const/var, numbers, strings, booleans, null, undefined, + - * / % ** comparisons,
   && || !, assignment (= += -=), if/else, while, function declarations & expressions, closures, return,
   console.log, .length on strings. */
(function () {
  "use strict";

  var KEYWORDS = ["let", "const", "var", "function", "return", "if", "else", "while", "true", "false", "null", "undefined"];
  var OPS = ["===", "!==", "**", "==", "!=", "<=", ">=", "&&", "||", "+=", "-=", "+", "-", "*", "/", "%", "<", ">", "=", "!", "."];
  var PUNCT = "(){},;";

  function EngineError(stage, msg, pos) {
    var e = new Error(msg); e.stage = stage; e.pos = pos; return e;
  }

  /* ---------------- Lexer ---------------- */
  function tokenize(src) {
    var tokens = [], i = 0, line = 1, col = 1;
    function adv(n) { for (var k = 0; k < n; k++) { if (src[i] === "\n") { line++; col = 1; } else col++; i++; } }
    while (i < src.length) {
      var c = src[i];
      if (/\s/.test(c)) { adv(1); continue; }
      if (c === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") adv(1); continue; }
      var start = { line: line, col: col };
      if (/[0-9]/.test(c)) {
        var m = /^[0-9]+(\.[0-9]+)?/.exec(src.slice(i))[0];
        tokens.push({ type: "number", value: m, pos: start }); adv(m.length); continue;
      }
      if (/[A-Za-z_$]/.test(c)) {
        var w = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(src.slice(i))[0];
        tokens.push({ type: KEYWORDS.indexOf(w) >= 0 ? "keyword" : "identifier", value: w, pos: start }); adv(w.length); continue;
      }
      if (c === '"' || c === "'") {
        var j = i + 1, s = "";
        while (j < src.length && src[j] !== c) { if (src[j] === "\\" && j + 1 < src.length) { j++; s += src[j] === "n" ? "\n" : src[j]; } else s += src[j]; j++; }
        if (j >= src.length) throw EngineError("lexer", "Niezamknięty string", start);
        tokens.push({ type: "string", value: s, raw: src.slice(i, j + 1), pos: start }); adv(j + 1 - i); continue;
      }
      var op = null;
      for (var k = 0; k < OPS.length; k++) if (src.substr(i, OPS[k].length) === OPS[k]) { op = OPS[k]; break; }
      if (op) { tokens.push({ type: op === "." ? "punctuation" : "operator", value: op, pos: start }); adv(op.length); continue; }
      if (PUNCT.indexOf(c) >= 0) { tokens.push({ type: "punctuation", value: c, pos: start }); adv(1); continue; }
      throw EngineError("lexer", "Nieznany znak '" + c + "'", start);
    }
    tokens.push({ type: "eof", value: "", pos: { line: line, col: col } });
    return tokens;
  }

  /* ---------------- Parser (recursive descent + Pratt for expressions) ---------------- */
  var BP = { "||": 1, "&&": 2, "==": 3, "!=": 3, "===": 3, "!==": 3, "<": 4, ">": 4, "<=": 4, ">=": 4, "+": 5, "-": 5, "*": 6, "/": 6, "%": 6, "**": 7 };

  function parse(tokens) {
    var p = 0;
    function peek() { return tokens[p]; }
    function next() { return tokens[p++]; }
    function is(v, type) { var t = peek(); return t.value === v && (!type || t.type === type) && t.type !== "string"; }
    function eat(v) {
      var t = peek();
      if (t.value !== v || t.type === "string") throw EngineError("parser", "Oczekiwano '" + v + "', a jest '" + (t.value || "koniec") + "'", t.pos);
      return next();
    }
    function semi() { if (is(";")) next(); }

    function program() {
      var body = [];
      while (peek().type !== "eof") body.push(statement());
      return { type: "Program", body: body };
    }
    function block() {
      eat("{"); var body = [];
      while (!is("}")) { if (peek().type === "eof") throw EngineError("parser", "Brak '}'", peek().pos); body.push(statement()); }
      eat("}"); return { type: "BlockStatement", body: body };
    }
    function statement() {
      var t = peek();
      if (t.type === "keyword") {
        if (t.value === "let" || t.value === "const" || t.value === "var") {
          next(); var decls = [];
          do {
            var id = next(); if (id.type !== "identifier") throw EngineError("parser", "Oczekiwano nazwy zmiennej", id.pos);
            var init = null; if (is("=")) { next(); init = expression(0); }
            if (!init && t.value === "const") throw EngineError("parser", "const wymaga wartości", id.pos);
            decls.push({ type: "VariableDeclarator", id: { type: "Identifier", name: id.value }, init: init });
          } while (is(",") && next());
          semi(); return { type: "VariableDeclaration", kind: t.value, declarations: decls };
        }
        if (t.value === "function") { next(); var f = fnRest(true); f.type = "FunctionDeclaration"; return f; }
        if (t.value === "return") { next(); var arg = (is(";") || is("}")) ? null : expression(0); semi(); return { type: "ReturnStatement", argument: arg }; }
        if (t.value === "if") {
          next(); eat("("); var test = expression(0); eat(")");
          var cons = statement(), alt = null;
          if (is("else")) { next(); alt = statement(); }
          return { type: "IfStatement", test: test, consequent: cons, alternate: alt };
        }
        if (t.value === "while") { next(); eat("("); var wt = expression(0); eat(")"); return { type: "WhileStatement", test: wt, body: statement() }; }
      }
      if (is("{")) return block();
      var e = expression(0); semi();
      return { type: "ExpressionStatement", expression: e };
    }
    function fnRest(needName) {
      var id = null;
      if (peek().type === "identifier") id = { type: "Identifier", name: next().value };
      else if (needName) throw EngineError("parser", "Funkcja potrzebuje nazwy", peek().pos);
      eat("("); var params = [];
      while (!is(")")) { var pt = next(); if (pt.type !== "identifier") throw EngineError("parser", "Oczekiwano parametru", pt.pos); params.push({ type: "Identifier", name: pt.value }); if (!is(")")) eat(","); }
      eat(")");
      return { type: "FunctionExpression", id: id, params: params, body: block() };
    }
    function prefix() {
      var t = next();
      if (t.type === "number") return { type: "Literal", value: Number(t.value), raw: t.value };
      if (t.type === "string") return { type: "Literal", value: t.value, raw: t.raw };
      if (t.type === "identifier") return { type: "Identifier", name: t.value };
      if (t.type === "keyword") {
        if (t.value === "true" || t.value === "false") return { type: "Literal", value: t.value === "true", raw: t.value };
        if (t.value === "null") return { type: "Literal", value: null, raw: "null" };
        if (t.value === "undefined") return { type: "Identifier", name: "undefined" };
        if (t.value === "function") return fnRest(false);
      }
      if (t.value === "(" && t.type === "punctuation") { var e = expression(0); eat(")"); return e; }
      if (t.type === "operator" && (t.value === "-" || t.value === "!" || t.value === "+")) return { type: "UnaryExpression", operator: t.value, argument: expression(8) };
      throw EngineError("parser", "Nieoczekiwany token '" + (t.value || "koniec") + "'", t.pos);
    }
    function expression(minBp) {
      var left = prefix();
      for (;;) {
        var t = peek();
        if (t.type === "string" || t.type === "eof") break;
        if (t.value === "(" ) { next(); var args = []; while (!is(")")) { args.push(expression(0)); if (!is(")")) eat(","); } eat(")"); left = { type: "CallExpression", callee: left, arguments: args }; continue; }
        if (t.value === ".") { next(); var prop = next(); if (prop.type !== "identifier") throw EngineError("parser", "Oczekiwano nazwy właściwości", prop.pos); left = { type: "MemberExpression", object: left, property: { type: "Identifier", name: prop.value } }; continue; }
        if (t.type === "operator" && (t.value === "=" || t.value === "+=" || t.value === "-=")) {
          if (minBp > 0) break;
          if (left.type !== "Identifier") throw EngineError("parser", "Nie można przypisać do tego wyrażenia", t.pos);
          next(); left = { type: "AssignmentExpression", operator: t.value, left: left, right: expression(0) }; continue;
        }
        var bp = BP[t.value];
        if (t.type !== "operator" || !bp || bp <= minBp) break;
        next();
        var right = expression(t.value === "**" ? bp - 1 : bp); // ** is right-associative
        left = { type: (t.value === "&&" || t.value === "||") ? "LogicalExpression" : "BinaryExpression", operator: t.value, left: left, right: right };
      }
      return left;
    }
    return program();
  }

  /* ---------------- Interpreter (tree-walking, lexical environments) ---------------- */
  function Env(parent) { this.vars = Object.create(null); this.consts = Object.create(null); this.parent = parent; }
  Env.prototype.lookup = function (name) { for (var e = this; e; e = e.parent) if (name in e.vars) return e; return null; };
  Env.prototype.get = function (name) { var e = this.lookup(name); if (!e) throw EngineError("runtime", "ReferenceError: " + name + " is not defined"); return e.vars[name]; };
  Env.prototype.set = function (name, v) {
    var e = this.lookup(name); if (!e) throw EngineError("runtime", "ReferenceError: " + name + " is not defined");
    if (e.consts[name]) throw EngineError("runtime", "TypeError: Assignment to constant variable '" + name + "'");
    e.vars[name] = v;
  };
  Env.prototype.declare = function (name, v, isConst) {
    if (name in this.vars && !this.isVar) throw EngineError("runtime", "SyntaxError: '" + name + "' has already been declared");
    this.vars[name] = v; if (isConst) this.consts[name] = true;
  };

  function Closure(node, env) { this.node = node; this.env = env; this.name = node.id ? node.id.name : "anonymous"; }
  function ReturnSignal(v) { this.value = v; }

  function show(v) {
    if (v instanceof Closure) return "[Function: " + v.name + "]";
    if (typeof v === "string") return v;
    if (v === undefined) return "undefined";
    return String(v);
  }

  function run(ast, opts) {
    opts = opts || {};
    var out = [], steps = 0, limit = opts.limit || 100000, trace = opts.trace ? [] : null;
    var global = new Env(null);
    global.vars.undefined = undefined;
    global.vars.console = { log: function () { out.push([].map.call(arguments, show).join(" ")); } };

    function tick(node) { if (++steps > limit) throw EngineError("runtime", "Przekroczono limit kroków (pętla nieskończona?)"); if (trace && trace.length < 500) trace.push(node.type); }

    function exec(node, env) {
      tick(node);
      switch (node.type) {
        case "Program": case "BlockStatement": {
          var scope = node.type === "Program" ? env : new Env(env), last;
          hoist(node.body, scope);
          for (var i = 0; i < node.body.length; i++) last = exec(node.body[i], scope);
          return last;
        }
        case "VariableDeclaration":
          node.declarations.forEach(function (d) { env.declare(d.id.name, d.init ? evaluate(d.init, env) : undefined, node.kind === "const"); });
          return undefined;
        case "FunctionDeclaration": return undefined; // hoisted
        case "ExpressionStatement": return evaluate(node.expression, env);
        case "ReturnStatement": throw new ReturnSignal(node.argument ? evaluate(node.argument, env) : undefined);
        case "IfStatement":
          if (evaluate(node.test, env)) return exec(node.consequent, env);
          return node.alternate ? exec(node.alternate, env) : undefined;
        case "WhileStatement": while (evaluate(node.test, env)) exec(node.body, env); return undefined;
      }
      throw EngineError("runtime", "Nieobsługiwana instrukcja " + node.type);
    }
    function hoist(body, env) {
      body.forEach(function (s) { if (s.type === "FunctionDeclaration") env.vars[s.id.name] = new Closure(s, env); });
    }
    function call(fn, args) {
      if (typeof fn === "function") return fn.apply(null, args);
      if (!(fn instanceof Closure)) throw EngineError("runtime", "TypeError: " + show(fn) + " is not a function");
      var scope = new Env(fn.env);
      fn.node.params.forEach(function (p, i) { scope.vars[p.name] = args[i]; });
      try { exec(fn.node.body, scope); } catch (s) { if (s instanceof ReturnSignal) return s.value; throw s; }
      return undefined;
    }
    function evaluate(node, env) {
      tick(node);
      switch (node.type) {
        case "Literal": return node.value;
        case "Identifier": return env.get(node.name);
        case "FunctionExpression": return new Closure(node, env);
        case "UnaryExpression": {
          var a = evaluate(node.argument, env);
          return node.operator === "-" ? -a : node.operator === "+" ? +a : !a;
        }
        case "LogicalExpression": {
          var l = evaluate(node.left, env);
          if (node.operator === "&&") return l ? evaluate(node.right, env) : l;
          return l ? l : evaluate(node.right, env);
        }
        case "BinaryExpression": {
          var x = evaluate(node.left, env), y = evaluate(node.right, env);
          switch (node.operator) {
            case "+": return x + y; case "-": return x - y; case "*": return x * y; case "/": return x / y; case "%": return x % y; case "**": return Math.pow(x, y);
            case "<": return x < y; case ">": return x > y; case "<=": return x <= y; case ">=": return x >= y;
            case "===": return x === y; case "!==": return x !== y; case "==": return x == y; case "!=": return x != y; // eslint-disable-line eqeqeq
          }
          break;
        }
        case "AssignmentExpression": {
          var v = evaluate(node.right, env);
          if (node.operator === "+=") v = env.get(node.left.name) + v;
          if (node.operator === "-=") v = env.get(node.left.name) - v;
          env.set(node.left.name, v); return v;
        }
        case "MemberExpression": {
          var o = evaluate(node.object, env), k = node.property.name;
          if (o === null || o === undefined) throw EngineError("runtime", "TypeError: Cannot read properties of " + o + " (reading '" + k + "')");
          if (typeof o === "string" && k === "length") return o.length;
          return o[k];
        }
        case "CallExpression": {
          var fn = evaluate(node.callee, env);
          var args = node.arguments.map(function (a) { return evaluate(a, env); });
          return call(fn, args);
        }
      }
      throw EngineError("runtime", "Nieobsługiwane wyrażenie " + node.type);
    }

    var result;
    try { result = exec(ast, global); }
    catch (e) { if (e instanceof ReturnSignal) throw EngineError("runtime", "SyntaxError: return poza funkcją"); throw e; }
    return { output: out, result: result, steps: steps, trace: trace };
  }

  /* ---------------- Bytecode compiler (stack machine, for visualization) ---------------- */
  var OPNAME = { "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV", "%": "MOD", "**": "POW", "<": "LT", ">": "GT", "<=": "LE", ">=": "GE", "===": "EQ_STRICT", "!==": "NE_STRICT", "==": "EQ", "!=": "NE" };

  function compile(ast) {
    var chunks = [];
    function chunk(name) { var c = { name: name, code: [] }; chunks.push(c); return c; }
    function compileFn(node) {
      var c = chunk("fn " + (node.id ? node.id.name : "anonymous") + "(" + node.params.map(function (p) { return p.name; }).join(", ") + ")");
      stmt(node.body, c); emit(c, "PUSH_CONST", "undefined"); emit(c, "RETURN");
      return c.name;
    }
    function emit(c, op, arg) { c.code.push({ op: op, arg: arg }); return c.code.length - 1; }
    function patch(c, at) { c.code[at].arg = "@" + c.code.length; }
    function stmt(n, c) {
      switch (n.type) {
        case "Program": case "BlockStatement": n.body.forEach(function (s) { stmt(s, c); }); return;
        case "VariableDeclaration": n.declarations.forEach(function (d) { if (d.init) expr(d.init, c); else emit(c, "PUSH_CONST", "undefined"); emit(c, "DECLARE_" + n.kind.toUpperCase(), d.id.name); }); return;
        case "FunctionDeclaration": emit(c, "MAKE_CLOSURE", compileFn(n)); emit(c, "DECLARE_FN", n.id.name); return;
        case "ExpressionStatement": expr(n.expression, c); emit(c, "POP"); return;
        case "ReturnStatement": if (n.argument) expr(n.argument, c); else emit(c, "PUSH_CONST", "undefined"); emit(c, "RETURN"); return;
        case "IfStatement": {
          expr(n.test, c); var jf = emit(c, "JUMP_IF_FALSE", "?"); stmt(n.consequent, c);
          if (n.alternate) { var j = emit(c, "JUMP", "?"); patch(c, jf); stmt(n.alternate, c); patch(c, j); } else patch(c, jf);
          return;
        }
        case "WhileStatement": {
          var top = c.code.length; expr(n.test, c); var jx = emit(c, "JUMP_IF_FALSE", "?");
          stmt(n.body, c); emit(c, "JUMP", "@" + top); patch(c, jx); return;
        }
      }
    }
    function expr(n, c) {
      switch (n.type) {
        case "Literal": emit(c, "PUSH_CONST", n.raw); return;
        case "Identifier": emit(c, "LOAD", n.name); return;
        case "FunctionExpression": emit(c, "MAKE_CLOSURE", compileFn(n)); return;
        case "UnaryExpression": expr(n.argument, c); emit(c, n.operator === "-" ? "NEG" : n.operator === "+" ? "TO_NUMBER" : "NOT"); return;
        case "BinaryExpression": expr(n.left, c); expr(n.right, c); emit(c, OPNAME[n.operator]); return;
        case "LogicalExpression": {
          expr(n.left, c); emit(c, "DUP"); var j = emit(c, n.operator === "&&" ? "JUMP_IF_FALSE" : "JUMP_IF_TRUE", "?");
          emit(c, "POP"); expr(n.right, c); patch(c, j); return;
        }
        case "AssignmentExpression":
          if (n.operator !== "=") { emit(c, "LOAD", n.left.name); expr(n.right, c); emit(c, n.operator === "+=" ? "ADD" : "SUB"); }
          else expr(n.right, c);
          emit(c, "DUP"); emit(c, "STORE", n.left.name); return;
        case "MemberExpression": expr(n.object, c); emit(c, "GET_PROP", n.property.name); return;
        case "CallExpression": expr(n.callee, c); n.arguments.forEach(function (a) { expr(a, c); }); emit(c, "CALL", n.arguments.length); return;
      }
    }
    var main = chunk("<main>");
    stmt(ast, main); emit(main, "HALT");
    // keep <main> first
    return [main].concat(chunks.filter(function (c) { return c !== main; }));
  }

  function evaluateSource(src, opts) {
    var stage = "lexer", res = { tokens: null, ast: null, bytecode: null, run: null, error: null };
    try {
      res.tokens = tokenize(src); stage = "parser";
      res.ast = parse(res.tokens); stage = "compiler";
      res.bytecode = compile(res.ast); stage = "runtime";
      res.run = run(res.ast, opts);
    } catch (e) {
      res.error = { stage: e.stage || stage, message: e.message, pos: e.pos };
    }
    return res;
  }

  window.RudiEngine = { tokenize: tokenize, parse: parse, run: run, compile: compile, evaluate: evaluateSource, show: show };
})();
