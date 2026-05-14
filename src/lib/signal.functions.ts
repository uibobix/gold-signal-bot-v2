import { createServerFn } from "@tanstack/react-start";

export type Candle = { datetime: string; open: number; high: number; low: number; close: number };
type Trend = "UP" | "DOWN" | "FLAT";

type HistoryItem = { id: string; type: "BUY" | "SELL"; entry: number; exit: number; pips: number; win: boolean; rr: number; time: string };

export type SignalResult =
  | {
      ok: true;
      price: number;
      changeAbs: number;
      changePct: number;
      high: number;
      low: number;
      candles: Candle[];
      indicators: {
        rsi: number;
        rsiLabel: string;
        ema50: number;
        ema200: number;
        macd: number;
        macdSignal: number;
        macdLabel: string;
        atr: number;
      };
      confluence: {
        h1Trend: Trend;
        h4Trend: Trend;
        d1Trend: Trend;
        session: "ASIA" | "LONDON" | "NY" | "OVERLAP" | "CLOSED";
        sessionOk: boolean;
        chop: boolean;
        dxyTrend: Trend;
        dxyOk: boolean;
        passed: number;
        total: number;
      };
      signal: {
        type: "BUY" | "SELL" | "NEUTRAL";
        confidence: number;
        entry: number;
        stopLoss: number;
        takeProfit: number;
        riskReward: number;
        id: string;
        rationale: string;
        skipReason?: string;
      };
      backtest: {
        trades: number;
        wins: number;
        winRate: number;
        avgRR: number;
        profitFactor: number;
        maxDrawdownR: number;
        netR: number;
        expectancy: number;
      };
      history: HistoryItem[];
      dxy: { price: number; changePct: number } | null;
      strategy: { name: string; version: string; notes: string };
      fetchedAt: string;
    }
  | { ok: false; error: string };

// ---------- math ----------
function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) out.push(values[i] * k + out[i - 1] * (1 - k));
  return out;
}
function rsiSeries(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(50);
  if (values.length < period + 1) return out;
  let g = 0, l = 0;
  for (let i = 1; i <= period; i++) { const d = values[i] - values[i - 1]; if (d >= 0) g += d; else l -= d; }
  let avgG = g / period, avgL = l / period;
  out[period] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const gg = d > 0 ? d : 0, ll = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + gg) / period;
    avgL = (avgL * (period - 1) + ll) / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}
function atrSeries(candles: Candle[], period = 14): number[] {
  const out: number[] = new Array(candles.length).fill(0);
  const trs: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  let sum = 0;
  for (let i = 1; i < candles.length; i++) {
    sum += trs[i];
    if (i < period) continue;
    if (i === period) out[i] = sum / period;
    else out[i] = (out[i - 1] * (period - 1) + trs[i]) / period;
  }
  return out;
}

function resampleHigher(candles: Candle[], factor: number): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i + factor <= candles.length; i += factor) {
    const s = candles.slice(i, i + factor);
    out.push({
      datetime: s[0].datetime,
      open: s[0].open,
      close: s[s.length - 1].close,
      high: Math.max(...s.map(c => c.high)),
      low: Math.min(...s.map(c => c.low)),
    });
  }
  return out;
}

function trendOf(closes: number[]): Trend {
  if (closes.length < 200) return "FLAT";
  const e50 = ema(closes, 50).at(-1)!;
  const e200 = ema(closes, 200).at(-1)!;
  const diff = (e50 - e200) / e200;
  if (diff > 0.0008) return "UP";
  if (diff < -0.0008) return "DOWN";
  return "FLAT";
}

function getSession(d: Date): "ASIA" | "LONDON" | "NY" | "OVERLAP" | "CLOSED" {
  const h = d.getUTCHours();
  const day = d.getUTCDay();
  if (day === 6 || (day === 0 && h < 22) || (day === 5 && h >= 21)) return "CLOSED";
  if (h >= 13 && h < 16) return "OVERLAP";   // London/NY overlap — best volatility
  if (h >= 7 && h < 13) return "LONDON";     // London kill zone
  if (h >= 16 && h < 20) return "NY";        // NY afternoon
  return "ASIA";
}

// ---------- structure: swing pivots & sweeps ----------
type Pivot = { idx: number; price: number; kind: "H" | "L" };

function findPivots(candles: Candle[], left = 3, right = 3): Pivot[] {
  const piv: Pivot[] = [];
  for (let i = left; i < candles.length - right; i++) {
    const w = candles.slice(i - left, i + right + 1);
    const c = candles[i];
    if (c.high === Math.max(...w.map(x => x.high))) piv.push({ idx: i, price: c.high, kind: "H" });
    if (c.low === Math.min(...w.map(x => x.low))) piv.push({ idx: i, price: c.low, kind: "L" });
  }
  return piv;
}

// Return last swing high and swing low before index `i`
function lastSwings(piv: Pivot[], i: number) {
  let lastH: Pivot | null = null, lastL: Pivot | null = null;
  for (const p of piv) {
    if (p.idx >= i) break;
    if (p.kind === "H") lastH = p;
    else lastL = p;
  }
  return { lastH, lastL };
}

// ---------- strategy: SMC liquidity sweep + structure shift ----------
// Logic:
//  1. Higher TF bias: H4 + D1 must agree (UP or DOWN)
//  2. Session must be London / Overlap / NY (kill zones)
//  3. Recent candle SWEPT a prior swing low (for buy) or swing high (for sell)
//     i.e. wicked beyond it but closed back inside — stop hunt / liquidity grab
//  4. Price is in DISCOUNT (<50% of last swing leg) for buys, PREMIUM (>50%) for sells
//  5. RSI not at extreme against trade (e.g. don't buy if RSI > 75)
//  6. SL = beyond swept wick + 0.3*ATR; TP = min 1:3 R:R
//  7. DXY confirms (inverse) — soft filter, contributes to confidence
function evaluateAt(candles: Candle[], i: number, dxyTrend: Trend) {
  if (i < 200) return null;
  const closes = candles.map(c => c.close);
  const window = closes.slice(0, i + 1);
  const ema50v = ema(window, 50).at(-1)!;
  const ema200v = ema(window, 200).at(-1)!;
  const ema12 = ema(window, 12).at(-1)!;
  const ema26 = ema(window, 26).at(-1)!;
  const macd = ema12 - ema26;
  const rsi = rsiSeries(window, 14).at(-1)!;
  const atr = atrSeries(candles.slice(0, i + 1), 14).at(-1)!;
  const price = closes[i];
  const cur = candles[i];

  // higher timeframe bias
  const h1Trend: Trend = ema50v > ema200v ? "UP" : ema50v < ema200v ? "DOWN" : "FLAT";
  const h4 = resampleHigher(candles.slice(0, i + 1), 4);
  const d1 = resampleHigher(candles.slice(0, i + 1), 24);
  const h4Trend = h4.length >= 200 ? trendOf(h4.map(c => c.close)) : h1Trend;
  const d1Trend = d1.length >= 200 ? trendOf(d1.map(c => c.close)) : h4Trend;

  const session = getSession(new Date(cur.datetime + "Z"));
  const sessionOk = session === "LONDON" || session === "NY" || session === "OVERLAP";

  // chop: tight EMA ribbon
  const chop = Math.abs(ema50v - ema200v) / price < 0.0015;

  // higher TF alignment (H4 + D1 dominant; H1 often noisy)
  const htfBias: Trend = h4Trend === d1Trend && h4Trend !== "FLAT" ? h4Trend : "FLAT";
  const trendsAligned = htfBias !== "FLAT";

  // structure: pivots from last 80 bars
  const lookback = candles.slice(Math.max(0, i - 80), i);
  const piv = findPivots(lookback, 3, 3).map(p => ({ ...p, idx: p.idx + Math.max(0, i - 80) }));
  const { lastH, lastL } = lastSwings(piv, i);

  // last swing leg → premium/discount
  let inDiscount = false, inPremium = false, legHi = 0, legLo = 0;
  if (lastH && lastL) {
    legHi = Math.max(lastH.price, lastL.price);
    legLo = Math.min(lastH.price, lastL.price);
    const mid = (legHi + legLo) / 2;
    inDiscount = price < mid;
    inPremium = price > mid;
  }

  // liquidity sweep: did current candle wick beyond a prior swing & close back
  let sweptLow = false, sweptHigh = false, sweptLevel = 0;
  if (lastL && cur.low < lastL.price && cur.close > lastL.price) {
    sweptLow = true; sweptLevel = lastL.price;
  }
  if (lastH && cur.high > lastH.price && cur.close < lastH.price) {
    sweptHigh = true; sweptLevel = lastH.price;
  }

  // DXY soft-confirm
  const dxyOk = dxyTrend === "FLAT" || (htfBias === "UP" && dxyTrend === "DOWN") || (htfBias === "DOWN" && dxyTrend === "UP");

  let type: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let skipReason: string | undefined;

  if (chop) skipReason = "EMA ribbon compressed — choppy regime";
  else if (!sessionOk) skipReason = `Outside kill zones (${session})`;
  else if (!trendsAligned) skipReason = `H4 (${h4Trend}) and D1 (${d1Trend}) not aligned`;
  else if (htfBias === "UP" && !sweptLow) skipReason = "Waiting for liquidity sweep below swing low";
  else if (htfBias === "DOWN" && !sweptHigh) skipReason = "Waiting for liquidity sweep above swing high";
  else if (htfBias === "UP" && !inDiscount) skipReason = "Price not in discount zone (<50% of leg)";
  else if (htfBias === "DOWN" && !inPremium) skipReason = "Price not in premium zone (>50% of leg)";
  else if (htfBias === "UP" && rsi > 75) skipReason = "RSI too hot to buy — wait for reset";
  else if (htfBias === "DOWN" && rsi < 25) skipReason = "RSI too cold to sell — wait for reset";
  else type = htfBias === "UP" ? "BUY" : "SELL";

  // SL beyond swept wick + ATR buffer; TP min 1:3
  const buffer = atr * 0.4;
  let entry = +price.toFixed(2);
  let stopLoss = entry, takeProfit = entry, riskReward = 0;
  if (type === "BUY") {
    const slBase = Math.min(cur.low, sweptLevel || cur.low) - buffer;
    const slDist = Math.max(entry - slBase, atr * 1.0);
    stopLoss = +(entry - slDist).toFixed(2);
    takeProfit = +(entry + slDist * 3).toFixed(2);
    riskReward = 3;
  } else if (type === "SELL") {
    const slBase = Math.max(cur.high, sweptLevel || cur.high) + buffer;
    const slDist = Math.max(slBase - entry, atr * 1.0);
    stopLoss = +(entry + slDist).toFixed(2);
    takeProfit = +(entry - slDist * 3).toFixed(2);
    riskReward = 3;
  }

  // confidence scoring
  let confidence = 55;
  if (trendsAligned) confidence += 10;
  if (h1Trend === htfBias) confidence += 5;
  if (sweptLow || sweptHigh) confidence += 10;
  if (inDiscount && htfBias === "UP") confidence += 6;
  if (inPremium && htfBias === "DOWN") confidence += 6;
  if (dxyOk && dxyTrend !== "FLAT") confidence += 6;
  if (session === "OVERLAP") confidence += 4;
  confidence = Math.min(90, confidence);

  return {
    type, confidence, entry, stopLoss, takeProfit, riskReward,
    h1Trend, h4Trend, d1Trend, session, sessionOk, chop, dxyOk, dxyTrend,
    rsi, macd, ema50v, ema200v, atr, skipReason,
    sweptLow, sweptHigh, inDiscount, inPremium,
  };
}

// ---------- backtest ----------
function backtest(candles: Candle[], dxyTrend: Trend) {
  const trades: HistoryItem[] = [];
  let wins = 0, totalR = 0, grossWin = 0, grossLoss = 0;
  let equity = 0, peak = 0, maxDD = 0;
  let i = 200;
  while (i < candles.length - 1) {
    const ev = evaluateAt(candles, i, dxyTrend);
    if (!ev || ev.type === "NEUTRAL") { i++; continue; }
    let exitIdx = -1, win = false;
    for (let j = i + 1; j < Math.min(i + 60, candles.length); j++) {
      const c = candles[j];
      if (ev.type === "BUY") {
        if (c.low <= ev.stopLoss) { exitIdx = j; win = false; break; }
        if (c.high >= ev.takeProfit) { exitIdx = j; win = true; break; }
      } else {
        if (c.high >= ev.stopLoss) { exitIdx = j; win = false; break; }
        if (c.low <= ev.takeProfit) { exitIdx = j; win = true; break; }
      }
    }
    if (exitIdx === -1) { i += 4; continue; }
    const r = win ? ev.riskReward : -1;
    totalR += r;
    if (win) { wins++; grossWin += r; } else { grossLoss += 1; }
    equity += r;
    if (equity > peak) peak = equity;
    if (peak - equity > maxDD) maxDD = peak - equity;
    const exitPrice = win ? ev.takeProfit : ev.stopLoss;
    const pips = (ev.type === "BUY" ? exitPrice - ev.entry : ev.entry - exitPrice) * 10;
    trades.push({
      id: `#${(8800 + i).toString()}`,
      type: ev.type, entry: ev.entry, exit: +exitPrice.toFixed(2),
      pips: +pips.toFixed(1), win, rr: ev.riskReward, time: candles[i].datetime,
    });
    i = exitIdx + 1;
  }
  const total = trades.length;
  const winRate = total ? wins / total : 0;
  const expectancy = total ? totalR / total : 0;
  return {
    trades: total, wins,
    winRate: +(winRate * 100).toFixed(1),
    avgRR: +expectancy.toFixed(2),
    expectancy: +expectancy.toFixed(2),
    profitFactor: grossLoss ? +(grossWin / grossLoss).toFixed(2) : grossWin > 0 ? 99 : 0,
    maxDrawdownR: +maxDD.toFixed(2),
    netR: +totalR.toFixed(2),
    history: trades.slice(-12).reverse(),
  };
}

async function fetchSeries(symbol: string, apiKey: string, size = 500): Promise<Candle[] | null> {
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1h&outputsize=${size}&apikey=${apiKey}`;
    const res = await fetch(url);
    const json: any = await res.json();
    if (!json.values) return null;
    return (json.values as any[])
      .map(v => ({ datetime: v.datetime, open: +v.open, high: +v.high, low: +v.low, close: +v.close }))
      .reverse();
  } catch { return null; }
}

export const getSignal = createServerFn({ method: "GET" }).handler(async (): Promise<SignalResult> => {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) return { ok: false, error: "TWELVEDATA_API_KEY is not configured" };

  try {
    const [candles, dxyCandles] = await Promise.all([
      fetchSeries("XAU/USD", apiKey, 500),
      fetchSeries("DXY", apiKey, 80),
    ]);
    if (!candles || candles.length < 220) return { ok: false, error: "Failed to fetch sufficient XAU/USD history" };

    const closes = candles.map(c => c.close);
    const price = closes.at(-1)!;
    const prev = closes.at(-2) ?? price;
    const changeAbs = price - prev;
    const changePct = (changeAbs / prev) * 100;
    const last24 = candles.slice(-24);
    const high = Math.max(...last24.map(c => c.high));
    const low = Math.min(...last24.map(c => c.low));

    let dxyTrend: Trend = "FLAT";
    let dxyInfo: { price: number; changePct: number } | null = null;
    if (dxyCandles && dxyCandles.length > 20) {
      const dCloses = dxyCandles.map(c => c.close);
      const dEma = ema(dCloses, 20).at(-1)!;
      const dPrice = dCloses.at(-1)!;
      const dPrev = dCloses.at(-24) ?? dPrice;
      dxyTrend = dPrice > dEma * 1.0005 ? "UP" : dPrice < dEma * 0.9995 ? "DOWN" : "FLAT";
      dxyInfo = { price: +dPrice.toFixed(2), changePct: +(((dPrice - dPrev) / dPrev) * 100).toFixed(2) };
    }

    const ev = evaluateAt(candles, candles.length - 1, dxyTrend)!;
    const bt = backtest(candles, dxyTrend);

    const checks = [
      !ev.chop,
      ev.sessionOk,
      ev.h4Trend === ev.d1Trend && ev.h4Trend !== "FLAT",
      (ev.type === "BUY" && ev.sweptLow && ev.inDiscount) || (ev.type === "SELL" && ev.sweptHigh && ev.inPremium),
    ];
    const passed = checks.filter(Boolean).length;

    const macdLabel = ev.macd > 0 ? "Bullish" : "Bearish";
    const rsiLabel = ev.rsi > 70 ? "Overbought" : ev.rsi < 30 ? "Oversold" : "Neutral";

    const rationale = ev.type === "NEUTRAL"
      ? `Stand aside — ${ev.skipReason}. The edge is in waiting.`
      : `${ev.type} setup: H4+D1 bias ${ev.h4Trend}, liquidity ${ev.sweptLow ? "swept below" : "swept above"} prior swing, price in ${ev.inDiscount ? "discount" : "premium"}, ${ev.session} session. Fixed 1:3 R:R, SL beyond sweep wick.`;

    return {
      ok: true,
      price: +price.toFixed(2),
      changeAbs: +changeAbs.toFixed(2),
      changePct: +changePct.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      candles: candles.slice(-60),
      indicators: {
        rsi: +ev.rsi.toFixed(1), rsiLabel,
        ema50: +ev.ema50v.toFixed(2), ema200: +ev.ema200v.toFixed(2),
        macd: +ev.macd.toFixed(3), macdSignal: 0, macdLabel,
        atr: +ev.atr.toFixed(2),
      },
      confluence: {
        h1Trend: ev.h1Trend, h4Trend: ev.h4Trend, d1Trend: ev.d1Trend,
        session: ev.session, sessionOk: ev.sessionOk, chop: ev.chop,
        dxyTrend, dxyOk: ev.dxyOk,
        passed, total: 4,
      },
      signal: {
        type: ev.type, confidence: ev.confidence,
        entry: ev.entry, stopLoss: ev.stopLoss, takeProfit: ev.takeProfit,
        riskReward: ev.riskReward,
        id: `#${Math.floor(Date.now() / 100000) % 100000}-S`,
        rationale, skipReason: ev.skipReason,
      },
      backtest: {
        trades: bt.trades, wins: bt.wins, winRate: bt.winRate,
        avgRR: bt.avgRR, expectancy: bt.expectancy,
        profitFactor: bt.profitFactor,
        maxDrawdownR: bt.maxDrawdownR, netR: bt.netR,
      },
      history: bt.history,
      dxy: dxyInfo,
      strategy: {
        name: "SMC Liquidity Sweep + HTF Bias",
        version: "v2.0",
        notes: "H4/D1 bias → wait for sweep of opposing swing in kill zone → enter in discount/premium with 1:3 R:R, SL beyond sweep wick + 0.4 ATR.",
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
});
