import { useMemo } from 'react';
import { HandCoins, Scale, Droplets, PiggyBank, Landmark, HeartPulse, Briefcase, TrendingUp } from 'lucide-react';
import { ModuleLayout } from '../components/ModuleLayout';
import { Term } from '../components/Glossary';
import { Analogy, Bullets, ConceptCards, Example, Formula, GoDeeper, Lead, Mistakes, MythBuster, P, H3, Steps, UnderTheHood } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend } from '../components/SegmentBar';
import { DataTable } from '../components/Chart';
import { SegmentedControl, cx } from '../components/ui';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { usd, pct } from '../lib/format';
import { BRACKETS, LIMITS, MATCH_FORMULAS, STANDARD_DEDUCTION, TAX_YEAR, employerMatch, incomeTax, raiseImpact, tradVsRoth, type FilingStatus, type MatchFormula } from '../lib/tax';

/* ------------------------------------------------------------------ */
/* Bucket visual                                                        */
/* ------------------------------------------------------------------ */

interface BucketSpec { key: string; rate: number; from: number; to: number; base: number; extra: number; tax: number; marginal: boolean; deduction?: boolean; }

const compact = (n: number) => usd(n, { compact: true });

function bucketRange(b: BucketSpec): string {
  if (b.deduction) return 'first ' + compact(b.to);
  return Number.isFinite(b.to) ? compact(b.from) + '–' + compact(b.to) : compact(b.from) + '+';
}

function TaxBuckets({ buckets }: { buckets: BucketSpec[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[600px] items-start gap-2">
        {buckets.map((b) => {
          const cap = Number.isFinite(b.to - b.from) ? b.to - b.from : Math.max(250_000, (b.base + b.extra) * 1.6);
          const baseH = Math.min(100, (b.base / cap) * 100);
          const extraH = Math.min(100 - baseH, (b.extra / cap) * 100);
          const empty = b.base + b.extra <= 0;
          const name = b.deduction ? 'Standard deduction (0%)' : b.rate + '% bracket';
          const aria = name + ': ' + usd(b.base) + (b.extra > 0 ? ' plus ' + usd(b.extra) + ' from the raise' : '');
          return (
            <div key={b.key} className="flex flex-1 flex-col items-center">
              <p className={cx('mb-1 text-sm font-bold', b.marginal ? 'text-accent-text' : empty ? 'text-muted' : 'text-ink')}>{b.deduction ? '0%' : b.rate + '%'}</p>
              <div className={cx('relative h-36 w-full overflow-hidden rounded-b-2xl border-2 border-t-0 bg-surface-2/50', b.marginal ? 'border-accent' : 'border-line-strong')} role="img" aria-label={aria}>
                <div className="absolute inset-x-0 bottom-0 transition-[height] duration-300" style={{ height: baseH + '%', background: b.deduction ? 'var(--s3)' : 'var(--s1)', opacity: 0.85 }} />
                {b.extra > 0 && <div className="absolute inset-x-0 transition-[height,bottom] duration-300" style={{ bottom: baseH + '%', height: extraH + '%', background: 'var(--s2)' }} />}
                {!Number.isFinite(b.to) && <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-muted">no top</span>}
              </div>
              <p className="tnum mt-1.5 text-center text-[11px] leading-tight text-muted">{bucketRange(b)}</p>
              <p className={cx('tnum text-center text-[11px] font-semibold leading-tight', empty ? 'text-muted' : 'text-ink')}>{compact(b.base + b.extra)}</p>
              <p className="tnum text-center text-[11px] leading-tight text-ink-2">{b.deduction ? 'tax $0' : 'tax ' + compact(b.tax)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sandbox                                                              */
/* ------------------------------------------------------------------ */

const DEFAULTS = {
  income: 60000,
  status: 'single' as FilingStatus,
  raise: 0,
  contribution: 6000,
  yearsToRetire: 30,
  returnPct: 7,
  retireRate: 12,
  view: 'traditional' as 'traditional' | 'roth',
  yourPct: 6,
  formula: '50-6' as MatchFormula,
};
type State = typeof DEFAULTS;
const PRESETS: Preset<State>[] = [
  { label: '$45k Single', values: { income: 45000 } },
  { label: '$95k Raise Myth', hint: 'A $30k raise that crosses into the 24% bracket', values: { income: 95000, raise: 30000 } },
  { label: '401(k) Match First', hint: 'Contributing too little to get the full match', values: { income: 60000, yourPct: 2, formula: '100-4' } },
];

/** For the guide only: does Roth leave more per dollar of take-home? Same math and tie threshold as the sandbox. */
function rothWins(s: State): boolean {
  const t = tradVsRoth({ gross: s.income + s.raise, status: s.status, contribution: s.contribution, years: s.yearsToRetire, returnPct: s.returnPct, retireRatePct: s.retireRate });
  const trad = t.trad.afterTax / t.trad.takeHomeCost, roth = t.roth.afterTax / t.roth.takeHomeCost;
  return Math.abs(trad - roth) >= 0.005 && roth > trad;
}

function TaxSandbox() {
  const sim = useSim(DEFAULTS);
  const s = sim.state;
  const after = s.income + s.raise;
  const base = useMemo(() => incomeTax(s.income, s.status), [s.income, s.status]);
  const withRaise = useMemo(() => incomeTax(after, s.status), [after, s.status]);
  const r = useMemo(() => raiseImpact(s.income, s.raise, s.status), [s.income, s.raise, s.status]);
  const D = STANDARD_DEDUCTION[s.status];

  const buckets: BucketSpec[] = [
    { key: 'ded', rate: 0, from: 0, to: D, base: Math.min(s.income, D), extra: Math.min(after, D) - Math.min(s.income, D), tax: 0, marginal: withRaise.taxable <= 0, deduction: true },
    ...BRACKETS[s.status].map((b, i) => {
      const bb = base.buckets[i], ab = withRaise.buckets[i];
      return { key: String(b.rate), rate: b.rate, from: bb.from, to: bb.to, base: bb.filled, extra: ab.filled - bb.filled, tax: ab.tax, marginal: withRaise.taxable > 0 && withRaise.marginal === b.rate };
    }),
  ];
  const higherSlice = s.raise > 0 && withRaise.marginal > base.marginal ? buckets.filter((b) => !b.deduction && b.rate > base.marginal).reduce((a, b) => a + b.extra, 0) : 0;

  const tr = useMemo(() => tradVsRoth({ gross: after, status: s.status, contribution: s.contribution, years: s.yearsToRetire, returnPct: s.returnPct, retireRatePct: s.retireRate }), [after, s.status, s.contribution, s.yearsToRetire, s.returnPct, s.retireRate]);
  const perDollar = { trad: tr.trad.afterTax / tr.trad.takeHomeCost, roth: tr.roth.afterTax / tr.roth.takeHomeCost };
  const better = Math.abs(perDollar.trad - perDollar.roth) < 0.005 ? 'tie' : perDollar.trad > perDollar.roth ? 'traditional' : 'roth';

  const m = employerMatch(after, s.yourPct, s.formula);
  const matchSegs = [
    { key: 'you', label: 'Your contribution', value: m.yours, color: 'var(--s1)' },
    { key: 'match', label: 'Employer match (free)', value: m.match, color: 'var(--s3)' },
    { key: 'missed', label: 'Match left on the table', value: m.missed, color: 'var(--s-neutral)', ink: 'var(--ink)' },
  ];
  const cards = [
    { key: 'traditional' as const, title: 'Traditional', cost: tr.trad.takeHomeCost, value: tr.trad.afterTax, note: 'Saves ' + usd(tr.savingsPerYear) + '/yr in tax now. Taxed at ' + s.retireRate + '% when you withdraw.', per: perDollar.trad },
    { key: 'roth' as const, title: 'Roth', cost: tr.roth.takeHomeCost, value: tr.roth.afterTax, note: 'No tax break now. Retirement withdrawals are tax-free.', per: perDollar.roth },
  ];

  return (
    <SimCard title="Tax Bucket & Account Visualizer" sim={sim} presets={PRESETS}
      subtitle={'See how your pay is taxed in ' + TAX_YEAR + ', which account fits, and how to get your full match.'}
      guide={{
        how: ['Set your income and test a raise.', 'Compare Traditional and Roth below.', 'Check that you get the full match.'],
        tryThis: [
          { label: 'Add a raise that crosses into a higher bracket', done: (st) => st.raise > 0 && incomeTax(st.income + st.raise, st.status).marginal > incomeTax(st.income, st.status).marginal },
          { label: 'Make Roth win: expect a higher tax rate in retirement', done: (st) => rothWins(st) },
          { label: 'Load "401(k) Match First," then grab the full match', done: (st) => st.formula === '100-4' && st.yourPct >= 4 },
        ],
      }}>
      <div className="space-y-8">
        <SimGrid controls={
          <ControlGroup title="Your income">
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Filing status</p>
              <SegmentedControl label="Filing status" size="sm" value={s.status} onChange={sim.set('status')} options={[{ value: 'single', label: 'Single' }, { value: 'mfj', label: 'Married, joint' }]} />
            </div>
            <SliderField label={<>Gross income (<Term id="gross-pay">gross</Term>)</>} value={s.income} onChange={sim.set('income')} min={10000} max={300000} step={500} format={(v) => usd(v)} />
            <SliderField label="Test a raise" value={s.raise} onChange={sim.set('raise')} min={0} max={50000} step={500} format={(v) => (v ? '+' + usd(v) : '$0')} help="Orange water = the raise." />
          </ControlGroup>
        }>
          <StatGrid cols={4}>
            <StatTile label={<Term id="taxable-income">Taxable income</Term>} value={usd(withRaise.taxable)} sub={'after ' + usd(D) + ' standard deduction'} />
            <StatTile label="Federal income tax" value={usd(withRaise.tax)} sub="before credits" />
            <StatTile label={<Term id="marginal-rate">Marginal rate</Term>} value={withRaise.marginal + '%'} sub="on your next dollar" />
            <StatTile label={<Term id="effective-rate">Effective rate</Term>} value={pct(withRaise.effective, 1)} sub="tax ÷ gross income" emphasis />
          </StatGrid>
          <div className="rounded-xl border border-line p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Your income poured into the buckets</p>
              <ul className="flex flex-wrap gap-3 text-xs text-ink-2">
                <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: 'var(--s3)' }} />Standard deduction (untaxed)</li>
                <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: 'var(--s1)' }} />Taxed income</li>
                {s.raise > 0 && <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: 'var(--s2)' }} />The raise</li>}
              </ul>
            </div>
            <TaxBuckets buckets={buckets} />
            <p className="mt-2 text-xs text-muted sm:hidden">Swipe sideways to see every bracket →</p>
          </div>
          {s.raise > 0 ? (
            <Nudge tone="good" title={'The raise myth, busted: you keep ' + usd(r.kept) + ' of your ' + usd(s.raise) + ' raise'}>
              Income tax goes up {usd(r.after.tax - r.before.tax)} and FICA goes up {usd(r.ficaAfter - r.ficaBefore)}. Your take-home still rises from <strong>{usd(r.takeBefore)}</strong> to <strong>{usd(r.takeAfter)}</strong>
              {' '}({pct((r.kept / s.raise) * 100, 0)} of the raise).
              {higherSlice > 0 && <> Only <strong>{usd(higherSlice)}</strong> spilled into the {withRaise.marginal}% bucket. Everything below that line is taxed just like before.</>}
            </Nudge>
          ) : (
            <Nudge tone="info" title={'Marginal ' + base.marginal + '% ≠ effective ' + pct(base.effective, 1)}>
              Only your top dollars land in the {base.marginal}% bucket. The rest sits in cheaper buckets, so your overall rate is just {pct(base.effective, 1)}. Try the raise slider.
            </Nudge>
          )}
        </SimGrid>

        <div className="border-t border-line pt-6">
          <h4 className="text-base font-semibold text-ink">Traditional vs. Roth: pay tax now or later?</h4>
          <p className="mt-1 text-sm text-ink-2">Same savings, same investments. <Term id="traditional-account">Traditional</Term> cuts your tax today. <Term id="roth">Roth</Term> makes retirement withdrawals tax-free.</p>
          <div className="mt-4">
            <SimGrid controls={
              <ControlGroup title="Retirement saving">
                <SliderField label="Yearly contribution" value={s.contribution} onChange={sim.set('contribution')} min={500} max={LIMITS.k401} step={500} format={(v) => usd(v)} help={TAX_YEAR + ' limits: 401(k) ' + usd(LIMITS.k401) + ', IRA ' + usd(LIMITS.ira)} />
                <SliderField label="Years until retirement" value={s.yearsToRetire} onChange={sim.set('yearsToRetire')} min={5} max={45} step={1} format={(v) => v + ' yrs'} />
                <SliderField label="Expected return" value={s.returnPct} onChange={sim.set('returnPct')} min={3} max={10} step={0.5} format={(v) => pct(v, 1)} />
                <SliderField label="Your tax rate in retirement" value={s.retireRate} onChange={sim.set('retireRate')} min={0} max={37} step={1} format={(v) => v + '%'} help={'Today, contributions save you about ' + pct(tr.marginalOnContribution, 0) + ' (your current bracket).'} />
              </ControlGroup>
            }>
              <SegmentedControl label="Account type" value={s.view} onChange={sim.set('view')} options={[{ value: 'traditional', label: 'Traditional (pre-tax)' }, { value: 'roth', label: 'Roth (tax-free later)' }]} />
              <div className="grid gap-3 sm:grid-cols-2">
                {cards.map((c) => (
                  <button key={c.key} type="button" onClick={() => sim.set('view')(c.key)} aria-pressed={s.view === c.key}
                    className={cx('cursor-pointer rounded-xl border p-4 text-left transition-colors', s.view === c.key ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong')}>
                    <p className="flex items-center justify-between font-semibold text-ink">{c.title}{better === c.key && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink">Better here</span>}</p>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-2"><dt className="text-ink-2">Take-home cost today</dt><dd className="tnum font-semibold text-ink">{usd(c.cost)}/yr</dd></div>
                      <div className="flex justify-between gap-2"><dt className="text-ink-2">After-tax value at retirement</dt><dd className="tnum font-semibold text-ink">{usd(c.value)}</dd></div>
                      <div className="flex justify-between gap-2"><dt className="text-ink-2">Per $1 of take-home given up</dt><dd className="tnum font-semibold text-ink">{usd(c.per, { cents: true })}</dd></div>
                    </dl>
                    <p className="mt-2 text-xs text-muted">{c.note}</p>
                  </button>
                ))}
              </div>
              <Nudge tone="tip" title={better === 'tie' ? 'A tie, and that is the whole lesson' : better === 'traditional' ? 'Traditional wins when your rate is higher now' : 'Roth wins when your rate is lower now'}>
                {better === 'tie'
                  ? <>When your tax rate now equals your rate later, both accounts give you the same spending money.</>
                  : <>You'd save about {pct(tr.marginalOnContribution, 0)} now vs. pay {s.retireRate}% later. {better === 'traditional' ? 'Skipping the higher rate now and paying the lower rate later' : 'Paying the lower rate now instead of the higher rate later'} gives you {pct(Math.abs(perDollar.trad / perDollar.roth - 1) * 100, 0)} more retirement money per dollar of take-home. Not sure about the future? Many people split between both.</>}
              </Nudge>
            </SimGrid>
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <h4 className="text-base font-semibold text-ink">The employer match: the closest thing to free money</h4>
          <div className="mt-4">
            <SimGrid controls={
              <ControlGroup title="Your 401(k)">
                <SliderField label="You contribute" value={s.yourPct} onChange={sim.set('yourPct')} min={0} max={15} step={1} format={(v) => v + '% of pay'} />
                <div>
                  <p className="mb-1.5 text-sm font-medium text-ink"><Term id="employer-match">Match formula</Term></p>
                  <select value={s.formula} onChange={(e) => sim.set('formula')(e.target.value as MatchFormula)} aria-label="Employer match formula"
                    className="h-10 w-full cursor-pointer rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none">
                    {(Object.keys(MATCH_FORMULAS) as MatchFormula[]).map((k) => <option key={k} value={k}>{MATCH_FORMULAS[k].label}</option>)}
                  </select>
                </div>
              </ControlGroup>
            }>
              <StatGrid>
                <StatTile label="You put in" value={usd(m.yours) + '/yr'} sub={s.yourPct + '% of ' + usd(after)} />
                <StatTile label="Employer adds" value={usd(m.match) + '/yr'} sub={m.yours > 0 ? 'an instant ' + pct((m.match / m.yours) * 100, 0) + ' return' : 'contribute to unlock'} emphasis />
                <StatTile label="Left on the table" value={usd(m.missed) + '/yr'} sub={m.missed > 0 ? 'contribute ' + m.pctToMax + '% to get it all' : 'full match captured'} />
              </StatGrid>
              <div className="rounded-xl border border-line p-4">
                <SegmentBar segments={matchSegs} total={m.yours + m.maxMatch} format={usd} ariaLabel="Your contribution, employer match, and unclaimed match" />
                <SegmentLegend segments={matchSegs} total={m.yours + m.maxMatch} format={usd} />
              </div>
              {m.missed > 0 ? (
                <Nudge tone="warning" title={usd(m.missed) + ' a year of free money left unclaimed'}>
                  Raising your contribution to {m.pctToMax}% costs only about {usd(((m.pctToMax - s.yourPct) / 100) * after * (1 - base.marginal / 100) / 12)}/month in take-home (it's pre-tax) and unlocks the full {usd(m.maxMatch)}/yr match. Over 30 years at 7%, that missing match could grow to about <strong>{usd(m.missed * ((Math.pow(1.07, 30) - 1) / 0.07))}</strong>. Also check your plan's <Term id="vesting">vesting</Term> rules.
                </Nudge>
              ) : (
                <Nudge tone="good" title="Full match captured">That's step one of the order of operations, done. Extra dollars still save on tax, but they no longer get matched.</Nudge>
              )}
            </SimGrid>
          </div>
        </div>
      </div>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */

export const questions: QuizQuestion[] = [
  {
    id: 'raise-bracket',
    scenario: <>You're single, earning <strong>$64,000</strong>. You're offered a <strong>$5,000 raise</strong> to $69,000. That moves you from the 12% bracket into the <strong>22%</strong> bracket, which starts at $66,500 of salary for you. A friend warns you might "take home less."</>,
    prompt: 'What actually happens?',
    options: [
      { text: 'Take it: you keep about $3,768 of the $5,000.', correct: true, why: <>Only the top <strong>$2,500</strong> lands in the 22% bucket. Extra income tax is $2,500 × 12% + $2,500 × 22% = <strong>$850</strong>, plus about $383 FICA. You still take home about <strong>$3,768</strong> more.</> },
      { text: 'Decline it: all $69,000 would now be taxed at 22%.', why: <>That's the myth. Each bucket's rate applies only to the dollars inside that bucket. Your federal tax goes from about <strong>$5,500 to $6,350</strong>, not to the ~$11,600 that "everything at 22%" would mean.</> },
      { text: 'Ask for only $2,500 so you stay in the 12% bracket.', why: <>A $2,500 raise leaves you about <strong>$2,009</strong> after tax. The full $5,000 leaves you about <strong>$3,768</strong>. Crossing a bracket line never makes a raise "not worth it."</> },
    ],
  },
  {
    id: 'order-ops',
    scenario: <>You have <strong>$800/month</strong> to put to work. Your employer matches <strong>100% up to 4%</strong> of your $60,000 salary, but you contribute nothing yet. You owe <strong>$3,000 on a 24% card</strong>, and you have a 1-month starter emergency fund.</>,
    prompt: 'What should come first?',
    options: [
      { text: 'Contribute 4% to get the full match, then put the rest toward the card.', correct: true, why: <>4% is <strong>$200/month</strong>, and your employer adds <strong>$2,400/year</strong>. That instant 100% return beats even a 24% card. The remaining ~$620/month clears the card in about <strong>5 months</strong>.</> },
      { text: 'Max out a Roth IRA first: tax-free growth is the best deal.', why: <>Roth IRAs are great, just not yet. You'd skip a <strong>100% match</strong> while a <strong>24%</strong> card keeps charging about $60/month in interest. Roth comes after the match and high-interest debt.</> },
      { text: 'Pay off the card first, then start the 401(k) match.', why: <>Close! But the match is an instant 100% return, and the card costs 24% a year. Skipping the match for 5 months gives up ~<strong>$1,000</strong> of free money to save well under $100 of interest. Do both: match first, then the card.</> },
      { text: 'Open a taxable brokerage account and invest the $800.', why: <>A taxable account has no tax break and no match. You <em>might</em> earn ~7% while you're <em>sure</em> to pay 24% on the card. Taxable investing comes last.</> },
    ],
  },
  {
    id: 'roth-vs-trad',
    scenario: <>You're 24, earning <strong>$48,000</strong> (12% bracket). You expect to earn a lot more later, and guess you'll pay about <strong>22%</strong> in retirement. You'll save $5,000 a year.</>,
    prompt: 'Which account type likely fits best right now?',
    options: [
      { text: 'Roth: pay 12% now instead of 22% later.', correct: true, why: <>Traditional saves you $600 now (12% of $5,000). But its withdrawals get taxed at 22% later. Per dollar of take-home, Roth leaves about <strong>13% more</strong> to spend in retirement ((1 − 0.12) ÷ (1 − 0.22) ≈ 1.13).</> },
      { text: 'Traditional: always take the tax break when you can.', why: <>The break saves you only your <em>current</em> rate (12%). Withdrawals would be taxed at your <em>future</em> rate (22% here). That's a small discount now for a bigger bill later.</> },
      { text: "It doesn't matter: they always come out the same.", why: <>They only match when your tax rate now equals your rate in retirement. Here, 12% now vs. 22% later gives Roth the edge.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: TrendingUp, title: 'Only dollars above the line pay the higher rate.', body: <>A raise <strong>always</strong> raises your take-home. Your marginal rate hits only your top dollars, and your effective (overall) rate is usually far lower.</> },
  { icon: HandCoins, title: 'Grab the full employer match first.', body: <>It's an instant <strong>50–100% return</strong>. Then pay off high-interest debt, then fund a Roth IRA and/or HSA.</> },
  { icon: Scale, title: 'Low tax rate now? Roth. High rate now? Traditional.', body: <>Pay the tax in whichever stage your rate is lower. Not sure? <strong>Split</strong> your savings between both.</> },
];

function bracketRow(i: number, st: FilingStatus): string {
  const lo = i === 0 ? 0 : BRACKETS[st][i - 1].upTo;
  const hi = BRACKETS[st][i].upTo;
  return Number.isFinite(hi) ? usd(lo) + ' – ' + usd(hi) : 'over ' + usd(lo);
}

const EX_SALARY = 60000;

export default function TaxesModule() {
  const D = STANDARD_DEDUCTION.single;
  const ex = incomeTax(EX_SALARY, 'single');
  const [b1, b2] = ex.buckets;
  return (
    <ModuleLayout
      id="taxes"
      hook={<>You just got offered a <strong>$5,000 raise</strong>. A coworker warns, "Careful, that'll bump you into the next bracket and you'll take home less." HR also wants you to pick a Traditional or Roth 401(k) by Friday. Is your coworker right, and which account should you pick?</>}
      concept={
        <>
          <Lead>Taxes are simpler than they sound: each slice of your pay has its own rate. Some accounts even let you pick <em>when</em> you pay.</Lead>

          <Analogy icon={Droplets}>
            Picture tax brackets as a row of buckets. Your pay fills the first bucket, taxed at 0% thanks to the <Term id="standard-deduction">standard deduction</Term>.
            When it's full, the rest spills into the 10% bucket, then 12%, and so on. <strong>Each bucket's rate applies only to the water inside it.</strong>
          </Analogy>
          <P>
            Your top bucket's rate is your <Term id="marginal-rate">marginal rate</Term>. Your <Term id="effective-rate">effective rate</Term> is total tax ÷ total income, and it's always lower.
          </P>
          <P>
            In {TAX_YEAR}, a single filer's first <strong className="text-ink">{usd(D)}</strong> is free of federal income tax. The rest is <Term id="taxable-income">taxable income</Term>, and it fills the <Term id="tax-bracket">brackets</Term>.
          </P>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="mb-2 text-sm font-semibold text-ink">{TAX_YEAR} federal brackets (taxable income)</p>
            <DataTable maxHeight={400} spec={{ columns: ['Rate', 'Single', 'Married filing jointly'], rows: BRACKETS.single.map((b, i) => [b.rate + '%', bracketRow(i, 'single'), bracketRow(i, 'mfj')]) }} />
          </div>
          <Example title={'Federal tax on a ' + usd(EX_SALARY) + ' salary'}>
            <p>Here's the bucket math for a single filer in {TAX_YEAR}. These are the sandbox's starting numbers.</p>
            <Bullets items={[
              <>Taxable income: {usd(EX_SALARY)} − {usd(D)} standard deduction = <strong>{usd(ex.taxable)}</strong>.</>,
              <>{b1.rate}% bucket: the first {usd(b1.filled)} × {b1.rate}% = <strong>{usd(b1.tax)}</strong>.</>,
              <>{b2.rate}% bucket: the next {usd(b2.filled)} × {b2.rate}% = <strong>{usd(b2.tax)}</strong>.</>,
              <>Total tax: {usd(b1.tax)} + {usd(b2.tax)} = <strong>{usd(ex.tax)}</strong>.</>,
            ]} />
            <p>Your marginal rate is {ex.marginal}%. But your effective rate is {usd(ex.tax)} ÷ {usd(EX_SALARY)} ≈ <strong>{pct(ex.effective, 1)}</strong>.</p>
          </Example>

          <MythBuster myth={'"A raise can push me into a higher bracket so I take home less."'}>
            Not with federal income tax. Only the dollars <em>above</em> the bracket line pay the higher rate. Even crossing from 12% into 22%, you keep about <strong>70–80¢ of each new dollar</strong> after tax.
          </MythBuster>
          <GoDeeper title="Quick tax FAQ: deductions, credits, FICA and state tax">
            <p><strong>Deduction or credit?</strong> A deduction lowers the income you're taxed on. A credit cuts your tax bill directly. In the 12% bracket, a $1,000 deduction saves $120 ($1,000 × 12%). A $1,000 credit saves the full $1,000.</p>
            <p><strong>What's FICA?</strong> It's a separate tax on wages: 6.2% for Social Security plus 1.45% for Medicare. That's 7.65% in all. It's a flat rate, with a few limits at high incomes.</p>
            <p><strong>What about state tax?</strong> It depends on where you live. Some states use brackets, some use one flat rate, and a few have no income tax on wages.</p>
          </GoDeeper>

          <H3>Account types: choose when you pay tax</H3>
          <ConceptCards items={[
            { icon: PiggyBank, title: 'Traditional 401(k) / IRA', body: <>You save <Term id="pre-tax-deduction">pre-tax</Term> money, so you pay less tax now. You pay income tax when you take it out in retirement. <Term id="traditional-account">More on Traditional.</Term></> },
            { icon: Landmark, title: 'Roth 401(k) / IRA', body: <>You pay tax now. Then growth and retirement withdrawals are tax-free. {TAX_YEAR} limits: <Term id="ira">IRA</Term> {usd(LIMITS.ira)}, <Term id="k401">401(k)</Term> {usd(LIMITS.k401)}.</> },
            { icon: Briefcase, title: 'Taxable brokerage', body: <>A <Term id="taxable-account">taxable account</Term> has no tax break and no limits. You pay tax on dividends and <Term id="capital-gains">capital gains</Term>. But you can take money out anytime.</> },
            { icon: HeartPulse, title: 'HSA: the triple threat', body: <>An <Term id="hsa">HSA</Term> works with a high-deductible health plan. It's <strong>tax-free going in, while it grows, and coming out</strong> for medical costs. {TAX_YEAR} limit: {usd(LIMITS.hsaSelf)} self, {usd(LIMITS.hsaFamily)} family.</> },
          ]} />
          <Example title="Traditional vs. Roth, with $1,000">
            <p>Say your tax rate is 22% now and will be 12% in retirement. And say your savings grow to 4 times their size by then.</p>
            <Bullets items={[
              <><strong>Traditional:</strong> you put in $1,000 before tax. You skip $220 of tax, so it costs $780 of take-home. It grows to $4,000. You pay 12% ($480) when you take it out, so you keep <strong>$3,520</strong>.</>,
              <><strong>Roth:</strong> you put in the same $780 of take-home. It grows to $3,120 ($780 × 4). Withdrawals are tax-free, so you keep <strong>$3,120</strong>.</>,
            ]} />
            <p>Traditional wins by $400 here. You skipped 22% now and paid only 12% later. Flip the two rates, and Roth wins. Make them equal, and it's a tie.</p>
          </Example>
          <GoDeeper title="Traditional or Roth? How people often decide">
            <p>The core rule: pay the tax when your rate is lower. Nobody knows future tax rates for sure, so it's a best guess.</p>
            <Bullets items={[
              <><strong>Early career or lower income?</strong> Your rate may be low now, so Roth often fits.</>,
              <><strong>Peak earning years, higher bracket?</strong> Traditional's tax break is worth more now.</>,
              <><strong>Not sure?</strong> Split between both. Many 401(k) plans offer a Roth option.</>,
              <>Roth IRAs have income limits. Above a certain income, you can't put money in directly.</>,
              <>You can take out your Roth IRA <em>contributions</em> (not the growth) anytime, with no tax or penalty. Still, it's meant for retirement.</>,
            ]} />
          </GoDeeper>
          <GoDeeper title="Getting the most from an HSA">
            <p>You can only add money to an HSA while you're on a high-deductible health plan. But the money stays yours.</p>
            <Bullets items={[
              <>Unused money rolls over every year. There's no "use it or lose it."</>,
              <>It stays yours if you change jobs or health plans.</>,
              <>Many HSAs let you invest the balance, so it can grow for decades.</>,
              <>Save your medical receipts. You can usually pay yourself back later for costs after you opened the HSA.</>,
              <>After 65, you can use it for anything. Non-medical withdrawals are then taxed like a Traditional IRA.</>,
            ]} />
          </GoDeeper>

          <H3>The order of operations</H3>
          <Steps items={[
            { title: 'Starter emergency fund (about 1 month)', body: "So surprises don't become new debt." },
            { title: 'Get the full employer 401(k) match', body: <>The <Term id="employer-match">match</Term> is an instant 50–100% return. Nothing else comes close.</> },
            { title: 'Pay off high-interest debt (roughly 8%+)', body: 'Paying off a 24% card "earns" you 24%, guaranteed.' },
            { title: 'Finish your 3–6 month emergency fund', body: "Now a surprise won't force you to sell your investments." },
            { title: 'Roth IRA and/or HSA', body: 'Big tax breaks, and often better fund choices than your 401(k).' },
            { title: 'Save more in your 401(k), then use a taxable account', body: 'Fill tax-advantaged accounts before taxable ones.' },
          ]} />
          <GoDeeper title="How an employer match works">
            <p>A match formula has two parts: how much they add, and up to what share of your pay. Take "50% up to 6%" on a $60,000 salary.</p>
            <Bullets items={[
              <>You put in 6%: $60,000 × 6% = $3,600. They add half: <strong>$1,800</strong>.</>,
              <>You put in 3%: $60,000 × 3% = $1,800. They add half: <strong>$900</strong>.</>,
              <>You put in 10%: they still add <strong>$1,800</strong>. The match stops at 6%.</>,
            ]} />
            <p>To find your formula, check your plan summary or ask HR. Also ask about <Term id="vesting">vesting</Term>. You may need to stay a while before the match is fully yours.</p>
          </GoDeeper>
          <Mistakes items={[
            <>Turning down a raise to stay in a lower bracket. Only the new dollars pay the higher rate.</>,
            <>Mixing up your marginal rate with what you pay overall.</>,
            <>Saving less than it takes to get the full match. That's free money left behind.</>,
            <>Assuming one account type always wins. It depends on your tax rate now vs. later.</>,
          ]} />

          <UnderTheHood>
            <Formula note="fᵢ = dollars of taxable income in bracket i, rᵢ = that bracket's rate.">Tax = Σ (fᵢ × rᵢ)  ·  Effective rate = Tax ÷ Gross income</Formula>
            <Formula note="C = contribution, g = growth multiple (1 + r)ⁿ, t = tax rate. Order doesn't matter in multiplication, so equal rates give identical results.">Traditional: C × g × (1 − t_later)    vs.    Roth: C × (1 − t_now) × g</Formula>
            <Formula note="Applies to wages. Social Security stops above $184,500 of wages (2026). An extra 0.9% Medicare tax applies above $200,000 (single).">FICA = 6.2% Social Security + 1.45% Medicare</Formula>
            <p><strong className="text-ink">Simplifications in this sandbox:</strong> federal income tax only, with no state tax, credits or itemized deductions. It uses 2026 brackets and standard deductions. Traditional withdrawals are taxed at the flat retirement rate you pick. In real life, Roth IRA contributions phase out at higher incomes, and early withdrawals can bring taxes and penalties. Check current IRS rules.</p>
            <p><strong className="text-ink">HSA fine print:</strong> after 65, non-medical HSA withdrawals are taxed like a Traditional IRA, with no penalty. Before 65, they're taxed plus a 20% penalty.</p>
          </UnderTheHood>
        </>
      }
      sandbox={<TaxSandbox />}
      questions={questions}
      rules={rules}
    />
  );
}
