import { useMemo } from 'react';
import { Store, Percent, CalendarClock, ChefHat, Building2, Landmark, Layers, Shuffle, Briefcase } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ModuleLayout } from '../components/ModuleLayout';
import { Term } from '../components/Glossary';
import { Analogy, Bullets, Compare, ConceptCards, Example, Formula, GoDeeper, Lead, Mistakes, P, H3, UnderTheHood } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend } from '../components/SegmentBar';
import { ChartFrame, TooltipBox, activeDot, cursorProps, gridProps, xAxisProps, yAxisProps } from '../components/Chart';
import { Button } from '../components/ui';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { usd, pct } from '../lib/format';
import { CHEF_ASSUMPTIONS, chefOdds, simulateChef, simulateFees } from '../lib/growth';

/* ------------------------------------------------------------------ */
/* One chef vs. every restaurant                                        */
/* ------------------------------------------------------------------ */

const CHEF_DEFAULTS = { seed: 1, years: 20 };
type ChefState = typeof CHEF_DEFAULTS;
const CHEF_PRESETS: Preset<ChefState>[] = [
  { label: 'A lucky pick', values: { seed: 5, years: 20 } },
  { label: 'An unlucky pick', values: { seed: 8, years: 20 } },
];

function ChefVsCity() {
  const sim = useSim(CHEF_DEFAULTS);
  const s = sim.state;
  const data = useMemo(() => simulateChef(s.seed, 10000, s.years), [s.seed, s.years]);
  const odds = useMemo(() => chefOdds(100, s.years), [s.years]);
  const last = data[data.length - 1];
  return (
    <SimCard title="One Chef vs. Every Restaurant" kind="Mini sandbox" icon={ChefHat} sim={sim} presets={CHEF_PRESETS}
      subtitle="See if betting on one company beats owning the whole market (simulated stocks, not real ones)."
      guide={{
        how: ['Watch both lines grow from $10,000.', 'Click the button to pick another stock.', 'Check how many of 100 stocks won.'],
        tryThis: [
          { label: 'Pick three new chefs. How many beat the index?', done: (st) => st.seed >= 4 },
          { label: 'Stretch it to 30 years. Do the odds get worse?', done: (st) => st.years >= 30 },
        ],
      }}>
      <SimGrid controls={
        <ControlGroup title="Simulation">
          <SliderField label="Years invested" value={s.years} onChange={sim.set('years')} min={5} max={30} step={1} format={(v) => v + ' yrs'} />
          <Button variant="soft" icon={Shuffle} onClick={() => sim.setState((st) => ({ ...st, seed: st.seed + 1 }))} className="w-full">Pick another chef (new stock)</Button>
          <p className="text-xs text-muted">Stock #{s.seed}. Both average {Math.round(CHEF_ASSUMPTIONS.expected * 100)}% a year. One company swings about {Math.round(CHEF_ASSUMPTIONS.stockVol * 100)}% a year. The index swings about {Math.round(CHEF_ASSUMPTIONS.indexVol * 100)}%.</p>
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="Index fund (every restaurant)" value={usd(last.index)} sub={`from $10,000 over ${s.years} yrs`} />
          <StatTile label={`Single stock #${s.seed} (one chef)`} value={usd(last.stock)} sub={last.stock > last.index ? 'beat the index this time!' : 'trailed the index'} />
          <StatTile label="Out of 100 random single stocks" value={`${odds.beatIndex} beat the index`} sub={`${odds.lostMoney} lost money · ${odds.halved} lost half or more`} emphasis />
        </StatGrid>
        <ChartFrame title="Growth of $10,000" height={240}
          legend={[{ label: 'Index fund', color: 'var(--s1)' }, { label: `Single stock #${s.seed}`, color: 'var(--s2)' }]}
          table={{ columns: ['Year', 'Index fund', 'Single stock'], rows: data.map((d) => [d.year, usd(d.index), usd(d.stock)]) }}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="year" type="number" domain={[0, s.years]} tickFormatter={(v) => `Yr ${v}`} {...xAxisProps} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
            <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => `Year ${l}`} valueFormat={(v) => usd(v)} />} />
            <Line type="monotone" dataKey="index" name="Index fund" stroke="var(--s1)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="stock" name="Single stock" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
          </LineChart>
        </ChartFrame>
        <Nudge tone="info" title="Same average, very different odds">
          A few big winners pull the <em>average</em> up, but the <em>typical</em> single stock falls behind. Here, only {odds.beatIndex} of 100 beat the index over {s.years} years.
          In real life, about 4% of U.S. stocks created all of the market's net wealth from 1926 to 2016. An index fund owns every one of them.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */
/* Fee drag calculator                                                  */
/* ------------------------------------------------------------------ */

const DEFAULTS = { monthly: 300, years: 25, gross: 7, feeLow: 0.03, feeHigh: 1.0 };
type State = typeof DEFAULTS;
const PRESETS: Preset<State>[] = [
  { label: '$500/mo for 30 Years', values: { monthly: 500, years: 30 } },
  { label: '0.03% vs. 1.25% Fee', values: { feeHigh: 1.25 } },
  { label: 'Late Start: 15 Years', hint: '$800/month but only 15 years', values: { monthly: 800, years: 15 } },
];

function FeeDrag() {
  const sim = useSim(DEFAULTS);
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
    <SimCard title="Fee Drag Calculator" sim={sim} presets={PRESETS}
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
            <SliderField label={<span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: 'var(--s1)' }} />Index ETF fee</span>} value={s.feeLow} onChange={sim.set('feeLow')} min={0} max={0.5} step={0.01} format={(v) => pct(v, 2)} />
            <SliderField label={<span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: 'var(--s2)' }} />Active fund fee</span>} value={s.feeHigh} onChange={sim.set('feeHigh')} min={0.25} max={2.5} step={0.05} format={(v) => pct(v, 2)} />
          </ControlGroup>
        </>
      }>
        <StatGrid cols={4}>
          <StatTile label={`Low-fee fund (${pct(s.feeLow, 2)})`} value={usd(last.low)} sub={`after ${s.years} years`} />
          <StatTile label={`High-fee fund (${pct(s.feeHigh, 2)})`} value={usd(last.high)} sub={`same ${usd(last.contributed)} invested`} />
          <StatTile label="Lost to the higher fee" value={usd(lost)} sub={`${pct((lost / last.low) * 100, 0)} of the final balance`} emphasis />
          <StatTile label="Share of gains eaten" value={pct(lostShare, 0)} sub="of what you could have earned" />
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
            <Line type="monotone" dataKey="low" name="Low-fee fund" stroke="var(--s1)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
            <Line type="monotone" dataKey="high" name="High-fee fund" stroke="var(--s2)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
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

/* ------------------------------------------------------------------ */

export const questions: QuizQuestion[] = [
  {
    id: 'fee-gains',
    scenario: <>You'll invest <strong>$500/month for 30 years</strong> at 7% before fees. Fund A is an index ETF with a <strong>0.03%</strong> fee. It grows to about <strong>$581,000</strong>. Fund B is an active fund with a <strong>1.00%</strong> fee. Its rep says, "It's only 1%."</>,
    prompt: 'Roughly what does that 1% fee cost you?',
    options: [
      { text: 'About 1% of the money, roughly $5,800.', why: <>The fee takes 1% of your <em>whole balance</em>, <em>every year</em>, and each dollar it takes stops growing. Fund B ends near <strong>$481,000</strong>, about <strong>$100,000</strong> less.</> },
      { text: 'About $100,000, roughly a quarter of all your gains.', correct: true, why: <>You put in $180,000 either way. Fund A earns about $401,000 in gains, and Fund B about $301,000. That's <Term id="fee-drag">fee drag</Term>: the 1% fee eats about <strong>25% of your lifetime gains</strong>.</> },
      { text: 'Nothing, as long as the active fund beats the market.', why: <>Just to break even, its picks must beat the index by <strong>~0.97% every year</strong>. Over 15-year stretches, about 9 in 10 active U.S. stock funds trail their index. And you can't know ahead of time which 1 in 10 will win.</> },
    ],
  },
  {
    id: 'match-goal',
    scenario: <>You're saving <strong>$20,000</strong> for a house down payment in <strong>2 years</strong>. You're also investing for retirement, <strong>35 years</strong> away.</>,
    prompt: 'Which setup fits each goal?',
    options: [
      { text: 'House money in high-yield savings or CDs. Retirement money mostly in stock index funds.', correct: true, why: <>Match the money to the timeline. Money you need soon can't risk a drop, but money for decades from now has time to recover. Over 35 years, $10,000 grows to about <strong>$106,800</strong> at 7% vs. <strong>$23,700</strong> at 2.5%.</> },
      { text: 'Both 100% in stocks to maximize growth.', why: <>Stocks can fall <strong>30%+</strong> in a single year. Your $20,000 could be <strong>$14,000</strong> right when you need to close. Short-term money needs safety more than growth.</> },
      { text: 'Both in bonds and cash, since safety comes first.', why: <>Safe for the house, but too cautious for retirement. Over 35 years, $10,000 grows to about <strong>$23,700</strong> at a cash-like 2.5%, vs. about <strong>$106,800</strong> at a stock-like 7%. With decades ahead, you can ride out <Term id="volatility">volatility</Term>.</> },
    ],
  },
  {
    id: 'hot-stock',
    scenario: <>A coworker made <strong>40% last year</strong> on one tech stock. Your total-market <Term id="index-fund">index fund</Term> made 12%, and they say you're "leaving money on the table."</>,
    prompt: "What's the most sensible move?",
    options: [
      { text: 'Move everything into that stock while it\'s hot.', why: <>You'd swap thousands of companies for just one. In the sandbox, only about <strong>1 in 4</strong> single stocks beat the index over 20 years, and about <strong>1 in 3</strong> lost money. Last year's 40% says little about next year.</> },
      { text: 'Keep index funds as your core. Cap any single-stock "fun money" at about 5–10%.', correct: true, why: <>That's <Term id="diversification">diversification</Term>. If the stock soars, you still win a little. If it crashes, a 10% slice that drops 50% costs you only 5%, not 50%.</> },
      { text: 'Sell the index fund and buy last year\'s top active fund instead.', why: <>Chasing last year's winners rarely works. Very few top funds stay on top in later years. And you'd pay higher fees for the privilege (see the fee sandbox).</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Store, title: 'Own the whole market as your core.', body: <>Low-cost <strong>index funds</strong> spread your money across thousands of companies. One bad chef can't sink you.</> },
  { icon: Percent, title: 'Fees compound against you.', body: <>Aim for expense ratios under about <strong>0.20%</strong>. A 1% fee can quietly eat about <strong>a quarter</strong> of your long-term gains.</> },
  { icon: CalendarClock, title: 'Match the investment to the timeline.', body: <>Money you need within about <strong>3–5 years</strong> goes in cash or high-quality bonds. Money for <strong>10+ years</strong> can lean on stocks.</> },
];

export default function InvestingModule() {
  return (
    <ModuleLayout
      id="investing"
      hook={<>Your coworker made <strong>40%</strong> last year on one tech stock. They say your boring index fund is "leaving money on the table." Your 401(k) also offers a "Premier Growth Fund" with a <strong>1% fee</strong>. Is boring secretly smart?</>}
      concept={
        <>
          <Lead>Investing means owning pieces of businesses, or lending your money out. Then you give it time to grow.</Lead>
          <Compare
            left={{ title: 'Stocks: be an owner', body: <>A <Term id="stock">stock</Term> is a slice of a business. If the business grows, your slice is worth more. Some also pay you <Term id="dividend">dividends</Term>. More growth, bigger swings.</> }}
            right={{ title: 'Bonds: be a lender', body: <>A <Term id="bond">bond</Term> is a loan you make to a government or company. They pay you interest, then give your money back. Less growth, smoother ride.</> }}
          />
          <GoDeeper title="How stocks and bonds actually pay you">
            <p>A stock can pay you in two ways. Its price can rise, so you sell for more than you paid. It may also pay dividends, a small share of the profits. A $50 share that pays $1 a year gives you 2% ($1 ÷ $50).</p>
            <p>A bond pays set interest. Lend $1,000 for 10 years at 4%, and you get $40 a year. That's $400 in all, plus your $1,000 back at the end.</p>
            <p>One catch: if new bonds start paying more, your older bond is worth less if you sell early. Hold it to the end, and you still get your $1,000 back, as long as the borrower pays.</p>
            <p>This is why money you need soon often sits in bonds or cash. Money with a long <Term id="time-horizon">time horizon</Term> can lean on stocks.</p>
          </GoDeeper>

          <Analogy icon={ChefHat}>
            Buying one stock is betting on one chef. A star could make you rich, but one bad review can close the doors.
            An <Term id="index-fund">index fund</Term> owns a slice of <em>every</em> restaurant in town. So you're sure to own the few that get famous.
          </Analogy>
          <ChefVsCity />
          <GoDeeper title="What spreading out can and can't do">
            <p>Spreading your money out is called <Term id="diversification">diversification</Term>. It protects you when one company fails. It can't protect you from everything.</p>
            <Bullets items={[
              <>It <strong>can't</strong> stop the whole market from falling. In a crash, most stocks drop together.</>,
              <>Five tech stocks aren't very spread out. Companies in one industry tend to rise and fall together.</>,
              <>A total-market index fund owns thousands of companies in one purchase.</>,
              <>Adding bonds smooths the ride even more. Your mix of stocks and bonds is your <Term id="asset-allocation">asset allocation</Term>.</>,
            ]} />
          </GoDeeper>
          <Example title="Keeping one stock small">
            <p>Say you have $20,000 invested. You keep $18,000 (90%) in an index fund. You put $2,000 (10%) in one company you love.</p>
            <p>If that stock falls by half, you lose $1,000. That's $1,000 ÷ $20,000 = <strong>5% of your total</strong>.</p>
            <p>If it doubles, you gain $2,000. That's $2,000 ÷ $20,000 = <strong>10% of your total</strong>.</p>
            <p>Either way, the other 90% keeps doing its job. (We're leaving out the index fund's own ups and downs here.)</p>
          </Example>

          <H3>Funds: buying the whole menu at once</H3>
          <ConceptCards items={[
            { icon: Building2, title: 'Mutual fund', body: <>A <Term id="mutual-fund">mutual fund</Term> pools money from many people to buy many investments. It trades once a day. Many 401(k)s offer only these.</> },
            { icon: Layers, title: 'ETF', body: <>An <Term id="etf">ETF</Term> is a similar basket that trades all day, like a stock. It's often low-cost and tax-friendly in a <Term id="brokerage">brokerage account</Term>.</> },
            { icon: Landmark, title: 'Passive (index) funds', body: <><Term id="passive-investing">Passive</Term> funds simply copy an index, like the <Term id="sp-500">S&P 500</Term>. No stock-picking means tiny fees, often just 0.03%.</> },
            { icon: Briefcase, title: 'Active funds', body: <><Term id="active-fund">Active funds</Term> pay managers to pick winners. They charge more, often 0.5–1% or higher. Most fall behind their index over time.</> },
          ]} />
          <GoDeeper title="How to pick from a 401(k) fund list">
            <p>A long fund list can feel like a test. It isn't. Here's a simple way to read it.</p>
            <Bullets items={[
              <>Open your plan's fund list. Each fund has a short fact sheet.</>,
              <>Look for <strong>"Index"</strong> in the name, or a line naming the index it copies.</>,
              <>Find the <strong>expense ratio</strong> on the fact sheet. Lower is better. Many index funds charge under 0.20%.</>,
              <>Notice any <strong>target-date funds</strong>. Each holds a stock-and-bond mix that gets safer as the year in its name gets closer. Check its fee, too.</>,
              <>Many people keep it simple with one or two broad, low-cost index funds.</>,
            ]} />
          </GoDeeper>

          <P>
            Every fund charges a yearly fee called an <Term id="expense-ratio">expense ratio</Term>. It comes out of your balance quietly, so you never see a bill.
          </P>
          <P>
            On $100,000, a 0.03% fund costs <strong className="text-ink">$30 a year</strong>. A 1.00% fund costs <strong className="text-ink">$1,000 a year</strong>.
          </P>
          <P>
            Over decades, that gap snowballs. This is called <Term id="fee-drag">fee drag</Term>.
          </P>
          <Example title="Turning a fee into dollars">
            <p>Say you have $40,000 in a fund. Here's what two different fees cost you this year.</p>
            <Bullets items={[
              <>Index fund at 0.04%: $40,000 × 0.0004 = <strong>$16</strong>.</>,
              <>Active fund at 0.90%: $40,000 × 0.009 = <strong>$360</strong>.</>,
            ]} />
            <p>That's $344 more, just this year. And the fee grows as your balance grows.</p>
            <p>At $200,000, the same funds cost $80 vs. $1,800 a year. That's a <strong>$1,720 gap</strong>, every year. Money paid in fees never gets the chance to grow for you.</p>
          </Example>
          <GoDeeper title="Other fees to watch for">
            <p>The expense ratio is the big one, but it's not the only cost. Here's what else to look for.</p>
            <Bullets items={[
              <><strong>Sales charges ("loads").</strong> Some funds take a cut when you buy or sell. Many good funds charge none.</>,
              <><strong>Advisor fees.</strong> Some advisors charge a yearly percent of your balance. That's on top of the fund's own fee.</>,
              <><strong>Account fees.</strong> Some accounts and 401(k) plans add yearly or per-trade fees.</>,
            ]} />
            <p>A handy question to ask: "What's the total I pay each year, in dollars?" A clear answer makes it easy to compare.</p>
          </GoDeeper>
          <Mistakes items={[
            <>Checking your balance every day. Big swings are normal for long-term money.</>,
            <>Picking a fund just because it did great last year.</>,
            <>Skipping the expense ratio. It's in the small print, but it adds up.</>,
            <>Putting money you need within a few years into stocks.</>,
          ]} />

          <UnderTheHood>
            <Formula note="g = return before fees, f = expense ratio. Roughly, net ≈ g − f. So 7% with a 1% fee ≈ 5.93% net.">Net yearly growth factor = (1 + g) × (1 − f)</Formula>
            <Formula note="FV = future value of your monthly deposits at each fund's net rate.">Fee cost = FV(net of low fee) − FV(net of high fee)</Formula>
            <Formula note="σ² = one stock's variance, ρσ² = average covariance (how much stocks move together). As N grows, the first term shrinks to zero. What's left is market risk, which diversification can't remove.">Portfolio variance (N equal stocks) ≈ σ² ÷ N + (1 − 1 ÷ N) × ρσ²</Formula>
            <p><strong className="text-ink">Why most single stocks lag:</strong> with the same <em>average</em> return, bigger swings lower the <em>typical</em> (median) result. This volatility drag is about σ² ÷ 2 per year. That's about 5% for a stock swinging ±32% a year, vs. about 1% for an index swinging ±15%.</p>
            <p><strong className="text-ink">Stocks vs. bonds by time horizon:</strong> U.S. stocks have lost money in about 1 of every 4 calendar years. But over 20-year stretches, they've been positive in essentially every period on record. Time turns scary swings into noise.</p>
          </UnderTheHood>
        </>
      }
      sandbox={<FeeDrag />}
      questions={questions}
      rules={rules}
    />
  );
}

