import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ChapterId } from '../data/course';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type ExpenseType = 'need' | 'want' | 'saving';
export type AssetKind = 'cash' | 'savings' | 'retirement' | 'investment' | 'property' | 'other';
export type DebtKind = 'card' | 'student' | 'car' | 'mortgage' | 'medical' | 'personal' | 'other';

export interface Income { id: string; name: string; amount: number; }
export interface Expense { id: string; name: string; amount: number; type: ExpenseType; fixed: boolean; }
export interface Asset { id: string; name: string; kind: AssetKind; balance: number; }
export interface DebtItem { id: string; name: string; kind: DebtKind; balance: number; apr: number; minPayment: number; limit?: number; }
export interface Goal { id: string; name: string; target: number; saved: number; due?: string; }
export interface Checkin { id: string; date: string; assets: number; debts: number; note?: string; }

export interface MoneyData {
  version: 1;
  isSample: boolean;
  income: Income[];
  expenses: Expense[];
  assets: Asset[];
  debts: DebtItem[];
  goals: Goal[];
  checkins: Checkin[];
  extraDebtPayment: number;
}

export type ListKey = 'income' | 'expenses' | 'assets' | 'debts' | 'goals' | 'checkins';
type Item<K extends ListKey> = MoneyData[K][number];

export const EXPENSE_TYPES: Record<ExpenseType, { label: string; short: string; color: string }> = {
  need: { label: 'Need', short: 'Needs', color: 'var(--s1)' },
  want: { label: 'Want', short: 'Wants', color: 'var(--s2)' },
  saving: { label: 'Savings & debt', short: 'Savings & extra debt', color: 'var(--s3)' },
};
export const ASSET_KINDS: Record<AssetKind, string> = { cash: 'Checking / cash', savings: 'Savings (HYSA)', retirement: 'Retirement (401k, IRA)', investment: 'Investments', property: 'Home / car value', other: 'Other' };
export const DEBT_KINDS: Record<DebtKind, string> = { card: 'Credit card', student: 'Student loan', car: 'Car loan', mortgage: 'Mortgage', medical: 'Medical bill', personal: 'Personal loan', other: 'Other' };

const KEY = 'money-sandbox:my-money:v1';

export const EMPTY_MONEY: MoneyData = { version: 1, isSample: false, income: [], expenses: [], assets: [], debts: [], goals: [], checkins: [], extraDebtPayment: 100 };

export const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export const monthKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
export const dayKey = (d = new Date()) => monthKey(d) + '-' + String(d.getDate()).padStart(2, '0');
export const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/* ------------------------------------------------------------------ */
/* Sample data (a realistic early-career renter)                        */
/* ------------------------------------------------------------------ */

export function sampleData(): MoneyData {
  const now = new Date();
  const ago = (months: number) => dayKey(new Date(now.getFullYear(), now.getMonth() - months, 1));
  const inMonths = (months: number) => monthKey(new Date(now.getFullYear(), now.getMonth() + months, 1));
  const e = (name: string, amount: number, type: ExpenseType, fixed: boolean): Expense => ({ id: newId(), name, amount, type, fixed });
  return {
    version: 1,
    isSample: true,
    income: [
      { id: newId(), name: 'Paycheck (take-home)', amount: 4200 },
      { id: newId(), name: 'Weekend side gig', amount: 300 },
    ],
    expenses: [
      e('Rent', 1450, 'need', true),
      e('Utilities & internet', 160, 'need', false),
      e('Groceries', 420, 'need', false),
      e('Gas & car insurance', 230, 'need', false),
      e('Phone', 65, 'need', true),
      e('Debt minimum payments', 482, 'need', true),
      e('Dining out', 260, 'want', false),
      e('Streaming & apps', 45, 'want', true),
      e('Fun & hobbies', 200, 'want', false),
      e('Emergency fund', 300, 'saving', true),
      e('Roth IRA', 250, 'saving', true),
      e('Extra credit-card payment', 150, 'saving', true),
      e('Sinking funds (car, gifts)', 120, 'saving', true),
    ],
    assets: [
      { id: newId(), name: 'Checking', kind: 'cash', balance: 1800 },
      { id: newId(), name: 'High-yield savings', kind: 'savings', balance: 4200 },
      { id: newId(), name: 'Roth IRA', kind: 'retirement', balance: 6500 },
      { id: newId(), name: '401(k)', kind: 'retirement', balance: 11000 },
      { id: newId(), name: 'Car (resale value)', kind: 'property', balance: 9000 },
    ],
    debts: [
      { id: newId(), name: 'Credit card', kind: 'card', balance: 2400, apr: 23.9, minPayment: 72, limit: 8000 },
      { id: newId(), name: 'Student loan', kind: 'student', balance: 14500, apr: 5.2, minPayment: 165 },
      { id: newId(), name: 'Car loan', kind: 'car', balance: 7800, apr: 6.9, minPayment: 245 },
    ],
    goals: [
      { id: newId(), name: 'Emergency fund: 3 months of needs', target: 8400, saved: 4200, due: inMonths(13) },
      { id: newId(), name: 'Trip to Japan', target: 3500, saved: 900, due: inMonths(8) },
      { id: newId(), name: 'Home down payment', target: 40000, saved: 0, due: inMonths(60) },
    ],
    checkins: [
      { id: newId(), date: ago(4), assets: 28000, debts: 26900 },
      { id: newId(), date: ago(3), assets: 29100, debts: 26400 },
      { id: newId(), date: ago(2), assets: 29800, debts: 25950, note: 'Car repair came out of sinking fund' },
      { id: newId(), date: ago(1), assets: 31000, debts: 25500 },
    ],
    extraDebtPayment: 150,
  };
}

/* ------------------------------------------------------------------ */
/* Derived numbers & health check                                       */
/* ------------------------------------------------------------------ */

const sum = (xs: number[]) => xs.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

export function summarize(d: MoneyData) {
  const income = sum(d.income.map((x) => x.amount));
  const byType = { need: 0, want: 0, saving: 0 } as Record<ExpenseType, number>;
  for (const x of d.expenses) byType[x.type] += Number.isFinite(x.amount) ? x.amount : 0;
  const spending = byType.need + byType.want + byType.saving;
  const fixed = sum(d.expenses.filter((x) => x.fixed).map((x) => x.amount));
  const assets = sum(d.assets.map((x) => x.balance));
  const debts = sum(d.debts.map((x) => x.balance));
  const liquid = sum(d.assets.filter((x) => x.kind === 'cash' || x.kind === 'savings').map((x) => x.balance));
  const longTerm = sum(d.assets.filter((x) => x.kind === 'retirement' || x.kind === 'investment').map((x) => x.balance));
  const cards = d.debts.filter((x) => x.kind === 'card' && x.limit && x.limit > 0);
  const utilization = cards.length ? (sum(cards.map((c) => c.balance)) / sum(cards.map((c) => c.limit ?? 0))) * 100 : null;
  const highInterest = d.debts.filter((x) => x.apr >= 10 && x.balance > 0);
  return {
    income, byType, spending, fixed, variable: spending - fixed,
    leftover: income - spending,
    savingsRate: income > 0 ? (byType.saving / income) * 100 : 0,
    needsPct: income > 0 ? (byType.need / income) * 100 : 0,
    assets, debts, netWorth: assets - debts, liquid, longTerm,
    efMonths: byType.need > 0 ? liquid / byType.need : null,
    utilization, highInterest,
    minPayments: sum(d.debts.map((x) => x.minPayment)),
    hasAnything: d.income.length + d.expenses.length + d.assets.length + d.debts.length + d.goals.length > 0,
  };
}
export type MoneySummary = ReturnType<typeof summarize>;

export type HealthStatus = 'good' | 'warning' | 'critical' | 'info';
export interface HealthItem { id: string; status: HealthStatus; title: string; detail: string; lesson: ChapterId; }

const usd0 = (n: number) => '$' + Math.round(Math.abs(n)).toLocaleString('en-US');

export function healthCheck(d: MoneyData, s: MoneySummary): HealthItem[] {
  const items: HealthItem[] = [];
  if (s.income <= 0) {
    items.push({ id: 'income', status: 'info', title: 'Add your take-home pay', detail: 'Start with the money that actually lands in your account each month.', lesson: 'cash-flow' });
  } else if (s.leftover < -0.5) {
    items.push({ id: 'balance', status: 'critical', title: 'You plan to spend ' + usd0(s.leftover) + ' more than you earn', detail: 'That gap usually ends up on a credit card. Trim wants first.', lesson: 'cash-flow' });
  } else if (s.leftover > 0.5) {
    items.push({ id: 'balance', status: 'good', title: usd0(s.leftover) + ' a month is not assigned yet', detail: 'Assign it to savings, a goal, or planned spending.', lesson: 'cash-flow' });
  } else {
    items.push({ id: 'balance', status: 'good', title: 'Every dollar is planned', detail: 'Your plan matches your take-home pay exactly.', lesson: 'cash-flow' });
  }
  if (s.income > 0 && d.expenses.length) {
    const r = s.savingsRate;
    items.push(r >= 15
      ? { id: 'savings', status: 'good', title: 'Saving ' + Math.round(r) + '% of take-home', detail: 'That is a strong habit. 15–20% is a great long-run target.', lesson: 'cash-flow' }
      : { id: 'savings', status: 'warning', title: 'Saving ' + Math.round(r) + '% of take-home', detail: 'Try nudging it up a little at a time, aiming for 10–20%.', lesson: 'cash-flow' });
    if (s.needsPct > 60) items.push({ id: 'needs', status: 'warning', title: 'Needs take ' + Math.round(s.needsPct) + '% of take-home', detail: 'Common in pricey cities. Revisit big fixed costs when you can.', lesson: 'cash-flow' });
  }
  if (s.efMonths !== null) {
    const m = s.efMonths;
    items.push(m >= 3
      ? { id: 'ef', status: 'good', title: 'Emergency fund covers ' + m.toFixed(1) + ' months', detail: '3–6 months of needs is a solid safety net.', lesson: 'safety-net' }
      : { id: 'ef', status: 'warning', title: 'Emergency fund covers ' + m.toFixed(1) + ' months', detail: m >= 1 ? 'Starter fund done. Next stop: 3 months (' + usd0(s.byType.need * 3) + ').' : 'First milestone: one month of needs (' + usd0(s.byType.need) + ').', lesson: 'safety-net' });
  }
  if (d.debts.length) {
    items.push(s.highInterest.length
      ? { id: 'debt', status: 'warning', title: s.highInterest.length + (s.highInterest.length === 1 ? ' debt' : ' debts') + ' above 10% APR', detail: usd0(sum(s.highInterest.map((x) => x.balance))) + ' total. Paying these down is a guaranteed return.', lesson: 'safety-net' }
      : { id: 'debt', status: 'good', title: 'No high-interest debt', detail: 'Keep paying on time. Low-rate debt is less urgent.', lesson: 'safety-net' });
  }
  if (s.utilization !== null) {
    const u = s.utilization;
    items.push({ id: 'util', status: u < 30 ? 'good' : 'warning', title: 'Credit utilization: ' + Math.round(u) + '%', detail: u < 10 ? 'Excellent: under 10%.' : u < 30 ? 'Good: under 30%. Under 10% is ideal.' : 'Try to get card balances under 30% of your limits.', lesson: 'safety-net' });
  }
  if (d.assets.length) {
    items.push(s.longTerm > 0
      ? { id: 'invest', status: 'good', title: usd0(s.longTerm) + ' invested for the long term', detail: 'The longer it stays invested, the more it can grow. Keep contributions steady.', lesson: 'investing' }
      : { id: 'invest', status: 'info', title: 'Nothing invested for the long term yet', detail: 'If your job offers a 401(k) match, that is the best place to start.', lesson: 'retirement' });
  }
  return items;
}

/* ------------------------------------------------------------------ */
/* Provider                                                             */
/* ------------------------------------------------------------------ */

function load(): MoneyData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) ?? EMPTY_MONEY : EMPTY_MONEY;
  } catch {
    return EMPTY_MONEY;
  }
}

/** Accepts stored or imported JSON and returns clean data, or null if it isn't ours. */
export function normalize(x: unknown): MoneyData | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Partial<MoneyData>;
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  if (![o.income, o.expenses, o.assets, o.debts, o.goals, o.checkins].some(Array.isArray)) return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);
  const str = (v: unknown, f = '') => (typeof v === 'string' ? v : f);
  return {
    version: 1,
    isSample: Boolean(o.isSample),
    income: arr<Income>(o.income).map((i) => ({ id: str(i.id) || newId(), name: str(i.name, 'Income'), amount: num(i.amount) })),
    expenses: arr<Expense>(o.expenses).map((i) => ({ id: str(i.id) || newId(), name: str(i.name, 'Expense'), amount: num(i.amount), type: (['need', 'want', 'saving'] as const).includes(i.type) ? i.type : 'need', fixed: Boolean(i.fixed) })),
    assets: arr<Asset>(o.assets).map((i) => ({ id: str(i.id) || newId(), name: str(i.name, 'Account'), kind: i.kind in ASSET_KINDS ? i.kind : 'other', balance: num(i.balance) })),
    debts: arr<DebtItem>(o.debts).map((i) => ({ id: str(i.id) || newId(), name: str(i.name, 'Debt'), kind: i.kind in DEBT_KINDS ? i.kind : 'other', balance: num(i.balance), apr: num(i.apr), minPayment: num(i.minPayment), limit: i.limit === undefined ? undefined : num(i.limit) })),
    goals: arr<Goal>(o.goals).map((i) => ({ id: str(i.id) || newId(), name: str(i.name, 'Goal'), target: num(i.target), saved: num(i.saved), due: typeof i.due === 'string' ? i.due : undefined })),
    checkins: arr<Checkin>(o.checkins).map((i) => ({ id: str(i.id) || newId(), date: str(i.date, dayKey()), assets: num(i.assets), debts: num(i.debts), note: typeof i.note === 'string' ? i.note : undefined })),
    extraDebtPayment: num(o.extraDebtPayment ?? 100),
  };
}

interface MoneyApi {
  data: MoneyData;
  summary: MoneySummary;
  setData: (fn: (d: MoneyData) => MoneyData) => void;
  add: <K extends ListKey>(key: K, item: Omit<Item<K>, 'id'>) => void;
  update: <K extends ListKey>(key: K, id: string, patch: Partial<Item<K>>) => void;
  remove: <K extends ListKey>(key: K, id: string) => void;
  loadSample: () => void;
  replaceAll: (d: MoneyData) => void;
  clearAll: () => void;
  recordCheckin: (note?: string) => void;
}

const Ctx = createContext<MoneyApi | null>(null);

export function MoneyProvider({ children }: { children: ReactNode }) {
  const [data, setState] = useState<MoneyData>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ }
  }, [data]);
  useEffect(() => {
    const on = (e: StorageEvent) => { if (e.key === KEY) setState(load()); };
    window.addEventListener('storage', on);
    return () => window.removeEventListener('storage', on);
  }, []);

  const setData = useCallback((fn: (d: MoneyData) => MoneyData) => setState((d) => fn(d)), []);
  const add = useCallback(<K extends ListKey>(key: K, item: Omit<Item<K>, 'id'>) =>
    setState((d) => ({ ...d, [key]: [...(d[key] as Item<K>[]), { ...item, id: newId() } as Item<K>] })), []);
  const update = useCallback(<K extends ListKey>(key: K, id: string, patch: Partial<Item<K>>) =>
    setState((d) => ({ ...d, [key]: (d[key] as Item<K>[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) })), []);
  const remove = useCallback(<K extends ListKey>(key: K, id: string) =>
    setState((d) => ({ ...d, [key]: (d[key] as Item<K>[]).filter((x) => x.id !== id) })), []);
  const loadSample = useCallback(() => setState(sampleData()), []);
  const replaceAll = useCallback((d: MoneyData) => setState(d), []);
  const clearAll = useCallback(() => setState(EMPTY_MONEY), []);
  const recordCheckin = useCallback((note?: string) => setState((d) => {
    const s = summarize(d);
    const today = dayKey();
    const thisMonth = today.slice(0, 7);
    const others = d.checkins.filter((c) => c.date.slice(0, 7) !== thisMonth);
    const entry: Checkin = { id: newId(), date: today, assets: s.assets, debts: s.debts, note: note?.trim() || undefined };
    return { ...d, checkins: [...others, entry].sort((a, b) => a.date.localeCompare(b.date)) };
  }), []);

  const summary = useMemo(() => summarize(data), [data]);
  const api = useMemo<MoneyApi>(() => ({ data, summary, setData, add, update, remove, loadSample, replaceAll, clearAll, recordCheckin }),
    [data, summary, setData, add, update, remove, loadSample, replaceAll, clearAll, recordCheckin]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useMoney(): MoneyApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMoney must be used inside MoneyProvider');
  return v;
}
