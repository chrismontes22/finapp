import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Briefcase, Calculator, Cloud, GraduationCap, PiggyBank, Scale, Scissors, Search, Stethoscope, TrendingUp, Wallet, Wrench, Zap,
} from 'lucide-react';
import { ChapterLayout } from '../components/ChapterLayout';
import { Term } from '../components/Glossary';
import { Bullets, Compare, ConceptCards, Example, GoDeeper, H3, Mistakes, MythBuster, P, Steps } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { ChartFrame, activeDot, cursorProps, gridProps, TooltipBox, xAxisProps, yAxisProps } from '../components/Chart';
import { BAR_RADIUS, COLUMN_RADIUS, MAX_BAR, barEndLabel, columnLabel, endLabel, Figure, FlowDiagram } from '../components/Figure';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { monthlyRate } from '../lib/growth';
import { usd } from '../lib/format';

/** Balance after `months` of end-of-month deposits growing at `annualPct` a year. */
const futureValue = (monthly: number, annualPct: number, months: number) => {
  const r = monthlyRate(annualPct);
  return r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
};

/* ================================================================== */
/* 4.1 Cutting has a limit, income does not                             */
/* ================================================================== */

function LimitDiagram() {
  const segs: Segment[] = [
    { key: 'ess', label: 'Essentials (rent, food, utilities, insurance, transportation)', value: 2700, color: 'var(--s1)' },
    { key: 'flex', label: 'Flexible (eating out, subscriptions, shopping, fun)', value: 900, color: 'var(--s2)' },
  ];
  return (
    <Figure
      kind="diagram"
      title="Spending has a minimum. Income does not."
      subtitle="One household spends $3,600 a month. $2,700 of that is essential."
      howToRead={[
        'The bar is the whole $3,600 of monthly spending, split into essentials and flexible spending.',
        'Cutting can only take money from the flexible part. The essentials cannot go much lower.',
        'The two boxes underneath compare what each approach can add.',
      ]}
      takeaway={<>Even if this household cut every flexible dollar, which is unrealistic, it would free up at most <strong>$900 a month</strong>. A raise has no such limit.</>}
      note="Illustrative numbers."
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 flex justify-between text-sm font-semibold text-ink"><span>Monthly spending</span><span className="tnum">{usd(3600)}</span></p>
          <SegmentBar segments={segs} total={3600} format={usd} ariaLabel="Monthly spending of $3,600: $2,700 essentials and $900 flexible" />
          <SegmentLegend segments={segs} total={3600} format={usd} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-ink"><Scissors className="size-4 text-muted" strokeWidth={1.75} aria-hidden />Cutting spending</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink">At most {usd(900)} a month</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-2">That is {usd(10800)} a year, and only if all flexible spending goes to $0. Once you reach your minimum, there is nothing left to cut.</p>
          </div>
          <div className="rounded-2xl border border-accent/50 bg-accent-soft/70 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-ink"><TrendingUp className="size-4 text-muted" strokeWidth={1.75} aria-hidden />Raising income</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink">No fixed maximum</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-2">A raise, a better-paid job, a new skill or a second source of income can each add money, and you can repeat them.</p>
          </div>
        </div>
      </div>
    </Figure>
  );
}

const CUT_EARN = [
  { label: 'Cut $100 a month', yearly: 1200 },
  { label: 'Cut $500 a month', yearly: 6000 },
  { label: 'Cut all $900 of flexible spending', yearly: 10800 },
  { label: '10% raise on $60,000', yearly: 6000 },
  { label: '20% raise on $60,000', yearly: 12000 },
].map((d) => ({ ...d, value: Math.round(futureValue(d.yearly / 12, 7, 120)) }));

function CutVsEarnChart() {
  return (
    <Figure
      title="What each extra amount is worth after 10 years"
      subtitle="Each bar is the money you free up or earn, invested every month for 10 years."
      height={280}
      table={{ columns: ['Option', 'Extra per year', 'Value after 10 years'], rows: CUT_EARN.map((d) => [d.label, usd(d.yearly), usd(d.value)]) }}
      howToRead={[
        'Each bar is one option. Its length is the invested value after 10 years.',
        'The first three bars come from cutting. The last two come from raises.',
        'Compare the second bar with the fourth: the same $6,000 a year gives the same result.',
      ]}
      takeaway={<>Cutting $500 a month and a 10% raise on $60,000 are each worth <strong>{usd(CUT_EARN[1].value)}</strong>. The difference is repeatability: cutting stops at <strong>{usd(CUT_EARN[2].value)}</strong>, while a 20% raise is worth <strong>{usd(CUT_EARN[4].value)}</strong>.</>}
      note="Illustrative. Assumes 7% average yearly growth, monthly deposits, and that each extra amount is kept as take-home pay. A real raise is smaller after taxes."
    >
      <BarChart data={CUT_EARN} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={(v) => usd(v, { compact: true })} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={210} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v)} />} />
        <Bar dataKey="value" name="Value after 10 years" fill="var(--s1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => usd(v, { compact: true }))} />
      </BarChart>
    </Figure>
  );
}

const CUT_DEFAULTS = { takeHome: 4500, spending: 3600, essentials: 2700, raise: 5 };
type CutState = typeof CUT_DEFAULTS;
const CUT_PRESETS: Preset<CutState>[] = [
  { label: 'Tight budget', values: { spending: 4200, essentials: 3900, raise: 5 } },
  { label: 'Room to cut', values: { spending: 4300, essentials: 2700, raise: 5 } },
  { label: 'Bigger raise', values: { raise: 12 } },
];
const CUT_GUIDE: SimGuide<CutState> = {
  how: ['Enter your monthly take-home pay and total spending.', 'Enter how much of that spending is essential.', 'Compare the most you could cut with what a raise adds.'],
  tryThis: [
    { label: 'Try "Tight budget." How much can you cut?', done: (s) => s.essentials >= 3900 },
    { label: 'Raise essentials to match your spending. What is left to cut?', done: (s) => s.essentials >= s.spending },
    { label: 'Set the raise to 12%. Which is larger now?', done: (s) => s.raise >= 12 },
  ],
};

function CutOrEarn() {
  const sim = useSim(CUT_DEFAULTS);
  const s = sim.state;
  const essentials = Math.min(s.essentials, s.spending);
  const flexible = s.spending - essentials;
  const raiseMonthly = (s.takeHome * s.raise) / 100;
  const segs: Segment[] = [
    { key: 'ess', label: 'Essentials', value: essentials, color: 'var(--s1)' },
    { key: 'flex', label: 'Flexible', value: flexible, color: 'var(--s2)' },
  ].filter((x) => x.value > 0);
  const tenYear = futureValue(raiseMonthly, 7, 120);
  return (
    <SimCard title="Cut or Earn" kind="Mini sandbox" icon={Scale} sim={sim} presets={CUT_PRESETS} guide={CUT_GUIDE}
      subtitle="See the most you could free up by cutting, next to what a raise adds.">
      <SimGrid controls={
        <ControlGroup title="Your month">
          <SliderField label="Take-home pay" value={s.takeHome} onChange={sim.set('takeHome')} min={1500} max={12000} step={100} format={(v) => usd(v)} />
          <SliderField label="Total spending" value={s.spending} onChange={sim.set('spending')} min={1000} max={s.takeHome + 1500} step={50} format={(v) => usd(v)} />
          <SliderField label="Essential spending" value={essentials} onChange={sim.set('essentials')} min={500} max={s.takeHome + 1500} step={50} format={(v) => usd(v)} help="Rent, groceries, utilities, insurance, transportation, minimum debt payments." />
          <SliderField label="Raise in take-home pay" value={s.raise} onChange={sim.set('raise')} min={0} max={30} step={1} format={(v) => v + '%'} />
        </ControlGroup>
      }>
        <StatGrid cols={4}>
          <StatTile label="Most you can cut" value={usd(flexible) + '/mo'} sub={usd(flexible * 12) + ' a year'} />
          <StatTile label="Raise adds" value={usd(raiseMonthly) + '/mo'} sub={usd(raiseMonthly * 12) + ' a year'} emphasis />
          <StatTile label="Raise, 10 years" value={usd(tenYear)} sub="invested at 7%" />
          <StatTile label="Spending left after cutting" value={usd(essentials)} sub="the minimum" />
        </StatGrid>
        {segs.length > 0 && (
          <div className="rounded-xl border border-line p-4">
            <p className="mb-3 flex justify-between text-sm font-semibold text-ink"><span>Monthly spending</span><span className="tnum">{usd(s.spending)}</span></p>
            <SegmentBar segments={segs} total={s.spending} format={usd} ariaLabel="Monthly spending split into essentials and flexible" />
            <SegmentLegend segments={segs} total={s.spending} format={usd} />
          </div>
        )}
        {flexible === 0 ? (
          <Nudge tone="warning" title="There is nothing left to cut">All of your spending is essential. The only way to free up more money is to raise your income or lower a large essential cost, such as housing.</Nudge>
        ) : raiseMonthly > flexible ? (
          <Nudge tone="good" title="This raise is larger than everything you could cut">A {s.raise}% raise adds {usd(raiseMonthly)} a month. Cutting every flexible dollar would add {usd(flexible)}.</Nudge>
        ) : (
          <Nudge tone="info" title="Cut first, then grow income">Trimming flexible spending is the fastest step. After you reach your minimum, raising income is the only way to keep adding more.</Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 4.2 Stay or switch                                                   */
/* ================================================================== */

interface PayPoint { year: number; stay: number; switch: number; extra: number }

/** Salary in each year, and the running total earned extra by switching. Year 1 is the starting salary. */
function payPaths(start: number, stayPct: number, switchPct: number, every: number, years: number): PayPoint[] {
  let stay = start;
  let sw = start;
  let cumStay = 0;
  let cumSwitch = 0;
  const rows: PayPoint[] = [];
  for (let year = 1; year <= years; year++) {
    if (year > 1) {
      stay *= 1 + stayPct / 100;
      sw *= 1 + ((year - 1) % every === 0 ? switchPct : stayPct) / 100;
    }
    cumStay += stay;
    cumSwitch += sw;
    rows.push({ year, stay: Math.round(stay), switch: Math.round(sw), extra: Math.round(cumSwitch - cumStay) });
  }
  return rows;
}

const PAY_LEGEND = [{ label: 'Change jobs every 3 years', color: 'var(--s1)' }, { label: 'Stay and take 3% raises', color: 'var(--s2)' }];

function PayLines({ data, years, switchLabel, stayLabel }: { data: PayPoint[]; years: number; switchLabel: string; stayLabel: string }) {
  const li = data.length - 1;
  const last = data[li];
  const step = years > 20 ? 5 : years > 10 ? 3 : 1;
  const ticks = data.filter((d) => d.year === 1 || (d.year - 1) % step === 0).map((d) => d.year);
  return (
    <LineChart data={data} margin={{ top: 16, right: 96, bottom: 4, left: 0 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" type="number" domain={[1, years]} ticks={ticks} tickFormatter={(v) => 'Yr ' + v} {...xAxisProps} />
      <YAxis tickFormatter={(v) => usd(v, { compact: true })} domain={['auto', 'auto']} {...yAxisProps} />
      <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Year ' + l} valueFormat={(v) => usd(v)} />} />
      <Line dataKey="switch" name={switchLabel} stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Switch ' + usd(last.switch, { compact: true }))} />
      <Line dataKey="stay" name={stayLabel} stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Stay ' + usd(last.stay, { compact: true }))} />
    </LineChart>
  );
}

const STAY_DATA = payPaths(55000, 3, 10, 3, 15);

function StayVsSwitchFigure() {
  const last = STAY_DATA[STAY_DATA.length - 1];
  return (
    <Figure
      title="Stay or switch: salary over 15 years"
      subtitle="Both people start at $55,000. One stays and gets a 3% raise every year. The other changes jobs every 3 years for a 10% pay increase, with 3% raises in between."
      legend={PAY_LEGEND}
      height={300}
      table={{ columns: ['Year', 'Switch', 'Stay', 'Extra earned by switching so far'], rows: STAY_DATA.filter((d) => d.year % 3 === 0 || d.year === 1).map((d) => [d.year, usd(d.switch), usd(d.stay), usd(d.extra)]) }}
      howToRead={[
        'The bottom axis counts years. The side axis is yearly salary.',
        'The upper line is the person who changes jobs. Each step up is a job change, in years 4, 7, 10 and 13.',
        'The gap between the lines is the yearly pay difference.',
      ]}
      takeaway={<>After 15 years the job changer earns <strong>{usd(last.switch)}</strong> a year and the person who stayed earns <strong>{usd(last.stay)}</strong>. Over those 15 years the changer earns about <strong>{usd(last.extra)}</strong> more in total.</>}
      note="Illustrative, not a forecast. Real pay changes vary, and a job change does not always come with a 10% increase."
    >
      <PayLines data={STAY_DATA} years={15} switchLabel="Change jobs every 3 years" stayLabel="Stay and take 3% raises" />
    </Figure>
  );
}

const STAY_DEFAULTS = { salary: 55000, stay: 3, sw: 10, every: 3, years: 15 };
type StayState = typeof STAY_DEFAULTS;
const STAY_PRESETS: Preset<StayState>[] = [
  { label: 'Smaller bump', hint: '5% per change', values: { sw: 5 } },
  { label: 'No pay premium', hint: '3% per change', values: { sw: 3 } },
  { label: 'Every 2 years', hint: '8% per change', values: { every: 2, sw: 8 } },
];
const STAY_GUIDE: SimGuide<StayState> = {
  how: ['Enter your salary and the yearly raise you get when you stay.', 'Enter the raise you expect from a job change and how often it happens.', 'Read the pay lines and the total earnings difference.'],
  tryThis: [
    { label: 'Try "No pay premium." What happens to the difference?', done: (s) => s.sw <= s.stay },
    { label: 'Set the job-change raise to 15%. How much does the total grow?', done: (s) => s.sw >= 15 },
    { label: 'Shorten the horizon to 5 years. Is the difference still large?', done: (s) => s.years <= 5 },
  ],
};

function StayOrSwitch() {
  const sim = useSim(STAY_DEFAULTS);
  const s = sim.state;
  const data = payPaths(s.salary, s.stay, s.sw, s.every, s.years);
  const last = data[data.length - 1];
  const changes = Math.floor((s.years - 1) / s.every);
  return (
    <SimCard title="Stay or Switch" kind="Mini sandbox" icon={Briefcase} sim={sim} presets={STAY_PRESETS} guide={STAY_GUIDE}
      subtitle="Compare staying in one job with changing jobs on a schedule.">
      <SimGrid controls={
        <>
          <ControlGroup title="Your pay">
            <SliderField label="Starting salary" value={s.salary} onChange={sim.set('salary')} min={25000} max={200000} step={1000} format={(v) => usd(v)} />
            <SliderField label="Yearly raise if you stay" value={s.stay} onChange={sim.set('stay')} min={0} max={8} step={0.5} format={(v) => v + '%'} />
          </ControlGroup>
          <ControlGroup title="If you change jobs">
            <SliderField label="Raise at each job change" value={s.sw} onChange={sim.set('sw')} min={0} max={25} step={1} format={(v) => v + '%'} help="Pay in the years between changes still rises by the yearly raise above." />
            <SliderField label="Years between changes" value={s.every} onChange={sim.set('every')} min={2} max={6} step={1} format={(v) => v + ' years'} />
            <SliderField label="Time horizon" value={s.years} onChange={sim.set('years')} min={5} max={30} step={1} format={(v) => v + ' years'} />
          </ControlGroup>
        </>
      }>
        <StatGrid cols={4}>
          <StatTile label={'Salary in year ' + s.years + ', switching'} value={usd(last.switch)} />
          <StatTile label={'Salary in year ' + s.years + ', staying'} value={usd(last.stay)} />
          <StatTile label="Job changes" value={String(changes)} sub={'one every ' + s.every + ' years'} />
          <StatTile label="Extra earned by switching" value={usd(last.extra, { sign: false })} sub={'over ' + s.years + ' years, before taxes'} emphasis />
        </StatGrid>
        <ChartFrame title="Yearly salary" legend={[{ label: 'Change jobs every ' + s.every + ' years', color: 'var(--s1)' }, { label: 'Stay and take ' + s.stay + '% raises', color: 'var(--s2)' }]} height={280}
          table={{ columns: ['Year', 'Switch', 'Stay'], rows: data.map((d) => [d.year, usd(d.switch), usd(d.stay)]) }}>
          <PayLines data={data} years={s.years} switchLabel="Change jobs" stayLabel="Stay" />
        </ChartFrame>
        {s.sw <= s.stay ? (
          <Nudge tone="warning" title="No pay advantage">When a job change pays no more than a normal raise, switching adds nothing here. Change jobs for a clear increase, better benefits or a better role.</Nudge>
        ) : (
          <Nudge tone="info" title="The difference grows each year">Each change adds a permanent step to your salary, and every later raise is calculated on the higher number. These are assumptions you choose, not a promise.</Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ---- Raise request one-pager ---- */

function RaiseRequestFigure() {
  const row = (k: string, v: ReactNode) => (
    <li className="flex items-start justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <span className="text-ink-2">{k}</span>
      <span className="tnum text-right font-medium text-ink">{v}</span>
    </li>
  );
  return (
    <Figure
      kind="example"
      title="A one-page raise request"
      subtitle="Notes you could bring to a review meeting. All names and numbers are examples."
      howToRead={[
        'The top section shows what similar jobs pay, taken from job postings and public data.',
        'The middle section lists results, each with a number.',
        'The bottom section states one specific figure to ask for.',
      ]}
      takeaway={<>A request for <strong>$68,000</strong> backed by market data and results is specific. It is an <strong>8.1%</strong> increase on $62,900, compared with a typical 3% raise of about $1,887.</>}
      note="Example only. Look up pay ranges for your own role, location and experience."
    >
      <div role="img" aria-label="Example one-page raise request with market pay, results and a specific ask" className="mx-auto max-w-xl rounded-2xl border border-line bg-surface-2/50 p-5">
        <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Raise request notes</p>
        <p className="mt-1 text-sm font-semibold text-ink">Operations Coordinator, 3 years in role</p>
        <p className="mt-4 text-sm font-semibold text-ink">1. Market rate</p>
        <ul className="mt-1 text-[13px]">
          {row('Three posted jobs for similar roles', '$66,000 – $74,000')}
          {row('Government occupational data (BLS)', 'Matches the posted range')}
          {row('Current pay', '$62,900')}
        </ul>
        <p className="mt-4 text-sm font-semibold text-ink">2. Results</p>
        <ul className="mt-1 text-[13px]">
          {row('Order processing time', '5 days down to 3 days')}
          {row('New hires trained', '4')}
          {row('Vendor contract renegotiated', 'Saves $9,000 a year')}
        </ul>
        <p className="mt-4 text-sm font-semibold text-ink">3. The ask</p>
        <ul className="mt-1 text-[13px]">
          {row('Requested pay', '$68,000')}
          {row('Increase', '$5,100 (8.1%)')}
          {row('Follow up', 'Confirm in writing')}
        </ul>
      </div>
    </Figure>
  );
}

function SkillPathFigure() {
  return (
    <Figure
      kind="diagram"
      title="From a skill to higher pay"
      subtitle="A repeatable process for choosing and using a skill that employers pay for."
      howToRead={[
        'Read the boxes left to right, or top to bottom on a phone.',
        'The first box is about evidence. Only train for skills that appear in real job postings with pay listed.',
        'The last box is where the pay change happens.',
      ]}
      takeaway={<>Check the pay and the training cost <strong>before</strong> you commit. A $3,000 course that raises pay by $6,000 a year pays for itself in about 6 months.</>}
      note="The $3,000 and $6,000 figures are an illustrative example, not typical results."
    >
      <FlowDiagram label="Find postings with pay ranges, choose a skill, train with help from your employer, then apply for the higher-paid role" steps={[
        { icon: Search, title: 'Find pay data', detail: 'Job postings with pay ranges, the BLS Occupational Outlook Handbook and salary sites.' },
        { icon: Calculator, title: 'Compare cost and pay', detail: 'Add up training cost and time. Estimate the yearly pay increase.' },
        { icon: GraduationCap, title: 'Train', detail: 'Check for employer tuition assistance first. Pay out of pocket only if you must.' },
        { icon: TrendingUp, title: 'Use it for higher pay', detail: 'Ask for new duties or a raise, or apply for roles that list the skill.', emphasis: true },
      ]} />
    </Figure>
  );
}

/* ---- Lifestyle creep ---- */

const CREEP = [
  { label: 'Spend all of it', save: 0 },
  { label: 'Invest half ($2,500)', save: 2500 },
  { label: 'Invest all of it ($5,000)', save: 5000 },
].map((d) => ({ ...d, y10: Math.round(futureValue(d.save / 12, 7, 120)), y20: Math.round(futureValue(d.save / 12, 7, 240)) }));

function CreepChart() {
  const half = CREEP[1];
  return (
    <Figure
      title="What a $5,000 raise becomes"
      subtitle="Three ways to use the same $5,000 a year raise, shown after 10 and after 20 years."
      legend={[{ label: 'After 10 years', color: 'var(--s1)' }, { label: 'After 20 years', color: 'var(--s2)' }]}
      height={290}
      table={{ columns: ['What you do with the raise', 'Invested per year', 'After 10 years', 'After 20 years'], rows: CREEP.map((d) => [d.label, usd(d.save), usd(d.y10), usd(d.y20)]) }}
      howToRead={[
        'Each group of bars is one choice. The first bar is the value after 10 years and the second after 20.',
        'The side axis is the invested value from the raise.',
        'If you spend the whole raise, there is nothing invested.',
      ]}
      takeaway={<>Investing half of the raise, <strong>$2,500 a year</strong>, grows to <strong>{usd(half.y10)}</strong> in 10 years and <strong>{usd(half.y20)}</strong> in 20. You still keep $2,500 a year to spend.</>}
      note="Illustrative. Assumes 7% average yearly growth and monthly deposits. The raise is treated as take-home pay."
    >
      <BarChart data={CREEP} margin={{ top: 24, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v)} />} />
        <Bar dataKey="y10" name="After 10 years" fill="var(--s1)" radius={COLUMN_RADIUS} maxBarSize={MAX_BAR * 2} isAnimationActive={false} label={columnLabel((v) => usd(v, { compact: true }))} />
        <Bar dataKey="y20" name="After 20 years" fill="var(--s2)" radius={COLUMN_RADIUS} maxBarSize={MAX_BAR * 2} isAnimationActive={false} label={columnLabel((v) => usd(v, { compact: true }))} />
      </BarChart>
    </Figure>
  );
}

function RaiseSplitDiagram() {
  return (
    <Figure
      kind="diagram"
      title="Split the raise before it reaches your spending"
      subtitle="A $5,000 raise, divided on the day it starts."
      howToRead={[
        'The first box is the raise. The next two boxes show where it goes.',
        'The highlighted box moves automatically to investing, so it is never available to spend.',
      ]}
      takeaway={<>Half of $5,000 is <strong>$208 a month</strong> invested and <strong>$208 a month</strong> of extra spending. Your lifestyle still improves, and your savings grow at the same time.</>}
    >
      <FlowDiagram label="A $5,000 raise splits into $2,500 invested automatically and $2,500 for spending" steps={[
        { icon: Briefcase, title: 'Raise', amount: '$5,000 a year', detail: 'About $417 a month more take-home pay.' },
        [
          { icon: PiggyBank, title: 'Invest, automatically', amount: '$2,500 a year', detail: 'About $208 a month, set up before the first larger paycheck.', emphasis: true },
          { icon: Wallet, title: 'Spend on your life', amount: '$2,500 a year', detail: 'About $208 a month for things you want.' },
        ],
      ]} />
    </Figure>
  );
}

const SPLIT_DEFAULTS = { raise: 5000, save: 50, years: 20, ret: 7 };
type SplitState = typeof SPLIT_DEFAULTS;
const SPLIT_PRESETS: Preset<SplitState>[] = [
  { label: 'Spend all of it', values: { save: 0 } },
  { label: 'Invest a quarter', values: { save: 25 } },
  { label: 'Invest all of it', values: { save: 100 } },
];
const SPLIT_GUIDE: SimGuide<SplitState> = {
  how: ['Enter the yearly raise in take-home pay.', 'Choose how much of it to invest.', 'Read what it grows to and what you can spend each month.'],
  tryThis: [
    { label: 'Set the share invested to 0%. What is the invested value?', done: (s) => s.save === 0 },
    { label: 'Change the time to 30 years. How much does the invested value change?', done: (s) => s.years >= 30 },
    { label: 'Set the return to 4%. Does saving half still matter?', done: (s) => s.ret <= 4 },
  ],
};

function RaiseSplitter() {
  const sim = useSim(SPLIT_DEFAULTS);
  const s = sim.state;
  const saveMonthly = (s.raise * s.save) / 100 / 12;
  const spendMonthly = (s.raise * (100 - s.save)) / 100 / 12;
  const data = Array.from({ length: s.years + 1 }, (_, year) => ({ year, value: Math.round(futureValue(saveMonthly, s.ret, year * 12)) }));
  const value = data[data.length - 1].value;
  const contributed = saveMonthly * 12 * s.years;
  const segs: Segment[] = [
    { key: 'invest', label: 'Invested', value: saveMonthly, color: 'var(--s1)' },
    { key: 'spend', label: 'Spent', value: spendMonthly, color: 'var(--s2)' },
  ].filter((x) => x.value > 0);
  const step = s.years > 20 ? 10 : s.years > 10 ? 5 : 1;
  const ticks = data.filter((d) => d.year % step === 0).map((d) => d.year);
  return (
    <SimCard title="Raise Splitter" kind="Mini sandbox" icon={PiggyBank} sim={sim} presets={SPLIT_PRESETS} guide={SPLIT_GUIDE}
      subtitle="Decide how much of a raise to invest and how much to spend.">
      <SimGrid controls={
        <ControlGroup title="Your raise">
          <SliderField label="Raise per year (take-home)" value={s.raise} onChange={sim.set('raise')} min={500} max={30000} step={250} format={(v) => usd(v)} />
          <SliderField label="Share of the raise you invest" value={s.save} onChange={sim.set('save')} min={0} max={100} step={5} format={(v) => v + '%'} />
          <SliderField label="Years invested" value={s.years} onChange={sim.set('years')} min={1} max={40} step={1} format={(v) => v + ' years'} />
          <SliderField label="Average yearly return" value={s.ret} onChange={sim.set('ret')} min={0} max={10} step={0.5} format={(v) => v + '%'} help="7% is a common planning assumption for a stock index fund. It is not guaranteed." />
        </ControlGroup>
      }>
        <StatGrid cols={4}>
          <StatTile label="Invested value" value={usd(value)} sub={'after ' + s.years + ' years'} emphasis />
          <StatTile label="You put in" value={usd(contributed)} />
          <StatTile label="Invested per month" value={usd(saveMonthly)} />
          <StatTile label="Extra to spend per month" value={usd(spendMonthly)} />
        </StatGrid>
        {segs.length > 0 && (
          <div className="rounded-xl border border-line p-4">
            <p className="mb-3 flex justify-between text-sm font-semibold text-ink"><span>Where the raise goes each month</span><span className="tnum">{usd(saveMonthly + spendMonthly)}</span></p>
            <SegmentBar segments={segs} total={saveMonthly + spendMonthly} format={usd} ariaLabel="Monthly share of the raise that is invested and spent" />
            <SegmentLegend segments={segs} total={saveMonthly + spendMonthly} format={usd} />
          </div>
        )}
        <ChartFrame title="Invested value from the raise" height={240}
          table={{ columns: ['Year', 'Invested value'], rows: data.filter((d) => d.year % step === 0).map((d) => [d.year, usd(d.value)]) }}>
          <LineChart data={data} margin={{ top: 16, right: 24, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="year" type="number" domain={[0, s.years]} ticks={ticks} tickFormatter={(v) => (v === 0 ? 'Now' : 'Yr ' + v)} {...xAxisProps} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Year ' + l} valueFormat={(v) => usd(v)} />} />
            <Line dataKey="value" name="Invested value" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
          </LineChart>
        </ChartFrame>
        {s.save === 0 ? (
          <Nudge tone="warning" title="Nothing invested">Spending the whole raise leaves your net worth where it was before the raise. Your lifestyle rises and your savings do not.</Nudge>
        ) : s.save < 50 ? (
          <Nudge tone="info" title="Below the half-raise guideline">Investing at least half of each raise still leaves room for a better lifestyle. Try 50% and compare the invested value.</Nudge>
        ) : (
          <Nudge tone="good" title={'You still get ' + usd(spendMonthly) + ' a month to spend'}>Setting the transfer up automatically means the invested share never reaches your spending account.</Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* Decision check + cheat sheet                                        */
/* ================================================================== */

export const questions: QuizQuestion[] = [
  {
    id: 'cut-limit',
    scenario: <>You spend <strong>$3,600</strong> a month, and <strong>$2,700</strong> of that is essential. You want to add <strong>$1,200</strong> a month to savings and investing.</>,
    prompt: 'What does the math say?',
    options: [
      { text: 'Cut $1,200 from spending. It is enough to try harder.', why: <>Only <strong>$900</strong> of your spending is flexible ($3,600 − $2,700). Even cutting all of it gives you $300 less than you need.</> },
      { text: 'Cut part of the $900 flexible spending, and raise income for the rest.', correct: true, why: <>Yes. Cutting $600 and earning $600 more reaches $1,200, and neither step has to be extreme. Cutting has a minimum of $900, while income can keep rising.</> },
      { text: 'Cut essentials such as rent to $0 for a few months.', why: <>Essentials such as housing, food and insurance cannot go to zero. Cutting them is a major change, not a short-term fix.</> },
      { text: 'Nothing can be done until your income rises.', why: <>Cutting the first $300 to $600 of flexible spending is quick and still worth doing. It just cannot cover the full $1,200 alone.</> },
    ],
  },
  {
    id: 'raise-ask',
    scenario: <>You earn <strong>$55,000</strong>. Three job postings for a similar role list <strong>$62,000 to $68,000</strong>. Your review is next month, and a standard 3% raise would add about <strong>$1,650</strong>.</>,
    prompt: 'What is the best first step?',
    options: [
      { text: 'Wait for the 3% raise and accept whatever is offered.', why: <>A 3% raise brings you to $56,650, still <strong>$5,350</strong> below the bottom of the posted range.</> },
      { text: 'Bring the postings and your results, and ask for a specific figure such as $63,000.', correct: true, why: <>Yes. $63,000 is a <strong>$8,000</strong> (14.5%) increase, supported by market data. A specific number backed by evidence is easier to approve than a general request.</> },
      { text: 'Ask for "as much as possible" without a number.', why: <>Without a figure, the manager picks the number, and it is often close to the standard 3%.</> },
      { text: 'Say you will quit without applying anywhere else.', why: <>Without an offer, you have no evidence of your market value and no other option if the answer is no.</> },
    ],
  },
  {
    id: 'raise-split',
    scenario: <>You get a raise of <strong>$400 a month</strong>. Your goal is to invest at least half of every raise. At 7% a year, $200 a month grows to about <strong>$34,200</strong> in 10 years.</>,
    prompt: 'Which plan follows the rule?',
    options: [
      { text: 'Spend the $400 on a nicer car payment.', why: <>All $400 goes to spending, so you invest <strong>$0</strong> from the raise and your net worth does not change.</> },
      { text: 'Set up an automatic $200 transfer to investing, and spend the other $200.', correct: true, why: <>Yes. The $200 is invested before you can spend it, and you still have $200 a month to improve your life. In 10 years it is worth about <strong>$34,200</strong>.</> },
      { text: 'Invest whatever is left at the end of each month.', why: <>When the full $400 is in your checking account, spending usually rises to meet it. What is left is often close to $0.</> },
      { text: 'Wait a year, then decide what to do with the raise.', why: <>Your spending adjusts to the higher pay within a few months. Decide on payday, when the raise starts.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Scissors, title: 'Cut to your minimum, then grow income.', body: <>Trim flexible spending first, since it is quick. Only about <strong>$900</strong> of a $3,600 budget could ever be cut, so the next dollars have to be earned.</> },
  { icon: Search, title: 'Check your market pay every 1 to 2 years.', body: <>Compare job postings and public pay data with your salary. If you are below market rate, ask for a specific figure with your results, or change jobs.</> },
  { icon: PiggyBank, title: 'Invest at least half of every raise.', body: <>Move the share to investing automatically on the day the raise starts. A $5,000 raise with $2,500 invested becomes about <strong>$105,700</strong> in 20 years at 7%.</> },
];

/* ================================================================== */

export default function IncomeChapter() {
  return (
    <ChapterLayout
      id="income"
      questions={questions}
      rules={rules}
      sections={{
        '4-1': (
          <>
            <P>Budgeting is worth doing, and Chapter 1 shows how. But every budget has a lowest possible level, because rent, food, utilities, insurance and transportation have to be paid. Income has no such limit.</P>
            <Bullets items={[
              <><strong className="text-ink">Cutting saves small amounts.</strong> Trimming a subscription or a delivery habit frees up tens of dollars a month.</>,
              <><strong className="text-ink">Cutting has a limit.</strong> You cannot cut an essential bill to zero, so each cut makes the next one harder.</>,
              <><strong className="text-ink">Earning more has no fixed limit.</strong> A raise, a new skill or a second source of income can add hundreds of dollars a month, and you can repeat each of them.</>,
              <><strong className="text-ink">Both matter.</strong> Cut the waste first because it is fast. Then put your effort into earning more, because that is where larger gains come from.</>,
            ]} />
            <LimitDiagram />
            <CutVsEarnChart />
            <Example title="The same $6,000 a year, two ways">
              <Bullets items={[
                <>Cut: $500 less spending each month = <strong>$6,000 a year</strong>. That is a large cut for most households.</>,
                <>Earn: a 10% raise on a $60,000 salary = <strong>$6,000 a year</strong>, with no change in how you live.</>,
                <>Invested at 7% for 10 years, either one grows to about <strong>{usd(CUT_EARN[1].value)}</strong>.</>,
                <>The raise can happen again. The cut cannot go below your minimum.</>,
              ]} />
            </Example>
            <MythBuster myth="If I cut spending far enough, I will build wealth on a low income.">
              <p>Cutting helps, but it has a limit. On a $3,600 budget with $2,700 of essentials, the most you can free up is $900 a month. Raising income is the part that can keep growing.</p>
            </MythBuster>
            <CutOrEarn />
          </>
        ),
        '4-2': (
          <>
            <P>There are four practical ways to earn more. Each one works best when you check where you stand every year or two.</P>

            <H3>1. Negotiate raises and change jobs</H3>
            <P>Annual raises are often 2 to 3%. A move to a new employer often comes with a larger increase, and the Federal Reserve Bank of Atlanta's Wage Growth Tracker has generally shown faster wage growth for people who change jobs than for people who stay. Raises compound: every later raise is a percentage of a higher salary.</P>
            <StayVsSwitchFigure />
            <StayOrSwitch />
            <GoDeeper title="When changing jobs is not worth it">
              <Bullets items={[
                <>Check benefits, not only salary: health insurance, vacation and the 401(k) match.</>,
                <>If you leave before your match is <Term id="vesting">vested</Term>, you can lose part of it. Chapter 6 explains vesting.</>,
                <>A new job can carry risk, such as less job security in the first year.</>,
                <>A change only helps if the new pay is clearly above your <Term id="market-rate">market rate</Term> and above a normal raise.</>,
              ]} />
            </GoDeeper>
            <H3>How to ask for a raise</H3>
            <Steps items={[
              { title: 'Research the market rate.', body: 'Use job postings that list pay ranges, the BLS Occupational Outlook Handbook, and salary sites. Write down at least three comparisons.' },
              { title: 'List your results with numbers.', body: 'Time saved, money saved, revenue added, people trained, projects finished.' },
              { title: 'Ask for a specific figure.', body: 'Name one number, such as $68,000, instead of asking for "more."' },
              { title: 'Time it near your review.', body: 'Ask a few weeks before budgets and reviews are set, or after a clear success.' },
              { title: 'Get the offer in writing.', body: 'Confirm the new pay, the start date and any other changes by email or letter.' },
            ]} />
            <RaiseRequestFigure />

            <H3>2. Learn skills employers pay for</H3>
            <P>Pay rises when you can do something that is in demand and hard to find. Pick skills by checking job postings and pay data first, then train.</P>
            <ConceptCards cols={3} items={[
              { icon: Wrench, title: 'Skilled trades', body: 'Electrician, plumber, HVAC technician and welder. Many are learned through paid apprenticeships or trade programs.' },
              { icon: Stethoscope, title: 'Healthcare', body: 'Nursing and related licensed roles, which require a program and a license.' },
              { icon: Cloud, title: 'Technology', body: 'IT support and cloud certifications, which can be earned through study and an exam.' },
              { icon: Zap, title: 'Sales', body: 'Many sales roles pay part of income as commission, so results change your pay directly.' },
              { icon: Calculator, title: 'Bookkeeping', body: 'Small businesses need help tracking income and expenses, and the work can be done part-time.' },
              { icon: GraduationCap, title: 'Employer tuition assistance', body: 'Some employers pay part of the cost of classes or certifications. Ask HR before you pay yourself.' },
            ]} />
            <SkillPathFigure />

            <H3>3. Choose side income that builds something</H3>
            <P>Extra income helps, but the type matters. Some work pays only for the hours you put in. Other work builds a skill, a client list or something you own.</P>
            <Compare
              left={{ title: 'Hours for pay', body: <><p>A fixed hourly rate that stops when you stop. Useful for a short-term goal, such as paying off a card.</p><Bullets items={['Extra shifts at a low hourly rate', 'Work that teaches you little', 'Limited by the hours in your week']} /></> }}
              right={{ title: 'Builds skills or ownership', body: <><p>Work that raises your future pay or gives you <Term id="equity">equity</Term>, a part of something you own.</p><Bullets items={['Freelancing in your own field', 'A small business you own', 'Content or products that you own and can sell again']} /></> }}
            />
            <Nudge tone="tip" title="Self-employed income is taxed differently">If you work for yourself, no employer withholds tax. Plan to pay <Term id="estimated-taxes">estimated taxes</Term> and <Term id="self-employment-tax">self-employment tax</Term>, and set aside part of each payment. Chapter 8 covers this.</Nudge>

            <H3>4. Keep lifestyle creep in check</H3>
            <P>When income rises, spending often rises with it. This is <Term id="lifestyle-creep">lifestyle creep</Term>. A raise that is fully spent leaves your savings where they were. The rule: when you get a raise, save or invest <strong>at least half</strong> of it before you upgrade your lifestyle.</P>
            <RaiseSplitDiagram />
            <CreepChart />
            <RaiseSplitter />
            <Mistakes items={[
              <>Accepting the first offer without checking the <strong>market rate</strong>.</>,
              <>Asking for a raise with no numbers or results to support it.</>,
              <>Taking a second job that pays only for hours and teaches nothing.</>,
              <>Letting spending rise on the same day a raise starts.</>,
            ]} />
          </>
        ),
      }}
    />
  );
}
