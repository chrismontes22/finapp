import { useMemo, type ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceDot, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Banknote, Check, CreditCard, Gift, HeartPulse, House, Landmark, ListOrdered, PiggyBank, Receipt,
  Scale, ShieldCheck, TrendingUp, Wallet,
} from 'lucide-react';
import { ChapterLayout } from '../components/ChapterLayout';
import { Term } from '../components/Glossary';
import { Bullets, Example, GoDeeper, H3, Mistakes, P, Steps } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { Switch, cx } from '../components/ui';
import { activeDot, cursorProps, gridProps, TooltipBox, xAxisProps, yAxisProps } from '../components/Chart';
import { endLabel, Figure, FlowDiagram, StatementMockup } from '../components/Figure';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { pct, usd } from '../lib/format';
import { LIMITS, MATCH_FORMULAS, TAX_YEAR, employerMatch, tradVsRoth, type FilingStatus, type MatchFormula } from '../lib/tax';

/** Balance after `years` of end-of-year deposits growing at `annualPct` a year. */
const futureValue = (yearly: number, annualPct: number, years: number) => {
  const r = annualPct / 100;
  return r === 0 ? yearly * years : yearly * ((Math.pow(1 + r, years) - 1) / r);
};

/* ================================================================== */
/* 6.1 The 401(k) match                                                */
/* ================================================================== */

const MATCH_SALARY = 60000;
const MATCH_DATA = Array.from({ length: 11 }, (_, p) => {
  return { pct: p, yours: MATCH_SALARY * p / 100, match: (MATCH_SALARY * Math.min(p, 5)) / 100 };
});

function MatchChart() {
  const li = MATCH_DATA.length - 1;
  const last = MATCH_DATA[li];
  return (
    <Figure
      title="What you put in and what your employer adds"
      subtitle="A $60,000 salary and a match of 100% on the first 5% of pay."
      legend={[{ label: 'You put in', color: 'var(--s1)' }, { label: 'Employer adds', color: 'var(--s2)' }]}
      height={300}
      table={{ columns: ['You contribute', 'You put in', 'Employer adds'], rows: MATCH_DATA.map((d) => [d.pct + '% of pay', usd(d.yours), usd(d.match)]) }}
      howToRead={[
        'The bottom axis is the share of your pay you contribute, from 0% to 10%. The side axis is dollars per year.',
        'The blue line is your contribution. The second line is what your employer adds.',
        'Find 5% on the bottom axis. The employer line stops rising there.',
      ]}
      takeaway={<>At 5% you put in <strong>$3,000</strong> and your employer adds <strong>$3,000</strong>, a 100% return on your contribution. At 10% you put in {usd(last.yours)}, but the employer still adds only <strong>{usd(last.match)}</strong>.</>}
      note="Illustrative formula. Your employer's formula may differ; check your plan's summary. Salary of $60,000 assumed."
    >
      <LineChart data={MATCH_DATA} margin={{ top: 16, right: 110, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="pct" type="number" domain={[0, 10]} ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} tickFormatter={(v) => v + '%'} {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'You contribute ' + l + '% of pay'} valueFormat={(v) => usd(v) + ' a year'} />} />
        <Line dataKey="yours" name="You put in" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'You ' + usd(last.yours, { compact: true }))} />
        <Line dataKey="match" name="Employer adds" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Employer ' + usd(last.match, { compact: true }))} />
        <ReferenceDot x={5} y={3000} r={5} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
      </LineChart>
    </Figure>
  );
}

function FormulaCompare() {
  const cards = (['100-3', '50-6'] as MatchFormula[]).map((k) => {
    const f = MATCH_FORMULAS[k];
    const m = employerMatch(MATCH_SALARY, f.cap, k);
    return { k, f, m };
  });
  return (
    <Figure
      kind="diagram"
      title="Two common match formulas"
      subtitle="Same $60,000 salary, each employee contributing just enough to get the full match."
      howToRead={[
        'Each card is one formula. The bar shows where the total 401(k) deposit comes from.',
        'The first color is your money. The second color is your employer\'s.',
        'Compare the cost to you with the employer dollars received.',
      ]}
      takeaway={<>Formula A costs you <strong>$1,800</strong> and adds $1,800. Formula B costs you <strong>$3,600</strong> and adds $1,800. Both give the same dollars, but B asks for twice as much from you.</>}
      note="Formulas vary by employer. Some match on a sliding scale or use different caps."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(({ k, f, m }, i) => {
          const segs: Segment[] = [
            { key: 'you', label: 'You', value: m.yours, color: 'var(--s1)' },
            { key: 'match', label: 'Employer', value: m.match, color: 'var(--s2)' },
          ];
          return (
            <div key={k} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Formula {i === 0 ? 'A' : 'B'}</p>
              <p className="mt-1 text-sm font-medium text-ink">{f.label}</p>
              <dl className="mt-3 space-y-1.5 text-[13px]">
                <div className="flex justify-between"><dt className="text-ink-2">Contribute to get it all</dt><dd className="tnum font-medium text-ink">{f.cap}% = {usd(m.yours)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-2">Employer adds</dt><dd className="tnum font-medium text-ink">{usd(m.match)}</dd></div>
                <div className="flex justify-between border-t border-line pt-1.5"><dt className="font-medium text-ink">Total deposited</dt><dd className="tnum font-semibold text-ink">{usd(m.yours + m.match)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-2">Employer cents per $1 you add</dt><dd className="tnum font-medium text-ink">{Math.round(f.rate * 100)} cents</dd></div>
              </dl>
              <div className="mt-3">
                <SegmentBar segments={segs} total={m.yours + m.match} format={usd} height={28} inside="value" ariaLabel={f.label + ': you ' + usd(m.yours) + ', employer ' + usd(m.match)} />
                <SegmentLegend segments={segs} total={m.yours + m.match} format={usd} />
              </div>
            </div>
          );
        })}
      </div>
    </Figure>
  );
}

const MATCH_DEFAULTS = { salary: 60000, yourPct: 2, formula: '100-4' as MatchFormula };
type MatchState = typeof MATCH_DEFAULTS;
const MATCH_PRESETS: Preset<MatchState>[] = [
  { label: 'Only 2% in', hint: 'Below the 4% needed for the full match', values: { yourPct: 2, formula: '100-4' } },
  { label: 'Full match', hint: 'Contribute 4% and capture all of it', values: { yourPct: 4, formula: '100-4' } },
  { label: '50% on 6%', hint: 'A smaller match that needs 6% from you', values: { yourPct: 3, formula: '50-6' } },
];
const MATCH_GUIDE: SimGuide<MatchState> = {
  how: ['Enter your salary and pick your employer\'s match formula.', 'Set the percent of pay you contribute.', 'Read how much of the match you capture and how much is unclaimed.'],
  tryThis: [
    { label: 'Raise your contribution until nothing is unclaimed', done: (s) => s.yourPct >= MATCH_FORMULAS[s.formula].cap },
    { label: 'Switch to the 50% on 6% formula and find the new target', done: (s) => s.formula === '50-6' },
    { label: 'Contribute 12%. Does the match keep growing?', done: (s) => s.yourPct >= 12 },
  ],
};

function MatchSim() {
  const sim = useSim(MATCH_DEFAULTS);
  const s = sim.state;
  const m = employerMatch(s.salary, s.yourPct, s.formula);
  const extraMonthly = ((m.pctToMax - s.yourPct) / 100) * s.salary / 12;
  const segs: Segment[] = [
    { key: 'you', label: 'Your contribution', value: m.yours, color: 'var(--s1)' },
    { key: 'match', label: 'Employer match', value: m.match, color: 'var(--s2)' },
    { key: 'missed', label: 'Unclaimed match', value: m.missed, color: 'var(--s-neutral)', ink: 'var(--ink)' },
  ];
  const total = m.yours + m.match + m.missed;
  return (
    <SimCard title="401(k) Match" kind="Mini sandbox" icon={Gift} sim={sim} presets={MATCH_PRESETS} guide={MATCH_GUIDE}
      subtitle="See how much match you capture at each contribution level.">
      <SimGrid controls={
        <ControlGroup title="Your 401(k)">
          <SliderField label="Salary" value={s.salary} onChange={sim.set('salary')} min={20000} max={250000} step={1000} format={(v) => usd(v)} />
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
          <StatTile label="You put in" value={usd(m.yours) + '/yr'} sub={s.yourPct + '% of ' + usd(s.salary)} />
          <StatTile label="Employer adds" value={usd(m.match) + '/yr'} sub={m.yours > 0 ? pct((m.match / m.yours) * 100, 0) + ' of what you put in' : 'contribute to unlock'} emphasis />
          <StatTile label="Unclaimed match" value={usd(m.missed) + '/yr'} sub={m.missed > 0 ? 'contribute ' + m.pctToMax + '% to claim it' : 'full match captured'} />
        </StatGrid>
        <div className="rounded-xl border border-line p-4">
          <SegmentBar segments={segs} total={total} format={usd} ariaLabel="Your contribution, employer match and unclaimed match" />
          <SegmentLegend segments={segs} total={total} format={usd} />
        </div>
        {m.missed > 0 ? (
          <Nudge tone="warning" title={usd(m.missed) + ' a year of match is unclaimed'}>
            Raising your contribution to {m.pctToMax}% adds about {usd(extraMonthly)} a month before tax and unlocks the full {usd(m.maxMatch)} a year. Left unclaimed for 30 years and invested at 7%, that match would have grown to about <strong>{usd(futureValue(m.missed, 7, 30))}</strong>. Also check your plan's <Term id="vesting">vesting</Term> rules.
          </Nudge>
        ) : (
          <Nudge tone="good" title="You are capturing the full match">
            {s.yourPct > m.pctToMax
              ? 'Contributions above ' + m.pctToMax + '% earn no extra match. Whether to put in more depends on the steps in section 6.4.'
              : 'You contribute exactly ' + m.pctToMax + '% and receive the full ' + usd(m.maxMatch) + ' a year. Check your plan\'s vesting rules to see when the match becomes yours.'}
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 6.2 Traditional vs. Roth                                            */
/* ================================================================== */

function TaxTimeline() {
  return (
    <Figure
      kind="diagram"
      title="When you pay the tax"
      subtitle="The same $6,000 contribution, taxed at different times."
      howToRead={[
        'Each row follows one account from left to right: contribution, growth, withdrawal.',
        'The highlighted box in each row is the moment the tax is paid.',
        'Compare what happens at the withdrawal stage.',
      ]}
      takeaway={<>With Traditional you pay tax on the <strong>withdrawal</strong>, which includes all the growth. With Roth you pay tax on the <strong>contribution</strong> and nothing on the growth.</>}
    >
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-2">Traditional: skip the tax now, pay it later</p>
          <FlowDiagram label="Traditional: contribution untaxed, growth untaxed, withdrawal taxed" steps={[
            { icon: Banknote, title: 'Today: contribute $6,000', detail: 'Taxed income falls by $6,000, so you skip tax on it this year.' },
            { icon: TrendingUp, title: 'Years of growth', detail: 'No tax while the money stays in the account.' },
            { icon: Receipt, title: 'Retirement: withdraw', detail: 'Every dollar you withdraw is taxed as income.', emphasis: true },
          ]} />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-2">Roth: pay the tax now, withdraw tax-free</p>
          <FlowDiagram label="Roth: contribution taxed, growth untaxed, withdrawal untaxed" steps={[
            { icon: Banknote, title: 'Today: contribute $6,000', detail: 'You pay tax on this income now. No deduction.', emphasis: true },
            { icon: TrendingUp, title: 'Years of growth', detail: 'No tax while the money stays in the account.' },
            { icon: Wallet, title: 'Retirement: withdraw', detail: 'Qualified withdrawals, including all growth, are tax-free.' },
          ]} />
        </div>
      </div>
    </Figure>
  );
}

const CROSS_INPUT = { gross: 60000, status: 'single' as FilingStatus, contribution: 6000, years: 30, returnPct: 7 };
const CROSS_NOW = tradVsRoth({ ...CROSS_INPUT, retireRatePct: 0 });
const CROSS_RATE = Math.round(CROSS_NOW.marginalOnContribution);
const CROSS_DATA = Array.from({ length: 31 }, (_, rate) => {
  const t = tradVsRoth({ ...CROSS_INPUT, retireRatePct: rate });
  return { rate, trad: +(t.trad.afterTax / t.trad.takeHomeCost).toFixed(2), roth: +(t.roth.afterTax / t.roth.takeHomeCost).toFixed(2) };
});

function CrossoverChart() {
  const li = CROSS_DATA.length - 1;
  const last = CROSS_DATA[li];
  const first = CROSS_DATA[0];
  const at = CROSS_DATA[CROSS_RATE];
  return (
    <Figure
      title="Retirement spending per $1 of take-home pay given up"
      subtitle={'A $60,000 single filer in ' + TAX_YEAR + ' contributes $6,000 a year for 30 years. Your tax rate in retirement is on the bottom axis.'}
      legend={[{ label: 'Traditional', color: 'var(--s1)' }, { label: 'Roth', color: 'var(--s2)' }]}
      height={300}
      table={{ columns: ['Tax rate in retirement', 'Traditional', 'Roth'], rows: CROSS_DATA.filter((d) => d.rate % 3 === 0 || d.rate === CROSS_RATE).map((d) => [d.rate + '%', usd(d.trad, { cents: true }), usd(d.roth, { cents: true })]) }}
      howToRead={[
        'The bottom axis is the tax rate you will pay on withdrawals. The side axis is dollars you can spend after tax for each $1 of take-home pay you gave up.',
        'The Roth line is flat because Roth withdrawals are not taxed.',
        'The circle marks where the lines meet: the rate you save at today.',
      ]}
      takeaway={<>Today a Traditional contribution saves you about <strong>{CROSS_RATE}%</strong>. If your rate in retirement is above {CROSS_RATE}%, Roth is ahead (at 30%: {usd(last.roth, { cents: true })} vs. {usd(last.trad, { cents: true })}). Below it, Traditional is ahead (at 0%: {usd(first.trad, { cents: true })} vs. {usd(first.roth, { cents: true })}). At {CROSS_RATE}% they are equal.</>}
      note="Illustrative. Assumes 7% average yearly growth, $60,000 salary, single filing status and the 2026 federal brackets. Ignores state tax."
    >
      <LineChart data={CROSS_DATA} margin={{ top: 16, right: 130, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="rate" type="number" domain={[0, 30]} ticks={[0, 5, 10, 15, 20, 25, 30]} tickFormatter={(v) => v + '%'} {...xAxisProps} />
        <YAxis domain={[(min: number) => Math.floor(min / 10) * 10, (max: number) => Math.ceil(max / 10) * 10]} tickFormatter={(v) => usd(v)} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Tax rate in retirement: ' + l + '%'} valueFormat={(v) => usd(v, { cents: true })} />} />
        <Line dataKey="trad" name="Traditional" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Traditional ' + usd(last.trad, { cents: true }))} />
        <Line dataKey="roth" name="Roth" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Roth ' + usd(last.roth, { cents: true }), -8)} />
        <ReferenceDot x={CROSS_RATE} y={at.roth} r={5} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
      </LineChart>
    </Figure>
  );
}

const TR_DEFAULTS = { income: 60000, status: 'single' as FilingStatus, contribution: 6000, years: 30, returnPct: 7, retireRate: 12 };
type TrState = typeof TR_DEFAULTS;

function compareAccounts(s: TrState) {
  const tr = tradVsRoth({ gross: s.income, status: s.status, contribution: s.contribution, years: s.years, returnPct: s.returnPct, retireRatePct: s.retireRate });
  const per = { trad: tr.trad.afterTax / tr.trad.takeHomeCost, roth: tr.roth.afterTax / tr.roth.takeHomeCost };
  const better: 'tie' | 'traditional' | 'roth' = Math.abs(per.trad - per.roth) < 0.005 ? 'tie' : per.trad > per.roth ? 'traditional' : 'roth';
  return { tr, per, better };
}

const TR_PRESETS: Preset<TrState>[] = [
  { label: 'Same rate later', hint: 'About 12% now and 12% in retirement', values: { retireRate: 12 } },
  { label: 'Higher rate later', hint: 'Your income and rates rise', values: { retireRate: 24 } },
  { label: 'Lower rate later', hint: 'High income now, lower income in retirement', values: { income: 120000, retireRate: 12 } },
];
const TR_GUIDE: SimGuide<TrState> = {
  how: ['Set your income and how much you contribute each year.', 'Set the tax rate you expect to pay in retirement.', 'Compare the two cards and read which account leaves more per $1 of take-home pay.'],
  tryThis: [
    { label: 'Make Roth win by raising your retirement tax rate', done: (s) => compareAccounts(s).better === 'roth' },
    { label: 'Make Traditional win by lowering it', done: (s) => compareAccounts(s).better === 'traditional' },
    { label: 'Find the rate where the two are equal', done: (s) => compareAccounts(s).better === 'tie' },
  ],
};

function TraditionalVsRothSim() {
  const sim = useSim(TR_DEFAULTS);
  const s = sim.state;
  const { tr, per, better } = useMemo(() => compareAccounts(s), [s]);
  const cards = [
    { key: 'traditional', title: 'Traditional', cost: tr.trad.takeHomeCost, value: tr.trad.afterTax, per: per.trad, note: 'Saves ' + usd(tr.savingsPerYear) + ' a year in tax now. Taxed at ' + s.retireRate + '% when you withdraw.' },
    { key: 'roth', title: 'Roth', cost: tr.roth.takeHomeCost, value: tr.roth.afterTax, per: per.roth, note: 'No tax break now. Withdrawals are tax-free.' },
  ];
  return (
    <SimCard title="Traditional vs. Roth" kind="Mini sandbox" icon={Scale} sim={sim} presets={TR_PRESETS} guide={TR_GUIDE}
      subtitle="Same savings, same investments. The only difference is when the tax is paid.">
      <SimGrid controls={
        <ControlGroup title="Your numbers">
          <SliderField label={<>Gross pay today (<Term id="gross-pay">gross</Term>)</>} value={s.income} onChange={sim.set('income')} min={20000} max={300000} step={1000} format={(v) => usd(v)} />
          <SliderField label="Yearly contribution" value={s.contribution} onChange={sim.set('contribution')} min={500} max={LIMITS.k401} step={500} format={(v) => usd(v)} help={TAX_YEAR + ' limits: 401(k) ' + usd(LIMITS.k401) + ', IRA ' + usd(LIMITS.ira)} />
          <SliderField label="Years until retirement" value={s.years} onChange={sim.set('years')} min={5} max={45} step={1} format={(v) => v + ' yrs'} />
          <SliderField label="Average yearly growth" value={s.returnPct} onChange={sim.set('returnPct')} min={3} max={10} step={0.5} format={(v) => pct(v, 1)} />
          <SliderField label="Your tax rate in retirement" value={s.retireRate} onChange={sim.set('retireRate')} min={0} max={37} step={1} format={(v) => v + '%'} help={'Today a Traditional contribution saves you about ' + pct(tr.marginalOnContribution, 0) + '.'} />
        </ControlGroup>
      }>
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.key} className={cx('rounded-xl border p-4', better === c.key ? 'border-accent bg-accent-soft' : 'border-line bg-surface')}>
              <p className="flex items-center justify-between font-semibold text-ink">{c.title}{better === c.key && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink">Ahead here</span>}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-2"><dt className="text-ink-2">Take-home cost today</dt><dd className="tnum font-semibold text-ink">{usd(c.cost)} a year</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-2">After-tax value at retirement</dt><dd className="tnum font-semibold text-ink">{usd(c.value)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-2">Per $1 of take-home given up</dt><dd className="tnum font-semibold text-ink">{usd(c.per, { cents: true })}</dd></div>
              </dl>
              <p className="mt-2 text-xs text-muted">{c.note}</p>
            </div>
          ))}
        </div>
        <Nudge tone="tip" title={better === 'tie' ? 'Equal rates give equal results' : better === 'roth' ? 'Roth is ahead when your rate later is higher' : 'Traditional is ahead when your rate later is lower'}>
          {better === 'tie'
            ? <>Your rate today and your rate in retirement are about the same, so both accounts leave the same spending money. If you are unsure, splitting between both is reasonable.</>
            : <>You save about {pct(tr.marginalOnContribution, 0)} now and pay {s.retireRate}% later. {better === 'traditional' ? 'Skipping the higher rate and paying the lower one' : 'Paying the lower rate now instead of the higher one later'} leaves you {pct(Math.abs(per.trad / per.roth - 1) * 100, 0)} more retirement spending per $1 of take-home pay.</>}
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 6.3 Accounts anyone can use                                         */
/* ================================================================== */

function IraScreens() {
  return (
    <Figure
      kind="example"
      title="Contributed is not the same as invested"
      subtitle="The same Roth IRA, before and after buying a fund."
      howToRead={[
        'The left screen shows a deposit that has arrived but not been used to buy anything.',
        'The right screen shows the same deposit after buying an index fund.',
        'Look at the two lines at the bottom of each screen: cash and invested.',
      ]}
      takeaway={<>The left account holds <strong>$7,500.00 in cash</strong> and $0.00 invested. Only the right account holds an investment that can grow.</>}
      note="Example screens. Names, layouts and fund names vary by brokerage."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <StatementMockup
          label="Roth IRA screen showing 7,500 dollars in cash, not invested"
          issuer="Example Brokerage"
          title="Roth IRA ••3307 (before)"
          period="Jan 6"
          rows={[
            { date: '01/06', label: 'Contribution received', amount: 7500 },
            { date: '01/06', label: 'Cash (not invested)', flag: { text: 'Not invested', tone: 'warning' } },
          ]}
          callout={<><strong>Action needed:</strong> $7,500.00 is in cash. Choose an investment and place a buy order.</>}
          summary={[{ label: 'Cash', value: '$7,500.00' }, { label: 'Invested', value: '$0.00', strong: true }]}
        />
        <StatementMockup
          label="Roth IRA screen showing 7,500 dollars invested in a total-market index fund"
          issuer="Example Brokerage"
          title="Roth IRA ••3307 (after)"
          period="Jan 6"
          rows={[
            { date: '01/06', label: 'Contribution received', amount: 7500 },
            { date: '01/06', label: 'Bought: Total market index fund', flag: { text: 'Invested', tone: 'good' } },
          ]}
          callout={<>Automatic investing is on. Each monthly deposit buys this fund.</>}
          summary={[{ label: 'Cash', value: '$0.00' }, { label: 'Invested', value: '$7,500.00', strong: true }]}
        />
      </div>
    </Figure>
  );
}

const CASH_DATA = Array.from({ length: 31 }, (_, year) => ({
  year,
  invested: Math.round(futureValue(LIMITS.ira, 7, year)),
  cash: Math.round(futureValue(LIMITS.ira, 2, year)),
}));

function CashVsInvestedChart() {
  const li = CASH_DATA.length - 1;
  const last = CASH_DATA[li];
  return (
    <Figure
      title="$7,500 a year for 30 years: invested or left in cash"
      subtitle="The same deposits into the same IRA, with two different results."
      legend={[{ label: 'Invested at 7% a year', color: 'var(--s1)' }, { label: 'Left in cash at 2% a year', color: 'var(--s2)' }]}
      height={300}
      table={{ columns: ['Year', 'Invested', 'In cash'], rows: CASH_DATA.filter((d) => d.year % 5 === 0).map((d) => [d.year, usd(d.invested), usd(d.cash)]) }}
      howToRead={[
        'The bottom axis counts years from the first deposit. The side axis is the account balance.',
        'Both lines receive the same $7,500 each year. Only the growth rate differs.',
        'The gap between the lines widens every year.',
      ]}
      takeaway={<>After 30 years the invested account holds about <strong>{usd(last.invested)}</strong> and the cash account about <strong>{usd(last.cash)}</strong>. The deposits were identical: {usd(LIMITS.ira * 30)} in total.</>}
      note="Illustrative. Assumes 7% average yearly growth for investments and 2% for cash, with deposits at the end of each year. Actual returns vary and are not guaranteed."
    >
      <LineChart data={CASH_DATA} margin={{ top: 16, right: 96, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="year" type="number" domain={[0, 30]} ticks={[0, 5, 10, 15, 20, 25, 30]} tickFormatter={(v) => (v === 0 ? 'Now' : 'Yr ' + v)} {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Year ' + l} valueFormat={(v) => usd(v)} />} />
        <Line dataKey="invested" name="Invested" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Invested ' + usd(last.invested, { compact: true }))} />
        <Line dataKey="cash" name="Cash" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Cash ' + usd(last.cash, { compact: true }))} />
      </LineChart>
    </Figure>
  );
}

const CV_DEFAULTS = { yearly: 7500, years: 30, cashRate: 2, investRate: 7 };
type CvState = typeof CV_DEFAULTS;
const CV_PRESETS: Preset<CvState>[] = [
  { label: 'Full IRA, 30 years', values: {} },
  { label: '$200 a month, 30 years', hint: '$2,400 a year', values: { yearly: 2400 } },
  { label: '10 years only', values: { years: 10 } },
];
const CV_GUIDE: SimGuide<CvState> = {
  how: ['Set how much you add each year and for how long.', 'Set the growth rate for cash and for an invested fund.', 'Compare the two final balances.'],
  tryThis: [
    { label: 'Load "$200 a month." Is the gap still large?', done: (s) => s.yearly === 2400 },
    { label: 'Set the investment rate equal to the cash rate. What disappears?', done: (s) => s.investRate === s.cashRate },
    { label: 'Extend the timeline to 40 years', done: (s) => s.years >= 40 },
  ],
};

function CashVsInvestedSim() {
  const sim = useSim(CV_DEFAULTS);
  const s = sim.state;
  const paid = s.yearly * s.years;
  const inv = futureValue(s.yearly, s.investRate, s.years);
  const cash = futureValue(s.yearly, s.cashRate, s.years);
  return (
    <SimCard title="Invested vs. Left in Cash" kind="Mini sandbox" icon={PiggyBank} sim={sim} presets={CV_PRESETS} guide={CV_GUIDE}
      subtitle="Same deposits, same account, one choice: buy an investment or leave the cash.">
      <SimGrid controls={
        <ControlGroup title="Your deposits">
          <SliderField label="Added each year" value={s.yearly} onChange={sim.set('yearly')} min={500} max={LIMITS.ira} step={100} format={(v) => usd(v)} help={TAX_YEAR + ' IRA limit: ' + usd(LIMITS.ira)} />
          <SliderField label="Years" value={s.years} onChange={sim.set('years')} min={5} max={45} step={1} format={(v) => v + ' yrs'} />
          <SliderField label="Cash grows" value={s.cashRate} onChange={sim.set('cashRate')} min={0} max={5} step={0.5} format={(v) => pct(v, 1)} />
          <SliderField label="Investments grow (average)" value={s.investRate} onChange={sim.set('investRate')} min={3} max={10} step={0.5} format={(v) => pct(v, 1)} help="Illustrative. Returns vary and are not guaranteed." />
        </ControlGroup>
      }>
        <StatGrid>
          <StatTile label="You deposit" value={usd(paid)} sub={usd(s.yearly) + ' x ' + s.years + ' years'} />
          <StatTile label="Left in cash" value={usd(cash)} sub={pct(s.cashRate, 1) + ' a year'} />
          <StatTile label="Invested" value={usd(inv)} sub={pct(s.investRate, 1) + ' a year'} emphasis />
        </StatGrid>
        <Nudge tone="warning" title={usd(inv - cash) + ' difference from one click'}>
          Contributing to the account is step one. Buying a fund with that cash is step two. Without it, the account holds {usd(cash)} instead of {usd(inv)} after {s.years} years.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

const GLIDE = [
  { label: '40', stocks: 90 }, { label: '35', stocks: 90 }, { label: '30', stocks: 90 }, { label: '25', stocks: 90 },
  { label: '20', stocks: 84 }, { label: '15', stocks: 77 }, { label: '10', stocks: 68 }, { label: '5', stocks: 56 }, { label: '0', stocks: 45 },
].map((d) => ({ ...d, bonds: 100 - d.stocks }));

function GlidePathChart() {
  const li = GLIDE.length - 1;
  return (
    <Figure
      title="How a target-date fund changes its mix"
      subtitle="An illustrative path for a fund whose target year is the year you plan to retire."
      legend={[{ label: 'Stocks', color: 'var(--s1)' }, { label: 'Bonds and cash', color: 'var(--s2)' }]}
      height={290}
      table={{ columns: ['Years to target year', 'Stocks', 'Bonds and cash'], rows: GLIDE.map((d) => [d.label, d.stocks + '%', d.bonds + '%']) }}
      howToRead={[
        'The bottom axis counts down the years until the fund\'s target year. The side axis is the share of the fund in each type of investment.',
        'The stock line starts high and falls as the target year gets closer.',
        'The bond and cash line does the opposite.',
      ]}
      takeaway={<>Forty years out, this fund holds about <strong>90% stocks</strong>. At the target year it holds about <strong>45% stocks</strong>. The fund makes that change for you.</>}
      note="Illustrative. Real funds vary by provider: stock shares at the target year range from roughly 40% to 50%, and some funds keep reducing stocks after the target year."
    >
      <LineChart data={GLIDE} margin={{ top: 16, right: 110, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" tickFormatter={(v) => (v === '0' ? 'Target year' : v + ' yrs')} {...xAxisProps} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => v + '%'} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => (l === '0' ? 'At the target year' : l + ' years before the target year')} valueFormat={(v) => v + '%'} />} />
        <Line dataKey="stocks" name="Stocks" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Stocks ' + GLIDE[li].stocks + '%')} />
        <Line dataKey="bonds" name="Bonds and cash" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Bonds ' + GLIDE[li].bonds + '%')} />
      </LineChart>
    </Figure>
  );
}

function HsaDiagram() {
  return (
    <Figure
      kind="diagram"
      title="The HSA's three tax advantages"
      subtitle="Available if you have an HSA-eligible high-deductible health plan."
      howToRead={[
        'Read left to right: money goes in, the balance grows, then you spend it.',
        'Each box names the tax that does not apply at that stage.',
        'The yearly limits come from the 2026 IRS figures.',
      ]}
      takeaway={<>You can put in up to <strong>$4,400</strong> (self-only) or <strong>$8,750</strong> (family) in 2026, and no federal tax applies at any of the three stages if the money pays for qualified medical costs.</>}
      note="Federal rules. A few states tax HSA contributions or growth. Unspent money stays in the account from year to year."
    >
      <FlowDiagram label="HSA: no tax going in, no tax on growth, no tax on qualified medical withdrawals" steps={[
        { icon: Banknote, title: '1. Money goes in', amount: 'No income tax', detail: '2026 limit: $4,400 self-only, $8,750 family.', emphasis: true },
        { icon: TrendingUp, title: '2. Balance grows', amount: 'No tax on growth', detail: 'Only if you invest it. Cash in the account does not grow like an investment.', emphasis: true },
        { icon: HeartPulse, title: '3. You pay medical bills', amount: 'No tax on withdrawals', detail: 'Applies to qualified medical expenses.', emphasis: true },
      ]} />
    </Figure>
  );
}

/* ================================================================== */
/* 6.4 Order of operations                                             */
/* ================================================================== */

const ORDER = [
  { title: 'Cover basic living costs', detail: 'Food, housing and utilities.', done: 'Done when every essential bill is paid on time from your own income.', why: 'Nothing else in the list works if the essentials are not covered.', icon: House },
  { title: 'Build a starter emergency fund', detail: '$500 to $1,000.', done: 'Done when $500 to $1,000 is in a separate savings account.', why: 'A small reserve keeps a surprise bill off a credit card, so the rest of the plan is not interrupted.', icon: Landmark },
  { title: 'Get the full employer 401(k) match', detail: 'Contribute the percent that earns the whole match.', done: 'Done when you contribute at least the percent that earns the full match, or your employer offers none.', why: 'A match returns 50% to 100% immediately on those dollars. No debt payoff or investment reliably does that.', icon: Gift },
  { title: 'Pay off high-interest debt', detail: 'Credit cards and personal loans above about 7-8%.', done: 'Done when no balance has an interest rate above about 7-8%.', why: 'Paying off a 24% card is a guaranteed 24% return, far above the roughly 7% long-run average of stock investing.', icon: CreditCard },
  { title: 'Finish your 3-6 month emergency fund', detail: 'Enough for 3 to 6 months of essential costs.', done: 'Done when savings cover 3 to 6 months of essential expenses.', why: 'A full reserve covers a job loss or large repair without selling investments or borrowing.', icon: ShieldCheck },
  { title: 'Invest in a Roth IRA, HSA or more 401(k)', detail: 'Use low-cost index funds.', done: 'Done when you are contributing to these accounts up to the yearly limits you can afford (2026: IRA $7,500, 401(k) $24,500, HSA $4,400 or $8,750).', why: 'These accounts reduce or remove tax on your growth, which a regular account does not.', icon: PiggyBank },
  { title: 'Invest extra in a regular brokerage account or toward big goals', detail: 'A home down payment, for example.', done: 'This step is ongoing. Money here has no contribution limits and can be withdrawn at any time.', why: 'Once the tax-advantaged accounts are full, additional money can still be invested.', icon: TrendingUp },
];

function StepList({ nextIndex, doneCount }: { nextIndex?: number; doneCount?: number }) {
  return (
    <ol className="space-y-2.5">
      {ORDER.map((st, i) => {
        const isNext = nextIndex === i;
        const isDone = doneCount !== undefined && i < doneCount;
        return (
          <li key={st.title} className={cx('flex gap-3 rounded-2xl border p-3.5 sm:p-4', isNext ? 'border-accent/60 bg-accent-soft/70' : 'border-line bg-surface')}>
            <span className={cx('grid size-8 shrink-0 place-items-center rounded-full border text-sm font-semibold', isDone ? 'border-good bg-good-soft text-good-text' : 'border-line-strong bg-surface text-ink')} aria-hidden>
              {isDone ? <Check className="size-4" strokeWidth={2.25} /> : i + 1}
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                <span className="sr-only">Step {i + 1}: </span>{st.title}
                {isNext && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink">Work on this now</span>}
                {isDone && <span className="rounded-full bg-good-soft px-2 py-0.5 text-[11px] font-semibold text-good-text">Done</span>}
              </p>
              <p className="mt-0.5 text-xs text-ink-2">{st.detail}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{st.done}</p>
              {isNext && <p className="mt-1.5 text-[13px] leading-relaxed text-ink"><strong>Why now:</strong> {st.why}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderFigure() {
  return (
    <Figure
      kind="diagram"
      title="Seven steps, in order"
      subtitle="Each step has a condition that tells you when it is done."
      howToRead={[
        'Read from top to bottom. The number is the order to follow.',
        'The line under each title says when that step is complete.',
        'Start the next step only when the one above it is done.',
      ]}
      takeaway={<>The <strong>full employer match is step 3</strong>, ahead of debt payoff and ahead of the Roth IRA. Steps 1 and 2 come first because they keep a surprise bill from becoming new debt.</>}
      note="A guideline, not a rule for every situation. Debt below about 7-8% interest can be handled alongside investing."
    >
      <StepList />
    </Figure>
  );
}

const NEXT_DEFAULTS = { basics: false, starter: false, match: false, debt: false, fund: false, invest: false };
type NextState = typeof NEXT_DEFAULTS;
const NEXT_FLAGS: (keyof NextState)[] = ['basics', 'starter', 'match', 'debt', 'fund', 'invest'];
const NEXT_PRESETS: Preset<NextState>[] = [
  { label: 'Just starting', values: {} },
  { label: 'Match, then card debt', hint: 'Starter fund done; a card balance remains', values: { basics: true, starter: true } },
  { label: 'Ready to invest', values: { basics: true, starter: true, match: true, debt: true, fund: true } },
];
const NEXT_GUIDE: SimGuide<NextState> = {
  how: ['Switch on everything you have already done.', 'Read which step is highlighted in the list.', 'Read the reason shown under the highlighted step.'],
  tryThis: [
    { label: 'Load "Match, then card debt." Which step is next?', done: (s) => s.basics && s.starter && !s.match },
    { label: 'Switch on the match and the debt payoff', done: (s) => s.match && s.debt },
    { label: 'Complete every switch. What is left to do?', done: (s) => NEXT_FLAGS.every((k) => s[k]) },
  ],
};

function NextDollarSim() {
  const sim = useSim(NEXT_DEFAULTS);
  const s = sim.state;
  const first = NEXT_FLAGS.findIndex((k) => !s[k]);
  const nextIndex = first === -1 ? 6 : first;
  const doneCount = first === -1 ? 6 : first;
  const outOfOrder = NEXT_FLAGS.filter((k, i) => s[k] && first !== -1 && i > first).length;
  const sw = (key: keyof NextState, label: ReactNode, description?: ReactNode) => (
    <Switch checked={s[key]} onChange={sim.set(key)} label={label} description={description} />
  );
  return (
    <SimCard title="Your Next Dollar" kind="Mini sandbox" icon={ListOrdered} sim={sim} presets={NEXT_PRESETS} guide={NEXT_GUIDE}
      subtitle="Mark what you have already done. The list shows where your next extra dollar should go.">
      <SimGrid controls={
        <ControlGroup title="What you already have">
          {sw('basics', 'Basic living costs are covered', 'Food, housing and utilities are paid from your income.')}
          {sw('starter', 'I have a $500 to $1,000 starter emergency fund')}
          {sw('match', 'I get the full 401(k) match, or my employer offers none')}
          {sw('debt', 'I have no debt above about 7-8% interest', 'Credit cards and personal loans count here.')}
          {sw('fund', 'I have 3 to 6 months of essential costs saved')}
          {sw('invest', 'I am already filling a Roth IRA, HSA or 401(k)')}
        </ControlGroup>
      }>
        <StatGrid cols={2}>
          <StatTile label="Next dollar goes to" value={'Step ' + (nextIndex + 1)} sub={ORDER[nextIndex].title} emphasis />
          <StatTile label="Steps completed in order" value={doneCount + ' of 7'} sub={first === -1 ? 'Step 7 has no end point' : undefined} />
        </StatGrid>
        <StepList nextIndex={nextIndex} doneCount={doneCount} />
        {outOfOrder > 0 && (
          <Nudge tone="info" title="Some later steps are marked, but an earlier one is not">
            Step {first + 1} comes first. A later step can be done in part, but the list works best when each step is finished before you move on.
          </Nudge>
        )}
        {first === -1 && (
          <Nudge tone="good" title="Steps 1 to 6 are complete">
            Extra money can go to a regular brokerage account or toward big goals such as a home down payment.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* Decision check and cheat sheet                                      */
/* ================================================================== */

const questions: QuizQuestion[] = [
  {
    id: 'match',
    scenario: <>You earn <strong>$80,000</strong>. Your employer matches <strong>50% of your contributions up to 6% of pay</strong>. You currently contribute 3% ($2,400 a year), and your employer adds $1,200.</>,
    prompt: 'What is the best change?',
    options: [
      { text: 'Stay at 3%. The match is already coming in.', why: <>You are claiming only half of it. At 6% your employer would add $2,400, so you leave <strong>$1,200 a year</strong> unclaimed.</> },
      { text: 'Raise your contribution to 6%.', correct: true, why: <>Yes. You add $2,400 more a year and your employer adds $1,200 more: a <strong>50% immediate return</strong>. At 6% you put in $4,800 and receive the full <Term id="employer-match">match</Term> of $2,400.</> },
      { text: 'Raise it to 10% for the largest match.', why: <>The match stops at 6%. At 10% you would put in $8,000, but your employer still adds only $2,400. The extra 4% ($3,200) receives no match.</> },
      { text: 'Stop contributing and invest the $2,400 in a regular brokerage account.', why: <>You would give up the $1,200 match and the tax advantages of the 401(k). Nothing in a regular account adds a guaranteed 50%.</> },
    ],
  },
  {
    id: 'roth-trad',
    scenario: <>You are 25 and earn <strong>$45,000</strong>, which puts you in the 12% bracket. You expect your pay to rise a lot, so you may be in the 22% bracket in retirement. You can contribute $5,000 a year to either a Traditional or a Roth IRA.</>,
    prompt: 'Which account gives you more retirement spending per $1 of take-home pay?',
    options: [
      { text: 'Traditional. A tax break today is always worth more.', why: <>The break saves you 12% now ($4,400 take-home cost for a $5,000 deposit). If $5,000 grows to about $38,061 and is taxed at 22%, you keep $29,688, or <strong>$6.75</strong> per $1 given up.</> },
      { text: 'Roth. You pay 12% now and withdraw tax-free.', correct: true, why: <>Yes. The same $5,000 grows to about $38,061 and you keep all of it: <strong>$7.61</strong> per $1 of take-home given up, against $6.75 for <Term id="traditional-account">Traditional</Term>. The <Term id="roth">Roth</Term> is ahead because your rate later (22%) is higher than your rate now (12%).</> },
      { text: 'They are always equal.', why: <>They are equal only when your rate now equals your rate later. Here they differ (12% vs. 22%), so the results differ too: $7.61 vs. $6.75 per $1.</> },
      { text: 'Neither. Wait until you earn more.', why: <>Waiting costs growth time. $5,000 a year invested for 30 years at 7% grows to about $472,000, so each year of delay matters.</> },
    ],
  },
  {
    id: 'order',
    scenario: <>You have covered your basics and have a <strong>$1,500</strong> starter emergency fund. Your employer matches 100% of contributions up to 4% of pay, and you contribute 0%. You also owe $3,000 on a credit card at 24% interest. You have an extra $300 a month.</>,
    prompt: 'Where should the first dollars go?',
    options: [
      { text: 'All $300 to the credit card.', why: <>The card is the right next target, but the match comes first. A 100% match is an immediate 100% return, higher than the 24% saved on the card.</> },
      { text: 'Contribute 4% to the 401(k) first to earn the full match, then use the rest on the card.', correct: true, why: <>Yes. Steps 1 and 2 are done, so step 3 (the full <Term id="k401">401(k)</Term> match) comes next. Only then does step 4, paying off the 24% card, get the remaining money.</> },
      { text: 'Open a Roth IRA and invest the whole $300.', why: <>A Roth IRA is step 6. It comes after the match and after paying off a 24% card, which beats the roughly 7% average a fund might earn.</> },
      { text: 'Add to the emergency fund until it reaches 6 months of expenses.', why: <>Finishing the emergency fund is step 5. The match (step 3) and the 24% card (step 4) come before it.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Gift, title: 'Contribute enough to get the full employer match.', body: <>After a $500 to $1,000 starter fund, this is your first investing step. The match is an immediate <strong>50% to 100%</strong> return on those dollars.</> },
  { icon: Scale, title: 'Roth if your tax rate will be higher later; Traditional if lower.', body: <>Roth means tax now and tax-free withdrawals. Traditional means tax later. If your rate now and later are equal, both leave the same amount.</> },
  { icon: TrendingUp, title: 'Invest the money inside the account.', body: <>An IRA or 401(k) deposit is not an investment until you buy a fund. A target-date or total-market index fund works. Turn on automatic investing so each deposit is invested.</> },
];

/* ================================================================== */

export default function RetirementChapter() {
  return (
    <ChapterLayout
      id="retirement"
      questions={questions}
      rules={rules}
      sections={{
        '6-1': (
          <>
            <P>A 401(k) match is money your employer adds to your account when you contribute. It is part of your pay, and it is available only if you contribute.</P>
            <Bullets items={[
              <>A common formula is <strong className="text-ink">100% on the first 3% of pay</strong> or <strong className="text-ink">50% on the first 6%</strong>. Your plan's summary lists yours.</>,
              <>Put in enough to receive <strong className="text-ink">100% of the match</strong>. On a 100% match, each dollar you contribute becomes two dollars on day one: an instant 100% return.</>,
              <>If you skip the match, you give up part of your pay. You cannot recover it later.</>,
              <>The match may <Term id="vesting">vest</Term> over time, so you may need to stay a set number of years to keep all of it.</>,
              <>The 2026 employee limit is <strong className="text-ink">{usd(LIMITS.k401)}</strong>. The match does not count against it.</>,
            ]} />
            <MatchChart />
            <FormulaCompare />
            <Example title="The cost of contributing 2% instead of 5%">
              <p>You earn $60,000 and your employer matches 100% on the first 5%.</p>
              <Bullets items={[
                <>At 5%: you put in $3,000 and receive $3,000. Total: <strong>$6,000</strong>.</>,
                <>At 2%: you put in $1,200 and receive $1,200. Total: $2,400.</>,
                <>The 3% difference costs you $1,800 a year, before tax savings, and gives up another <strong>$1,800 a year</strong> from your employer.</>,
              ]} />
            </Example>
            <MatchSim />
            <GoDeeper title="What vesting means">
              <Bullets items={[
                <>Your own contributions are always yours.</>,
                <>The employer's match may be <Term id="vesting">vested</Term> on a schedule, for example 20% a year over 5 years, or all at once after 3 years.</>,
                <>If you leave before the match is vested, you forfeit the unvested part.</>,
                <>Check your plan documents or ask your HR department. Even a partially vested match is usually worth contributing for.</>,
              ]} />
            </GoDeeper>
            <Mistakes items={[
              <>Not enrolling in the plan, or enrolling at a default rate below the percent that earns the full match.</>,
              <>Never checking the formula. A 50% match on 6% needs 6% from you, not 3%.</>,
              <>Contributing far above the match percent before finishing the earlier steps in section 6.4.</>,
              <>Leaving the 401(k) balance uninvested in a cash option. Choose a fund inside the plan.</>,
            ]} title="Mistakes to avoid" />
          </>
        ),
        '6-2': (
          <>
            <P>Retirement accounts come in two types. They differ in one thing: when you pay income tax on the money.</P>
            <Bullets items={[
              <><strong className="text-ink"><Term id="traditional-account">Traditional</Term>:</strong> skip taxes today, pay taxes later when you withdraw in retirement. The contribution lowers your taxable income this year, and withdrawals are taxed as income.</>,
              <><strong className="text-ink"><Term id="roth">Roth</Term>:</strong> pay taxes today. Every dollar of growth is 100% tax-free when you withdraw it in retirement. A Roth is a good choice if you expect your income or tax rate to rise.</>,
              <>Both can hold the same investments. The only difference is the timing of the tax.</>,
            ]} />
            <TaxTimeline />
            <H3>Which one to choose</H3>
            <Bullets items={[
              <><strong className="text-ink">Higher tax rate later than now:</strong> Roth is ahead. You pay the lower rate today.</>,
              <><strong className="text-ink">Lower tax rate later than now:</strong> Traditional is ahead. You skip the higher rate today.</>,
              <><strong className="text-ink">Same rate:</strong> the two give the same result.</>,
              <><strong className="text-ink">Not sure:</strong> split contributions between both. Many 401(k) plans offer a Roth 401(k) option, and Roth IRAs have income limits, so check the current limits before contributing.</>,
            ]} />
            <CrossoverChart />
            <Example title="$5,000 invested for 30 years at 7%">
              <p>$5,000 grows to about <strong>$38,061</strong>. With a Roth you keep all of it. With a Traditional account and a 22% tax rate in retirement, you keep $38,061 x 0.78 = <strong>$29,688</strong>. The Traditional contribution also saved tax today. If your rate today is 12%, a $5,000 deposit costs $4,400 of take-home pay, so Traditional leaves $29,688 / $4,400 = $6.75 per $1 and Roth leaves $38,061 / $5,000 = $7.61 per $1. Roth is ahead because 22% is higher than 12%.</p>
            </Example>
            <TraditionalVsRothSim />
            <Mistakes items={[
              <>Choosing Traditional only because the tax savings are visible today. The tax later is just as real.</>,
              <>Assuming your tax rate will be lower in retirement without checking. Rates and your income can both change.</>,
              <>Treating the choice as permanent. You can use different account types in different years.</>,
            ]} title="Mistakes to avoid" />
          </>
        ),
        '6-3': (
          <>
            <P>You do not need an employer plan to save for retirement with tax advantages. Three accounts or funds are open to most people.</P>
            <H3>Roth IRA and Traditional IRA</H3>
            <Bullets items={[
              <>An <Term id="ira">IRA</Term> is an account you open yourself, in about 15 minutes, at a major low-cost brokerage. It works even if your job has no 401(k).</>,
              <>You need earned income. The 2026 limit is <strong className="text-ink">{usd(LIMITS.ira)}</strong> a year, with a higher limit if you are 50 or older.</>,
              <>Roth IRA contributions have <strong className="text-ink">income limits</strong>. Above a set income, you cannot contribute directly. The IRS publishes the current limits.</>,
              <>The Traditional and Roth rules from section 6.2 apply in the same way.</>,
            ]} />
            <H3>Open an IRA in about 15 minutes</H3>
            <Steps items={[
              { title: 'Choose a brokerage.', body: 'Pick a large, low-cost one such as Fidelity, Schwab or Vanguard.' },
              { title: 'Choose Roth or Traditional.', body: 'Use the comparison in section 6.2. Roth is a common choice if you expect higher income later.' },
              { title: 'Link your bank account.', body: 'You will need your Social Security number and your bank\'s routing and account numbers.' },
              { title: 'Transfer money in.', body: 'Start with any amount. You can add more each month.' },
              { title: 'Buy a fund.', body: 'Select an investment such as a target-date fund or a total-market index fund and place a buy order.' },
              { title: 'Automate it.', body: 'Set a monthly contribution from your bank, and turn on automatic investing so each deposit buys the fund.' },
            ]} />
            <Nudge tone="warning" title="Important: invest the money inside the account">
              Putting money into an IRA or 401(k) is step one. You must also buy an investment with it. Otherwise it stays in cash and earns very little.
            </Nudge>
            <IraScreens />
            <CashVsInvestedChart />
            <CashVsInvestedSim />
            <H3>HSA: Health Savings Account</H3>
            <P>An <Term id="hsa">HSA</Term> is available if you have an HSA-eligible high-deductible health plan. It has a triple tax advantage: tax-free going in, tax-free growth, and tax-free for medical bills.</P>
            <HsaDiagram />
            <Bullets items={[
              <>2026 limits: <strong className="text-ink">{usd(LIMITS.hsaSelf)}</strong> self-only, <strong className="text-ink">{usd(LIMITS.hsaFamily)}</strong> family.</>,
              <>Unspent money stays in the account and carries over each year.</>,
              <>Like an IRA, you can invest the balance. Check that you have actually done so.</>,
            ]} />
            <H3>Target-date funds</H3>
            <P>A <Term id="target-date-fund">target-date fund</Term> is one fund that adjusts your risk for you as you get closer to retirement. It needs no maintenance.</P>
            <Bullets items={[
              <>Pick the fund with the year closest to when you plan to retire, for example "Target 2060" if you retire around 2060.</>,
              <>The fund holds mostly stocks when the target year is far away and shifts toward bonds and cash as it gets close.</>,
              <>It rebalances automatically. You do not need to do it.</>,
              <>Compare the <Term id="expense-ratio">expense ratio</Term> before you choose. Lower is better, and index-based target-date funds are generally lower cost.</>,
            ]} />
            <GlidePathChart />
            <Mistakes items={[
              <>Contributing to an IRA and never buying anything with the cash.</>,
              <>Owning several target-date funds with different years. One fund is enough.</>,
              <>Opening a Roth IRA when your income is above the limit, without checking.</>,
              <>Using HSA money for non-medical costs before age 65. These withdrawals are taxed and may carry a penalty.</>,
            ]} title="Mistakes to avoid" />
          </>
        ),
        '6-4': (
          <>
            <P>Money has many possible uses at once. This order tells you which to fund first. Finish one step before you start the next.</P>
            <OrderFigure />
            <NextDollarSim />
            <Bullets items={[
              <><strong className="text-ink">Why the match comes before debt:</strong> a match of 50% to 100% is larger than the interest saved on almost any debt.</>,
              <><strong className="text-ink">Why high-interest debt comes before investing:</strong> a 24% credit card balance costs more each year than investing is expected to earn.</>,
              <><strong className="text-ink">Why the 7-8% line:</strong> debt below it, such as a low-rate student loan, can be paid on schedule while you invest, because investing may earn about the same.</>,
              <><strong className="text-ink">Why a small fund first:</strong> without $500 to $1,000 set aside, a car repair goes on a credit card and adds new debt.</>,
            ]} />
            <Example title="One year with an extra $400 a month">
              <Steps items={[
                { title: 'Months 1 to 2: starter fund.', body: 'If you have only $200 saved, $400 a month brings you to $1,000 in two months.' },
                { title: 'Next: the match.', body: 'Raise your 401(k) contribution to the percent that earns the full match.' },
                { title: 'Then: the card.', body: 'Put the rest toward the credit card balance until it is paid off.' },
                { title: 'After that: finish the emergency fund,', body: 'then open a Roth IRA and buy a fund.' },
              ]} />
            </Example>
            <Mistakes items={[
              <>Investing in a Roth IRA before getting the full 401(k) match.</>,
              <>Paying extra on a 4% loan while carrying a 24% credit card balance.</>,
              <>Building a 6-month emergency fund before earning the full match.</>,
              <>Skipping the starter fund, then using a credit card for the next repair.</>,
            ]} title="Mistakes to avoid" />
          </>
        ),
      }}
    />
  );
}
