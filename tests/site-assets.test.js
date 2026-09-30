const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function checkLocalReference(reference, owner) {
  const pathname = reference.split(/[?#]/, 1)[0];
  const absolute = path.resolve(root, pathname);
  assert.ok(absolute.startsWith(root + path.sep), `${owner}: reference escapes project: ${reference}`);
  assert.ok(fs.existsSync(absolute), `${owner}: missing asset ${reference}`);
}

test("HTML entry points reference files included in the site", () => {
  for (const name of ["index.html", "player.html", "solo.html", "display.html"]) {
    const html = fs.readFileSync(path.join(root, name), "utf8");
    for (const [, reference] of html.matchAll(/(?:src|href)="(\.\/[^"#]+(?:\?[^\"]*)?)"/g)) {
      checkLocalReference(reference, name);
    }
  }
});

test("service worker shell includes existing assets", () => {
  const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  const shell = worker.match(/const SHELL_ASSETS = \[([\s\S]*?)\];/);
  assert.ok(shell, "service worker shell asset list is missing");
  for (const [, reference] of shell[1].matchAll(/"(\.\/[^\"]*)"/g)) {
    if (reference === "./") continue;
    checkLocalReference(reference, "sw.js");
  }
});
