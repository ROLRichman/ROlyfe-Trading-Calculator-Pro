"use strict";
const fs = require("node:fs");
const path = require("node:path");

const htmlPath = path.join(__dirname, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attributes, source]) => !/\bsrc\s*=/i.test(attributes) && source.trim());

if (scripts.length !== 1) {
  throw new Error("Expected exactly one inline application script; found " + scripts.length);
}

new Function(scripts[0][2]);
console.log("Chart Wars inline JavaScript syntax: OK");
