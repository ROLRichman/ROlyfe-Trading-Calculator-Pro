(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.ROLyfeIndicators = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const finite = (v) => Number.isFinite(Number(v));
  const periodOf = (p) => {
    const n = Math.floor(Number(p));
    if (!Number.isFinite(n) || n < 1 || n > 10000) throw new RangeError("Period must be an integer from 1 to 10000.");
    return n;
  };
  const average = (a) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;

  function sma(values, period) {
    const p = periodOf(period), out = Array(values.length).fill(null);
    let sum = 0, queue = [];
    for (let i = 0; i < values.length; i++) {
      const v = Number(values[i]);
      if (!Number.isFinite(v)) { sum = 0; queue = []; continue; }
      queue.push(v); sum += v;
      if (queue.length > p) sum -= queue.shift();
      if (queue.length === p) out[i] = sum / p;
    }
    return out;
  }

  // EMA is seeded with the first full-period SMA, avoiding first-price bias.
  function ema(values, period) {
    const p = periodOf(period), out = Array(values.length).fill(null);
    const k = 2 / (p + 1);
    let seed = [], previous = null;
    for (let i = 0; i < values.length; i++) {
      const value = Number(values[i]);
      if (!Number.isFinite(value)) { seed = []; previous = null; continue; }
      if (previous === null) {
        seed.push(value);
        if (seed.length === p) {
          previous = average(seed);
          out[i] = previous;
        }
      } else {
        previous = value * k + previous * (1 - k);
        out[i] = previous;
      }
    }
    return out;
  }

  function wma(values, period) {
    const p = periodOf(period), out = Array(values.length).fill(null), divisor = p * (p + 1) / 2;
    for (let i = p - 1; i < values.length; i++) {
      let weighted = 0, valid = true;
      for (let j = 0; j < p; j++) {
        const v = Number(values[i - p + 1 + j]);
        if (!Number.isFinite(v)) { valid = false; break; }
        weighted += v * (j + 1);
      }
      if (valid) out[i] = weighted / divisor;
    }
    return out;
  }

  function hma(values, period) {
    const p = periodOf(period), half = Math.max(1, Math.floor(p / 2)), root = Math.max(1, Math.floor(Math.sqrt(p)));
    const halfWma = wma(values, half), fullWma = wma(values, p);
    const difference = values.map((_, i) => Number.isFinite(halfWma[i]) && Number.isFinite(fullWma[i]) ? 2 * halfWma[i] - fullWma[i] : null);
    return wma(difference, root);
  }

  function trueRange(rows) {
    return rows.map((row, i) => {
      const high = Number(row.high), low = Number(row.low);
      if (!Number.isFinite(high) || !Number.isFinite(low)) return null;
      if (i === 0 || !Number.isFinite(Number(rows[i - 1].close))) return high - low;
      const previousClose = Number(rows[i - 1].close);
      return Math.max(high - low, Math.abs(high - previousClose), Math.abs(low - previousClose));
    });
  }

  // Wilder's RMA is the conventional ATR smoothing method.
  function atr(rows, period = 14) {
    const p = periodOf(period), ranges = trueRange(rows), out = Array(rows.length).fill(null);
    let seed = [], previous = null;
    for (let i = 0; i < ranges.length; i++) {
      const value = Number(ranges[i]);
      if (!Number.isFinite(value)) { seed = []; previous = null; continue; }
      if (previous === null) {
        seed.push(value);
        if (seed.length === p) {
          previous = average(seed);
          out[i] = previous;
        }
      } else {
        previous = (previous * (p - 1) + value) / p;
        out[i] = previous;
      }
    }
    return out;
  }

  function rsi(values, period = 14) {
    const p = periodOf(period), out = Array(values.length).fill(null);
    if (values.length <= p) return out;
    let gain = 0, loss = 0;
    for (let i = 1; i <= p; i++) {
      const delta = Number(values[i]) - Number(values[i - 1]);
      if (!Number.isFinite(delta)) return out;
      if (delta > 0) gain += delta; else loss -= delta;
    }
    let avgGain = gain / p, avgLoss = loss / p;
    const valueOf = (g, l) => g === 0 && l === 0 ? 50 : l === 0 ? 100 : 100 - 100 / (1 + g / l);
    out[p] = valueOf(avgGain, avgLoss);
    for (let i = p + 1; i < values.length; i++) {
      const delta = Number(values[i]) - Number(values[i - 1]);
      if (!Number.isFinite(delta)) { avgGain = 0; avgLoss = 0; continue; }
      avgGain = (avgGain * (p - 1) + Math.max(0, delta)) / p;
      avgLoss = (avgLoss * (p - 1) + Math.max(0, -delta)) / p;
      out[i] = valueOf(avgGain, avgLoss);
    }
    return out;
  }

  function vwap(rows) {
    const out = Array(rows.length).fill(null);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit"
    });
    let sessionDay = "", cumulativePV = 0, cumulativeVolume = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i], date = new Date(Number(row.time));
      if (!Number.isFinite(date.getTime())) continue;
      const parts = formatter.formatToParts(date);
      const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
      const key = values.year + "-" + values.month + "-" + values.day;
      if (key !== sessionDay) { sessionDay = key; cumulativePV = 0; cumulativeVolume = 0; }
      const high = Number(row.high), low = Number(row.low), close = Number(row.close), volume = Math.max(0, Number(row.volume) || 0);
      if (![high, low, close].every(Number.isFinite)) continue;
      const typical = (high + low + close) / 3;
      cumulativePV += typical * volume;
      cumulativeVolume += volume;
      out[i] = cumulativeVolume > 0 ? cumulativePV / cumulativeVolume : null;
    }
    return out;
  }

  function stochastic(rows, period = 14, smoothK = 3, smoothD = 3) {
    const p = periodOf(period), kSmooth = periodOf(smoothK), dSmooth = periodOf(smoothD);
    const raw = Array(rows.length).fill(null);
    for (let i = p - 1; i < rows.length; i++) {
      const window = rows.slice(i - p + 1, i + 1);
      const low = Math.min(...window.map((x) => Number(x.low)));
      const high = Math.max(...window.map((x) => Number(x.high)));
      const close = Number(rows[i].close);
      if (![low, high, close].every(Number.isFinite)) continue;
      raw[i] = high === low ? 50 : (close - low) / (high - low) * 100;
    }
    const k = sma(raw, kSmooth);
    const d = sma(k, dSmooth);
    return { rawK: raw, k, d };
  }

  function cci(rows, period = 20) {
    const p = periodOf(period), typical = rows.map((r) => (Number(r.high) + Number(r.low) + Number(r.close)) / 3);
    const means = sma(typical, p), out = Array(rows.length).fill(null);
    for (let i = p - 1; i < rows.length; i++) {
      if (!Number.isFinite(means[i])) continue;
      const window = typical.slice(i - p + 1, i + 1);
      if (!window.every(Number.isFinite)) continue;
      const deviation = average(window.map((v) => Math.abs(v - means[i])));
      out[i] = deviation === 0 ? 0 : (typical[i] - means[i]) / (0.015 * deviation);
    }
    return out;
  }

  function macd(values, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fast = ema(values, fastPeriod), slow = ema(values, slowPeriod);
    const line = values.map((_, i) => Number.isFinite(fast[i]) && Number.isFinite(slow[i]) ? fast[i] - slow[i] : null);
    const signal = ema(line, signalPeriod);
    const histogram = line.map((v, i) => Number.isFinite(v) && Number.isFinite(signal[i]) ? v - signal[i] : null);
    return { line, signal, histogram };
  }

  function rollingStd(values, period) {
    const p = periodOf(period), out = Array(values.length).fill(null);
    for (let i = p - 1; i < values.length; i++) {
      const window = values.slice(i - p + 1, i + 1).map(Number);
      if (!window.every(Number.isFinite)) continue;
      const mean = average(window);
      out[i] = Math.sqrt(average(window.map((v) => (v - mean) ** 2)));
    }
    return out;
  }

  function rollingExtreme(values, period, direction) {
    const p = periodOf(period), out = Array(values.length).fill(null);
    for (let i = p - 1; i < values.length; i++) {
      const window = values.slice(i - p + 1, i + 1).map(Number);
      if (window.every(Number.isFinite)) out[i] = direction === "high" ? Math.max(...window) : Math.min(...window);
    }
    return out;
  }

  function linRegEndpoint(values, period) {
    const p = periodOf(period), out = Array(values.length).fill(null);
    const xMean = (p - 1) / 2;
    const denominator = p * (p * p - 1) / 12;
    for (let i = p - 1; i < values.length; i++) {
      const window = values.slice(i - p + 1, i + 1).map(Number);
      if (!window.every(Number.isFinite)) continue;
      const yMean = average(window);
      let covariance = 0;
      for (let j = 0; j < p; j++) covariance += (j - xMean) * (window[j] - yMean);
      const slope = denominator ? covariance / denominator : 0;
      out[i] = yMean + slope * (p - 1 - xMean);
    }
    return out;
  }

  // Standard TTM-style squeeze: 20-period Bollinger Bands inside/outside
  // 20-period EMA Keltner Channels, with a detrended linear-regression momentum histogram.
  function ttmSqueeze(rows, options = {}) {
    const p = periodOf(options.period || 20);
    const bbMult = Number(options.bbMult || 2);
    const kcMult = Number(options.kcMult || 1.5);
    const closes = rows.map((r) => Number(r.close));
    const midBB = sma(closes, p), deviation = rollingStd(closes, p);
    const midKC = ema(closes, p), range = atr(rows, p);
    const bbUpper = midBB.map((v, i) => Number.isFinite(v) && Number.isFinite(deviation[i]) ? v + deviation[i] * bbMult : null);
    const bbLower = midBB.map((v, i) => Number.isFinite(v) && Number.isFinite(deviation[i]) ? v - deviation[i] * bbMult : null);
    const kcUpper = midKC.map((v, i) => Number.isFinite(v) && Number.isFinite(range[i]) ? v + range[i] * kcMult : null);
    const kcLower = midKC.map((v, i) => Number.isFinite(v) && Number.isFinite(range[i]) ? v - range[i] * kcMult : null);
    const highest = rollingExtreme(rows.map((r) => Number(r.high)), p, "high");
    const lowest = rollingExtreme(rows.map((r) => Number(r.low)), p, "low");
    const center = closes.map((v, i) => Number.isFinite(highest[i]) && Number.isFinite(lowest[i]) && Number.isFinite(midBB[i])
      ? ((highest[i] + lowest[i]) / 2 + midBB[i]) / 2 : null);
    const momentumSource = closes.map((v, i) => Number.isFinite(center[i]) ? v - center[i] : null);
    const momentum = linRegEndpoint(momentumSource, p);
    const squeezeOn = rows.map((_, i) => Number.isFinite(bbUpper[i]) && bbUpper[i] < kcUpper[i] && bbLower[i] > kcLower[i]);
    const squeezeOff = rows.map((_, i) => Number.isFinite(bbUpper[i]) && bbUpper[i] > kcUpper[i] && bbLower[i] < kcLower[i]);
    return { momentum, squeezeOn, squeezeOff, bbUpper, bbLower, kcUpper, kcLower };
  }

  function calcIndicators(rows) {
    const closes = rows.map((r) => Number(r.close));
    const e20 = ema(closes, 20), e50 = ema(closes, 50), r = rsi(closes, 14), m = macd(closes);
    const i = rows.length - 1;
    return {
      ema20: e20[i], ema50: e50[i], rsi: r[i],
      macd: m.histogram[i], macdLine: m.line[i], macdSignal: m.signal[i]
    };
  }

  // RL is long-only: 200-EMA cross is a trend watch; BUY requires a confirmed
  // bullish 200/50/20 regime plus a 20-EMA pullback reclaim and 5/10 momentum.
  // EXIT is a close-confirmed EMA deterioration or a 2-ATR trailing stop.
  function rlSignals(rows) {
    const close = rows.map((r) => Number(r.close));
    const e5 = ema(close, 5), e10 = ema(close, 10), e20 = ema(close, 20), e50 = ema(close, 50), e200 = ema(close, 200);
    const ranges = atr(rows, 14), signals = Array(rows.length).fill(null);
    let inPosition = false, trailingStop = null;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i], previous = rows[i - 1], price = Number(row.close), low = Number(row.low);
      if (![e5[i], e10[i], e20[i], e50[i], e200[i], ranges[i], e20[i - 1], e200[i - 1]].every(Number.isFinite)) continue;
      if (price > e200[i] && Number(previous.close) <= e200[i - 1]) {
        signals[i] = { index: i, type: "trend_up", price, reason: "Price closed above EMA 200." };
      } else if (price < e200[i] && Number(previous.close) >= e200[i - 1]) {
        signals[i] = { index: i, type: "trend_down", price, reason: "Price closed below EMA 200." };
      }
      const bullishRegime = price > e200[i] && e50[i] > e200[i] && e20[i] > e50[i];
      const fastBull = e5[i] > e10[i] && e5[i - 1] <= e10[i - 1];
      const touchedPullback = Number(previous.low) <= e20[i - 1] + Number(ranges[i - 1] || ranges[i]) * 0.35
        || Number(previous.close) <= e20[i - 1];
      const reclaim = price > e20[i] && price > Number(row.open) && e5[i] > e10[i] && (touchedPullback || fastBull);
      if (!inPosition && bullishRegime && reclaim) {
        inPosition = true;
        trailingStop = price - 2 * ranges[i];
        signals[i] = { index: i, type: "buy", price, stop: trailingStop, reason: "EMA 200/50/20 trend confirmed; pullback reclaimed EMA 20." };
        continue;
      }
      if (inPosition) {
        trailingStop = Math.max(trailingStop, price - 2 * ranges[i]);
        const stopHit = Number.isFinite(low) && low <= trailingStop;
        const momentumExit = price < e20[i] && e5[i] < e10[i];
        const trendExit = price < e50[i] && e20[i] < e50[i];
        if (stopHit || momentumExit || trendExit) {
          const exitPrice = stopHit ? Math.min(Number(row.open), trailingStop) : price;
          signals[i] = { index: i, type: "exit", price: Number.isFinite(exitPrice) ? exitPrice : price, stop: trailingStop,
            reason: stopHit ? "2-ATR trailing stop touched." : trendExit ? "EMA 50 trend failed." : "EMA 20 / 5-10 momentum exit confirmed." };
          inPosition = false;
          trailingStop = null;
        }
      }
    }
    return signals;
  }

  return { sma, ema, wma, hma, trueRange, atr, rsi, vwap, stochastic, cci, macd, rollingStd, ttmSqueeze, calcIndicators, rlSignals };
});
