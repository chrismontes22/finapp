import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowDownToLine, Calculator, CalendarCheck, CircleCheck, CreditCard, Landmark, Receipt, Repeat, Scale, Sunrise, TrendingUp, Wallet,
} from 'lucide-react';
import { ChapterLayout } from '../components/ChapterLayout';
import { Term } from '../components/Glossary';
import { Bullets, Example, GoDeeper, H3, Mistakes, P, Steps } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { ChartFrame, activeDot, cursorProps, gridProps, TooltipBox, xAxisProps, yAxisProps } from '../components/Chart';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { COLUMN_RADIUS, MAX_BAR, columnLabel, endLabel, Figure, FlowDiagram } from '../components/Figure';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { monthlyRate } from '../lib/growth';
import { usd } from '../lib/format';

/* ------------------------------------------------------------------ */
/* Shared math                                                         */
/* ------------------------------------------------------------------ */

/** Months of saving needed for the balance to reach the target, or null if it takes more than 80 years. */
function monthsToTarget(start: number, monthly: number, annualPct: number, target: number): number | null {
  const r = monthlyRate(annualPct);
  let bal = start;
  for (let m = 0; m <= 960; m++) {
    if (bal >= target) return m;
    bal = bal * (1 + r) + monthly;
  }
  return null;
}

/** Year-end balances for the first `years` years. */
function balancesByYear(start: number, monthly: number, annualPct: number, years: number): number[] {
  const r = monthlyRate(annualPct);
  const out = [start];
  let bal = start;
  for (let m = 1; m <= years * 12; m++) {
    bal = bal * (1 + r) + monthly;
    if (m % 12 === 0) out.push(bal);
  }
  return out;
}

const yrsText = (months: number | null) => {
  if (months === null) return '80+ years';
  if (months === 0) return 'Already there';
  return (months / 12).toFixed(1) + ' years';
};

/* ================================================================== */
/* 9.1 What financial independence means                               */
/* ================================================================== */

function FiFlowDiagram() {
  return (
    <Figure
      kind="diagram"
      title="How financial independence pays for your life"
      subtitle="An example with $1,200,000 invested and $4,000 of monthly expenses."
      howToRead={[
        'Read the boxes from left to right. Each box feeds the next one.',
        'The first box is the money you have invested. The second is the share you withdraw each year.',
        'The third box is what that withdrawal covers. The last box is the result.',
      ]}
      takeaway={<>A 4% withdrawal from <strong>$1,200,000</strong> is <strong>$48,000 a year</strong>, which equals $4,000 a month. When investments cover your expenses, you choose whether to keep your current job.</>}
      note="Illustrative. Uses the rough 4% guideline explained in 9.2. Not a guarantee."
    >
      <FlowDiagram label="Investments, then a 4 percent yearly withdrawal, then living expenses covered, then work is optional" steps={[
        { icon: Landmark, title: 'Investments', amount: '$1,200,000', detail: 'Held in index funds and retirement accounts.' },
        { icon: ArrowDownToLine, title: 'Withdraw about 4% a year', amount: '$48,000', detail: 'The first year. Later years adjust for rising prices.' },
        { icon: Receipt, title: 'Covers living expenses', amount: '$4,000/month', detail: 'Rent, food, insurance, transportation and the rest.' },
        { icon: Sunrise, title: 'Work is optional', detail: 'Keep working, change to work you enjoy, work fewer hours or stop.', emphasis: true },
      ]} />
    </Figure>
  );
}

const SAVE_RATES = [10, 20, 30, 40, 50, 60, 70];
const FI_ASSUMED_INCOME = 60000;
const FI_YEARS = SAVE_RATES.map((rate) => {
  const income = FI_ASSUMED_INCOME;
  const spending = income * (1 - rate / 100);
  const m = monthsToTarget(0, (income * rate) / 100 / 12, 5, 25 * spending);
  return { rate, label: rate + '%', years: m === null ? 80 : Math.round((m / 12) * 10) / 10 };
});

function SavingsRateChart() {
  const at = (r: number) => FI_YEARS.find((d) => d.rate === r)!.years;
  return (
    <Figure
      title="The more you save, the sooner work becomes optional"
      subtitle="Years of saving needed to reach 25 times yearly spending, starting from $0."
      height={280}
      table={{ columns: ['Savings rate', 'Years to financial independence'], rows: FI_YEARS.map((d) => [d.label, d.years.toFixed(1)]) }}
      howToRead={[
        'The bottom axis is the share of income you save. The side axis is the number of years until you reach financial independence.',
        'Each column is one savings rate. The number on top is the years.',
        'Taller columns mean a longer wait. Compare the 10% column with the 50% column.',
      ]}
      takeaway={<>Saving 10% takes about <strong>{at(10).toFixed(0)} years</strong>. Saving 50% takes about <strong>{at(50).toFixed(0)} years</strong>. A higher savings rate helps twice: you invest more, and you need less, because you spend less.</>}
      note="Illustrative. Assumes you start at $0, earn a 5% average yearly return after inflation, and need 25 times your yearly spending, where spending is your income minus what you save. The result does not depend on the income amount."
    >
      <BarChart data={FI_YEARS} margin={{ top: 24, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...xAxisProps} />
        <YAxis tickFormatter={(v) => v + ' yrs'} {...yAxisProps} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox labelFormat={(l) => 'Saving ' + l + ' of income'} valueFormat={(v) => v.toFixed(1) + ' years'} />} />
        <Bar dataKey="years" name="Years to financial independence" fill="var(--s1)" radius={COLUMN_RADIUS} maxBarSize={MAX_BAR * 2} isAnimationActive={false} label={columnLabel((v) => v.toFixed(0) + ' yrs')} />
      </BarChart>
    </Figure>
  );
}

const SR_DEFAULTS = { income: 60000, rate: 20, ret: 5 };
type SrState = typeof SR_DEFAULTS;
const SR_PRESETS: Preset<SrState>[] = [
  { label: 'Saves 10%', values: { rate: 10 } },
  { label: 'Saves 30%', values: { rate: 30 } },
  { label: 'Saves 50%', values: { rate: 50 } },
];
const SR_GUIDE: SimGuide<SrState> = {
  how: ['Enter your yearly take-home pay.', 'Set the share of it you save and invest.', 'Read your spending, your target and the years it takes.'],
  tryThis: [
    { label: 'Raise the savings rate from 20% to 40%. How many years does it save?', done: (s) => s.rate >= 40 },
    { label: 'Lower the return to 3%. Does the wait get longer?', done: (s) => s.ret <= 3 },
  ],
};

function SavingsRateSim() {
  const sim = useSim(SR_DEFAULTS);
  const s = sim.state;
  const spending = s.income * (1 - s.rate / 100);
  const saved = s.income - spending;
  const target = 25 * spending;
  const months = useMemo(() => monthsToTarget(0, saved / 12, s.ret, target), [saved, s.ret, target]);
  const segs: Segment[] = [
    { key: 'spend', label: 'Spending', value: spending, color: 'var(--s2)' },
    { key: 'save', label: 'Saved and invested', value: saved, color: 'var(--s1)' },
  ];
  return (
    <SimCard title="Savings Rate to Freedom" kind="Mini sandbox" icon={TrendingUp} sim={sim} presets={SR_PRESETS} guide={SR_GUIDE}
      subtitle="See how your savings rate sets the number of years until work is optional.">
      <SimGrid controls={
        <ControlGroup title="Your numbers">
          <SliderField label="Yearly take-home pay" value={s.income} onChange={sim.set('income')} min={20000} max={200000} step={1000} format={(v) => usd(v)} />
          <SliderField label="Share you save and invest" value={s.rate} onChange={sim.set('rate')} min={5} max={80} step={1} format={(v) => v + '%'} />
          <SliderField label="Average yearly return after inflation" value={s.ret} onChange={sim.set('ret')} min={2} max={8} step={0.5} format={(v) => v.toFixed(1) + '%'} help="5% is a common planning assumption, not a promise." />
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="Yearly spending" value={usd(spending)} sub={usd(spending / 12) + ' a month'} />
          <StatTile label="Target (25 × spending)" value={usd(target)} />
          <StatTile label="Years to reach it" value={yrsText(months)} sub="starting from $0" emphasis />
        </StatGrid>
        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Where {usd(s.income)} a year goes</p>
          <SegmentBar segments={segs} total={s.income} format={usd} height={28} ariaLabel="Share of income spent and saved" />
          <SegmentLegend segments={segs} total={s.income} format={usd} />
        </div>
        {months !== null && months > 40 * 12 ? (
          <Nudge tone="info" title="A long wait">Saving {s.rate}% takes more than 40 years. Raise your savings rate, lower your spending, or raise your income. Each helps.</Nudge>
        ) : (
          <Nudge tone="good" title={'About ' + yrsText(months)}>Spending less shortens the wait in two ways: you invest more each year, and your target is smaller.</Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 9.2 How much is enough?                                             */
/* ================================================================== */

const FI_NUMBERS = [3000, 4000, 5000].map((m) => ({ label: usd(m) + ' a month', monthly: m, yearly: m * 12, fi: m * 12 * 25 }));

function FiNumberChart() {
  return (
    <Figure
      title="Your FI number grows with your spending"
      subtitle="Yearly expenses multiplied by 25, for three monthly spending levels."
      height={260}
      table={{ columns: ['Monthly expenses', 'Yearly expenses', 'FI number (× 25)'], rows: FI_NUMBERS.map((d) => [usd(d.monthly), usd(d.yearly), usd(d.fi)]) }}
      howToRead={[
        'Each column is one level of monthly spending. The side axis is the amount you need invested.',
        'The number on top is the amount: yearly expenses times 25.',
        'Switch to Table to see monthly and yearly expenses next to each target.',
      ]}
      takeaway={<>Every extra <strong>$1,000 of monthly spending</strong> adds <strong>$300,000</strong> to the amount you need: $12,000 a year × 25.</>}
      note="Uses the rough 25× guideline, which equals a 4% first-year withdrawal. Illustrative, not a guarantee."
    >
      <BarChart data={FI_NUMBERS} margin={{ top: 24, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v)} />} />
        <Bar dataKey="fi" name="FI number" fill="var(--s1)" radius={COLUMN_RADIUS} maxBarSize={MAX_BAR * 2} isAnimationActive={false} label={columnLabel((v) => usd(v, { compact: true }))} />
      </BarChart>
    </Figure>
  );
}

function CutDiagram() {
  return (
    <Figure
      kind="diagram"
      title="What cutting $100 a month does to your target"
      howToRead={[
        'Read left to right. Each box is one step of the math.',
        'A permanent monthly expense is a bill you expect to keep paying every year.',
        'The same steps work for any amount: multiply by 12, then by 25.',
      ]}
      takeaway={<>Cutting <strong>$100 a month</strong> from permanent expenses lowers the amount you need by <strong>$30,000</strong>. A $300 cut lowers it by $90,000.</>}
      note="Uses the 25× guideline."
    >
      <FlowDiagram label="Cut 100 dollars a month, which is 1,200 dollars a year, times 25 is 30,000 dollars less needed" steps={[
        { icon: Wallet, title: 'Cut from permanent expenses', amount: '$100/month', detail: 'A subscription bundle, a cheaper phone plan, a lower car payment.' },
        { icon: Repeat, title: 'Times 12 months', amount: '$1,200/year' },
        { icon: Calculator, title: 'Times 25', amount: '$30,000' },
        { icon: Scale, title: 'Less you need invested', amount: '−$30,000', emphasis: true, detail: 'You reach the target sooner.' },
      ]} />
    </Figure>
  );
}

const FN_DEFAULTS = { expenses: 4000, cut: 0, start: 50000, monthly: 1500, ret: 5, rate: 4 };
type FnState = typeof FN_DEFAULTS;
const FN_PRESETS: Preset<FnState>[] = [
  { label: 'Starting out', values: { expenses: 3500, start: 5000, monthly: 600 } },
  { label: 'Mid-career', values: { expenses: 5000, start: 150000, monthly: 2500 } },
  { label: 'Cut $300 a month', values: { cut: 300 } },
];
const FN_GUIDE: SimGuide<FnState> = {
  how: ['Enter your monthly expenses and what you have invested.', 'Set how much you invest each month and the return you assume.', 'Read your FI number and the years until your balance reaches it.'],
  tryThis: [
    { label: 'Cut $300 a month from expenses. How much does the target fall?', done: (s) => s.cut >= 300 },
    { label: 'Change the withdrawal rate to 3.5%. What happens to the target?', done: (s) => s.rate <= 3.5 },
    { label: 'Raise the monthly amount you invest to $2,500.', done: (s) => s.monthly >= 2500 },
  ],
};

function FiNumberSim() {
  const sim = useSim(FN_DEFAULTS);
  const s = sim.state;
  const spend = Math.max(0, s.expenses - s.cut);
  const target = (spend * 12) / (s.rate / 100);
  const months = useMemo(() => monthsToTarget(s.start, s.monthly, s.ret, target), [s.start, s.monthly, s.ret, target]);
  const horizon = Math.min(60, Math.max(5, months === null ? 40 : Math.ceil(months / 12) + 3));
  const data = useMemo(
    () => balancesByYear(s.start, s.monthly, s.ret, horizon).map((b, year) => ({ year, balance: Math.round(b), target: Math.round(target) })),
    [s.start, s.monthly, s.ret, horizon, target],
  );
  const li = data.length - 1;
  const lowered = (s.cut * 12) / (s.rate / 100);
  return (
    <SimCard title="FI Number" kind="Mini sandbox" icon={Calculator} sim={sim} presets={FN_PRESETS} guide={FN_GUIDE}
      subtitle="Find the amount you need and how long it takes to reach it.">
      <SimGrid controls={
        <>
          <ControlGroup title="Spending">
            <SliderField label="Monthly living expenses" value={s.expenses} onChange={sim.set('expenses')} min={1000} max={10000} step={100} format={(v) => usd(v)} />
            <SliderField label="Cut from permanent expenses" value={s.cut} onChange={sim.set('cut')} min={0} max={1000} step={50} format={(v) => usd(v) + ' a month'} help="A cut you can keep for years, such as a lower phone, insurance or housing cost." />
            <SliderField label="Withdrawal rate" value={s.rate} onChange={sim.set('rate')} min={3} max={5} step={0.25} format={(v) => v.toFixed(2) + '%'} help="4% equals 25×. Use 3 to 3.5% for a retirement longer than 30 years." />
          </ControlGroup>
          <ControlGroup title="Investing">
            <SliderField label="Invested today" value={s.start} onChange={sim.set('start')} min={0} max={1000000} step={5000} format={(v) => usd(v)} />
            <SliderField label="Invested each month" value={s.monthly} onChange={sim.set('monthly')} min={0} max={5000} step={50} format={(v) => usd(v)} />
            <SliderField label="Average yearly return after inflation" value={s.ret} onChange={sim.set('ret')} min={2} max={8} step={0.5} format={(v) => v.toFixed(1) + '%'} />
          </ControlGroup>
        </>
      }>
        <StatGrid cols={4}>
          <StatTile label="Yearly expenses" value={usd(spend * 12)} />
          <StatTile label="FI number" value={usd(target)} emphasis />
          <StatTile label="Years to reach it" value={yrsText(months)} />
          <StatTile label="Lowered by your cut" value={usd(lowered)} />
        </StatGrid>
        <ChartFrame
          title="Your balance and your FI number"
          subtitle="Balance by year, in today's dollars"
          height={260}
          legend={[{ label: 'Your investments', color: 'var(--s1)' }, { label: 'FI number', color: 'var(--s2)', dashed: true }]}
          table={{ columns: ['Year', 'Your investments', 'FI number'], rows: data.filter((d) => d.year % 5 === 0 || d.year === li).map((d) => [d.year, usd(d.balance), usd(d.target)]) }}
        >
          <LineChart data={data} margin={{ top: 16, right: 96, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="year" type="number" domain={[0, horizon]} tickFormatter={(v) => (v === 0 ? 'Now' : 'Yr ' + v)} {...xAxisProps} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Year ' + l} valueFormat={(v) => usd(v)} />} />
            <Line dataKey="balance" name="Your investments" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'You ' + usd(data[li].balance, { compact: true }))} />
            <Line dataKey="target" name="FI number" stroke="var(--s2)" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Target ' + usd(target, { compact: true }), -6)} />
          </LineChart>
        </ChartFrame>
        {months === null ? (
          <Nudge tone="warning" title="Out of reach at these numbers">At this pace the balance does not reach the target within 80 years. Raise what you invest, lower your expenses, or both.</Nudge>
        ) : s.cut > 0 ? (
          <Nudge tone="good" title={'The cut lowers your target by ' + usd(lowered)}>{usd(s.cut)} a month is {usd(s.cut * 12)} a year. Divided by {s.rate}%, that is {usd(lowered)} less you need.</Nudge>
        ) : (
          <Nudge tone="tip" title="Try a cut">Move "Cut from permanent expenses" to $100 and watch the target fall by $30,000 at a 4% withdrawal rate.</Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 9.3 Keep it simple for life                                         */
/* ================================================================== */

function MonthlyCheckFigure() {
  const rows = [
    { icon: Repeat, min: 3, title: 'Confirm your automatic transfers ran', detail: 'Savings, investing and 401(k) contributions all show up.' },
    { icon: CreditCard, min: 3, title: 'Check that card balances were paid in full', detail: 'No interest charged, no late fees.' },
    { icon: Scale, min: 4, title: 'Write down your net worth', detail: 'Add what you own, subtract what you owe, and note the date.' },
    { icon: Receipt, min: 3, title: 'Glance at spending against your plan', detail: 'Look for new subscriptions and fees.' },
    { icon: CircleCheck, min: 2, title: 'Close the app without trading', detail: 'No buying or selling during a routine check.' },
  ];
  const total = rows.reduce((a, b) => a + b.min, 0);
  return (
    <Figure
      kind="example"
      title="The 15-minute monthly check"
      subtitle="One list, once a month."
      howToRead={[
        'Each row is one task. The number on the right is the minutes it should take.',
        'Work from the top to the bottom. Stop when you reach the end of the list.',
        'The last row is a rule, not a task: you do not trade during the check.',
      ]}
      takeaway={<>The five tasks add up to <strong>{total} minutes</strong>. That is 3 hours a year for the whole routine.</>}
      note="Example timings. Adjust them to your accounts."
    >
      <div role="img" aria-label="A five-item monthly checklist that takes 15 minutes" className="rounded-2xl border border-line bg-surface p-4">
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.title} className="flex items-start gap-3 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink"><r.icon className="size-4" strokeWidth={1.6} aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{r.title}</p>
                <p className="text-xs leading-relaxed text-ink-2">{r.detail}</p>
              </div>
              <span className="tnum shrink-0 text-sm font-medium text-ink">{r.min} min</span>
            </li>
          ))}
        </ul>
        <p className="mt-1 flex justify-between border-t border-line pt-3 text-sm font-semibold text-ink"><span>Total</span><span className="tnum">{total} minutes</span></p>
      </div>
    </Figure>
  );
}

const POSITIVE = [
  { label: 'Single days', value: 53 },
  { label: 'Calendar years', value: 73 },
  { label: '20-year periods', value: 100 },
];

function PositiveShareChart() {
  return (
    <Figure
      title="The longer you look, the more often stocks are up"
      subtitle="Share of periods in which the S&P 500 (total return) was positive."
      height={260}
      table={{ columns: ['Period length', 'Share of periods that were positive (approximate)'], rows: POSITIVE.map((d) => [d.label, d.value + '%']) }}
      howToRead={[
        'Each column is a length of time. The side axis is the share of those periods that ended higher than they started.',
        'The first column covers one day. The last covers every 20-year span since 1926.',
        'Taller columns mean the result was positive more often.',
      ]}
      takeaway={<>About <strong>53%</strong> of days were positive, about <strong>73%</strong> of calendar years, and <strong>every</strong> rolling 20-year period since 1926. Daily news covers the shortest and least predictable view.</>}
      note="Approximate, historical; not a guarantee. S&P 500 total return (dividends included), U.S. data since 1926, before inflation. Past results do not predict future results."
    >
      <BarChart data={POSITIVE} margin={{ top: 24, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...xAxisProps} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => v + '%'} {...yAxisProps} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => 'About ' + v + '% positive'} />} />
        <Bar dataKey="value" name="Share positive" fill="var(--s1)" radius={COLUMN_RADIUS} maxBarSize={MAX_BAR * 2} isAnimationActive={false} label={columnLabel((v) => (v === 100 ? '100%' : '~' + v + '%'))} />
      </BarChart>
    </Figure>
  );
}

function HabitsFigure() {
  const habits = [
    { icon: Repeat, title: 'Automate saving and investing', detail: 'A transfer on every payday, set once.' },
    { icon: CreditCard, title: 'Stay out of high-interest debt', detail: 'Pay card balances in full. A card at 24% costs more than investments usually earn.' },
    { icon: TrendingUp, title: 'Keep investing through drops', detail: 'Contributions made while prices are low buy more shares.' },
    { icon: CalendarCheck, title: 'Check once a month', detail: '15 minutes, then stop.' },
  ];
  return (
    <Figure
      kind="diagram"
      title="Four habits for life"
      howToRead={[
        'Each card is one habit. The line under the title says how to do it.',
        'Two habits run automatically. Two take a few minutes of your attention.',
        'None of them requires watching the market.',
      ]}
      takeaway={<>Only one of the four habits asks for your time, and it takes <strong>15 minutes a month</strong>.</>}
    >
      <div role="img" aria-label="Four lifelong money habits" className="grid gap-3 sm:grid-cols-2">
        {habits.map((h) => (
          <div key={h.title} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink"><h.icon className="size-4" strokeWidth={1.6} aria-hidden /></span>
            <div>
              <p className="text-sm font-medium text-ink">{h.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">{h.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Figure>
  );
}

const TG_DEFAULTS = { monthly: 500, years: 30, ret: 6 };
type TgState = typeof TG_DEFAULTS;
const TG_PRESETS: Preset<TgState>[] = [
  { label: '$300 for 20 years', values: { monthly: 300, years: 20 } },
  { label: '$500 for 30 years', values: {} },
  { label: '$1,000 for 35 years', values: { monthly: 1000, years: 35 } },
];
const TG_GUIDE: SimGuide<TgState> = {
  how: ['Set how much you invest each month.', 'Set how many years you keep going.', 'Compare what you put in with what the investments earned.'],
  tryThis: [
    { label: 'Move the years from 30 to 40. How much of the balance is growth?', done: (s) => s.years >= 40 },
    { label: 'Double the monthly amount. Does the balance double too?', done: (s) => s.monthly >= 1000 },
  ],
};

function TimeSim() {
  const sim = useSim(TG_DEFAULTS);
  const s = sim.state;
  const data = useMemo(() => balancesByYear(0, s.monthly, s.ret, s.years), [s.monthly, s.ret, s.years]);
  const final = data[data.length - 1];
  const put = s.monthly * 12 * s.years;
  const growth = Math.max(0, final - put);
  const segs: Segment[] = [
    { key: 'put', label: 'Your deposits', value: put, color: 'var(--s2)' },
    { key: 'growth', label: 'Investment growth', value: growth, color: 'var(--s1)' },
  ];
  return (
    <SimCard title="Give It Time" kind="Mini sandbox" icon={Sunrise} sim={sim} presets={TG_PRESETS} guide={TG_GUIDE}
      subtitle="Automatic monthly investing, with no trading, over many years.">
      <SimGrid controls={
        <ControlGroup title="Your routine">
          <SliderField label="Invested each month" value={s.monthly} onChange={sim.set('monthly')} min={50} max={3000} step={50} format={(v) => usd(v)} />
          <SliderField label="Years" value={s.years} onChange={sim.set('years')} min={5} max={45} step={1} format={(v) => v + ' years'} />
          <SliderField label="Average yearly return" value={s.ret} onChange={sim.set('ret')} min={2} max={9} step={0.5} format={(v) => v.toFixed(1) + '%'} help="An assumption for illustration, not a forecast." />
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="You deposited" value={usd(put)} />
          <StatTile label="Growth" value={usd(growth)} />
          <StatTile label="Final balance" sub={'after ' + s.years + ' years'} value={usd(final)} emphasis />
        </StatGrid>
        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold text-ink">What makes up the {usd(final)}</p>
          <SegmentBar segments={segs} total={Math.max(final, 1)} format={usd} height={28} ariaLabel="Deposits and growth" />
          <SegmentLegend segments={segs} total={Math.max(final, 1)} format={usd} />
        </div>
        <Nudge tone="tip" title="The routine matters more than the news">The balance depends on the amount, the years and the return. Reading headlines is not an input.</Nudge>
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* Decision check + cheat sheet                                        */
/* ================================================================== */

export const questions: QuizQuestion[] = [
  {
    id: 'fi-number',
    scenario: <>Your expenses are <strong>$3,500 a month</strong>. You want to estimate your <Term id="fi-number">FI number</Term> with the 25× guideline.</>,
    prompt: 'What is your rough target?',
    options: [
      { text: '$42,000', why: <>That is your <strong>yearly</strong> expenses: $3,500 × 12. The target multiplies that figure by 25.</> },
      { text: '$420,000', why: <>That multiplies yearly expenses by 10. A 10× target equals a 10% withdrawal rate, far above the 4% guideline.</> },
      { text: '$1,050,000', correct: true, why: <>Yes. $3,500 × 12 = $42,000 a year, and $42,000 × 25 = <strong>$1,050,000</strong>. A 4% <Term id="withdrawal-rate">withdrawal</Term> from that is $42,000.</> },
    ],
  },
  {
    id: 'permanent-cut',
    scenario: <>You switch to a cheaper phone plan and cancel unused subscriptions. Together you save <strong>$150 a month</strong>, and you expect to keep it that way.</>,
    prompt: 'About how much does this lower the amount you need invested?',
    options: [
      { text: '$1,800', why: <>That is the yearly saving: $150 × 12. It still has to be multiplied by 25.</> },
      { text: '$45,000', correct: true, why: <>Yes. $150 × 12 = $1,800 a year, and $1,800 × 25 = <strong>$45,000</strong> less to reach.</> },
      { text: '$450,000', why: <>That is ten times too high. $1,800 a year × 25 is $45,000, not $450,000.</> },
    ],
  },
  {
    id: 'market-drop',
    scenario: <>You invest <strong>$600 a month</strong> automatically. The market falls 15% this quarter. Headlines are alarming, and a coworker says to sell and wait.</>,
    prompt: 'What is the best response?',
    options: [
      { text: 'Sell everything and invest again when the news improves.', why: <>This is <Term id="market-timing">market timing</Term>. You have to be right twice, on when to sell and when to buy back. Selling after a 15% fall makes the loss permanent, and recoveries often begin before the news improves.</> },
      { text: 'Stop the $600 deposits until prices stop falling.', why: <>Deposits made while prices are lower buy more shares. Stopping gives up that benefit and breaks the habit.</> },
      { text: 'Leave the automatic $600 in place and do your normal 15-minute check next month.', correct: true, why: <>Yes. Historically, every rolling 20-year period of S&P 500 total returns since 1926 was positive. That is not a guarantee, but it supports staying invested and not reacting to a single quarter.</> },
      { text: 'Check your balance every day until it recovers.', why: <>Daily checking adds worry and tempts you to trade, and it does not change the outcome. Monthly is enough.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Calculator, title: 'Multiply yearly expenses by 25.', body: <>That is your rough FI number. Use 28 to 33 times, a 3 to 3.5% withdrawal rate, if retirement may last longer than 30 years.</> },
  { icon: Wallet, title: 'Cut permanent expenses first.', body: <>Every <strong>$100 a month</strong> you remove from bills you would keep paying lowers your target by <strong>$30,000</strong>.</> },
  { icon: CalendarCheck, title: 'Automate it and check once a month.', body: <>Spend 15 minutes a month confirming transfers and card payments. Skip daily market news, and keep investing through drops.</> },
];

/* ================================================================== */

export default function FreedomChapter() {
  return (
    <ChapterLayout
      id="freedom"
      questions={questions}
      rules={rules}
      sections={{
        '9-1': (
          <>
            <P>Financial independence is about choices, not luxury. It does not mean owning a yacht or never working again. It means your investments are large enough that you no longer need a paycheck to pay your bills.</P>
            <Bullets items={[
              <><strong className="text-ink">Work becomes optional.</strong> You can keep your job because you want to, not because you have to.</>,
              <><strong className="text-ink">You can switch to work you enjoy.</strong> A lower-paying job, part-time work or a new field becomes possible because your investments cover the gap.</>,
              <><strong className="text-ink">Your definition can change.</strong> Some people stop working entirely. Others keep working and no longer worry about missing a paycheck.</>,
            ]} />
            <P>The usual measure is a single number, your <Term id="financial-independence">financial independence</Term> target, covered in 9.2. Your investments pay for your expenses through regular withdrawals.</P>
            <FiFlowDiagram />
            <H3>The savings rate sets the timeline</H3>
            <P>How fast you get there depends mostly on the share of your income you save. The chart shows why: a higher savings rate means you invest more and also need less, because you spend less.</P>
            <SavingsRateChart />
            <SavingsRateSim />
            <Mistakes title="Mistakes to avoid" items={[
              <>Treating independence as an all-or-nothing date. Having half of your target already gives you more room to change jobs.</>,
              <>Setting a target based on a lifestyle you do not actually want. Smaller expenses mean a smaller target.</>,
              <>Waiting to start until your income is higher. Starting at a lower savings rate still begins the growth.</>,
            ]} />
          </>
        ),
        '9-2': (
          <>
            <P>You do not need a complex spreadsheet to estimate how much you need. A rough rule of thumb is that when your investments reach about <strong className="text-ink">25 times your yearly living expenses</strong>, they can generally support you for decades.</P>
            <Example title="From monthly expenses to a target">
              <Steps items={[
                { title: 'Find your monthly expenses.', body: 'Use your real spending, such as $4,000 a month.' },
                { title: 'Multiply by 12.', body: '$4,000 × 12 = $48,000 a year.' },
                { title: 'Multiply by 25.', body: <>$48,000 × 25 = $1,200,000. This is your <Term id="fi-number">FI number</Term>.</> },
              ]} />
            </Example>
            <FiNumberChart />
            <H3>Why 25</H3>
            <P>25 times your expenses is the same as withdrawing <strong className="text-ink">4%</strong> in the first year: $48,000 is 4% of $1,200,000. This <Term id="withdrawal-rate">withdrawal rate</Term> comes from studies of historical U.S. stock and bond returns, such as the 1998 Trinity study, which looked at 30-year retirements.</P>
            <Bullets items={[
              <><strong className="text-ink">It is a rough guide, not a guarantee.</strong> Future returns may be lower than past returns.</>,
              <><strong className="text-ink">For a retirement much longer than 30 years,</strong> many planners use 3 to 3.5%. At $48,000 of yearly expenses, 3.5% needs about {usd(48000 / 0.035)} and 3% needs {usd(48000 / 0.03)}.</>,
              <><strong className="text-ink">Later years adjust for rising prices.</strong> The 4% applies to the first year only.</>,
            ]} />
            <GoDeeper title="Where the 4% guideline comes from">
              <p>Researchers tested many starting years of historical U.S. stock and bond returns. For each, they asked whether a portfolio could pay a set yearly amount, raised for inflation, for 30 years. A first-year withdrawal of about 4% held up in most of the periods tested. Results depend on the period studied, the mix of stocks and bonds, and fees. Treat 4% as a starting estimate and review it as you get closer.</p>
            </GoDeeper>
            <H3>Cut permanent expenses first</H3>
            <P>Lower expenses help twice: you can save more now, and you need a smaller target. Every <strong className="text-ink">$100 a month</strong> you cut from permanent expenses lowers the amount you need by tens of thousands of dollars.</P>
            <CutDiagram />
            <FiNumberSim />
            <Mistakes title="Mistakes to avoid" items={[
              <>Using today's expenses without thinking about which ones will end, such as a mortgage or childcare, or begin, such as health insurance.</>,
              <>Counting only your retirement accounts and forgetting expenses from before you can withdraw from them penalty-free.</>,
              <>Treating 25× as a promise. Recheck it every few years.</>,
            ]} />
          </>
        ),
        '9-3': (
          <>
            <P>Once your plan is automated, the routine is short. The biggest risks to your results are high-interest debt, missed contributions and reacting to the news.</P>
            <H3>Check your accounts once a month, for 15 minutes</H3>
            <Steps items={[
              { title: 'Confirm the automatic transfers ran.', body: 'Savings, investing and retirement contributions should all appear.' },
              { title: 'Check that credit card balances were paid in full.', body: 'Paying the statement balance each month avoids interest.' },
              { title: 'Note your net worth.', body: 'Write it down with the date. The direction matters more than any single month.' },
              { title: 'Glance at spending against your plan.', body: 'Look for new subscriptions or fees.' },
              { title: 'Do not trade.', body: 'A routine check is not a reason to buy or sell.' },
            ]} />
            <MonthlyCheckFigure />
            <H3>Ignore daily stock market news</H3>
            <P>Daily headlines report short-term movements that rarely affect a plan built for decades. Over longer periods, the picture looks different.</P>
            <PositiveShareChart />
            <P>Past results do not guarantee future results, and individual years can be sharply negative. The point is that a long time horizon changes how often you should expect to see gains.</P>
            <H3>Habits to keep for life</H3>
            <HabitsFigure />
            <Bullets items={[
              <><strong className="text-ink">Automate saving and investing.</strong> Set up transfers once, and raise them when your income rises.</>,
              <><strong className="text-ink">Stay out of high-interest debt.</strong> Pay off cards first, because a 24% balance costs more than investments typically earn.</>,
              <><strong className="text-ink">Give it time.</strong> Growth builds over decades, as the sandbox below shows.</>,
            ]} />
            <TimeSim />
            <Mistakes title="Mistakes to avoid" items={[
              <>Checking balances daily and selling after a drop.</>,
              <>Stopping contributions during a market decline.</>,
              <>Letting a card balance carry over while you invest. Pay it off first.</>,
              <>Changing the plan every time a new product or headline appears.</>,
            ]} />
          </>
        ),
      }}
    />
  );
}
