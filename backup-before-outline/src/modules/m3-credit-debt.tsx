import { useMemo } from 'react';
import { useMoney } from '../state/money';
import { myDebtPreset } from '../state/myPresets';
import { CreditCard, Gauge, Mountain, Snowflake, Flame, CalendarClock, Trophy, Receipt, TriangleAlert } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ModuleLayout } from '../components/ModuleLayout';
import { Term } from '../components/Glossary';
import { Analogy, Bullets, Compare, Example, Formula, GoDeeper, Lead, Mistakes, MythBuster, P, H3, UnderTheHood } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, type Segment } from '../components/SegmentBar';
import { ChartFrame, TooltipBox, activeDot, cursorProps, gridProps, xAxisProps, yAxisProps } from '../components/Chart';
import { cx } from '../components/ui';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { usd, pct, years, monthYear } from '../lib/format';
import { simulateCard, simulatePayoff, underwaterDebts, utilizationBand, type Debt, type PayoffResult } from '../lib/debt';

/* ------------------------------------------------------------------ */
/* Credit score factors (static visual)                                 */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Minimum-payment trap                                                 */
/* ------------------------------------------------------------------ */

const TRAP_DEFAULTS = { balance: 3000, apr: 24, fixed: 150 };
type TrapState = typeof TRAP_DEFAULTS;
const TRAP_PRESETS: Preset<TrapState>[] = [
  { label: 'Big balance: $8k at 27%', values: { balance: 8000, apr: 27, fixed: 300 } },
  { label: 'Store card: $1,200 at 30%', values: { balance: 1200, apr: 30, fixed: 75 } },
];

function MinimumTrap() {
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
    { key: 'shrink', name: 'Shrinking minimum', desc: 'interest + 1% of balance, $25 floor', r: shrink, color: 'var(--s2)' },
    { key: 'frozen', name: `Fixed ${usd(shrink.firstPayment)}/mo`, desc: "first month's minimum, never lowered", r: frozen, color: 'var(--s3)' },
    { key: 'mine', name: `Fixed ${usd(fixed)}/mo`, desc: 'your chosen payment', r: mine, color: 'var(--s1)' },
  ];
  return (
    <SimCard title="The Minimum-Payment Trap" kind="Mini sandbox" icon={TriangleAlert} sim={sim} presets={TRAP_PRESETS}
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
        <Nudge tone="warning" title="Why the minimum is a trap">
          Paying only the minimum takes <strong>{shrink.paidOff ? years(shrink.months) : '50+ years'}</strong> and costs <strong>{usd(shrink.totalInterest)}</strong> in interest.
          Keep paying the first month's {usd(shrink.firstPayment)} instead, and it drops to {years(frozen.months)} and {usd(frozen.totalInterest)}.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */
/* Debt payoff race                                                     */
/* ------------------------------------------------------------------ */

const DEFAULT_DEBTS: Debt[] = [
  { id: 'd1', name: 'Credit card', balance: 6000, apr: 24.9, minPayment: 180, active: true },
  { id: 'd2', name: 'Medical bill', balance: 1500, apr: 0, minPayment: 75, active: true },
  { id: 'd3', name: 'Car loan', balance: 11000, apr: 7.9, minPayment: 265, active: true },
];
const DEFAULTS = { debts: DEFAULT_DEBTS, extra: 50, limit: 10000 };
type State = typeof DEFAULTS;
const PRESETS: Preset<State>[] = [
  { label: 'Card + Student Loan', hint: 'Two debts where the two strategies disagree', values: { debts: [
    { id: 'd1', name: 'Credit card', balance: 8000, apr: 24.9, minPayment: 240, active: true },
    { id: 'd2', name: 'Student loan', balance: 6000, apr: 5.5, minPayment: 90, active: true },
    { ...DEFAULT_DEBTS[2], active: false },
  ], extra: 150, limit: 12000 } },
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

function UtilizationMeter({ balance, limit, onLimit }: { balance: number; limit: number; onLimit: (v: number) => void }) {
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
      <div className="mt-3 max-w-sm">
        <SliderField label="Total credit-card limit" value={limit} onChange={onLimit} min={1000} max={40000} step={500} format={(v) => usd(v)} />
      </div>
      <div className="mt-3">
        <Nudge tone={tone} title={band === 'excellent' ? 'Excellent: under 10%' : band === 'good' ? 'Good: under 30%' : band === 'fair' ? 'Fair: 30–49%' : 'High: 50%+'}>
          {u < 10 ? 'Scores tend to be highest in this zone.' : <>Getting the balance under <strong>{usd(limit * 0.3)}</strong> (30%) helps your score, and under <strong>{usd(limit * 0.1)}</strong> (10%) is ideal. Good news: it improves as soon as a lower balance is reported.</>}
        </Nudge>
      </div>
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
  const sim = useSim(DEFAULTS);
  const { data: myMoney } = useMoney();
  const mine = useMemo(() => myDebtPreset(myMoney), [myMoney]);
  const presets: Preset<State>[] = mine ? [...PRESETS, { label: 'My debts', hint: 'Your first three debts from My Money', values: mine }] : PRESETS;
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
  const card = s.debts[0];

  return (
    <SimCard title="Debt Payoff Race" sim={sim} presets={presets}
      subtitle="See which payoff plan gets you debt-free sooner and costs less interest."
      guide={{
        how: ['Edit your debts, or pick a preset.', 'Add extra money each month.', 'Compare debt-free dates and total interest.'],
        tryThis: [
          { label: 'Add $200 or more extra each month.', done: (st) => st.extra >= 200 },
          { label: 'Uncheck the medical bill. Do the plans still differ?', done: (st) => st.debts.some((d) => d.name === 'Medical bill' && !d.active) },
          { label: 'Get the card under 30% utilization.', done: (st) => st.limit > 0 && (st.debts[0]?.balance ?? 0) < st.limit * 0.3 },
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
              <Nudge tone="info" title="It's a tie here">With these numbers, both plans pick the same debt first, so they finish the same. Try the <em>Card + Student Loan</em> preset to see them differ.</Nudge>
            ) : (
              <Nudge tone="tip" title="Both plans win">
                Avalanche saves <strong>{usd(Math.abs(diff))}</strong> {diff > 0 ? '' : '(here Snowball is actually cheaper) '}in total interest, about {usd(Math.abs(diff) / Math.max(aval.months, 1))}/month.
                Snowball gets your first win {snow.order[0] && aval.order[0] && snow.order[0].month < aval.order[0].month ? <>at <strong>month {snow.order[0].month}</strong> instead of month {aval.order[0].month}</> : 'sooner'}.
                Either one beats paying minimums by <strong>{usd(mins.totalInterest - Math.max(aval.totalInterest, snow.totalInterest))}+</strong>. The best plan is the one you'll stick with.
              </Nudge>
            )}
          </>
        )}

        <UtilizationMeter balance={card.active ? card.balance : 0} limit={s.limit} onLimit={sim.set('limit')} />
      </div>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */

export const questions: QuizQuestion[] = [
  {
    id: 'card-vs-invest',
    scenario: <>You owe <strong>$5,000</strong> on a credit card at <strong>22% APR</strong>. You have an extra <strong>$500/month</strong>. A coworker says to invest it instead, since "the market averages 8%." (You already get your employer's full 401(k) match.)</>,
    prompt: 'Where should the $500/month go first?',
    options: [
      { text: 'Pay down the credit card until it is gone.', correct: true, why: <>Paying off a 22% card is a <strong>guaranteed 22% return</strong>, and no investment reliably beats that. At $500/month, the card is gone in about <strong>11 months</strong>. Then send the full $500 to investing.</> },
      { text: 'Invest it: 8% growth over decades beats paying off a card.', why: <>That's borrowing at <strong>22%</strong> to invest at a hoped-for <strong>8%</strong> that isn't guaranteed. Each $1,000 left on the card costs about $220 a year. Invested, it might earn $80.</> },
      { text: 'Split it: $250 to the card, $250 invested.', why: <>Better than investing it all, but at $250/month the card takes about <strong>25 months</strong>. That costs about <strong>$1,280</strong> in interest, roughly $700 more. The money you invest meanwhile would likely earn far less.</> },
      { text: 'Pay only the minimum and keep the rest in savings for flexibility.', why: <>Savings earn about 4% while the card charges 22%, so you lose about <strong>18% a year</strong> on every dollar. Once you have a starter emergency fund, put extra cash toward the card.</> },
    ],
  },
  {
    id: 'carry-balance',
    scenario: <>Your card's <Term id="statement-balance">statement balance</Term> is <strong>$640</strong> at 24% APR. A friend says to leave $50 unpaid so the card "shows activity" and builds your credit.</>,
    prompt: 'What should you pay?',
    options: [
      { text: 'The full $640 statement balance.', correct: true, why: <>Paying in full still shows you used the card and paid on time. Your score gets the same credit for <Term id="payment-history">payment history</Term> and low <Term id="credit-utilization">utilization</Term>, and you pay <strong>$0 interest</strong>. Carrying a balance only helps the bank.</> },
      { text: '$590, leaving $50 to show activity.', why: <>The $50 does nothing for your score but costs about $1/month in interest. Worse, on most cards, carrying <em>any</em> balance ends your interest-free grace period. New purchases can then charge interest right away.</> },
      { text: 'Just the $35 minimum, since you\'re "using" credit either way.', why: <>You'd pay about <strong>$12 in interest</strong> next month on the ~$605 left, and more each month it stays. On-time minimums protect your score, but no better than paying in full does.</> },
    ],
  },
  {
    id: 'snowball-avalanche',
    scenario: <>Take the sandbox's starting debts (a $6,000 card at 24.9%, a $1,500 medical bill at 0%, an $11,000 car loan at 7.9%) and add <strong>$150/month extra</strong>. Total interest: Avalanche <strong>$3,142</strong>, Snowball <strong>$3,433</strong>, minimums only <strong>$6,204</strong>. Both plans finish in month 33. Snowball clears the medical bill in month 7. Avalanche's first payoff comes in month 20.</>,
    prompt: 'Which takeaway is most accurate?',
    options: [
      { text: 'Avalanche is always the only smart choice.', why: <>It is the cheapest, by <strong>$291</strong> over about 3 years (about $9/month). But if an early win at month 7 keeps you going, Snowball's small extra cost is money well spent.</> },
      { text: 'Avalanche saves the most money, Snowball gives faster wins, and both crush minimum payments. Pick the one you\'ll stick with.', correct: true, why: <>Exactly. Either plan saves roughly <strong>$2,770–$3,060</strong> in interest and finishes about <strong>2 years sooner</strong> than minimums. The gap between the two plans is small. The gap between any plan and no plan is huge.</> },
      { text: 'Snowball saves more interest because you pay a debt off sooner.', why: <>Snowball does clear a debt sooner (month 7 vs. 20). But it leaves the 24.9% card growing longer, so total interest is <strong>$291 higher</strong>. A faster first win doesn't mean less interest.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: CreditCard, title: 'Pay your statement balance in full each month.', body: <>You build the same credit history and pay <strong>$0 interest</strong>. Carrying a balance never helps your score.</> },
  { icon: Gauge, title: 'Keep utilization under 30% (under 10% is ideal).', body: <>With a $10,000 total limit, keep your statement balance under <strong>$3,000</strong>. Under <strong>$1,000</strong> is even better.</> },
  { icon: Receipt, title: 'Beat the minimum with a plan.', body: <>Avalanche (highest APR first) saves the most. Snowball (smallest balance first) gives quick wins. Both beat minimum payments by thousands.</> },
];

export default function CreditDebtModule() {
  return (
    <ModuleLayout
      id="credit-debt"
      hook={<>You owe <strong>$6,000</strong> on a credit card at 24.9%, plus a <strong>$1,500</strong> medical bill and a car loan. A friend says to pay the smallest one first. A podcast says to attack the highest interest rate. Meanwhile, your card's minimum is only $180. That's fine… right?</>}
      concept={
        <>
          <Lead>Debt is renting money, and interest is the rent. The higher the rate and the longer you rent, the more you pay.</Lead>

          <H3>How your credit score works</H3>
          <P>Your <Term id="credit-score">credit score</Term> is a number, usually from 300 to 850. It shows lenders how reliably you pay back money.</P>
          <P>A higher score can get you lower rates. Five things drive it:</P>
          <ScoreFactors />
          <GoDeeper title="Building credit from scratch (or rebuilding it)">
            <p>Your score matters beyond loans. Landlords often check it. Some phone and utility companies use it to set a deposit.</p>
            <p>Here is a simple, low-cost way to build it:</p>
            <Bullets items={[
              <>Start with one card. A <strong>secured card</strong>, backed by a deposit you make, is a common first step.</>,
              <>Put one small bill on it that you already pay every month.</>,
              <>Set up autopay for the full <Term id="statement-balance">statement balance</Term>.</>,
              <>Check your credit reports at least once a year. They are free from each of the three big credit bureaus. Dispute any mistakes you find.</>,
            ]} />
            <p>Be patient with yourself. A score grows over months and years, not days.</p>
          </GoDeeper>

          <H3>APR vs. APY: why card interest costs more than it looks</H3>
          <P>Lenders quote <Term id="apr">APR</Term>, a simple yearly rate. But card interest is added every month, and that interest earns interest too.</P>
          <P>So the real yearly cost, called <Term id="apr-vs-apy">APY</Term>, is higher. A 24% APR costs about <strong className="text-ink">26.8%</strong> a year.</P>
          <GoDeeper title="How to pay $0 interest on a credit card">
            <p>Most cards have a <strong>grace period</strong>. Pay the full statement balance by the due date, and your purchases cost no interest at all.</p>
            <p>Carry a balance, and you usually lose that grace period. New purchases can start charging interest right away. Paying in full again brings it back, sometimes after a month or two.</p>
            <p>A few other rates to watch for:</p>
            <Bullets items={[
              <>A <strong>cash advance</strong> usually has a higher APR, an upfront fee, and no grace period.</>,
              <>Pay late, and some cards switch you to a higher <strong>penalty APR</strong>.</>,
              <>A <strong>0% intro APR</strong> ends on a set date. Any balance left after that gets the regular rate.</>,
            ]} />
          </GoDeeper>

          <Analogy title="The minimum payment is a treadmill">
            A <Term id="minimum-payment">minimum payment</Term> keeps you <em>moving</em>, but you barely get anywhere. It's mostly interest plus about 1% of your balance.
            As your balance shrinks, the minimum shrinks too. So the treadmill slows down just as you get close.
          </Analogy>
          <Example title="Where your first minimum payment goes">
            <p>Say you owe $3,000 on a card at 24% APR. Each month, the card charges 24% ÷ 12 = <strong>2%</strong> interest.</p>
            <Bullets items={[
              <>Interest this month: $3,000 × 2% = <strong>$60</strong>.</>,
              <>Minimum payment: $60 of interest + 1% of $3,000 ($30) = <strong>$90</strong>.</>,
              <>Only <strong>$30</strong> of that $90 shrinks your <Term id="principal">principal</Term>, the amount you borrowed. New balance: $2,970.</>,
              <>Next month's minimum is a bit lower: $59.40 + $29.70 = $89.10. So your progress slows down too.</>,
            ]} />
            <p>Pay a fixed $150 instead, and $150 − $60 = <strong>$90</strong> goes to principal. That's three times as much in month one.</p>
          </Example>
          <MinimumTrap />
          <GoDeeper title="Can't make a payment this month? What to do first">
            <p>It happens to lots of people, and it's fixable. Acting early gives you the most options.</p>
            <Bullets items={[
              <>Call the lender <strong>before</strong> the due date. Ask about a hardship plan, a lower payment, or a new due date.</>,
              <>Cover the basics first: housing, utilities, food, and getting to work.</>,
              <>Pay at least the minimum if you can. A missed payment usually isn't reported to the credit bureaus until it's 30 days late. A late fee can still apply sooner.</>,
              <>A nonprofit credit counseling agency can help you build a plan, often for free or a small fee.</>,
            ]} />
          </GoDeeper>

          <H3>Two proven ways out: Snowball vs. Avalanche</H3>
          <P>Both plans pay every minimum first. Then every extra dollar goes to one target debt.</P>
          <P>When that debt is gone, its payment "rolls" into the next one. Your payment keeps growing, like a snowball.</P>
          <Compare
            left={{ title: 'Debt Snowball: smallest balance first', body: <>The <Term id="debt-snowball">Snowball</Term> gives you quick wins, which helps many people stick with it. It costs a bit more interest.</> }}
            right={{ title: 'Debt Avalanche: highest APR first', body: <>The <Term id="debt-avalanche">Avalanche</Term> always costs the least interest. Your first win can take longer if your highest-rate debt is also big.</> }}
          />

          <Example title="How the rollover works, using the sandbox debts">
            <p>You owe on a credit card, a medical bill and a car loan. The minimums add up to $180 + $75 + $265 = <strong>$520</strong>. Add $50 extra, and you pay <strong>$570</strong> a month.</p>
            <Bullets items={[
              <><strong>Snowball</strong> targets the smallest debt, the $1,500 medical bill. It gets its $75 minimum plus the $50 extra: $125 a month.</>,
              <>The medical bill has 0% interest, so it's gone in <strong>12 months</strong> ($1,500 ÷ $125 = 12).</>,
              <>In month 13, that $125 rolls onto the card. The card now gets $180 + $125 = <strong>$305</strong> a month.</>,
              <>When the card is gone, all $570 goes to the car loan.</>,
            ]} />
            <p>You never pay more than $570. Each payoff just points the same money at fewer debts. <strong>Avalanche</strong> works the same way, but it sends the extra $50 to the 24.9% card first.</p>
          </Example>
          <GoDeeper title="Picking a plan: quick answers">
            <p><strong>Not sure which to choose?</strong> If quick wins keep you going, try Snowball. If you're steady and the rates are far apart, Avalanche saves more.</p>
            <p><strong>Save first, or pay debt first?</strong> Many people build a small starter emergency fund first. Then a surprise bill doesn't land back on the card.</p>
            <p><strong>What about 0% debts?</strong> Pay the minimum on time, every time. Watch for "deferred interest" deals. Miss the payoff deadline, and they can charge all the interest back.</p>
            <p><strong>Can I get a lower rate?</strong> You can call your card company and ask. Balance transfers and consolidation loans can also help, but check their fees first.</p>
          </GoDeeper>

          <MythBuster myth={'"You need to carry a small balance on your card to build credit."'}>
            Paying your <Term id="statement-balance">statement balance</Term> in full builds <em>exactly</em> the same credit history. Lenders see on-time payments and low utilization either way. A balance just adds interest.
          </MythBuster>

          <Mistakes items={[
            <>Treating the minimum as the goal. It's the <strong>floor</strong>, not the plan.</>,
            <>Closing your oldest no-fee card. That can shorten your history and raise your utilization.</>,
            <>Missing a due date in a busy month. Autopay for at least the minimum is an easy safety net.</>,
            <>Applying for several cards at once to "build credit fast." Each application can cost a few points.</>,
          ]} />

          <UnderTheHood>
            <Formula note="Example: $6,000 × 24.9% ÷ 12 = $124.50 of interest in month one. Most cards actually use a daily rate, but the result is very close.">Monthly interest = Balance × APR ÷ 12</Formula>
            <Formula note="24% APR → (1.02)¹² − 1 = 26.8% effective yearly cost.">Effective annual rate (APY) = (1 + APR ÷ 12)¹² − 1</Formula>
            <Formula note="r = APR ÷ 12, B = balance, P = fixed payment. If P ≤ r × B, the debt never shrinks.">Months to pay off = −ln(1 − r·B ÷ P) ÷ ln(1 + r)</Formula>
            <Formula note="A common issuer formula. Some use 2–3% of the balance instead.">Minimum = max($25, interest + 1% × balance)</Formula>
            <p><strong className="text-ink">Utilization</strong> = total card balances ÷ total card limits, checked overall and per card. It uses the balance your card <em>reports</em> (usually your statement balance), so paying before the statement closes can lower it.</p>
            <p><strong className="text-ink">Rollover is the secret:</strong> in this sandbox, Snowball and Avalanche keep your monthly debt budget the same. With "Minimums only," freed-up payments go back into spending, which is why it takes so much longer.</p>
          </UnderTheHood>
        </>
      }
      sandbox={<DebtRace />}
      questions={questions}
      rules={rules}
    />
  );
}
