#!/usr/bin/env node
/** Rebuild js/locale-data.js from locales/*.json (needed for file:// / GeckoView). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "locales");
const codes = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
const out = {};
for (const code of codes) {
  out[code] = JSON.parse(fs.readFileSync(path.join(dir, code + ".json"), "utf8"));
}
const body =
  "/* Auto-generated from locales/*.json — run: node tools/bundle-locales.mjs */\n" +
  "(function (g) {\n" +
  '  "use strict";\n' +
  "  g.RUDI_LOCALE_DATA = " +
  JSON.stringify(out) +
  ";\n" +
  "})(typeof window !== \"undefined\" ? window : globalThis);\n";
const dest = path.join(root, "js/locale-data.js");
fs.writeFileSync(dest, body);
console.log("wrote", path.relative(root, dest), (fs.statSync(dest).size / 1024).toFixed(1) + "KB", codes.length, "locales");
