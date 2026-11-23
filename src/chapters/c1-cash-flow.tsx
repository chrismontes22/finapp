import { useMemo, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceDot, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowDownToLine, Banknote, Car, CreditCard, Gift, GraduationCap, House, Landmark, PiggyBank, Receipt, Repeat, Scale,
  Scissors, Search, ShoppingCart, Stethoscope, Tv, Wallet,
} from 'lucide-react';
import { useMoney } from '../state/money';
import { myBudgetPreset } from '../state/myPresets';
import { ChapterLayout } from '../components/ChapterLayout';
import { Term } from '../components/Glossary';
import { Bullets, Example, GoDeeper, H3, Mistakes, P, Steps } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { Button, Switch } from '../components/ui';
import { activeDot, cursorProps, gridProps, TooltipBox, xAxisProps, yAxisProps } from '../components/Chart';
import { BAR_RADIUS, MAX_BAR, barEndLabel, endLabel, Figure, FlowDiagram, StatementMockup } from '../components/Figure';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { monthlyRate } from '../lib/growth';
import { pct, usd } from '../lib/format';
import { paycheck } from '../lib/tax';

/** Balance after `months` of end-of-month deposits growing at `annualPct` a year. */
const futureValue = (monthly: number, annualPct: number, months: number) => {
  const r = monthlyRate(annualPct);
  return r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
};

/* ================================================================== */
/* 1.1 Income vs. wealth                                               */
/* ================================================================== */

const SAME_INCOME = Array.from({ length: 21 }, (_, year) => ({
  year,
  alex: Math.round(futureValue(100, 6, year * 12)),
  jordan: Math.round(futureValue(600, 6, year * 12)),
}));

function SameIncomeChart() {
  const last = SAME_INCOME[SAME_INCOME.length - 1];
  const li = SAME_INCOME.length - 1;
  return (
    <Figure
      title="Same income, different results"
      subtitle="Alex and Jordan both take home $4,000 a month. Alex saves $100 a month; Jordan saves $600."
      legend={[{ label: 'Jordan: saves $600/month (15%)', color: 'var(--s1)' }, { label: 'Alex: saves $100/month (2.5%)', color: 'var(--s2)' }]}
      height={300}
      table={{ columns: ['Year', 'Jordan', 'Alex'], rows: SAME_INCOME.filter((d) => d.year % 5 === 0).map((d) => [d.year, usd(d.jordan), usd(d.alex)]) }}
      howToRead={[
        'The bottom axis counts years from today. The side axis shows total savings and investments.',
        'Each line is one person. Their paychecks are identical.',
        'The space between the lines is the difference in wealth.',
      ]}
      takeaway={<>After 20 years Jordan has about <strong>{usd(Math.round(last.jordan / 1000) * 1000)}</strong> and Alex about <strong>{usd(Math.round(last.alex / 1000) * 1000)}</strong>. The gap of about {usd(Math.round((last.jordan - last.alex) / 1000) * 1000)} comes entirely from how much each person kept.</>}
      note="Assumes 6% average yearly growth, monthly deposits and no withdrawals. Illustrative, not a forecast."
    >
      <LineChart data={SAME_INCOME} margin={{ top: 16, right: 96, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="year" type="number" domain={[0, 20]} ticks={[0, 5, 10, 15, 20]} tickFormatter={(v) => (v === 0 ? 'Now' : 'Yr ' + v)} {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Year ' + l} valueFormat={(v) => usd(v)} />} />
        <Line dataKey="jordan" name="Jordan" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Jordan ' + usd(last.jordan, { compact: true }))} />
        <Line dataKey="alex" name="Alex" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Alex ' + usd(last.alex, { compact: true }))} />
      </LineChart>
    </Figure>
  );
}

const NW_OWN = [
  { label: 'Checking & savings', value: 8000, icon: Landmark },
  { label: '401(k)', value: 12000, icon: PiggyBank },
  { label: 'Car (what it would sell for)', value: 9000, icon: Car },
];
const NW_OWE = [
  { label: 'Car loan', value: 7000, icon: Car },
  { label: 'Credit card', value: 2500, icon: CreditCard },
  { label: 'Student loan', value: 15000, icon: GraduationCap },
];

function NetWorthDiagram() {
  const own = NW_OWN.reduce((a, b) => a + b.value, 0);
  const owe = NW_OWE.reduce((a, b) => a + b.value, 0);
  const col = (title: string, items: typeof NW_OWN, total: number, color: string) => (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-ink"><span className="size-2.5 rounded-full" style={{ background: color }} aria-hidden />{title}</p>
      <ul className="mt-3 space-y-2 text-[13px]">
        {items.map((it) => (
          <li key={it.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-ink-2"><it.icon className="size-3.5 text-muted" strokeWidth={1.75} aria-hidden />{it.label}</span>
            <span className="tnum font-medium text-ink">{usd(it.value)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between border-t border-line pt-2.5 text-sm font-semibold text-ink"><span>Total</span><span className="tnum">{usd(total)}</span></p>
    </div>
  );
  const sign = (s: string) => <span className="grid place-items-center font-serif text-[36px] leading-none text-muted" aria-hidden>{s}</span>;
  return (
    <Figure
      kind="diagram"
      title="A net worth snapshot"
      subtitle="One person's finances on a single day."
      howToRead={[
        'The left box lists what this person owns, at what each item would sell for today.',
        'The middle box lists every balance they still owe.',
        'The bars underneath compare the two totals at the same scale.',
      ]}
      takeaway={<>Owning {usd(own)} and owing {usd(owe)} gives a net worth of <strong>{usd(own - owe)}</strong>. If that number is higher in three months, this person is moving forward, whatever happened to their income.</>}
    >
      <div role="img" aria-label={'Owns ' + usd(own) + ', owes ' + usd(owe) + ', net worth ' + usd(own - owe)}>
        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_minmax(0,12rem)]">
          {col('What you own', NW_OWN, own, 'var(--s1)')}
          {sign('−')}
          {col('What you owe', NW_OWE, owe, 'var(--s2)')}
          {sign('=')}
          <div className="rounded-2xl border border-accent/50 bg-accent-soft/70 p-4 text-center">
            <p className="text-sm font-medium text-ink">Net worth</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-ink">{usd(own - owe)}</p>
          </div>
        </div>
        <div className="mt-5 space-y-2" aria-hidden>
          {[{ k: 'Own', v: own, c: 'var(--s1)' }, { k: 'Owe', v: owe, c: 'var(--s2)' }].map((b) => (
            <div key={b.k} className="grid grid-cols-[3rem_1fr] items-center gap-3 text-xs text-ink-2">
              <span>{b.k}</span>
              <div className="flex items-center gap-2">
                <div className="h-3 rounded-r-[4px]" style={{ width: (b.v / own) * 85 + '%', background: b.c }} />
                <span className="tnum font-medium text-ink">{usd(b.v)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Figure>
  );
}

const NW_DEFAULTS = { cash: 8000, invest: 12000, property: 9000, cards: 2500, loans: 7000, student: 15000, mortgage: 0 };
type NwState = typeof NW_DEFAULTS;
const NW_PRESETS: Preset<NwState>[] = [
  { label: 'Recent grad', values: { cash: 2000, invest: 1500, property: 6000, cards: 1800, loans: 0, student: 28000, mortgage: 0 } },
  { label: 'Mid-career renter', values: { cash: 12000, invest: 65000, property: 14000, cards: 0, loans: 9000, student: 6000, mortgage: 0 } },
  { label: 'New homeowner', values: { cash: 8000, invest: 40000, property: 380000, cards: 2000, loans: 15000, student: 0, mortgage: 310000 } },
];
const NW_GUIDE: SimGuide<NwState> = {
  how: ['Enter what you own at today\'s resale value.', 'Enter every balance you owe.', 'Read your net worth. Write it down with today\'s date.'],
  tryThis: [
    { label: 'Try "Recent grad." Is a negative net worth unusual?', done: (s) => s.student >= 28000 && s.invest <= 1500 },
    { label: 'Pay off the credit card. Which number changes?', done: (s) => s.cards === 0 },
  ],
};

function NetWorthCheck() {
  const sim = useSim(NW_DEFAULTS);
  const s = sim.state;
  const own = s.cash + s.invest + s.property;
  const owe = s.cards + s.loans + s.student + s.mortgage;
  const nw = own - owe;
  const scale = Math.max(own, owe, 1);
  const ownSegs: Segment[] = [
    { key: 'cash', label: 'Cash', value: s.cash, color: 'var(--s1)' },
    { key: 'invest', label: 'Investments', value: s.invest, color: 'var(--s3)' },
    { key: 'property', label: 'Home & car', value: s.property, color: 'var(--s7)' },
  ];
  const oweSegs: Segment[] = [
    { key: 'cards', label: 'Cards', value: s.cards, color: 'var(--s2)' },
    { key: 'loans', label: 'Car & personal', value: s.loans, color: 'var(--s4)', ink: 'var(--on-s4)' },
    { key: 'student', label: 'Student', value: s.student, color: 'var(--s5)' },
    { key: 'mortgage', label: 'Mortgage', value: s.mortgage, color: 'var(--s8)' },
  ];
  return (
    <SimCard title="Net Worth Check" kind="Mini sandbox" icon={Scale} sim={sim} presets={NW_PRESETS} guide={NW_GUIDE}
      subtitle="Add up what you own and what you owe. The difference is your net worth.">
      <SimGrid controls={
        <>
          <ControlGroup title="What you own">
            <SliderField label="Cash (checking & savings)" value={s.cash} onChange={sim.set('cash')} min={0} max={100000} step={500} format={(v) => usd(v)} />
            <SliderField label="Retirement & investments" value={s.invest} onChange={sim.set('invest')} min={0} max={500000} step={1000} format={(v) => usd(v)} />
            <SliderField label="Home & car (resale value)" value={s.property} onChange={sim.set('property')} min={0} max={800000} step={1000} format={(v) => usd(v)} help="What they would sell for today, not what you paid." />
          </ControlGroup>
          <ControlGroup title="What you owe">
            <SliderField label="Credit cards" value={s.cards} onChange={sim.set('cards')} min={0} max={30000} step={100} format={(v) => usd(v)} />
            <SliderField label="Car & personal loans" value={s.loans} onChange={sim.set('loans')} min={0} max={60000} step={500} format={(v) => usd(v)} />
            <SliderField label="Student loans" value={s.student} onChange={sim.set('student')} min={0} max={150000} step={500} format={(v) => usd(v)} />
            <SliderField label="Mortgage" value={s.mortgage} onChange={sim.set('mortgage')} min={0} max={700000} step={1000} format={(v) => usd(v)} />
          </ControlGroup>
        </>
      }>
        <StatGrid>
          <StatTile label="You own" value={usd(own)} />
          <StatTile label="You owe" value={usd(owe)} />
          <StatTile label="Net worth" value={usd(nw)} sub="own − owe" emphasis />
        </StatGrid>
        <div className="space-y-4 rounded-xl border border-line p-4">
          {[{ title: 'Own', segs: ownSegs, total: own }, { title: 'Owe', segs: oweSegs, total: owe }].map((row) => (
            <div key={row.title}>
              <p className="mb-2 flex justify-between text-sm font-semibold text-ink"><span>{row.title}</span><span className="tnum">{usd(row.total)}</span></p>
              <div style={{ width: (row.total / scale) * 100 + '%', minWidth: row.total > 0 ? '2rem' : 0 }}>
                {row.total > 0 && <SegmentBar segments={row.segs} total={row.total} format={usd} height={28} ariaLabel={row.title + ' ' + usd(row.total)} />}
              </div>
              <SegmentLegend segments={row.segs.filter((x) => x.value > 0)} total={row.total} format={usd} />
            </div>
          ))}
        </div>
        {nw < 0 ? (
          <Nudge tone="info" title="A negative net worth is common early on">
            Student loans often outweigh everything a new graduate owns. What matters is the direction: check again in three months and see if the number went up.
          </Nudge>
        ) : (
          <Nudge tone="good" title={'Net worth of ' + usd(nw)}>
            Write this number down with today's date. Recheck it every three months. Rising means you are building wealth.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 1.2 Plugging the leaks                                              */
/* ================================================================== */

function StatementFigure() {
  return (
    <Figure
      kind="example"
      title="What a 10-minute statement check finds"
      subtitle="One month of a checking account, with every charge that could be cut marked."
      howToRead={[
        'Each row is one transaction. Tags on the right of the description say why a row is marked.',
        <><strong>Unused</strong> and <strong>Duplicate</strong> mark subscriptions nobody used; <strong>Fees</strong> marks delivery and service charges.</>,
        <><strong>Bank fee</strong> marks charges the bank added. <strong>Keep</strong> marks a subscription that gets used.</>,
      ]}
      takeaway={<>About <strong>$127</strong> of this month's charges bought nothing the account holder used or wanted. Over a year that is about <strong>$1,518</strong>.</>}
      note="Names and amounts are examples."
    >
      <StatementMockup
        label="Example checking account statement with flagged charges"
        issuer="Example Bank"
        title="Everyday Checking ••4821"
        period="Oct 1 – Oct 31"
        rows={[
          { date: '10/01', label: 'Payroll deposit', amount: 2000 },
          { date: '10/02', label: 'Rent payment', amount: -1250 },
          { date: '10/03', label: 'StreamFlix monthly', amount: -15.49, flag: { text: 'Unused', tone: 'warning' } },
          { date: '10/05', label: 'FitLife gym', amount: -39.99, flag: { text: 'Unused', tone: 'warning' } },
          { date: '10/07', label: 'QuickEats order (includes $8.47 delivery & service fees)', amount: -31.48, flag: { text: 'Fees', tone: 'warning' } },
          { date: '10/09', label: 'PhotoVault storage', amount: -2.99, flag: { text: 'Duplicate', tone: 'warning' } },
          { date: '10/12', label: 'Non-network ATM fee', amount: -3.5, flag: { text: 'Bank fee', tone: 'critical' } },
          { date: '10/15', label: 'Payroll deposit', amount: 2000 },
          { date: '10/16', label: 'City Electric', amount: -94.12 },
          { date: '10/18', label: 'Overdraft fee', amount: -35, flag: { text: 'Bank fee', tone: 'critical' } },
          { date: '10/21', label: 'QuickEats order (includes $9.10 delivery & service fees)', amount: -29.65, flag: { text: 'Fees', tone: 'warning' } },
          { date: '10/25', label: 'Monthly maintenance fee', amount: -12, flag: { text: 'Bank fee', tone: 'critical' } },
          { date: '10/27', label: 'Music+ family plan', amount: -11.99, flag: { text: 'Keep', tone: 'good' } },
        ]}
        summary={[
          { label: 'Unused or duplicate subscriptions', value: '$58.47' },
          { label: 'Delivery & service fees', value: '$17.57' },
          { label: 'Bank fees', value: '$50.50' },
          { label: 'Could cut this month', value: '$126.54', strong: true },
        ]}
      />
    </Figure>
  );
}

const LEAK_BARS = [
  { label: 'Coffee & snacks on the go ($5 × 20 days)', monthly: 100 },
  { label: 'Unused gym membership', monthly: 40 },
  { label: 'Delivery & service fees (4 orders)', monthly: 36 },
  { label: 'Two streaming services you rarely watch', monthly: 28 },
  { label: 'Bank fees', monthly: 15 },
].map((d) => ({ ...d, yearly: d.monthly * 12 }));

function LeakCostChart() {
  const total = LEAK_BARS.reduce((a, b) => a + b.yearly, 0);
  return (
    <Figure
      title="What small monthly charges cost in a year"
      subtitle="Five common charges, each multiplied by 12."
      height={260}
      table={{ columns: ['Charge', 'Per month', 'Per year'], rows: LEAK_BARS.map((d) => [d.label, usd(d.monthly), usd(d.yearly)]) }}
      howToRead={[
        'Each bar is one common charge.',
        'Bar length is the cost over 12 months; the number at the end is the exact yearly amount.',
        'Switch to Table for the monthly amounts.',
      ]}
      takeaway={<>Together these come to <strong>{usd(total)} a year</strong>, about {usd(total / 12)} a month, and none of them feels large when it happens.</>}
    >
      <BarChart data={LEAK_BARS} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={(v) => usd(v, { compact: true })} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={210} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v) + ' a year'} />} />
        <Bar dataKey="yearly" name="Yearly cost" fill="var(--s1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => usd(v))} />
      </BarChart>
    </Figure>
  );
}

const LEAKS = [
  { key: 'subs', label: 'Streaming you rarely watch', icon: Tv, max: 100, color: 'var(--s1)' },
  { key: 'gym', label: 'Gym or app memberships you don\'t use', icon: Repeat, max: 150, color: 'var(--s2)' },
  { key: 'delivery', label: 'Delivery & service fees', icon: ShoppingCart, max: 200, color: 'var(--s3)' },
  { key: 'convenience', label: 'Convenience buys (coffee, snacks)', icon: Wallet, max: 400, color: 'var(--s4)', ink: 'var(--on-s4)' },
  { key: 'bank', label: 'Bank fees (overdraft, ATM, monthly)', icon: Landmark, max: 100, color: 'var(--s5)' },
] as const;
type LeakKey = (typeof LEAKS)[number]['key'];
const LEAK_DEFAULTS = {
  on: { subs: true, gym: true, delivery: true, convenience: false, bank: true } as Record<LeakKey, boolean>,
  amt: { subs: 28, gym: 40, delivery: 36, convenience: 100, bank: 15 } as Record<LeakKey, number>,
};
type LeakState = typeof LEAK_DEFAULTS;
const LEAK_PRESETS: Preset<LeakState>[] = [
  { label: 'Subscriptions only', values: { on: { subs: true, gym: true, delivery: false, convenience: false, bank: false }, amt: LEAK_DEFAULTS.amt } },
  { label: 'Delivery habit', values: { on: { subs: false, gym: false, delivery: true, convenience: true, bank: false }, amt: { ...LEAK_DEFAULTS.amt, delivery: 90, convenience: 150 } } },
  { label: 'All five', values: { on: { subs: true, gym: true, delivery: true, convenience: true, bank: true }, amt: LEAK_DEFAULTS.amt } },
];
const LEAK_GUIDE: SimGuide<LeakState> = {
  how: ['Switch on the charges you recognize.', 'Set each to what you pay per month.', 'Read the yearly cost and what it could grow to.'],
  tryThis: [
    { label: 'Switch on all five charges.', done: (s) => Object.values(s.on).every(Boolean) },
    { label: 'Raise delivery fees to $100 a month. What is the 10-year figure?', done: (s) => s.on.delivery && s.amt.delivery >= 100 },
  ],
};

function LeakFinder() {
  const sim = useSim(LEAK_DEFAULTS);
  const s = sim.state;
  const monthly = LEAKS.reduce((a, l) => a + (s.on[l.key] ? s.amt[l.key] : 0), 0);
  const invested = futureValue(monthly, 6, 120);
  const segs: Segment[] = LEAKS.filter((l) => s.on[l.key]).map((l) => ({ key: l.key, label: l.label, value: s.amt[l.key], color: l.color, ink: 'ink' in l ? l.ink : undefined }));
  const setOn = (k: LeakKey) => (v: boolean) => sim.setState((st) => ({ ...st, on: { ...st.on, [k]: v } }));
  const setAmt = (k: LeakKey) => (v: number) => sim.setState((st) => ({ ...st, amt: { ...st.amt, [k]: v } }));
  return (
    <SimCard title="Charge Finder" kind="Mini sandbox" icon={Search} sim={sim} presets={LEAK_PRESETS} guide={LEAK_GUIDE}
      subtitle="Pick the charges you could cut and see what they add up to.">
      <SimGrid wideControls controls={
        <ControlGroup title="Charges to cut">
          {LEAKS.map((l) => (
            <div key={l.key} className="space-y-1.5">
              <Switch checked={s.on[l.key]} onChange={setOn(l.key)} label={<span className="inline-flex items-center gap-1.5"><l.icon className="size-3.5 text-muted" aria-hidden />{l.label}</span>} />
              {s.on[l.key] && <SliderField label="Per month" value={s.amt[l.key]} onChange={setAmt(l.key)} min={0} max={l.max} step={1} format={(v) => usd(v)} />}
            </div>
          ))}
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="Per month" value={usd(monthly)} />
          <StatTile label="Per year" value={usd(monthly * 12)} emphasis />
          <StatTile label="Invested for 10 years" value={usd(invested)} sub="at 6% a year" />
        </StatGrid>
        {monthly > 0 ? (
          <div className="rounded-xl border border-line p-4">
            <p className="mb-3 text-sm font-semibold text-ink">Where the {usd(monthly)} a month goes</p>
            <SegmentBar segments={segs} total={monthly} format={usd} inside="value" ariaLabel="Monthly cost of each selected charge" />
            <SegmentLegend segments={segs} total={monthly} format={usd} />
          </div>
        ) : (
          <Nudge tone="info" title="Nothing selected">Switch on at least one charge to see its cost.</Nudge>
        )}
        <Nudge tone="tip" title="Cancel today, not later">
          Most subscriptions can be cancelled online in a few minutes. Redirect the same amount to savings with an automatic transfer so it doesn't get spent elsewhere.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 1.3 Simple budgeting                                                */
/* ================================================================== */

function PayYourselfFirstDiagram() {
  return (
    <Figure
      kind="diagram"
      title="The same $2,000 paycheck, in two different orders"
      howToRead={[
        'Each row follows one $2,000 paycheck from left to right.',
        'Top row: savings come last, from whatever is left.',
        'Bottom row: savings move first, automatically, on payday.',
      ]}
      takeaway={<>Both people earn the same. Only the order changed, and the person who saves first is certain to save <strong>$300 every paycheck</strong>, or $7,800 a year on 26 paychecks.</>}
    >
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-2">Saving what is left</p>
          <FlowDiagram label="Paycheck, then bills and spending, then savings from whatever remains" steps={[
            { icon: Banknote, title: 'Paycheck', amount: '$2,000' },
            { icon: Receipt, title: 'Bills and spending as they come up', amount: '$2,000', detail: 'Spending rises to match what is in checking.' },
            { icon: PiggyBank, title: 'Savings: whatever remains', amount: '$0' },
          ]} />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-2">Paying yourself first</p>
          <FlowDiagram label="Paycheck, then automatic savings and bills, then spending money" steps={[
            { icon: Banknote, title: 'Paycheck', amount: '$2,000' },
            [
              { icon: PiggyBank, title: 'Savings & investing, moved on payday', amount: '$300', emphasis: true },
              { icon: House, title: 'Bills (rent share, utilities, phone)', amount: '$1,100' },
            ],
            { icon: Wallet, title: 'Spending money', amount: '$600', detail: 'Spend it however you like.' },
          ]} />
        </div>
      </div>
    </Figure>
  );
}

function SplitDiagram() {
  const rows = [
    { title: 'Typical: $4,000 take-home (50 / 30 / 20)', total: 4000, parts: [2000, 1200, 800] },
    { title: 'High-cost city: $5,200 take-home (60 / 25 / 15)', total: 5200, parts: [3120, 1300, 780] },
  ];
  const seg = (p: number[]): Segment[] => [
    { key: 'needs', label: 'Needs', value: p[0], color: 'var(--s1)' },
    { key: 'wants', label: 'Wants', value: p[1], color: 'var(--s2)' },
    { key: 'save', label: 'Debt payoff, saving & investing', value: p[2], color: 'var(--s3)' },
  ];
  return (
    <Figure
      kind="diagram"
      title="A simple split of each month's take-home pay"
      howToRead={[
        'Each bar is one month of take-home pay split three ways. The percentage is printed inside each part.',
        'The list under each bar gives the dollar amounts.',
        'The second bar shows the adjustment for a high-rent city.',
      ]}
      takeaway={<>Even when rent pushes needs to 60%, keeping 15% for debt payoff, saving and investing still means <strong>$780 a month</strong>, or $9,360 a year.</>}
    >
      <div className="space-y-6">
        {rows.map((r) => (
          <div key={r.title}>
            <p className="mb-2 text-sm font-semibold text-ink">{r.title}</p>
            <SegmentBar segments={seg(r.parts)} total={r.total} format={usd} height={28} ariaLabel={r.title} />
            <SegmentLegend segments={seg(r.parts)} total={r.total} format={usd} />
          </div>
        ))}
      </div>
    </Figure>
  );
}

const SINKING = (() => {
  const repairs: Record<number, number> = { 8: 600, 16: 450 };
  const out: { month: number; balance: number }[] = [{ month: 0, balance: 0 }];
  let bal = 0;
  for (let m = 1; m <= 18; m++) { bal += 75 - (repairs[m] ?? 0); out.push({ month: m, balance: bal }); }
  return out;
})();

function SinkingFundChart() {
  return (
    <Figure
      title="A car-repair sinking fund over 18 months"
      subtitle="$75 goes in every month. Two repairs are paid from the fund."
      height={260}
      table={{ columns: ['Month', 'Balance'], rows: SINKING.map((d) => [d.month, usd(d.balance)]) }}
      howToRead={[
        'The bottom axis counts months. The side axis shows how much is in the fund.',
        'The line climbs $75 each month as the automatic deposit arrives.',
        'Each sharp drop is a repair bill paid from the fund.',
      ]}
      takeaway={<>Both repairs, <strong>$1,050 in total</strong>, were paid in cash. Without the fund, they would likely have gone on a credit card at around 22% interest.</>}
    >
      <LineChart data={SINKING} margin={{ top: 28, right: 24, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="month" type="number" domain={[0, 18]} ticks={[0, 3, 6, 9, 12, 15, 18]} tickFormatter={(v) => 'Mo ' + v} {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v)} domain={[0, 700]} ticks={[0, 200, 400, 600]} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Month ' + l} valueFormat={(v) => usd(v)} />} />
        <Line dataKey="balance" name="Fund balance" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
        <ReferenceDot x={8} y={0} r={5} fill="var(--s1)" stroke="var(--surface)" strokeWidth={2} label={{ value: 'Brakes −$600', position: 'top', fill: 'var(--ink)', fontSize: 12, fontWeight: 600, offset: 10 }} />
        <ReferenceDot x={16} y={150} r={5} fill="var(--s1)" stroke="var(--surface)" strokeWidth={2} label={{ value: 'Tires −$450', position: 'top', fill: 'var(--ink)', fontSize: 12, fontWeight: 600, offset: 10 }} />
      </LineChart>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Paycheck decoder and allocator (sliders)                             */
/* ------------------------------------------------------------------ */

const PAY_DEFAULTS = { gross: 60000, k401Pct: 5, health: 150, statePct: 4 };
type PayState = typeof PAY_DEFAULTS;
const PAY_PRESETS: Preset<PayState>[] = [
  { label: '$45k first job', values: { gross: 45000, k401Pct: 0, health: 120, statePct: 4 } },
  { label: '$75k + 6% 401(k)', values: { gross: 75000, k401Pct: 6, health: 180, statePct: 5 } },
  { label: 'No state income tax', values: { gross: 60000, k401Pct: 5, health: 150, statePct: 0 } },
];
const PAY_GUIDE: SimGuide<PayState> = {
  how: ['Set your yearly salary.', 'Add your 401(k), health plan and state tax.', 'Read your monthly take-home pay.'],
  tryThis: [
    { label: 'Raise your 401(k) to 10%. Does take-home drop by the full amount?', done: (s) => s.k401Pct >= 10 },
    { label: 'Double the salary to $120,000. Does take-home double too?', done: (s) => s.gross >= 120000 },
  ],
};

function PaycheckDecoder() {
  const sim = useSim(PAY_DEFAULTS);
  const s = sim.state;
  const p = useMemo(() => paycheck({ gross: s.gross, status: 'single', k401Pct: s.k401Pct, healthMonthly: s.health, statePct: s.statePct }), [s]);
  const m = (n: number) => n / 12;
  const segs: Segment[] = [
    { key: 'net', label: 'Take-home', value: m(p.net), color: 'var(--s1)' },
    { key: 'fed', label: 'Federal tax', value: m(p.federal), color: 'var(--s2)' },
    { key: 'fica', label: 'FICA', value: m(p.fica), color: 'var(--s3)' },
    { key: 'state', label: 'State tax', value: m(p.state), color: 'var(--s4)', ink: 'var(--on-s4)' },
    { key: 'health', label: 'Health insurance', value: m(p.health), color: 'var(--s5)' },
    { key: 'k401', label: '401(k)', value: m(p.retirement), color: 'var(--s6)' },
  ];
  return (
    <SimCard title="Paycheck Decoder" kind="Mini sandbox" icon={Receipt} sim={sim} presets={PAY_PRESETS} guide={PAY_GUIDE}
      subtitle="See how much of your salary actually reaches your bank (single filer, 2026 taxes).">
      <SimGrid controls={
        <ControlGroup title="Your job">
          <SliderField label="Gross salary (per year)" value={s.gross} onChange={sim.set('gross')} min={20000} max={200000} step={1000} format={(v) => usd(v)} />
          <SliderField label="401(k) contribution" value={s.k401Pct} onChange={sim.set('k401Pct')} min={0} max={15} step={1} format={(v) => v + '%'} help="Pre-tax: lowers your income tax." />
          <SliderField label="Health insurance (per month)" value={s.health} onChange={sim.set('health')} min={0} max={600} step={10} format={(v) => usd(v)} />
          <SliderField label="State income tax (approx.)" value={s.statePct} onChange={sim.set('statePct')} min={0} max={10} step={0.5} format={(v) => v + '%'} />
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="Gross per month" value={usd(m(p.gross))} sub="your salary ÷ 12" />
          <StatTile label="Take-home per month" value={usd(m(p.net))} sub={`≈ ${usd(p.net / 26)} per biweekly check`} emphasis />
          <StatTile label="You keep" value={pct((p.net / p.gross) * 100, 0)} sub="of your gross pay" />
        </StatGrid>
        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Where {usd(m(p.gross))} of monthly gross pay goes</p>
          <SegmentBar segments={segs} total={m(p.gross)} format={usd} ariaLabel="Gross pay split into take-home pay, taxes and deductions" />
          <SegmentLegend segments={segs} total={m(p.gross)} format={usd} />
        </div>
        <Nudge tone="tip" title="Good to know">
          The 401(k) slice is still <em>your</em> money, saved for later. Because it's a <Term id="pre-tax-deduction">pre-tax deduction</Term>,
          each $1 you put in lowers your take-home by less than $1.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */
/* Paycheck allocator (main sandbox)                                    */
/* ------------------------------------------------------------------ */

const SINKING_ITEMS = [
  { key: 'car', label: 'Car maintenance & repairs', icon: Car, max: 3000 },
  { key: 'gifts', label: 'Gifts & holidays', icon: Gift, max: 3000 },
  { key: 'subs', label: 'Annual subscriptions & fees', icon: Tv, max: 1500 },
  { key: 'medical', label: 'Medical & dental copays', icon: Stethoscope, max: 2000 },
] as const;
type SinkKey = (typeof SINKING_ITEMS)[number]['key'];

const DEFAULTS = {
  takeHome: 4000,
  needs: 2000,
  wants: 1200,
  savings: 800,
  sinkingOn: false,
  sinking: { car: 900, gifts: 600, subs: 240, medical: 300 } as Record<SinkKey, number>,
};
type BudgetState = typeof DEFAULTS;

const PRESETS: Preset<BudgetState>[] = [
  { label: 'Entry-Level Grad', hint: '$3,200 take-home with sinking funds turned on', values: { takeHome: 3200, needs: 1550, wants: 850, savings: 600, sinkingOn: true, sinking: { car: 600, gifts: 400, subs: 180, medical: 240 } } },
  { label: 'High-Cost City Renter', hint: '$5,200 take-home, rent pushes needs to ~60%', values: { takeHome: 5200, needs: 3100, wants: 1150, savings: 750 } },
  { label: 'Aggressive Debt Payoff', hint: 'Wants cut hard to put 40% toward debt', values: { takeHome: 4200, needs: 2000, wants: 500, savings: 1700 } },
];

/** Same "left to assign" math as the allocator below, used only to tick off the guide's experiments. */
const leftToAssign = (s: BudgetState) =>
  s.takeHome - (s.needs + s.wants + s.savings + (s.sinkingOn ? Object.values(s.sinking).reduce((a, b) => a + b, 0) / 12 : 0));

const ALLOCATOR_GUIDE: SimGuide<BudgetState> = {
  how: ['Set your monthly take-home pay.', 'Drag the three sliders to split it.', 'Aim for $0 left to assign.'],
  tryThis: [
    { label: 'Turn on sinking funds, then get back to $0 left.', done: (s) => s.sinkingOn && Math.abs(leftToAssign(s)) < 0.5 },
    { label: 'Push Needs past 50%, but still put 15% toward savings and debt.', done: (s) => s.takeHome > 0 && s.needs > s.takeHome * 0.5 && s.savings >= s.takeHome * 0.15 && leftToAssign(s) >= -0.5 },
    { label: 'Trim Wants until your emergency fund takes 6 months or less.', done: (s) => s.needs > 0 && s.savings > 0 && leftToAssign(s) >= -0.5 && Math.ceil((s.needs * 3) / s.savings) <= 6 },
  ],
};

function PaycheckAllocator() {
  const sim = useSim(DEFAULTS);
  const { data: myMoney } = useMoney();
  const mine = useMemo(() => myBudgetPreset(myMoney), [myMoney]);
  const presets: Preset<BudgetState>[] = mine ? [...PRESETS, { label: 'My numbers', hint: 'From your My Money budget', values: mine }] : PRESETS;
  const s = sim.state;
  const sinkingMonthly = s.sinkingOn ? Object.values(s.sinking).reduce((a, b) => a + b, 0) / 12 : 0;
  const planned = s.needs + s.wants + s.savings + sinkingMonthly;
  const left = s.takeHome - planned;
  const P = (v: number) => (s.takeHome > 0 ? (v / s.takeHome) * 100 : 0);
  const maxSlider = Math.max(s.takeHome, 1000);

  const segs: Segment[] = [
    { key: 'needs', label: 'Needs', value: s.needs, color: 'var(--s1)' },
    { key: 'wants', label: 'Wants', value: s.wants, color: 'var(--s2)' },
    { key: 'savings', label: 'Savings & debt', value: s.savings, color: 'var(--s3)' },
    ...(s.sinkingOn ? [{ key: 'sinking', label: 'Sinking funds', value: sinkingMonthly, color: 'var(--s4)', ink: 'var(--on-s4)' }] : []),
    ...(left > 0.5 ? [{ key: 'left', label: 'Not yet assigned', value: left, color: 'var(--s-neutral)', ink: 'var(--ink-2)' }] : []),
  ];
  const guide: Segment[] = [
    { key: 'needs', label: 'Needs', value: s.takeHome * 0.5, color: 'var(--s1)' },
    { key: 'wants', label: 'Wants', value: s.takeHome * 0.3, color: 'var(--s2)' },
    { key: 'savings', label: 'Savings & debt', value: s.takeHome * 0.2, color: 'var(--s3)' },
  ];

  const nudges: { tone: 'good' | 'warning' | 'critical' | 'info' | 'tip'; title: string; body: ReactNode }[] = [];
  if (left < -0.5) nudges.push({ tone: 'critical', title: `Planned ${usd(-left)} more than you bring home`, body: <>That gap usually lands on a credit card. Try trimming wants first, since needs are harder to change fast.</> });
  if (P(s.needs) > 50.5) nudges.push({ tone: 'warning', title: `Needs are ${pct(P(s.needs), 0)} of take-home`, body: <>Very common, especially with high rent. 50% is a guide. A 60/25/15 split still puts 15% toward debt payoff, saving and investing.</> });
  if (P(s.savings) < 15 && left > -0.5) nudges.push({ tone: 'info', title: 'Savings under 15%', body: <>The target is at least 15–20%. Even a small automatic amount builds the habit. Could {usd(Math.min(100, Math.max(25, s.wants * 0.1)))} move from wants to savings?</> });
  if (left > 0.5) nudges.push({ tone: 'tip', title: `${usd(left)} not assigned yet`, body: <>Unassigned money in checking usually gets spent. Assign it to savings, a sinking fund or planned spending.</> });
  if (nudges.length === 0) nudges.push({ tone: 'good', title: 'Every dollar is planned', body: <>Your plan matches your take-home pay exactly. That's called "zero-based" budgeting.</> });

  const yearSavings = s.savings * 12;
  const efTarget = s.needs * 3;
  const monthsToEf = s.savings > 0 ? Math.ceil(efTarget / s.savings) : Infinity;

  return (
    <SimCard title="Paycheck Allocator" sim={sim} presets={presets} guide={ALLOCATOR_GUIDE}
      subtitle="Plan where each dollar of your monthly take-home pay will go.">
      <SimGrid controls={
        <>
          <ControlGroup title="Income">
            <SliderField label="Monthly take-home pay" value={s.takeHome} onChange={sim.set('takeHome')} min={1000} max={12000} step={50} format={(v) => usd(v)} />
          </ControlGroup>
          <ControlGroup title="Your plan">
            <SliderField label={<span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: 'var(--s1)' }} />Needs</span>} value={s.needs} onChange={sim.set('needs')} min={0} max={maxSlider} step={25} format={(v) => usd(v)} help="Rent, utilities, groceries, insurance, minimum debt payments" />
            <SliderField label={<span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: 'var(--s2)' }} />Wants</span>} value={s.wants} onChange={sim.set('wants')} min={0} max={maxSlider} step={25} format={(v) => usd(v)} help="Dining out, hobbies, streaming, travel" />
            <SliderField label={<span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: 'var(--s3)' }} />Savings & extra debt</span>} value={s.savings} onChange={sim.set('savings')} min={0} max={maxSlider} step={25} format={(v) => usd(v)} help="Emergency fund, investing, debt payments above the minimum" />
          </ControlGroup>
          <ControlGroup title="Irregular expenses">
            <Switch checked={s.sinkingOn} onChange={sim.set('sinkingOn')} label="Use sinking funds" description="Save a little each month for costs that don't come monthly" />
            {s.sinkingOn && (
              <div className="space-y-3 pt-1">
                {SINKING_ITEMS.map((it) => (
                  <SliderField key={it.key} label={<span className="inline-flex items-center gap-1.5 text-[13px]"><it.icon className="size-3.5 text-muted" aria-hidden />{it.label}</span>}
                    value={s.sinking[it.key]} min={0} max={it.max} step={20} format={(v) => usd(v) + '/yr'}
                    onChange={(v) => sim.setState((st) => ({ ...st, sinking: { ...st.sinking, [it.key]: v } }))} />
                ))}
                <p className="text-xs text-ink-2">= <strong className="text-ink">{usd(sinkingMonthly)}/month</strong> set aside ({usd(sinkingMonthly * 12)}/yr ÷ 12)</p>
                {left < -0.5 && s.wants > 0 && (
                  <Button size="sm" variant="soft" icon={ArrowDownToLine} onClick={() => sim.setState((st) => ({ ...st, wants: Math.max(0, Math.round(st.wants + (st.takeHome - planned))) }))}>
                    Make room by trimming wants
                  </Button>
                )}
              </div>
            )}
          </ControlGroup>
        </>
      }>
        <StatGrid cols={4}>
          <StatTile label="Needs" value={pct(P(s.needs), 0)} sub="guide: ~50%" />
          <StatTile label="Wants" value={pct(P(s.wants), 0)} sub="guide: the rest" />
          <StatTile label="Savings & debt" value={pct(P(s.savings), 0)} sub="target: 15–20%+" />
          <StatTile label={left >= -0.5 ? 'Left to assign' : 'Over budget by'} value={usd(Math.abs(left))} sub={left >= -0.5 ? 'assign it' : 'trim something'} emphasis={Math.abs(left) < 0.5} />
        </StatGrid>

        <div className="space-y-5 rounded-xl border border-line p-4">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-sm font-semibold text-ink">Your plan</p>
              <p className="tnum text-xs text-muted">{usd(planned)} of {usd(s.takeHome)}</p>
            </div>
            <div className={left < -0.5 ? 'pt-5' : undefined}>
              <SegmentBar segments={segs} total={s.takeHome} format={usd} markerLabel="Take-home pay" ariaLabel="Your monthly plan split into needs, wants, savings and more" />
            </div>
            <SegmentLegend segments={segs} total={s.takeHome} format={usd} />
          </div>
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-sm font-semibold text-ink">50/30/20 starting point</p>
              <p className="text-xs text-muted">for comparison</p>
            </div>
            <SegmentBar segments={guide} total={s.takeHome} format={usd} height={28} ariaLabel="The 50/30/20 guideline for the same take-home pay" />
          </div>
        </div>

        <div className="space-y-2">
          {nudges.map((n) => <Nudge key={n.title} tone={n.tone} title={n.title}>{n.body}</Nudge>)}
        </div>

        <p className="rounded-xl bg-surface-2/70 px-4 py-3 text-sm text-ink-2">
          <strong className="text-ink">Big picture:</strong> {usd(s.savings)}/month is <strong className="text-ink">{usd(yearSavings)} a year</strong> toward your goals.
          {Number.isFinite(monthsToEf) && efTarget > 0 && <> Put it all toward a 3-month <Term id="emergency-fund">emergency fund</Term> ({usd(efTarget)} of needs), and you'd get there in about <strong className="text-ink">{monthsToEf} months</strong>.</>}
        </p>
      </SimGrid>
    </SimCard>
  );
}


/* ================================================================== */
/* Decision check + cheat sheet                                        */
/* ================================================================== */

export const questions: QuizQuestion[] = [
  {
    id: 'net-worth',
    scenario: <>You earn <strong>$85,000</strong> a year. You have $6,000 in savings, $20,000 in a 401(k) and a car that would sell for $12,000. You owe $9,000 on the car, $4,000 on a credit card and $22,000 in student loans.</>,
    prompt: 'What is your net worth?',
    options: [
      { text: '$85,000', why: <>That is your <strong>income</strong>. Income tells you what comes in; <Term id="net-worth">net worth</Term> tells you what you have kept.</> },
      { text: '$38,000', why: <>That is only what you <strong>own</strong>: $6,000 + $20,000 + $12,000. Net worth subtracts what you owe.</> },
      { text: '$3,000', correct: true, why: <>Yes. You own $38,000 and owe $9,000 + $4,000 + $22,000 = $35,000. $38,000 − $35,000 = <strong>$3,000</strong>. Track it every few months to see if it rises.</> },
      { text: '−$35,000', why: <>That counts only the <strong>debts</strong>. Your savings, 401(k) and car count too.</> },
    ],
  },
  {
    id: 'pay-first',
    scenario: <>You want to save <strong>$400 a month</strong>. You are paid on the 1st and the 15th. Last year you planned to save "what's left" and ended most months with less than $50.</>,
    prompt: 'Which plan is most likely to work?',
    options: [
      { text: 'Keep saving whatever is left at the end of the month, but try harder.', why: <>The order is the problem. Spending usually rises to match what is sitting in checking, so "what's left" tends to be close to $0.</> },
      { text: 'Set up an automatic $200 transfer to savings on each payday.', correct: true, why: <>This is <Term id="pay-yourself-first">paying yourself first</Term>. The $400 leaves checking before you can spend it, and you live on the rest without tracking every purchase.</> },
      { text: 'Move $400 at the end of the month if the balance allows it.', why: <>"If the balance allows it" is the same plan as before. Making the transfer automatic and early is what makes it happen.</> },
      { text: 'Log every purchase in a spreadsheet and save the difference.', why: <>That can work, but most people stop after a few weeks. An automatic transfer gets the same result with no daily effort.</> },
    ],
  },
  {
    id: 'car-repair',
    scenario: <>Your brakes need a <strong>$600</strong> repair. You've saved $75 a month for 8 months in a car <Term id="sinking-fund">sinking fund</Term>, so it holds exactly $600. Your credit card charges 24% <Term id="apr">APR</Term>, and you usually pay about $100 a month on it.</>,
    prompt: 'How should you pay for the repair?',
    options: [
      { text: 'Pay from the car sinking fund, then keep the $75 a month going.', correct: true, why: <>This is exactly what the fund is for. You pay <strong>$0 in interest</strong>, take on no new debt, and the fund refills in 8 months.</> },
      { text: 'Put it on the credit card and save the sinking fund "for a real emergency."', why: <>At 24% APR and $100 a month, the $600 takes about <strong>7 months</strong> to pay off and costs about <strong>$46 in interest</strong>. Meanwhile the fund just sits there.</> },
      { text: 'Pull it from your emergency fund instead.', why: <>It works, and it beats a credit card. But an emergency fund is for the <em>unexpected</em>, like a job loss. Car repairs are expected, so use the sinking fund and keep your emergency fund full.</> },
      { text: 'Skip the repair for a few months to avoid touching savings.', why: <>Worn brakes are a safety risk and can damage other parts, turning a <strong>$600</strong> job into <strong>$1,000+</strong>. The money is already saved, so use it.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Scale, title: 'Track net worth, not income.', body: <>Every three months, add up what you own and subtract what you owe. If the number rises, you are building wealth.</> },
  { icon: Scissors, title: 'Check last month\'s statement for 10 minutes.', body: <>Cancel 2 or 3 subscriptions or fees you won't miss, then send the same amount to savings automatically.</> },
  { icon: PiggyBank, title: 'Pay yourself first.', body: <>Move <strong>15–20%</strong> of take-home pay to saving, investing and debt payoff on payday. Use sinking funds for predictable bills.</> },
];

/* ================================================================== */

export default function CashFlowChapter() {
  return (
    <ChapterLayout
      id="cash-flow"
      questions={questions}
      rules={rules}
      sections={{
        '1-1': (
          <>
            <P>Two people can earn the same salary and end up in very different places. What decides the outcome is how much of each paycheck they keep and put to work.</P>
            <Bullets items={[
              <><strong className="text-ink">Income</strong> is what you earn each month.</>,
              <><strong className="text-ink">Wealth</strong> is what you keep and grow after the bills are paid: savings, investments, and the value of what you own outright.</>,
              <><strong className="text-ink"><Term id="net-worth">Net worth</Term></strong> puts that in one number: everything you own minus everything you owe.</>,
            ]} />
            <SameIncomeChart />
            <NetWorthDiagram />
            <Example title="Find your net worth in five minutes">
              <Steps items={[
                { title: 'List what you own.', body: 'Checking, savings, retirement accounts and investments, plus your car or home at what they would sell for today.' },
                { title: 'List what you owe.', body: 'Use the current balance from each statement: credit cards, car loan, student loans, mortgage.' },
                { title: 'Subtract.', body: 'Own − owe = net worth. A negative number is common early on, especially with student loans.' },
                { title: 'Write it down with the date.', body: 'Repeat every three months. The direction matters more than the size.' },
              ]} />
            </Example>
            <NetWorthCheck />
          </>
        ),
        '1-2': (
          <>
            <P>Most budgets lose money through small, automatic charges. No single one is large, so they often go unnoticed. Look for four kinds:</P>
            <Bullets items={[
              <><strong className="text-ink">Unused subscriptions:</strong> streaming services, apps, memberships and free trials that turned into <Term id="recurring-charge">recurring charges</Term>.</>,
              <><strong className="text-ink">Delivery fees:</strong> delivery, service and small-order fees, plus menu prices that are often higher in the app than in the store.</>,
              <><strong className="text-ink">Convenience spending:</strong> coffee and snacks bought on the go, vending machines, and last-minute purchases at higher prices.</>,
              <><strong className="text-ink">Bank fees:</strong> <Term id="overdraft-fee">overdraft fees</Term>, monthly maintenance fees and out-of-network ATM fees. Chapter 2 shows how to stop these for good.</>,
            ]} />
            <StatementFigure />
            <LeakCostChart />
            <H3>The 10-minute statement check</H3>
            <Steps items={[
              { title: 'Open last month\'s statements (2 minutes).', body: 'Checking and every credit card. Use the app or website.' },
              { title: 'Mark every recurring charge (3 minutes).', body: 'For each one, ask: did I use this in the last 30 days?' },
              { title: 'Mark every fee (2 minutes).', body: 'Overdraft, ATM, maintenance, late fees, and delivery or service fees.' },
              { title: 'Cancel 2 or 3 you won\'t miss (3 minutes).', body: 'Do it now, online. Start with the ones you forgot you had.' },
              { title: 'Set a monthly reminder.', body: 'New subscriptions and fees appear all the time. A short check each month catches them.' },
            ]} />
            <LeakFinder />
          </>
        ),
        '1-3': (
          <>
            <P>You don't need to record every purchase. Decide your savings amount once, automate it, and the only number you watch during the month is what is left in checking.</P>
            <H3>Pay yourself first</H3>
            <P>The moment your paycheck arrives, a set amount moves to savings and investing. You pay your bills and live on what is left. This is called <Term id="pay-yourself-first">paying yourself first</Term>, and Chapter 2 shows how to automate it.</P>
            <PayYourselfFirstDiagram />
            <H3>A simple split</H3>
            <P>Use this as a rule of thumb for your <Term id="net-pay">take-home pay</Term>, not a strict law:</P>
            <Bullets items={[
              <><strong className="text-ink">About half on needs:</strong> rent, food, utilities, insurance, transportation and minimum debt payments.</>,
              <><strong className="text-ink">A slice on wants:</strong> eating out, hobbies, travel, streaming.</>,
              <><strong className="text-ink">At least 15–20% toward your future:</strong> debt payoff above the minimum, savings and investing.</>,
              <><strong className="text-ink">In a high-cost city,</strong> needs may take 60% or more. Cut wants before you cut the 15%.</>,
            ]} />
            <SplitDiagram />
            <GoDeeper title="Not sure what your take-home pay is? Use the Paycheck Decoder">
              <p>Build your budget on the money that reaches your bank, not your salary. Taxes, Social Security and Medicare, and deductions such as a 401(k) or health insurance come out first.</p>
              <PaycheckDecoder />
            </GoDeeper>
            <PaycheckAllocator />
            <H3>Sinking funds</H3>
            <P>Some costs don't arrive every month but are completely predictable: car repairs, holidays and gifts, and annual bills such as insurance, registration or subscriptions. A <Term id="sinking-fund">sinking fund</Term> sets a little aside each month so the money is ready when the bill arrives.</P>
            <SinkingFundChart />
            <Example title="Four sinking funds, one monthly number">
              <p>List each yearly cost, then divide it by 12:</p>
              <Bullets items={[
                <>Car repairs: $900 ÷ 12 = <strong>$75/month</strong></>,
                <>Gifts and holidays: $600 ÷ 12 = <strong>$50/month</strong></>,
                <>Medical and dental copays: $300 ÷ 12 = <strong>$25/month</strong></>,
                <>Yearly subscriptions: $240 ÷ 12 = <strong>$20/month</strong></>,
              ]} />
              <p>Together: $75 + $50 + $25 + $20 = <strong>$170 a month</strong>, or $2,040 a year. Switch on sinking funds in the Paycheck Allocator above to see these numbers in a full plan.</p>
            </Example>
            <GoDeeper title="How to set up a sinking fund">
              <Bullets items={[
                <><strong>List the costs.</strong> Look through last year's statements for bills that came once or twice.</>,
                <><strong>Divide by the months you have.</strong> A $1,200 trip in 8 months needs $1,200 ÷ 8 = $150 a month.</>,
                <><strong>Automate it.</strong> Schedule a transfer for payday.</>,
                <><strong>Keep it separate.</strong> Use a separate savings account, or separately named savings goals if your bank offers them.</>,
                <><strong>Spend it when the bill arrives.</strong> That is what the money is for. Then keep the deposits going.</>,
              ]} />
            </GoDeeper>
            <Mistakes items={[
              <>Building your budget on your salary instead of your <strong>take-home pay</strong>.</>,
              <>Saving "whatever is left" instead of moving savings out on payday.</>,
              <>Forgetting yearly costs, like car registration or holiday gifts.</>,
              <>Leaving <strong>no</strong> money for wants. A plan that is too strict is hard to keep.</>,
            ]} />
          </>
        ),
      }}
    />
  );
}
