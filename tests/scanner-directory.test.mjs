import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
const root=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const hub=readFileSync(new URL('../scanner-hub/index.html',import.meta.url),'utf8');
const arena=readFileSync(new URL('../chart-wars/index.html',import.meta.url),'utf8');

test('Calculator Pro root exposes the Scanner Hub and integrated Trading Arena',()=>{
 assert.match(root,/href="scanner-hub\//);
 assert.match(root,/chart-wars\/#simulator/);
 assert.match(root,/Paper Trading/);
 assert.match(root,/DIRECTORY LIVE · MODULES IN DEVELOPMENT/);
});

test('Scanner Hub links independent scanners and preserves honest placeholder status',()=>{
 for(const project of ['RO-Lyfe-Tactical-Intelligence-Center-','RO-Lyfe-Trading-Intelligence-Classroom','RO-Lyfe-Live-Sports-Center','rolyfe-market-terminal'])assert.ok(hub.includes(project));
 assert.match(hub,/Tactical RTIC Live Scanner/);
 assert.match(hub,/Live Chart Desk · Watchlist Scanner/);
 assert.match(hub,/Sector Scanner &amp; Chart Lab/);
 assert.match(hub,/Market Terminal Scanner/);
 assert.match(hub,/not a live market scanner/);
 for(const module of ['Bullish Scanner','Bearish Scanner','Gap Scanner','High-Volume Scanner','Earnings Scanner','Options Scanner'])assert.ok(hub.includes(module));
 assert.equal((hub.match(/NOT LIVE · PLACEHOLDER/g)||[]).length,6);
});

test('Trading Arena uses the existing server-side market-data function for real bars and quotes',()=>{
 assert.match(arena,/functions\/v1\/market-data/);
 assert.match(arena,/provider:'tickerbot'/);
 assert.match(arena,/provider:'finnhub'/);
 assert.match(arena,/normalizeBars/);
 assert.match(arena,/timestamp/i);
 assert.doesNotMatch(arena,/api\.tickerbot\.io/);
 assert.doesNotMatch(arena,/FINNHUB_API_KEY|TICKERBOT_API_KEY/);
 assert.match(arena,/Authorization:'Bearer '\+SUPABASE_LEGACY_ANON_JWT/);
});

test('Trading Arena embedded JavaScript parses without syntax errors',()=>{
 const match=arena.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match,'Trading Arena script element is present');
 assert.doesNotThrow(()=>new Script(match[1]));
});

test('Chart Wars and paper trading share one device-local virtual account',()=>{
 assert.match(arena,/rolyfe\.pro\.virtual-account\.v1/);
 assert.match(arena,/localStorage\.getItem/);
 assert.match(arena,/localStorage\.setItem/);
 assert.match(arena,/data-tab="wars"/);
 assert.match(arena,/data-tab="simulator"/);
 assert.match(arena,/data-tab="performance"/);
 assert.match(arena,/Chart Wars score/);
});

test('Paper simulator is virtual only and exposes market, limit, stop, slippage and risk safeguards',()=>{
 assert.match(arena,/value="market"/);
 assert.match(arena,/value="limit"/);
 assert.match(arena,/value="stop"/);
 assert.match(arena,/SIMULATED SLIPPAGE/);
 assert.match(arena,/no broker order was sent/i);
 assert.match(arena,/No real orders, brokerage connection/);
 assert.match(arena,/Gambler Check/);
});
