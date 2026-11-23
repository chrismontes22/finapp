import { useMemo } from 'react';
import { Bar, BarChart, Cell, CartesianGrid, LabelList, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Ban, Banknote, Briefcase, Calendar, Car, Check, HeartPulse, House, Lock, PiggyBank, Scale, Search,
  ShieldCheck, Smartphone, TrendingUp, Umbrella, Users, Wallet, X, type LucideIcon,
} from 'lucide-react';
import { ChapterLayout } from '../components/ChapterLayout';
import { Term } from '../components/Glossary';
import { Bullets, Compare, ConceptCards, Example, GoDeeper, H3, Mistakes, MythBuster, P, Steps } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { Switch, SegmentedControl, cx } from '../components/ui';
import { ChartFrame, DataTable, TooltipBox, activeDot, cursorProps, gridProps, xAxisProps, yAxisProps } from '../components/Chart';
import { COLUMN_RADIUS, MAX_BAR, BAR_RADIUS, barEndLabel, columnLabel, endLabel, Figure, FlowDiagram } from '../components/Figure';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { num, pct, usd } from '../lib/format';
import { deductibleCosts } from '../lib/housing';
import { BRACKETS, STANDARD_DEDUCTION, TAX_YEAR, incomeTax, raiseImpact, type FilingStatus } from '../lib/tax';

const compact = (n: number) => usd(n, { compact: true });

function bracketRow(i: number, st: FilingStatus): string {
  const lo = i === 0 ? 0 : BRACKETS[st][i - 1].upTo;
  const hi = BRACKETS[st][i].upTo;
  return Number.isFinite(hi) ? usd(lo) + ' – ' + usd(hi) : 'over ' + usd(lo);
}

/** Balance after "months" of end-of-month deposits growing at annualPct a year. */
const futureValue = (monthly: number, annualPct: number, months: number) => {
  const r = annualPct / 100 / 12;
  return r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
};

/* ================================================================== */
/* 8.1 Taxes without the panic                                         */
/* ================================================================== */

const EX_BASE = 65000;
const EX_RAISE = 10000;

function RaiseBracketsChart() {
  const before = incomeTax(EX_BASE, 'single');
  const after = incomeTax(EX_BASE + EX_RAISE, 'single');
  const row = (name: string, r: ReturnType<typeof incomeTax>) => ({ name, r10: r.buckets[0].filled, r12: r.buckets[1].filled, r22: r.buckets[2].filled });
  const data = [row('Before: ' + compact(EX_BASE), before), row('After: ' + compact(EX_BASE + EX_RAISE), after)];
  const moved = after.buckets[2].filled - before.buckets[2].filled;
  return (
    <Figure
      title="A raise fills the next bracket. It does not re-tax everything."
      subtitle={'A single filer, ' + TAX_YEAR + ' brackets. Salary goes from ' + usd(EX_BASE) + ' to ' + usd(EX_BASE + EX_RAISE) + '.'}
      legend={[{ label: '10% bracket', color: 'var(--s1)' }, { label: '12% bracket', color: 'var(--s2)' }, { label: '22% bracket', color: 'var(--s3)' }]}
      height={230}
      table={{
        columns: ['Taxable income in the…', 'Before', 'After'],
        rows: [
          ['10% bracket', usd(before.buckets[0].filled), usd(after.buckets[0].filled)],
          ['12% bracket', usd(before.buckets[1].filled), usd(after.buckets[1].filled)],
          ['22% bracket', usd(before.buckets[2].filled), usd(after.buckets[2].filled)],
          ['Total taxable income', usd(before.taxable), usd(after.taxable)],
          ['Federal income tax', usd(before.tax), usd(after.tax)],
        ],
      }}
      howToRead={[
        'Each bar is one person\'s taxable income. Taxable income is salary minus the standard deduction.',
        'Each color is one bracket. The length of a color is how many dollars fall in that bracket.',
        'Compare the two bars. The first two colors barely change. Only the third color is new.',
      ]}
      takeaway={<>Only <strong>{usd(moved)}</strong> of the raise lands in the 22% bracket. The other {usd(EX_RAISE - moved)} is taxed at 12%. Income tax rises by {usd(after.tax - before.tax)}, not by 22% of the whole salary.</>}
      note={'Taxable income = salary − the ' + usd(STANDARD_DEDUCTION.single) + ' standard deduction. Federal income tax only, no credits. Example numbers.'}
    >
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={(v) => compact(v)} {...xAxisProps} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v)} />} />
        <Bar dataKey="r10" name="10% bracket" stackId="a" fill="var(--s1)" maxBarSize={44} isAnimationActive={false} />
        <Bar dataKey="r12" name="12% bracket" stackId="a" fill="var(--s2)" maxBarSize={44} isAnimationActive={false} />
        <Bar dataKey="r22" name="22% bracket" stackId="a" fill="var(--s3)" maxBarSize={44} isAnimationActive={false} />
      </BarChart>
    </Figure>
  );
}

function TakeHomeChart() {
  const r = raiseImpact(EX_BASE, EX_RAISE, 'single');
  const data = [
    { name: 'Before: ' + compact(EX_BASE), takeHome: Math.round(r.takeBefore) },
    { name: 'After: ' + compact(EX_BASE + EX_RAISE), takeHome: Math.round(r.takeAfter) },
  ];
  return (
    <Figure
      title="Take-home pay before and after the raise"
      subtitle="Same single filer. Take-home is salary minus federal income tax and Social Security and Medicare tax."
      height={240}
      table={{ columns: ['', 'Before', 'After'], rows: [['Take-home pay', usd(r.takeBefore), usd(r.takeAfter)], ['Income tax', usd(r.before.tax), usd(r.after.tax)], ['Social Security and Medicare', usd(r.ficaBefore), usd(r.ficaAfter)]] }}
      howToRead={[
        'Each column is a year of take-home pay.',
        'The side axis starts at $0, so the height of each column is honest.',
        'Taller means more money in your bank account.',
      ]}
      takeaway={<>The raise adds {usd(EX_RAISE)} before tax and <strong>{usd(r.kept)}</strong> after tax. About {pct((r.kept / EX_RAISE) * 100, 0)} of it reaches your account, so take-home goes up.</>}
      note="Federal income tax and payroll tax only. State income tax, if you have one, takes a further share. Example numbers."
    >
      <BarChart data={data} margin={{ top: 24, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" {...xAxisProps} />
        <YAxis tickFormatter={(v) => compact(v)} {...yAxisProps} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v)} />} />
        <Bar dataKey="takeHome" name="Take-home pay" fill="var(--s1)" radius={COLUMN_RADIUS} maxBarSize={MAX_BAR * 2} isAnimationActive={false} label={columnLabel((v) => usd(v))} />
      </BarChart>
    </Figure>
  );
}

/* ----- Bracket picture (used by the Raise Checker) ----- */

interface BracketSpec { key: string; rate: number; from: number; to: number; base: number; extra: number; tax: number; marginal: boolean; deduction?: boolean; }

function bracketRange(b: BracketSpec): string {
  if (b.deduction) return 'first ' + compact(b.to);
  return Number.isFinite(b.to) ? compact(b.from) + '–' + compact(b.to) : compact(b.from) + '+';
}

function TaxBrackets({ brackets }: { brackets: BracketSpec[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[600px] items-start gap-2">
        {brackets.map((b) => {
          const cap = Number.isFinite(b.to - b.from) ? b.to - b.from : Math.max(250_000, (b.base + b.extra) * 1.6);
          const baseH = Math.min(100, (b.base / cap) * 100);
          const extraH = Math.min(100 - baseH, (b.extra / cap) * 100);
          const empty = b.base + b.extra <= 0;
          const name = b.deduction ? 'Standard deduction (0%)' : b.rate + '% bracket';
          const aria = name + ': ' + usd(b.base) + (b.extra > 0 ? ' plus ' + usd(b.extra) + ' from the raise' : '');
          return (
            <div key={b.key} className="flex flex-1 flex-col items-center">
              <p className={cx('mb-1 text-sm font-bold', b.marginal ? 'text-accent-text' : empty ? 'text-muted' : 'text-ink')}>{b.deduction ? '0%' : b.rate + '%'}</p>
              <div className={cx('relative h-36 w-full overflow-hidden rounded-b-2xl border-2 border-t-0 bg-surface-2/50', b.marginal ? 'border-accent' : 'border-line-strong')} role="img" aria-label={aria}>
                <div className="absolute inset-x-0 bottom-0 transition-[height] duration-300" style={{ height: baseH + '%', background: b.deduction ? 'var(--s3)' : 'var(--s1)', opacity: 0.85 }} />
                {b.extra > 0 && <div className="absolute inset-x-0 transition-[height,bottom] duration-300" style={{ bottom: baseH + '%', height: extraH + '%', background: 'var(--s2)' }} />}
                {!Number.isFinite(b.to) && <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-muted">no upper limit</span>}
              </div>
              <p className="tnum mt-1.5 text-center text-[11px] leading-tight text-muted">{bracketRange(b)}</p>
              <p className={cx('tnum text-center text-[11px] font-semibold leading-tight', empty ? 'text-muted' : 'text-ink')}>{compact(b.base + b.extra)}</p>
              <p className="tnum text-center text-[11px] leading-tight text-ink-2">{b.deduction ? 'tax $0' : 'tax ' + compact(b.tax)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const RAISE_DEFAULTS = { income: 65000, raise: 10000, status: 'single' as FilingStatus };
type RaiseState = typeof RAISE_DEFAULTS;
const RAISE_PRESETS: Preset<RaiseState>[] = [
  { label: '$45k, small raise', hint: 'Stays inside the 12% bracket', values: { income: 45000, raise: 3000 } },
  { label: '$65k, crosses into 22%', hint: 'The example from the chart above', values: { income: 65000, raise: 10000 } },
  { label: '$95k, large raise', hint: 'A $30,000 raise that reaches the 24% bracket', values: { income: 95000, raise: 30000 } },
];
const RAISE_GUIDE: SimGuide<RaiseState> = {
  how: ['Set your yearly salary and filing status.', 'Set the size of the raise you were offered.', 'Compare the take-home pay before and after.'],
  tryThis: [
    { label: 'Load "$65k, crosses into 22%." How many dollars are taxed at the higher rate?', done: (s) => s.income === 65000 && s.raise === 10000 },
    { label: 'Raise the raise to $50,000. Does take-home pay ever go down?', done: (s) => s.raise >= 50000 },
  ],
};

function RaiseChecker() {
  const sim = useSim(RAISE_DEFAULTS);
  const s = sim.state;
  const after = s.income + s.raise;
  const base = useMemo(() => incomeTax(s.income, s.status), [s.income, s.status]);
  const withRaise = useMemo(() => incomeTax(after, s.status), [after, s.status]);
  const r = useMemo(() => raiseImpact(s.income, s.raise, s.status), [s.income, s.raise, s.status]);
  const D = STANDARD_DEDUCTION[s.status];
  const brackets: BracketSpec[] = [
    { key: 'ded', rate: 0, from: 0, to: D, base: Math.min(s.income, D), extra: Math.min(after, D) - Math.min(s.income, D), tax: 0, marginal: withRaise.taxable <= 0, deduction: true },
    ...BRACKETS[s.status].map((b, i) => {
      const bb = base.buckets[i], ab = withRaise.buckets[i];
      return { key: String(b.rate), rate: b.rate, from: bb.from, to: bb.to, base: bb.filled, extra: ab.filled - bb.filled, tax: ab.tax, marginal: withRaise.taxable > 0 && withRaise.marginal === b.rate };
    }),
  ];
  const higherSlice = s.raise > 0 && withRaise.marginal > base.marginal
    ? brackets.filter((b) => !b.deduction && b.rate > base.marginal).reduce((a, b) => a + b.extra, 0)
    : 0;
  const extraTax = r.after.tax - r.before.tax + (r.ficaAfter - r.ficaBefore);
  return (
    <SimCard title="Raise Checker" kind="Mini sandbox" icon={TrendingUp} sim={sim} presets={RAISE_PRESETS} guide={RAISE_GUIDE}
      subtitle={'See how a raise is taxed under the ' + TAX_YEAR + ' federal brackets and how much of it you keep.'}>
      <SimGrid controls={
        <ControlGroup title="Your pay">
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Filing status</p>
            <SegmentedControl label="Filing status" size="sm" value={s.status} onChange={sim.set('status')} options={[{ value: 'single', label: 'Single' }, { value: 'mfj', label: 'Married, joint' }]} />
          </div>
          <SliderField label={<>Yearly salary (<Term id="gross-pay">gross</Term>)</>} value={s.income} onChange={sim.set('income')} min={20000} max={300000} step={500} format={(v) => usd(v)} />
          <SliderField label="Raise" value={s.raise} onChange={sim.set('raise')} min={0} max={50000} step={500} format={(v) => (v ? '+' + usd(v) : '$0')} help="The second color in the picture shows the dollars from the raise." />
        </ControlGroup>
      }>
        <StatGrid cols={4}>
          <StatTile label="Extra tax on the raise" value={usd(extraTax)} sub="income tax + Social Security and Medicare" />
          <StatTile label="Extra take-home" value={usd(r.kept)} sub={s.raise > 0 ? pct((r.kept / s.raise) * 100, 0) + ' of the raise' : 'no raise yet'} emphasis />
          <StatTile label={<Term id="marginal-rate">Marginal rate</Term>} value={withRaise.marginal + '%'} sub="on your next dollar" />
          <StatTile label={<Term id="effective-rate">Effective rate</Term>} value={pct(withRaise.effective, 1)} sub="income tax ÷ salary" />
        </StatGrid>
        <div className="rounded-xl border border-line p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-ink">How your income fills each bracket</p>
            <ul className="flex flex-wrap gap-3 text-xs text-ink-2">
              <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: 'var(--s3)' }} />Standard deduction (untaxed)</li>
              <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: 'var(--s1)' }} />Taxed income</li>
              {s.raise > 0 && <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: 'var(--s2)' }} />The raise</li>}
            </ul>
          </div>
          <TaxBrackets brackets={brackets} />
          <p className="mt-2 text-xs text-muted sm:hidden">Swipe sideways to see every bracket →</p>
        </div>
        {s.raise > 0 ? (
          <Nudge tone="good" title={'You keep ' + usd(r.kept) + ' of your ' + usd(s.raise) + ' raise'}>
            Income tax rises by {usd(r.after.tax - r.before.tax)} and Social Security and Medicare tax by {usd(r.ficaAfter - r.ficaBefore)}. Your take-home pay goes from <strong>{usd(r.takeBefore)}</strong> to <strong>{usd(r.takeAfter)}</strong>.
            {higherSlice > 0 && <> Only <strong>{usd(higherSlice)}</strong> of the raise is taxed at {withRaise.marginal}%. The rest is taxed at the same rates as before.</>}
          </Nudge>
        ) : (
          <Nudge tone="info" title={'Marginal ' + base.marginal + '% and effective ' + pct(base.effective, 1) + ' are different numbers'}>
            Only your top dollars are taxed at {base.marginal}%. The rest fall in lower brackets, so your overall rate is {pct(base.effective, 1)}. Add a raise to see what changes.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

function BracketTable() {
  return (
    <DataTable maxHeight={400} spec={{ caption: TAX_YEAR + ' federal income tax brackets, applied to taxable income', columns: ['Rate', 'Single', 'Married filing jointly'], rows: BRACKETS.single.map((b, i) => [b.rate + '%', bracketRow(i, 'single'), bracketRow(i, 'mfj')]) }} />
  );
}

function GigFlowFigure() {
  return (
    <Figure
      kind="diagram"
      title="Where $1,000 of gig income goes"
      subtitle="Nobody withholds tax from gig or freelance payments, so you move the money yourself."
      howToRead={[
        'Read left to right. The first box is the payment you receive.',
        'The middle box is the part you move to a separate savings account the same day.',
        'The last box is what stays available to spend.',
      ]}
      takeaway={<>Move <strong>$250 to $300</strong> out of every $1,000. The remaining $700 to $750 is yours, and the tax bill in April is already paid for.</>}
      note="25–30% is a rule of thumb. Your exact amount depends on your income, deductions and state."
    >
      <FlowDiagram
        label="A $1,000 gig payment is split into $250 to $300 for a tax savings account and the rest for you"
        steps={[
          { icon: Banknote, title: 'Gig payment arrives', amount: '$1,000', detail: 'No tax withheld.' },
          { icon: PiggyBank, title: 'Move to a separate tax savings account', amount: '$250–$300', detail: 'Do it the same day, every payment.', color: 'var(--s2)', emphasis: true },
          { icon: Wallet, title: 'Yours to spend and save', amount: '$700–$750', detail: 'Budget from this number.', color: 'var(--s1)' },
        ]}
      />
    </Figure>
  );
}

const GIG_DEFAULTS = { gig: 2000, setAside: 28 };
type GigState = typeof GIG_DEFAULTS;
const GIG_PRESETS: Preset<GigState>[] = [
  { label: 'Side gig', hint: '$600 a month', values: { gig: 600 } },
  { label: 'Part-time freelancer', hint: '$2,000 a month', values: { gig: 2000 } },
  { label: 'Full-time freelancer', hint: '$5,500 a month', values: { gig: 5500 } },
];
const GIG_GUIDE: SimGuide<GigState> = {
  how: ['Enter your average monthly gig income after business costs.', 'Choose the percent you move to your tax account.', 'Read the monthly, quarterly and yearly amounts.'],
  tryThis: [
    { label: 'Set the percent to 15%. Notice the Nudge.', done: (s) => s.setAside <= 15 },
    { label: 'Load "Full-time freelancer." How much is each quarterly payment?', done: (s) => s.gig >= 5500 },
  ],
};

function GigTaxSetAside() {
  const sim = useSim(GIG_DEFAULTS);
  const s = sim.state;
  const monthly = (s.gig * s.setAside) / 100;
  const yearly = monthly * 12;
  return (
    <SimCard title="Gig Tax Set-Aside" kind="Mini sandbox" icon={PiggyBank} sim={sim} presets={GIG_PRESETS} guide={GIG_GUIDE}
      subtitle="How much to move into a separate savings account for taxes.">
      <SimGrid controls={
        <ControlGroup title="Your gig income">
          <SliderField label="Gig income per month" value={s.gig} onChange={sim.set('gig')} min={200} max={10000} step={100} format={(v) => usd(v)} help="After business costs such as supplies or mileage." />
          <SliderField label="Percent set aside" value={s.setAside} onChange={sim.set('setAside')} min={5} max={40} step={1} format={(v) => v + '%'} help="The usual range is 25–30%." />
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="Set aside each month" value={usd(monthly)} emphasis />
          <StatTile label="Per quarterly payment" value={usd(yearly / 4)} sub="four payments a year" />
          <StatTile label="Set aside in a year" value={usd(yearly)} sub={usd(s.gig * 12 - yearly) + ' left to spend'} />
        </StatGrid>
        {s.setAside < 20 ? (
          <Nudge tone="warning" title="This is likely too low">
            Self-employment tax alone is about 15.3% of most of your net earnings, before any income tax. At {s.setAside}% you may owe more than you saved.
          </Nudge>
        ) : s.setAside < 25 ? (
          <Nudge tone="info" title="Close, but below the usual range">
            If your income is low and you have deductions, {s.setAside}% may be enough. If you are unsure, move to 25% and keep any leftover as savings.
          </Nudge>
        ) : (
          <Nudge tone="good" title={'Moving ' + usd(monthly) + ' a month covers a typical tax bill'}>
            Keep the money in a savings account separate from your checking account. Pay the four estimated tax payments from it. Whatever remains afterward is yours.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

function EstimatedTaxDates() {
  const rows = [
    { period: 'January 1 – March 31', due: 'April 15' },
    { period: 'April 1 – May 31', due: 'June 15' },
    { period: 'June 1 – August 31', due: 'September 15' },
    { period: 'September 1 – December 31', due: 'January 15 (next year)' },
  ];
  return (
    <Figure
      kind="diagram"
      title="The four estimated tax payment dates"
      subtitle="Income you earn in each period is due by the date shown."
      howToRead={[
        'The left column is the period in which you earned the money.',
        'The right column is the usual due date for that period\'s payment.',
        'When a date falls on a weekend or holiday, the deadline moves to the next business day.',
      ]}
      takeaway={<>Four payments a year, spaced about every three months. Your tax savings account is what you pay them from.</>}
      note="These are the usual federal due dates for estimated taxes. Confirm the current dates on IRS.gov."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="img" aria-label="Four estimated tax payment dates: April 15, June 15, September 15, January 15">
        {rows.map((r, i) => (
          <div key={r.due} className="rounded-2xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-ink"><Calendar className="size-4 text-muted" strokeWidth={1.75} aria-hidden />Payment {i + 1}</p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-ink">{r.due}</p>
            <p className="mt-1 text-xs text-ink-2">For income earned {r.period}</p>
          </div>
        ))}
      </div>
    </Figure>
  );
}

/* ================================================================== */
/* 8.2 Essential insurance only                                        */
/* ================================================================== */

function BuySkipFigure() {
  const buy: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: HeartPulse, title: 'Health insurance', body: 'One hospital stay can cost more than a year of income.' },
    { icon: Car, title: 'Auto liability insurance', body: 'Pays for damage and injuries you cause to other people. Required in nearly every state.' },
    { icon: House, title: 'Renters or homeowners insurance', body: 'Covers your belongings, and pays if someone is hurt in your home.' },
    { icon: Users, title: 'Term life insurance', body: 'Only if other people depend on your income.' },
    { icon: Briefcase, title: 'Disability insurance (worth considering)', body: 'Replaces part of your paycheck if illness or injury stops you from working.' },
  ];
  const skip: { title: string; body: string }[] = [
    { title: 'Whole life sold as an investment', body: 'High premiums, low returns, and fees that are hard to see.' },
    { title: 'Extended warranties on everyday gadgets', body: 'Phones, headphones and small appliances cost less to replace than the plan costs.' },
    { title: 'Credit card or loan payment insurance', body: 'Costly protection against a small risk. A basic emergency fund covers it.' },
    { title: 'Add-ons for small, affordable losses', body: 'Examples are low deductibles and insurance on things you could replace from savings.' },
  ];
  return (
    <Figure
      kind="diagram"
      title="Buy these. Skip those."
      subtitle="Insure losses that could wipe you out. Pay small losses yourself."
      howToRead={[
        'The left column lists coverage that protects you from a loss you could not pay.',
        'The right column lists products that cost more than the loss they cover.',
        'The test for any policy: could you pay for this loss from savings?',
      ]}
      takeaway={<>Five types of coverage protect against losses of tens or hundreds of thousands of dollars. The products on the right protect against losses of a few hundred.</>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink"><span className="grid size-6 place-items-center rounded-full bg-good-soft text-good-text"><Check className="size-3.5" aria-hidden /></span>Buy</p>
          <ul className="mt-3 space-y-3">
            {buy.map((b) => (
              <li key={b.title} className="flex gap-3">
                <b.icon className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
                <div><p className="text-sm font-medium text-ink">{b.title}</p><p className="text-xs leading-relaxed text-ink-2">{b.body}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink"><span className="grid size-6 place-items-center rounded-full bg-critical-soft text-critical-text"><X className="size-3.5" aria-hidden /></span>Skip</p>
          <ul className="mt-3 space-y-3">
            {skip.map((b) => (
              <li key={b.title} className="flex gap-3">
                <Ban className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
                <div><p className="text-sm font-medium text-ink">{b.title}</p><p className="text-xs leading-relaxed text-ink-2">{b.body}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Figure>
  );
}

const TERM_COST = 25;
const WHOLE_COST = 400;
const PREMIUM_DATA = [
  { name: '20-year term', monthly: TERM_COST },
  { name: 'Whole life', monthly: WHOLE_COST },
];

function PremiumChart() {
  return (
    <Figure
      title="Monthly cost of $500,000 of life insurance"
      subtitle="A healthy 30-year-old. Both policies pay out the same amount if the person dies."
      height={250}
      table={{ columns: ['Policy', 'Per month', 'Over 20 years'], rows: PREMIUM_DATA.map((d) => [d.name, usd(d.monthly), usd(d.monthly * 240)]) }}
      howToRead={[
        'Each column is one type of policy.',
        'The side axis is the premium you pay each month.',
        'Compare the heights. Both buy the same $500,000 of protection.',
      ]}
      takeaway={<>Whole life costs about <strong>{usd(WHOLE_COST)}</strong> a month and term costs about <strong>{usd(TERM_COST)}</strong>. That is {num(WHOLE_COST / TERM_COST)} times as much for the same death benefit.</>}
      note="Illustrative. Real quotes vary by age, health and company. Whole life does build a cash value, but it grows slowly and you pay for it through the higher premium."
    >
      <BarChart data={PREMIUM_DATA} margin={{ top: 24, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v)} {...yAxisProps} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v) + ' a month'} />} />
        <Bar dataKey="monthly" name="Monthly premium" fill="var(--s1)" radius={COLUMN_RADIUS} maxBarSize={MAX_BAR * 2} isAnimationActive={false} label={columnLabel((v) => usd(v))} />
      </BarChart>
    </Figure>
  );
}

const DIFF = WHOLE_COST - TERM_COST;
const DIFF_DATA = Array.from({ length: 21 }, (_, year) => ({ year, balance: Math.round(futureValue(DIFF, 7, year * 12)) }));

function InvestDifferenceChart() {
  const last = DIFF_DATA[DIFF_DATA.length - 1];
  return (
    <Figure
      title={'What investing the ' + usd(DIFF) + ' difference could grow to'}
      subtitle={'Buy term, and invest ' + usd(DIFF) + ' a month (the gap between the two premiums) for 20 years.'}
      height={280}
      table={{ columns: ['Year', 'Balance'], rows: DIFF_DATA.filter((d) => d.year % 5 === 0).map((d) => [d.year === 0 ? 'Now' : 'Year ' + d.year, usd(d.balance)]) }}
      howToRead={[
        'The bottom axis counts years from today. The side axis is the investment balance.',
        'The line is the total after each month\'s deposit has grown.',
        'The line curves upward because growth is earned on earlier growth.',
      ]}
      takeaway={<>Deposits of {usd(DIFF * 240)} grow to about <strong>{usd(last.balance)}</strong> after 20 years, assuming 7% average yearly growth. That is money you own and can use for any purpose.</>}
      note="Illustrative, not a forecast. Assumes $375 invested each month at 7% average yearly growth, before taxes and fees. Investment returns are not guaranteed."
    >
      <LineChart data={DIFF_DATA} margin={{ top: 16, right: 96, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="year" type="number" domain={[0, 20]} ticks={[0, 5, 10, 15, 20]} tickFormatter={(v) => (v === 0 ? 'Now' : 'Yr ' + v)} {...xAxisProps} />
        <YAxis tickFormatter={(v) => compact(v)} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Year ' + l} valueFormat={(v) => usd(v)} />} />
        <Line dataKey="balance" name="Invested balance" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(20, usd(last.balance, { compact: true }))} />
      </LineChart>
    </Figure>
  );
}

const WARRANTY = { price: 120, chance: 8, repair: 250 };

function WarrantyChart() {
  const expected = (WARRANTY.chance / 100) * WARRANTY.repair;
  const data = [
    { name: 'Price of the plan', value: WARRANTY.price },
    { name: 'Expected payout', value: expected },
  ];
  return (
    <Figure
      title="An extended warranty costs more than it is expected to pay"
      subtitle={'A $600 phone with a ' + usd(WARRANTY.price) + ' protection plan.'}
      height={230}
      table={{ columns: ['Item', 'Amount'], rows: [['Price of the plan', usd(WARRANTY.price)], ['Chance of a covered repair', WARRANTY.chance + '%'], ['Average repair cost', usd(WARRANTY.repair)], ['Expected payout (8% × $250)', usd(expected)]] }}
      howToRead={[
        'The top bar is what you pay for the plan.',
        'The bottom bar is the average amount the plan pays back: the chance of a repair times the repair cost.',
        'When the top bar is longer, the plan costs more than it returns on average.',
      ]}
      takeaway={<>You pay <strong>{usd(WARRANTY.price)}</strong> to receive an expected <strong>{usd(expected)}</strong>. Setting aside the {usd(WARRANTY.price)} yourself leaves you ahead on average.</>}
      note="Illustrative. Assumes an 8% chance of a covered repair costing $250. Actual rates differ by product, but plans are priced so the seller expects to keep more than it pays out."
    >
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={(v) => usd(v)} {...xAxisProps} />
        <YAxis type="category" dataKey="name" width={130} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v)} />} />
        <Bar dataKey="value" name="Amount" fill="var(--s1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => usd(v))} />
      </BarChart>
    </Figure>
  );
}

/* ----- Deductible chooser (reused from the earlier course) ----- */

const DED_DEFAULTS = { claims: 0.2, years: 5, efund: 3000 };
type DedState = typeof DED_DEFAULTS;
const DED_PRESETS: Preset<DedState>[] = [
  { label: 'Rarely file claims', values: { claims: 0.1 } },
  { label: 'Accident-prone teen driver', values: { claims: 0.6 } },
  { label: 'Thin emergency fund ($800)', values: { efund: 800 } },
];

function DeductibleChooser() {
  const sim = useSim(DED_DEFAULTS);
  const s = sim.state;
  const rows = useMemo(() => deductibleCosts(s.claims, s.years), [s.claims, s.years]);
  const affordable = rows.filter((r) => r.deductible <= s.efund);
  const best = (affordable.length ? affordable : rows).reduce((a, b) => (b.total < a.total ? b : a));
  const cheapestOverall = rows.reduce((a, b) => (b.total < a.total ? b : a));
  const data = rows.map((r) => ({ name: usd(r.deductible), total: r.total, ok: r.deductible <= s.efund, best: r === best }));
  return (
    <SimCard title="Insurance Deductible Chooser" kind="Mini sandbox" icon={Umbrella} sim={sim} presets={DED_PRESETS}
      subtitle="Find the car-insurance deductible that costs you least and that you can cover."
      guide={{
        how: ['Set how often you file claims.', 'Enter what your emergency fund holds.', 'Read the best fit under the chart.'],
        tryThis: [
          { label: 'Drop your emergency fund below $1,000. What changes?', done: (st) => st.efund < 1000 },
          { label: 'Raise claims to 0.6 a year. Which deductible wins now?', done: (st) => st.claims >= 0.59 },
        ],
      }}>
      <SimGrid controls={
        <ControlGroup title="Your situation">
          <SliderField label="Claims per year (on average)" value={s.claims} onChange={sim.set('claims')} min={0} max={1} step={0.05} format={(v) => num(v, 2)} help={s.claims > 0 ? 'About one claim every ' + num(1 / s.claims, 1) + ' years' : 'No claims expected'} />
          <SliderField label="Years to compare" value={s.years} onChange={sim.set('years')} min={1} max={10} step={1} format={(v) => v + ' yrs'} />
          <SliderField label="Emergency fund" value={s.efund} onChange={sim.set('efund')} min={0} max={10000} step={100} format={(v) => usd(v)} help="The most you could pay out of pocket tomorrow without a credit card." />
        </ControlGroup>
      }>
        <ChartFrame title={'Expected total cost over ' + s.years + ' years'} subtitle="Premiums plus the deductibles you would pay on expected claims" height={240}
          table={{ columns: ['Deductible', 'Yearly premium', 'Premiums', 'Expected out-of-pocket', 'Total', 'Covered by emergency fund?'], rows: rows.map((r) => [usd(r.deductible), usd(r.premium), usd(r.premiums), usd(r.outOfPocket), usd(r.total), r.deductible <= s.efund ? 'Yes' : 'No']) }}>
          <BarChart data={data} margin={{ top: 24, right: 16, bottom: 4, left: 0 }} barCategoryGap="28%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...xAxisProps} tickFormatter={(v) => v + ' ded.'} />
            <YAxis tickFormatter={(v) => compact(v)} {...yAxisProps} />
            <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox labelFormat={(l) => String(l) + ' deductible'} valueFormat={(v) => usd(v)} />} />
            <Bar dataKey="total" name="Expected total" radius={COLUMN_RADIUS} isAnimationActive={false}>
              {data.map((d) => <Cell key={d.name} fill={d.best ? 'var(--s1)' : 'var(--s-neutral-2)'} fillOpacity={d.ok ? 1 : 0.4} />)}
              <LabelList dataKey="total" position="top" formatter={(v: unknown) => compact(Number(v))} style={{ fill: 'var(--ink-2)', fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ChartFrame>
        <p className="text-xs text-muted">The colored bar is the best choice you can afford. Faded bars have a deductible larger than your emergency fund.</p>
        {best !== cheapestOverall ? (
          <Nudge tone="warning" title={'The ' + usd(cheapestOverall.deductible) + ' deductible is cheapest, but you cannot cover it yet'}>
            With {usd(s.efund)} saved, a claim could end up on a credit card. Choose {usd(best.deductible)} for now and raise the deductible as your emergency fund grows.
          </Nudge>
        ) : (
          <Nudge tone="good" title={'Best fit: ' + usd(best.deductible) + ' deductible'}>
            Expected cost: {usd(best.total)} over {s.years} years, and your emergency fund can cover the deductible. Paying small losses yourself costs less than paying an insurer to handle them.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 8.3 Scams and bad advice                                            */
/* ================================================================== */

function Flag({ n }: { n: number }) {
  return <span className="mx-0.5 inline-grid size-4 place-items-center rounded-full bg-critical text-[10px] font-bold text-white align-middle" aria-label={'Red flag ' + n}>{n}</span>;
}

function ScamMessageFigure() {
  const flags = [
    { n: 1, title: 'Guaranteed high returns', body: 'No real investment can guarantee a return, and 15% a month is far beyond any honest return.' },
    { n: 2, title: 'Act now', body: 'A deadline stops you from checking. Honest offers are still there tomorrow.' },
    { n: 3, title: 'Crypto or romance pitch', body: 'A stranger who builds trust, then steers you to a crypto investment.' },
    { n: 4, title: 'Gift cards, wire or crypto', body: 'These payments are hard to trace and nearly impossible to reverse. No real business or agency asks for them.' },
    { n: 5, title: 'Keep it secret', body: 'Scammers isolate you from the people who would warn you.' },
  ];
  return (
    <Figure
      kind="example"
      title="A scam message with every red flag marked"
      subtitle="A text from an unknown number. Each numbered mark matches an item on the right."
      howToRead={[
        'The phone on the left shows the message as you would see it.',
        'Each red number marks a phrase that is a warning sign.',
        'The list on the right explains why each phrase matters.',
      ]}
      takeaway={<>One flag is enough reason to stop. This message has <strong>five</strong>, and the request for a $500 payment by gift card or crypto ends the conversation.</>}
      note="Invented example. Names and details are made up."
    >
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="mx-auto w-full max-w-[20rem] rounded-[2rem] border-2 border-line-strong bg-surface-2 p-3" role="img" aria-label="Text message from an unknown number containing five scam red flags">
          <div className="mb-3 flex items-center justify-between px-2 text-[11px] text-muted"><span className="inline-flex items-center gap-1"><Smartphone className="size-3" aria-hidden />Unknown number</span><span>Today 9:41 PM</span></div>
          <div className="space-y-2">
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-ink shadow-soft">
              Hi Sam, I know we only met online, but I feel a real connection with you.<Flag n={3} /> My trading mentor helped me turn $500 into $20,000.
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-ink shadow-soft">
              His crypto platform pays guaranteed 15% returns every month. No risk.<Flag n={1} />
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-ink shadow-soft">
              Only 3 spots left. You must act now, the offer ends tonight.<Flag n={2} /> Send $500 in gift cards or by crypto ATM to start.<Flag n={4} />
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-ink shadow-soft">
              Do not tell your bank or family. They will try to talk you out of it.<Flag n={5} />
            </div>
          </div>
        </div>
        <ol className="space-y-3">
          {flags.map((f) => (
            <li key={f.n} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-critical text-xs font-bold text-white" aria-hidden>{f.n}</span>
              <div><p className="text-sm font-medium text-ink">{f.title}</p><p className="text-sm leading-relaxed text-ink-2">{f.body}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </Figure>
  );
}

const FRAUD_DATA = [
  { name: 'All reported fraud', value: 12.5 },
  { name: 'Investment scams', value: 5.7 },
];

function FraudLossChart() {
  return (
    <Figure
      title="Reported fraud losses in the U.S., 2024"
      subtitle="Billions of dollars consumers reported losing to the FTC."
      height={220}
      table={{ columns: ['Category', 'Reported losses'], rows: FRAUD_DATA.map((d) => [d.name, '$' + d.value + ' billion']) }}
      howToRead={[
        'Each bar is a total in billions of dollars.',
        'The top bar is all reported fraud. The bottom bar is the investment scam share of it.',
        'Compare the lengths to see how much of the total is investment scams.',
      ]}
      takeaway={<>Investment scams were about <strong>$5.7 billion</strong> of the <strong>$12.5 billion</strong> reported, or roughly {pct((5.7 / 12.5) * 100, 0)}. They had the highest reported losses of any category.</>}
      note="Source: FTC Consumer Sentinel, 2024 data. Reported losses only. Many victims never report."
    >
      <BarChart data={FRAUD_DATA} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={(v) => '$' + v + 'B'} {...xAxisProps} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => '$' + v + ' billion'} />} />
        <Bar dataKey="value" name="Reported losses" fill="var(--s1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => '$' + v + 'B')} />
      </BarChart>
    </Figure>
  );
}

const SCAM_FLAGS = [
  { key: 'guaranteed', label: 'Promises guaranteed or very high returns', weight: 3 },
  { key: 'urgency', label: 'Pressure to act now or before a deadline', weight: 2 },
  { key: 'pitch', label: 'A crypto or romance pitch from someone you have not met in person', weight: 2 },
  { key: 'secret', label: 'Asks you to keep it secret from your bank or family', weight: 2 },
  { key: 'unsolicited', label: 'The message came out of the blue', weight: 1 },
  { key: 'pay', label: 'Asks for gift cards, a wire transfer, a crypto ATM or crypto transfer', weight: 5 },
] as const;
type ScamKey = (typeof SCAM_FLAGS)[number]['key'];
type ScamState = Record<ScamKey, boolean>;
const SCAM_DEFAULTS: ScamState = { guaranteed: false, urgency: false, pitch: false, secret: false, unsolicited: false, pay: false };
const SCAM_PRESETS: Preset<ScamState>[] = [
  { label: 'Expected notice from your bank', hint: 'No pressure, no payment request', values: {} },
  { label: 'Crypto "mentor"', hint: 'Romance and guaranteed returns', values: { guaranteed: true, urgency: true, pitch: true, secret: true, unsolicited: true } },
  { label: 'Gift card request from a "boss"', values: { urgency: true, secret: true, unsolicited: true, pay: true } },
];
const SCAM_GUIDE: SimGuide<ScamState> = {
  how: ['Read the message you received.', 'Switch on every red flag it contains.', 'Read the verdict and follow the next step.'],
  tryThis: [
    { label: 'Switch on only "gift cards, a wire transfer…". Is one flag enough?', done: (s) => s.pay && !s.guaranteed && !s.urgency && !s.pitch && !s.secret },
    { label: 'Load "Crypto mentor." Count the flags.', done: (s) => s.guaranteed && s.pitch && s.secret && !s.pay },
  ],
};

function ScamCheck() {
  const sim = useSim(SCAM_DEFAULTS);
  const s = sim.state;
  const active = SCAM_FLAGS.filter((f) => s[f.key]);
  const score = active.reduce((a, f) => a + f.weight, 0);
  return (
    <SimCard title="Scam Check" kind="Mini sandbox" icon={ShieldCheck} sim={sim} presets={SCAM_PRESETS} guide={SCAM_GUIDE}
      subtitle="Mark the red flags in a message or offer and read the verdict.">
      <SimGrid controls={
        <ControlGroup title="Red flags in the message">
          {SCAM_FLAGS.map((f) => (
            <Switch key={f.key} checked={s[f.key]} onChange={sim.set(f.key)} label={f.label} />
          ))}
        </ControlGroup>
      }>
        <StatGrid cols={2}>
          <StatTile label="Red flags" value={active.length + ' of ' + SCAM_FLAGS.length} />
          <StatTile label="Verdict" value={s.pay || score >= 4 ? 'Treat as a scam' : score >= 2 ? 'Very suspicious' : score === 1 ? 'Be careful' : 'No flags marked'} emphasis />
        </StatGrid>
        {s.pay ? (
          <Nudge tone="critical" title="Do not pay. A request for gift cards, wire transfers or crypto is a scam on its own.">
            No real bank, agency or employer asks for payment this way. Stop, send nothing, and report it at ReportFraud.ftc.gov.
          </Nudge>
        ) : score >= 4 ? (
          <Nudge tone="critical" title="Treat this as a scam">
            Several red flags together are a clear pattern. Stop replying, do not click links, and report it at ReportFraud.ftc.gov.
          </Nudge>
        ) : score >= 2 ? (
          <Nudge tone="warning" title="Very suspicious. Do not act yet.">
            Do not send money or share account details. Look up the company or person yourself and call a number you found on their official website.
          </Nudge>
        ) : score === 1 ? (
          <Nudge tone="info" title="One flag is a reason to slow down">
            Verify before you respond. Contact the sender through a phone number or website you look up yourself, not one in the message.
          </Nudge>
        ) : (
          <Nudge tone="tip" title="No flags marked, but still verify">
            Scams can look professional. Before you send money or personal details, confirm the request through a number or website you look up yourself.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

function AdviserCheckFigure() {
  return (
    <Figure
      kind="diagram"
      title="Check an adviser before you hand over money"
      subtitle="Three checks take about ten minutes."
      howToRead={[
        'Read left to right. Each box is one check.',
        'Do all three before you share account details or sign anything.',
        'If any answer is unclear, ask again or walk away.',
      ]}
      takeaway={<>Look up the license, ask how the adviser is paid, and ask for it in writing. A real adviser is comfortable answering all three.</>}
      note="FINRA BrokerCheck covers brokers and brokerage firms. The SEC Investment Adviser Public Disclosure site (adviserinfo.sec.gov) covers registered investment advisers."
    >
      <FlowDiagram
        label="Three checks: look up the adviser, ask how they are paid, confirm they act as a fiduciary"
        steps={[
          { icon: Search, title: 'Look them up', amount: 'BrokerCheck or SEC IAPD', detail: 'Check licenses, complaints and past disciplinary actions.' },
          { icon: Banknote, title: 'Ask how they are paid', amount: 'Fee-only is simplest', detail: 'A fee-only adviser is paid by you, not by the products sold.' },
          { icon: Scale, title: 'Ask if they are a fiduciary', amount: 'Get it in writing', detail: 'A fiduciary must put your interests first.', emphasis: true },
        ]}
      />
    </Figure>
  );
}

/* ================================================================== */
/* Decision check and cheat sheet                                      */
/* ================================================================== */

const questions: QuizQuestion[] = [
  {
    id: 'raise',
    scenario: <>You are single and earn <strong>$65,000</strong>. Your employer offers a <strong>$5,000</strong> raise. That moves $3,500 of your income into the 22% bracket. A friend says you will "lose money" and should decline it.</>,
    prompt: 'What happens to your take-home pay if you accept?',
    options: [
      { text: 'It goes down, because all of your income is now taxed at 22%.', why: <>Brackets do not work that way. Only the <strong>$3,500</strong> above the line is taxed at 22%. The first $48,900 of taxable income is taxed exactly as before.</> },
      { text: 'It goes up by about $3,700.', correct: true, why: <>Yes. Extra income tax is $1,500 × 12% + $3,500 × 22% = <strong>$950</strong>. Payroll tax on $5,000 is about $383. You keep roughly <strong>$3,668</strong> of the $5,000.</> },
      { text: 'It stays about the same, because higher taxes cancel the raise.', why: <>Taxes take about <strong>$1,332</strong> of the $5,000, which is 27%. The other $3,668 reaches your account.</> },
      { text: 'It goes up, but only if you also add money to a 401(k).', why: <>No condition is needed. A raise leaves you with more take-home pay by itself. A 401(k) is a separate decision.</> },
    ],
  },
  {
    id: 'whole-life',
    scenario: <>You are 30, married with two young children, and your income pays the household's bills. An agent offers a <strong>$500,000 whole life</strong> policy at <strong>$400 a month</strong> and calls it "insurance plus an investment." A 20-year term policy with the same death benefit costs about <strong>$25 a month</strong>.</>,
    prompt: 'What is the best choice?',
    options: [
      { text: 'Buy the whole life policy. It is both insurance and savings.', why: <>You pay <strong>$375 a month</strong> more for the same death benefit. Invested at an assumed 7% for 20 years, that $375 could grow to about <strong>$195,000</strong>. You would control it and could invest it as you choose.</> },
      { text: 'Buy no life insurance, because policies are a waste of money.', why: <>With two children who depend on your income, the risk is real. A $500,000 term policy costs only about <strong>$25 a month</strong> and protects them if you die.</> },
      { text: 'Buy the 20-year term policy and invest the difference.', correct: true, why: <>Yes. Term covers the years when your family depends on you for about <strong>$25 a month</strong>. Investing the other $375 a month is flexible and likely to grow more than whole life cash value.</> },
      { text: 'Buy the whole life policy and skip health insurance to afford it.', why: <>This reverses the priority. Health insurance protects against a loss of tens or hundreds of thousands of dollars. Whole life at $400 a month is the policy to skip.</> },
    ],
  },
  {
    id: 'scam-text',
    scenario: <>A person you met on a dating app two weeks ago says a trading platform pays <strong>guaranteed 15% monthly returns</strong>. They say the offer ends tonight and ask you to deposit <strong>$2,000 through a crypto ATM</strong>. They add that your bank "would only try to stop you."</>,
    prompt: 'What should you do?',
    options: [
      { text: 'Send $500 as a test. If it grows, send the rest.', why: <>Scammers often show fake gains on a screen to encourage larger deposits. Even $500 is lost. A promise of <strong>15% a month</strong> would double your money in under 6 months, which no honest investment can promise.</> },
      { text: 'Stop replying, send nothing, and report it at ReportFraud.ftc.gov.', correct: true, why: <>Yes. This message has several red flags: guaranteed returns, a deadline, a romance and crypto pitch, a payment by crypto ATM and a request for secrecy. Investment scams caused about <strong>$5.7 billion</strong> in reported losses in 2024.</> },
      { text: 'Ask for the platform\'s website and invest if it looks professional.', why: <>Fake websites are cheap to build and look convincing. The red flags are in the <strong>behavior</strong>: the pressure, the secrecy and the payment method.</> },
      { text: 'Deposit the $2,000 but ask for a receipt.', why: <>A receipt from the sender proves nothing. Crypto ATM deposits are almost impossible to reverse, so the <strong>$2,000</strong> would likely be gone.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: TrendingUp, title: 'Take the raise. Set aside 25–30% of gig income.', body: <>Only the dollars above a bracket line are taxed at the higher rate, so more pay always means more take-home. If no employer withholds tax, move <strong>25–30%</strong> of each payment to a separate savings account.</> },
  { icon: Umbrella, title: 'Insure the big losses. Skip the rest.', body: <>Carry health, auto liability and renters or homeowners insurance. Buy low-cost <strong>term</strong> life insurance only if someone depends on your income. Skip whole life as an investment and warranties on gadgets.</> },
  { icon: Lock, title: 'Guaranteed returns, urgency or gift cards means stop.', body: <>Do not pay. Verify with a number you look up yourself and report it at <strong>ReportFraud.ftc.gov</strong>. Check advisers on FINRA BrokerCheck or the SEC IAPD site.</> },
];

/* ================================================================== */

export default function ProtectionChapter() {
  return (
    <ChapterLayout
      id="protection"
      questions={questions}
      rules={rules}
      sections={{
        '8-1': (
          <>
            <P>Federal income tax uses <Term id="tax-bracket">tax brackets</Term>. Each bracket has a rate, and each rate applies only to the slice of income inside that bracket. When a raise pushes you into a new bracket, only the dollars above the line are taxed at the higher rate.</P>
            <Bullets items={[
              <><strong className="text-ink">A raise never lowers your take-home pay.</strong> The highest rate applies only to the extra dollars, and you keep most of every extra dollar.</>,
              <><strong className="text-ink"><Term id="marginal-rate">Marginal rate</Term></strong> is the rate on your next dollar of income.</>,
              <><strong className="text-ink"><Term id="effective-rate">Effective rate</Term></strong> is your total income tax divided by your total income. It is always lower than your marginal rate.</>,
            ]} />
            <RaiseBracketsChart />
            <TakeHomeChart />
            <H3>The {TAX_YEAR} brackets</H3>
            <P>Brackets apply to <Term id="taxable-income">taxable income</Term>, which is your income minus deductions such as the <Term id="standard-deduction">standard deduction</Term>. The standard deduction is {usd(STANDARD_DEDUCTION.single)} for a single filer and {usd(STANDARD_DEDUCTION.mfj)} for married couples filing jointly.</P>
            <BracketTable />
            <Example title="Why a raise cannot cost you money">
              <Steps items={[
                { title: 'Start with taxable income.', body: <>A single filer earning $65,000 has <strong>$48,900</strong> of taxable income after the standard deduction.</> },
                { title: 'Add the raise.', body: <>A $5,000 raise makes taxable income $53,900. The 12% bracket ends at $50,400, so <strong>$3,500</strong> falls into the 22% bracket.</> },
                { title: 'Tax only the new slice at the higher rate.', body: <>$1,500 × 12% + $3,500 × 22% = <strong>$950</strong> more income tax. Payroll tax adds about $383.</> },
                { title: 'Keep the rest.', body: <>$5,000 − $950 − $383 = <strong>$3,668</strong> more take-home pay.</> },
              ]} />
            </Example>
            <MythBuster myth="A raise can push me into a higher bracket and I will take home less.">
              Only the dollars above the bracket line are taxed at the higher rate. Your earlier dollars are taxed as before. A raise always leaves you with more money than you had.
            </MythBuster>
            <RaiseChecker />
            <H3>If you do freelance or gig work</H3>
            <P>An employer withholds tax from each paycheck. A client who pays you for gig or freelance work does not. You are responsible for the tax yourself, so the money has to be there when it is due.</P>
            <Bullets items={[
              <><strong className="text-ink">Set aside roughly 25–30% of every payment</strong> in a separate savings account for taxes. Keeping it apart from your spending account makes it harder to spend by accident.</>,
              <><strong className="text-ink"><Term id="self-employment-tax">Self-employment tax</Term></strong> is about 15.3% of most of your net earnings: 12.4% for Social Security and 2.9% for Medicare. An employee pays half of this and the employer pays the other half. You pay both halves.</>,
              <><strong className="text-ink">Income tax</strong> is due on top of that, at your bracket rates, plus state tax where it applies.</>,
              <><strong className="text-ink"><Term id="estimated-taxes">Estimated taxes</Term></strong> are usually paid four times a year, around April 15, June 15, September 15 and January 15.</>,
            ]} />
            <GigFlowFigure />
            <Example title="A $1,000 gig payment, roughly">
              <Bullets items={[
                <>Self-employment tax: about <strong>$141</strong> ($1,000 × 92.35% × 15.3%).</>,
                <>Federal income tax in the 12% bracket: about <strong>$110</strong>.</>,
                <>Total: about <strong>$250</strong>, before any state tax. Adding a margin for state tax and for income that falls in a higher bracket gives the 25–30% rule of thumb.</>,
              ]} />
            </Example>
            <EstimatedTaxDates />
            <GigTaxSetAside />
            <Mistakes items={[
              <>Spending gig income as it arrives and facing a large bill in April.</>,
              <>Keeping tax money in your everyday checking account where it blends with spending money.</>,
              <>Forgetting self-employment tax, which applies even when your income tax is low.</>,
              <>Skipping the quarterly payments. Missing them can lead to penalties and a large lump-sum bill.</>,
            ]} />
          </>
        ),
        '8-2': (
          <>
            <P>Insurance transfers a loss you could not afford to a company, in exchange for a monthly or yearly <Term id="premium">premium</Term>. It makes sense for large, unlikely losses. It makes little sense for small losses you could pay from savings.</P>
            <H3>Insurance everyone needs</H3>
            <ConceptCards items={[
              { icon: HeartPulse, title: 'Health insurance', body: <>An uninsured hospital stay can cost tens of thousands of dollars. You pay a premium, then a <Term id="deductible">deductible</Term> before the plan pays most costs. Choose the plan from your employer or the marketplace that fits your expected use.</> },
              { icon: Car, title: 'Auto liability insurance', body: <><Term id="liability-coverage">Liability coverage</Term> pays for injuries and damage you cause to others. A serious crash can exceed what you own. Nearly every state requires some amount.</> },
              { icon: House, title: 'Renters or homeowners insurance', body: <><Term id="renters-insurance">Renters insurance</Term> covers your belongings and your liability, and commonly costs about $10 to $25 a month. Homeowners insurance covers the house too, and a mortgage lender usually requires it.</> },
              { icon: Briefcase, title: 'Disability insurance, if you rely on your paycheck', body: <>It replaces part of your income if illness or injury stops you from working. Check whether your employer offers it before buying a separate policy.</> },
            ]} />
            <BuySkipFigure />
            <H3>Life insurance: term only, and only if needed</H3>
            <P>Life insurance replaces your income for the people who depend on it. If nobody depends on your income, you probably do not need it.</P>
            <Bullets items={[
              <><strong className="text-ink"><Term id="term-life">Term life</Term></strong> covers a set period, such as 20 years. It costs little and does one job: it pays your family if you die during that period.</>,
              <><strong className="text-ink"><Term id="whole-life">Whole life</Term></strong> lasts your lifetime and includes a cash value. It costs many times as much as term, and agents often sell it as an investment. Skip it.</>,
              <><strong className="text-ink">A common rule of thumb</strong> is coverage of about 10 times your yearly income. A family with a mortgage and young children may want more.</>,
              <><strong className="text-ink">Buy it when someone depends on you,</strong> such as a spouse, children or a parent, and let it end when they no longer do.</>,
            ]} />
            <PremiumChart />
            <InvestDifferenceChart />
            <H3>Skip extended warranties on everyday gadgets</H3>
            <P>An <Term id="extended-warranty">extended warranty</Term> is priced so the seller expects to keep more than it pays out. A phone, headphones or a small appliance can be replaced for less than the combined cost of many plans. Put the same money in your <Term id="emergency-fund">emergency fund</Term> and pay for the occasional repair yourself.</P>
            <WarrantyChart />
            <H3>Choosing a deductible</H3>
            <P>A higher deductible lowers your premium. It is a good trade only if your emergency fund can cover the deductible without using a credit card.</P>
            <DeductibleChooser />
            <GoDeeper title="Other products to skip">
              <Bullets items={[
                <><strong>Credit card or loan payment protection.</strong> It is expensive relative to the small risk it covers.</>,
                <><strong>Accidental death-only policies.</strong> They pay in very few situations. Term life pays for any cause of death.</>,
                <><strong>Insurance sold at checkout for small purchases.</strong> Compare the price with the cost of replacing the item.</>,
              ]} />
            </GoDeeper>
            <Mistakes items={[
              <>Going without health insurance because the premium feels high. One hospital stay can cost far more than years of premiums.</>,
              <>Buying a permanent policy because an agent describes it as an investment.</>,
              <>Choosing a deductible you could not pay tomorrow.</>,
              <>Paying for coverage on items you could replace from savings.</>,
            ]} />
          </>
        ),
        '8-3': (
          <>
            <P>Scammers and sales-driven advisers use the same few tactics. They promise a result no one can promise, create a deadline, and ask for money in a form you cannot get back. Learn the patterns and you can stop most of them before any money moves.</P>
            <H3>The red flags</H3>
            <Bullets items={[
              <><strong className="text-ink">"Guaranteed high returns."</strong> No legitimate investment guarantees a high return. Higher expected returns always come with risk.</>,
              <><strong className="text-ink">"Act now."</strong> Urgency is meant to stop you from checking. A real opportunity is still there tomorrow.</>,
              <><strong className="text-ink">Crypto or romance pitches.</strong> A person you met online who guides you toward a crypto investment is a common scam.</>,
              <><strong className="text-ink">Payment by gift card, wire transfer, crypto or crypto ATM.</strong> These are hard to trace and nearly impossible to reverse. Real businesses and government agencies do not demand them.</>,
              <><strong className="text-ink">Secrecy.</strong> Any request to hide the deal from your bank or family is a warning sign.</>,
            ]} />
            <ScamMessageFigure />
            <FraudLossChart />
            <MythBuster myth="Scams only fool careless people.">
              Scams are designed by professionals and use real fears and hopes. Anyone can be reached at a bad moment. The protection is a habit: pause, verify, and never pay in the ways listed above.
            </MythBuster>
            <P>If an offer sounds too good to be true, it is a scam.</P>
            <ScamCheck />
            <H3>What to do if you receive one</H3>
            <Steps items={[
              { title: 'Stop.', body: 'Do not reply, click links or open attachments.' },
              { title: 'Do not pay.', body: 'Never send gift cards, wire transfers, crypto or cash to someone who contacted you first.' },
              { title: 'Verify independently.', body: 'Call the company or agency using a number you look up yourself, not one in the message.' },
              { title: 'Report it.', body: 'File a report at ReportFraud.ftc.gov. If you already sent money, contact your bank or card issuer right away.' },
            ]} />
            <H3>Bad financial advice</H3>
            <P>Not every bad pitch is a crime. Some come from advisers who earn more by selling you one product than another. Before you act on advice, check the person and how they are paid.</P>
            <AdviserCheckFigure />
            <Compare
              left={{ title: 'Fee-only adviser', body: <>Paid directly by you, by a flat fee, an hourly rate or a percentage of assets. They do not earn commissions on products, so there is less pressure to sell you something.</> }}
              right={{ title: 'Commission-based adviser', body: <>Paid by the companies whose products they sell. Be cautious. Ask what they earn if you buy, and whether a lower-cost option exists.</> }}
            />
            <Bullets items={[
              <>Look up any adviser on <strong className="text-ink">FINRA BrokerCheck</strong> or the <strong className="text-ink">SEC Investment Adviser Public Disclosure (IAPD)</strong> site. Check for complaints and disciplinary history.</>,
              <>Prefer <strong className="text-ink">fee-only fiduciaries</strong>, who are legally required to act in your interest.</>,
              <>Be careful with products that pay the seller a commission, such as whole life and some annuities.</>,
              <>Walk away from pressure, from jargon you cannot get explained, and from anyone who will not put fees in writing.</>,
            ]} />
            <Mistakes items={[
              <>Trusting a message because it uses your name or the name of a real company.</>,
              <>Calling the phone number in the message to "verify" it.</>,
              <>Paying a small amount first to "unlock" a larger payout.</>,
              <>Taking investment advice from someone who earns more when you buy.</>,
            ]} />
          </>
        ),
      }}
    />
  );
}
