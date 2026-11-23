/** Debt payoff and credit-card minimum-payment math. Pure functions. */

export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  active: boolean;
}

export type Strategy = 'snowball' | 'avalanche' | 'minimum';

export interface PayoffResult {
  strategy: Strategy;
  months: number; // months until debt-free (capped)
  paidOff: boolean; // false if the cap was hit
  totalInterest: number;
  totalPaid: number;
  timeline: number[]; // total remaining balance at the end of each month (index 0 = start)
  order: { id: string; name: string; month: number }[];
}

export const MAX_MONTHS = 600;

function priority(debts: Debt[], strategy: Strategy): string[] {
  const list = [...debts];
  if (strategy === 'snowball') list.sort((a, b) => a.balance - b.balance || b.apr - a.apr);
  else list.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
  return list.map((d) => d.id);
}

/**
 * Snowball/avalanche keep the total monthly budget constant (sum of minimums + extra), so money
 * freed when a debt is paid off "rolls" onto the next target. 'minimum' pays only each debt's own
 * minimum and never rolls freed-up money forward.
 */
export function simulatePayoff(input: Debt[], extra: number, strategy: Strategy): PayoffResult {
  const debts = input.filter((d) => d.active && d.balance > 0);
  const bal = new Map(debts.map((d) => [d.id, d.balance]));
  const order = priority(debts, strategy);
  const budget = debts.reduce((s, d) => s + d.minPayment, 0) + (strategy === 'minimum' ? 0 : extra);
  const timeline = [debts.reduce((s, d) => s + d.balance, 0)];
  const paidOrder: PayoffResult['order'] = [];
  let totalInterest = 0, totalPaid = 0, month = 0;

  const remaining = () => [...bal.values()].reduce((s, v) => s + v, 0);

  while (remaining() > 0.005 && month < MAX_MONTHS) {
    month++;
    for (const d of debts) {
      const b = bal.get(d.id)!;
      if (b <= 0) continue;
      const interest = (b * d.apr) / 100 / 12;
      totalInterest += interest;
      bal.set(d.id, b + interest);
    }
    let pool = budget;
    for (const d of debts) {
      const b = bal.get(d.id)!;
      if (b <= 0) continue;
      const pay = Math.min(d.minPayment, b, pool);
      bal.set(d.id, b - pay);
      pool -= pay;
      totalPaid += pay;
    }
    if (strategy !== 'minimum') {
      for (const id of order) {
        if (pool <= 0) break;
        const b = bal.get(id)!;
        if (b <= 0) continue;
        const pay = Math.min(b, pool);
        bal.set(id, b - pay);
        pool -= pay;
        totalPaid += pay;
      }
    }
    for (const d of debts) {
      const b = bal.get(d.id)!;
      if (b <= 0.005 && !paidOrder.some((p) => p.id === d.id)) {
        bal.set(d.id, 0);
        paidOrder.push({ id: d.id, name: d.name, month });
      }
    }
    timeline.push(remaining());
  }
  return { strategy, months: month, paidOff: remaining() <= 0.005, totalInterest, totalPaid, timeline, order: paidOrder };
}

/** Debts whose minimum doesn't even cover the first month's interest (they'd grow forever on minimums). */
export const underwaterDebts = (debts: Debt[]) =>
  debts.filter((d) => d.active && d.balance > 0 && d.minPayment <= (d.balance * d.apr) / 100 / 12);

export interface CardPlanResult {
  months: number;
  paidOff: boolean;
  totalInterest: number;
  firstPayment: number;
  timeline: number[];
}

/**
 * Credit-card payoff. 'shrinking' = the issuer's typical minimum: interest + 1% of the balance,
 * with a $25 floor. 'fixed' = the same dollar amount every month.
 */
export function simulateCard(balance: number, apr: number, plan: { kind: 'shrinking' } | { kind: 'fixed'; amount: number }): CardPlanResult {
  const r = apr / 100 / 12;
  let b = balance, month = 0, interest = 0, first = 0;
  const timeline = [b];
  while (b > 0.005 && month < MAX_MONTHS) {
    month++;
    const i = b * r;
    interest += i;
    b += i;
    let pay = plan.kind === 'fixed' ? plan.amount : Math.max(25, i + 0.01 * (b - i));
    pay = Math.min(pay, b);
    if (month === 1) first = pay;
    b -= pay;
    timeline.push(Math.max(0, b));
  }
  return { months: month, paidOff: b <= 0.005, totalInterest: interest, firstPayment: first, timeline };
}

export type UtilizationBand = 'excellent' | 'good' | 'fair' | 'high';
export function utilizationBand(pct: number): UtilizationBand {
  if (pct < 10) return 'excellent';
  if (pct < 30) return 'good';
  if (pct < 50) return 'fair';
  return 'high';
}
