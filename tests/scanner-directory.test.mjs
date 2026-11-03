import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const hub=readFileSync(new URL('../scanner-hub/index.html',import.meta.url),'utf8');
test('Calculator Pro root exposes a Scanner Hub directory and honest module status',()=>{
 assert.match(root,/href="scanner-hub\//);
 assert.match(root,/DIRECTORY LIVE · MODULES IN DEVELOPMENT/);
 assert.match(hub,/empty placeholders/);
 assert.match(hub,/NOT LIVE · PLACEHOLDER/);
});
test('Scanner Hub links active independent scanners and marks practice-only Market Room accurately',()=>{
 for(const project of ['RO-Lyfe-Tactical-Intelligence-Center-','RO-Lyfe-Trading-Intelligence-Classroom','RO-Lyfe-Live-Sports-Center','rolyfe-market-terminal'])assert.ok(hub.includes(project));
 assert.match(hub,/Tactical RTIC Live Scanner/);
 assert.match(hub,/Live Chart Desk · Watchlist Scanner/);
 assert.match(hub,/Sector Scanner &amp; Chart Lab/);
 assert.match(hub,/Market Terminal Scanner/);
 assert.match(hub,/not a live market scanner/);
 for(const module of ['Bullish Scanner','Bearish Scanner','Gap Scanner','High-Volume Scanner','Earnings Scanner','Options Scanner'])assert.ok(hub.includes(module));
});
