/** Compounding, savings, inflation, fee-drag and cost-of-waiting math. Pure functions, no React. */

/** Convert an effective annual rate (%) to the equivalent monthly rate (decimal). */
export const monthlyRate = (annualPct: number) => Math.pow(1 + annualPct / 100, 1 / 12) - 1;

export interface SavingsPoint {
  month: number;
  year: number;
  deposited: number;
  nominal: number;
  real: number;
}

/** Module 2: savings account balance vs. purchasing power. Deposits land at the end of each month. */
export function simulateSavings(p: { start: number; monthly: number; apy: number; inflation: number; years: number }): SavingsPoint[] {
  const r = monthlyRate(p.apy);
  const months = Math.round(p.years * 12);
  const out: SavingsPoint[] = [{ month: 0, year: 0, deposited: p.start, nominal: p.start, real: p.start }];
  let bal = p.start;
  let dep = p.start;
  for (let m = 1; m <= months; m++) {
    bal = bal * (1 + r) + p.monthly;
    dep += p.monthly;
    const deflator = Math.pow(1 + p.inflation / 100, m / 12);
    out.push({ month: m, year: m / 12, deposited: dep, nominal: bal, real: bal / deflator });
  }
  return out;
}

export interface WaitingPoint {
  age: number;
  a: number;
  b: number;
  aContrib: number;
  bContrib: number;
}

/** Module 4: Person A invests from aStart to switchAge then stops; Person B invests from switchAge to endAge. */
export function simulateWaiting(p: { monthly: number; returnPct: number; aStart: number; switchAge: number; endAge: number }): WaitingPoint[] {
  const r = monthlyRate(p.returnPct);
  const out: WaitingPoint[] = [{ age: p.aStart, a: 0, b: 0, aContrib: 0, bContrib: 0 }];
  let a = 0, b = 0, ac = 0, bc = 0;
  const totalMonths = (p.endAge - p.aStart) * 12;
  for (let m = 1; m <= totalMonths; m++) {
    const ageAtStartOfMonth = p.aStart + (m - 1) / 12;
    a *= 1 + r;
    b *= 1 + r;
    if (ageAtStartOfMonth < p.switchAge) { a += p.monthly; ac += p.monthly; }
    else { b += p.monthly; bc += p.monthly; }
    if (m % 12 === 0) out.push({ age: p.aStart + m / 12, a, b, aContrib: ac, bContrib: bc });
  }
  return out;
}

export interface SimpleCompoundPoint { year: number; simple: number; compound: number; }

export const FREQUENCIES = { annually: 1, quarterly: 4, monthly: 12, daily: 365 } as const;
export type Frequency = keyof typeof FREQUENCIES;

/** Module 4 mini: simple vs compound interest on a lump sum. Rate is a nominal annual rate compounded n times/yr. */
export function simpleVsCompound(principal: number, ratePct: number, yrs: number, freq: Frequency): SimpleCompoundPoint[] {
  const n = FREQUENCIES[freq];
  const r = ratePct / 100;
  const out: SimpleCompoundPoint[] = [];
  for (let y = 0; y <= yrs; y++) {
    out.push({ year: y, simple: principal * (1 + r * y), compound: principal * Math.pow(1 + r / n, n * y) });
  }
  return out;
}

export const ruleOf72 = (ratePct: number) => (ratePct > 0 ? 72 / ratePct : Infinity);
export const exactDoubling = (ratePct: number) => (ratePct > 0 ? Math.log(2) / Math.log(1 + ratePct / 100) : Infinity);

export interface FeePoint { year: number; low: number; high: number; contributed: number; noFee: number; }

/** Module 5: same contributions, two different annual fees (expense ratios). */
export function simulateFees(p: { monthly: number; years: number; gross: number; feeLow: number; feeHigh: number; start?: number }): FeePoint[] {
  const start = p.start ?? 0;
  const factor = (fee: number) => Math.pow((1 + p.gross / 100) * (1 - fee / 100), 1 / 12) - 1;
  const rl = factor(p.feeLow), rh = factor(p.feeHigh), r0 = factor(0);
  let low = start, high = start, none = start, c = start;
  const out: FeePoint[] = [{ year: 0, low, high, contributed: c, noFee: none }];
  for (let m = 1; m <= p.years * 12; m++) {
    low = low * (1 + rl) + p.monthly;
    high = high * (1 + rh) + p.monthly;
    none = none * (1 + r0) + p.monthly;
    c += p.monthly;
    if (m % 12 === 0) out.push({ year: m / 12, low, high, contributed: c, noFee: none });
  }
  return out;
}

/* ---------- Seeded randomness for the diversification demo ---------- */

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function normalPair(rand: () => number): [number, number] {
  let u = 0;
  while (u === 0) u = rand();
  const v = rand();
  const mag = Math.sqrt(-2 * Math.log(u));
  return [mag * Math.cos(2 * Math.PI * v), mag * Math.sin(2 * Math.PI * v)];
}

export interface ChefPoint { year: number; index: number; stock: number; }

export const CHEF_ASSUMPTIONS = { expected: 0.08, indexVol: 0.15, stockVol: 0.32, correlation: 0.45 };

/** Module 5 mini: one company's stock vs. the whole index, same expected return, very different risk. */
export function simulateChef(seed: number, start: number, yrs: number): ChefPoint[] {
  const { expected, indexVol, stockVol, correlation } = CHEF_ASSUMPTIONS;
  const rand = mulberry32(seed * 7919 + 17);
  const mu = Math.log(1 + expected) / 12;
  const si = indexVol / Math.sqrt(12), ss = stockVol / Math.sqrt(12);
  let idx = start, stk = start;
  const out: ChefPoint[] = [{ year: 0, index: idx, stock: stk }];
  for (let m = 1; m <= yrs * 12; m++) {
    const [z1, z2] = normalPair(rand);
    const zs = correlation * z1 + Math.sqrt(1 - correlation * correlation) * z2;
    idx *= Math.exp(mu - (si * si) / 2 + si * z1);
    stk *= Math.exp(mu - (ss * ss) / 2 + ss * zs);
    if (m % 12 === 0) out.push({ year: m / 12, index: idx, stock: stk });
  }
  return out;
}

export function chefOdds(trials: number, yrs: number): { beatIndex: number; lostMoney: number; halved: number } {
  let beat = 0, lost = 0, halved = 0;
  for (let s = 1; s <= trials; s++) {
    const pts = simulateChef(s, 10000, yrs);
    const last = pts[pts.length - 1];
    if (last.stock > last.index) beat++;
    if (last.stock < 10000) lost++;
    if (last.stock < 5000) halved++;
  }
  return { beatIndex: beat, lostMoney: lost, halved };
}
