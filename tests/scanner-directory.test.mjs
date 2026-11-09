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


test('Trading Arena has a real interactive chart with symbol, timeframe, zoom and responsive sizing controls',()=>{
 assert.match(arena,/lightweight-charts@4\.2\.3/);
 assert.match(arena,/addCandlestickSeries/);
 assert.match(arena,/handleScroll/);
 assert.match(arena,/handleScale/);
 assert.match(arena,/data-chart-size="compact"/);
 assert.match(arena,/data-chart-size="large"/);
 assert.match(arena,/chartFullscreen/);
 assert.match(arena,/zoomIn/);
 assert.match(arena,/zoomOut/);
 assert.match(arena,/fitChart/);
 assert.match(arena,/loadMarketData\(\);\}\);/);
});
test('Trading Arena exposes clickable indicator suite backed by the separate calculation module',()=>{
 for(const indicator of ['ema200','ema50','ema20','ema10','ema5','vwap','hma31','hma32','rlband','pps','volume','rsi','macd','stoch','cci','ttm','atr'])assert.ok(arena.includes('data-indicator="'+indicator+'"'),indicator);
 assert.match(arena,/<script src="\.\/indicators\.js"><\/script>/);
 const indicatorSource=fs.readFileSync(path.join(root,'chart-wars','indicators.js'),'utf8');
 for(const calc of ['function hma(','function vwap(','function rsi(','function stochastic(','function cci(','function macd(','function atr(','function ttmSqueeze(','function rlSignals('])assert.ok(indicatorSource.includes(calc),calc);
 assert.match(arena,/indicatorPanels/);
});

test('Trading Arena supports configurable virtual account size with explicit reset',()=>{
 assert.match(arena,/id="accountSize"/);
 assert.match(arena,/id="customAccountSize"/);
 assert.match(arena,/id="applyAccountSize"/);
 assert.match(arena,/initialBalance/);
 assert.match(arena,/Reset this device-local practice account/);
});
test('Trading Arena watchlist persists and scanner candidates can be added to it',()=>{
 assert.match(arena,/rolyfe\.pro\.watchlist\.v1/);
 assert.match(arena,/function addToWatchlist/);
 assert.match(arena,/function renderWatchlist/);
 assert.match(arena,/async function runScanner/);
 assert.match(arena,/data-view/);
 assert.match(arena,/provider:'finnhub'/);
 assert.match(arena,/id="scannerMode"/);
 assert.match(arena,/id="watchlistItems"/);
 assert.match(arena,/Watch/);
});
test('Trading Arena responsive layout prevents horizontal overflow and stretched grid tiles',()=>{
 assert.match(arena,/overflow-x:hidden/);
 assert.match(arena,/grid-auto-rows:min-content/);
 assert.match(arena,/@media\(max-width:900px\)/);
 assert.match(arena,/minmax\(0,1fr\)/);
});
