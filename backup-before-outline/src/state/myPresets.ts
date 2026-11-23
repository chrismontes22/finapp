/** Turn the learner's own My Money numbers into one-click "My numbers" presets for lesson sandboxes. */
import { DEBT_KINDS, summarize, type MoneyData } from './money';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const snap = (n: number, step: number) => Math.round(n / step) * step;

export function myBudgetPreset(d: MoneyData) {
  const s = summarize(d);
  if (s.income <= 0 || d.expenses.length === 0) return null;
  const takeHome = clamp(snap(s.income, 50), 1000, 12000);
  const max = Math.max(takeHome, 1000);
  return {
    takeHome,
    needs: clamp(snap(s.byType.need, 25), 0, max),
    wants: clamp(snap(s.byType.want, 25), 0, max),
    savings: clamp(snap(s.byType.saving, 25), 0, max),
  };
}

export function myEmergencyPreset(d: MoneyData) {
  const s = summarize(d);
  if (s.byType.need <= 0) return null;
  return { needs: clamp(snap(s.byType.need, 100), 500, 10000), saved: clamp(snap(s.liquid, 250), 0, 60000) };
}

export function myDebtPreset(d: MoneyData) {
  const real = d.debts.filter((x) => x.balance > 0);
  if (real.length === 0) return null;
  // Cards first, because the race's first slot also feeds the credit-utilization meter.
  const pick = [...real].sort((a, b) => Number(b.kind === 'card') - Number(a.kind === 'card')).slice(0, 3);
  const debts = [0, 1, 2].map((i) => {
    const x = pick[i];
    return x
      ? { id: 'd' + (i + 1), name: x.name.trim() || DEBT_KINDS[x.kind], balance: clamp(snap(x.balance, 100), 0, 30000), apr: clamp(Math.round(x.apr * 10) / 10, 0, 35), minPayment: clamp(snap(x.minPayment, 5), 10, 1000), active: true }
      : { id: 'd' + (i + 1), name: 'Not used', balance: 0, apr: 0, minPayment: 10, active: false };
  });
  const card = pick.find((x) => x.kind === 'card' && x.limit);
  const out: { debts: typeof debts; extra: number; limit?: number } = { debts, extra: clamp(snap(d.extraDebtPayment, 10), 0, 1000) };
  if (card?.limit) out.limit = clamp(snap(card.limit, 500), 1000, 40000);
  return out;
}
