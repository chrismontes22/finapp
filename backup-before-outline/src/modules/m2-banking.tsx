import { useMemo } from 'react';
import { useMoney } from '../state/money';
import { myEmergencyPreset } from '../state/myPresets';
import { Landmark, Wallet, PiggyBank, ShieldCheck, Droplets, Layers, Percent, LifeBuoy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { ModuleLayout } from '../components/ModuleLayout';
import { Term } from '../components/Glossary';
import { Analogy, Bullets, ConceptCards, Example, Formula, GoDeeper, Lead, Mistakes, P, H3, UnderTheHood, Steps } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { ChartFrame, TooltipBox, activeDot, cursorProps, gridProps, xAxisProps, yAxisProps } from '../components/Chart';
import { Switch } from '../components/ui';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { usd, pct, num } from '../lib/format';
import { simulateSavings } from '../lib/growth';

/* ------------------------------------------------------------------ */
/* Emergency fund sizer                                                 */
/* ------------------------------------------------------------------ */

const EF_DEFAULTS = { needs: 2500, saved: 3000, variable: false, single: false, dependents: false };
type EfState = typeof EF_DEFAULTS;
const EF_PRESETS: Preset<EfState>[] = [
  { label: 'Fresh grad, steady job', values: { needs: 2000, saved: 1200, single: true } },
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
  const milestones = [
    { label: 'Starter', months: 1 },
    { label: 'Core', months: 3 },
    { label: 'Full target', months },
  ];
  const scaleMax = Math.max(target, s.saved) * 1.05;
  const stage = covered >= months ? 'full' : covered >= 3 ? 'core' : covered >= 1 ? 'starter' : 'none';

  return (
    <SimCard title="Emergency Fund Sizer" kind="Mini sandbox" icon={LifeBuoy} sim={sim} presets={presets} guide={EF_GUIDE}
      subtitle="See how big your emergency fund should be, and how close you are.">
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
          <StatTile label="You'd be covered for" value={`${num(covered, 1)} mo`} sub={`if income stopped today`} />
          <StatTile label="Still to save" value={usd(Math.max(0, target - s.saved))} sub={s.saved >= target ? 'target reached!' : 'no rush: steady wins'} />
        </StatGrid>
        <div className="rounded-xl border border-line p-4">
          <p className="mb-6 text-sm font-semibold text-ink">Your progress up the safety-net ladder</p>
          <div className="relative h-4 rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-[color:var(--s3)] transition-[width] duration-300" style={{ width: Math.min(100, (s.saved / scaleMax) * 100) + '%' }} />
            {milestones.map((m) => {
              const left = Math.min(100, ((m.months * s.needs) / scaleMax) * 100);
              const reached = s.saved >= m.months * s.needs;
              return (
                <div key={m.label} className="absolute -top-1.5 -bottom-1.5 w-0.5 bg-ink/70" style={{ left: `calc(${left}% - 1px)` }}>
                  <span className={`absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium ${reached ? 'text-good-text' : 'text-muted'}`}>
                    {reached ? '✓ ' : ''}{m.label} · {usd(m.months * s.needs, { compact: true })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-8" />
        </div>
        {stage === 'none' && <Nudge tone="tip" title="First milestone: one month">Aim for a starter fund of {usd(s.needs)}, one month of needs. It turns most surprises into a hassle instead of debt.</Nudge>}
        {stage === 'starter' && <Nudge tone="info" title="Starter fund done">Nice! Next stop: 3 months ({usd(s.needs * 3)}). Have high-interest debt? Many people pay that off first, then finish the fund.</Nudge>}
        {stage === 'core' && <Nudge tone="good" title="Core safety net in place">You could ride out a typical job search. {months > 3 ? `For your situation, aim for ${months} months.` : 'Extra cash beyond this can go toward investing.'}</Nudge>}
        {stage === 'full' && <Nudge tone="good" title="Fully funded">You've hit your target. Extra cash can be invested for long-term goals, since cash slowly loses to inflation.</Nudge>}
      </SimGrid>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */
/* Inflation vs savings visualizer                                      */
/* ------------------------------------------------------------------ */

const DEFAULTS = { start: 10000, monthly: 200, apy: 0.4, inflation: 3, years: 10 };
type State = typeof DEFAULTS;
const PRESETS: Preset<State>[] = [
  { label: 'Big Bank 0.01%', values: { apy: 0.01 } },
  { label: 'HYSA 4.5%', values: { apy: 4.5 } },
  { label: '6-Month Safety Net', hint: '$15,000 parked in a 4% HYSA, no new deposits', values: { start: 15000, monthly: 0, apy: 4, years: 5 } },
];
const GUIDE: SimGuide<State> = {
  how: ['Set your starting cash and monthly deposit.', 'Set the account APY and inflation rate.', 'Compare the balance to buying power.'],
  tryThis: [
    { label: 'Drop the APY to 0.01%, like many big banks pay.', done: (s) => s.apy < 0.015 },
    { label: 'Raise the APY above inflation. Does buying power beat your deposits?', done: (s) => s.apy > s.inflation },
    { label: 'Set inflation to 0%. Now balance and buying power match.', done: (s) => s.inflation < 0.05 },
  ],
};

function InflationVisualizer() {
  const sim = useSim(DEFAULTS);
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
    <SimCard title="Inflation vs. Savings Visualizer" sim={sim} presets={PRESETS} guide={GUIDE}
      subtitle="See if your savings grow faster than prices rise.">
      <SimGrid controls={
        <>
          <ControlGroup title="Your cash">
            <SliderField label="Starting cash" value={s.start} onChange={sim.set('start')} min={0} max={50000} step={500} format={(v) => usd(v)} />
            <SliderField label="Monthly deposit" value={s.monthly} onChange={sim.set('monthly')} min={0} max={2000} step={25} format={(v) => usd(v)} />
          </ControlGroup>
          <ControlGroup title="The bucket & the leak">
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
          <StatTile label="Eaten by inflation" value={usd(lostToInflation)} sub="balance − buying power" />
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
            <Line type="monotone" dataKey="nominal" name="Balance" stroke="var(--s1)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="real" name="Buying power" stroke="var(--s2)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
            {s.start > 0 && <ReferenceLine y={s.start} stroke="var(--axis)" />}
          </LineChart>
        </ChartFrame>

        {s.apy < s.inflation ? (
          <Nudge tone="warning" title="The leak is bigger than the faucet">
            Your {pct(s.apy, 2)} APY is below {pct(s.inflation, 1)} inflation, so your cash buys a bit less each year.
            {realGap < 0 ? <> After {s.years} years, it buys <strong>{usd(-realGap)} less</strong> than the dollars you put in.</> : null}
            {s.apy < 4.5 && <> In a 4.5% HYSA, the same deposits would grow to <strong>{usd(hysa[hysa.length - 1].nominal)}</strong> (<strong>{usd(hysa[hysa.length - 1].nominal - last.nominal)} more</strong>).</>}
          </Nudge>
        ) : (
          <Nudge tone="good" title="Your cash is keeping up">
            At {pct(s.apy, 2)} APY vs. {pct(s.inflation, 1)} inflation, your buying power keeps up ({usd(realGap, { sign: true })} vs. what you deposited).
            Still, cash is for safety, and long-term money belongs in investments (Module 5).
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */

export const questions: QuizQuestion[] = [
  {
    id: 'where-ef',
    scenario: <>You've saved a 3-month <Term id="emergency-fund">emergency fund</Term>: <strong>$9,000</strong>. You could keep it in checking (0.01%), an online <Term id="hysa">HYSA</Term> (4.0% APY, FDIC-insured), or an S&P 500 index fund (about 10%/yr historically, but bumpy).</>,
    prompt: 'Where should the $9,000 live?',
    options: [
      { text: 'The FDIC-insured high-yield savings account.', correct: true, why: <>It's insured, you can reach it in a day or two, and it earns about <strong>$360/year</strong> instead of <strong>$0.90</strong>. An emergency fund's job is to be there, at full value, when you need it.</> },
      { text: 'Checking, so it is instantly available.', why: <>It's safe, but at 0.01% the $9,000 earns about <strong>90 cents a year</strong>. Meanwhile, 3% inflation takes about <strong>$270</strong> of buying power. A HYSA transfer takes 1–2 days, which is fast enough for real emergencies.</> },
      { text: 'The stock index fund, since it grows fastest.', why: <>Emergencies and market crashes often arrive together. In early 2020, as millions lost jobs, stocks fell <strong>34% in about a month</strong>. Your $9,000 would have dropped to about <strong>$5,940</strong> right when you needed it.</> },
      { text: 'Lock it in a 5-year CD for the best rate.', why: <>CDs work for money you need on a known date. Cashing out a 5-year CD early usually costs months of interest. Emergency money needs <Term id="liquidity">liquidity</Term>: ready any day, with no penalty.</> },
    ],
  },
  {
    id: 'nominal-real',
    scenario: <>Your grandpa keeps <strong>$20,000</strong> in checking at 0.01% for 10 years. He says, "I've never lost a penny. The balance only goes up." Inflation averages 3% over that time.</>,
    prompt: "What really happened to his money's buying power?",
    options: [
      { text: "Nothing was lost: the balance grew to about $20,020.", why: <>That's the <Term id="nominal-vs-real">nominal</Term> view, which only counts dollars. Prices rose about 34%, so that $20,020 only buys what about <strong>$14,900</strong> buys today.</> },
      { text: 'He lost about $5,100 of buying power, even though no dollars disappeared.', correct: true, why: <>Right. $20,020 ÷ 1.344 ≈ <strong>$14,897</strong> in today's dollars, so about <strong>$5,100</strong> of <Term id="purchasing-power">purchasing power</Term> is gone. Keeping your dollars isn't the same as keeping their value.</> },
      { text: 'He only loses value if he spends it.', why: <>Prices rise whether he spends or not, so the loss happens either way. Spending just makes it visible: a $100 cart of groceries now costs about $134.</> },
    ],
  },
  {
    id: 'ef-size',
    scenario: <>You're a freelance designer and the only earner in your home. Your core needs are <strong>$3,000/month</strong>, but your income swings from $2,000 to $9,000 a month.</>,
    prompt: 'How big should your emergency fund be?',
    options: [
      { text: '1 month ($3,000).', why: <>One month is a great <em>starter</em> fund. But with uneven income, one slow season could empty it. Think of $3,000 as step one.</> },
      { text: '3 months ($9,000).', why: <>Three months fits a steady paycheck with a second earner at home. Uneven income and being the only earner both add risk, so aim higher.</> },
      { text: '6+ months ($18,000 or more).', correct: true, why: <>Yes. Uneven income (+2 months) and being the only earner (+1) take you from 3 months to 6. With <strong>$18,000+</strong>, a 3-month dry spell is stressful but survivable.</> },
      { text: '24 months ($72,000), because you can never be too safe.', why: <>Safety has a cost. Invested for the long term, the extra <strong>$54,000</strong> could earn roughly <strong>$1,600–$2,200 more per year</strong> than cash. Hit your target, then put the rest to work.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Wallet, title: 'Right money, right bucket.', body: <>Use checking for spending and an FDIC/NCUA-insured <strong>HYSA</strong> for savings. A 0.01% account pays just <strong>$1 a year per $10,000</strong>.</> },
  { icon: Layers, title: 'Build your safety net in stages.', body: <>Start with <strong>1 month</strong> of core needs, then build to <strong>3–6 months</strong>. Go higher if your income is irregular or others depend on you.</> },
  { icon: Percent, title: 'Compare your APY to inflation.', body: <>If your rate is below inflation, your cash is losing buying power. Keep safety money in cash, and invest long-term money.</> },
];

export default function BankingModule() {
  return (
    <ModuleLayout
      id="banking"
      hook={<>You finally saved <strong>$10,000</strong>. It sits in a big bank's savings account earning 0.01%, about <strong>$1 a year</strong>. Meanwhile, the same groceries cost 3% more than last year. Your balance says you're safe. Your shopping cart says otherwise.</>}
      concept={
        <>
          <Lead>Where you keep your cash matters, not just how much you save. The right account keeps it <em>safe</em> and <em>ready</em>, and still earns something.</Lead>

          <ConceptCards items={[
            { icon: Wallet, title: 'Checking account', body: <>Your <Term id="checking-account">spending hub</Term> for your debit card, bills and paychecks. It earns little or nothing, so keep about a month of spending here, plus a small cushion.</> },
            { icon: PiggyBank, title: 'High-yield savings (HYSA)', body: <>A <Term id="hysa">HYSA</Term>, often at an online bank, pays a much higher <Term id="apy">APY</Term>. Moving money to checking takes 1–2 days. That's fast enough for emergencies, and slow enough to curb impulse buys.</> },
            { icon: ShieldCheck, title: 'Deposit insurance', body: <><Term id="fdic-insurance">FDIC</Term> (banks) and NCUA (credit unions) insure deposits up to <strong>$250,000</strong> per person, per bank, per ownership type. If the bank fails, your insured money is still safe.</> },
            { icon: Landmark, title: 'APY, the number to compare', body: <>APY counts compounding, so it shows what you really earn in a year. $10,000 at 4.5% APY earns about $450. At 0.01%, it earns $1.</> },
          ]} />
          <GoDeeper title="Picking a savings account: a quick checklist">
            <p>Most savings accounts look alike at first. These five checks show the real differences:</p>
            <Bullets items={[
              <><strong>Is it insured?</strong> Look for FDIC (banks) or NCUA (credit unions). Both have free lookup tools on their websites.</>,
              <><strong>What's the APY?</strong> Ask if it's a short-term promo rate. Savings rates can change at any time.</>,
              <><strong>Any fees or minimums?</strong> A $5 monthly fee is $60 a year. That can wipe out the interest on a small balance.</>,
              <><strong>How fast are transfers?</strong> One to two business days to checking is typical.</>,
              <><strong>Can you link your checking?</strong> That makes automatic transfers on payday easy.</>,
            ]} />
          </GoDeeper>
          <GoDeeper title="What deposit insurance covers, and what it doesn't">
            <p>"Per ownership type" means accounts you own alone are one group, and joint accounts are another. So your checking and savings at one bank, in your name only, share one $250,000 limit.</p>
            <Bullets items={[
              <><strong>Covered:</strong> checking, savings, money market deposit accounts and CDs.</>,
              <><strong>Not covered:</strong> stocks, bonds, mutual funds, crypto and other investments, even if you bought them through a bank.</>,
              <><strong>Money apps:</strong> many aren't banks. They keep your cash at partner banks, so check how your money is held.</>,
            ]} />
            <p>Have more than $250,000 in one group? You can spread it across different insured banks.</p>
          </GoDeeper>

          <H3>Your emergency fund: the shock absorber</H3>
          <P>An <Term id="emergency-fund">emergency fund</Term> is cash saved for the <em>unexpected</em>, like a layoff or an ER visit.</P>
          <GoDeeper title="What counts as an emergency?">
            <p>Before you use the fund, ask three questions. Is it unexpected? Is it necessary? Is it urgent? If all three answers are yes, it's an emergency.</p>
            <Bullets items={[
              <><strong>Yes:</strong> a job loss, a medical bill, or an urgent repair your sinking funds can't cover.</>,
              <><strong>No:</strong> a sale, concert tickets or a vacation. Plan those with savings goals instead.</>,
              <><strong>Expected costs</strong>, like car upkeep or holiday gifts, go in sinking funds from Module 1.</>,
            ]} />
            <p>Had to use some of it? That's what it's for. Pause extra goals for a bit and refill it first.</p>
          </GoDeeper>
          <P>You don't have to save it all at once. Build it in stages:</P>
          <Steps items={[
            { title: 'Starter fund: 1 month of core needs', body: 'Enough to keep a flat tire or surprise bill off a credit card.' },
            { title: 'Core fund: 3 months', body: 'Covers a typical job search for a steady earner.' },
            { title: 'Full fund: up to 6 months or more', body: 'For uneven income, a single-income home, or people who depend on you.' },
          ]} />
          <EmergencyFundSizer />
          <Example title="Sizing a fund, step by step">
            <p>Maya's core needs are $2,400 a month. She has a steady job, but she's the only earner at home.</p>
            <Bullets items={[
              <>Her target: 3 months + 1 extra month for a single income = 4 months. So $2,400 × 4 = <strong>$9,600</strong>.</>,
              <>She can save $400 a month.</>,
              <>Starter fund (1 month, $2,400): $2,400 ÷ $400 = <strong>6 months</strong> to get there.</>,
              <>Core fund (3 months, $7,200): $7,200 ÷ $400 = <strong>18 months</strong>.</>,
              <>Full target ($9,600): $9,600 ÷ $400 = <strong>24 months</strong>.</>,
            ]} />
            <p>Two years is normal, and every stage makes her safer. HYSA interest, tax refunds and raises can all speed it up.</p>
          </Example>

          <H3>Inflation: the silent leak</H3>
          <Analogy icon={Droplets}>
            Cash at 0.01% while prices rise 3% a year is like a bucket with a slow leak.
            The water level, your balance, looks fine. But your <Term id="purchasing-power">buying power</Term> is quietly draining out the bottom.
          </Analogy>
          <P><Term id="nominal-vs-real">Nominal</Term> money is the number of dollars you have. <em>Real</em> money is what those dollars can buy.</P>
          <P>At 3% <Term id="inflation">inflation</Term>, cash that earns nothing slowly loses value. After 10 years, $10,000 buys only what about <strong className="text-ink">$7,440</strong> buys today.</P>
          <Example title="Same $10,000, two accounts, five years">
            <p>Say prices rise 3% a year. To keep up, $10,000 must grow to $10,000 × 1.03⁵ ≈ <strong>$11,593</strong> in 5 years.</p>
            <Bullets items={[
              <><strong>Big-bank savings at 0.01%:</strong> $10,000 × 1.0001⁵ ≈ $10,005. That's about $1,588 short of keeping up.</>,
              <><strong>HYSA at 4.5%:</strong> $10,000 × 1.045⁵ ≈ $12,462. That's about $869 ahead of prices.</>,
            ]} />
            <p>Both accounts can be equally safe. The only change is where the money sits. (Rates change over time, so treat this as a sketch.)</p>
          </Example>
          <GoDeeper title="Can cash beat inflation?">
            <p>Sometimes, but only by a little. A quick check: real return ≈ APY − inflation.</p>
            <Bullets items={[
              <>4.5% APY with 3% inflation is about <strong>1.5% real</strong>. Exact math: $10,000 × 1.045 ÷ 1.03 ≈ $10,146, so about $146 more buying power after a year.</>,
              <>0.01% APY with 3% inflation is about <strong>−3% real</strong>. You lose buying power every year.</>,
              <>Savings rates float. They tend to rise and fall with interest rates across the economy, so check yours once or twice a year.</>,
            ]} />
            <p>Cash is for safety and short-term goals. Money you won't need for many years usually belongs in investments, which Module 5 covers.</p>
          </GoDeeper>

          <Mistakes items={[
            <>Keeping all your savings in checking, where it earns almost nothing and is easy to spend.</>,
            <>Picking an account for its promo rate without checking fees, minimums or when the rate ends.</>,
            <>Putting emergency money in stocks, which can drop right when you need the cash.</>,
            <>Using the emergency fund for planned costs, like a trip. Those belong in sinking funds.</>,
          ]} />

          <UnderTheHood>
            <Formula note="r = stated annual rate, n = compounding periods per year. 4.40% compounded daily ≈ 4.50% APY.">APY = (1 + r ÷ n)ⁿ − 1</Formula>
            <Formula note="i = inflation rate, t = years. Example: $10,000 ÷ 1.03¹⁰ = $7,441.">Real value = Nominal value ÷ (1 + i)ᵗ</Formula>
            <Formula note="Quick version: real ≈ nominal − inflation. 4.5% APY − 3% inflation ≈ 1.5% real.">Real return = (1 + nominal) ÷ (1 + inflation) − 1</Formula>
            <Formula note="This sandbox converts APY to a monthly rate and adds deposits at the end of each month.">Balanceₘ = Balanceₘ₋₁ × (1 + APY)^(1/12) + Deposit</Formula>
            <p><strong className="text-ink">Insurance fine print:</strong> coverage is per depositor, per insured bank, per ownership category (individual, joint, some retirement accounts…). So a couple with individual and joint accounts at one bank can be covered for more than $250,000. Money apps that aren't banks use partner banks, so check how your money is held.</p>
          </UnderTheHood>
        </>
      }
      sandbox={<InflationVisualizer />}
      questions={questions}
      rules={rules}
    />
  );
}
