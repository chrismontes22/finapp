import { useMemo } from 'react';
import { Activity, Target, Repeat, Plane } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot } from 'recharts';
import { ModuleLayout } from '../components/ModuleLayout';
import { Term } from '../components/Glossary';
import { Analogy, Bullets, Compare, Example, Formula, GoDeeper, Lead, Mistakes, P, H3, UnderTheHood } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { ChartFrame, DataTable, TooltipBox, activeDot, cursorProps, gridProps, xAxisProps, yAxisProps } from '../components/Chart';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { usd, pct, num } from '../lib/format';
import { ASSUMPTIONS, mixStats, rebalance, simulateDip } from '../lib/portfolio';

/* ------------------------------------------------------------------ */
/* Return-range number line                                             */
/* ------------------------------------------------------------------ */

const LO = -40, HI = 30;
const xPos = (v: number) => ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * 100;

function RangeLine({ stats }: { stats: ReturnType<typeof mixStats> }) {
  const marks = [
    { v: stats.y2008, short: '2008-style' },
    { v: stats.y2022, short: '2022-style' },
    { v: stats.badYear, short: '1-in-20 bad year' },
  ].sort((a, b) => a.v - b.v);
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-sm font-semibold text-ink">What a single year could look like</p>
      <p className="text-xs text-muted">Shaded band = a typical year (about 2 in 3 years land here). Red ticks = bad years. Rough teaching numbers, not a forecast.</p>
      <div className="relative mt-10 mb-7 h-3 rounded-full bg-surface-2">
        <div className="absolute inset-y-0 rounded-full bg-[color:var(--s1)] opacity-30" style={{ left: xPos(stats.typicalLow) + '%', width: xPos(stats.typicalHigh) - xPos(stats.typicalLow) + '%' }} />
        <div className="absolute -top-1 h-5 w-1 rounded-full bg-[color:var(--s1)]" style={{ left: 'calc(' + xPos(stats.expected) + '% - 2px)' }} />
        <span className="absolute -top-7 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap text-ink" style={{ left: xPos(stats.expected) + '%' }}>Avg {pct(stats.expected, 1)}</span>
        <div className="absolute top-0 h-3 w-0.5 bg-ink/40" style={{ left: xPos(0) + '%' }} />
        {marks.map((m, i) => (
          <div key={m.short} className="absolute -top-1.5 flex -translate-x-1/2 flex-col items-center" style={{ left: xPos(m.v) + '%' }} title={m.short + ': ' + pct(m.v, 0)}>
            <span className="text-[9px] leading-none font-bold text-critical-text">{i + 1}</span>
            <div className="mt-0.5 h-4 w-0.5 bg-[color:var(--critical)]" />
          </div>
        ))}
        <div className="tnum absolute -bottom-6 flex w-full justify-between text-[10px] text-muted">
          <span>−40%</span><span>−20%</span><span>0%</span><span>+20%</span><span>+30%</span>
        </div>
      </div>
      <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {marks.map((m, i) => (
          <li key={m.short} className="inline-flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded-full bg-critical-soft text-[9px] font-bold text-critical-text">{i + 1}</span>
            {m.short}: <strong className="tnum text-ink">{pct(m.v, 0)}</strong>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sandbox                                                              */
/* ------------------------------------------------------------------ */

const DEFAULTS = { stocks: 60, bonds: 35, dip: 20, start: 10000, monthly: 500 };
type State = typeof DEFAULTS;
const PRESETS: Preset<State>[] = [
  { label: 'Conservative (40/60)', values: { stocks: 40, bonds: 60 } },
  { label: 'Balanced (70/30)', values: { stocks: 70, bonds: 30 } },
  { label: 'Aggressive (90/10)', values: { stocks: 90, bonds: 10 } },
];
const MONTHS = 36;

function PortfolioSim() {
  const sim = useSim(DEFAULTS);
  const s = sim.state;
  const cash = Math.max(0, 100 - s.stocks - s.bonds);
  const stats = useMemo(() => mixStats({ stocks: s.stocks, bonds: s.bonds, cash }), [s.stocks, s.bonds, cash]);
  const dip = useMemo(() => simulateDip({ stocks: s.stocks, bonds: s.bonds, cash, dipPct: s.dip, start: s.start, monthly: s.monthly, months: MONTHS }), [s, cash]);
  const reb = useMemo(() => rebalance({ stocks: s.stocks, bonds: s.bonds, cash }, s.dip), [s.stocks, s.bonds, cash, s.dip]);
  const last = dip.points[dip.points.length - 1];
  const extraShares = (dip.sharesAtBottom / dip.sharesAtStart - 1) * 100;
  const fasterBy = dip.priceRecoveryMonth !== null && dip.steadyRecoveryMonth !== null ? dip.priceRecoveryMonth - dip.steadyRecoveryMonth : null;

  const setStocks = (v: number) => sim.setState((st) => ({ ...st, stocks: v, bonds: Math.min(st.bonds, 100 - v) }));
  const allocSegs: Segment[] = [
    { key: 's', label: 'Stocks', value: s.stocks, color: 'var(--s1)' },
    { key: 'b', label: 'Bonds', value: s.bonds, color: 'var(--s2)' },
    { key: 'c', label: 'Cash', value: cash, color: 'var(--s3)' },
  ];
  const driftSegs: Segment[] = [
    { key: 's', label: 'Stocks', value: reb.drift.stocks, color: 'var(--s1)' },
    { key: 'b', label: 'Bonds', value: reb.drift.bonds, color: 'var(--s2)' },
    { key: 'c', label: 'Cash', value: reb.drift.cash, color: 'var(--s3)' },
  ];
  const sellFrom = [reb.sellBonds > 0.5 ? usd(reb.sellBonds) + ' of bonds' : null, reb.sellCash > 0.5 ? usd(reb.sellCash) + ' of cash' : null].filter(Boolean).join(' and ');
  const wentUnder = dip.points.some((p) => p.steady < p.invested - 1);

  return (
    <SimCard title="Portfolio Mix & Market Drop Simulator" sim={sim} presets={PRESETS}
      subtitle="See how your mix of stocks, bonds and cash rides out a market drop."
      guide={{
        how: ['Pick a preset, or set your own mix.', 'Choose how far stocks fall.', 'Compare the steady investor to the panic seller.'],
        tryThis: [
          { label: 'Go 90% stocks. How bad is a 2008-style year?', done: (st) => st.stocks >= 90 },
          { label: 'Cut stocks to 30% or less. Watch the swings shrink.', done: (st) => st.stocks <= 30 },
          { label: 'Make the drop 40% or deeper. Compare steady vs. panic.', done: (st) => st.dip >= 40 },
        ],
      }}>
      <div className="space-y-8">
        <SimGrid controls={
          <ControlGroup title="Your mix">
            <SliderField label="Stocks" value={s.stocks} onChange={setStocks} min={0} max={100} step={5} format={(v) => v + '%'} />
            <SliderField label="Bonds" value={s.bonds} onChange={sim.set('bonds')} min={0} max={100 - s.stocks} step={5} format={(v) => v + '%'} help={'Cash fills the rest: ' + cash + '%'} />
          </ControlGroup>
        }>
          <div className="rounded-xl border border-line p-4">
            <p className="mb-3 text-sm font-semibold text-ink">Your <Term id="asset-allocation">asset allocation</Term></p>
            <SegmentBar segments={allocSegs} total={100} format={(v) => v + '%'} ariaLabel="Stocks, bonds and cash allocation" />
            <SegmentLegend segments={allocSegs} total={100} format={(v) => v + '%'} />
          </div>
          <StatGrid>
            <StatTile label="Assumed long-run return" value={pct(stats.expected, 1) + '/yr'} sub="average, not every year" emphasis />
            <StatTile label="Typical-year range" value={pct(stats.typicalLow, 0) + ' to ' + pct(stats.typicalHigh, 0)} sub={'swings of about ±' + pct(stats.vol, 0)} />
            <StatTile label="A 2008-style year" value={pct(stats.y2008, 0)} sub={'$10,000 becomes ' + usd(10000 * (1 + stats.y2008 / 100))} />
          </StatGrid>
          <RangeLine stats={stats} />
        </SimGrid>

        <div className="border-t border-line pt-6">
          <h4 className="text-base font-semibold text-ink">Live through a market drop</h4>
          <p className="mt-1 text-sm text-ink-2">Stocks fall for 6 months, stay low for 3, then recover. You keep investing the same amount each month. That's <Term id="dca">dollar-cost averaging</Term>.</p>
          <div className="mt-4">
            <SimGrid controls={
              <ControlGroup title="The scenario">
                <SliderField label="Stock market drop" value={s.dip} onChange={sim.set('dip')} min={10} max={50} step={5} format={(v) => '−' + v + '%'} help="A drop of 20% or more is a bear market." />
                <SliderField label="Starting portfolio" value={s.start} onChange={sim.set('start')} min={0} max={100000} step={1000} format={(v) => usd(v)} />
                <SliderField label="Invested every month" value={s.monthly} onChange={sim.set('monthly')} min={50} max={2000} step={50} format={(v) => usd(v)} />
              </ControlGroup>
            }>
              <StatGrid cols={4}>
                <StatTile label="Your mix falls" value={pct(-(100 - dip.bottomPrice), 1)} sub={'stocks −' + s.dip + '%, softened by bonds & cash'} />
                <StatTile label="Shares per $ at the bottom" value={'+' + pct(extraShares, 0)} sub={num(dip.sharesAtStart, 2) + ' → ' + num(dip.sharesAtBottom, 2) + ' shares'} emphasis />
                <StatTile label="Back above what you invested" value={dip.steadyRecoveryMonth !== null ? 'Month ' + dip.steadyRecoveryMonth : wentUnder ? 'Not yet' : 'Never dipped below'} sub={dip.priceRecoveryMonth !== null ? 'price back at old high: month ' + dip.priceRecoveryMonth : 'price still recovering'} />
                <StatTile label="Steady vs. panic seller" value={usd(last.steady - last.panic, { sign: true })} sub={'after ' + MONTHS + ' months'} />
              </StatGrid>

              <ChartFrame title="Your portfolio's share price" subtitle={'Mix of ' + s.stocks + '/' + s.bonds + '/' + cash + ' (stocks/bonds/cash), indexed to 100'} height={210}
                table={{ columns: ['Month', 'Price', 'Shares bought'], rows: dip.points.filter((p) => p.month % 3 === 0).map((p) => [p.month, num(p.price, 1), num(p.sharesBought, 2)]) }}>
                <LineChart data={dip.points} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" type="number" domain={[0, MONTHS]} ticks={[0, 6, 12, 18, 24, 30, 36]} tickFormatter={(v) => 'Mo ' + v} {...xAxisProps} />
                  <YAxis domain={['auto', 'auto']} tickFormatter={(v) => num(v, 0)} {...yAxisProps} width={40} />
                  <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Month ' + l} valueFormat={(v) => usd(v, { cents: true })} extra={(l) => { const p = dip.points[Number(l)]; return p && p.sharesBought > 0 ? <>{usd(s.monthly)} bought <strong className="text-ink">{num(p.sharesBought, 2)} shares</strong></> : null; }} />} />
                  <ReferenceLine y={100} stroke="var(--axis)" label={{ value: 'Starting price', position: 'insideTopRight', fill: 'var(--axis-text)', fontSize: 11 }} />
                  <Line type="monotone" dataKey="price" name="Share price" stroke="var(--s1)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
                  <ReferenceDot x={dip.bottomMonth} y={dip.bottomPrice} r={5} fill="var(--s1)" stroke="var(--surface)" strokeWidth={2} label={{ value: 'Bottom: shares on sale', position: 'bottom', fill: 'var(--ink-2)', fontSize: 11 }} />
                </LineChart>
              </ChartFrame>

              <ChartFrame title="Your portfolio's value" subtitle="Steady investor vs. someone who sells at the bottom and buys back after the recovery" height={260}
                legend={[{ label: 'Steady investor', color: 'var(--s1)' }, { label: 'Panic seller', color: 'var(--s2)' }, { label: 'Total invested', color: 'var(--s-neutral-2)', dashed: true }]}
                table={{ columns: ['Month', 'Invested', 'Steady', 'Panic seller'], rows: dip.points.filter((p) => p.month % 3 === 0).map((p) => [p.month, usd(p.invested), usd(p.steady), usd(p.panic)]) }}>
                <LineChart data={dip.points} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" type="number" domain={[0, MONTHS]} ticks={[0, 6, 12, 18, 24, 30, 36]} tickFormatter={(v) => 'Mo ' + v} {...xAxisProps} />
                  <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
                  <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Month ' + l} valueFormat={(v) => usd(v)} order={['Steady investor', 'Panic seller', 'Total invested']} />} />
                  <Line type="monotone" dataKey="invested" name="Total invested" stroke="var(--s-neutral-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="panic" name="Panic seller" stroke="var(--s2)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
                  <Line type="monotone" dataKey="steady" name="Steady investor" stroke="var(--s1)" strokeWidth={2.5} dot={false} activeDot={activeDot} isAnimationActive={false} />
                </LineChart>
              </ChartFrame>

              <Nudge tone="good" title="Why steady investors bounce back before the market does">
                At the bottom, each {usd(s.monthly)} bought <strong>{pct(extraShares, 0)} more shares</strong>. So your average cost per share (<strong>{usd(dip.avgCost, { cents: true })}</strong>) ends up below the average price ({usd(dip.avgPrice, { cents: true })}).
                {fasterBy !== null && fasterBy > 0 && <> You were back above what you put in by month {dip.steadyRecoveryMonth}, <strong>{fasterBy} months before</strong> the price got back to its old high.</>}
                {' '}The panic seller ends {usd(Math.abs(last.steady - last.panic))} {last.steady >= last.panic ? 'behind' : 'ahead'}. Selling turned a temporary drop into a <Term id="permanent-loss">permanent loss</Term>.
              </Nudge>
            </SimGrid>
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <h4 className="text-base font-semibold text-ink"><Term id="rebalancing">Rebalancing</Term>: buy low, sell high on autopilot</h4>
          <p className="mt-1 text-sm text-ink-2">On a $10,000 portfolio, a {s.dip}% stock drop pushes your mix off target. Rebalancing moves it back.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line p-4">
              <p className="mb-2 text-xs font-semibold text-ink-2">Target mix</p>
              <SegmentBar segments={allocSegs} total={100} height={30} format={(v) => v + '%'} ariaLabel="Target allocation" />
              <p className="mt-4 mb-2 text-xs font-semibold text-ink-2">After the drop ({usd(reb.afterDrop.total)})</p>
              <SegmentBar segments={driftSegs} total={100} height={30} format={(v) => num(v, 0) + '%'} ariaLabel="Allocation after the drop" />
              <SegmentLegend segments={driftSegs} total={100} format={(v) => num(v, 1) + '%'} />
            </div>
            <div className="flex flex-col justify-center rounded-xl bg-accent-soft p-5">
              {s.stocks === 0 || s.stocks === 100 ? (
                <p className="text-sm text-ink">With {s.stocks}% stocks there's nothing to rebalance. You need a mix for rebalancing to work.</p>
              ) : (
                <>
                  <p className="text-xs font-semibold tracking-wide text-accent-text uppercase">The rebalancing trade</p>
                  <p className="mt-2 text-lg font-semibold text-ink">Sell {sellFrom || 'a little of what held up'} → buy {usd(reb.buyStocks)} of stocks</p>
                  <p className="mt-2 text-sm text-ink-2">You sell what held up and buy what's on sale. No predictions needed. When stocks recover, that {usd(reb.buyStocks)} rides the rebound.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */

const DROPS = [
  ['Dot-com bust (2000–02)', '−49%', '~4.5 years'],
  ['Global financial crisis (2007–09)', '−57%', '~4 years'],
  ['COVID crash (2020)', '−34%', '~5 months'],
  ['Inflation & rate shock (2022)', '−25%', '~15 months'],
];

export const questions: QuizQuestion[] = [
  {
    id: 'drop-25y',
    scenario: <>Stocks just fell <strong>20%</strong>. You retire in <strong>25 years</strong>, you're 80% stocks, and you invest $500 every paycheck. Your $60,000 is now about $50,400. The news is grim.</>,
    prompt: 'What do you do?',
    options: [
      { text: 'Keep investing as planned. Rebalance back to 80/20 if the drop knocked you off target.', correct: true, why: <>With a 25-year <Term id="time-horizon">time horizon</Term>, this is <Term id="volatility">volatility</Term>, not a loss. Every dollar you put into stocks now buys about <strong>25% more shares</strong>. Every big U.S. drop so far has recovered, even 2008's −57%, within about 4 years of the bottom.</> },
      { text: 'Sell everything and wait in cash until things calm down.', why: <>Selling makes the ~<strong>$9,600</strong> paper loss permanent. "Calm" usually returns <em>after</em> prices rebound. In 2020, the market hit its old high about 5 months after the bottom, while headlines were still scary.</> },
      { text: 'Pause contributions until the market recovers.', why: <>That skips buying at the lowest prices. Restart later and you pay full price for shares you could have had at 20% off.</> },
    ],
  },
  {
    id: 'drop-2y',
    scenario: <>You retire in <strong>2 years</strong> and you're still <strong>90% stocks</strong>. Stocks just fell 20%, so your $500,000 is now about <strong>$410,000</strong>. Soon you'll need to withdraw about $30,000 a year.</>,
    prompt: "What's the wisest move?",
    options: [
      { text: 'Stay 90% stocks. It always recovers eventually.', why: <>"Eventually" may not mean within 2 years. After 2000 and 2008, recovery took <strong>4+ years</strong> from the bottom. Your <Term id="risk-capacity">risk capacity</Term> is low because you'll soon <em>sell</em> to pay your bills, maybe at low prices.</> },
      { text: "Don't panic-sell at the low. Take the next few years of withdrawals from bonds and cash. Use new money and rebalancing to shift toward a safer mix as markets recover.", correct: true, why: <>This avoids locking in losses and fixes the real problem: a mix built for 25 years away, not 2. Keep ~2–3 years of withdrawals (<strong>$60,000–$90,000</strong>) in bonds and cash, and you never have to sell stocks in a slump.</> },
      { text: 'Sell all stocks now to stop the bleeding.', why: <>This makes a ~<strong>$90,000</strong> paper loss permanent and gives up the rebound. The time to lower risk was before the drop. Now, lower it gradually, without selling everything at the bottom.</> },
    ],
  },
  {
    id: 'rebalance',
    scenario: <>Your target is <strong>70% stocks / 30% bonds</strong>. After a 20% stock drop, your $10,000 is now <strong>$8,630</strong>. Your mix has drifted to about <strong>65/35</strong>.</>,
    prompt: 'What does rebalancing tell you to do?',
    options: [
      { text: 'Sell about $441 of bonds and buy $441 of stocks to get back to 70/30.', correct: true, why: <>Right. <Term id="rebalancing">Rebalancing</Term> sells what held up (bonds) and buys what's on sale (stocks), with no forecasting. A simple rule, like "once a year or when anything drifts 5+ points," keeps emotion out of it.</> },
      { text: 'Sell stocks to stop further losses, maybe going to 50/50.', why: <>That's selling low, the opposite of rebalancing. If stocks recover, you'd own less of the rebound.</> },
      { text: 'Wait until stocks recover, then rebalance.', why: <>By then stocks have bounced back, so there's nothing cheap to buy. Rebalancing pays off when you act while prices are <em>down</em>.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Activity, title: 'Volatility is temporary. Selling makes it permanent.', body: <>A drop in a diversified portfolio is only on paper until you sell. Plan so you never <em>have</em> to sell stocks in a slump.</> },
  { icon: Target, title: 'Set your mix by when you need the money.', body: <>First ask when you need the money (risk <strong>capacity</strong>). Then ask how big a swing you can stomach without selling (risk <strong>tolerance</strong>).</> },
  { icon: Repeat, title: 'Rebalance on a schedule and keep buying through drops.', body: <>Rebalance once a year or at <strong>±5 points</strong> of drift. Investing every month buys more shares when prices fall.</> },
];

export default function RiskModule() {
  const A = ASSUMPTIONS;
  return (
    <ModuleLayout
      id="risk"
      hook={<>You open your retirement app. Your balance is down <strong>$9,000</strong> this month, and headlines say "worst week since 2020." Your thumb hovers over <em>Sell</em>. Do you protect what's left, or hold steady?</>}
      concept={
        <>
          <Lead>Prices bouncing up and down is <Term id="volatility">volatility</Term>, the normal cost of long-term growth. Lasting loss usually comes from panic selling, not from the bounce.</Lead>

          <Analogy icon={Plane}>
            Volatility is turbulence on a long flight. It's bumpy and scary, but the plane still lands.
            A <Term id="permanent-loss">permanent loss</Term> is bailing out mid-flight. The turbulence was never the real danger.
          </Analogy>

          <GoDeeper title="Paper loss vs. real loss">
            <p>Say your $10,000 falls to $8,000. You still own the same shares. The $2,000 loss is only on paper.</p>
            <p>It becomes a <Term id="permanent-loss">permanent loss</Term> in two ways. You sell while prices are low. Or what you own truly goes to zero.</p>
            <p>That second danger is why <Term id="diversification">diversification</Term> matters. One company can fail for good. A broad <Term id="index-fund">index fund</Term> holds hundreds of companies. For it to hit zero, nearly all of them would have to fail at once.</p>
            <p>After the dot-com bust, many single tech stocks never came back. The broad market did.</p>
          </GoDeeper>

          <H3>Two kinds of "how much risk can I take?"</H3>
          <Compare
            left={{ title: 'Risk tolerance (your stomach)', body: <><Term id="risk-tolerance">Risk tolerance</Term> is how big a swing you can watch without panicking. If a 30% drop would make you sell, yours is lower than you think.</> }}
            right={{ title: 'Risk capacity (your calendar)', body: <><Term id="risk-capacity">Risk capacity</Term> is how much risk you can afford. It mostly depends on your <Term id="time-horizon">time horizon</Term>. Money for 30 years from now can ride out storms. A down payment due next year can't.</> }}
          />

          <GoDeeper title="Find your own risk level in 4 questions">
            <p>Answer these in order. Then go with the more careful answer.</p>
            <Bullets items={[
              <><strong>When do I need this money?</strong> Money needed in the next few years should take little risk. Money for 10+ years away can ride out more swings.</>,
              <><strong>What would a drop feel like in dollars?</strong> If your $20,000 fell 30%, you'd see $14,000. Could you keep investing?</>,
              <><strong>Do I have a safety net?</strong> An <Term id="emergency-fund">emergency fund</Term> means a job loss won't force you to sell stocks low.</>,
              <><strong>Which answer is lower?</strong> If your calendar says "go bold" but your stomach says "no way," pick a mix you'll actually stick with.</>,
            ]} />
          </GoDeeper>

          <P>Your <Term id="asset-allocation">asset allocation</Term> is how you split your money between stocks, bonds and cash.</P>
          <P>More stocks means more growth and a bumpier ride. More bonds and cash means a smoother ride and slower growth.</P>

          <Example title="A 60/35/5 mix in a 2008-style year">
            <p>Start with $10,000: 60% stocks, 35% bonds, 5% cash. Use 2008's returns.</p>
            <Bullets items={[
              <>Stocks: $6,000 × −37% = −$2,220. Now <strong>$3,780</strong>.</>,
              <>Bonds: $3,500 × +5% = +$175. Now <strong>$3,675</strong>.</>,
              <>Cash: $500 × +1.5% = +$7.50. Now <strong>$507.50</strong>.</>,
              <>Total: $3,780 + $3,675 + $507.50 = <strong>$7,962.50</strong>. That's a drop of about 20%.</>,
            ]} />
            <p>All in stocks, the same $10,000 would have fallen 37%, to $6,300. Bonds and cash softened the blow by almost half.</p>
          </Example>

          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-ink">Big U.S. stock drops and how long they took to recover</p>
            <p className="text-xs text-muted">S&P 500 price, peak to bottom, and roughly how long it took to climb from the bottom back to the old high.</p>
            <DataTable maxHeight={260} spec={{ columns: ['Event', 'Drop', 'Recovery from bottom'], rows: DROPS }} />
            <p className="mt-2 text-xs text-ink-2">Each one felt permanent at the time. A <Term id="correction">correction</Term> (−10% to −20%) comes every year or two on average. A <Term id="bear-market">bear market</Term> (−20% or worse) comes every several years.</p>
          </div>

          <GoDeeper title="What to do on a scary market day">
            <p>Feeling scared is normal. The goal isn't to feel nothing. It's to not act on the fear.</p>
            <Bullets items={[
              <><strong>Look at your date, not the news.</strong> If you need the money in 10+ years, most of the story is still ahead.</>,
              <><strong>Leave automatic investing on.</strong> This month's money buys more shares than last month's.</>,
              <><strong>Check your balance less often.</strong> Once a month or once a quarter is plenty.</>,
              <><strong>Follow your rebalancing rule.</strong> It's a planned move, not a panic move.</>,
              <><strong>Want less risk for good?</strong> Shift slowly, using new money, instead of selling everything at the bottom.</>,
            ]} />
          </GoDeeper>

          <H3>Two habits that turn drops into opportunities</H3>
          <Compare
            left={{ title: 'Rebalancing', body: <><Term id="rebalancing">Rebalancing</Term> means resetting to your target mix now and then. After stocks fall, that means buying stocks. It's "buy low, sell high" on autopilot.</> }}
            right={{ title: 'Dollar-cost averaging', body: <><Term id="dca">Dollar-cost averaging</Term> means investing the same amount on a schedule, like every paycheck. When prices fall, the same dollars buy <em>more</em> shares.</> }}
          />

          <GoDeeper title="How to rebalance, step by step">
            <Bullets items={[
              <><strong>Write down your target,</strong> like 70% stocks and 30% bonds.</>,
              <><strong>Pick a rule:</strong> once a year, or when anything drifts 5+ points from target.</>,
              <><strong>Check your split.</strong> Say a stock drop left you at 65/35.</>,
              <><strong>Fix it the easy way first.</strong> Send new money to whatever is below target.</>,
              <><strong>Still off?</strong> Sell some of what's above target and buy what's below.</>,
            ]} />
            <p>Tip: in a regular taxable account, selling at a gain can mean <Term id="capital-gains">capital gains</Term> tax. Rebalancing inside retirement accounts like a 401(k) or IRA avoids that. Some all-in-one funds rebalance for you.</p>
          </GoDeeper>

          <Example title="Same $100 a month, a bumpy price">
            <p>You invest $100 a month for three months. The price goes $10, then $5, then back to $10.</p>
            <Bullets items={[
              <>Month 1: $100 ÷ $10 = <strong>10 shares</strong>.</>,
              <>Month 2: $100 ÷ $5 = <strong>20 shares</strong>. Shares were on sale.</>,
              <>Month 3: $100 ÷ $10 = <strong>10 shares</strong>.</>,
              <>Total: $300 bought 40 shares. Your average cost is $300 ÷ 40 = <strong>$7.50</strong>, below the $8.33 average price.</>,
            ]} />
            <p>Now 40 shares × $10 = <strong>$400</strong>. The price ended where it started, yet you're $100 ahead. Buying through the dip did that.</p>
          </Example>

          <Mistakes items={[
            <>Checking your balance every day during a drop. It makes selling feel urgent.</>,
            <>Pausing your monthly investing when prices fall. That's when your money buys the most.</>,
            <>Keeping money you'll need in a year or two mostly in stocks.</>,
            <>Judging your risk tolerance on a calm day. Picture a real dollar drop instead.</>,
          ]} />

          <UnderTheHood>
            <Formula note={'Teaching assumptions here: stocks ' + A.stocks.expected + '% avg / ' + A.stocks.vol + '% volatility; bonds ' + A.bonds.expected + '% / ' + A.bonds.vol + '%; cash ' + A.cash.expected + '% / ' + A.cash.vol + '%.'}>Expected return = Σ (weightᵢ × expected returnᵢ)</Formula>
            <Formula note={'ρ = stock–bond correlation (' + A.stockBondCorrelation + ' here). Stocks and bonds often move differently, so mixing them cuts risk more than it cuts return.'}>Volatility σₚ = √(w_s²σ_s² + w_b²σ_b² + 2·w_s·w_b·ρ·σ_s·σ_b)</Formula>
            <Formula note="On a bell curve, about 2 in 3 years land within ±1σ. Real markets have more extreme years than that.">Typical-year range ≈ expected ± σ  ·  1-in-20 bad year ≈ expected − 1.65σ</Formula>
            <Formula note="You buy more shares when prices are low. So your average cost (the harmonic mean of prices) is always ≤ the simple average price.">DCA average cost per share = Total invested ÷ Total shares bought</Formula>
            <p><strong className="text-ink">Recovery math is lopsided:</strong> after a 20% drop you need +25% to get back. After −50%, you need +100%. That's why bonds, which make drops shallower, matter more as you near the day you need the money.</p>
            <p><strong className="text-ink">Past bad years used here:</strong> 2008 (stocks −37%, U.S. bonds +5%, cash +1.5%) and 2022 (stocks −18%, bonds −13%: a rare year when both fell together).</p>
          </UnderTheHood>
        </>
      }
      sandbox={<PortfolioSim />}
      questions={questions}
      rules={rules}
    />
  );
}
