"use strict";
const fs = require("node:fs");
const path = require("node:path");

const htmlPath = path.join(__dirname, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attributes, source]) =>
    !/\bsrc\s*=/i.test(attributes) &&
    !/\btype\s*=\s*["']application\/json["']/i.test(attributes) &&
    source.trim()
  );

if (!scripts.length) throw new Error("No inline application scripts found.");
for (let i = 0; i < scripts.length; i++) {
  new Function(scripts[i][2]);
}
console.log("Chart Wars inline JavaScript syntax: OK (" + scripts.length + " scripts checked)");
