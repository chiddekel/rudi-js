// RudiScript engine tests. Run: node --test DUOLINGO_CLONE/tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

global.window = global.window || {};
require(path.join(__dirname, "..", "js", "engine.js"));
const E = window.RudiEngine;

const out = (src) => {
  const r = E.evaluate(src);
  if (r.error) throw new Error(r.error.stage + ": " + r.error.message);
  return r.run.output;
};
const err = (src) => E.evaluate(src).error;

test("lexer: types and maximal munch", () => {
  const t = E.tokenize("let x = 40 + 2; a >= 10 === b").slice(0, -1).map((t) => t.type + ":" + t.value);
  assert.deepEqual(t, ["keyword:let", "identifier:x", "operator:=", "number:40", "operator:+", "number:2", "punctuation:;",
    "identifier:a", "operator:>=", "number:10", "operator:===", "identifier:b"]);
});

test("lexer: strings, comments, eof, errors", () => {
  const t = E.tokenize('console.log("a\\nb"); // hi');
  assert.equal(t.filter((x) => x.type === "string")[0].value, "a\nb");
  assert.equal(t.at(-1).type, "eof");
  assert.equal(err('let s = "ab').stage, "lexer");
  assert.equal(err("let a = #").stage, "lexer");
});

test("parser: precedence and associativity", () => {
  assert.deepEqual(out("console.log(2 + 3 * 4, 2 ** 3 ** 2, 10 - 4 - 3, (1 + 2) * 3, -2 * 3, !false);"), ["14 512 3 9 -6 true"]);
});

test("parser: AST shape", () => {
  const ast = E.parse(E.tokenize("let a = f(1);"));
  assert.equal(ast.type, "Program");
  const d = ast.body[0];
  assert.equal(d.type, "VariableDeclaration");
  assert.equal(d.declarations[0].init.type, "CallExpression");
  assert.equal(d.declarations[0].init.arguments[0].type, "Literal");
});

test("parser: syntax errors", () => {
  for (const src of ["let = 5;", "x + 1 = 5;", "const c;", "if (a { }", "function () {}"]) {
    assert.equal(err(src)?.stage, "parser", src);
  }
});

test("interpreter: control flow, logic, strings", () => {
  assert.deepEqual(out("let s = 0; let i = 1; while (i <= 4) { s += i; i += 1; } console.log(s);"), ["10"]);
  assert.deepEqual(out('if (1 > 2) console.log("a"); else console.log("b");'), ["b"]);
  assert.deepEqual(out('console.log("abc".length, "a" + 1, 0 || "x", 0 && y);'), ["3 a1 x 0"]);
});

test("interpreter: scopes, const, reference errors", () => {
  assert.deepEqual(out("let x = 1; { let x = 2; } console.log(x);"), ["1"]);
  assert.match(err("const k = 1; k = 2;").message, /constant/);
  assert.match(err("console.log(nope);").message, /ReferenceError/);
  assert.match(err("let a = 1; let a = 2;").message, /already been declared/);
});

test("interpreter: functions, recursion, closures, hoisting", () => {
  assert.deepEqual(out("function fib(n){ if (n < 2) return n; return fib(n-1) + fib(n-2); } console.log(fib(15));"), ["610"]);
  assert.deepEqual(out("function mk(){ let n = 0; return function(){ n += 1; return n; }; } const c = mk(); c(); c(); console.log(c());"), ["3"]);
  assert.deepEqual(out("console.log(sq(4)); function sq(x) { return x * x; }"), ["16"]);
  assert.match(err("let f = 1; f();").message, /not a function/);
});

test("interpreter: step limit stops infinite loops", () => {
  assert.match(err("while (true) {}").message, /limit/);
});

test("compiler: stack bytecode and jumps", () => {
  const ops = (src) => E.compile(E.parse(E.tokenize(src)))[0].code.map((i) => i.op + (i.arg !== undefined ? " " + i.arg : ""));
  assert.deepEqual(ops("let x = 40 + 2;"), ["PUSH_CONST 40", "PUSH_CONST 2", "ADD", "DECLARE_LET x", "HALT"]);
  const w = ops("while (c) { f(); }");
  assert.equal(w[1], "JUMP_IF_FALSE @" + (w.length - 1));
  assert.equal(w.at(-2), "JUMP @0");
  const chunks = E.compile(E.parse(E.tokenize("function f(a) { return a; }")));
  assert.equal(chunks.length, 2);
  assert.equal(chunks[1].name, "fn f(a)");
});
