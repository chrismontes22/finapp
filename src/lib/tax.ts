/** 2026 U.S. federal income tax (IRS Rev. Proc. 2025-32) plus FICA. Simplified for teaching. */

export type FilingStatus = 'single' | 'mfj';

export interface Bracket { rate: number; upTo: number; }

export const TAX_YEAR = 2026;

export const BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    { rate: 10, upTo: 12_400 },
    { rate: 12, upTo: 50_400 },
    { rate: 22, upTo: 105_700 },
    { rate: 24, upTo: 201_775 },
    { rate: 32, upTo: 256_225 },
    { rate: 35, upTo: 640_600 },
    { rate: 37, upTo: Infinity },
  ],
  mfj: [
    { rate: 10, upTo: 24_800 },
    { rate: 12, upTo: 100_800 },
    { rate: 22, upTo: 211_400 },
    { rate: 24, upTo: 403_550 },
    { rate: 32, upTo: 512_450 },
    { rate: 35, upTo: 768_700 },
    { rate: 37, upTo: Infinity },
  ],
};

export const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 16_100, mfj: 32_200 };

export const LIMITS = { k401: 24_500, ira: 7_500, hsaSelf: 4_400, hsaFamily: 8_750 };

export const FICA = { ssRate: 6.2, ssWageBase: 184_500, medicareRate: 1.45, addlMedicareRate: 0.9, addlMedicareThreshold: { single: 200_000, mfj: 250_000 } };

export interface BucketFill {
  rate: number;
  from: number;
  to: number; // Infinity for the top bracket
  filled: number; // dollars of taxable income in this bucket
  tax: number;
}

export interface TaxResult {
  gross: number;
  preTax: number;
  deduction: number;
  taxable: number;
  tax: number;
  marginal: number;
  effective: number; // tax / gross
  buckets: BucketFill[];
}

export function incomeTax(gross: number, status: FilingStatus, preTax = 0): TaxResult {
  const deduction = STANDARD_DEDUCTION[status];
  const taxable = Math.max(0, gross - preTax - deduction);
  let prev = 0, tax = 0, marginal = BRACKETS[status][0].rate;
  const buckets: BucketFill[] = BRACKETS[status].map((b) => {
    const filled = Math.max(0, Math.min(taxable, b.upTo) - prev);
    const t = (filled * b.rate) / 100;
    tax += t;
    if (taxable > prev) marginal = b.rate;
    const row = { rate: b.rate, from: prev, to: b.upTo, filled, tax: t };
    prev = b.upTo;
    return row;
  });
  return { gross, preTax, deduction, taxable, tax, marginal, effective: gross > 0 ? (tax / gross) * 100 : 0, buckets };
}

/** Employee-side FICA. Section-125 health premiums reduce FICA wages; 401(k) deferrals do not. */
export function ficaTax(wages: number, status: FilingStatus): number {
  const ss = (Math.min(wages, FICA.ssWageBase) * FICA.ssRate) / 100;
  const med = (wages * FICA.medicareRate) / 100;
  const addl = (Math.max(0, wages - FICA.addlMedicareThreshold[status]) * FICA.addlMedicareRate) / 100;
  return ss + med + addl;
}

export interface Paycheck {
  gross: number;
  federal: number;
  fica: number;
  state: number;
  retirement: number;
  health: number;
  net: number;
}

/** Annual paycheck breakdown. statePct is a flat approximation applied to state-taxable wages. */
export function paycheck(p: { gross: number; status: FilingStatus; k401Pct: number; healthMonthly: number; statePct: number }): Paycheck {
  const retirement = Math.min((p.gross * p.k401Pct) / 100, LIMITS.k401);
  const health = p.healthMonthly * 12;
  const federal = incomeTax(p.gross, p.status, retirement + health).tax;
  const fica = ficaTax(Math.max(0, p.gross - health), p.status);
  const state = (Math.max(0, p.gross - retirement - health) * p.statePct) / 100;
  const net = p.gross - federal - fica - state - retirement - health;
  return { gross: p.gross, federal, fica, state, retirement, health, net };
}

/** Before/after a raise: how much of the raise you actually keep (federal + FICA only). */
export function raiseImpact(base: number, raise: number, status: FilingStatus) {
  const before = incomeTax(base, status);
  const after = incomeTax(base + raise, status);
  const ficaBefore = ficaTax(base, status), ficaAfter = ficaTax(base + raise, status);
  const takeBefore = base - before.tax - ficaBefore;
  const takeAfter = base + raise - after.tax - ficaAfter;
  return { before, after, ficaBefore, ficaAfter, takeBefore, takeAfter, kept: takeAfter - takeBefore };
}

/** Traditional vs Roth for the same yearly contribution, invested for n years. */
export function tradVsRoth(p: { gross: number; status: FilingStatus; contribution: number; years: number; returnPct: number; retireRatePct: number }) {
  const r = p.returnPct / 100;
  const fv = r === 0 ? p.contribution * p.years : p.contribution * ((Math.pow(1 + r, p.years) - 1) / r) * (1 + r);
  const taxNow = incomeTax(p.gross, p.status).tax;
  const taxWithTrad = incomeTax(p.gross, p.status, p.contribution).tax;
  const savingsPerYear = taxNow - taxWithTrad; // what Traditional saves you in tax each year
  const marginalOnContribution = p.contribution > 0 ? (savingsPerYear / p.contribution) * 100 : 0;
  return {
    balance: fv,
    savingsPerYear,
    marginalOnContribution,
    trad: { takeHomeCost: p.contribution - savingsPerYear, afterTax: fv * (1 - p.retireRatePct / 100) },
    roth: { takeHomeCost: p.contribution, afterTax: fv },
  };
}

export const MATCH_FORMULAS = {
  '50-6': { label: '50% match on up to 6% of pay', rate: 0.5, cap: 6 },
  '100-3': { label: '100% match on up to 3% of pay', rate: 1, cap: 3 },
  '100-4': { label: '100% match on up to 4% of pay', rate: 1, cap: 4 },
  '100-6': { label: '100% match on up to 6% of pay', rate: 1, cap: 6 },
} as const;
export type MatchFormula = keyof typeof MATCH_FORMULAS;

export function employerMatch(salary: number, yourPct: number, formula: MatchFormula) {
  const f = MATCH_FORMULAS[formula];
  const yours = (salary * yourPct) / 100;
  const match = (salary * Math.min(yourPct, f.cap) * f.rate) / 100;
  const maxMatch = (salary * f.cap * f.rate) / 100;
  return { yours, match, maxMatch, missed: maxMatch - match, pctToMax: f.cap };
}
