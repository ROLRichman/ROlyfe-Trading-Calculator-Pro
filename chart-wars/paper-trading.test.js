"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("./paper-trading.js");

test("weighted average cost includes current inventory, new fill and fee", () => {
  assert.equal(P.weightedAverageCost(10, 100, 5, 110, 0), 103.33333333333333);
  assert.equal(P.weightedAverageCost(0, 0, 5, 10, 1), 10.2);
});

test("realized and unrealized P/L respect average cost and fees", () => {
  assert.equal(P.realizedPnl(110, 100, 5, 1), 49);
  assert.equal(P.unrealizedPnl(110, 100, 5), 50);
});

test("slippage is adverse for both buys and sells", () => {
  assert.equal(P.slippageFill(100, "buy", 10), 100.1);
  assert.equal(P.slippageFill(100, "sell", 10), 99.9);
  assert.throws(() => P.slippageFill(100, "buy", 101), /Slippage/);
});

test("buy limit fills at gap open or limit, never worse than limit", () => {
  assert.deepEqual(P.evaluateReplayOrder({ type: "limit", side: "buy", triggerPrice: 100 }, { open: 98, high: 102, low: 97, close: 101 }), { reference: 100, fill: 98, trigger: 100, type: "limit" });
  assert.deepEqual(P.evaluateReplayOrder({ type: "limit", side: "buy", triggerPrice: 100 }, { open: 102, high: 103, low: 99, close: 101 }), { reference: 100, fill: 100, trigger: 100, type: "limit" });
});

test("sell limit fills at gap open or limit, never worse than limit", () => {
  assert.deepEqual(P.evaluateReplayOrder({ type: "limit", side: "sell", triggerPrice: 100 }, { open: 102, high: 103, low: 99, close: 101 }), { reference: 100, fill: 102, trigger: 100, type: "limit" });
  assert.deepEqual(P.evaluateReplayOrder({ type: "limit", side: "sell", triggerPrice: 100 }, { open: 98, high: 101, low: 97, close: 100 }), { reference: 100, fill: 100, trigger: 100, type: "limit" });
});

test("stop orders honor intrabar high/low and gap-through slippage", () => {
  const buy = P.evaluateReplayOrder({ type: "stop", side: "buy", triggerPrice: 100, slippageBps: 10 }, { open: 102, high: 104, low: 99, close: 103 });
  const sell = P.evaluateReplayOrder({ type: "stop", side: "sell", triggerPrice: 100, slippageBps: 10 }, { open: 98, high: 101, low: 96, close: 97 });
  assert.equal(buy.stopReference, 102);
  assert.equal(buy.fill, 102.102);
  assert.equal(sell.stopReference, 98);
  assert.equal(sell.fill, 97.902);
});

test("pending order remains unfilled when candle does not touch trigger", () => {
  assert.equal(P.evaluateReplayOrder({ type: "limit", side: "buy", triggerPrice: 90 }, { open: 100, high: 102, low: 95, close: 101 }), null);
});

test("portfolio value and P/L reconcile to cash plus marked positions", () => {
  const result = P.portfolioSummary(400, {
    AAPL: { quantity: 2, avgCost: 100, mark: 110 },
    MSFT: { quantity: 1, avgCost: 50, mark: null }
  }, [{ realizedPnl: 12 }, { realizedPnl: -2 }]);
  assert.equal(result.marketValue, 270);
  assert.equal(result.unrealized, 20);
  assert.equal(result.realized, 10);
  assert.equal(result.equity, 670);
});

test("reject invalid position sizes and prices", () => {
  assert.throws(() => P.weightedAverageCost(0, 0, 0, 100), /Quantity/);
  assert.throws(() => P.realizedPnl(100, 100, -1), /Quantity/);
  assert.throws(() => P.notional(-10, 1), /positive/);
});

test("quote-based market, limit and stop orders use the same validated slippage math", () => {
  assert.equal(P.evaluateQuoteOrder({ type: "market", side: "buy", slippageBps: 10 }, 100).fill, 100.1);
  assert.equal(P.evaluateQuoteOrder({ type: "limit", side: "buy", triggerPrice: 101 }, 100).fill, 100);
  assert.equal(P.evaluateQuoteOrder({ type: "stop", side: "sell", triggerPrice: 101, slippageBps: 10 }, 100).fill, 99.9);
  assert.equal(P.evaluateQuoteOrder({ type: "limit", side: "buy", triggerPrice: 99 }, 100), null);
});
