import { useMemo, type ReactNode } from 'react';
import { useMoney } from '../state/money';
import { myBudgetPreset } from '../state/myPresets';
import { Wallet, Repeat, Shuffle, PiggyBank, Compass, Receipt, Car, Gift, Tv, Stethoscope, ArrowDownToLine } from 'lucide-react';
import { ModuleLayout } from '../components/ModuleLayout';
import { Term } from '../components/Glossary';
import { Analogy, Bullets, ConceptCards, Example, Formula, GoDeeper, Lead, Mistakes, MythBuster, P, H3, UnderTheHood } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { Switch, Button } from '../components/ui';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { usd, pct } from '../lib/format';
import { paycheck } from '../lib/tax';

/* ------------------------------------------------------------------ */
/* Paycheck decoder (gross -> net)                                      */
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
    { label: 'Push Needs past 50%, but still save 20%.', done: (s) => s.takeHome > 0 && s.needs > s.takeHome * 0.5 && s.savings >= s.takeHome * 0.2 && leftToAssign(s) >= -0.5 },
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
  if (P(s.needs) > 50.5) nudges.push({ tone: 'warning', title: `Needs are ${pct(P(s.needs), 0)} of take-home`, body: <>Very common, especially with high rent. 50% is a guide, not a law, and a 60/20/20 split still protects your future.</> });
  if (P(s.savings) < 10 && left > -0.5) nudges.push({ tone: 'info', title: 'Savings under 10%', body: <>Even a small, automatic amount builds the habit. Could {usd(Math.min(100, Math.max(25, s.wants * 0.1)))} move from wants to savings?</> });
  if (left > 0.5) nudges.push({ tone: 'tip', title: `${usd(left)} still needs a job`, body: <>Money without a job tends to disappear. Send it to savings, a sinking fund, or guilt-free fun.</> });
  if (nudges.length === 0) nudges.push({ tone: 'good', title: 'Every dollar has a job', body: <>Your plan matches your take-home pay exactly. That's called "zero-based" budgeting.</> });

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
            <SliderField label={<span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: 'var(--s3)' }} />Savings & extra debt</span>} value={s.savings} onChange={sim.set('savings')} min={0} max={maxSlider} step={25} format={(v) => usd(v)} help="Emergency fund, retirement, payments above the minimum" />
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
          <StatTile label="Wants" value={pct(P(s.wants), 0)} sub="guide: ~30%" />
          <StatTile label="Savings & debt" value={pct(P(s.savings), 0)} sub="guide: ~20%" />
          <StatTile label={left >= -0.5 ? 'Left to assign' : 'Over budget by'} value={usd(Math.abs(left))} sub={left >= -0.5 ? 'give it a job' : 'trim something'} emphasis={Math.abs(left) < 0.5} />
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

/* ------------------------------------------------------------------ */
/* Decision check + cheat sheet                                         */
/* ------------------------------------------------------------------ */

export const questions: QuizQuestion[] = [
  {
    id: 'car-repair',
    scenario: <>Your brakes need a <strong>$600</strong> repair. You've saved $75/month for 8 months in a car <Term id="sinking-fund">sinking fund</Term>, so it holds exactly $600. Your credit card charges 24% <Term id="apr">APR</Term>, and you usually pay about $100/month on it.</>,
    prompt: 'How should you pay for the repair?',
    options: [
      { text: 'Pay from the car sinking fund, then keep the $75/month going.', correct: true, why: <>This is exactly what the fund is for. You pay <strong>$0 in interest</strong>, take on no new debt, and the fund refills in 8 months.</> },
      { text: 'Put it on the credit card and save the sinking fund "for a real emergency."', why: <>At 24% APR and $100/month, the $600 takes about <strong>7 months</strong> to pay off and costs about <strong>$46 in interest</strong>. Meanwhile, your fund just sits there. Car repairs are exactly what it's for.</> },
      { text: 'Pull it from your emergency fund instead.', why: <>It works, and it beats a credit card. But an emergency fund is for the <em>unexpected</em>, like a job loss. Car repairs are expected, so use the sinking fund and keep your safety net full.</> },
      { text: 'Skip the repair for a few months to avoid touching savings.', why: <>Brakes keep you safe, and repairs you put off usually grow. Worn brakes can damage other parts and turn a <strong>$600</strong> job into <strong>$1,000+</strong>. The money is already saved, so use it.</> },
    ],
  },
  {
    id: 'high-rent',
    scenario: <>You take home <strong>$5,200/month</strong> in a pricey city. Your needs (rent, bills, transit, groceries, minimum debt payments) come to <strong>$3,100 (60%)</strong>. The <Term id="rule-50-30-20">50/30/20 rule</Term> says needs "should" be $2,600.</>,
    prompt: "What's the healthiest way to use the 50/30/20 rule here?",
    options: [
      { text: 'Treat it as a starting point: accept about 60% needs for now, and trim wants to reach roughly 60/20/20.', correct: true, why: <>Exactly. 60/20/20 on $5,200 is <strong>$3,120 needs, $1,040 wants, $1,040 savings</strong>. You still save <strong>$12,480 a year</strong>. The rule is a guide, not a law.</> },
      { text: 'Stop saving until rent comes down.', why: <>Waiting could mean years with no progress. Even <strong>$500/month</strong> (about 10%) adds up to <strong>$6,000 a year</strong>. Saving a little beats saving nothing.</> },
      { text: 'Move somewhere with a 90-minute commute so needs hit exactly 50%.', why: <>Saving $500 on rent might add about $200/month in gas or transit, plus 60+ hours a month of commuting. Rethinking housing is fine, but bending your life to hit a percentage misses the point.</> },
      { text: 'Put the extra $500 of needs on a credit card each month.', why: <>That's <strong>$6,000 a year of new debt</strong> at around 24% APR. Spending more than you take home always gets paid back later, with interest. Trimming wants is the cheaper fix.</> },
    ],
  },
  {
    id: 'gross-net',
    scenario: <>Your offer letter says <strong>$60,000/year</strong>. You're apartment hunting and plan to budget around <strong>$5,000/month</strong> ($60,000 ÷ 12). You'll put 5% in a 401(k), pay $150/month for health insurance, and pay about 4% state tax.</>,
    prompt: 'What monthly number should your budget be built on?',
    options: [
      { text: '$5,000, because that is what you earn per month.', why: <>That's <Term id="gross-pay">gross pay</Term>. After income taxes, <Term id="fica">FICA</Term>, your 401(k) and insurance, you'd take home about <strong>$3,675</strong>. Budgeting on $5,000 means planning to spend $1,325 that never arrives.</> },
      { text: 'About $3,675, your estimated take-home pay.', correct: true, why: <>Yes. <Term id="net-pay">Take-home pay</Term> is the money you can actually spend. A $1,200 rent is 24% of gross but <strong>33% of take-home</strong>, and take-home is what counts.</> },
      { text: 'About $3,885: skip the 401(k) so more money lands in checking.', why: <>Skipping the 401(k) adds only about <strong>$210/month</strong>, not the full $250, because it was lowering your taxes. You'd also give up years of tax-advantaged growth, and maybe an employer match.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Wallet, title: 'Budget from take-home pay, not salary.', body: <>Plan with the money that actually arrives. A $60k salary is about <strong>$3,675/month</strong> to spend, not $5,000.</> },
  { icon: Compass, title: 'Use 50/30/20 as a guide, not a law.', body: <>If needs run high, trim wants before savings. Saving <strong>10–20%</strong> steadily beats a "perfect" split you give up on.</> },
  { icon: PiggyBank, title: 'Turn predictable "surprises" into sinking funds.', body: <>Divide the yearly cost by 12 and save that each month. $900 a year for car repairs is just <strong>$75/month</strong>.</> },
];

/* ------------------------------------------------------------------ */

export default function CashFlowModule() {
  return (
    <ModuleLayout
      id="cash-flow"
      hook={<>Payday: <strong>$2,000</strong> lands in your account. By the 25th, you're checking your balance before buying groceries. Then the car starts grinding, and the mechanic says <strong>$600</strong>. Sound familiar? You're not bad with money. Your money just doesn't have a plan yet.</>}
      concept={
        <>
          <Lead>A <Term id="budget">budget</Term> is a plan for your paycheck, made <em>before</em> you spend it. Think GPS, not diet: you pick where you're going, and it helps you get there.</Lead>
          <Analogy>
            Your paycheck is a pizza that shows up with slices missing. Taxes and insurance already took theirs.
            <Term id="gross-pay">Gross pay</Term> is the whole pizza. <Term id="net-pay">Take-home pay</Term> is what's left in the box.
            A budget decides who gets each slice <em>before</em> anyone starts grabbing.
          </Analogy>

          <H3>Step 1: Know what actually arrives</H3>
          <P>Taxes and <Term id="fica">FICA</Term> (Social Security and Medicare) come out before you get paid. So do <Term id="pre-tax-deduction">pre-tax deductions</Term>, like a 401(k) or health insurance.</P>
          <PaycheckDecoder />
          <Example title="Where a $5,000 month goes">
            <p>Say your salary is $60,000. That's $60,000 ÷ 12 = <strong>$5,000 a month</strong> before anything comes out. With the decoder's starting settings, here's what leaves first:</p>
            <Bullets items={[
              <>401(k) at 5%: $5,000 × 0.05 = <strong>$250</strong></>,
              <>Health insurance: <strong>$150</strong></>,
              <>State tax at 4%: ($5,000 − $250 − $150) × 0.04 = <strong>$184</strong></>,
              <>FICA at 7.65%: ($5,000 − $150) × 0.0765 ≈ <strong>$371</strong> (health insurance comes out first)</>,
              <>Federal income tax, from the 2026 brackets: about <strong>$370</strong></>,
            ]} />
            <p>Add the slices: $250 + $150 + $184 + $371 + $370 = $1,325. Then $5,000 − $1,325 = <strong>$3,675</strong>. That's the number to build your budget on.</p>
          </Example>
          <GoDeeper title="How to read your pay stub">
            <p>Your pay stub shows the same slices as the decoder. Check it in four steps:</p>
            <Bullets items={[
              <><strong>Find gross pay.</strong> This is your pay before anything comes out.</>,
              <><strong>Read each deduction.</strong> Look for federal and state tax, Social Security, Medicare, 401(k) and insurance.</>,
              <><strong>Find net pay.</strong> It should match the deposit in your bank account.</>,
              <><strong>Check the YTD column.</strong> YTD means "year to date." It adds up everything so far this year.</>,
            ]} />
            <p>Does something look off, like a wrong pay rate or a missing deduction? Ask your payroll or HR team. Mistakes happen, and they're easier to fix early.</p>
          </GoDeeper>

          <H3>Step 2: Sort your spending</H3>
          <ConceptCards items={[
            { icon: Repeat, title: 'Fixed expenses', body: <><Term id="fixed-expense">Fixed costs</Term> stay about the same each month, like rent, a car payment or your phone plan. They're hard to change fast, so choose them with care.</> },
            { icon: Shuffle, title: 'Variable expenses', body: <><Term id="variable-expense">Variable costs</Term> change with your choices, like groceries, gas and eating out. They're the easiest to cut when money is tight.</> },
          ]} />
          <P>Next, ask if each cost is a <Term id="needs-wants">need or a want</Term>. Needs keep your life running, and wants make it fun.</P>
          <GoDeeper title="Need or want? The tricky cases">
            <p>Lots of costs are part need, part want. Here's a good test: what's the simplest version that keeps your life running? That part is the need. Anything extra is a want.</p>
            <Bullets items={[
              <><strong>Phone:</strong> a basic plan is a need. The newest phone is a want.</>,
              <><strong>Food:</strong> groceries are a need. Takeout and meal kits are wants.</>,
              <><strong>Car:</strong> getting to work is a need. A pricier model is partly a want.</>,
              <><strong>Debt:</strong> minimum payments are needs. Anything extra goes in savings and debt.</>,
            ]} />
            <p>Wants aren't bad. Naming them just shows you what you could trim if money gets tight.</p>
          </GoDeeper>
          <P>
            The <Term id="rule-50-30-20">50/30/20 rule</Term> gives a simple split: about <strong className="text-ink">50% needs</strong>, <strong className="text-ink">30% wants</strong> and <strong className="text-ink">20% savings and extra debt payments</strong>.
            It's a starting point, not a law.
          </P>
          <GoDeeper title="When your numbers don't fit 50/30/20">
            <p>That's normal. The rule is a guide, so bend it to fit your life.</p>
            <Bullets items={[
              <><strong>High rent?</strong> Try 60/20/20. On $5,200 take-home, that's $3,120 needs, $1,040 wants and $1,040 savings.</>,
              <><strong>Can't save 20% yet?</strong> Start with what you can, even 5%. Then raise it by 1% every few months.</>,
              <><strong>Income changes month to month?</strong> Build your plan on a slow month. Save the extra from good months.</>,
              <><strong>Paid every two weeks?</strong> That's 26 checks a year, so most years two months bring three checks. Plan on two a month, and treat the third as a bonus for savings.</>,
            ]} />
          </GoDeeper>

          <H3>Step 3: Plan for the "surprises" that aren't surprising</H3>
          <P>Car repairs, gifts, yearly subscriptions and the dentist aren't real surprises. You know they're coming, just not every month.</P>
          <P>A <Term id="sinking-fund">sinking fund</Term> saves a little each month for these costs. $900 a year for car repairs becomes a calm <strong className="text-ink">$75/month</strong>.</P>
          <Example title="Four sinking funds, one monthly number">
            <p>List each yearly cost, then divide it by 12:</p>
            <Bullets items={[
              <>Car repairs: $900 ÷ 12 = <strong>$75/month</strong></>,
              <>Gifts and holidays: $600 ÷ 12 = <strong>$50/month</strong></>,
              <>Medical and dental copays: $300 ÷ 12 = <strong>$25/month</strong></>,
              <>Yearly subscriptions: $240 ÷ 12 = <strong>$20/month</strong></>,
            ]} />
            <p>Together: $75 + $50 + $25 + $20 = <strong>$170 a month</strong>, or $2,040 a year. Turn on sinking funds in the Paycheck Allocator to see these same numbers in a full plan.</p>
          </Example>
          <GoDeeper title="How to set up a sinking fund">
            <Bullets items={[
              <><strong>List the costs.</strong> Look through last year's bank statements for bills that came once or twice.</>,
              <><strong>Divide by the months you have.</strong> A $1,200 trip in 8 months needs $1,200 ÷ 8 = $150 a month.</>,
              <><strong>Automate it.</strong> Set a transfer for payday, so you don't have to remember.</>,
              <><strong>Keep it apart.</strong> Use a separate savings account, or labeled buckets if your bank offers them.</>,
              <><strong>Spend it without guilt.</strong> When the bill comes, that's what the money is for. Then keep saving to refill it.</>,
            ]} />
          </GoDeeper>

          <MythBuster myth={'"Budgeting means never buying coffee or anything fun."'}>
            A budget is <strong>permission</strong>, not punishment. Plan $60/month for coffee, and every latte is guilt-free.
            Spend on what <em>you</em> care about, and quietly cut what you don't.
          </MythBuster>

          <Mistakes items={[
            <>Building your budget on your salary instead of your <strong>take-home pay</strong>.</>,
            <>Forgetting costs that come once a year, like car registration or holiday gifts.</>,
            <>Leaving <strong>no</strong> money for fun. A plan that's too strict is hard to keep.</>,
            <>Quitting after one messy month. Every budget is a draft, so adjust it and keep going.</>,
          ]} />

          <UnderTheHood>
            <Formula note="Pre-tax deductions (like a traditional 401(k) or most work health plans) come out before income tax is figured.">
              Take-home = Gross − Income taxes − FICA − Pre-tax deductions − Post-tax deductions
            </Formula>
            <Formula note="Example: $5,200 take-home with $3,120 of needs → 60% needs.">
              Category % = Category $ ÷ Take-home $ × 100
            </Formula>
            <Formula note="Example: a $1,200 trip in 8 months → $150/month. Already have $300 saved? ($1,200 − $300) ÷ 8 = $112.50/month.">
              Sinking fund deposit = (Target − Already saved) ÷ Months until due
            </Formula>
            <p><strong className="text-ink">Zero-based budgeting</strong> means Needs + Wants + Savings + Sinking funds = Take-home. "Left to assign" hits exactly $0, so every dollar has a job, even if that job is "fun money."</p>
            <p><strong className="text-ink"><Term id="cash-flow">Cash flow</Term></strong> is money in − money out over a period. Positive cash flow fuels every other module in this course.</p>
          </UnderTheHood>
        </>
      }
      sandbox={<PaycheckAllocator />}
      questions={questions}
      rules={rules}
    />
  );
}
