/** Asset-allocation and market-dip simulation math. Teaching assumptions, not forecasts. */

export const ASSUMPTIONS = {
  stocks: { label: 'Stocks', expected: 8, vol: 16, y2008: -37, y2022: -18 },
  bonds: { label: 'Bonds', expected: 4, vol: 6, y2008: 5, y2022: -13 },
  cash: { label: 'Cash', expected: 2.5, vol: 0.5, y2008: 1.5, y2022: 1.5 },
  stockBondCorrelation: 0.1,
} as const;

export interface Mix { stocks: number; bonds: number; cash: number; }

export function mixStats(m: Mix) {
  const ws = m.stocks / 100, wb = m.bonds / 100, wc = m.cash / 100;
  const A = ASSUMPTIONS;
  const expected = ws * A.stocks.expected + wb * A.bonds.expected + wc * A.cash.expected;
  const variance =
    (ws * A.stocks.vol) ** 2 + (wb * A.bonds.vol) ** 2 + (wc * A.cash.vol) ** 2 +
    2 * ws * wb * A.stocks.vol * A.bonds.vol * A.stockBondCorrelation;
  const vol = Math.sqrt(variance);
  return {
    expected,
    vol,
    typicalLow: expected - vol,
    typicalHigh: expected + vol,
    badYear: expected - 1.65 * vol, // roughly a 1-in-20 bad year under a bell-curve assumption
    y2008: ws * A.stocks.y2008 + wb * A.bonds.y2008 + wc * A.cash.y2008,
    y2022: ws * A.stocks.y2022 + wb * A.bonds.y2022 + wc * A.cash.y2022,
  };
}

export interface DipPoint {
  month: number;
  price: number; // portfolio fund "share price", starts at 100
  invested: number;
  steady: number; // value for the steady monthly investor
  panic: number; // value for the investor who sells at the bottom, buys back after recovery
  sharesBought: number; // shares the steady investor bought this month
}

export interface DipResult {
  points: DipPoint[];
  bottomMonth: number;
  bottomPrice: number;
  priceRecoveryMonth: number | null;
  steadyRecoveryMonth: number | null; // first month after the drop when value >= total invested again
  sharesAtStart: number;
  sharesAtBottom: number;
  avgCost: number;
  avgPrice: number;
}

/**
 * Stocks fall by dipPct over 6 months, stay low 3 months, then recover in a straight line over
 * (dipPct * 0.6) months, then resume normal growth. Bonds and cash keep growing steadily. The
 * portfolio is a constant-mix fund (rebalanced monthly).
 */
export function simulateDip(p: Mix & { dipPct: number; start: number; monthly: number; months: number }): DipResult {
  const A = ASSUMPTIONS;
  const ws = p.stocks / 100, wb = p.bonds / 100, wc = p.cash / 100;
  const declineMonths = 6, floorMonths = 3;
  const recoverMonths = Math.max(6, Math.round(p.dipPct * 0.6));
  const stockAt = (m: number): number => {
    const low = 100 * (1 - p.dipPct / 100);
    const g = Math.pow(1 + A.stocks.expected / 100, 1 / 12);
    if (m <= declineMonths) return 100 - ((100 - low) * m) / declineMonths;
    if (m <= declineMonths + floorMonths) return low;
    const rStart = declineMonths + floorMonths;
    if (m <= rStart + recoverMonths) return low + ((100 - low) * (m - rStart)) / recoverMonths;
    return 100 * Math.pow(g, m - rStart - recoverMonths);
  };
  const rb = Math.pow(1 + A.bonds.expected / 100, 1 / 12) - 1;
  const rc = Math.pow(1 + A.cash.expected / 100, 1 / 12) - 1;

  let price = 100;
  const prices = [100];
  for (let m = 1; m <= p.months; m++) {
    const rs = stockAt(m) / stockAt(m - 1) - 1;
    price *= 1 + ws * rs + wb * rb + wc * rc;
    prices.push(price);
  }
  let bottomMonth = 0;
  prices.forEach((pr, i) => { if (pr < prices[bottomMonth]) bottomMonth = i; });

  let shares = p.start / 100;
  let invested = p.start;
  let panicShares = shares, panicCash = 0, panicOut = false, panicBackIn = false;
  let priceRecoveryMonth: number | null = null, steadyRecoveryMonth: number | null = null;
  let wentUnder = false;
  let totalBought = 0, totalSpent = 0, priceSum = 0;
  const points: DipPoint[] = [{ month: 0, price: 100, invested, steady: p.start, panic: p.start, sharesBought: 0 }];

  for (let m = 1; m <= p.months; m++) {
    const pr = prices[m];
    const bought = p.monthly / pr;
    shares += bought;
    invested += p.monthly;
    totalBought += bought; totalSpent += p.monthly; priceSum += pr;

    panicCash *= 1 + rc;
    if (!panicOut && m === bottomMonth) { panicCash += panicShares * pr; panicShares = 0; panicOut = true; }
    if (panicOut && !panicBackIn && pr >= 100) { panicShares += panicCash / pr; panicCash = 0; panicBackIn = true; }
    if (panicOut && !panicBackIn) panicCash += p.monthly; else panicShares += bought;

    const steady = shares * pr;
    if (steady < invested - 0.01) wentUnder = true;
    if (wentUnder && steadyRecoveryMonth === null && m > bottomMonth && steady >= invested) steadyRecoveryMonth = m;
    if (priceRecoveryMonth === null && m > bottomMonth && pr >= 100) priceRecoveryMonth = m;

    points.push({ month: m, price: pr, invested, steady, panic: panicShares * pr + panicCash, sharesBought: bought });
  }
  return {
    points,
    bottomMonth,
    bottomPrice: prices[bottomMonth],
    priceRecoveryMonth,
    steadyRecoveryMonth,
    sharesAtStart: p.monthly / 100,
    sharesAtBottom: p.monthly / prices[bottomMonth],
    avgCost: totalSpent / Math.max(totalBought, 1e-9),
    avgPrice: priceSum / Math.max(p.months, 1),
  };
}

/** After stocks drop by dipPct (bonds +1%, cash flat), what trades restore the target mix? */
export function rebalance(m: Mix, dipPct: number, total = 10_000) {
  const s = (total * m.stocks) / 100 * (1 - dipPct / 100);
  const b = (total * m.bonds) / 100 * 1.01;
  const c = (total * m.cash) / 100;
  const after = s + b + c;
  const drift = { stocks: (s / after) * 100, bonds: (b / after) * 100, cash: (c / after) * 100 };
  const target = { stocks: (after * m.stocks) / 100, bonds: (after * m.bonds) / 100, cash: (after * m.cash) / 100 };
  return {
    afterDrop: { stocks: s, bonds: b, cash: c, total: after },
    drift,
    buyStocks: target.stocks - s,
    sellBonds: b - target.bonds,
    sellCash: c - target.cash,
  };
}
