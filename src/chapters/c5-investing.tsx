import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { Hourglass, Landmark, Layers, Scale, Shuffle, Sprout, Store, TrendingUp } from 'lucide-react';
import { ChapterLayout } from '../components/ChapterLayout';
import { Term } from '../components/Glossary';
import { Bullets, Compare, Example, Formula, GoDeeper, H3, Mistakes, MythBuster, P, Steps, UnderTheHood } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { Button, SegmentedControl, Switch } from '../components/ui';
import { ChartFrame, TooltipBox, activeDot, cursorProps, gridProps, xAxisProps, yAxisProps } from '../components/Chart';
import { BAR_RADIUS, COLUMN_RADIUS, MAX_BAR, Figure, StatementMockup, barEndLabel, columnLabel, endLabel } from '../components/Figure';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { usd, pct, num } from '../lib/format';
import {
  CHEF_ASSUMPTIONS, chefOdds, exactDoubling, monthlyRate, ruleOf72, simpleVsCompound, simulateChef, simulateFees, simulateSavings,
  simulateWaiting, type Frequency,
} from '../lib/growth';
import { simulateDip } from '../lib/portfolio';

/** Balance after months of end-of-month deposits growing at annualPct a year. */
const futureValue = (monthly: number, annualPct: number, months: number) => {
  const r = monthlyRate(annualPct);
  return r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
};

/* ================================================================== */
/* 5.1 Why saving cash alone isn't enough                              */
/* ================================================================== */

const BUYING = Array.from({ length: 31 }, (_, year) => ({ year, power: Math.round(10000 / Math.pow(1.03, year)) }));
const BUYING_MARKS = [10, 20, 30];

function BuyingPowerChart() {
  const marks = BUYING_MARKS.map((y) => BUYING[y]);
  return (
    <Figure
      title="What $10,000 in cash can buy over 30 years"
      subtitle="The balance stays at $10,000. Prices rise 3% a year."
      height={290}
      table={{ columns: ['Year', 'Dollars in the account', "Buying power in today's dollars"], rows: BUYING.filter((d) => d.year % 5 === 0).map((d) => [d.year, usd(10000), usd(d.power)]) }}
      howToRead={[
        'The bottom axis counts years from today. The side axis shows dollars.',
        'The flat dashed line is the $10,000 in the account. It never changes.',
        <>The solid line is what those dollars can buy, measured in <strong>today's</strong> prices.</>,
      ]}
      takeaway={<>After 20 years the same $10,000 buys what <strong>{usd(BUYING[20].power)}</strong> buys today. After 30 years it buys what <strong>{usd(BUYING[30].power)}</strong> buys today, a loss of {usd(10000 - BUYING[30].power)} in buying power.</>}
      note="Illustrative. Assumes prices rise 3% a year and the cash earns no interest. A savings account that pays interest slows the loss but does not remove it when the rate is below inflation."
    >
      <LineChart data={BUYING} margin={{ top: 28, right: 24, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="year" type="number" domain={[0, 30]} ticks={[0, 5, 10, 15, 20, 25, 30]} tickFormatter={(v) => (v === 0 ? 'Now' : 'Yr ' + v)} {...xAxisProps} />
        <YAxis domain={[0, 10000]} ticks={[0, 2500, 5000, 7500, 10000]} tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Year ' + l} valueFormat={(v) => usd(v)} />} />
        <ReferenceLine y={10000} stroke="var(--axis)" strokeDasharray="5 4" label={{ value: 'Dollars in the account: $10,000', position: 'insideBottomLeft', fill: 'var(--axis-text)', fontSize: 11 }} />
        <Line dataKey="power" name="Buying power" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
        {marks.map((m) => (
          <ReferenceDot key={m.year} x={m.year} y={m.power} r={5} fill="var(--s1)" stroke="var(--surface)" strokeWidth={2}
            label={{ value: usd(m.power), position: 'top', fill: 'var(--ink)', fontSize: 12, fontWeight: 600, offset: 10 }} />
        ))}
      </LineChart>
    </Figure>
  );
}

function HorizonDiagram() {
  const zones = [
    {
      icon: Landmark, title: 'Needed within about 5 years', where: 'Keep it in savings (an FDIC-insured high-yield savings account)', color: 'var(--s1)',
      items: ['Emergency fund', 'Down payment you will use in 3 years', 'Car you plan to replace next year', 'Tuition due next fall'],
      why: 'The balance does not fall when markets fall, and the money is there on the day the bill arrives.',
    },
    {
      icon: TrendingUp, title: '5 or more years away', where: 'Invest it in low-cost, broad index funds', color: 'var(--s2)',
      items: ['Retirement', 'Money you will not touch for 10 to 40 years', "A child's college fund, if it starts early", 'Long-term wealth building'],
      why: 'Long periods give investments time to recover from declines, and growth can outpace inflation.',
    },
  ];
  return (
    <Figure
      kind="diagram"
      title="Where money belongs, by when you need it"
      subtitle="Match each dollar to the date you will spend it."
      howToRead={[
        'The bar on top is a timeline from today to 30 years from now.',
        'The left card covers money you will spend in the next 5 years. The right card covers money you will leave alone for longer.',
        'Each card lists examples and where that money fits.',
      ]}
      takeaway={<>The question is not "savings or investing?" but <strong>"when do I need this money?"</strong>. Money due within 5 years stays in savings. Money 5 or more years away is invested.</>}
    >
      <div role="img" aria-label="Timeline: money needed within 5 years belongs in savings, money needed after 5 years belongs in investments">
        <div className="flex gap-[2px] overflow-hidden rounded-[10px] text-xs font-medium text-white" aria-hidden>
          <div className="flex h-9 items-center justify-center px-2" style={{ flex: 5, background: 'var(--s1)' }}>Now to year 5</div>
          <div className="flex h-9 items-center justify-center px-2" style={{ flex: 25, background: 'var(--s2)' }}>Year 5 to year 30 and beyond</div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {zones.map((z) => (
            <div key={z.title} className="rounded-2xl border border-line bg-surface p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="size-2.5 rounded-full" style={{ background: z.color }} aria-hidden />
                <z.icon className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
                {z.title}
              </p>
              <p className="mt-2 text-[15px] font-medium text-ink">{z.where}</p>
              <ul className="mt-2 space-y-1 text-[13px] text-ink-2">
                {z.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
              <p className="mt-3 border-t border-line pt-2.5 text-xs leading-relaxed text-ink-2">{z.why}</p>
            </div>
          ))}
        </div>
      </div>
    </Figure>
  );
}

/* ================================================================== */
/* 5.2 Compounding without the math                                    */
/* ================================================================== */

const STARTERS = Array.from({ length: 41 }, (_, i) => {
  const age = 25 + i;
  return {
    age,
    a25: Math.round(futureValue(300, 7, i * 12)),
    a35: age >= 35 ? Math.round(futureValue(300, 7, (age - 35) * 12)) : null,
    a45: age >= 45 ? Math.round(futureValue(300, 7, (age - 45) * 12)) : null,
  };
});

function ThreeStartersChart() {
  const last = STARTERS[STARTERS.length - 1];
  const li = STARTERS.length - 1;
  return (
    <Figure
      title="Same $300 a month, three different start ages"
      subtitle="Each person invests $300 every month until age 65."
      legend={[{ label: 'Starts at 25', color: 'var(--s1)' }, { label: 'Starts at 35', color: 'var(--s2)' }, { label: 'Starts at 45', color: 'var(--s3)' }]}
      height={310}
      table={{ columns: ['Age', 'Starts at 25', 'Starts at 35', 'Starts at 45'], rows: STARTERS.filter((d) => d.age % 5 === 0).map((d) => [d.age, usd(d.a25), d.a35 === null ? '' : usd(d.a35), d.a45 === null ? '' : usd(d.a45)]) }}
      howToRead={[
        'The bottom axis is age. The side axis is the total value of the investments.',
        'Each line starts when that person makes the first deposit.',
        'All three lines receive the same $300 a month. Only the start age differs.',
      ]}
      takeaway={<>At 65 the person who started at 25 has about <strong>{usd(last.a25)}</strong>. The one who started at 35 has <strong>{usd(last.a35 ?? 0)}</strong>, and the one who started at 45 has <strong>{usd(last.a45 ?? 0)}</strong>. Ten extra years roughly double the result.</>}
      note="Illustrative. Assumes 7% average yearly growth, deposits at the end of each month and no withdrawals. Real returns vary from year to year."
    >
      <LineChart data={STARTERS} margin={{ top: 16, right: 100, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="age" type="number" domain={[25, 65]} ticks={[25, 35, 45, 55, 65]} tickFormatter={(v) => 'Age ' + v} {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Age ' + l} valueFormat={(v) => usd(v)} />} />
        <Line dataKey="a25" name="Starts at 25" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Age 25: ' + usd(last.a25, { compact: true }))} />
        <Line dataKey="a35" name="Starts at 35" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} connectNulls={false} label={endLabel(li, 'Age 35: ' + usd(last.a35 ?? 0, { compact: true }))} />
        <Line dataKey="a45" name="Starts at 45" stroke="var(--s3)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} connectNulls={false} label={endLabel(li, 'Age 45: ' + usd(last.a45 ?? 0, { compact: true }))} />
      </LineChart>
    </Figure>
  );
}

const STARTER_ROWS = [25, 35, 45].map((age) => {
  const months = (65 - age) * 12;
  const total = Math.round(futureValue(300, 7, months));
  const put = 300 * months;
  return { age, total, put, growth: total - put };
});

function ContributionsVsGrowth() {
  const max = STARTER_ROWS[0].total;
  const first = STARTER_ROWS[0];
  return (
    <Figure
      kind="diagram"
      title="Your deposits versus growth"
      subtitle="The same three people at age 65, drawn at the same scale."
      legend={[{ label: 'What you deposited', color: 'var(--s-neutral)', kind: 'box' }, { label: 'Growth', color: 'var(--s1)', kind: 'box' }]}
      howToRead={[
        'Each bar is one person at 65. The full length is the total value.',
        'The gray part is the money they deposited. The colored part is growth.',
        'Bar lengths are drawn to the same scale, so you can compare them directly.',
      ]}
      takeaway={<>The person who started at 25 deposited <strong>{usd(first.put)}</strong> and ended with <strong>{usd(first.total)}</strong>. Growth supplied {pct((first.growth / first.total) * 100, 0)} of the final total.</>}
      note="Illustrative. $300 a month at 7% average yearly growth."
    >
      <div className="space-y-5">
        {STARTER_ROWS.map((r) => {
          const segs: Segment[] = [
            { key: 'put', label: 'Deposited', value: r.put, color: 'var(--s-neutral)', ink: 'var(--ink)' },
            { key: 'growth', label: 'Growth', value: r.growth, color: 'var(--s1)' },
          ];
          return (
            <div key={r.age}>
              <p className="mb-1.5 flex flex-wrap justify-between gap-x-4 text-sm text-ink-2">
                <span className="font-semibold text-ink">Starts at {r.age} ({65 - r.age} years of deposits)</span>
                <span className="tnum">Deposited {usd(r.put)} · Growth {usd(r.growth)} · Total <strong className="text-ink">{usd(r.total)}</strong></span>
              </p>
              <div style={{ width: (r.total / max) * 100 + '%', minWidth: '6rem' }}>
                <SegmentBar segments={segs} total={r.total} height={26} format={usd} showInside={false} ariaLabel={'Starts at ' + r.age + ': deposited ' + usd(r.put) + ', growth ' + usd(r.growth)} />
              </div>
            </div>
          );
        })}
      </div>
    </Figure>
  );
}

const EARLY_SMALL = Math.round(futureValue(200, 7, 40 * 12));
const LATE_BIG = Math.round(futureValue(800, 7, 15 * 12));
const SMALL_BIG = [
  { label: '$200 a month from age 25', put: 200 * 480, growth: EARLY_SMALL - 200 * 480, total: EARLY_SMALL },
  { label: '$800 a month from age 50', put: 800 * 180, growth: LATE_BIG - 800 * 180, total: LATE_BIG },
];

function SmallEarlyBigLate() {
  return (
    <Figure
      title="A small amount early versus a large amount late"
      subtitle="Both people stop at 65. One deposits $200 a month for 40 years. The other deposits $800 a month for 15 years."
      legend={[{ label: 'What you deposited', color: 'var(--s1)', kind: 'box' }, { label: 'Growth', color: 'var(--s2)', kind: 'box' }]}
      height={230}
      table={{ columns: ['Plan', 'Deposited', 'Growth', 'Total at 65'], rows: SMALL_BIG.map((d) => [d.label, usd(d.put), usd(d.growth), usd(d.total)]) }}
      howToRead={[
        'Each bar is one plan, drawn from the same starting line.',
        'The first color is the money deposited. The second color is growth. The total is printed at the end.',
        'Compare the total lengths, then the deposited parts.',
      ]}
      takeaway={<>The $200-a-month plan ends with <strong>{usd(EARLY_SMALL)}</strong> from {usd(200 * 480)} deposited. The $800-a-month plan ends with <strong>{usd(LATE_BIG)}</strong> even though it deposited {usd(800 * 180)}. Starting 25 years earlier beat saving four times as much.</>}
      note="Illustrative. Assumes 7% average yearly growth and deposits at the end of each month."
    >
      <BarChart data={SMALL_BIG} layout="vertical" margin={{ top: 4, right: 110, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={(v) => usd(v, { compact: true })} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={150} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v)} />} />
        <Bar dataKey="put" name="Deposited" stackId="a" fill="var(--s1)" maxBarSize={MAX_BAR + 8} isAnimationActive={false} />
        <Bar dataKey="growth" name="Growth" stackId="a" fill="var(--s2)" radius={BAR_RADIUS} maxBarSize={MAX_BAR + 8} isAnimationActive={false}
          label={(p: { x?: number | string; y?: number | string; width?: number | string; height?: number | string; index?: number }) => (
            <text x={Number(p.x) + Number(p.width) + 6} y={Number(p.y) + Number(p.height) / 2} dy={4} fontSize={12} fontWeight={600} fill="var(--ink)">{usd(SMALL_BIG[p.index ?? 0].total) + ' total'}</text>
          )} />
      </BarChart>
    </Figure>
  );
}

/* ================================================================== */
/* 5.3 Index funds                                                     */
/* ================================================================== */

const FAILED_SQUARE = 217;

function IndexGridDiagram() {
  return (
    <Figure
      kind="diagram"
      title="What an S&P 500 index fund holds"
      subtitle="Each square is one company. There are 500 squares."
      legend={[{ label: 'A company in the fund', color: 'var(--s1)', kind: 'box' }, { label: 'One company that fails', color: 'var(--critical)', kind: 'box' }]}
      howToRead={[
        'The grid has 25 columns and 20 rows, so it holds 500 squares.',
        'The outlined red square is one company that fails and its stock falls to zero.',
        'Every other square is a company that keeps operating.',
      ]}
      takeaway={<>If the 500 holdings were the same size, one failure would remove <strong>0.2%</strong> of the fund. On a $10,000 investment, that is <strong>$20</strong>.</>}
      note="Simplified. A real S&P 500 fund gives larger companies bigger weights, so a typical company is worth less than 0.2% of the fund and the largest are worth more. A total stock market fund holds several thousand companies."
    >
      <div role="img" aria-label="A grid of 500 squares, one for each company in the S&P 500. One square is marked as a failed company; the other 499 are intact.">
        <div className="mx-auto grid max-w-2xl gap-[3px]" style={{ gridTemplateColumns: 'repeat(25, minmax(0, 1fr))' }} aria-hidden>
          {Array.from({ length: 500 }, (_, i) => (
            <span key={i} className="aspect-square rounded-[2px]"
              style={i === FAILED_SQUARE ? { background: 'var(--critical)', outline: '2px solid var(--ink)', outlineOffset: '1px' } : { background: 'var(--s1)' }} />
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-ink-2"><strong className="text-ink">499 of 500</strong> companies unaffected</p>
      </div>
    </Figure>
  );
}

const LOSS_COMPARE = [
  { label: 'All $10,000 in one stock', loss: 10000 },
  { label: '$10,000 in a 500-company fund', loss: 20 },
];

function OneFailureChart() {
  return (
    <Figure
      title="What one company failing costs you"
      subtitle="You have $10,000 invested. One company's stock falls to zero."
      height={170}
      table={{ columns: ['Where the $10,000 is', 'Loss if that company fails'], rows: LOSS_COMPARE.map((d) => [d.label, usd(d.loss)]) }}
      howToRead={[
        'Each bar is the most you lose in one scenario. Longer means a bigger loss.',
        'The top bar puts all $10,000 in a single company. The bottom bar spreads it over 500 equal holdings.',
        'The number at the end of each bar is the loss in dollars.',
      ]}
      takeaway={<>One failure costs a single-stock investor <strong>$10,000</strong> and an index fund investor about <strong>$20</strong>. That is the reason to own many companies at once.</>}
      note="Illustrative. Assumes the failed company is worth $0 and all holdings are equal in size."
    >
      <BarChart data={LOSS_COMPARE} layout="vertical" margin={{ top: 4, right: 70, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={(v) => usd(v, { compact: true })} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={190} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v) + ' lost'} />} />
        <Bar dataKey="loss" name="Loss" fill="var(--s1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => usd(v))} />
      </BarChart>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Inflation vs savings visualizer                                      */
/* ------------------------------------------------------------------ */

const INF_DEFAULTS = { start: 10000, monthly: 200, apy: 0.4, inflation: 3, years: 10 };
type InfState = typeof INF_DEFAULTS;
const INF_PRESETS: Preset<InfState>[] = [
  { label: 'Big Bank 0.01%', values: { apy: 0.01 } },
  { label: 'HYSA 4.5%', values: { apy: 4.5 } },
  { label: '6-Month Safety Net', hint: '$15,000 parked in a 4% HYSA, no new deposits', values: { start: 15000, monthly: 0, apy: 4, years: 5 } },
];
const INF_GUIDE: SimGuide<InfState> = {
  how: ['Set your starting cash and monthly deposit.', 'Set the account APY and inflation rate.', 'Compare the balance to buying power.'],
  tryThis: [
    { label: 'Drop the APY to 0.01%, like many big banks pay.', done: (s) => s.apy < 0.015 },
    { label: 'Raise the APY above inflation. Does buying power exceed your deposits?', done: (s) => s.apy > s.inflation },
    { label: 'Set inflation to 0%. Now balance and buying power match.', done: (s) => s.inflation < 0.05 },
  ],
};

function InflationVisualizer() {
  const sim = useSim(INF_DEFAULTS);
  const s = sim.state;
  const data = useMemo(() => simulateSavings(s), [s]);
  const hysa = useMemo(() => simulateSavings({ ...s, apy: 4.5 }), [s]);
  const last = data[data.length - 1];
  const interest = last.nominal - last.deposited;
  const lostToInflation = last.nominal - last.real;
  const realGap = last.real - last.deposited;
  const chartData = data.filter((d) => d.month % 3 === 0).map((d) => ({ x: Number(d.year.toFixed(2)), nominal: d.nominal, real: d.real, deposited: d.deposited }));
  const yearly = data.filter((d) => d.month % 12 === 0);

  return (
    <SimCard title="Inflation vs. Savings Visualizer" sim={sim} presets={INF_PRESETS} guide={INF_GUIDE}
      subtitle="See if your savings grow faster than prices rise.">
      <SimGrid controls={
        <>
          <ControlGroup title="Your cash">
            <SliderField label="Starting cash" value={s.start} onChange={sim.set('start')} min={0} max={50000} step={500} format={(v) => usd(v)} />
            <SliderField label="Monthly deposit" value={s.monthly} onChange={sim.set('monthly')} min={0} max={2000} step={25} format={(v) => usd(v)} />
          </ControlGroup>
          <ControlGroup title="Interest and inflation">
            <SliderField label={<>Account <Term id="apy">APY</Term></>} value={s.apy} onChange={sim.set('apy')} min={0.01} max={6} step={0.01} format={(v) => pct(v, 2)} help="Big banks often pay about 0.01%. Online HYSAs often pay 3.5–4.5%." />
            <SliderField label={<><Term id="inflation">Inflation</Term> rate</>} value={s.inflation} onChange={sim.set('inflation')} min={0} max={10} step={0.1} format={(v) => pct(v, 1)} help="The U.S. long-run average is about 3%." />
            <SliderField label="Years" value={s.years} onChange={sim.set('years')} min={1} max={10} step={1} format={(v) => v + (v === 1 ? ' yr' : ' yrs')} />
          </ControlGroup>
        </>
      }>
        <StatGrid cols={4}>
          <StatTile label="Account balance" value={usd(last.nominal)} sub={`after ${s.years} yrs (nominal)`} />
          <StatTile label="Real buying power" value={usd(last.real)} sub="in today's dollars" emphasis />
          <StatTile label="Interest earned" value={usd(interest)} sub={`on ${usd(last.deposited)} deposited`} />
          <StatTile label="Lost to inflation" value={usd(lostToInflation)} sub="balance − buying power" />
        </StatGrid>

        <ChartFrame
          title="Dollars in the account vs. what they can actually buy"
          subtitle={`${pct(s.apy, 2)} APY vs. ${pct(s.inflation, 1)} inflation over ${s.years} years`}
          legend={[
            { label: 'Account balance (nominal)', color: 'var(--s1)' },
            { label: "Buying power (today's dollars)", color: 'var(--s2)' },
            { label: 'Total you deposited', color: 'var(--s-neutral-2)', dashed: true },
          ]}
          table={{ columns: ['Year', 'Deposited', 'Balance', "Buying power"], rows: yearly.map((d) => [d.year, usd(d.deposited), usd(d.nominal), usd(d.real)]) }}
        >
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="x" type="number" domain={[0, s.years]} ticks={Array.from({ length: s.years + 1 }, (_, i) => i)} tickFormatter={(v) => `Yr ${v}`} {...xAxisProps} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} domain={['auto', 'auto']} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => `Year ${num(Number(l), Number(l) % 1 ? 1 : 0)}`} valueFormat={(v) => usd(v)} />} />
            <Line type="monotone" dataKey="deposited" name="Deposited" stroke="var(--s-neutral-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="nominal" name="Balance" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="real" name="Buying power" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
            {s.start > 0 && <ReferenceLine y={s.start} stroke="var(--axis)" />}
          </LineChart>
        </ChartFrame>

        {s.apy < s.inflation ? (
          <Nudge tone="warning" title="Prices are rising faster than your balance">
            Your {pct(s.apy, 2)} APY is below {pct(s.inflation, 1)} inflation, so your cash buys a bit less each year.
            {realGap < 0 ? <> After {s.years} years, it buys <strong>{usd(-realGap)} less</strong> than the dollars you put in.</> : null}
            {s.apy < 4.5 && <> In a 4.5% HYSA, the same deposits would grow to <strong>{usd(hysa[hysa.length - 1].nominal)}</strong> (<strong>{usd(hysa[hysa.length - 1].nominal - last.nominal)} more</strong>).</>}
          </Nudge>
        ) : (
          <Nudge tone="good" title="Your cash is keeping up">
            At {pct(s.apy, 2)} APY vs. {pct(s.inflation, 1)} inflation, your buying power keeps up ({usd(realGap, { sign: true })} vs. what you deposited).
            Cash is for safety. Money you will not need for 5 or more years belongs in investments, as the rest of this chapter explains.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}



/* ------------------------------------------------------------------ */
/* Cost of waiting                                                      */
/* ------------------------------------------------------------------ */

const CW_DEFAULTS = { monthly: 200, returnPct: 7, switchAge: 32, doublings: false };
type CwState = typeof CW_DEFAULTS;
const CW_PRESETS: Preset<CwState>[] = [
  { label: 'Early Starter vs. Late Starter', hint: '$300/month at 7%: 10 years vs. 33 years', values: { monthly: 300, returnPct: 7, switchAge: 32 } },
  { label: 'Rule of 72 Explorer', hint: '9% return → doubles every ~8 years', values: { monthly: 300, returnPct: 9, switchAge: 32, doublings: true } },
  { label: 'Slow & Steady (4%)', hint: 'Low returns: does starting early still win?', values: { monthly: 300, returnPct: 4, switchAge: 32 } },
];

function CostOfWaiting() {
  const sim = useSim(CW_DEFAULTS);
  const s = sim.state;
  const data = useMemo(() => simulateWaiting({ monthly: s.monthly, returnPct: s.returnPct, aStart: 22, switchAge: s.switchAge, endAge: 65 }), [s.monthly, s.returnPct, s.switchAge]);
  const last = data[data.length - 1];
  const cross = data.find((d) => d.age > s.switchAge && d.b > d.a);
  const aWins = last.a >= last.b;
  const dbl = ruleOf72(s.returnPct);
  const exact = exactDoubling(s.returnPct);
  const atSwitch = data.find((d) => d.age === s.switchAge)!;
  const doublingAges: number[] = [];
  for (let a = s.switchAge + dbl; a <= 65; a += dbl) doublingAges.push(a);
  const aYears = s.switchAge - 22, bYears = 65 - s.switchAge;

  return (
    <SimCard title="Cost of Waiting Simulator" sim={sim} presets={CW_PRESETS}
      subtitle={<>See who has more at 65: Person A (invests <strong>22 to {s.switchAge}</strong>) or Person B (<strong>{s.switchAge} to 65</strong>).</>}
      guide={{
        how: ['Pick a monthly amount and a return.', 'Set the age when A stops and B starts.', 'Compare their totals at 65.'],
        tryThis: [
          { label: 'Slide the switch age to 40. Who wins now?', done: (st) => st.switchAge >= 40 },
          { label: 'Drop the return to 4%. Does Person B finish ahead?', done: (st) => st.returnPct <= 4 },
          { label: 'Turn on doubling markers to see the Rule of 72.', done: (st) => st.doublings },
        ],
      }}>
      <SimGrid controls={
        <>
          <ControlGroup title="The two investors">
            <SliderField label="Monthly contribution" value={s.monthly} onChange={sim.set('monthly')} min={50} max={1500} step={25} format={(v) => usd(v)} />
            <SliderField label="Average annual return" value={s.returnPct} onChange={sim.set('returnPct')} min={1} max={12} step={0.5} format={(v) => pct(v, 1)} help="7% is a common long-term guess for mostly-stock investing, after inflation." />
            <SliderField label="A stops / B starts at age" value={s.switchAge} onChange={sim.set('switchAge')} min={25} max={45} step={1} format={(v) => String(v)} />
          </ControlGroup>
          <ControlGroup title="Rule of 72">
            <div className="rounded-lg bg-surface p-3 text-sm">
              <p className="text-ink-2">72 ÷ {num(s.returnPct, 1)}% ≈</p>
              <p className="text-2xl font-semibold text-ink">{num(dbl, 1)} years</p>
              <p className="text-xs text-muted">to double (exact: {num(exact, 1)} yrs)</p>
            </div>
            <Switch checked={s.doublings} onChange={sim.set('doublings')} label="Show doubling markers" description="Watch Person A's money double without any new deposits" />
          </ControlGroup>
        </>
      }>
        <StatGrid>
          <StatTile label={`Person A at 65 (${aYears} yrs investing)`} value={usd(last.a)} sub={`contributed ${usd(last.aContrib)}`} emphasis={aWins} />
          <StatTile label={`Person B at 65 (${bYears} yrs investing)`} value={usd(last.b)} sub={`contributed ${usd(last.bContrib)}`} emphasis={!aWins} />
          <StatTile label={aWins ? 'A finishes ahead by' : 'B finishes ahead by'} value={usd(Math.abs(last.a - last.b))} sub={cross ? `B overtakes A at age ${cross.age}` : 'B never catches up'} />
        </StatGrid>

        <ChartFrame title="Balance by age" subtitle={`${usd(s.monthly)}/month at ${pct(s.returnPct, 1)}`} height={300}
          legend={[{ label: `Person A (22–${s.switchAge})`, color: 'var(--s1)' }, { label: `Person B (${s.switchAge}–65)`, color: 'var(--s2)' }]}
          table={{ columns: ['Age', 'Person A', 'Person B'], rows: data.filter((d) => d.age % 5 === 0 || d.age === 65 || d.age === s.switchAge).map((d) => [d.age, usd(d.a), usd(d.b)]) }}>
          <LineChart data={data} margin={{ top: 16, right: 20, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="age" type="number" domain={[22, 65]} ticks={[22, 30, 40, 50, 60, 65]} {...xAxisProps} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => `Age ${l}`} valueFormat={(v) => usd(v)} />} />
            <ReferenceLine x={s.switchAge} stroke="var(--axis)" label={{ value: 'A stops · B starts', position: 'insideTopLeft', fill: 'var(--axis-text)', fontSize: 11 }} />
            {s.doublings && doublingAges.map((a) => <ReferenceLine key={a} x={a} stroke="var(--s1)" strokeOpacity={0.35} strokeDasharray="3 3" />)}
            <Line type="monotone" dataKey="a" name="Person A" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="b" name="Person B" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
            {cross && <ReferenceDot x={cross.age} y={cross.b} r={6} fill="var(--s2)" stroke="var(--surface)" strokeWidth={2} />}
          </LineChart>
        </ChartFrame>

        <div className="space-y-4 rounded-xl border border-line p-4">
          <p className="text-sm font-semibold text-ink">Your money vs. growth at 65</p>
          {[{ who: 'Person A', bal: last.a, c: last.aContrib, color: 'var(--s1)' }, { who: 'Person B', bal: last.b, c: last.bContrib, color: 'var(--s2)' }].map((p) => {
            const segs = [
              { key: 'c', label: 'Contributed', value: p.c, color: 'var(--s-neutral)', ink: 'var(--ink)' },
              { key: 'g', label: 'Growth', value: Math.max(0, p.bal - p.c), color: p.color },
            ];
            return (
              <div key={p.who}>
                <p className="mb-1.5 text-xs font-medium text-ink-2">{p.who}: {usd(p.bal)}</p>
                <SegmentBar segments={segs} total={p.bal} height={28} format={usd} ariaLabel={`${p.who}: contributions versus growth`} />
                <SegmentLegend segments={segs} total={p.bal} format={usd} />
              </div>
            );
          })}
        </div>

        {s.doublings && (
          <Nudge tone="info" title={`Doubling every ~${num(dbl, 1)} years`}>
            Person A had <strong>{usd(atSwitch.a)}</strong> at {s.switchAge}. Without adding a cent, it doubles at about ages {doublingAges.map((a) => Math.round(a)).join(', ')}, reaching roughly <strong>{usd(atSwitch.a * Math.pow(2, doublingAges.length))}</strong> by the last one. Each dashed line is one doubling.
          </Nudge>
        )}
        {aWins ? (
          <Nudge tone="good" title="Starting early won">
            Person A put in <strong>{usd(last.aContrib)}</strong>, about {Math.round((last.aContrib / last.bContrib) * 100)}% of Person B's {usd(last.bContrib)}, and still came out ahead. A's early deposits had {65 - s.switchAge}+ extra years to grow.
          </Nudge>
        ) : (
          <Nudge tone="info" title="Here, contributing longer wins">
            At {pct(s.returnPct, 1)}, growth is slower, so Person B's extra {usd(last.bContrib - last.aContrib)} of deposits wins out. But notice how much more B had to save. Best plan: start early <em>and</em> keep going.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}



/* ------------------------------------------------------------------ */
/* Simple vs compound                                                   */
/* ------------------------------------------------------------------ */

const SC_DEFAULTS = { principal: 10000, rate: 7, years: 30, freq: 'annually' as Frequency };
type ScState = typeof SC_DEFAULTS;
const SC_PRESETS: Preset<ScState>[] = [
  { label: 'Stocks: 7% for 40 yrs', hint: '$5,000 left invested for 40 years', values: { principal: 5000, rate: 7, years: 40, freq: 'annually' } },
  { label: 'Savings: 5% daily vs. yearly', values: { principal: 10000, rate: 5, years: 20, freq: 'daily' } },
];

function SimpleVsCompound() {
  const sim = useSim(SC_DEFAULTS);
  const s = sim.state;
  const data = useMemo(() => simpleVsCompound(s.principal, s.rate, s.years, s.freq), [s]);
  const yearly = useMemo(() => simpleVsCompound(s.principal, s.rate, s.years, 'annually'), [s.principal, s.rate, s.years]);
  const last = data[data.length - 1];
  const freqGain = last.compound - yearly[yearly.length - 1].compound;
  return (
    <SimCard title="Simple vs. Compound Interest" kind="Mini sandbox" icon={Sprout} sim={sim} presets={SC_PRESETS}
      subtitle="See how much more your money grows when interest earns interest."
      guide={{
        how: ['Set a starting amount and a rate.', 'Drag Years to change the time.', 'Watch the gap between the two lines.'],
        tryThis: [
          { label: 'Switch to daily compounding. Big change or tiny?', done: (st) => st.freq === 'daily' },
          { label: 'Drag Years to 40 and watch the gap grow.', done: (st) => st.years >= 40 },
        ],
      }}>
      <SimGrid controls={
        <ControlGroup title="Inputs">
          <SliderField label="Starting amount" value={s.principal} onChange={sim.set('principal')} min={1000} max={50000} step={500} format={(v) => usd(v)} />
          <SliderField label="Annual rate" value={s.rate} onChange={sim.set('rate')} min={1} max={30} step={0.5} format={(v) => pct(v, 1)} />
          <SliderField label="Years" value={s.years} onChange={sim.set('years')} min={1} max={40} step={1} format={(v) => v + ' yrs'} />
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink"><Term id="compounding-frequency">Compounding frequency</Term></p>
            <SegmentedControl label="Compounding frequency" size="sm" value={s.freq} onChange={sim.set('freq')}
              options={[{ value: 'annually', label: 'Yearly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'monthly', label: 'Monthly' }, { value: 'daily', label: 'Daily' }]} />
          </div>
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="Simple interest" value={usd(last.simple)} sub={`+${usd(last.simple - s.principal)} total`} />
          <StatTile label="Compound interest" value={usd(last.compound)} sub={`+${usd(last.compound - s.principal)} total`} emphasis />
          <StatTile label="Interest on interest" value={usd(last.compound - last.simple)} sub="the compounding bonus" />
        </StatGrid>
        <ChartFrame title={`${usd(s.principal)} at ${pct(s.rate, 1)} for ${s.years} years`} height={240}
          legend={[{ label: `Compound (${s.freq === 'annually' ? 'yearly' : s.freq})`, color: 'var(--s1)' }, { label: 'Simple', color: 'var(--s2)' }]}
          table={{ columns: ['Year', 'Simple', 'Compound'], rows: data.map((d) => [d.year, usd(d.simple), usd(d.compound)]) }}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="year" type="number" domain={[0, s.years]} tickFormatter={(v) => `Yr ${v}`} {...xAxisProps} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => `Year ${l}`} valueFormat={(v) => usd(v)} />} />
            <Line type="monotone" dataKey="simple" name="Simple" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="compound" name="Compound" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
          </LineChart>
        </ChartFrame>
        <Nudge tone="info" title="Frequency matters a little. Time matters a lot.">
          {s.freq === 'annually'
            ? <>Switch to daily: it adds very little. Now try dragging <em>Years</em> instead.</>
            : <>Compounding {s.freq} instead of yearly adds <strong>{usd(freqGain)}</strong> here. Compounding itself adds <strong>{usd(last.compound - last.simple)}</strong>.</>}
          {s.rate >= 18 && <> On debt, the same math can double a card balance in about <strong>{num(ruleOf72(s.rate), 1)} years</strong>.</>}
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}



/* ------------------------------------------------------------------ */
/* One stock vs. the whole market                                      */
/* ------------------------------------------------------------------ */

const STK_DEFAULTS = { seed: 1, years: 20 };
type StkState = typeof STK_DEFAULTS;
const STK_PRESETS: Preset<StkState>[] = [
  { label: 'A stock that did well', values: { seed: 5, years: 20 } },
  { label: 'A stock that did poorly', values: { seed: 8, years: 20 } },
];

function OneStockVsMarket() {
  const sim = useSim(STK_DEFAULTS);
  const s = sim.state;
  const data = useMemo(() => simulateChef(s.seed, 10000, s.years), [s.seed, s.years]);
  const odds = useMemo(() => chefOdds(100, s.years), [s.years]);
  const last = data[data.length - 1];
  return (
    <SimCard title="One Stock vs. the Whole Market" kind="Mini sandbox" icon={Store} sim={sim} presets={STK_PRESETS}
      subtitle="See how one company compares with owning the whole market. The stocks are simulated, not real ones."
      guide={{
        how: ['Watch both lines grow from $10,000.', 'Click the button to pick another stock.', 'Check how many of 100 stocks won.'],
        tryThis: [
          { label: 'Pick three new stocks. How many outperformed the index?', done: (st) => st.seed >= 4 },
          { label: 'Stretch it to 30 years. Do the odds get worse?', done: (st) => st.years >= 30 },
        ],
      }}>
      <SimGrid controls={
        <ControlGroup title="Simulation">
          <SliderField label="Years invested" value={s.years} onChange={sim.set('years')} min={5} max={30} step={1} format={(v) => v + ' yrs'} />
          <Button variant="soft" icon={Shuffle} onClick={() => sim.setState((st) => ({ ...st, seed: st.seed + 1 }))} className="w-full">Pick another stock</Button>
          <p className="text-xs text-muted">Stock #{s.seed}. Both average {Math.round(CHEF_ASSUMPTIONS.expected * 100)}% a year. A single company rises and falls by about {Math.round(CHEF_ASSUMPTIONS.stockVol * 100)}% in a typical year. The index, about {Math.round(CHEF_ASSUMPTIONS.indexVol * 100)}%.</p>
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="Whole-market index fund" value={usd(last.index)} sub={`from $10,000 over ${s.years} yrs`} />
          <StatTile label={`Single stock #${s.seed}`} value={usd(last.stock)} sub={last.stock > last.index ? 'ahead of the index this time' : 'behind the index'} />
          <StatTile label="Out of 100 random single stocks" value={`${odds.beatIndex} outperformed the index`} sub={`${odds.lostMoney} lost money · ${odds.halved} lost half or more`} emphasis />
        </StatGrid>
        <ChartFrame title="Growth of $10,000" height={240}
          legend={[{ label: 'Index fund', color: 'var(--s1)' }, { label: `Single stock #${s.seed}`, color: 'var(--s2)' }]}
          table={{ columns: ['Year', 'Index fund', 'Single stock'], rows: data.map((d) => [d.year, usd(d.index), usd(d.stock)]) }}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="year" type="number" domain={[0, s.years]} tickFormatter={(v) => `Yr ${v}`} {...xAxisProps} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => `Year ${l}`} valueFormat={(v) => usd(v)} />} />
            <Line type="monotone" dataKey="index" name="Index fund" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="stock" name="Single stock" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
          </LineChart>
        </ChartFrame>
        <Nudge tone="info" title="Same average, very different odds">
          A few large winners raise the <em>average</em>, but the <em>typical</em> single stock ends up behind. Here, only {odds.beatIndex} of 100 outperformed the index over {s.years} years.
          Research on U.S. stocks from 1926 to 2016 found that about 4% of them accounted for the market's net gains over Treasury bills. An index fund owns all of them.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}



/* ================================================================== */
/* 5.4 Fees, risk and staying calm                                     */
/* ================================================================== */

const FEE_COSTS = [0.03, 0.1, 0.5, 1].map((r) => ({ label: r.toFixed(2) + '%', cost: Math.round(10000 * (r / 100)) }));
const FEE_EXAMPLE = (() => {
  const d = simulateFees({ monthly: 300, years: 25, gross: 7, feeLow: 0.03, feeHigh: 1 });
  const last = d[d.length - 1];
  return { low: Math.round(last.low), high: Math.round(last.high), gap: Math.round(last.low - last.high) };
})();

function FeeCostChart() {
  return (
    <Figure
      title="What a fund's fee costs per year on $10,000"
      subtitle="The yearly fee is a percentage of your balance, called the expense ratio."
      height={260}
      table={{ columns: ['Expense ratio', 'Cost per year on $10,000'], rows: FEE_COSTS.map((d) => [d.label, usd(d.cost)]) }}
      howToRead={[
        'The bottom axis is the fund\'s expense ratio. The height of each column is the yearly cost in dollars.',
        'The first two columns, 0.03% and 0.10%, are typical for index funds.',
        'The last column, 1%, is common for funds run by active managers.',
      ]}
      takeaway={<>A 0.03% fund costs <strong>$3</strong> a year per $10,000. A 1% fund costs <strong>$100</strong>, about 33 times as much, for the same $10,000.</>}
      note="The fee is deducted from the fund's value every year, so the dollar cost grows as your balance grows."
    >
      <BarChart data={FEE_COSTS} margin={{ top: 28, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v)} {...yAxisProps} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox labelFormat={(l) => 'Expense ratio ' + l} valueFormat={(v) => usd(v) + ' a year'} />} />
        <Bar dataKey="cost" name="Cost per year" fill="var(--s1)" radius={COLUMN_RADIUS} maxBarSize={MAX_BAR + 24} isAnimationActive={false} label={columnLabel((v) => usd(v))} />
      </BarChart>
    </Figure>
  );
}

const DROPS = [
  { label: '2000–02 (prior high regained 2007)', drop: 49 },
  { label: '2007–09 (regained 2013)', drop: 57 },
  { label: '2020 (regained about 6 months after the peak)', drop: 34 },
  { label: '2022 (regained January 2024)', drop: 25 },
];

function DropsChart() {
  return (
    <Figure
      title="Large drops in the S&P 500, and how long recovery took"
      subtitle="Four large declines since 2000, measured from the highest point to the lowest."
      height={290}
      table={{ columns: ['Period', 'Peak-to-trough decline'], rows: DROPS.map((d) => [d.label, '−' + d.drop + '%']) }}
      howToRead={[
        'Each bar is one market decline. Longer means a deeper drop.',
        'The label on the left gives the years and when the previous high was regained.',
        'The number at the end of each bar is the size of the decline.',
      ]}
      takeaway={<>Every decline was followed by a recovery. The deepest, <strong>−57%</strong> in 2007–09, took until 2013. The 2020 drop of <strong>−34%</strong> recovered in about six months.</>}
      note="Approximate. S&P 500 price index, peak to trough; with dividends reinvested, recoveries were somewhat faster. Past results do not guarantee future ones."
    >
      <BarChart data={DROPS} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" domain={[0, 70]} tickFormatter={(v) => (v === 0 ? '0%' : '−' + v + '%')} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={220} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => '−' + v + '%'} />} />
        <Bar dataKey="drop" name="Decline" fill="var(--s1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => '−' + v + '%')} />
      </BarChart>
    </Figure>
  );
}

function DcaStatement() {
  return (
    <Figure
      kind="example"
      title="The same $500 buys more shares when the price is lower"
      subtitle="A brokerage purchase history for three monthly $500 purchases."
      howToRead={[
        'Each row is one automatic purchase of $500. The price per share changes from month to month.',
        'In the month the price fell to $80, the same $500 bought 6.25 shares instead of 5.',
        'The summary compares your average cost per share with the average price.',
      ]}
      takeaway={<>At $100 a share, $500 buys <strong>5 shares</strong>. At $80 it buys <strong>6.25 shares</strong>. Across the three purchases your average cost was <strong>$89.26</strong>, below the $90.00 average price.</>}
      note="Example numbers. Fund names and prices are made up to show how monthly purchases work."
    >
      <StatementMockup
        label="Example brokerage purchase history of three $500 purchases at $100, $80 and $90 per share"
        issuer="Example Brokerage"
        title="Total market index fund, automatic purchases"
        period="Jan – Mar"
        rows={[
          { date: 'Jan 1', label: 'Bought 5.00 shares at $100.00', amount: -500 },
          { date: 'Feb 1', label: 'Bought 6.25 shares at $80.00', amount: -500, flag: { text: 'Lower price', tone: 'good' } },
          { date: 'Mar 1', label: 'Bought 5.56 shares at $90.00', amount: -500 },
        ]}
        summary={[
          { label: 'Total invested', value: '$1,500.00' },
          { label: 'Shares owned', value: '16.81' },
          { label: 'Average price over the three months', value: '$90.00' },
          { label: 'Your average cost per share', value: '$89.26', strong: true },
        ]}
      />
    </Figure>
  );
}

function SpeculationSplit() {
  const segs: Segment[] = [
    { key: 'broad', label: 'Broad index funds', value: 9500, color: 'var(--s1)' },
    { key: 'spec', label: 'Speculation (crypto, single stocks)', value: 500, color: 'var(--s2)' },
  ];
  return (
    <Figure
      kind="diagram"
      title="A $10,000 portfolio that follows the 95/5 limit"
      legend={[{ label: 'Broad index funds: 95%', color: 'var(--s1)', kind: 'box' }, { label: 'Speculation: 5% or less', color: 'var(--s2)', kind: 'box' }]}
      howToRead={[
        'The whole bar is the portfolio, $10,000.',
        'The large part is broad index funds. The small part is the most you allow for crypto or individual stocks.',
        'The legend lists the dollar amount of each part.',
      ]}
      takeaway={<>Keep <strong>$9,500</strong> in boring, broad index funds and cap the speculative part at <strong>$500</strong>. The speculative part is small enough that a total loss changes your plan very little.</>}
    >
      <SegmentBar segments={segs} total={10000} height={40} format={usd} ariaLabel="Portfolio split: $9,500 in broad index funds and $500 in speculation" />
      <SegmentLegend segments={segs} total={10000} format={usd} />
    </Figure>
  );
}

const SPEC_LOSS = [
  { label: '5% speculative', loss: 500 },
  { label: '20% speculative', loss: 2000 },
  { label: '50% speculative', loss: 5000 },
];

function SpeculationLossChart() {
  return (
    <Figure
      title="If the speculative part goes to zero"
      subtitle="The most you lose on a $10,000 portfolio, by how much of it is speculative."
      height={200}
      table={{ columns: ['Speculative share', 'Loss if it goes to zero'], rows: SPEC_LOSS.map((d) => [d.label, usd(d.loss)]) }}
      howToRead={[
        'Each bar is a different share of the portfolio held in speculation.',
        'Bar length is the dollar loss if that part falls to zero.',
        'The number at the end of each bar is the loss.',
      ]}
      takeaway={<>At 5%, a total loss costs <strong>$500</strong>. If half the portfolio were speculative, the same outcome would cost <strong>$5,000</strong>.</>}
      note="Illustrative. Assumes the speculative holdings fall to $0 and the rest of the portfolio is unchanged."
    >
      <BarChart data={SPEC_LOSS} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={(v) => usd(v, { compact: true })} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={120} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v) + ' lost'} />} />
        <Bar dataKey="loss" name="Loss" fill="var(--s1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => usd(v))} />
      </BarChart>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Market drop: steady investor vs. panic seller                        */
/* ------------------------------------------------------------------ */

const DIP_DEFAULTS = { stocks: 100, dip: 30, start: 10000, monthly: 500 };
type DipState = typeof DIP_DEFAULTS;
const DIP_PRESETS: Preset<DipState>[] = [
  { label: 'Mild drop: −20%', values: { dip: 20 } },
  { label: 'Large drop: −35%', values: { dip: 35 } },
  { label: 'Severe drop: −50%', hint: 'About as deep as the 2000–02 decline', values: { dip: 50 } },
];
const DIP_GUIDE: SimGuide<DipState> = {
  how: ['Choose how far the market falls.', 'Set your starting balance and monthly purchase.', 'Compare the steady investor with the investor who sells at the bottom.'],
  tryThis: [
    { label: 'Pick the severe drop. Who ends with more?', done: (s) => s.dip >= 50 },
    { label: 'Set monthly purchases to $0. Does the steady investor still recover?', done: (s) => s.monthly === 0 },
    { label: 'Hold only 60% stocks. How much smaller is the fall?', done: (s) => s.stocks <= 60 },
  ],
};
const DIP_MONTHS = 36;

function MarketDropSim() {
  const sim = useSim(DIP_DEFAULTS);
  const s = sim.state;
  const bonds = 100 - s.stocks;
  const dip = useMemo(() => simulateDip({ stocks: s.stocks, bonds, cash: 0, dipPct: s.dip, start: s.start, monthly: s.monthly, months: DIP_MONTHS }), [s, bonds]);
  const last = dip.points[dip.points.length - 1];
  const extraShares = (dip.sharesAtBottom / dip.sharesAtStart - 1) * 100;
  const fasterBy = dip.priceRecoveryMonth !== null && dip.steadyRecoveryMonth !== null ? dip.priceRecoveryMonth - dip.steadyRecoveryMonth : null;
  const wentUnder = dip.points.some((p) => p.steady < p.invested - 1);
  return (
    <SimCard title="Market Drop Simulator" kind="Mini sandbox" icon={TrendingUp} sim={sim} presets={DIP_PRESETS} guide={DIP_GUIDE}
      subtitle="Stocks fall for 6 months, stay low for 3, then recover. Compare an investor who keeps buying with one who sells at the bottom.">
      <SimGrid controls={
        <ControlGroup title="The scenario">
          <SliderField label="Stock market drop" value={s.dip} onChange={sim.set('dip')} min={10} max={50} step={5} format={(v) => '−' + v + '%'} help="A drop of 20% or more is called a bear market." />
          <SliderField label="Share of portfolio in stocks" value={s.stocks} onChange={sim.set('stocks')} min={30} max={100} step={10} format={(v) => v + '%'} help="The rest is in bonds." />
          <SliderField label="Starting balance" value={s.start} onChange={sim.set('start')} min={0} max={100000} step={1000} format={(v) => usd(v)} />
          <SliderField label="Invested every month" value={s.monthly} onChange={sim.set('monthly')} min={0} max={2000} step={50} format={(v) => usd(v)} />
        </ControlGroup>
      }>
        <StatGrid cols={4}>
          <StatTile label="Your portfolio falls" value={pct(dip.bottomPrice - 100, 1)} sub={'stocks −' + s.dip + '% with ' + s.stocks + '% in stocks'} />
          <StatTile label="Shares per dollar at the bottom" value={'+' + pct(extraShares, 0)} sub={num(dip.sharesAtStart, 2) + ' → ' + num(dip.sharesAtBottom, 2) + ' shares per month'} emphasis />
          <StatTile label="Back above what you invested" value={dip.steadyRecoveryMonth !== null ? 'Month ' + dip.steadyRecoveryMonth : wentUnder ? 'Not yet' : 'Never fell below'} sub={dip.priceRecoveryMonth !== null ? 'price back at old high: month ' + dip.priceRecoveryMonth : 'price still recovering'} />
          <StatTile label="Steady vs. panic seller" value={usd(last.steady - last.panic, { sign: true })} sub={'after ' + DIP_MONTHS + ' months'} />
        </StatGrid>

        <ChartFrame title="Share price of your portfolio" subtitle={'Indexed to 100 at the start. ' + s.stocks + '% stocks, ' + bonds + '% bonds.'} height={210}
          table={{ columns: ['Month', 'Price', 'Shares bought'], rows: dip.points.filter((p) => p.month % 3 === 0).map((p) => [p.month, num(p.price, 1), num(p.sharesBought, 2)]) }}>
          <LineChart data={dip.points} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="month" type="number" domain={[0, DIP_MONTHS]} ticks={[0, 6, 12, 18, 24, 30, 36]} tickFormatter={(v) => 'Mo ' + v} {...xAxisProps} />
            <YAxis domain={['auto', 'auto']} tickFormatter={(v) => num(v, 0)} {...yAxisProps} width={40} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Month ' + l} valueFormat={(v) => usd(v, { cents: true })} extra={(l) => { const p = dip.points[Number(l)]; return p && p.sharesBought > 0 ? <>{usd(s.monthly)} bought <strong className="text-ink">{num(p.sharesBought, 2)} shares</strong></> : null; }} />} />
            <ReferenceLine y={100} stroke="var(--axis)" label={{ value: 'Starting price', position: 'insideTopRight', fill: 'var(--axis-text)', fontSize: 11 }} />
            <Line type="monotone" dataKey="price" name="Share price" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <ReferenceDot x={dip.bottomMonth} y={dip.bottomPrice} r={5} fill="var(--s1)" stroke="var(--surface)" strokeWidth={2} label={{ value: 'Lowest price: more shares per dollar', position: 'bottom', fill: 'var(--ink-2)', fontSize: 11 }} />
          </LineChart>
        </ChartFrame>

        <ChartFrame title="Value of your portfolio" subtitle="The steady investor keeps buying. The panic seller sells at the lowest price and buys back after the recovery." height={260}
          legend={[{ label: 'Steady investor', color: 'var(--s1)' }, { label: 'Panic seller', color: 'var(--s2)' }, { label: 'Total invested', color: 'var(--s-neutral-2)', dashed: true }]}
          table={{ columns: ['Month', 'Invested', 'Steady', 'Panic seller'], rows: dip.points.filter((p) => p.month % 3 === 0).map((p) => [p.month, usd(p.invested), usd(p.steady), usd(p.panic)]) }}>
          <LineChart data={dip.points} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="month" type="number" domain={[0, DIP_MONTHS]} ticks={[0, 6, 12, 18, 24, 30, 36]} tickFormatter={(v) => 'Mo ' + v} {...xAxisProps} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Month ' + l} valueFormat={(v) => usd(v)} order={['Steady investor', 'Panic seller', 'Total invested']} />} />
            <Line type="monotone" dataKey="invested" name="Total invested" stroke="var(--s-neutral-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="panic" name="Panic seller" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="steady" name="Steady investor" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
          </LineChart>
        </ChartFrame>

        <Nudge tone="good" title="Why steady investors recover before the market does">
          At the lowest price, each {usd(s.monthly)} bought <strong>{pct(extraShares, 0)} more shares</strong>. Your average cost per share (<strong>{usd(dip.avgCost, { cents: true })}</strong>) ends up below the average price ({usd(dip.avgPrice, { cents: true })}).
          {fasterBy !== null && fasterBy > 0 && <> You were back above what you put in by month {dip.steadyRecoveryMonth}, <strong>{fasterBy} months before</strong> the price returned to its old high.</>}
          {' '}The panic seller ends {usd(Math.abs(last.steady - last.panic))} {last.steady >= last.panic ? 'behind' : 'ahead'}. Selling turned a temporary drop into a <Term id="permanent-loss">permanent loss</Term>.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */
/* 95 / 5 check                                                         */
/* ------------------------------------------------------------------ */

const SPEC_DEFAULTS = { portfolio: 10000, specPct: 5 };
type SpecState = typeof SPEC_DEFAULTS;
const SPEC_PRESETS: Preset<SpecState>[] = [
  { label: '$10,000 at the 5% cap', values: { portfolio: 10000, specPct: 5 } },
  { label: '$50,000 at the 5% cap', values: { portfolio: 50000, specPct: 5 } },
  { label: '$10,000 with 25% speculative', values: { portfolio: 10000, specPct: 25 } },
];
const SPEC_GUIDE: SimGuide<SpecState> = {
  how: ['Set the size of your portfolio.', 'Set how much of it is crypto or individual stocks.', 'Read the most you could lose and whether you are within the 5% cap.'],
  tryThis: [
    { label: 'Raise the speculative share to 25%. What is the worst case?', done: (s) => s.specPct >= 25 },
    { label: 'Set the portfolio to $50,000. What is 5% in dollars?', done: (s) => s.portfolio >= 50000 },
  ],
};

function SpeculationCheck() {
  const sim = useSim(SPEC_DEFAULTS);
  const s = sim.state;
  const spec = (s.portfolio * s.specPct) / 100;
  const broad = s.portfolio - spec;
  const cap = s.portfolio * 0.05;
  const segs: Segment[] = [
    { key: 'broad', label: 'Broad index funds', value: broad, color: 'var(--s1)' },
    { key: 'spec', label: 'Speculation', value: spec, color: 'var(--s2)' },
  ];
  return (
    <SimCard title="The 95/5 Check" kind="Mini sandbox" icon={Scale} sim={sim} presets={SPEC_PRESETS} guide={SPEC_GUIDE}
      subtitle="See how much of your portfolio sits in speculation and what a total loss would cost.">
      <SimGrid controls={
        <ControlGroup title="Your portfolio">
          <SliderField label="Portfolio size" value={s.portfolio} onChange={sim.set('portfolio')} min={1000} max={200000} step={1000} format={(v) => usd(v)} />
          <SliderField label="Share in crypto or single stocks" value={s.specPct} onChange={sim.set('specPct')} min={0} max={50} step={1} format={(v) => v + '%'} />
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="Broad index funds" value={usd(broad)} sub={(100 - s.specPct) + '% of the portfolio'} />
          <StatTile label="Speculation" value={usd(spec)} sub={'5% cap: ' + usd(cap)} />
          <StatTile label="Loss if it goes to zero" value={usd(spec)} sub={s.specPct + '% of your portfolio'} emphasis />
        </StatGrid>
        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Your {usd(s.portfolio)} portfolio</p>
          <SegmentBar segments={segs} total={s.portfolio} height={32} format={usd} ariaLabel={'Portfolio: ' + usd(broad) + ' in broad index funds, ' + usd(spec) + ' in speculation'} />
          <SegmentLegend segments={segs} total={s.portfolio} format={usd} />
        </div>
        {s.specPct <= 5 ? (
          <Nudge tone="good" title="Within the 5% cap">
            At most {usd(spec)} is at risk of a total loss. The other {usd(broad)} stays in broad index funds.
          </Nudge>
        ) : (
          <Nudge tone="warning" title={'Above the 5% cap by ' + usd(spec - cap)}>
            Moving {usd(spec - cap)} back into a broad index fund brings you to {usd(cap)}, or 5%. A total loss would then cost {usd(cap)} instead of {usd(spec)}.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}


/* ------------------------------------------------------------------ */
/* Fee drag calculator                                                  */
/* ------------------------------------------------------------------ */

const FEE_DEFAULTS = { monthly: 300, years: 25, gross: 7, feeLow: 0.03, feeHigh: 1.0 };
type FeeState = typeof FEE_DEFAULTS;
const FEE_PRESETS: Preset<FeeState>[] = [
  { label: '$500/mo for 30 Years', values: { monthly: 500, years: 30 } },
  { label: '0.03% vs. 1.25% Fee', values: { feeHigh: 1.25 } },
  { label: 'Late Start: 15 Years', hint: '$800/month but only 15 years', values: { monthly: 800, years: 15 } },
];

function FeeDrag() {
  const sim = useSim(FEE_DEFAULTS);
  const s = sim.state;
  const data = useMemo(() => simulateFees(s), [s]);
  const last = data[data.length - 1];
  const lost = last.low - last.high;
  const gains = last.low - last.contributed;
  const lostShare = gains > 0 ? (lost / gains) * 100 : 0;
  const lastYearFee = last.high * (s.feeHigh / 100);
  const segs = [
    { key: 'c', label: 'Your contributions', value: last.contributed, color: 'var(--s-neutral)', ink: 'var(--ink)' },
    { key: 'kept', label: 'Growth you keep', value: Math.max(0, last.high - last.contributed), color: 'var(--s1)' },
    { key: 'lost', label: 'Lost to the higher fee', value: Math.max(0, lost), color: 'var(--s2)' },
  ];

  return (
    <SimCard title="Fee Drag Calculator" sim={sim} presets={FEE_PRESETS}
      subtitle="See how much a small yearly fee really costs you over time."
      guide={{
        how: ['Set what you invest each month.', "Set each fund's yearly fee.", 'Compare the two lines and the gap.'],
        tryThis: [
          { label: 'Cut the active fund fee to 0.50% or less', done: (st) => st.feeHigh <= 0.501 },
          { label: 'Stretch the time to 40 years. Watch the gap grow.', done: (st) => st.years >= 40 },
          { label: 'Double the monthly amount. Does the share of gains lost change?', done: (st) => st.monthly >= 600 },
        ],
      }}>
      <SimGrid controls={
        <>
          <ControlGroup title="Your investing">
            <SliderField label="Monthly contribution" value={s.monthly} onChange={sim.set('monthly')} min={50} max={2000} step={25} format={(v) => usd(v)} />
            <SliderField label="Years invested" value={s.years} onChange={sim.set('years')} min={5} max={45} step={1} format={(v) => v + ' yrs'} />
            <SliderField label="Expected return (before fees)" value={s.gross} onChange={sim.set('gross')} min={2} max={12} step={0.5} format={(v) => pct(v, 1)} />
          </ControlGroup>
          <ControlGroup title={<>The fees (<Term id="expense-ratio">expense ratios</Term>)</>}>
            <SliderField label={<span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: 'var(--s1)' }} />Index fund fee</span>} value={s.feeLow} onChange={sim.set('feeLow')} min={0} max={0.5} step={0.01} format={(v) => pct(v, 2)} />
            <SliderField label={<span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: 'var(--s2)' }} />Active fund fee</span>} value={s.feeHigh} onChange={sim.set('feeHigh')} min={0.25} max={2.5} step={0.05} format={(v) => pct(v, 2)} />
          </ControlGroup>
        </>
      }>
        <StatGrid cols={4}>
          <StatTile label={`Low-fee fund (${pct(s.feeLow, 2)})`} value={usd(last.low)} sub={`after ${s.years} years`} />
          <StatTile label={`High-fee fund (${pct(s.feeHigh, 2)})`} value={usd(last.high)} sub={`same ${usd(last.contributed)} invested`} />
          <StatTile label="Lost to the higher fee" value={usd(lost)} sub={`${pct((lost / last.low) * 100, 0)} of the final balance`} emphasis />
          <StatTile label="Share of growth lost" value={pct(lostShare, 0)} sub="of what you could have earned" />
        </StatGrid>

        <ChartFrame title="Balance over time" subtitle={`${usd(s.monthly)}/month at ${pct(s.gross, 1)} before fees`} height={280}
          legend={[{ label: `Low-fee fund (${pct(s.feeLow, 2)})`, color: 'var(--s1)' }, { label: `High-fee fund (${pct(s.feeHigh, 2)})`, color: 'var(--s2)' }, { label: 'Total contributed', color: 'var(--s-neutral-2)', dashed: true }]}
          table={{ columns: ['Year', 'Contributed', 'Low-fee', 'High-fee', 'Gap'], rows: data.filter((d) => d.year % 5 === 0 || d.year === s.years).map((d) => [d.year, usd(d.contributed), usd(d.low), usd(d.high), usd(d.low - d.high)]) }}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="year" type="number" domain={[0, s.years]} tickFormatter={(v) => `Yr ${v}`} {...xAxisProps} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => `Year ${l}`} valueFormat={(v) => usd(v)} extra={(l) => { const d = data[Number(l)]; return d ? <>Gap so far: <strong className="text-ink">{usd(d.low - d.high)}</strong></> : null; }} />} />
            <Line type="monotone" dataKey="contributed" name="Contributed" stroke="var(--s-neutral-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="low" name="Low-fee fund" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="high" name="High-fee fund" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
          </LineChart>
        </ChartFrame>

        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Breaking down the low-fee fund's {usd(last.low)}</p>
          <SegmentBar segments={segs} total={last.low} format={usd} ariaLabel="Contributions, growth kept, and growth lost to fees" />
          <SegmentLegend segments={segs} total={last.low} format={usd} />
        </div>

        <Nudge tone={lostShare >= 20 ? 'warning' : 'info'} title={`"Only ${pct(s.feeHigh, 2)}" isn't small`}>
          The fee comes out of your <em>whole balance</em> every year, not just your gains. In the last year alone, it costs about <strong>{usd(lastYearFee)}</strong>.
          Over {s.years} years, that adds up to <strong>{usd(lost)}</strong>, or {pct(lostShare, 0)} of the growth you could have kept.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* Decision check and cheat sheet                                      */
/* ================================================================== */

const questions: QuizQuestion[] = [
  {
    id: 'time-horizon',
    scenario: <>You have <strong>$12,000</strong> in an <Term id="emergency-fund">emergency fund</Term> and another <strong>$8,000</strong> you will not need for at least 20 years. Both sit in a savings account. Inflation averages 3% a year.</>,
    prompt: 'What is the best change?',
    options: [
      { text: 'Leave both in savings, because savings cannot lose value.', why: <>The dollar balance is safe, but <Term id="purchasing-power">buying power</Term> is not. At 3% inflation, the $8,000 buys what about <strong>$4,430</strong> buys today after 20 years.</> },
      { text: 'Keep the $12,000 in savings and invest the $8,000 in a broad index fund.', correct: true, why: <>Emergency money must be there at full value on any day. The $8,000 has 20 years to recover from any decline. At an illustrative 7% a year it could grow to about <strong>$30,960</strong>.</> },
      { text: 'Move both amounts into an index fund.', why: <>The emergency fund is the problem. In early 2020 the S&P 500 fell about 34%. A $12,000 emergency fund would have dropped to about <strong>$7,920</strong> when job losses were most common.</> },
      { text: 'Invest the $12,000 and keep the $8,000 in savings, since $8,000 is the smaller amount.', why: <>This reverses the logic. Money you may need soon belongs in savings. Money you will not touch for 20 years is the money that benefits from growth.</> },
    ],
  },
  {
    id: 'start-early',
    scenario: <>Priya starts investing at 25 and deposits <strong>$200 a month</strong> until 65. Marcus waits until 35, then deposits <strong>$400 a month</strong> until 65. Both earn 7% a year.</>,
    prompt: 'Who has more at 65?',
    options: [
      { text: 'Marcus, because he deposits twice as much each month.', why: <>He deposits more in total ($144,000 against $96,000) and still finishes behind. Marcus ends with about <strong>$467,800</strong>, which is about $26,500 less than Priya.</> },
      { text: 'Priya, even though she deposits half as much each month.', correct: true, why: <>Priya ends with about <strong>$494,300</strong> from $96,000 deposited. Her first deposits had 40 years to grow, while Marcus's had 30. See <Term id="compound-interest">compound interest</Term>.</> },
      { text: 'They end up with about the same amount.', why: <>The result is close but not equal. Priya finishes about <strong>$26,500</strong> ahead, with $48,000 less deposited. Marcus would need about $425 a month to match her.</> },
    ],
  },
  {
    id: 'market-drop',
    scenario: <>You hold <strong>$40,000</strong> in a low-cost S&P 500 index fund and add <strong>$500 a month</strong>. The market falls 25% and your balance drops to <strong>$30,000</strong>. News headlines are alarming.</>,
    prompt: 'What do you do?',
    options: [
      { text: 'Sell everything to stop the losses.', why: <>Selling turns a $10,000 paper loss into a real one. The last 25% decline, in 2022, was regained in January 2024. <Term id="panic-selling">Panic selling</Term> would have missed that recovery.</> },
      { text: 'Keep the investments and keep buying $500 a month.', correct: true, why: <>At prices 25% lower, each $500 buys about <strong>33% more shares</strong> (1 ÷ 0.75). Those extra shares gain the most when prices recover. You also avoid the cost of guessing when to get back in.</> },
      { text: 'Keep the investments but pause the $500 until the market recovers.', why: <>You would skip purchases at the lowest prices. Twelve months of $500 is $6,000, and at 25% lower prices it buys about a third more shares than it would have before the drop.</> },
      { text: 'Move the $30,000 into one stock that has been rising.', why: <>That replaces 500 companies with one. A single stock can lose most of its value permanently. Keep individual stocks to 5% or less, which is <strong>$1,500</strong> of a $30,000 portfolio.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Hourglass, title: 'Match money to the date you need it.', body: <>Money needed within about <strong>5 years</strong> stays in savings. Money <strong>5 or more years away</strong> goes into investments.</> },
  { icon: Layers, title: 'Buy broad, low-cost index funds.', body: <>Choose funds with an <Term id="expense-ratio">expense ratio</Term> of <strong>0.03%–0.10%</strong>, not 1% or more. Keep at least <strong>95%</strong> in broad funds and cap crypto or single stocks at <strong>5%</strong>.</> },
  { icon: TrendingUp, title: 'Start early and keep buying when prices drop.', body: <>Set up automatic monthly purchases. Never sell in a panic. Lower prices mean each dollar buys more shares.</> },
];

/* ================================================================== */

export default function InvestingChapter() {
  return (
    <ChapterLayout
      id="investing"
      questions={questions}
      rules={rules}
      sections={{
        '5-1': (
          <>
            <P>Prices rise over time. This is <Term id="inflation">inflation</Term>. Cash holds its dollar amount, but each dollar buys a little less every year.</P>
            <Bullets items={[
              <><strong className="text-ink">Cash keeps its face value but loses buying power.</strong> If prices rise 3% a year, $10,000 buys about 26% less after 10 years.</>,
              <><strong className="text-ink">Savings protects you today.</strong> It covers emergencies and bills due soon, and its value does not fall when the stock market falls.</>,
              <><strong className="text-ink">Investing grows your money for tomorrow.</strong> Over long periods, stocks have historically grown faster than prices have risen.</>,
            ]} />
            <BuyingPowerChart />
            <Example title="Groceries in 10 years">
              <p>A $100 grocery bill today costs about <strong>$134</strong> in 10 years at 3% inflation (1.03 to the 10th power is about 1.34).</p>
              <p>If your $100 stays in cash, it covers only about three quarters of the same groceries. To buy the same groceries, your money has to grow by at least the rate of inflation.</p>
            </Example>
            <H3>Which money goes where</H3>
            <P>The deciding factor is time. Ask when you will spend each dollar.</P>
            <HorizonDiagram />
            <InflationVisualizer />
            <Mistakes items={[
              <>Keeping money you will not need for 20 years in cash because it feels safe.</>,
              <>Investing your emergency fund or money due within 5 years. A market decline can arrive just before the bill does.</>,
              <>Treating a savings account that pays less than inflation as growth.</>,
            ]} />
          </>
        ),
        '5-2': (
          <>
            <P><Term id="compound-interest">Compounding</Term> means your money makes money, and then that new money makes more money.</P>
            <Example title="$1,000 growing at 7% a year">
              <Bullets items={[
                <>Year 1: earn $70. Balance <strong>$1,070</strong>.</>,
                <>Year 2: earn $74.90, because you now earn on $1,070. Balance <strong>$1,144.90</strong>.</>,
                <>Year 3: earn $80.14. Balance <strong>$1,225.04</strong>.</>,
                <>Year 10: <strong>$1,967</strong>. Year 30: <strong>$7,612</strong>. Year 40: <strong>$14,974</strong>.</>,
              ]} />
              <p>The yearly earnings grow because each year's earnings join the balance that earns the next year.</p>
            </Example>
            <SimpleVsCompound />
            <H3>Time matters more than the amount</H3>
            <Bullets items={[
              <><strong className="text-ink">Starting early matters more than choosing the best investment.</strong> It gives each deposit more years to grow.</>,
              <><strong className="text-ink">Starting small in your 20s or 30s beats investing a lot in your 50s.</strong> The first dollars you invest have the most time to grow.</>,
            ]} />
            <ThreeStartersChart />
            <ContributionsVsGrowth />
            <SmallEarlyBigLate />
            <CostOfWaiting />
            <Steps items={[
              { title: 'Start with an amount you will not miss.', body: 'Even $50 a month counts. Starting matters more than the starting amount.' },
              { title: 'Automate it.', body: 'Schedule a transfer for payday so the deposit happens without a decision.' },
              { title: 'Raise it over time.', body: 'Increase the amount whenever your pay rises, or by 1% of pay each year.' },
            ]} />
            <Mistakes items={[
              <>Waiting until you can invest "enough." $200 a month at 25 produces more than $800 a month at 50.</>,
              <>Stopping deposits during a market decline. Deposits made at lower prices buy more shares.</>,
              <>Withdrawing early. Money taken out stops growing and takes its future growth with it.</>,
            ]} />
            <UnderTheHood>
              <p>The value of equal monthly deposits is:</p>
              <Formula note="d = monthly deposit, r = monthly growth rate, n = number of months">Value = d × ((1 + r)^n − 1) ÷ r</Formula>
              <p>The <Term id="rule-of-72">Rule of 72</Term> estimates doubling time: 72 ÷ yearly growth rate. At 7%, money doubles about every {num(ruleOf72(7), 1)} years (exactly {num(exactDoubling(7), 1)}).</p>
            </UnderTheHood>
          </>
        ),
        '5-3': (
          <>
            <P>You do not need to find winning companies. Owning many companies at once is simpler and has worked better for most people.</P>
            <Bullets items={[
              <><strong className="text-ink">Picking individual stocks is risky and hard</strong>, even for professionals on Wall Street. S&P's SPIVA reports have found that most actively managed U.S. large-company funds trailed the <Term id="sp-500">S&P 500</Term> over 15-year periods.</>,
              <><strong className="text-ink">An <Term id="index-fund">index fund</Term> buys a tiny slice of hundreds of the largest, strongest companies at once.</strong> An S&P 500 fund holds about 500 large U.S. companies. A <Term id="total-market-fund">total stock market fund</Term> holds several thousand.</>,
              <><strong className="text-ink">If one company fails, the others still hold their value.</strong> You lose a small share of the fund, not your whole investment (<Term id="diversification">diversification</Term>).</>,
              <><strong className="text-ink">Over long periods, the overall market has grown.</strong> The S&P 500 has historically averaged roughly 10% a year before inflation, with large declines along the way (see 5.4).</>,
            ]} />
            <IndexGridDiagram />
            <OneFailureChart />
            <Compare
              left={{ title: 'S&P 500 index fund', body: <>Holds about 500 of the largest U.S. companies, weighted by size. Simple and widely available.</> }}
              right={{ title: 'Total stock market index fund', body: <>Holds several thousand U.S. companies, large and small. A wider version of the same idea.</> }}
            />
            <P>Either one is a sound core holding. The two overlap heavily, so you do not need both.</P>
            <MythBuster myth="To build wealth, you have to find the next winning stock.">
              <p>Over 15-year periods, most professionally managed large-company funds trailed the S&P 500. An index fund matches the market instead of trying to beat it, and charges far lower fees.</p>
            </MythBuster>
            <OneStockVsMarket />
            <GoDeeper title="How an index fund works">
              <Bullets items={[
                <>An <strong>index</strong> is a list of companies, such as the 500 in the S&P 500.</>,
                <>The fund buys every company on the list, in proportion to its size. No one chooses which to buy.</>,
                <>When the list changes, the fund changes with it.</>,
                <>Because no one is picking stocks, the fund can charge very low fees. 5.4 shows why that matters.</>,
              ]} />
            </GoDeeper>
            <Mistakes items={[
              <>Choosing a fund because it had the best return last year.</>,
              <>Owning many funds that hold the same companies and calling it diversification.</>,
              <>Putting most of your money into your employer's stock or one favorite company.</>,
            ]} />
          </>
        ),
        '5-4': (
          <>
            <H3>Fees: keep them tiny</H3>
            <P>Every fund charges a yearly fee called the <Term id="expense-ratio">expense ratio</Term>. It is a percentage of your balance, taken from the fund automatically.</P>
            <Bullets items={[
              <>Stick to low-cost index funds with fees of <strong>0.03% to 0.10%</strong>.</>,
              <>Avoid funds that charge <strong>1% or more</strong>.</>,
              <>Find the expense ratio on the fund's page at your brokerage. It is listed near the top.</>,
            ]} />
            <FeeCostChart />
            <Example title="$300 a month for 25 years at 7% before fees">
              <p>In a 0.03% fund you end with about <strong>{usd(FEE_EXAMPLE.low)}</strong>. In a 1% fund you end with about <strong>{usd(FEE_EXAMPLE.high)}</strong>.</p>
              <p>The difference is <strong>{usd(FEE_EXAMPLE.gap)}</strong>, on the same deposits and the same market. See <Term id="fee-drag">fee drag</Term>.</p>
            </Example>
            <FeeDrag />
            <H3>Market drops are normal</H3>
            <P>The stock market falls sharply from time to time. A drop of 20% or more is a <Term id="bear-market">bear market</Term>. These declines are a normal part of investing, and so far every one has been followed by a recovery.</P>
            <DropsChart />
            <Bullets items={[
              <><strong className="text-ink">Lower prices mean each dollar buys more shares.</strong> The same $500 buys more of the fund after a decline than before it.</>,
              <><strong className="text-ink">Never panic-sell when prices drop.</strong> Selling makes the loss permanent and usually misses the recovery.</>,
              <><strong className="text-ink">Keep buying steadily.</strong> Automatic monthly purchases (<Term id="dca">dollar-cost averaging</Term>) buy more shares when prices are low without any prediction.</>,
            ]} />
            <DcaStatement />
            <MarketDropSim />
            <Mistakes items={[
              <>Selling after a decline and waiting for the news to improve before buying again.</>,
              <>Pausing your monthly purchases because the market is down.</>,
              <>Checking your balance every day. Daily changes are noise for money you will not use for 5 or more years.</>,
              <>Holding money you need within 5 years in stocks. That money belongs in savings (5.1).</>,
            ]} />
            <H3>Investing versus gambling</H3>
            <P>Investing means owning a broad share of the economy for many years. Gambling means betting on one outcome, such as a single coin or company. Use a simple limit.</P>
            <Bullets items={[
              <><strong className="text-ink">Keep at least 95% of your investments in boring, broad index funds.</strong></>,
              <><strong className="text-ink">If you want to experiment with crypto or individual stocks, cap it at 5% or less.</strong> This is <Term id="speculation">speculation</Term>.</>,
              <>Only use money you could lose entirely without changing your plans.</>,
            ]} />
            <SpeculationSplit />
            <SpeculationLossChart />
            <SpeculationCheck />
          </>
        ),
      }}
    />
  );
}
