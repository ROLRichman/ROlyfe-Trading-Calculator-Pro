(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.ROLyfePaperMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const value = (input, label) => {
    if (input === null || input === undefined || input === "") throw new TypeError(label + " is required.");
    const n = Number(input);
    if (!Number.isFinite(n)) throw new TypeError(label + " must be finite.");
    return n;
  };
  const sideOf = (side) => {
    if (side !== "buy" && side !== "sell") throw new RangeError("Side must be buy or sell.");
    return side;
  };
  const quantityOf = (quantity) => {
    const n = value(quantity, "Quantity");
    if (!Number.isInteger(n) || n < 1 || n > 100000) throw new RangeError("Quantity must be a whole number from 1 to 100000.");
    return n;
  };
  const priceOf = (price, label = "Price") => {
    const n = value(price, label);
    if (n <= 0) throw new RangeError(label + " must be positive.");
    return n;
  };

  function notional(price, quantity) {
    return priceOf(price, "Fill price") * quantityOf(quantity);
  }

  function weightedAverageCost(currentQuantity, currentAverageCost, addedQuantity, fillPrice, fee = 0) {
    const oldQty = Math.max(0, value(currentQuantity ?? 0, "Current quantity"));
    const oldCost = oldQty > 0 ? priceOf(currentAverageCost, "Current average cost") : 0;
    const addQty = quantityOf(addedQuantity), fill = priceOf(fillPrice, "Fill price");
    const charge = Math.max(0, value(fee, "Fee"));
    return (oldQty * oldCost + addQty * fill + charge) / (oldQty + addQty);
  }

  function realizedPnl(fillPrice, averageCost, quantity, fee = 0) {
    const fill = priceOf(fillPrice, "Fill price"), basis = priceOf(averageCost, "Average cost");
    const qty = quantityOf(quantity), charge = Math.max(0, value(fee, "Fee"));
    return (fill - basis) * qty - charge;
  }

  function unrealizedPnl(markPrice, averageCost, quantity) {
    const mark = priceOf(markPrice, "Mark price"), basis = priceOf(averageCost, "Average cost");
    return (mark - basis) * quantityOf(quantity);
  }

  function slippageFill(referencePrice, side, slippageBps = 0) {
    const reference = priceOf(referencePrice, "Reference price"), direction = sideOf(side);
    const bps = value(slippageBps, "Slippage basis points");
    if (bps < 0 || bps > 100) throw new RangeError("Slippage must be between 0 and 100 basis points.");
    return reference * (1 + (direction === "buy" ? 1 : -1) * bps / 10000);
  }

  function evaluateReplayOrder(order, row) {
    if (!order || !row || (order.type !== "limit" && order.type !== "stop")) return null;
    const side = sideOf(order.side);
    const trigger = priceOf(order.triggerPrice, "Trigger price");
    const open = priceOf(row.open, "Candle open");
    const high = priceOf(row.high, "Candle high");
    const low = priceOf(row.low, "Candle low");
    const bps = value(order.slippageBps ?? 0, "Slippage basis points");
    if (bps < 0 || bps > 100) throw new RangeError("Slippage must be between 0 and 100 basis points.");

    if (order.type === "limit") {
      const touched = side === "buy" ? low <= trigger : high >= trigger;
      if (!touched) return null;
      const fill = side === "buy" ? (open <= trigger ? open : trigger) : (open >= trigger ? open : trigger);
      return { reference: trigger, fill, trigger, type: "limit" };
    }

    const touched = side === "buy" ? high >= trigger : low <= trigger;
    if (!touched) return null;
    const stopReference = side === "buy" ? Math.max(open, trigger) : Math.min(open, trigger);
    return {
      reference: trigger,
      fill: slippageFill(stopReference, side, bps),
      trigger,
      stopReference,
      type: "stop",
    };
  }

  function portfolioSummary(cashInput, positionsInput, tradesInput) {
    const cash = value(cashInput, "Cash");
    const positions = positionsInput && typeof positionsInput === "object" ? Object.values(positionsInput) : [];
    const trades = Array.isArray(tradesInput) ? tradesInput : [];
    let marketValue = 0, unrealized = 0;
    for (const position of positions) {
      const quantity = quantityOf(position.quantity);
      const averageCost = priceOf(position.avgCost, "Position average cost");
      const mark = Number.isFinite(Number(position.mark)) && Number(position.mark) > 0
        ? Number(position.mark) : averageCost;
      marketValue += quantity * mark;
      unrealized += unrealizedPnl(mark, averageCost, quantity);
    }
    const realized = trades.reduce((sum, trade) => sum + (Number.isFinite(Number(trade.realizedPnl)) ? Number(trade.realizedPnl) : 0), 0);
    return { cash, marketValue, unrealized, realized, equity: cash + marketValue };
  }

  return { notional, weightedAverageCost, realizedPnl, unrealizedPnl, slippageFill, evaluateReplayOrder, portfolioSummary };
});
