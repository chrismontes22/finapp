import { useMemo } from 'react';
import { Bar, BarChart, Cell, CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Armchair, Banknote, CalendarClock, CalendarDays, Car, CreditCard, Flame, Gauge, Landmark, LifeBuoy, Mountain, PiggyBank,
  Snowflake, Trophy, TriangleAlert,
} from 'lucide-react';
import { useMoney } from '../state/money';
import { myDebtPreset, myEmergencyPreset } from '../state/myPresets';
import { ChapterLayout } from '../components/ChapterLayout';
import { Term } from '../components/Glossary';
import { Bullets, Compare, ConceptCards, Example, Formula, GoDeeper, H3, Mistakes, P, Steps } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, type Segment } from '../components/SegmentBar';
import { Switch, cx } from '../components/ui';
import { activeDot, cursorProps, gridProps, TooltipBox, xAxisProps, yAxisProps, ChartFrame } from '../components/Chart';
import { BAR_RADIUS, COLUMN_RADIUS, MAX_BAR, barEndLabel, columnLabel, Figure, FlowDiagram, StatementMockup } from '../components/Figure';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { num, pct, usd, years, monthYear } from '../lib/format';
import { simulateCard, simulatePayoff, underwaterDebts, utilizationBand, type Debt, type PayoffResult } from '../lib/debt';

/* ================================================================== */
/* 3.1 The two-step emergency fund                                     */
/* ================================================================== */

function TwoStepDiagram() {
  return (
    <Figure
      kind="diagram"
      title="The two steps, in order"
      subtitle="Debt payoff sits between the two steps."
      howToRead={[
        'Read left to right. Each box is one stage.',
        'The two highlighted boxes are the two emergency fund steps.',
        'The middle box is the work you do between them.',
      ]}
      takeaway={<>Step 1 needs only <strong>$500 to $1,000</strong>. Step 2 is much larger, for example <strong>$7,200 to $14,400</strong> if your basic expenses are $2,400 a month.</>}
      note="Dollar amounts in the takeaway are an example with $2,400 of monthly basic expenses."
    >
      <FlowDiagram label="Step 1 starter fund, then pay off high-interest debt, then Step 2 full safety net" steps={[
        { icon: PiggyBank, title: 'Step 1: Starter fund', amount: '$500 to $1,000', detail: 'Save it as fast as you can, in a savings account you can reach the same day.', emphasis: true },
        { icon: CreditCard, title: 'Pay off high-interest debt', amount: 'Above 7–8%', detail: 'Send every extra dollar here. Keep paying the minimum on all other debts.' },
        { icon: Landmark, title: 'Step 2: Full safety net', amount: '3 to 6 months', detail: 'Basic expenses only: rent, food, utilities, minimum bills. Keep it in a high-yield savings account.', emphasis: true },
      ]} />
    </Figure>
  );
}

const DROP_DATA = [
  { label: 'Before the drop', stocks: 15000, hysa: 15000 },
  { label: 'After 2020 drop (−34%)', stocks: Math.round(15000 * 0.66), hysa: 15000 },
  { label: 'After 2007–09 drop (−57%)', stocks: Math.round(15000 * 0.43), hysa: 15000 },
];

function StockDropChart() {
  return (
    <Figure
      title="A $15,000 emergency fund in stocks or in a savings account"
      subtitle="What the same fund would have been worth after two large drops in the S&P 500."
      legend={[{ label: 'Held in stocks', color: 'var(--s1)', kind: 'box' }, { label: 'Held in a high-yield savings account', color: 'var(--s2)', kind: 'box' }]}
      height={300}
      table={{ columns: ['When', 'In stocks', 'In a savings account'], rows: DROP_DATA.map((d) => [d.label, usd(d.stocks), usd(d.hysa)]) }}
      howToRead={[
        'Each pair of columns is one moment. The side axis shows the fund\'s value in dollars.',
        'The first pair is the starting $15,000. The next two pairs show the fund after each drop.',
        'Compare the two columns within a pair. The savings account column stays at $15,000.',
      ]}
      takeaway={<>After a 34% drop the stock fund is worth <strong>$9,900</strong>, so $5,100 is missing at the moment a job loss makes you need it. After a 57% drop it is worth <strong>$6,450</strong>.</>}
      note="Illustrative. The S&P 500 price index fell about 34% from Feb 19 to Mar 23, 2020, and about 57% from Oct 2007 to Mar 2009. Assumes the whole fund tracked the index. The savings account balance is shown without interest."
    >
      <BarChart data={DROP_DATA} margin={{ top: 24, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} domain={[0, 18000]} ticks={[0, 5000, 10000, 15000]} {...yAxisProps} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v)} />} />
        <Bar dataKey="stocks" name="Held in stocks" fill="var(--s1)" radius={COLUMN_RADIUS} maxBarSize={MAX_BAR * 2} isAnimationActive={false} label={columnLabel((v) => usd(v))} />
        <Bar dataKey="hysa" name="Held in a savings account" fill="var(--s2)" radius={COLUMN_RADIUS} maxBarSize={MAX_BAR * 2} isAnimationActive={false} label={columnLabel((v) => usd(v))} />
      </BarChart>
    </Figure>
  );
}



const EF_DEFAULTS = { needs: 2500, saved: 3000, variable: false, single: false, dependents: false };
type EfState = typeof EF_DEFAULTS;
const EF_PRESETS: Preset<EfState>[] = [
  { label: 'First job, steady pay', values: { needs: 2000, saved: 1200, single: true } },
  { label: 'Freelancer', values: { needs: 3000, saved: 9000, variable: true, single: true } },
  { label: 'Family of four', values: { needs: 5500, saved: 12000, dependents: true } },
];
const EF_GUIDE: SimGuide<EfState> = {
  how: ['Enter your core monthly needs.', 'Add what you have saved so far.', 'Flip on any switches that fit you.'],
  tryThis: [
    { label: 'Flip on all three switches. How many months now?', done: (s) => s.variable && s.single && s.dependents },
    { label: 'Cut core needs to $2,000. Watch your months covered rise.', done: (s) => s.needs <= 2000 },
  ],
};

function EmergencyFundSizer() {
  const sim = useSim(EF_DEFAULTS);
  const { data: myMoney } = useMoney();
  const mine = useMemo(() => myEmergencyPreset(myMoney), [myMoney]);
  const presets: Preset<EfState>[] = mine ? [...EF_PRESETS, { label: 'My numbers', hint: 'From your My Money budget and accounts', values: mine }] : EF_PRESETS;
  const s = sim.state;
  const months = Math.min(9, 3 + (s.variable ? 2 : 0) + (s.single ? 1 : 0) + (s.dependents ? 1 : 0));
  const target = s.needs * months;
  const covered = s.needs > 0 ? s.saved / s.needs : 0;
  // When the target is exactly 3 months, one marker carries both labels so they don't overlap.
  const milestones = months === 3
    ? [{ label: 'One month', months: 1 }, { label: 'Your target: 3 months', months: 3 }]
    : [{ label: 'One month', months: 1 }, { label: 'Three months', months: 3 }, { label: 'Your target', months }];
  const scaleMax = Math.max(target, s.saved) * 1.05;
  const stage = covered >= months ? 'full' : covered >= 3 ? 'core' : covered >= 1 ? 'starter' : 'none';

  return (
    <SimCard title="Emergency Fund Sizer" kind="Mini sandbox" icon={LifeBuoy} sim={sim} presets={presets} guide={EF_GUIDE}
      subtitle="Find the size of your full safety net and see how much of it you already have.">
      <SimGrid controls={
        <ControlGroup title="Your situation">
          <SliderField label="Core monthly needs" value={s.needs} onChange={sim.set('needs')} min={500} max={10000} step={100} format={(v) => usd(v)} help="Rent, food, utilities, insurance, minimum debt payments" />
          <SliderField label="Saved so far" value={s.saved} onChange={sim.set('saved')} min={0} max={60000} step={250} format={(v) => usd(v)} />
          <Switch checked={s.variable} onChange={sim.set('variable')} label="Income is irregular" description="Freelance, commission, seasonal (+2 months)" />
          <Switch checked={s.single} onChange={sim.set('single')} label="Single-income household" description="No second paycheck to lean on (+1 month)" />
          <Switch checked={s.dependents} onChange={sim.set('dependents')} label="Others depend on you" description="Kids or family you support (+1 month)" />
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="Suggested target" value={usd(target)} sub={`${months} months of core needs`} emphasis />
          <StatTile label="You'd be covered for" value={`${num(covered, 1)} mo`} sub="if income stopped today" />
          <StatTile label="Still to save" value={usd(Math.max(0, target - s.saved))} sub={s.saved >= target ? 'target reached' : 'add a set amount each payday'} />
        </StatGrid>
        <div className="rounded-xl border border-line p-4">
          <p className="mb-6 text-sm font-semibold text-ink">Your progress toward the target</p>
          <div className="relative h-4 rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-[color:var(--s3)] transition-[width] duration-300" style={{ width: Math.min(100, (s.saved / scaleMax) * 100) + '%' }} />
            {milestones.map((m) => {
              const left = Math.min(100, ((m.months * s.needs) / scaleMax) * 100);
              const reached = s.saved >= m.months * s.needs;
              return (
                <div key={m.label} className="absolute -top-1.5 -bottom-1.5 w-0.5 bg-ink/70" style={{ left: `calc(${left}% - 1px)` }}>
                  <span className={`absolute top-7 whitespace-nowrap text-[11px] font-medium ${left > 80 ? 'right-0' : 'left-1/2 -translate-x-1/2'} ${reached ? 'text-good-text' : 'text-muted'}`}>
                    {reached ? '✓ ' : ''}{m.label} · {usd(m.months * s.needs, { compact: true })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-8" />
        </div>
        {stage === 'none' && <Nudge tone="tip" title="Step 1: the starter fund">Save $500 to $1,000 first. If your monthly needs are below $1,000, one month of needs ({usd(s.needs)}) is enough to start. A fund this size covers most surprise bills without a credit card.</Nudge>}
        {stage === 'starter' && <Nudge tone="info" title="Starter fund in place">Next, pay off any debt above 7–8% interest. After that, build the fund to 3 months ({usd(s.needs * 3)}) and then to your target of {usd(target)}.</Nudge>}
        {stage === 'core' && <Nudge tone="good" title="Three months covered">{months > 3 ? 'Your situation calls for ' + months + ' months, so keep adding until you reach ' + usd(target) + '.' : 'You have reached the minimum full safety net. Extra cash beyond your target can go toward investing.'}</Nudge>}
        {stage === 'full' && <Nudge tone="good" title="Fully funded">You have reached your target. Extra cash can go toward long-term goals, because cash in a savings account earns less over time than a diversified investment.</Nudge>}
      </SimGrid>
    </SimCard>
  );
}


/* ================================================================== */
/* 3.2 Credit cards, interest and credit scores                        */
/* ================================================================== */

const CARD_APR = 22;
const STMT = (() => {
  const prev = 2000, payment = 100;
  const interest = Math.round(((prev * CARD_APR) / 100 / 12) * 100) / 100;
  const buys = [
    { date: '10/04', label: 'Grocery Mart', amount: 142.18 },
    { date: '10/07', label: 'Gas station', amount: 58.4 },
    { date: '10/10', label: 'Online electronics order', amount: 219.75 },
    { date: '10/13', label: 'Pharmacy', amount: 42.3 },
    { date: '10/18', label: 'Grocery Mart', amount: 87.65 },
    { date: '10/21', label: 'Car repair shop', amount: 126.9 },
    { date: '10/26', label: 'Restaurant', amount: 64.12 },
  ];
  const purchases = buys.reduce((a, b) => a + b.amount, 0);
  const balance = Math.round((prev - payment + interest + purchases) * 100) / 100;
  const minOnly = simulateCard(balance, CARD_APR, { kind: 'shrinking' });
  const r = CARD_APR / 1200;
  const three = Math.ceil((balance * r) / (1 - Math.pow(1 + r, -36)));
  const threeYear = simulateCard(balance, CARD_APR, { kind: 'fixed', amount: three });
  return {
    prev, payment, interest, buys, purchases, balance, minOnly, three, threeYear,
    minTotal: balance + minOnly.totalInterest,
    threeTotal: balance + threeYear.totalInterest,
  };
})();

const cents = (n: number) => usd(n, { cents: true });

function CardStatementFigure() {
  const s = STMT;
  return (
    <Figure
      kind="example"
      title="A credit card statement with the minimum payment warning"
      subtitle="Federal law requires a box like the one on this statement. It shows what paying only the minimum costs."
      howToRead={[
        'The rows are one month of activity: a payment, interest, and purchases.',
        'The boxed notice near the bottom is the Minimum Payment Warning. It gives the time to pay off and the total cost at the minimum.',
        'The last line shows the minimum payment due. It is far below the new balance.',
      ]}
      takeaway={<>On a <strong>{cents(s.balance)}</strong> balance at {CARD_APR}%, paying only the minimum takes about <strong>{years(s.minOnly.months)}</strong> and costs <strong>{usd(s.minOnly.totalInterest)}</strong> in interest. Paying <strong>{usd(s.three)}</strong> a month clears it in 3 years.</>}
      note={'Example statement with made-up purchases. Assumes a ' + CARD_APR + '% APR, no new purchases after this statement, and a minimum payment of interest plus 1% of the balance (at least $25). The Credit CARD Act of 2009 requires the warning box. Your card\'s figures will differ.'}
    >
      <StatementMockup
        label="Example credit card statement showing a minimum payment warning box"
        issuer="Example Bank Rewards Card"
        title="Account ending 4821"
        period="Oct 1 – Oct 31"
        rows={[
          { label: 'Previous balance: ' + cents(s.prev) },
          { date: '10/03', label: 'Payment, thank you', amount: s.payment },
          ...s.buys.map((b) => ({ date: b.date, label: b.label, amount: -b.amount })),
          { date: '10/31', label: 'Interest charged (' + CARD_APR + '% APR)', amount: -s.interest, flag: { text: 'Interest', tone: 'warning' as const } },
        ]}
        callout={
          <>
            <p className="font-semibold">Minimum Payment Warning</p>
            <p className="mt-1">If you make only the minimum payment each period, you will pay off the balance shown on this statement in about <strong>{years(s.minOnly.months)}</strong> and you will end up paying an estimated total of <strong>{usd(s.minTotal)}</strong>.</p>
            <p className="mt-1">If you would like to pay off the balance in 3 years, you would need to pay <strong>{usd(s.three)}</strong> per month. You will end up paying an estimated total of <strong>{usd(s.threeTotal)}</strong>, a savings of <strong>{usd(s.minTotal - s.threeTotal)}</strong>.</p>
          </>
        }
        summary={[
          { label: 'New balance (statement balance)', value: cents(s.balance), strong: true },
          { label: 'Minimum payment due', value: cents(s.minOnly.firstPayment) },
          { label: 'Payment due date', value: 'Nov 25' },
        ]}
      />
    </Figure>
  );
}

const FICO = [
  { label: 'Payment history', weight: 35, main: true },
  { label: 'Amounts owed', weight: 30, main: true },
  { label: 'Length of credit history', weight: 15, main: false },
  { label: 'New credit', weight: 10, main: false },
  { label: 'Credit mix', weight: 10, main: false },
];

function ScoreWeightsChart() {
  return (
    <Figure
      title="What goes into a FICO score"
      subtitle="Approximate weight of each of the five factors."
      legend={[{ label: 'The two factors you control every month (65%)', color: 'var(--s1)', kind: 'box' }, { label: 'The other three (35%)', color: 'var(--s-neutral-2)', kind: 'box' }]}
      height={250}
      table={{ columns: ['Factor', 'Weight'], rows: FICO.map((f) => [f.label, f.weight + '%']) }}
      howToRead={[
        'Each bar is one factor. Bar length is its share of the score.',
        'The two colored bars are payment history and amounts owed.',
        'The three gray bars matter less and change slowly.',
      ]}
      takeaway={<>Payment history (35%) plus amounts owed (30%) make up <strong>65%</strong> of the score. Paying on time and keeping balances low covers most of it.</>}
      note="Approximate weights published by FICO for the general population. Exact weights vary by person."
    >
      <BarChart data={FICO} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} tickFormatter={(v) => v + '%'} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={160} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => v + '% of the score'} />} />
        <Bar dataKey="weight" name="Weight" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => v + '%')}>
          {FICO.map((f) => <Cell key={f.label} fill={f.main ? 'var(--s1)' : 'var(--s-neutral-2)'} />)}
        </Bar>
      </BarChart>
    </Figure>
  );
}

const UTIL_DEFAULTS = { balance: 3000, limit: 10000 };
type UtilState = typeof UTIL_DEFAULTS;
const UTIL_PRESETS: Preset<UtilState>[] = [
  { label: 'Maxed out: $4,500 of $5,000', values: { balance: 4500, limit: 5000 } },
  { label: 'Under 30%', values: { balance: 2500, limit: 10000 } },
  { label: 'Under 10%', values: { balance: 800, limit: 10000 } },
];
const UTIL_GUIDE: SimGuide<UtilState> = {
  how: ['Set your total card limit.', 'Set the balance that appears on your statement.', 'Read the zone the marker lands in.'],
  tryThis: [
    { label: 'Get the balance under 30% of the limit.', done: (s) => s.limit > 0 && s.balance < s.limit * 0.3 },
    { label: 'Get it under 10%.', done: (s) => s.limit > 0 && s.balance < s.limit * 0.1 },
  ],
};

function UtilizationCheck() {
  const sim = useSim(UTIL_DEFAULTS);
  const s = sim.state;
  return (
    <SimCard title="Utilization Check" kind="Mini sandbox" icon={Gauge} sim={sim} presets={UTIL_PRESETS} guide={UTIL_GUIDE}
      subtitle="Credit utilization is your card balance divided by your credit limit.">
      <SimGrid controls={
        <ControlGroup title="Your cards">
          <SliderField label="Total credit limit" value={s.limit} onChange={sim.set('limit')} min={1000} max={40000} step={500} format={(v) => usd(v)} />
          <SliderField label="Balance on the statement" value={s.balance} onChange={sim.set('balance')} min={0} max={40000} step={100} format={(v) => usd(v)} />
        </ControlGroup>
      }>
        <UtilizationMeter balance={Math.min(s.balance, s.limit * 1.5)} limit={s.limit} />
      </SimGrid>
    </SimCard>
  );
}



const TRAP_DEFAULTS = { balance: 3000, apr: 24, fixed: 150 };
type TrapState = typeof TRAP_DEFAULTS;
const TRAP_PRESETS: Preset<TrapState>[] = [
  { label: 'Big balance: $8k at 27%', values: { balance: 8000, apr: 27, fixed: 300 } },
  { label: 'Store card: $1,200 at 30%', values: { balance: 1200, apr: 30, fixed: 75 } },
];

function MinimumPaymentCheck() {
  const sim = useSim(TRAP_DEFAULTS);
  const s = sim.state;
  const shrink = useMemo(() => simulateCard(s.balance, s.apr, { kind: 'shrinking' }), [s.balance, s.apr]);
  const frozen = useMemo(() => simulateCard(s.balance, s.apr, { kind: 'fixed', amount: shrink.firstPayment }), [s.balance, s.apr, shrink.firstPayment]);
  const minFixed = Math.ceil((s.balance * s.apr) / 1200 / 5) * 5 + 5;
  const fixed = Math.max(s.fixed, minFixed);
  const mine = useMemo(() => simulateCard(s.balance, s.apr, { kind: 'fixed', amount: fixed }), [s.balance, s.apr, fixed]);
  const len = Math.max(shrink.timeline.length, frozen.timeline.length, mine.timeline.length);
  const data = Array.from({ length: Math.ceil(len / 3) }, (_, k) => {
    const i = k * 3;
    return { m: i, shrink: shrink.timeline[i] ?? 0, frozen: frozen.timeline[i] ?? 0, mine: mine.timeline[i] ?? 0 };
  });
  const plans = [
    { key: 'shrink', name: 'Shrinking minimum', desc: 'interest + 1% of balance, $25 floor', r: shrink, color: 'var(--s1)' },
    { key: 'frozen', name: `Fixed ${usd(shrink.firstPayment)}/mo`, desc: "first month's minimum, never lowered", r: frozen, color: 'var(--s2)' },
    { key: 'mine', name: `Fixed ${usd(fixed)}/mo`, desc: 'your chosen payment', r: mine, color: 'var(--s3)' },
  ];
  return (
    <SimCard title="Minimum Payment Check" kind="Mini sandbox" icon={TriangleAlert} sim={sim} presets={TRAP_PRESETS}
      subtitle="See how much faster a fixed payment clears a card than the shrinking minimum."
      guide={{
        how: ['Set your card balance and APR.', 'Pick a fixed payment you could afford.', 'Compare the time and interest of each plan.'],
        tryThis: [
          { label: 'Raise your fixed payment to $300 or more.', done: (st) => st.fixed >= 300 },
          { label: 'Push the APR to 30% and watch the minimum line stretch.', done: (st) => st.apr >= 30 },
        ],
      }}>
      <SimGrid controls={
        <ControlGroup title="Your card">
          <SliderField label="Card balance" value={s.balance} onChange={sim.set('balance')} min={500} max={15000} step={100} format={(v) => usd(v)} />
          <SliderField label={<Term id="apr">APR</Term>} value={s.apr} onChange={sim.set('apr')} min={10} max={35} step={0.5} format={(v) => pct(v, 1)} />
          <SliderField label="Your fixed payment" value={fixed} onChange={sim.set('fixed')} min={minFixed} max={Math.max(minFixed + 100, Math.round(s.balance / 3))} step={5} format={(v) => usd(v)} help="Pick any amount you could pay every month." />
        </ControlGroup>
      }>
        <div className="grid gap-3 sm:grid-cols-3">
          {plans.map((p) => (
            <div key={p.key} className="rounded-xl border border-line p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink"><span className="inline-block size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />{p.name}</p>
              <p className="text-[11px] text-muted">{p.desc}</p>
              <p className="mt-2 text-xl font-semibold text-ink">{p.r.paidOff ? years(p.r.months) : '50+ yrs'}</p>
              <p className="text-xs text-ink-2">{usd(p.r.totalInterest)} interest</p>
            </div>
          ))}
        </div>
        <ChartFrame title="Balance remaining under each plan" subtitle={`${usd(s.balance)} at ${pct(s.apr, 1)} APR`} height={240}
          legend={plans.map((p) => ({ label: p.name, color: p.color }))}
          table={{ columns: ['Plan', 'Time to $0', 'Total interest', 'First payment'], rows: plans.map((p) => [p.name, p.r.paidOff ? years(p.r.months) : '50+ yrs', usd(p.r.totalInterest), usd(p.r.firstPayment, { cents: true })]) }}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="m" type="number" domain={[0, 'dataMax']} tickFormatter={(v) => `${Math.round(v / 12)}y`} ticks={Array.from({ length: Math.floor(len / 24) + 1 }, (_, i) => i * 24)} {...xAxisProps} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => `Month ${l} (${years(Number(l))})`} valueFormat={(v) => usd(v)} />} />
            {plans.map((p) => <Line key={p.key} type="monotone" dataKey={p.key} name={p.name} stroke={p.color} strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />)}
          </LineChart>
        </ChartFrame>
        <Nudge tone="warning" title="What paying only the minimum costs">
          Paying only the minimum takes <strong>{shrink.paidOff ? years(shrink.months) : '50+ years'}</strong> and costs <strong>{usd(shrink.totalInterest)}</strong> in interest.
          Keep paying the first month's {usd(shrink.firstPayment)} instead, and it drops to {years(frozen.months)} and {usd(frozen.totalInterest)}.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

const FACTORS: (Segment & { term: Parameters<typeof Term>[0]['id']; tip: string })[] = [
  { key: 'history', label: 'Payment history', value: 35, color: 'var(--s1)', term: 'payment-history', tip: 'Pay every bill on time. Set up autopay for the minimum as a backup.' },
  { key: 'util', label: 'Amounts owed', value: 30, color: 'var(--s2)', term: 'credit-utilization', tip: 'Keep card balances low compared with your limits: under 30%, ideally under 10%.' },
  { key: 'age', label: 'Length of history', value: 15, color: 'var(--s3)', term: 'credit-age', tip: 'Keep old no-fee cards open. A long history takes time to build.' },
  { key: 'new', label: 'New credit', value: 10, color: 'var(--s4)', ink: 'var(--on-s4)', term: 'hard-inquiry', tip: 'Space out credit applications. Each one can cost a few points for a while.' },
  { key: 'mix', label: 'Credit mix', value: 10, color: 'var(--s5)', term: 'credit-mix', tip: 'Having both cards and a loan helps a little. Never borrow just for this.' },
];

function ScoreFactors() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="mb-3 text-sm font-semibold text-ink">What makes up a FICO® Score (rough weights)</p>
      <SegmentBar segments={FACTORS} total={100} format={(v) => v + '%'} ariaLabel="Credit score factor weights" />
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {FACTORS.map((f) => (
          <li key={f.key} className="flex gap-2.5 text-sm">
            <span className="mt-1 inline-block size-3 shrink-0 rounded-[3px]" style={{ background: f.color }} aria-hidden />
            <span className="text-ink-2"><strong className="text-ink"><Term id={f.term}>{f.label}</Term> · {f.value}%</strong>: {f.tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UtilizationMeter({ balance, limit }: { balance: number; limit: number }) {
  const u = limit > 0 ? (balance / limit) * 100 : 0;
  const band = utilizationBand(u);
  const zones = [
    { from: 0, to: 10, label: 'Excellent', color: 'var(--good)' },
    { from: 10, to: 30, label: 'Good', color: 'color-mix(in srgb, var(--good) 45%, var(--warning))' },
    { from: 30, to: 50, label: 'Fair', color: 'var(--warning)' },
    { from: 50, to: 100, label: 'High', color: 'var(--critical)' },
  ];
  const tone = band === 'excellent' || band === 'good' ? 'good' : band === 'fair' ? 'warning' : 'critical';
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Gauge className="size-4 text-accent-text" aria-hidden /> <Term id="credit-utilization">Credit utilization</Term> meter</p>
        <p className="text-sm text-ink-2"><strong className="tnum text-ink">{pct(u, 0)}</strong> = {usd(balance)} card balance ÷ {usd(limit)} limit</p>
      </div>
      <div className="relative mt-4" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(u, 100))} aria-label="Credit utilization">
        <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
          {zones.map((z) => <div key={z.label} style={{ width: z.to - z.from + '%', background: z.color, opacity: 0.85 }} />)}
        </div>
        <div className="absolute -top-1.5 h-6 w-1 rounded-full bg-ink ring-2 ring-surface transition-[left] duration-300" style={{ left: `calc(${Math.min(u, 100)}% - 2px)` }} />
        <div className="relative mt-1.5 h-4 text-[11px] text-muted">
          {zones.map((z) => <span key={z.label} className="absolute -translate-x-0" style={{ left: z.from + '%' }}>{z.label}</span>)}
        </div>
      </div>
      <div className="mt-3">
        <Nudge tone={tone} title={band === 'excellent' ? 'Excellent: under 10%' : band === 'good' ? 'Good: under 30%' : band === 'fair' ? 'Fair: 30–49%' : 'High: 50%+'}>
          {u < 10 ? 'Scores tend to be highest in this zone.' : <>Getting the balance under <strong>{usd(limit * 0.3)}</strong> (30%) helps your score, and under <strong>{usd(limit * 0.1)}</strong> (10%) is ideal. Good news: it improves as soon as a lower balance is reported.</>}
        </Nudge>
      </div>
    </div>
  );
}

const DEFAULT_DEBTS: Debt[] = [
  { id: 'd1', name: 'Credit card', balance: 6000, apr: 24.9, minPayment: 180, active: true },
  { id: 'd2', name: 'Medical bill', balance: 1500, apr: 0, minPayment: 75, active: true },
  { id: 'd3', name: 'Car loan', balance: 11000, apr: 7.9, minPayment: 265, active: true },
];
const RACE_DEFAULTS = { debts: DEFAULT_DEBTS, extra: 50 };
type RaceState = typeof RACE_DEFAULTS;
const RACE_PRESETS: Preset<RaceState>[] = [
  { label: 'Card + Student Loan', hint: 'Two debts where the two methods give different results', values: { debts: [
    { id: 'd1', name: 'Credit card', balance: 8000, apr: 24.9, minPayment: 240, active: true },
    { id: 'd2', name: 'Student loan', balance: 6000, apr: 5.5, minPayment: 90, active: true },
    { ...DEFAULT_DEBTS[2], active: false },
  ], extra: 150 } },
  { label: '+$100/mo Extra', values: { extra: 100 } },
  { label: 'Minimum Payments Only', values: { extra: 0 } },
];
function DebtEditor({ debt, onChange, locked }: { debt: Debt; onChange: (d: Debt) => void; locked?: boolean }) {
  const interest = (debt.balance * debt.apr) / 1200;
  const underwater = debt.active && debt.balance > 0 && debt.minPayment <= interest;
  return (
    <div className={cx('rounded-xl border p-3.5 transition-opacity', debt.active ? 'border-line bg-surface' : 'border-dashed border-line-strong bg-surface-2/40 opacity-70')}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{debt.name}</p>
        {!locked && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-2">
            <input type="checkbox" checked={debt.active} onChange={(e) => onChange({ ...debt, active: e.target.checked })} className="size-4 accent-[color:var(--accent)]" />
            Include
          </label>
        )}
      </div>
      <div className="space-y-2.5">
        <SliderField label="Balance" value={debt.balance} onChange={(v) => onChange({ ...debt, balance: v })} min={0} max={30000} step={100} format={(v) => usd(v)} disabled={!debt.active} />
        <SliderField label="APR" value={debt.apr} onChange={(v) => onChange({ ...debt, apr: v })} min={0} max={35} step={0.1} format={(v) => pct(v, 1)} disabled={!debt.active} />
        <SliderField label="Minimum payment" value={debt.minPayment} onChange={(v) => onChange({ ...debt, minPayment: v })} min={10} max={1000} step={5} format={(v) => usd(v)} disabled={!debt.active} />
      </div>
      {debt.active && <p className={cx('mt-2 text-[11px]', underwater ? 'font-semibold text-critical-text' : 'text-muted')}>{underwater ? '⚠ Minimum doesn\'t cover the ' : 'First month\'s interest: '}{usd(interest, { cents: true })}{underwater ? ' monthly interest' : ''}</p>}
    </div>
  );
}
function RaceCard({ title, icon: Icon, r, color, winner, subtitle }: { title: string; icon: typeof Flame; r: PayoffResult; color: string; winner?: boolean; subtitle: string }) {
  return (
    <div className={cx('rounded-xl border p-4', winner ? 'border-accent bg-accent-soft' : 'border-line bg-surface')}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-ink"><span className="inline-block size-2.5 rounded-full" style={{ background: color }} aria-hidden /><Icon className="size-4" aria-hidden />{title}</p>
        {winner && <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink"><Trophy className="size-3" aria-hidden /> Least interest</span>}
      </div>
      <p className="text-xs text-muted">{subtitle}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-xs text-ink-2">Debt-free</dt><dd className="font-semibold text-ink">{r.paidOff ? monthYear(r.months) : 'Never*'}</dd></div>
        <div><dt className="text-xs text-ink-2">Time</dt><dd className="font-semibold text-ink">{r.paidOff ? years(r.months) : '50+ yrs'}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-ink-2">Total interest paid</dt><dd className="text-xl font-semibold text-ink">{usd(r.totalInterest)}</dd></div>
      </dl>
      {r.order.length > 0 && (
        <ol className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {r.order.map((o, i) => <li key={o.id} className="rounded-full bg-surface-2 px-2 py-0.5 text-ink-2">{i + 1}. {o.name} <span className="text-muted">· mo {o.month}</span></li>)}
        </ol>
      )}
    </div>
  );
}
function DebtRace() {
  const sim = useSim(RACE_DEFAULTS);
  const { data: myMoney } = useMoney();
  const mine = useMemo(() => myDebtPreset(myMoney), [myMoney]);
  const presets: Preset<RaceState>[] = mine ? [...RACE_PRESETS, { label: 'My debts', hint: 'Your first three debts from My Money', values: { debts: mine.debts, extra: mine.extra } }] : RACE_PRESETS;
  const s = sim.state;
  const setDebt = (i: number) => (d: Debt) => sim.setState((st) => ({ ...st, debts: st.debts.map((x, j) => (j === i ? d : x)) }));
  const snow = useMemo(() => simulatePayoff(s.debts, s.extra, 'snowball'), [s.debts, s.extra]);
  const aval = useMemo(() => simulatePayoff(s.debts, s.extra, 'avalanche'), [s.debts, s.extra]);
  const mins = useMemo(() => simulatePayoff(s.debts, 0, 'minimum'), [s.debts]);
  const underwater = underwaterDebts(s.debts);
  const active = s.debts.filter((d) => d.active && d.balance > 0);
  const totalMin = active.reduce((a, d) => a + d.minPayment, 0);
  const diff = snow.totalInterest - aval.totalInterest;
  const len = Math.min(240, Math.max(snow.timeline.length, aval.timeline.length, mins.timeline.length));
  const step = len > 120 ? 2 : 1;
  const data = [];
  for (let i = 0; i < len; i += step) data.push({ m: i, aval: aval.timeline[i] ?? 0, snow: snow.timeline[i] ?? 0, mins: mins.timeline[i] ?? 0 });

  return (
    <SimCard title="Debt Payoff Comparison" sim={sim} presets={presets}
      subtitle="See which payoff plan gets you debt-free sooner and costs less interest."
      guide={{
        how: ['Edit your debts, or pick a preset.', 'Add extra money each month.', 'Compare debt-free dates and total interest.'],
        tryThis: [
          { label: 'Add $200 or more extra each month.', done: (st) => st.extra >= 200 },
          { label: 'Uncheck the medical bill. Do the plans still differ?', done: (st) => st.debts.some((d) => d.name === 'Medical bill' && !d.active) },
        ],
      }}>
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {s.debts.map((d, i) => <DebtEditor key={d.id} debt={d} onChange={setDebt(i)} locked={i === 0} />)}
        </div>
        <div className="grid items-end gap-4 rounded-xl bg-surface-2/60 p-4 md:grid-cols-[1fr_auto]">
          <SliderField label="Extra payment each month (on top of minimums)" value={s.extra} onChange={sim.set('extra')} min={0} max={1000} step={10} format={(v) => usd(v)} />
          <p className="text-sm text-ink-2 md:pb-2">Monthly debt budget: <strong className="tnum text-ink">{usd(totalMin + s.extra)}</strong></p>
        </div>

        {underwater.length > 0 && (
          <Nudge tone="critical" title="A minimum payment doesn't cover the interest">
            {underwater.map((d) => d.name).join(', ')} would keep growing on its minimum alone. Raise the minimum or add extra money. In real life, call the lender and ask about hardship or lower-rate plans.
          </Nudge>
        )}

        {active.length > 0 && (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <RaceCard title="Avalanche" icon={Mountain} r={aval} color="var(--s1)" subtitle="Highest APR first" winner={diff > 1} />
              <RaceCard title="Snowball" icon={Snowflake} r={snow} color="var(--s2)" subtitle="Smallest balance first" winner={diff < -1} />
              <RaceCard title="Minimums only" icon={CalendarClock} r={mins} color="var(--s-neutral-2)" subtitle="No extra, no rollover" />
            </div>

            <StatGrid>
              <StatTile label="Avalanche saves vs. Snowball" value={usd(Math.max(0, diff))} sub={Math.abs(diff) < 1 ? 'same order, same result' : 'in total interest'} emphasis />
              <StatTile label="Plan saves vs. minimums" value={usd(mins.totalInterest - Math.min(aval.totalInterest, snow.totalInterest))} sub={`and ${years(Math.max(0, mins.months - Math.min(aval.months, snow.months)))} sooner`} />
              <StatTile label="First debt gone (Snowball)" value={snow.order[0] ? `Month ${snow.order[0].month}` : '—'} sub={aval.order[0] ? `Avalanche: month ${aval.order[0].month}` : undefined} />
            </StatGrid>

            <ChartFrame title="Total debt remaining" subtitle="All active debts combined" height={260}
              legend={[{ label: 'Avalanche', color: 'var(--s1)' }, { label: 'Snowball', color: 'var(--s2)', dashed: true }, { label: 'Minimums only', color: 'var(--s-neutral-2)' }]}
              table={{ columns: ['Month', 'Avalanche', 'Snowball', 'Minimums only'], rows: data.filter((d) => d.m % 6 === 0).map((d) => [d.m, usd(d.aval), usd(d.snow), usd(d.mins)]) }}>
              <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="m" type="number" domain={[0, 'dataMax']} tickFormatter={(v) => (v % 12 === 0 ? `${v / 12}y` : '')} ticks={Array.from({ length: Math.floor(len / 12) + 1 }, (_, i) => i * 12)} {...xAxisProps} />
                <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
                <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => `Month ${l} · ${monthYear(Number(l))}`} valueFormat={(v) => usd(v)} order={['Avalanche', 'Snowball', 'Minimums only']} />} />
                <Line type="monotone" dataKey="mins" name="Minimums only" stroke="var(--s-neutral-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="aval" name="Avalanche" stroke="var(--s1)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
                <Line type="monotone" dataKey="snow" name="Snowball" stroke="var(--s2)" strokeWidth={2.5} strokeDasharray="6 4" dot={false} activeDot={activeDot} isAnimationActive={false} />
              </LineChart>
            </ChartFrame>

            {Math.abs(diff) < 1 ? (
              <Nudge tone="info" title="It's a tie here">With these numbers, both plans pick the same debt first, so they finish the same. Try the Card + Student Loan preset to see them differ.</Nudge>
            ) : (
              <Nudge tone="tip" title="Both plans win">
                Avalanche saves <strong>{usd(Math.abs(diff))}</strong> {diff > 0 ? '' : '(here Snowball is actually cheaper) '}in total interest, about {usd(Math.abs(diff) / Math.max(aval.months, 1))}/month.
                Snowball gets your first win {snow.order[0] && aval.order[0] && snow.order[0].month < aval.order[0].month ? <>at <strong>month {snow.order[0].month}</strong> instead of month {aval.order[0].month}</> : 'sooner'}.
                Either one beats paying minimums by <strong>{usd(mins.totalInterest - Math.max(aval.totalInterest, snow.totalInterest))}+</strong>. The best plan is the one you'll stick with.
              </Nudge>
            )}
          </>
        )}

      </div>
    </SimCard>
  );
}



/* ================================================================== */
/* 3.3 Two ways to pay off debt                                        */
/* ================================================================== */

function PayoffOrderDiagram() {
  const extra = 50;
  const aval = simulatePayoff(DEFAULT_DEBTS, extra, 'avalanche');
  const snow = simulatePayoff(DEFAULT_DEBTS, extra, 'snowball');
  const byId = new Map(DEFAULT_DEBTS.map((d) => [d.id, d]));
  // Each row lists debts in the order the method sends extra money to them (its targeting order).
  const target = (strategy: 'avalanche' | 'snowball') =>
    [...DEFAULT_DEBTS].sort((a, b) => (strategy === 'avalanche' ? b.apr - a.apr : a.balance - b.balance));
  const row = (r: PayoffResult, strategy: 'avalanche' | 'snowball', label: string, rule: string) => (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink-2">{label}: {rule}</p>
      <FlowDiagram label={label + ' targeting order'} steps={target(strategy).map((d, i) => {
        const done = r.order.find((o) => o.id === d.id)?.month;
        return { title: (i + 1) + '. ' + byId.get(d.id)!.name, amount: usd(d.balance) + ' at ' + pct(d.apr, 1), detail: done ? 'Paid off in month ' + done + '.' : undefined, emphasis: i === 0 };
      })} />
      <p className="mt-2 text-xs text-muted">Debt-free in {years(r.months)}. Total interest: {usd(r.totalInterest)}.</p>
    </div>
  );
  const diff = snow.totalInterest - aval.totalInterest;
  return (
    <Figure
      kind="diagram"
      title="The same three debts, paid in two different orders"
      subtitle="Card: $6,000 at 24.9%. Medical bill: $1,500 at 0%. Car loan: $11,000 at 7.9%. Extra payment: $50 a month."
      howToRead={[
        'Each row lists the same three debts in the order that method sends extra money to them. The highlighted box gets the extra first.',
        'When that debt is gone, its payment moves to the next box. The other debts get only their minimum payment until then.',
        'The line under each row shows when you are debt-free and the total interest.',
      ]}
      takeaway={<>Avalanche pays {usd(aval.totalInterest)} in interest and Snowball pays {usd(snow.totalInterest)}, a difference of <strong>{usd(Math.abs(diff))}</strong>. Snowball clears the first debt in month {snow.order[0].month}. Avalanche takes until month {aval.order[0].month}.</>}
      note="Illustrative balances. When a debt is paid off, its payment moves to the next debt in the list. Under Avalanche the 0% medical bill still finishes early, in month 20, because its own minimum payment clears it."
    >
      <div className="space-y-6">
        {row(aval, 'avalanche', 'Avalanche', 'highest interest rate first')}
        {row(snow, 'snowball', 'Snowball', 'smallest balance first')}
      </div>
    </Figure>
  );
}

const RATE_DATA = [
  { label: 'Credit card payoff (about 22%)', rate: 22, kind: 'debt' },
  { label: 'Personal loan payoff (about 12%)', rate: 12, kind: 'debt' },
  { label: 'Car loan payoff (about 8%)', rate: 8, kind: 'debt' },
  { label: 'Stocks, before inflation (about 10%)', rate: 10, kind: 'stock' },
  { label: 'Stocks, after inflation (about 7%)', rate: 7, kind: 'stock' },
];

function SevenEightChart() {
  return (
    <Figure
      title="A paid-off debt versus the stock market"
      subtitle="Yearly return you get from paying off a debt, compared with the stock market's long-run average."
      legend={[{ label: 'Interest you stop paying (certain)', color: 'var(--s1)', kind: 'box' }, { label: 'Stock market long-run average (not guaranteed)', color: 'var(--s2)', kind: 'box' }]}
      height={280}
      table={{ columns: ['Option', 'Yearly rate', 'Certain?'], rows: RATE_DATA.map((d) => [d.label, d.rate + '%', d.kind === 'debt' ? 'Yes' : 'No']) }}
      howToRead={[
        'Each bar is a yearly rate. The dashed line marks 7–8%.',
        'The first three bars are the interest rates on debts. Paying one off earns that rate with certainty.',
        'The last two bars are long-run stock averages. Any single year can be far higher or lower.',
      ]}
      takeaway={<>Paying off a <strong>22%</strong> card is a certain 22% return. The stock market has averaged roughly <strong>10%</strong> a year before inflation, and that is not guaranteed. Debts above 7–8% beat the likely stock return.</>}
      note="Illustrative debt rates. The stock figures are the approximate long-run average yearly return of the S&P 500 with dividends reinvested, about 10% before inflation and about 7% after. Past returns do not guarantee future returns."
    >
      <BarChart data={RATE_DATA} layout="vertical" margin={{ top: 20, right: 56, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" domain={[0, 26]} ticks={[0, 5, 10, 15, 20, 25]} tickFormatter={(v) => v + '%'} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={230} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => v + '% a year'} />} />
        <ReferenceLine x={7.5} stroke="var(--ink-2)" strokeDasharray="5 4" label={{ value: '7–8% line', position: 'top', fill: 'var(--ink)', fontSize: 12, fontWeight: 600 }} />
        <Bar dataKey="rate" name="Yearly rate" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => v + '%')}>
          {RATE_DATA.map((d) => <Cell key={d.label} fill={d.kind === 'debt' ? 'var(--s1)' : 'var(--s2)'} />)}
        </Bar>
      </BarChart>
    </Figure>
  );
}

/* ================================================================== */
/* 3.4 Traps to avoid                                                  */
/* ================================================================== */

const APR_DATA = [
  { label: 'Payday loan ($15 per $100, 2 weeks)', apr: 391 },
  { label: 'Title loan (25% a month)', apr: 300 },
  { label: 'Federal credit union payday alternative loan (maximum)', apr: 28 },
  { label: 'Credit card (typical)', apr: 22 },
  { label: 'Credit union personal loan (typical)', apr: 12 },
];

function AprCompareChart() {
  return (
    <Figure
      title="Yearly interest rate of five ways to borrow"
      subtitle="The same loan costs very different amounts depending on where it comes from."
      height={290}
      table={{ columns: ['Loan type', 'APR'], rows: APR_DATA.map((d) => [d.label, d.apr + '%']) }}
      howToRead={[
        'Each bar is the APR, the cost of borrowing for a full year, including fees.',
        'The two long bars at the top are payday and title loans.',
        'The three short bars are the cheaper options: payday alternative loans, credit cards and credit union loans.',
      ]}
      takeaway={<>A payday loan with a $15 fee per $100 for two weeks equals an APR of about <strong>391%</strong>. A credit card at 22% is about 18 times cheaper, and a payday alternative loan is capped at 28%.</>}
      note="Payday APR from the CFPB's example of a $15 fee per $100 borrowed for two weeks. Title loan rate is a common 25% monthly fee. Card and credit union rates are typical examples. Federal credit unions cap payday alternative loans (PALs) at 28% APR."
    >
      <BarChart data={APR_DATA} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" domain={[0, 450]} ticks={[0, 100, 200, 300, 400]} tickFormatter={(v) => v + '%'} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={250} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => v + '% APR'} />} />
        <Bar dataKey="apr" name="APR" fill="var(--s1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => v + '%')} />
      </BarChart>
    </Figure>
  );
}

const PD_DEFAULTS = { amount: 500, fee: 15, renewals: 0 };
type PdState = typeof PD_DEFAULTS;
const PD_PRESETS: Preset<PdState>[] = [
  { label: 'Typical: $500, $15 per $100', values: { amount: 500, fee: 15, renewals: 0 } },
  { label: 'Renewed 4 times', values: { amount: 500, fee: 15, renewals: 4 } },
  { label: '$1,000, renewed twice', values: { amount: 1000, fee: 15, renewals: 2 } },
];
const PD_GUIDE: SimGuide<PdState> = {
  how: ['Set the amount you would borrow.', 'Set the fee per $100 borrowed.', 'Add renewals if you could not repay after two weeks.'],
  tryThis: [
    { label: 'Renew the loan 3 or more times.', done: (s) => s.renewals >= 3 },
    { label: 'Lower the fee to $10 per $100. Is the APR still above 200%?', done: (s) => s.fee <= 10 },
  ],
};

function PaydayCost() {
  const sim = useSim(PD_DEFAULTS);
  const s = sim.state;
  const apr = s.fee * (365 / 14);
  const cycles = 1 + s.renewals;
  const fees = (s.amount / 100) * s.fee * cycles;
  const cardCost = s.amount * 0.22 * ((14 * cycles) / 365);
  return (
    <SimCard title="Payday Loan Cost" kind="Mini sandbox" icon={Banknote} sim={sim} presets={PD_PRESETS} guide={PD_GUIDE}
      subtitle="See the real cost of a two-week loan, and what happens when it is renewed.">
      <SimGrid controls={
        <ControlGroup title="The loan">
          <SliderField label="Amount borrowed" value={s.amount} onChange={sim.set('amount')} min={100} max={1000} step={50} format={(v) => usd(v)} />
          <SliderField label="Fee per $100 borrowed" value={s.fee} onChange={sim.set('fee')} min={10} max={30} step={1} format={(v) => usd(v)} help="$15 per $100 is a common fee." />
          <SliderField label="Times the loan is renewed" value={s.renewals} onChange={sim.set('renewals')} min={0} max={6} step={1} format={(v) => String(v)} help="Each renewal is another two weeks and another full fee." />
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="APR" value={pct(apr, 0)} sub="cost of borrowing for a year" emphasis />
          <StatTile label={'Fees after ' + cycles + (cycles === 1 ? ' period' : ' periods')} value={usd(fees)} sub={pct((fees / s.amount) * 100, 0) + ' of the amount borrowed'} />
          <StatTile label="Same time on a 22% card" value={usd(cardCost, { cents: true })} sub={'interest for ' + cycles * 2 + ' weeks'} />
        </StatGrid>
        {s.renewals >= 2 ? (
          <Nudge tone="critical" title="The fees now add up to a large share of the loan">After {cycles} two-week periods you have paid <strong>{usd(fees)}</strong> in fees and you still owe the original {usd(s.amount)}. This is how a short loan becomes a long one.</Nudge>
        ) : (
          <Nudge tone="warning" title="Two weeks is the whole loan term">The full {usd(s.amount)} plus the {usd((s.amount / 100) * s.fee)} fee is due in one payment, usually on your next payday. Many borrowers cannot pay it and renew.</Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

const BNPL_PLANS = [
  { name: 'Sneakers', total: 120, start: 1 },
  { name: 'Headphones', total: 200, start: 2 },
  { name: 'Jacket', total: 160, start: 1 },
  { name: 'Concert tickets', total: 240, start: 3 },
].map((p) => ({ ...p, each: p.total / 4, weeks: [0, 2, 4, 6].map((o) => p.start + o) }));
const BNPL_WEEKS = Array.from({ length: 9 }, (_, i) => i + 1);

function BnplCalendar() {
  const totals = BNPL_WEEKS.map((w) => BNPL_PLANS.reduce((a, p) => a + (p.weeks.includes(w) ? p.each : 0), 0));
  const peak = Math.max(...totals);
  return (
    <Figure
      kind="diagram"
      title="Four Buy Now, Pay Later plans on one calendar"
      subtitle="Each plan splits a purchase into four payments, two weeks apart. Started in different weeks, they overlap."
      howToRead={[
        'Each row is one purchase. Each column is one week.',
        'A number in a cell is the payment due that week.',
        'The bottom row adds the payments in each week. The highest week is marked.',
      ]}
      takeaway={<>Four purchases worth <strong>$720</strong> in total look small one at a time, but in week 3, 5 and 7 you owe <strong>{usd(peak)}</strong> at once. A single missed payment can bring a late fee or an overdraft.</>}
      note="Illustrative purchases. Pay in 4 plans usually take the first payment at checkout and the rest every two weeks by automatic payment."
    >
      <div className="overflow-x-auto" role="img" aria-label="Calendar of overlapping Buy Now, Pay Later payments over nine weeks">
        <table className="tnum w-full min-w-[34rem] border-separate border-spacing-1 text-center text-[13px]">
          <thead>
            <tr className="text-[11px] tracking-wide text-muted uppercase">
              <th scope="col" className="w-32 text-left font-medium">Purchase</th>
              {BNPL_WEEKS.map((w) => <th key={w} scope="col" className="font-medium">Wk {w}</th>)}
            </tr>
          </thead>
          <tbody>
            {BNPL_PLANS.map((p) => (
              <tr key={p.name}>
                <th scope="row" className="text-left text-[13px] font-medium text-ink-2">{p.name} <span className="text-muted">({usd(p.total)})</span></th>
                {BNPL_WEEKS.map((w) => (
                  <td key={w} className={cx('rounded-md py-1.5', p.weeks.includes(w) ? 'bg-surface-2 font-medium text-ink' : 'text-muted/40')}>
                    {p.weeks.includes(w) ? usd(p.each) : '·'}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="pt-2 text-left text-[13px] font-semibold text-ink">Due that week</th>
              {totals.map((t, i) => (
                <td key={i} className={cx('rounded-md border py-1.5 font-semibold', t === peak ? 'border-warning-text/40 bg-warning-soft text-warning-text' : 'border-line text-ink')}>
                  {t === peak && <TriangleAlert className="mx-auto mb-0.5 size-3.5" aria-hidden />}
                  {usd(t)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Figure>
  );
}




/* ================================================================== */
/* Decision check + cheat sheet                                        */
/* ================================================================== */

const questions: QuizQuestion[] = [
  {
    id: 'two-steps',
    scenario: <>Your basic expenses are <strong>$2,400</strong> a month. You have <strong>$1,000</strong> saved and a credit card balance of <strong>$5,000 at 24%</strong>. You have an extra $400 a month.</>,
    prompt: 'What should the extra $400 a month do first?',
    options: [
      { text: 'Invest it in an index fund.', why: <>The card costs about <strong>$1,200 a year</strong> in interest (24% of $5,000). No investment is certain to earn 24%, so the card comes first.</> },
      { text: 'Pay down the card, and keep the $1,000 starter fund in savings.', correct: true, why: <>Yes. Paying off a 24% card is a certain 24% return, and the <Term id="starter-emergency-fund">starter fund</Term> keeps a surprise bill from going back on the card. At $400 a month the card is gone in about 14 months. Then you build toward $7,200 to $14,400.</> },
      { text: 'Skip the card and build a 6-month fund of $14,400 first.', why: <>That takes about 3 years at $400 a month, and the card costs about $1,200 a year in interest during that time. A savings account earns far less than 24%.</> },
      { text: 'Use the $1,000 to pay down the card and start over.', why: <>That leaves $0 saved. The next flat tire or medical bill goes back on the card at 24%, and you are where you started.</> },
    ],
  },
  {
    id: 'full-balance',
    scenario: <>Your only card has a <strong>$4,000</strong> limit and a statement balance of <strong>$1,800</strong>. The APR is 22%. You have enough in checking to pay all of it.</>,
    prompt: 'What should you pay by the due date?',
    options: [
      { text: 'The $35 minimum, so cash stays in checking.', why: <>The remaining $1,765 would cost about <strong>$32 in interest</strong> next month, and your utilization would stay near 44%.</> },
      { text: 'Half, $900.', why: <>That still leaves $900 charging 22%, about <strong>$16.50 a month</strong>, and utilization of about 22%.</> },
      { text: 'The full $1,800 statement balance.', correct: true, why: <>Yes. Paying the <Term id="statement-balance">statement balance</Term> in full means <strong>$0 in interest</strong> on those purchases because of the grace period. A low reported balance also keeps <Term id="credit-utilization">utilization</Term> low.</> },
      { text: 'Pay nothing and close the card.', why: <>A missed payment is reported as late and hurts <Term id="payment-history">payment history</Term>, the biggest factor at 35%. Closing the card also removes $4,000 of limit.</> },
    ],
  },
  {
    id: 'payday-loan',
    scenario: <>You need <strong>$400</strong> for a car repair and will be paid in 12 days. The payday lender charges <strong>$15 per $100</strong> for two weeks, a $60 fee. You are not sure you can repay the full $460 on payday.</>,
    prompt: 'What is the best choice?',
    options: [
      { text: 'Take the payday loan and renew it if needed.', why: <>$60 is about <strong>391% APR</strong>. Each renewal costs another $60 without reducing the $400. Four renewals cost $240 in fees alone.</> },
      { text: 'Ask the repair shop for a payment plan, or apply for a credit union payday alternative loan.', correct: true, why: <>Yes. A <Term id="payday-loan">payday loan</Term> alternative from a federal credit union is capped at <strong>28% APR</strong>, which is about $4 in interest on $400 for two weeks. A payment plan from the shop can cost $0.</> },
      { text: 'Take a title loan on your car instead.', why: <>A <Term id="title-loan">title loan</Term> often charges 25% a month, which is $100 on $400 and about 300% APR. You also risk losing the car you need to get to work.</> },
      { text: 'Take two payday loans to be safe.', why: <>Two loans means two $60 fees and two payments due at once. Any shortfall on payday leaves you short on both.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: LifeBuoy, title: 'Save in two steps.', body: <>First <strong>$500 to $1,000</strong> as fast as you can. After high-interest debt is gone, build <strong>3 to 6 months</strong> of basic expenses in a high-yield savings account.</> },
  { icon: CreditCard, title: 'Pay the full statement balance.', body: <>Pay on time and in full every month for <strong>$0 interest</strong>. Keep balances under 30% of your limit, and under 10% if you can.</> },
  { icon: Mountain, title: 'Treat debt above 7–8% as an emergency.', body: <>Pay it off with the avalanche or snowball method, whichever you will stick with. Do not use payday loans, title loans or rent-to-own.</> },
];

/* ================================================================== */

export default function SafetyNetChapter() {
  return (
    <ChapterLayout
      id="safety-net"
      questions={questions}
      rules={rules}
      sections={{
        '3-1': (
          <>
            <P>An emergency fund is cash set aside for unplanned, necessary costs such as a car repair, a medical bill or a lost job. Build it in two steps, because the first dollars matter more than the last.</P>
            <H3>Step 1: the starter buffer</H3>
            <Bullets items={[
              <><strong className="text-ink">Save $500 to $1,000 as fast as you can.</strong> Pause everything extra until you reach it.</>,
              <>It is sized to cover a flat tire or a broken refrigerator, so a surprise bill does not go back on a credit card.</>,
              <>Keep it in a separate savings account, not in your checking account, so it is not spent by accident.</>,
            ]} />
            <H3>Step 2: the full safety net</H3>
            <Bullets items={[
              <>Start only after your <strong className="text-ink">high-interest debt is gone</strong>.</>,
              <>Save <strong className="text-ink">3 to 6 months of basic survival expenses</strong>: rent, food, utilities, transportation and minimum bills. Do not count dining out or subscriptions.</>,
              <>Keep it in a <strong className="text-ink"><Term id="hysa">high-yield savings account</Term></strong>, never in stocks.</>,
            ]} />
            <TwoStepDiagram />
            <Example title="Sizing Step 2 for $2,400 of basic expenses a month">
              <Bullets items={[
                <>Rent: <strong>$1,200</strong></>,
                <>Groceries: <strong>$450</strong></>,
                <>Utilities and phone: <strong>$150</strong></>,
                <>Transportation: <strong>$250</strong></>,
                <>Insurance: <strong>$150</strong></>,
                <>Minimum debt payments: <strong>$200</strong></>,
              ]} />
              <p>Total: <strong>$2,400</strong> a month. Three months is <strong>$7,200</strong> and six months is <strong>$14,400</strong>. Choose closer to six months if your income is irregular or others depend on you.</p>
            </Example>
            <H3>Why not in stocks</H3>
            <P>An emergency fund must be there on the day you need it. Stock prices can fall sharply at the same time that jobs are lost. In 2020 the S&P 500 fell about 34% in five weeks, and unemployment rose from 3.5% in February to 14.7% in April. In the 2007–2009 downturn the index fell about 57%, and unemployment rose from about 5% to 10%. A fund held in stocks would have been worth the least when it was needed the most.</P>
            <StockDropChart />
            <GoDeeper title="Where to keep the money">
              <Bullets items={[
                <>A <Term id="hysa">high-yield savings account</Term> pays a higher <Term id="apy">APY</Term> than most checking and basic savings accounts, and you can withdraw the money within a day or two.</>,
                <>Choose an account with <Term id="fdic-insurance">FDIC insurance</Term> (banks) or NCUA insurance (credit unions). Both cover up to $250,000 per depositor.</>,
                <>Avoid places with penalties or delays: stocks, crypto, and certificates of deposit that charge for early withdrawal.</>,
                <>Choose an account with no monthly fee and no minimum balance that you might fall below.</>,
              ]} />
            </GoDeeper>
            <EmergencyFundSizer />
            <Mistakes title="Mistakes to avoid" items={[
              <>Skipping Step 1 and paying every spare dollar to debt. The next surprise bill goes back on the card.</>,
              <>Building a full 6-month fund while a 24% card balance stays unpaid.</>,
              <>Keeping the fund in checking, where it can be spent by accident.</>,
              <>Investing the fund in stocks to earn more.</>,
            ]} />
          </>
        ),
        '3-2': (
          <>
            <P>A credit card is a short-term loan. If you pay the whole <Term id="statement-balance">statement balance</Term> by the due date, you pay <strong>$0 in interest</strong> on purchases, because of the grace period. If you pay less, interest starts on the remaining balance.</P>
            <Bullets items={[
              <>Average credit card <Term id="apr">APRs</Term> have been above 20% in recent years. This chapter uses 22% as an example.</>,
              <>The <Term id="minimum-payment">minimum payment</Term> is small by design. It is mostly interest plus a little of the balance, so the balance falls slowly.</>,
              <>Every card statement includes a Minimum Payment Warning that shows how long payoff takes and what it costs.</>,
            ]} />
            <Compare
              left={{ title: 'Pay the full statement balance', body: <>On a {usd(STMT.balance)} balance: <strong>$0 interest</strong>. Debt-free by the next due date. The card works as a convenient way to pay.</> }}
              right={{ title: 'Pay only the minimum', body: <>On the same balance at 22%: about <strong>{years(STMT.minOnly.months)}</strong> to pay off and <strong>{usd(STMT.minOnly.totalInterest)}</strong> in interest.</> }}
            />
            <CardStatementFigure />
            <MinimumPaymentCheck />
            <H3>Credit score basics</H3>
            <P>A <Term id="credit-score">credit score</Term> estimates how reliably you repay debt. Lenders use it to decide whether to approve you and what rate to charge. There is no hidden formula to learn. Two habits cover most of it:</P>
            <Bullets items={[
              <><strong className="text-ink">Pay every bill on time.</strong> This is <Term id="payment-history">payment history</Term>, about 35% of a FICO score.</>,
              <><strong className="text-ink">Keep card balances low compared to your limits.</strong> This is <Term id="credit-utilization">credit utilization</Term>, part of amounts owed, about 30%. Under 30% is commonly advised, and under 10% is better.</>,
              <>Together these are <strong className="text-ink">65%</strong> of your score.</>,
            ]} />
            <ScoreWeightsChart />
            <ScoreFactors />
            <UtilizationCheck />
            <Mistakes title="Mistakes to avoid" items={[
              <>Paying only the minimum when you could pay the statement balance.</>,
              <>Missing a due date. Set up autopay for at least the minimum as a backup.</>,
              <>Closing an old card with no annual fee. It lowers your total limit and can raise utilization.</>,
              <>Applying for several cards in a short time. Each application can add a <Term id="hard-inquiry">hard inquiry</Term>.</>,
              <>Carrying a balance to build credit. Paying in full builds the same history without interest.</>,
            ]} />
          </>
        ),
        '3-3': (
          <>
            <P>Start by listing every debt with its balance, APR and minimum payment. Pay the minimum on all of them. Then send every extra dollar to one debt. When it is paid off, move its whole payment to the next debt. Two methods differ only in which debt goes first.</P>
            <Compare
              left={{ title: 'Avalanche: highest interest rate first', body: <>Saves the most money, because the most expensive debt is removed first. The first win can take longer. See <Term id="debt-avalanche">debt avalanche</Term>.</> }}
              right={{ title: 'Snowball: smallest balance first', body: <>Gives fast wins that keep you motivated, because the first debt is paid off sooner. It can cost more interest. See <Term id="debt-snowball">debt snowball</Term>.</> }}
            />
            <P>Choose the method you will actually keep following. A plan you finish beats a plan you abandon. If your debts have similar rates, the interest difference is small and Snowball costs little.</P>
            <PayoffOrderDiagram />
            <DebtRace />
            <H3>The 7–8% rule of thumb</H3>
            <Bullets items={[
              <><strong className="text-ink">Any debt above 7–8% interest is an emergency.</strong> Pay it off before you invest in anything beyond a retirement match.</>,
              <>Paying off a 22% card is the same as earning a certain 22% a year. The stock market has averaged about 10% a year before inflation, and some years it loses money.</>,
              <>Debts below about 4–5%, such as some mortgages and student loans, can be paid on schedule while you invest.</>,
              <>Between about 5% and 8%, either choice is reasonable. Choose the one you are more likely to keep up.</>,
            ]} />
            <SevenEightChart />
            <Example title="How to start">
              <Steps items={[
                { title: 'List every debt.', body: 'Name, balance, APR and minimum payment. Use the current statement for each.' },
                { title: 'Pay every minimum.', body: 'A missed minimum brings a late fee and a drop in your score.' },
                { title: 'Choose a method.', body: 'Avalanche if you want the lowest cost. Snowball if you need early wins.' },
                { title: 'Find the extra amount.', body: 'Even $50 a month matters. Use the budget from Chapter 1, and send raises and refunds here too.' },
                { title: 'Roll each payment forward.', body: 'When one debt is paid off, add its payment to the next one so the total you pay each month stays the same.' },
              ]} />
            </Example>
            <Mistakes title="Mistakes to avoid" items={[
              <>Paying extra on every debt a little. One debt at a time finishes sooner.</>,
              <>Skipping the starter fund and having to borrow again after the next surprise.</>,
              <>Letting the freed-up payment go back into spending when a debt is paid off.</>,
              <>Opening new credit while paying off the old.</>,
            ]} />
          </>
        ),
        '3-4': (
          <>
            <P>Four kinds of borrowing cost far more than they first appear. Each one is quick to get and hard to repay.</P>
            <ConceptCards cols={2} items={[
              { icon: Banknote, title: 'Payday loans', body: <>A <Term id="payday-loan">payday loan</Term> is typically $15 per $100 for two weeks. That is an APR of almost <strong>400%</strong> (391%). The full amount is due on your next payday, so many borrowers renew and pay the fee again.</> },
              { icon: Car, title: 'Title loans', body: <>A <Term id="title-loan">title loan</Term> uses your car as security. A common fee is 25% a month, about <strong>300% APR</strong>. If you cannot pay, the lender can repossess the car.</> },
              { icon: Armchair, title: 'Rent-to-own', body: <><Term id="rent-to-own">Rent-to-own</Term> splits a purchase into weekly payments. A $700 TV at $25 a week for 78 weeks costs <strong>$1,950</strong>, which is $1,250 more than the price.</> },
              { icon: CalendarDays, title: 'Buy Now, Pay Later stacking', body: <><Term id="bnpl">Buy Now, Pay Later</Term> plans feel small one at a time. Several plans can have payments in the same weeks, and automatic payments can overdraw checking and add late and overdraft fees.</> },
            ]} />
            <AprCompareChart />
            <Formula note="Fee ÷ amount borrowed, multiplied by the number of loan periods in a year.">$15 ÷ $100 = 15% per two weeks × 26 periods ≈ 391% APR</Formula>
            <PaydayCost />
            <H3>Rent-to-own: the total price</H3>
            <Example title="A $700 TV at $25 a week">
              <Bullets items={[
                <>78 weeks × $25 = <strong>$1,950</strong>.</>,
                <>The extra cost over the $700 price is <strong>$1,250</strong>, so you pay about 2.8 times the price.</>,
                <>The same $700 on a 22% card, paid over a year, would cost roughly $80 in interest. Saving $25 a week for 28 weeks buys it with no interest at all.</>,
              ]} />
            </Example>
            <H3>Buy Now, Pay Later stacking</H3>
            <P>One plan with four equal payments is usually manageable. The risk is running several at once. Keep to one plan at a time, and only for something you would otherwise pay for in cash this month.</P>
            <BnplCalendar />
            <H3>Safer alternatives</H3>
            <Bullets items={[
              <><strong className="text-ink">A starter emergency fund.</strong> $500 to $1,000 handles most of the cases that lead people to these loans.</>,
              <><strong className="text-ink">A payment plan with the biller.</strong> Landlords, utilities, hospitals and repair shops often agree to split a bill or delay a due date at no cost.</>,
              <><strong className="text-ink">A credit union payday alternative loan.</strong> Federal credit unions can offer small loans with an APR capped at 28%.</>,
              <><strong className="text-ink">An employer pay advance.</strong> Some employers let you draw part of earned wages early, often at low or no cost.</>,
              <><strong className="text-ink">Local assistance programs.</strong> Community organizations and 211 can help with rent, utilities and food.</>,
            ]} />
            <Mistakes title="Mistakes to avoid" items={[
              <>Renewing a payday loan instead of finding another way to repay it.</>,
              <>Using a title loan when you rely on the car to get to work.</>,
              <>Judging rent-to-own by the weekly payment instead of the total.</>,
              <>Running several Buy Now, Pay Later plans at the same time.</>,
            ]} />
          </>
        ),
      }}
    />
  );
}
