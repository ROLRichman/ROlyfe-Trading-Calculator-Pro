import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const hub = readFileSync(new URL('../scanner-hub/index.html', import.meta.url), 'utf8');

test('Calculator Pro links to the scanner directory without claiming blank modules are live', () => {
  assert.match(root, /href="scanner-hub\//);
  assert.match(root, /DIRECTORY LIVE · MODULES IN DEVELOPMENT/);
  assert.match(hub, /empty placeholders/);
  assert.match(hub, /NOT LIVE · PLACEHOLDER/);
  for (const project of ['RO-Lyfe-Tactical-Intelligence-Center-', 'RO-Lyfe-Trading-Intelligence-Classroom', 'RO-Lyfe-Live-Sports-Center', 'rolyfe-market-terminal']) {
    assert.ok(hub.includes(project), 'missing project directory link: ' + project);
  }
});

test('Calculator Pro directory separates active scanners from the practice-only Market Room', () => {
  assert.match(hub, /Available RO’Lyfe scanners/);
  assert.match(hub, /Tactical RTIC Live Scanner/);
  assert.match(hub, /Live Chart Desk · Watchlist Scanner/);
  assert.match(hub, /Sector Scanner &amp; Chart Lab/);
  assert.match(hub, /Market Terminal Scanner/);
  assert.match(hub, /not a live market scanner/);
  assert.match(hub, /Bullish Scanner/);
  assert.match(hub, /Bearish Scanner/);
  assert.match(hub, /Gap Scanner/);
  assert.match(hub, /High-Volume Scanner/);
  assert.match(hub, /Earnings Scanner/);
  assert.match(hub, /Options Scanner/);
});
