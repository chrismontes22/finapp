import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Lock, Wallet, Scale, Target, CalendarCheck, LayoutDashboard, CircleCheck, TriangleAlert, OctagonAlert, Info, ArrowRight, Download, Upload, Trash2, Sparkles, Plus, Mountain, Snowflake } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';
import { MODULE_BY_ID } from '../data/modules';
import { useMoney, healthCheck, normalize, summarize, monthKey, monthLabel, EXPENSE_TYPES, ASSET_KINDS, DEBT_KINDS, type ExpenseType, type HealthStatus, type MoneyData } from '../state/money';
import { moduleHref, type MoneyTabId } from '../state/router';
import { simulatePayoff, type Debt } from '../lib/debt';
import { usd, pct, years, monthYear } from '../lib/format';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { ChartFrame, TooltipBox, activeDot, cursorProps, gridProps, xAxisProps, yAxisProps } from '../components/Chart';
import { SliderField } from '../components/Slider';
import { Nudge, StatGrid, StatTile } from '../components/Sim';
import { AddButton, DeleteButton, Field, NumberInput, Panel, SelectInput, TextInput } from '../components/MoneyInputs';
import { Button, cx } from '../components/ui';

export type MoneyTab = MoneyTabId;
export const MONEY_TABS: { id: MoneyTab; label: string; icon: typeof Wallet }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'net-worth', label: 'Net worth', icon: Scale },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'check-ins', label: 'Check-ins', icon: CalendarCheck },
];
const tabHref = (t: MoneyTab) => (t === 'overview' ? '#/my-money' : '#/my-money/' + t);

export default function MyMoney({ tab }: { tab: MoneyTab }) {
  const { data, summary } = useMoney();
  return (
    <div className="mx-auto max-w-5xl">
      <header className="pt-4 pb-8 sm:pt-8">
        <p className="rise-in flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-muted uppercase"><Lock className="size-3" strokeWidth={2} aria-hidden /> Private dashboard · saved only in this browser</p>
        <h1 className="rise-in mt-4 font-serif text-[48px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[60px]" style={{ animationDelay: '60ms' }}>My <em className="text-accent-text">Money</em></h1>
        <p className="rise-in mt-3 max-w-2xl text-lg leading-relaxed text-ink-2" style={{ animationDelay: '120ms' }}>
          Add your own numbers to see where you stand. Use them alongside the lessons. Nothing leaves your device.
        </p>
      </header>

      <nav id="money-tabs" aria-label="My Money sections" className="sticky top-16 z-30 -mx-4 mb-8 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div aria-hidden className="absolute inset-0 border-b border-line bg-page/80 backdrop-blur-xl" />
        <ul className="relative flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {MONEY_TABS.map((t) => (
            <li key={t.id} className="shrink-0">
              <a href={tabHref(t.id)} aria-current={tab === t.id ? 'page' : undefined}
                className={cx('inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap', tab === t.id ? 'bg-primary text-primary-ink' : 'text-muted hover:bg-surface-2 hover:text-ink')}>
                <t.icon className="size-3.5" strokeWidth={1.75} aria-hidden /> {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {data.isSample && <SampleBanner />}

      <div key={tab} className="rise-in">
        {tab === 'overview' && (summary.hasAnything ? <Overview /> : <EmptyStart />)}
        {tab === 'budget' && <Budget />}
        {tab === 'net-worth' && <NetWorth />}
        {tab === 'goals' && <Goals />}
        {tab === 'check-ins' && <Checkins />}
      </div>
    </div>
  );
}

function SampleBanner() {
  const { clearAll, setData } = useMoney();
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-accent-soft/60 px-4 py-3 text-sm">
      <Sparkles className="size-4 text-accent-text" strokeWidth={1.75} aria-hidden />
      <p className="flex-1 text-ink">You're exploring <strong>sample data</strong>. Edit anything, or start fresh with your own numbers.</p>
      <Button size="sm" variant="secondary" onClick={() => setData((d) => ({ ...d, isSample: false }))}>Keep & make it mine</Button>
      <Button size="sm" variant="primary" onClick={clearAll}>Start fresh</Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                          */
/* ------------------------------------------------------------------ */

function EmptyStart() {
  const { loadSample } = useMoney();
  const steps = [
    { n: '01', t: 'Your budget', d: 'Take-home pay and what you spend each month.', href: tabHref('budget') },
    { n: '02', t: 'Your net worth', d: 'What you own and what you owe.', href: tabHref('net-worth') },
    { n: '03', t: 'Your goals', d: 'Things you are saving for, with a target date.', href: tabHref('goals') },
  ];
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-8 shadow-soft sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-accent-soft blur-3xl" />
        <p className="relative font-serif text-[30px] leading-tight text-ink sm:text-[36px]">Start with three quick things.</p>
        <p className="relative mt-2 max-w-xl text-ink-2">Rough numbers are fine. You can change anything later, and it all stays on this device.</p>
        <ol className="relative mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n}>
              <a href={s.href} className="group flex h-full flex-col bg-surface p-5 transition-colors hover:bg-surface-2/60">
                <span className="font-serif text-[30px] leading-none text-ink/25">{s.n}</span>
                <span className="mt-4 font-medium text-ink">{s.t}</span>
                <span className="mt-1 text-sm text-ink-2">{s.d}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-text">Add it <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
              </a>
            </li>
          ))}
        </ol>
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <Button variant="secondary" icon={Sparkles} onClick={loadSample}>Explore with sample data</Button>
          <span className="text-sm text-muted">See a filled-in dashboard first, then clear it.</span>
        </div>
      </div>
      <DataTools />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                             */
/* ------------------------------------------------------------------ */

const STATUS: Record<HealthStatus, { icon: typeof Info; cls: string; label: string }> = {
  good: { icon: CircleCheck, cls: 'text-good-text', label: 'On track' },
  warning: { icon: TriangleAlert, cls: 'text-warning-text', label: 'Worth a look' },
  critical: { icon: OctagonAlert, cls: 'text-critical-text', label: 'Needs attention' },
  info: { icon: Info, cls: 'text-info-text', label: 'Next step' },
};

function Overview() {
  const { data, summary: s } = useMoney();
  const items = healthCheck(data, s);
  const split = splitSegments(s.byType, s.income);
  const trend = netWorthSeries(data, true);
  return (
    <div className="space-y-6">
      <StatGrid cols={4}>
        <StatTile label="Net worth" value={usd(s.netWorth)} sub={usd(s.assets, { compact: true }) + ' owned − ' + usd(s.debts, { compact: true }) + ' owed'} emphasis />
        <StatTile label="Left over each month" value={usd(s.leftover)} sub={s.income ? 'of ' + usd(s.income) + ' take-home' : 'add your income'} />
        <StatTile label="Savings rate" value={s.income ? pct(s.savingsRate, 0) : '—'} sub="savings & extra debt ÷ take-home" />
        <StatTile label="Emergency fund" value={s.efMonths === null ? '—' : s.efMonths.toFixed(1) + ' mo'} sub="cash ÷ monthly needs" />
      </StatGrid>

      <Panel title="Health check" subtitle="A quick read on your numbers, with the lesson that explains each one.">
        <ul className="divide-y divide-line">
          {items.map((it) => {
            const st = STATUS[it.status];
            const mod = MODULE_BY_ID[it.lesson];
            return (
              <li key={it.id} className="flex flex-wrap items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                <st.icon className={cx('mt-0.5 size-[18px] shrink-0', st.cls)} strokeWidth={1.9} aria-label={st.label} />
                <div className="min-w-[12rem] flex-1">
                  <p className="font-medium text-ink">{it.title}</p>
                  <p className="text-sm text-ink-2">{it.detail}</p>
                </div>
                <a href={moduleHref(mod.id)} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
                  Lesson {String(mod.num).padStart(2, '0')}: {mod.short} <ArrowRight className="size-3" aria-hidden />
                </a>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Where your pay goes" subtitle={s.income ? 'Your plan vs. the 50/30/20 starting point' : 'Add income and spending in Budget'}>
          {s.income > 0 ? (
            <div className="space-y-4">
              <SegmentBar segments={split} total={Math.max(s.income, s.spending)} format={usd} ariaLabel="Your monthly plan by category" markerLabel="Take-home" />
              <SegmentLegend segments={split} total={s.income} format={usd} />
              <SegmentBar height={20} total={s.income} format={usd} ariaLabel="The 50/30/20 guideline" segments={[
                { key: 'n', label: 'Needs', value: s.income * 0.5, color: 'var(--s1)' },
                { key: 'w', label: 'Wants', value: s.income * 0.3, color: 'var(--s2)' },
                { key: 's', label: 'Savings', value: s.income * 0.2, color: 'var(--s3)' },
              ]} showInside={false} />
              <p className="text-xs text-muted">Thin bar: 50% needs · 30% wants · 20% savings, a guide rather than a rule.</p>
            </div>
          ) : <EmptyHint href={tabHref('budget')} text="Add your budget" />}
        </Panel>
        <Panel title="Net worth over time" subtitle={trend.length >= 2 ? 'From your monthly check-ins' : 'Record a check-in each month to see a trend'}>
          {trend.length >= 2 ? <NetWorthChart series={trend} height={220} /> : <EmptyHint href={tabHref('check-ins')} text="Record your first check-in" />}
        </Panel>
      </div>

      {data.goals.length > 0 && (
        <Panel title="Goals" action={<a href={tabHref('goals')} className="text-sm font-medium text-accent-text hover:underline">See all</a>}>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.goals.slice(0, 3).map((g) => {
              const p = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
              return (
                <div key={g.id}>
                  <p className="truncate text-sm font-medium text-ink">{g.name}</p>
                  <p className="tnum mt-0.5 text-xs text-muted">{usd(g.saved)} of {usd(g.target)}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: p + '%' }} /></div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
      <DataTools />
    </div>
  );
}

function EmptyHint({ href, text }: { href: string; text: string }) {
  return (
    <a href={href} className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent-text">
      <Plus className="size-5" strokeWidth={1.5} aria-hidden /> {text}
    </a>
  );
}

function splitSegments(byType: Record<ExpenseType, number>, income: number): Segment[] {
  const left = income - (byType.need + byType.want + byType.saving);
  return [
    { key: 'need', label: 'Needs', value: byType.need, color: 'var(--s1)' },
    { key: 'want', label: 'Wants', value: byType.want, color: 'var(--s2)' },
    { key: 'saving', label: 'Savings & extra debt', value: byType.saving, color: 'var(--s3)' },
    ...(left > 0.5 ? [{ key: 'left', label: 'Not assigned', value: left, color: 'var(--s-neutral)', ink: 'var(--ink-2)' }] : []),
  ];
}

/* ------------------------------------------------------------------ */
/* Budget                                                               */
/* ------------------------------------------------------------------ */

const QUICK: { name: string; type: ExpenseType; fixed: boolean }[] = [
  { name: 'Rent or mortgage', type: 'need', fixed: true },
  { name: 'Groceries', type: 'need', fixed: false },
  { name: 'Utilities', type: 'need', fixed: false },
  { name: 'Transportation', type: 'need', fixed: false },
  { name: 'Phone', type: 'need', fixed: true },
  { name: 'Insurance', type: 'need', fixed: true },
  { name: 'Debt minimums', type: 'need', fixed: true },
  { name: 'Dining out', type: 'want', fixed: false },
  { name: 'Subscriptions', type: 'want', fixed: true },
  { name: 'Shopping & fun', type: 'want', fixed: false },
  { name: 'Emergency fund', type: 'saving', fixed: true },
  { name: 'Retirement', type: 'saving', fixed: true },
  { name: 'Extra debt payment', type: 'saving', fixed: true },
  { name: 'Sinking funds', type: 'saving', fixed: true },
];

function Budget() {
  const { data, summary: s, add, update, remove } = useMoney();
  const split = splitSegments(s.byType, s.income);
  const existing = new Set(data.expenses.map((e) => e.name.toLowerCase()));
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <Panel title="Income" subtitle="Monthly take-home pay: the money that actually lands in your account.">
          <div className="space-y-2">
            {data.income.map((i) => (
              <div key={i.id} className="flex items-center gap-2">
                <TextInput className="flex-1" label="Income name" value={i.name} onChange={(v) => update('income', i.id, { name: v })} />
                <NumberInput className="w-36" label={'Amount for ' + i.name} value={i.amount} onChange={(v) => update('income', i.id, { amount: v })} suffix="/mo" />
                <DeleteButton label={'Remove ' + i.name} onClick={() => remove('income', i.id)} />
              </div>
            ))}
            <AddButton onClick={() => add('income', { name: data.income.length ? 'Other income' : 'Paycheck (take-home)', amount: 0 })}>Add income</AddButton>
          </div>
        </Panel>

        <Panel title="Spending & saving" subtitle="Everything your pay goes to each month, sorted into needs, wants and savings.">
          <div className="mb-5">
            <p className="mb-2 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK.filter((q) => !existing.has(q.name.toLowerCase())).map((q) => (
                <button key={q.name} type="button" onClick={() => add('expenses', { name: q.name, amount: 0, type: q.type, fixed: q.fixed })}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
                  <span className="size-1.5 rounded-full" style={{ background: EXPENSE_TYPES[q.type].color }} aria-hidden />{q.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            {(Object.keys(EXPENSE_TYPES) as ExpenseType[]).map((type) => {
              const rows = data.expenses.filter((e) => e.type === type);
              return (
                <div key={type}>
                  <div className="mb-2 flex items-baseline justify-between border-b border-line pb-2">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink"><span className="size-2 rounded-full" style={{ background: EXPENSE_TYPES[type].color }} aria-hidden />{EXPENSE_TYPES[type].short}</p>
                    <p className="tnum text-sm text-ink-2">{usd(s.byType[type])}<span className="text-muted">/mo</span></p>
                  </div>
                  <div className="space-y-2">
                    {rows.map((e) => (
                      <div key={e.id} className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_8.5rem_10rem_auto_auto]">
                        <TextInput label="Expense name" value={e.name} onChange={(v) => update('expenses', e.id, { name: v })} className="col-span-2 sm:col-span-1" />
                        <NumberInput label={'Monthly amount for ' + e.name} value={e.amount} onChange={(v) => update('expenses', e.id, { amount: v })} />
                        <SelectInput label="Category" value={e.type} onChange={(v) => update('expenses', e.id, { type: v })} options={{ need: 'Need', want: 'Want', saving: 'Savings & debt' }} className="max-sm:order-3" />
                        <button type="button" onClick={() => update('expenses', e.id, { fixed: !e.fixed })} aria-pressed={e.fixed} title="Fixed costs stay the same each month; variable ones change."
                          className={cx('h-10 cursor-pointer rounded-xl border px-3 text-xs font-medium transition-colors max-sm:order-4', e.fixed ? 'border-line-strong bg-surface-2 text-ink' : 'border-line text-muted hover:text-ink')}>
                          {e.fixed ? 'Fixed' : 'Varies'}
                        </button>
                        <DeleteButton label={'Remove ' + e.name} onClick={() => remove('expenses', e.id)} />
                      </div>
                    ))}
                    <button type="button" onClick={() => add('expenses', { name: '', amount: 0, type, fixed: false })} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-muted transition-colors hover:text-accent-text">
                      <Plus className="size-3.5" strokeWidth={2} aria-hidden /> Add {type === 'saving' ? 'savings or extra debt payment' : EXPENSE_TYPES[type].label.toLowerCase()}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-36">
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">This month's plan</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-2">Take-home</dt><dd className="tnum font-medium text-ink">{usd(s.income)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-2">Planned</dt><dd className="tnum font-medium text-ink">{usd(s.spending)}</dd></div>
            <div className="flex items-baseline justify-between border-t border-line pt-2"><dt className="text-ink">{s.leftover >= 0 ? 'Left to assign' : 'Over by'}</dt><dd className={cx('tnum text-2xl font-semibold tracking-tight', s.leftover < -0.5 ? 'text-critical-text' : 'text-accent-text')}>{usd(Math.abs(s.leftover))}</dd></div>
          </dl>
          {s.income > 0 && (
            <div className="mt-4">
              <SegmentBar segments={split} total={Math.max(s.income, s.spending)} height={14} showInside={false} format={usd} ariaLabel="Plan by category" />
              <ul className="mt-3 space-y-1.5 text-xs">
                {split.map((x) => (
                  <li key={x.key} className="flex items-center gap-2 text-ink-2">
                    <span className="size-2 rounded-full" style={{ background: x.color }} aria-hidden />
                    <span className="flex-1">{x.label}</span>
                    <span className="tnum text-ink">{pct((x.value / s.income) * 100, 0)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-xs text-muted">Fixed {usd(s.fixed)} · Varies {usd(s.variable)}</p>
            </div>
          )}
        </div>
        {s.income > 0 && (s.leftover < -0.5
          ? <Nudge tone="critical" title="Over your take-home">Trim a want or two until "Over by" reaches $0.</Nudge>
          : s.leftover > 0.5
            ? <Nudge tone="tip" title="Give the rest a job">Unassigned money tends to vanish. Point it at a goal or savings.</Nudge>
            : <Nudge tone="good" title="Every dollar has a job">That's a zero-based budget. Nicely done.</Nudge>)}
        <a href={moduleHref('cash-flow')} className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-2 transition-colors hover:text-ink">
          <span>Refresher: Lesson 01, Budgeting</span><ArrowRight className="size-4" aria-hidden />
        </a>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Net worth                                                            */
/* ------------------------------------------------------------------ */

function NetWorth() {
  const { data, summary: s, add, update, remove, setData, recordCheckin } = useMoney();
  const [saved, setSaved] = useState(false);
  const debts: Debt[] = data.debts.map((d) => ({ id: d.id, name: d.name || DEBT_KINDS[d.kind], balance: d.balance, apr: d.apr, minPayment: d.minPayment, active: true }));
  const aval = useMemo(() => simulatePayoff(debts, data.extraDebtPayment, 'avalanche'), [data.debts, data.extraDebtPayment]); // eslint-disable-line react-hooks/exhaustive-deps
  const snow = useMemo(() => simulatePayoff(debts, data.extraDebtPayment, 'snowball'), [data.debts, data.extraDebtPayment]); // eslint-disable-line react-hooks/exhaustive-deps
  const mins = useMemo(() => simulatePayoff(debts, 0, 'minimum'), [data.debts]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasDebt = s.debts > 0;
  const len = Math.min(360, Math.max(aval.timeline.length, mins.timeline.length));
  const chart = Array.from({ length: Math.ceil(len / 2) }, (_, k) => ({ m: k * 2, aval: aval.timeline[k * 2] ?? 0, snow: snow.timeline[k * 2] ?? 0, mins: mins.timeline[k * 2] ?? 0 }));

  return (
    <div className="space-y-6">
      <StatGrid>
        <StatTile label="You own" value={usd(s.assets)} sub={data.assets.length + ' account' + (data.assets.length === 1 ? '' : 's')} />
        <StatTile label="You owe" value={usd(s.debts)} sub={data.debts.length + ' debt' + (data.debts.length === 1 ? '' : 's')} />
        <StatTile label="Net worth" value={usd(s.netWorth)} sub="own − owe" emphasis />
      </StatGrid>

      <div className="space-y-6">
        <Panel title="What you own" subtitle="Bank accounts, investments, and things you could sell.">
          <div className="space-y-2">
            {data.assets.map((a) => (
              <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_13rem_9.5rem_auto]">
                <TextInput className="max-sm:col-span-2" label="Account name" value={a.name} placeholder="e.g. Savings account" onChange={(v) => update('assets', a.id, { name: v })} />
                <SelectInput className="max-sm:col-span-2" label="Account type" value={a.kind} onChange={(v) => update('assets', a.id, { kind: v })} options={ASSET_KINDS} />
                <NumberInput label={'Balance of ' + a.name} value={a.balance} onChange={(v) => update('assets', a.id, { balance: v })} />
                <DeleteButton label={'Remove ' + a.name} onClick={() => remove('assets', a.id)} />
              </div>
            ))}
            <AddButton onClick={() => add('assets', { name: data.assets.length ? '' : 'Checking', kind: data.assets.length ? 'savings' : 'cash', balance: 0 })}>Add an account</AddButton>
          </div>
        </Panel>

        <Panel title="What you owe" subtitle="Cards and loans. APR and minimum payment power the payoff plan below.">
          <div className="grid gap-3 md:grid-cols-2">
            {data.debts.map((d) => (
              <div key={d.id} className="rounded-2xl border border-line p-3">
                <div className="flex gap-2">
                  <TextInput className="flex-1" label="Debt name" value={d.name} placeholder="e.g. Visa card" onChange={(v) => update('debts', d.id, { name: v })} />
                  <SelectInput className="w-36" label="Debt type" value={d.kind} onChange={(v) => update('debts', d.id, { kind: v })} options={DEBT_KINDS} />
                  <DeleteButton label={'Remove ' + d.name} onClick={() => remove('debts', d.id)} />
                </div>
                <div className={cx('mt-2 grid gap-2', d.kind === 'card' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
                  <Field label="Balance"><NumberInput label="Balance" value={d.balance} onChange={(v) => update('debts', d.id, { balance: v })} /></Field>
                  <Field label="APR"><NumberInput label="APR" prefix="" suffix="%" decimals={2} max={99} value={d.apr} onChange={(v) => update('debts', d.id, { apr: v })} /></Field>
                  <Field label="Min. payment"><NumberInput label="Minimum payment" value={d.minPayment} onChange={(v) => update('debts', d.id, { minPayment: v })} /></Field>
                  {d.kind === 'card' && <Field label="Credit limit"><NumberInput label="Credit limit" value={d.limit} placeholder="optional" onChange={(v) => update('debts', d.id, { limit: v || undefined })} /></Field>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3"><AddButton onClick={() => add('debts', { name: data.debts.length ? '' : 'Credit card', kind: 'card', balance: 0, apr: 0, minPayment: 0 })}>Add a debt</AddButton></div>
        </Panel>
      </div>

      {hasDebt && (
        <Panel title="Your debt-free plan" subtitle="Pay every minimum, then put one extra amount toward a single debt at a time.">
          <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="space-y-4">
              <SliderField label="Extra each month" value={data.extraDebtPayment} onChange={(v) => setData((d) => ({ ...d, extraDebtPayment: v }))} min={0} max={2000} step={10} format={(v) => usd(v)} help={'On top of ' + usd(s.minPayments) + ' in minimums.'} />
              {[{ t: 'Avalanche', sub: 'Highest APR first', icon: Mountain, r: aval }, { t: 'Snowball', sub: 'Smallest balance first', icon: Snowflake, r: snow }].map((p) => (
                <div key={p.t} className="rounded-2xl border border-line p-4">
                  <p className="flex items-center gap-2 font-medium text-ink"><p.icon className="size-4 text-muted" strokeWidth={1.75} aria-hidden />{p.t} <span className="text-xs font-normal text-muted">{p.sub}</span></p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-ink">{p.r.paidOff ? monthYear(p.r.months) : 'Over 50 years'}</p>
                  <p className="text-xs text-muted">{p.r.paidOff ? years(p.r.months) + ' · ' : ''}{usd(p.r.totalInterest)} interest</p>
                </div>
              ))}
              {mins.paidOff && <p className="text-xs text-ink-2">Minimums only: {years(mins.months)} and {usd(mins.totalInterest)} interest. The plan saves <strong className="text-ink">{usd(mins.totalInterest - Math.min(aval.totalInterest, snow.totalInterest))}</strong>.</p>}
            </div>
            <ChartFrame title="Total debt remaining" height={240} legend={[{ label: 'Avalanche', color: 'var(--s1)' }, { label: 'Snowball', color: 'var(--s2)', dashed: true }, { label: 'Minimums only', color: 'var(--s-neutral-2)' }]}
              table={{ columns: ['Month', 'Avalanche', 'Snowball', 'Minimums only'], rows: chart.filter((d) => d.m % 6 === 0).map((d) => [d.m, usd(d.aval), usd(d.snow), usd(d.mins)]) }}>
              <LineChart data={chart} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="m" type="number" domain={[0, 'dataMax']} tickFormatter={(v) => (v % 12 === 0 ? v / 12 + 'y' : '')} ticks={Array.from({ length: Math.floor(len / 12) + 1 }, (_, i) => i * 12)} {...xAxisProps} />
                <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
                <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => monthYear(Number(l))} valueFormat={(v) => usd(v)} />} />
                <Line type="monotone" dataKey="mins" name="Minimums only" stroke="var(--s-neutral-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="aval" name="Avalanche" stroke="var(--s1)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
                <Line type="monotone" dataKey="snow" name="Snowball" stroke="var(--s2)" strokeWidth={2.5} strokeDasharray="6 4" dot={false} activeDot={activeDot} isAnimationActive={false} />
              </LineChart>
            </ChartFrame>
          </div>
        </Panel>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-surface p-5 shadow-soft">
        <CalendarCheck className="size-5 text-accent-text" strokeWidth={1.75} aria-hidden />
        <p className="flex-1 text-sm text-ink-2">Save today's net worth (<strong className="text-ink">{usd(s.netWorth)}</strong>) as this month's check-in to track your progress.</p>
        <Button variant="primary" size="sm" onClick={() => { recordCheckin(); setSaved(true); }}>{saved ? 'Saved ✓' : 'Record check-in'}</Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Goals                                                                */
/* ------------------------------------------------------------------ */

function monthsUntil(due?: string): number | null {
  if (!due) return null;
  const [y, m] = due.split('-').map(Number);
  if (!y || !m) return null;
  const now = new Date();
  return y * 12 + (m - 1) - (now.getFullYear() * 12 + now.getMonth());
}

function Goals() {
  const { data, summary: s, add, update, remove } = useMoney();
  const inMonths = (n: number) => monthKey(new Date(new Date().getFullYear(), new Date().getMonth() + n, 1));
  const templates = [
    { name: 'Emergency fund: 3 months of needs', target: Math.round((s.byType.need || 2500) * 3 / 100) * 100, due: inMonths(12) },
    { name: 'Vacation', target: 3000, due: inMonths(9) },
    { name: 'Home down payment', target: 40000, due: inMonths(48) },
    { name: 'Next car', target: 10000, due: inMonths(36) },
  ].filter((t) => !data.goals.some((g) => g.name === t.name));
  const totalMonthly = data.goals.reduce((acc, g) => {
    const m = monthsUntil(g.due);
    return acc + (m && m > 0 && g.saved < g.target ? (g.target - g.saved) / m : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Add a goal</span>
        {templates.map((t) => (
          <button key={t.name} type="button" onClick={() => add('goals', { name: t.name, target: t.target, saved: 0, due: t.due })}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">
            <Plus className="size-3.5" aria-hidden /> {t.name}
          </button>
        ))}
        <button type="button" onClick={() => add('goals', { name: '', target: 1000, saved: 0, due: inMonths(12) })}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-ink">
          <Plus className="size-3.5" aria-hidden /> Custom goal
        </button>
      </div>

      {data.goals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line-strong p-10 text-center">
          <p className="font-serif text-[26px] text-ink">What are you saving for?</p>
          <p className="mt-1 text-sm text-ink-2">Pick a template above or make your own. Each goal shows what to save per month.</p>
        </div>
      ) : (
        <>
          {totalMonthly > 0 && <p className="text-sm text-ink-2">To hit every goal on time, save about <strong className="text-ink">{usd(totalMonthly)}/month</strong> in total.{s.income > 0 ? ' Your budget has ' + usd(s.byType.saving) + '/month in savings.' : ''}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {data.goals.map((g) => {
              const p = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
              const m = monthsUntil(g.due);
              const left = Math.max(0, g.target - g.saved);
              const status = left <= 0 ? 'Goal reached. Well done!' : m === null ? 'Add a target month to see a monthly amount.' : m <= 0 ? 'Target month has passed. Pick a new date?' : 'Save ' + usd(left / m) + '/month for ' + m + ' month' + (m === 1 ? '' : 's');
              return (
                <div key={g.id} className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
                  <div className="flex items-start gap-2">
                    <input aria-label="Goal name" value={g.name} placeholder="Name your goal" onChange={(e) => update('goals', g.id, { name: e.target.value })}
                      className="min-w-0 flex-1 rounded-lg bg-transparent px-1 font-serif text-[22px] leading-tight text-ink outline-none placeholder:text-muted/60 hover:bg-surface-2/60 focus:bg-surface-2/60" />
                    <DeleteButton label={'Remove goal ' + g.name} onClick={() => remove('goals', g.id)} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3"><div className={cx('h-full rounded-full transition-[width] duration-700', p >= 100 ? 'bg-[color:var(--good)]' : 'bg-accent')} style={{ width: p + '%' }} /></div>
                    <span className="tnum w-10 text-right text-sm font-medium text-ink">{Math.round(p)}%</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Field label="Saved"><NumberInput label="Saved so far" value={g.saved} onChange={(v) => update('goals', g.id, { saved: v })} /></Field>
                    <Field label="Target"><NumberInput label="Target amount" value={g.target} onChange={(v) => update('goals', g.id, { target: v })} /></Field>
                    <Field label="By">
                      <label className="flex h-10 items-center rounded-xl border border-line bg-surface px-2 text-sm focus-within:border-accent">
                        <span className="sr-only">Target month</span>
                        <input type="month" value={g.due ?? ''} onChange={(e) => update('goals', g.id, { due: e.target.value || undefined })} className="w-full min-w-0 bg-transparent text-ink outline-none" />
                      </label>
                    </Field>
                  </div>
                  <p className={cx('mt-3 text-sm', left <= 0 ? 'text-good-text' : 'text-ink-2')}>{status}{g.due && left > 0 && m !== null && m > 0 ? ' (by ' + monthLabel(g.due) + ')' : ''}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Check-ins                                                            */
/* ------------------------------------------------------------------ */

function netWorthSeries(d: MoneyData, withNow = false) {
  const pts = [...d.checkins].sort((a, b) => a.date.localeCompare(b.date)).map((c) => ({ id: c.id, date: c.date, label: monthLabel(c.date.slice(0, 7)), net: c.assets - c.debts, assets: c.assets, debts: c.debts, note: c.note, live: false }));
  if (withNow && pts.length && !d.checkins.some((c) => c.date.slice(0, 7) === monthKey())) {
    const s = summarize(d);
    if (s.assets || s.debts) pts.push({ id: 'now', date: monthKey() + '-01', label: 'Now', net: s.netWorth, assets: s.assets, debts: s.debts, note: undefined, live: true });
  }
  return pts;
}

function NetWorthChart({ series, height }: { series: ReturnType<typeof netWorthSeries>; height: number }) {
  return (
    <ChartFrame title="Net worth" subtitle={series.filter((p) => !p.live).length + ' check-ins' + (series.some((p) => p.live) ? ' + today' : '')} height={height}
      table={{ columns: ['Month', 'Own', 'Owe', 'Net worth'], rows: series.map((p) => [p.label, usd(p.assets), usd(p.debts), usd(p.net)]) }}>
      <AreaChart data={series} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="nw-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--s1)" stopOpacity={0.22} />
            <stop offset="1" stopColor="var(--s1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} domain={['auto', 'auto']} />
        <Tooltip cursor={cursorProps} content={<TooltipBox valueFormat={(v) => usd(v)} />} />
        <Area type="monotone" dataKey="net" name="Net worth" stroke="var(--s1)" strokeWidth={2.5} fill="url(#nw-fill)" activeDot={activeDot} isAnimationActive={false} />
      </AreaChart>
    </ChartFrame>
  );
}

function Checkins() {
  const { data, summary: s, recordCheckin, remove } = useMoney();
  const [note, setNote] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const series = netWorthSeries(data, true);
  const history = netWorthSeries(data);
  const thisMonth = monthKey();
  const existing = data.checkins.find((c) => c.date.slice(0, 7) === thisMonth);
  const first = history[0];
  const change = first ? s.netWorth - first.net : 0;
  return (
    <div className="space-y-6">
      <Panel title={'Check-in for ' + monthLabel(thisMonth)} subtitle="Once a month, save a snapshot of your net worth. Watching the line climb is a great motivator.">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <div className="rounded-2xl bg-surface-2/60 px-4 py-3">
              <p className="text-xs text-muted">Net worth right now</p>
              <p className="tnum text-2xl font-semibold tracking-tight text-ink">{usd(s.netWorth)}</p>
            </div>
            <Field label="Note (optional)"><TextInput label="Note" value={note} placeholder="e.g. Paid off the store card" onChange={setNote} /></Field>
          </div>
          <Button variant="primary" onClick={() => { recordCheckin(note); setNote(''); setJustSaved(true); }}>
            {justSaved ? 'Saved ✓' : existing ? 'Update this month' : 'Save check-in'}
          </Button>
        </div>
        {!s.hasAnything && <p className="mt-3 text-sm text-muted">Tip: add your accounts and debts in <a className="text-accent-text underline-offset-4 hover:underline" href={tabHref('net-worth')}>Net worth</a> first.</p>}
      </Panel>

      {series.length >= 2 && first && (
        <>
          <Nudge tone={change >= 0 ? 'good' : 'info'} title={(change >= 0 ? 'Up ' : 'Down ') + usd(Math.abs(change)) + ' since ' + first.label}>
            {change >= 0 ? 'Progress, one month at a time. Keep checking in.' : 'Dips happen: a big purchase, a market drop. The long-run trend is what matters.'}
          </Nudge>
          <NetWorthChart series={series} height={260} />
        </>
      )}

      {history.length > 0 && (
        <Panel title="History">
          <ul className="divide-y divide-line">
            {[...history].reverse().map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-24 text-sm font-medium text-ink">{p.label}</span>
                <span className="tnum flex-1 text-sm text-ink-2">{usd(p.net)} <span className="text-muted">({usd(p.assets, { compact: true })} − {usd(p.debts, { compact: true })})</span>{p.note && <span className="block text-xs text-muted">{p.note}</span>}</span>
                <DeleteButton label={'Delete check-in for ' + p.label} onClick={() => remove('checkins', p.id)} />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Backup, restore, clear                                               */
/* ------------------------------------------------------------------ */

function DataTools() {
  const { data, replaceAll, clearAll, summary } = useMoney();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<ReactNode>(null);
  const [confirm, setConfirm] = useState(false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'money-sandbox-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMsg('Backup downloaded. Keep it somewhere safe.');
  };
  const importJson = async (f: File) => {
    try {
      const parsed = normalize(JSON.parse(await f.text()));
      if (!parsed) { setMsg('That file does not look like a Money Sandbox backup.'); return; }
      replaceAll({ ...parsed, isSample: false });
      setMsg('Backup restored.');
    } catch {
      setMsg('Could not read that file.');
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-surface-2/40 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Lock className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
        <p className="mr-auto text-sm text-ink-2">Your data lives only in this browser. Back it up to move it to another device.</p>
        <Button size="sm" variant="secondary" icon={Download} onClick={exportJson} disabled={!summary.hasAnything && data.checkins.length === 0}>Export backup</Button>
        <Button size="sm" variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>Import backup</Button>
        {confirm ? (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Button size="sm" variant="primary" className="!bg-critical !text-white" onClick={() => { clearAll(); setConfirm(false); setMsg('All My Money data cleared.'); }}>Yes, erase it</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
          </span>
        ) : (
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirm(true)} disabled={!summary.hasAnything && data.checkins.length === 0}>Clear all</Button>
        )}
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
      </div>
      {msg && <p className="mt-2 text-xs text-ink-2" role="status">{msg}</p>}
    </div>
  );
}

