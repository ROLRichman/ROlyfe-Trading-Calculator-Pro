"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
test("Chart Wars defaults to RL signal arrows and RL ATR band",()=>{
 const html=fs.readFileSync("chart-wars/index.html","utf8");
 assert.match(html,/data-indicator="pps" checked/);
 assert.match(html,/data-indicator="rlband" checked/);
});
