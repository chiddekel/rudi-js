// Course content integrity: ids, exercise shapes, and answers checked against the engine.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

global.window = global.window || {};
require(path.join(__dirname, "..", "js", "engine.js"));
require(path.join(__dirname, "..", "js", "course.js"));
const E = window.RudiEngine, COURSE = window.RUDI_COURSE;
const all = COURSE.flatMap((m) => m.lessons.flatMap((l) => l.exercises.map((ex) => ({ m, l, ex }))));

test("unique module and lesson ids", () => {
  const ids = COURSE.flatMap((m) => [m.id, ...m.lessons.map((l) => l.id)]);
  assert.equal(new Set(ids).size, ids.length);
});

test("every exercise is well formed", () => {
  assert.ok(all.length >= 40);
  for (const { l, ex } of all) {
    const where = l.id + ": " + ex.q;
    assert.ok(ex.q && ex.explain, where);
    if (ex.kind === "choice") assert.ok(Number.isInteger(ex.answer) && ex.answer >= 0 && ex.answer < ex.options.length, where);
    else if (ex.kind === "order") {
      const texts = ex.tiles.concat(ex.extra || []).map((t) => (typeof t === "string" ? t : t.t));
      assert.equal(new Set(texts).size, texts.length, "duplicate tiles make order ambiguous: " + where);
    } else assert.equal(ex.kind, "input", where);
  }
});

test("token-order exercises match the lexer", () => {
  for (const { ex } of all.filter((x) => x.ex.kind === "order" && x.ex.code && typeof x.ex.tiles[0] === "object" && x.ex.tiles[0].type !== "op")) {
    const toks = E.tokenize(ex.code).slice(0, -1).map((t) => ({ t: t.value, type: t.type }));
    assert.deepEqual(ex.tiles, toks);
  }
});

test("input answers that are JS match the engine", () => {
  for (const { l, ex } of all.filter((x) => x.ex.kind === "input" && x.ex.code && !/PUSH/.test(x.ex.code))) {
    let got;
    // Token-count question (any locale): ask how many tokens for console.log("hi");
    if (ex.code === 'console.log("hi");' && ex.kind === "input") got = String(E.tokenize(ex.code).length - 1);
    else {
      const src = /console\.log/.test(ex.code) ? ex.code : "console.log(" + ex.code + ");";
      const r = E.evaluate(src);
      assert.equal(r.error, null, l.id);
      got = r.run.output.join("\n");
    }
    assert.ok([].concat(ex.answer).map(String).includes(got), `${l.id}: expected ${ex.answer}, engine says ${got}`);
  }
});
