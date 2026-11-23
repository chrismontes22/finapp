import { useMemo } from 'react';
import { Hourglass, Calculator, CalendarClock, Snowflake, Sprout } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot } from 'recharts';
import { ModuleLayout } from '../components/ModuleLayout';
import { Term } from '../components/Glossary';
import { Analogy, Bullets, Compare, Example, Formula, GoDeeper, Lead, Mistakes, P, H3, UnderTheHood } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend } from '../components/SegmentBar';
import { ChartFrame, TooltipBox, activeDot, cursorProps, gridProps, xAxisProps, yAxisProps } from '../components/Chart';
import { SegmentedControl, Switch } from '../components/ui';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { usd, pct, num } from '../lib/format';
import { exactDoubling, ruleOf72, simpleVsCompound, simulateWaiting, type Frequency } from '../lib/growth';

/* ------------------------------------------------------------------ */
/* Simple vs compound                                                   */
/* ------------------------------------------------------------------ */

const SC_DEFAULTS = { principal: 10000, rate: 7, years: 30, freq: 'annually' as Frequency };
type ScState = typeof SC_DEFAULTS;
const SC_PRESETS: Preset<ScState>[] = [
  { label: 'Card debt: 24% for 10 yrs', hint: 'Compounding works against you on debt', values: { principal: 5000, rate: 24, years: 10, freq: 'monthly' } },
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
            <Line type="monotone" dataKey="simple" name="Simple" stroke="var(--s2)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="compound" name="Compound" stroke="var(--s1)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
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
/* Cost of waiting                                                      */
/* ------------------------------------------------------------------ */

const DEFAULTS = { monthly: 200, returnPct: 7, switchAge: 32, doublings: false };
type State = typeof DEFAULTS;
const PRESETS: Preset<State>[] = [
  { label: 'Early Starter vs. Late Catch-Up', hint: '$300/month at 7%: 10 years vs. 33 years', values: { monthly: 300, returnPct: 7, switchAge: 32 } },
  { label: 'Rule of 72 Explorer', hint: '9% return → doubles every ~8 years', values: { monthly: 300, returnPct: 9, switchAge: 32, doublings: true } },
  { label: 'Slow & Steady (4%)', hint: 'Low returns: does starting early still win?', values: { monthly: 300, returnPct: 4, switchAge: 32 } },
];

function CostOfWaiting() {
  const sim = useSim(DEFAULTS);
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
    <SimCard title="Cost of Waiting Simulator" sim={sim} presets={PRESETS}
      subtitle={<>See who has more at 65: Person A (invests <strong>22 to {s.switchAge}</strong>) or Person B (<strong>{s.switchAge} to 65</strong>).</>}
      guide={{
        how: ['Pick a monthly amount and a return.', 'Set the age when A stops and B starts.', 'Compare their totals at 65.'],
        tryThis: [
          { label: 'Slide the switch age to 40. Who wins now?', done: (st) => st.switchAge >= 40 },
          { label: 'Drop the return to 4%. Can Person B catch up?', done: (st) => st.returnPct <= 4 },
          { label: 'Turn on doubling markers to see the Rule of 72.', done: (st) => st.doublings },
        ],
      }}>
      <SimGrid controls={
        <>
          <ControlGroup title="The race">
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
            <Line type="monotone" dataKey="a" name="Person A" stroke="var(--s1)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="b" name="Person B" stroke="var(--s2)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
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
          <Nudge tone="good" title="Time beat effort">
            Person A put in <strong>{usd(last.aContrib)}</strong>, about {Math.round((last.aContrib / last.bContrib) * 100)}% of Person B's {usd(last.bContrib)}, and still came out ahead. A's early deposits had {65 - s.switchAge}+ extra years to snowball.
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

export const questions: QuizQuestion[] = [
  {
    id: 'rule72',
    scenario: <>You invest <strong>$10,000</strong> for a goal <strong>24 years</strong> away. Fund A should earn about <strong>6%</strong> a year. Fund B should earn about <strong>9%</strong>. Use the <Term id="rule-of-72">Rule of 72</Term>, no calculator.</>,
    prompt: 'Roughly what does each become?',
    options: [
      { text: 'A ≈ $40,000; B ≈ $80,000', correct: true, why: <>72 ÷ 6 = 12 years per double, so <strong>2 doublings</strong> ($10k → $20k → $40k). 72 ÷ 9 = 8 years, so <strong>3 doublings</strong> ($10k → $20k → $40k → $80k). Just 3 more percentage points <em>doubled</em> the result.</> },
      { text: 'A ≈ $40,000; B ≈ $60,000', why: <>That assumes 50% more return means 50% more money. But 9% doubles every 8 years instead of 12, so B gets a whole extra doubling. That ends around <strong>$80,000</strong>.</> },
      { text: 'A ≈ $24,400; B ≈ $31,600', why: <>That's <Term id="simple-interest">simple interest</Term>: $10,000 + $600 × 24 years. With compounding, interest earns interest too. A reaches about <strong>$40,500</strong> and B about <strong>$79,100</strong>.</> },
    ],
  },
  {
    id: 'early-vs-long',
    scenario: <>Person A invests <strong>$300/month from 22 to 32</strong> (10 years, $36,000 total), then stops. Person B invests <strong>$300/month from 32 to 65</strong> (33 years, $118,800 total). Both earn 7% a year.</>,
    prompt: 'Who has more at 65?',
    options: [
      { text: 'Person A, despite putting in less than a third as much.', correct: true, why: <>A ends with about <strong>$478,500</strong>, B with about <strong>$441,700</strong>. A's $36,000 had 33–43 years to grow, enough for 3 to 4 doublings at 7%. Starting 10 years earlier beat investing 3× longer.</> },
      { text: 'Person B, who put in $82,800 more.', why: <>Putting in more helps, but B's money had less time to grow. At 7%, A wins by about <strong>$37,000</strong>. (At lower returns, like 4%, B would win. Try the "Slow & Steady" preset.)</> },
      { text: "They're about even, since the effects cancel out.", why: <>They don't cancel out. At 7%, each dollar A invests at 22 grows about <strong>18×</strong> by 65, but each dollar B invests at 32 grows only about <strong>9×</strong>. That 2× head start is why A's 10 years beat B's 33.</> },
    ],
  },
  {
    id: 'timing',
    scenario: <>You have <strong>$6,000</strong> to invest for retirement, 30 years away. The market just hit an all-time high, and headlines say a crash is "overdue."</>,
    prompt: 'What does the evidence say to do?',
    options: [
      { text: 'Invest now, as planned (or spread it over a few months if that helps you sleep).', correct: true, why: <><Term id="time-in-market">Time in the market</Term> beats timing. Rising markets hit new highs often, and investing at a high has historically done about as well as any other day. At 7%, $6,000 grows to about <strong>$45,700</strong> in 30 years.</> },
      { text: 'Wait for a 20% drop, then buy.', why: <>The market might rise 30% first, so even after a 20% drop you'd pay more than today. <Term id="market-timing">Market timing</Term> means being right twice: when to get out and when to get back in. Missing just the 10 best days in 20 years has historically cut returns roughly in half.</> },
      { text: 'Keep it in cash until the news calms down.', why: <>The news is never calm. Each year in cash gives up about 7% of growth, roughly <strong>$420 in year one</strong>. Over 30 years, waiting even one year costs about <strong>$3,000</strong> of the final total.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Hourglass, title: 'Start now, even if it\'s small.', body: <>At 7%, a dollar invested at 22 can grow about <strong>18×</strong> by 65. Wait until 32, and it grows about <strong>9×</strong>.</> },
  { icon: Calculator, title: 'Rule of 72: 72 ÷ return = years to double.', body: <>At 6%, money doubles every <strong>12 years</strong>. At 9%, every <strong>8</strong>. On debt, 24% doubles a balance in about <strong>3 years</strong>.</> },
  { icon: CalendarClock, title: 'Time in the market beats timing the market.', body: <>Set up automatic deposits and leave them alone. Waiting for the "right moment" usually costs more than it saves.</> },
];

export default function CompoundingModule() {
  return (
    <ModuleLayout
      id="compounding"
      hook={<>Alex invests <strong>$300 a month from 22</strong> to 32, then stops to save for a house. Their friend Jordan invests the same $300 a month from 32 to 65, more than three times as long. At 65, who has more? (Most people guess Jordan. Most people are wrong.)</>}
      concept={
        <>
          <Lead>A dollar today beats a dollar next year, because it can start growing now. That's called the <Term id="time-value-of-money">time value of money</Term>.</Lead>
          <Compare
            left={{ title: 'Simple interest', body: <><Term id="simple-interest">Simple interest</Term> pays only on your original amount. $1,000 at 5% earns the same $50 every year: <strong>$50, $50, $50…</strong></> }}
            right={{ title: 'Compound interest', body: <><Term id="compound-interest">Compound interest</Term> pays on your money <em>and</em> on past interest. $1,000 at 5% earns <strong>$50, $52.50, $55.13…</strong> and keeps growing.</> }}
          />
          <Analogy icon={Snowflake}>
            Compounding is a snowball rolling downhill. It starts tiny, but the bigger it gets, the more snow it picks up.
            Your early dollars are its core. The sooner they start rolling, the bigger it gets.
          </Analogy>
          <Example title="$1,000 at 10%, year by year">
            <p>Each year, you earn 10% on <em>whatever is there now</em>, not just on your first $1,000.</p>
            <Bullets items={[
              <>Year 1: $1,000 × 10% = <strong>$100</strong>. New total: $1,100.</>,
              <>Year 2: $1,100 × 10% = <strong>$110</strong>. New total: $1,210.</>,
              <>Year 3: $1,210 × 10% = <strong>$121</strong>. New total: $1,331.</>,
            ]} />
            <p>Simple interest pays $100 a year, so it reaches $1,300. The extra $31 is interest earning interest.</p>
            <p>That looks tiny. But after 30 years, compound interest reaches about <strong>$17,449</strong>. Simple interest reaches only $4,000 ($1,000 + $100 × 30).</p>
          </Example>
          <SimpleVsCompound />
          <GoDeeper title="Where compounding shows up in real life">
            <Bullets items={[
              <><strong>Savings accounts</strong> list an <Term id="apr-vs-apy">APY</Term>. It already includes compounding, so compare APY to APY.</>,
              <><strong>Investments</strong> have no fixed rate. They compound when you leave gains and dividends invested.</>,
              <><strong>Debt</strong> compounds against you. Unpaid card interest is added to your balance, then charged interest too.</>,
              <><strong>Prices</strong> compound as well. A few percent of inflation a year adds up over decades.</>,
            ]} />
            <p>How <em>often</em> interest compounds matters only a little. $10,000 at 5% earns $500 in a year when it compounds yearly. Compounded daily, it earns about $512.67. That's only about $13 more.</p>
          </GoDeeper>

          <H3>The Rule of 72: quick math in your head</H3>
          <P>Divide 72 by your yearly return. The answer is about how many years your money takes to double.</P>
          <P>At 8%, that's 72 ÷ 8 = <strong className="text-ink">9 years</strong>. At 4%, it's 18 years.</P>
          <P>It works on debt too. A 24% card can double an unpaid balance in about 3 years.</P>
          <Example title="One $5,000 deposit, four doublings">
            <p>Say you invest $5,000 at age 25. It earns 8% a year, and you never add more.</p>
            <Bullets items={[
              <>Doubling time: 72 ÷ 8 = <strong>9 years</strong>.</>,
              <>Age 34: $10,000. Age 43: $20,000. Age 52: $40,000.</>,
              <>Age 61: <strong>$80,000</strong>. That's 4 doublings in 36 years (4 × 9 = 36).</>,
            ]} />
            <p>The exact math gives about $79,800, so the shortcut is very close. Real returns bounce around, so treat it as a rough guide.</p>
          </Example>
          <GoDeeper title="More ways to use the Rule of 72">
            <Bullets items={[
              <><strong>Run it backward.</strong> Want your money to double in 6 years? You would need about 72 ÷ 6 = 12% a year.</>,
              <><strong>Use it on prices.</strong> At 3% inflation, prices double in about 24 years (72 ÷ 3). A $100 grocery trip could cost about $200.</>,
              <><strong>Know its limits.</strong> It's a shortcut, not exact. At 8% it says 9 years, and the exact answer is 9.0. At 2% it says 36, but the exact answer is about 35.</>,
              <><strong>Returns aren't steady.</strong> Investments rise and fall from year to year. The rule uses an average, so it's a guide, not a promise.</>,
            ]} />
          </GoDeeper>

          <H3>Why starting early beats starting big</H3>
          <P>Growth builds on growth, so the <em>last</em> decade adds the most dollars. Starting early makes that last decade much bigger.</P>
          <P>That's why <Term id="time-in-market">time in the market</Term> matters more than <Term id="market-timing">timing the market</Term>. Every year on the sidelines is a year your snowball sits still.</P>
          <GoDeeper title="How to start when money is tight">
            <Bullets items={[
              <><strong>Start with any amount</strong>, even $25 or $50 a month. The habit matters more than the size.</>,
              <><strong>Automate it.</strong> Schedule the transfer for the day after payday, so you never have to decide.</>,
              <><strong>Grow it slowly.</strong> Each time you get a raise, send part of it to savings.</>,
              <><strong>Mind the order.</strong> Grab any <Term id="employer-match">employer match</Term>, and clear high-interest card debt early. Both are hard to beat.</>,
            ]} />
            <p>Small amounts add up. $50 a month from 22 to 65 is $25,800 of deposits. At a steady 7% a year, that could grow to more than $150,000.</p>
          </GoDeeper>
          <GoDeeper title="Starting later? You still have good options">
            <p>Starting at 35 or 45 is not a failure. The best day to start is still today.</p>
            <p>In the sandbox's default setup, Person B starts at 32 and puts in $79,200 ($200 × 12 × 33 years). B still ends with about <strong>$294,000</strong> at 65.</p>
            <Bullets items={[
              <>Save a bigger share of your pay to make up for fewer years.</>,
              <>Working a few extra years adds more deposits and more growth time.</>,
              <>After age 50, many retirement accounts allow extra "catch-up" contributions.</>,
            ]} />
          </GoDeeper>

          <Mistakes items={[
            <>Waiting until you "earn enough" to start. A small start now often beats a bigger start later.</>,
            <>Selling in a panic after a market drop. It turns a paper loss into a real one.</>,
            <>Forgetting that compounding works on debt too. A 24% card balance can double in about 3 years.</>,
            <>Expecting a smooth 7% every year. Real returns jump around. 7% is a long-run guess, not a promise.</>,
          ]} />

          <UnderTheHood>
            <Formula note="P = starting amount, r = annual rate, t = years.">Future value (lump sum) = P × (1 + r)ᵗ</Formula>
            <Formula note="n = how many times a year interest is added. As n → ∞, this approaches continuous compounding: P × eʳᵗ.">With compounding n times a year: P × (1 + r ÷ n)ⁿᵗ</Formula>
            <Formula note="PMT = monthly deposit, i = monthly rate, N = number of months. Assumes deposits at the end of each month.">Future value of monthly deposits = PMT × [(1 + i)ᴺ − 1] ÷ i</Formula>
            <Formula note="ln 2 ≈ 0.693, and for small r, ln(1 + r) ≈ r. We use 72 instead of 69.3 because it's close and divides evenly by 2, 3, 4, 6, 8, 9 and 12. It works best around 6–10%.">Doubling time = ln 2 ÷ ln(1 + r) ≈ 72 ÷ (r × 100)</Formula>
            <p><strong className="text-ink">Nominal vs. real returns:</strong> U.S. stocks have historically returned roughly 10% a year before inflation, about 7% after. Using 7% keeps results in today's dollars.</p>
          </UnderTheHood>
        </>
      }
      sandbox={<CostOfWaiting />}
      questions={questions}
      rules={rules}
    />
  );
}

