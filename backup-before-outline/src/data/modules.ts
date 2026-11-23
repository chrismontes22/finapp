import type { LucideIcon } from 'lucide-react';
import { Wallet, Landmark, CreditCard, Sprout, Layers, Receipt, Scale, House } from 'lucide-react';

export type ModuleId =
  | 'cash-flow'
  | 'banking'
  | 'credit-debt'
  | 'compounding'
  | 'investing'
  | 'taxes'
  | 'risk'
  | 'big-decisions';

export interface ModuleMeta {
  id: ModuleId;
  num: number;
  tier: 1 | 2;
  title: string;
  short: string;
  blurb: string;
  icon: LucideIcon;
  minutes: number;
  sandboxName: string;
  /** number of Decision Check scenarios (kept here so the home page needn't load module code) */
  quizCount: number;
}

export const MODULES: ModuleMeta[] = [
  { id: 'cash-flow', num: 1, tier: 1, title: 'Cash Flow & Realistic Budgeting', short: 'Budgeting', blurb: 'Gross vs. take-home pay, the 50/30/20 starting point, and sinking funds that turn "emergencies" into plans.', icon: Wallet, minutes: 15, sandboxName: 'Paycheck Allocator', quizCount: 3 },
  { id: 'banking', num: 2, tier: 1, title: 'Banking, Emergency Funds & Inflation', short: 'Banking & Inflation', blurb: 'Where to park cash, how big your safety net should be, and why a 0.01% account quietly loses money.', icon: Landmark, minutes: 15, sandboxName: 'Inflation vs. Savings Visualizer', quizCount: 3 },
  { id: 'credit-debt', num: 3, tier: 1, title: 'Credit Scores & Debt Mechanics', short: 'Credit & Debt', blurb: 'The five credit-score factors, the minimum-payment trap, and Snowball vs. Avalanche payoff plans.', icon: CreditCard, minutes: 20, sandboxName: 'Debt Payoff Race', quizCount: 3 },
  { id: 'compounding', num: 4, tier: 1, title: 'Time Value of Money & Compounding', short: 'Compounding', blurb: 'Simple vs. compound growth, the Rule of 72, and why starting early beats contributing more.', icon: Sprout, minutes: 15, sandboxName: 'Cost of Waiting Simulator', quizCount: 3 },
  { id: 'investing', num: 5, tier: 2, title: 'Investing Building Blocks', short: 'Investing Basics', blurb: 'Stocks, bonds, ETFs and index funds, why diversification matters, and how tiny fees compound against you.', icon: Layers, minutes: 20, sandboxName: 'Fee Drag Calculator', quizCount: 3 },
  { id: 'taxes', num: 6, tier: 2, title: 'Tax Brackets & Account Types', short: 'Taxes & Accounts', blurb: 'Marginal vs. effective rates, Traditional vs. Roth, the 401(k) match, and the HSA triple tax advantage.', icon: Receipt, minutes: 20, sandboxName: 'Tax Bucket & Account Visualizer', quizCount: 3 },
  { id: 'risk', num: 7, tier: 2, title: 'Risk, Asset Allocation & Rebalancing', short: 'Risk & Allocation', blurb: 'Volatility vs. permanent loss, picking a stock/bond mix, rebalancing, and investing through a downturn.', icon: Scale, minutes: 20, sandboxName: 'Portfolio Mix & Market Drop Simulator', quizCount: 3 },
  { id: 'big-decisions', num: 8, tier: 2, title: 'Major Decisions: Housing, Auto & Insurance', short: 'Big Decisions', blurb: 'Rent vs. buy beyond the clichés, the true cost of a car, and choosing insurance deductibles.', icon: House, minutes: 25, sandboxName: 'Rent vs. Buy Breakeven Explorer', quizCount: 3 },
];

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m])) as Record<ModuleId, ModuleMeta>;

export const nextModule = (id: ModuleId): ModuleMeta | undefined => {
  const i = MODULES.findIndex((m) => m.id === id);
  return MODULES[i + 1];
};
export const prevModule = (id: ModuleId): ModuleMeta | undefined => {
  const i = MODULES.findIndex((m) => m.id === id);
  return i > 0 ? MODULES[i - 1] : undefined;
};
