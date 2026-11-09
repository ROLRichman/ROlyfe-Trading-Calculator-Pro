"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const I = require("./indicators.js");

const row = (time, open, high, low, close, volume = 100) => ({ time, open, high, low, close, volume });

test("EMA waits for a full-period SMA seed", () => {
  assert.deepEqual(I.ema([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
});

test("HMA returns null warmup and finite values once enough history exists", () => {
  const out = I.hma(Array.from({ length: 60 }, (_, i) => i + 1), 9);
  assert.equal(out.length, 60);
  assert.equal(out.slice(0, 9).some(Number.isFinite), false);
  assert.equal(Number.isFinite(out[10]), true);
});

test("Wilder ATR is stable on constant-range candles", () => {
  const rows = Array.from({ length: 30 }, (_, i) => row(i * 60000, 10, 11, 9, 10));
  const out = I.atr(rows, 14);
  assert.equal(out[12], null);
  assert.equal(out[13], 2);
  assert.equal(out[29], 2);
});

test("RSI handles flat and one-way markets", () => {
  assert.equal(I.rsi(Array(25).fill(10), 14).at(-1), 50);
  assert.equal(I.rsi(Array.from({ length: 25 }, (_, i) => i + 1), 14).at(-1), 100);
});

test("MACD uses a 12/26/9 line, signal and histogram", () => {
  const m = I.macd(Array(80).fill(100));
  assert.equal(m.line.at(-1), 0);
  assert.equal(m.signal.at(-1), 0);
  assert.equal(m.histogram.at(-1), 0);
});

test("VWAP resets at the New York session date, not UTC midnight", () => {
  const rows = [
    row(Date.parse("2026-11-09T14:30:00Z"), 10, 12, 10, 12, 100),
    row(Date.parse("2026-11-09T15:30:00Z"), 12, 14, 12, 14, 100),
    row(Date.parse("2026-11-10T14:30:00Z"), 20, 22, 20, 22, 100)
  ];
  const out = I.vwap(rows);
  assert.ok(Math.abs(out[0] - 11.333333333333333) < 1e-10);
  assert.ok(Math.abs(out[1] - 12.333333333333333) < 1e-10);
  assert.ok(Math.abs(out[2] - 21.333333333333333) < 1e-10);
});

test("Stochastic flat window uses 50 and returns smoothed K/D", () => {
  const rows = Array.from({ length: 30 }, (_, i) => row(i, 10, 10, 10, 10));
  const out = I.stochastic(rows, 14, 3, 3);
  assert.equal(out.k.at(-1), 50);
  assert.equal(out.d.at(-1), 50);
});

test("CCI returns zero for a flat series", () => {
  const rows = Array.from({ length: 30 }, (_, i) => row(i, 10, 10, 10, 10));
  assert.equal(I.cci(rows, 20).at(-1), 0);
});

test("TTM squeeze computes BB/KC state and momentum with warmup", () => {
  const rows = Array.from({ length: 80 }, (_, i) => {
    const c = 100 + Math.sin(i / 3) * 0.05;
    return row(i, c, c + 0.1, c - 0.1, c, 1000);
  });
  const out = I.ttmSqueeze(rows);
  assert.equal(out.momentum.length, rows.length);
  assert.equal(typeof out.squeezeOn.at(-1), "boolean");
  assert.equal(typeof out.squeezeOff.at(-1), "boolean");
  assert.equal(Number.isFinite(out.momentum.at(-1)), true);
});

test("RL returns only trend-watch, buy and exit events", () => {
  const rows = Array.from({ length: 260 }, (_, i) => {
    const c = i < 205 ? 100 : 100 + (i - 205) * 0.45;
    return row(i * 60000, c - 0.1, c + 0.3, c - 0.4, c, 1000);
  });
  const events = I.rlSignals(rows);
  assert.equal(events.length, rows.length);
  assert.ok(events.some((x) => x && ["trend_up", "buy", "exit"].includes(x.type)));
});

test("EMA resets cleanly across null warmup gaps instead of treating null as zero", () => {
  assert.deepEqual(I.ema([1, 2, 3, null, 10, 11, 12], 3), [null, null, 2, null, null, null, 11]);
});

test("MACD does not seed its signal EMA with null warmup values", () => {
  const values = Array.from({ length: 60 }, (_, i) => 100 + i);
  const m = I.macd(values);
  assert.equal(m.line.slice(0, 25).every(v => v === null), true);
  assert.equal(m.signal.slice(0, 33).every(v => v === null), true);
  assert.equal(Number.isFinite(m.signal[33]), true);
});

test("RL calculations are causal: an earlier signal is unchanged by later candles", () => {
  const rows = Array.from({ length: 280 }, (_, i) => {
    const c = i < 215 ? 100 : 100 + (i - 215) * 0.28 + Math.sin(i / 3) * 0.12;
    return row(i * 60000, c - 0.06, c + 0.25, c - 0.30, c, 1200);
  });
  const whole = I.rlSignals(rows);
  const prefix = I.rlSignals(rows.slice(0, 230));
  assert.deepEqual(whole.slice(0, 230), prefix);
});

test("Wilder ATR is null until it has a full valid seed", () => {
  const rows = Array.from({ length: 20 }, (_, i) => row(i, 10, 11, 9, 10));
  const result = I.atr(rows, 14);
  assert.equal(result.slice(0, 13).every(v => v === null), true);
  assert.equal(result[13], 2);
});

test("RSI restarts its Wilder seed after a missing close", () => {
  const out = I.rsi([1, 2, 3, null, 10, 11, 12], 2);
  assert.equal(out[2], 100);
  assert.equal(out[3], null);
  assert.equal(out[4], null);
  assert.equal(out[5], null);
  assert.equal(out[6], 100);
});

test("TTM squeeze stays unready until both BB and Keltner windows exist", () => {
  const rows = Array.from({ length: 30 }, (_, i) => row(i, 10, 11, 9, 10));
  const out = I.ttmSqueeze(rows);
  assert.equal(out.ready[18], false);
  assert.equal(out.squeezeOn[18], null);
  assert.equal(out.ready[19], true);
  assert.equal(typeof out.squeezeOn[19], "boolean");
});

test("RL trailing stop tests the prior stop before raising it from the current close", () => {
  const rows = [];
  for (let i = 0; i < 217; i++) {
    let close = 100 + i * 0.2;
    if (i === 215) close -= 2.2;
    if (i === 216) close += 1.8;
    rows.push(row(i, close - 0.1, close + 0.3, close - 0.4, close));
  }
  rows.push(row(217, 149.8, 150.5, 143.4, 150));
  rows.push(row(218, 149, 149.5, 146, 147));
  const events = I.rlSignals(rows);
  assert.equal(events[216]?.type, "buy");
  assert.equal(events[217], null);
  assert.equal(events[218]?.type, "exit");
  assert.match(events[218].reason, /trailing stop touched/);
});
