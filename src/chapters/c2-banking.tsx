import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Ban, Banknote, CalendarClock, CircleX, Coffee, CreditCard, House, Landmark, Percent, PiggyBank, Receipt,
  ShieldCheck, Smartphone, Wallet, Zap,
} from 'lucide-react';
import { ChapterLayout } from '../components/ChapterLayout';
import { Term } from '../components/Glossary';
import { Bullets, Compare, ConceptCards, Example, GoDeeper, H3, Mistakes, P, Steps } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { SegmentedControl } from '../components/ui';
import { activeDot, cursorProps, gridProps, TooltipBox, xAxisProps, yAxisProps } from '../components/Chart';
import { BAR_RADIUS, MAX_BAR, barEndLabel, endLabel, Figure, FlowDiagram, StatementMockup } from '../components/Figure';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { monthlyRate } from '../lib/growth';
import { pct, usd } from '../lib/format';

/** Balance after "months" of end-of-month deposits, starting from "start", growing at "apy" percent a year. */
const balanceAfter = (start: number, monthly: number, apy: number, months: number) => {
  const r = monthlyRate(apy);
  const g = Math.pow(1 + r, months);
  return r === 0 ? start + monthly * months : start * g + monthly * ((g - 1) / r);
};

/** Future value of a recurring monthly amount. */
const futureValue = (monthly: number, apy: number, months: number) => balanceAfter(0, monthly, apy, months);

/* ================================================================== */
/* 2.1 Checking vs. high-yield savings                                 */
/* ================================================================== */

const BIG_BANK_RATE = 0.01;
const HYSA_RATE = 4;

const SAVINGS_5Y = Array.from({ length: 6 }, (_, year) => ({
  year,
  hysa: Math.round(balanceAfter(10000, 200, HYSA_RATE, year * 12)),
  bank: Math.round(balanceAfter(10000, 200, BIG_BANK_RATE, year * 12)),
}));

function InterestComparisonChart() {
  const last = SAVINGS_5Y[SAVINGS_5Y.length - 1];
  const li = SAVINGS_5Y.length - 1;
  const put = 10000 + 200 * 60;
  return (
    <Figure
      title="The same savings in two different accounts"
      subtitle="$10,000 to start, plus $200 added every month for 5 years."
      legend={[{ label: 'Online HYSA at an example 4.00%', color: 'var(--s1)' }, { label: 'Big bank savings at 0.01%', color: 'var(--s2)' }]}
      height={290}
      table={{ columns: ['Year', 'HYSA (4.00%)', 'Big bank (0.01%)'], rows: SAVINGS_5Y.map((d) => [d.year, usd(d.hysa), usd(d.bank)]) }}
      howToRead={[
        'The bottom axis counts years from today. The side axis shows the account balance.',
        'Each line is the same deposits in a different account. Both lines start at $10,000.',
        'The space between the lines is extra interest earned by the HYSA.',
      ]}
      takeaway={<>You deposit {usd(put)} in both. After 5 years the HYSA holds about <strong>{usd(last.hysa)}</strong> and the big-bank account about <strong>{usd(last.bank)}</strong>. The difference is <strong>{usd(last.hysa - last.bank)}</strong> of interest.</>}
      note="Illustrative. 4.00% is an example HYSA rate; HYSA rates rise and fall with the Federal Reserve's interest rate, so check current rates. 0.01% is a typical rate at large traditional banks. Interest is added monthly, and the rates are held constant for all 5 years."
    >
      <LineChart data={SAVINGS_5Y} margin={{ top: 16, right: 96, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="year" type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickFormatter={(v) => (v === 0 ? 'Now' : 'Yr ' + v)} {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} domain={[10000, 26000]} ticks={[10000, 14000, 18000, 22000, 26000]} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Year ' + l} valueFormat={(v) => usd(v)} />} />
        <Line dataKey="hysa" name="HYSA (4.00%)" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'HYSA ' + usd(last.hysa, { compact: true }))} />
        <Line dataKey="bank" name="Big bank (0.01%)" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Bank ' + usd(last.bank, { compact: true }), 14)} />
      </LineChart>
    </Figure>
  );
}

function AccountRolesDiagram() {
  const box = (icon: typeof Landmark, title: string, tag: string, items: string[], accent: boolean) => {
    const Icon = icon;
    return (
      <div className={'rounded-2xl border p-5 ' + (accent ? 'border-accent/50 bg-accent-soft/70' : 'border-line bg-surface')}>
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink"><Icon className="size-4" strokeWidth={1.6} aria-hidden /></span>
          <div>
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="text-xs text-muted">{tag}</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-[13px] text-ink-2">
          {items.map((t) => (
            <li key={t} className="flex gap-2.5"><span className="mt-[7px] size-1 shrink-0 rounded-full bg-muted" aria-hidden /><span>{t}</span></li>
          ))}
        </ul>
      </div>
    );
  };
  return (
    <Figure
      kind="diagram"
      title="Which account holds which money"
      subtitle="Two accounts, two jobs."
      howToRead={[
        'The left box is the account you spend from. The right box is the account you keep money in.',
        'Each list shows the money that belongs in that account.',
        'The arrow between them shows a transfer you choose to make.',
      ]}
      takeaway={<>Keep <strong>about one month of bills and spending</strong> in checking. Everything you are saving for, such as an emergency fund, goes in the HYSA where it earns interest.</>}
    >
      <div role="img" aria-label="Checking holds bills and one month of spending. The high-yield savings account holds the emergency fund, sinking funds and short-term goals." className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        {box(Wallet, 'Checking account', 'Pays for what you spend', ['Rent, utilities, phone and other bills', 'Daily spending: groceries, gas, coffee', 'About one month of expenses, so bills are covered while transfers clear'], false)}
        <div className="grid place-items-center gap-1 text-center text-xs text-muted" aria-hidden>
          <span className="font-serif text-2xl leading-none text-ink-2">⇄</span>
          <span>Transfers<br />take 1–3 business days</span>
        </div>
        {box(PiggyBank, 'High-yield savings account (HYSA)', 'Keeps money safe and earning interest', ['Emergency fund', 'Sinking funds for car repairs, gifts, annual bills', 'Short-term goals: a trip, a move, a down payment in the next few years'], true)}
      </div>
    </Figure>
  );
}

const HYSA_DEFAULTS = { start: 10000, monthly: 200, years: 5, hysa: HYSA_RATE, bank: BIG_BANK_RATE };
type HysaState = typeof HYSA_DEFAULTS;
const HYSA_PRESETS: Preset<HysaState>[] = [
  { label: '$15,000 emergency fund', values: { start: 15000, monthly: 0, years: 1 } },
  { label: '$500 a month for 10 years', values: { start: 0, monthly: 500, years: 10 } },
  { label: 'HYSA rate falls to 2%', values: { hysa: 2 } },
];
const HYSA_GUIDE: SimGuide<HysaState> = {
  how: ['Enter the balance you have now and what you add each month.', 'Set how many years you will keep it there and the two interest rates.', 'Compare the interest earned in each account.'],
  tryThis: [
    { label: 'Try the $15,000 emergency fund. How much interest does one year earn at the big bank?', done: (s) => s.start >= 15000 && s.monthly === 0 && s.years === 1 },
    { label: 'Drop the HYSA rate to 2%. Is it still ahead?', done: (s) => s.hysa <= 2 },
    { label: 'Raise the time to 20 years.', done: (s) => s.years >= 20 },
  ],
};

function HysaVsBank() {
  const sim = useSim(HYSA_DEFAULTS);
  const s = sim.state;
  const months = s.years * 12;
  const put = s.start + s.monthly * months;
  const hBal = balanceAfter(s.start, s.monthly, s.hysa, months);
  const bBal = balanceAfter(s.start, s.monthly, s.bank, months);
  const hInt = hBal - put;
  const bInt = bBal - put;
  const top = Math.max(hBal, bBal, 1);
  const rows = [
    { key: 'hysa', label: 'HYSA at ' + pct(s.hysa, 2), bal: hBal, int: hInt, color: 'var(--s1)' },
    { key: 'bank', label: 'Big bank at ' + pct(s.bank, 2), bal: bBal, int: bInt, color: 'var(--s2)' },
  ];
  return (
    <SimCard title="HYSA vs. Big Bank" kind="Mini sandbox" icon={Percent} sim={sim} presets={HYSA_PRESETS} guide={HYSA_GUIDE}
      subtitle="See how much interest the same money earns in each type of account.">
      <SimGrid controls={
        <>
          <ControlGroup title="Your savings">
            <SliderField label="Balance today" value={s.start} onChange={sim.set('start')} min={0} max={100000} step={500} format={(v) => usd(v)} />
            <SliderField label="Added each month" value={s.monthly} onChange={sim.set('monthly')} min={0} max={2000} step={25} format={(v) => usd(v)} />
            <SliderField label="Years" value={s.years} onChange={sim.set('years')} min={1} max={30} step={1} format={(v) => v + (v === 1 ? ' year' : ' years')} />
          </ControlGroup>
          <ControlGroup title="Interest rates (yearly)">
            <SliderField label="Online HYSA rate" value={s.hysa} onChange={sim.set('hysa')} min={0} max={6} step={0.05} format={(v) => pct(v, 2)} help="An example. Real HYSA rates change over time." />
            <SliderField label="Big bank rate" value={s.bank} onChange={sim.set('bank')} min={0} max={1} step={0.01} format={(v) => pct(v, 2)} />
          </ControlGroup>
        </>
      }>
        <StatGrid>
          <StatTile label="Interest in HYSA" value={usd(hInt)} />
          <StatTile label="Interest at big bank" value={usd(bInt)} />
          <StatTile label="Difference" value={usd(hInt - bInt)} sub={'over ' + s.years + (s.years === 1 ? ' year' : ' years')} emphasis />
        </StatGrid>
        <div className="space-y-3 rounded-xl border border-line p-4">
          <p className="flex justify-between text-sm font-semibold text-ink"><span>Ending balance</span><span className="tnum text-muted font-normal">You deposit {usd(put)} in total</span></p>
          {rows.map((r) => (
            <div key={r.key} className="grid grid-cols-[8.5rem_1fr] items-center gap-3 text-xs text-ink-2">
              <span>{r.label}</span>
              <div className="flex items-center gap-2">
                <div className="h-3 rounded-r-[4px]" style={{ width: Math.max(2, (r.bal / top) * 78) + '%', background: r.color }} />
                <span className="tnum font-medium text-ink">{usd(r.bal)}</span>
              </div>
            </div>
          ))}
        </div>
        {hInt - bInt > 0 ? (
          <Nudge tone="good" title={usd(hInt - bInt) + ' more interest in the HYSA'}>
            Both accounts can be FDIC or NCUA insured, so the extra interest does not come with extra risk to your deposit. It does depend on the rate staying where it is: HYSA rates can fall.
          </Nudge>
        ) : (
          <Nudge tone="info" title="No difference at these rates">
            When the two rates are the same, both accounts earn the same interest. Raise the HYSA rate to see the gap.
          </Nudge>
        )}
        <Nudge tone="tip" title="Keep a month of bills in checking">
          A transfer between banks usually takes 1 to 3 business days. Leave one month of bills in checking so a bill never waits on a transfer.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 2.2 Never pay stupid bank fees                                      */
/* ================================================================== */

function CoffeeFeeDiagram() {
  return (
    <Figure
      kind="diagram"
      title="How a $5 coffee becomes a $40 coffee"
      subtitle="The same purchase with overdraft coverage on, and with it off."
      howToRead={[
        'Each row follows one debit card purchase from left to right.',
        'The top row has overdraft coverage on. The bank approves the purchase and charges a fee.',
        'The bottom row has overdraft coverage off. The card is declined and nothing is charged.',
      ]}
      takeaway={<>With coverage on, a <strong>$5 coffee</strong> leaves the account at <strong>−$37</strong>: $3 − $5 − $35. With coverage off, you pay <strong>$0</strong> in fees and use another way to pay.</>}
      note="Example amounts. Overdraft fees at many banks are up to about $35 per transaction; check your bank's fee schedule."
    >
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-2">Overdraft coverage on</p>
          <FlowDiagram label="Balance of 3 dollars, a 5 dollar coffee is approved, a 35 dollar overdraft fee is charged, balance is negative 37 dollars" steps={[
            { icon: Wallet, title: 'Checking balance', amount: '$3' },
            { icon: Coffee, title: 'Coffee on debit card', amount: '−$5', detail: 'The bank approves it although the balance is too low.' },
            { icon: Receipt, title: 'Overdraft fee', amount: '−$35', detail: 'Charged for approving the purchase.' },
            { icon: CircleX, title: 'New balance', amount: '−$37', detail: 'You now owe the bank $37.' },
          ]} />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-2">Overdraft coverage off</p>
          <FlowDiagram label="Balance of 3 dollars, a 5 dollar coffee is declined, no fee, balance stays 3 dollars" steps={[
            { icon: Wallet, title: 'Checking balance', amount: '$3' },
            { icon: Ban, title: 'Coffee on debit card', amount: 'Declined', detail: 'The balance is too low, so the card is declined.' },
            { icon: ShieldCheck, title: 'Fee', amount: '$0' },
            { icon: Wallet, title: 'Balance', amount: '$3', detail: 'Pay another way, or skip it.', emphasis: true },
          ]} />
        </div>
      </div>
    </Figure>
  );
}

const FEE_BARS = [
  { label: 'Overdraft fees (2 a year × $35)', yearly: 70 },
  { label: 'Monthly maintenance fee ($12 × 12)', yearly: 144 },
  { label: 'Out-of-network ATM (2 a month × $6)', yearly: 144 },
];

function FeeCostChart() {
  const total = FEE_BARS.reduce((a, b) => a + b.yearly, 0);
  return (
    <Figure
      title="What common bank fees cost in a year"
      subtitle="One example account with three kinds of fees."
      height={220}
      table={{ columns: ['Fee', 'Per year'], rows: FEE_BARS.map((d) => [d.label, usd(d.yearly)]) }}
      howToRead={[
        'Each bar is one kind of fee, added up over 12 months.',
        'Bar length is the yearly cost; the number at the end of the bar is the exact amount.',
        'The ATM bar combines a $3 charge from the ATM owner and a $3 charge from your own bank.',
      ]}
      takeaway={<>These three fees add up to <strong>{usd(total)} a year</strong>. A no-fee checking account and in-network ATMs bring all three to $0.</>}
      note="Illustrative amounts. Your bank's fee schedule lists the real fees."
    >
      <BarChart data={FEE_BARS} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={(v) => usd(v, { compact: true })} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={230} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v) + ' a year'} />} />
        <Bar dataKey="yearly" name="Yearly cost" fill="var(--s1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => usd(v))} />
      </BarChart>
    </Figure>
  );
}

function FeeStatementFigure() {
  return (
    <Figure
      kind="example"
      title="Where fees show up on a statement"
      subtitle="Bank fees appear as ordinary lines in the transaction list."
      howToRead={[
        'Each row is one transaction. The tag on the right marks the three kinds of fee.',
        'Fees appear on the date they are charged, between ordinary purchases, so they are overlooked.',
        'Check the statement for these lines each month.',
      ]}
      takeaway={<>This one month has <strong>$50.50</strong> of fees: a $35 overdraft, a $12 maintenance fee and a $3.50 out-of-network ATM fee, with no purchase attached to any of them.</>}
      note="Names and amounts are examples."
    >
      <StatementMockup
        label="Example checking statement with an overdraft fee, a maintenance fee and an ATM fee flagged"
        issuer="Example Bank"
        title="Everyday Checking ••4821"
        period="Mar 1 – Mar 31"
        rows={[
          { date: '03/01', label: 'Payroll deposit', amount: 1850 },
          { date: '03/03', label: 'Rent payment', amount: -1200 },
          { date: '03/09', label: 'Corner Coffee (debit card)', amount: -5 },
          { date: '03/09', label: 'Overdraft fee', amount: -35, flag: { text: 'Overdraft', tone: 'critical' } },
          { date: '03/14', label: 'Cash withdrawal, other bank ATM', amount: -40 },
          { date: '03/14', label: 'Out-of-network ATM fee', amount: -3.5, flag: { text: 'ATM fee', tone: 'critical' } },
          { date: '03/15', label: 'Payroll deposit', amount: 1850 },
          { date: '03/31', label: 'Monthly maintenance fee', amount: -12, flag: { text: 'Monthly fee', tone: 'critical' } },
        ]}
        summary={[
          { label: 'Overdraft fee', value: '$35.00' },
          { label: 'Out-of-network ATM fee', value: '$3.50' },
          { label: 'Monthly maintenance fee', value: '$12.00' },
          { label: 'Fees this month', value: '$50.50', strong: true },
        ]}
      />
    </Figure>
  );
}

const FEE_DEFAULTS = { overdrafts: 2, overdraftFee: 35, maint: 12, atmUses: 2, atmOwner: 3, atmBank: 3 };
type FeeState = typeof FEE_DEFAULTS;
const FEE_PRESETS: Preset<FeeState>[] = [
  { label: 'Example account', values: {} },
  { label: 'Overdraft-heavy', values: { overdrafts: 8, maint: 0, atmUses: 0 } },
  { label: 'No fees', values: { overdrafts: 0, maint: 0, atmUses: 0 } },
];
const FEE_GUIDE: SimGuide<FeeState> = {
  how: ['Enter how often you are charged each kind of fee.', 'Enter the amount of each fee from your bank\'s fee schedule.', 'Read the yearly total and what that money could grow to if you saved it instead.'],
  tryThis: [
    { label: 'Set the monthly maintenance fee to $0, as at a no-fee account.', done: (s) => s.maint === 0 },
    { label: 'Raise overdrafts to 8 a year. Which fee is now the largest?', done: (s) => s.overdrafts >= 8 },
    { label: 'Set ATM uses to 0, as when you use in-network ATMs.', done: (s) => s.atmUses === 0 },
  ],
};

function BankFeeCalculator() {
  const sim = useSim(FEE_DEFAULTS);
  const s = sim.state;
  const od = s.overdrafts * s.overdraftFee;
  const mt = s.maint * 12;
  const atm = s.atmUses * 12 * (s.atmOwner + s.atmBank);
  const total = od + mt + atm;
  const saved = futureValue(total / 12, 4, 120);
  const segs: Segment[] = [
    { key: 'od', label: 'Overdraft', value: od, color: 'var(--s1)' },
    { key: 'mt', label: 'Maintenance', value: mt, color: 'var(--s2)' },
    { key: 'atm', label: 'ATM', value: atm, color: 'var(--s3)' },
  ].filter((x) => x.value > 0);
  return (
    <SimCard title="Bank Fee Calculator" kind="Mini sandbox" icon={Receipt} sim={sim} presets={FEE_PRESETS} guide={FEE_GUIDE}
      subtitle="Add up what bank fees cost you in a year.">
      <SimGrid controls={
        <>
          <ControlGroup title="Overdrafts">
            <SliderField label="Overdrafts per year" value={s.overdrafts} onChange={sim.set('overdrafts')} min={0} max={12} step={1} format={(v) => String(v)} />
            <SliderField label="Fee per overdraft" value={s.overdraftFee} onChange={sim.set('overdraftFee')} min={0} max={40} step={1} format={(v) => usd(v)} help="Fees of up to about $35 are common." />
          </ControlGroup>
          <ControlGroup title="Monthly fee">
            <SliderField label="Monthly maintenance fee" value={s.maint} onChange={sim.set('maint')} min={0} max={25} step={1} format={(v) => usd(v)} />
          </ControlGroup>
          <ControlGroup title="Out-of-network ATMs">
            <SliderField label="ATM uses per month" value={s.atmUses} onChange={sim.set('atmUses')} min={0} max={8} step={1} format={(v) => String(v)} />
            <SliderField label="Fee charged by the ATM owner" value={s.atmOwner} onChange={sim.set('atmOwner')} min={0} max={5} step={0.5} format={(v) => usd(v, { cents: true })} />
            <SliderField label="Fee charged by your own bank" value={s.atmBank} onChange={sim.set('atmBank')} min={0} max={5} step={0.5} format={(v) => usd(v, { cents: true })} />
          </ControlGroup>
        </>
      }>
        <StatGrid>
          <StatTile label="Fees per year" value={usd(total)} emphasis />
          <StatTile label="Fees per month" value={usd(total / 12, { cents: true })} />
          <StatTile label="Saved instead, 10 years" value={usd(saved)} sub="at an example 4% a year" />
        </StatGrid>
        {total > 0 ? (
          <div className="rounded-xl border border-line p-4">
            <p className="mb-3 text-sm font-semibold text-ink">Where the {usd(total)} a year goes</p>
            <SegmentBar segments={segs} total={total} format={usd} inside="value" ariaLabel="Yearly cost of each kind of bank fee" />
            <SegmentLegend segments={segs} total={total} format={usd} />
          </div>
        ) : (
          <Nudge tone="good" title="No bank fees">
            You pay $0 in bank fees. Keep checking your statement each month in case a new fee appears.
          </Nudge>
        )}
        {s.overdrafts > 0 && (
          <Nudge tone="warning" title={s.overdrafts + ' overdrafts cost ' + usd(od) + ' a year'}>
            Turn off debit card overdraft coverage. Purchases that would overdraw the account are declined instead of charged.
          </Nudge>
        )}
        {mt > 0 && (
          <Nudge tone="tip" title="A monthly fee can usually be avoided">
            Switch to an account with no monthly fee, or meet the requirement that waives it. That saves {usd(mt)} a year.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 2.3 Automate payday                                                 */
/* ================================================================== */

function PaydayFlowDiagram() {
  return (
    <Figure
      kind="diagram"
      title="What happens on payday"
      subtitle="An example $2,000 paycheck, paid every two weeks."
      howToRead={[
        'Read from left to right. The paycheck is split before you spend anything.',
        'The middle column shows the three automatic moves and how much each one sends.',
        'The right box is the money that is left for spending.',
      ]}
      takeaway={<>Of every $2,000 paycheck, <strong>$200</strong> goes to savings, <strong>$100</strong> to retirement and <strong>$738</strong> is set aside for bills. That leaves <strong>$962</strong> to spend with no guilt, because everything else is already handled.</>}
      note="Illustrative. Bills of $1,600 a month are $19,200 a year, or about $738 per paycheck across 26 paychecks. The retirement amount is shown as 5% of the paycheck for simplicity; a real 401(k) contribution comes out before the paycheck reaches your bank."
    >
      <FlowDiagram label="Paycheck arrives, then savings, retirement and bills are paid automatically, then the remaining money is for spending" steps={[
        { icon: Banknote, title: 'Paycheck arrives', amount: '$2,000', detail: 'Direct deposit to checking.' },
        [
          { icon: PiggyBank, title: 'Savings (HYSA)', amount: '$200', detail: 'Automatic transfer on payday.', emphasis: true },
          { icon: Landmark, title: 'Retirement (401(k))', amount: '$100', detail: 'Set as a percentage at work.' },
          { icon: House, title: 'Bills (autopay)', amount: '$738', detail: 'Rent, utilities, phone, insurance.' },
        ],
        { icon: Wallet, title: 'Spending money', amount: '$962', detail: 'Spend it however you like.' },
      ]} />
    </Figure>
  );
}

type CalEvent = { day: number; label: string; icon: typeof Banknote; kind: 'pay' | 'move' | 'bill' };
const CAL_EVENTS: CalEvent[] = [
  { day: 1, label: 'Payday', icon: Banknote, kind: 'pay' },
  { day: 1, label: 'To savings $200', icon: PiggyBank, kind: 'move' },
  { day: 3, label: 'Rent autopay', icon: House, kind: 'bill' },
  { day: 5, label: 'Phone autopay', icon: Smartphone, kind: 'bill' },
  { day: 15, label: 'Payday', icon: Banknote, kind: 'pay' },
  { day: 15, label: 'To savings $200', icon: PiggyBank, kind: 'move' },
  { day: 18, label: 'Card autopay (full balance)', icon: CreditCard, kind: 'bill' },
  { day: 22, label: 'Electric autopay', icon: Zap, kind: 'bill' },
];

function PaydayCalendar() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const lead = 3;
  const tone = { pay: 'bg-good-soft text-good-text', move: 'bg-accent-soft text-ink', bill: 'bg-surface-2 text-ink-2' } as const;
  return (
    <Figure
      kind="example"
      title="A payday calendar for one month"
      subtitle="Paid on the 1st and the 15th. Every move is scheduled in advance."
      howToRead={[
        'Each square is one day of an example 30-day month.',
        'Green tags mark paydays. Blue tags mark the automatic transfer to savings on the same day.',
        'Grey tags mark bills that are paid by autopay, spread across the month.',
      ]}
      takeaway={<>Two paydays and four scheduled bills mean <strong>$400 reaches savings</strong> in the month without you logging in, and every bill is paid on time.</>}
      note="Example schedule. Your paydays and due dates will differ; many bills let you choose the due date."
    >
      <div role="img" aria-label="Example month calendar. Payday and a 200 dollar transfer to savings on the 1st and 15th. Rent autopay on the 3rd, phone on the 5th, credit card full balance on the 18th, electric on the 22nd.">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium tracking-[0.1em] text-muted uppercase" aria-hidden>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1" aria-hidden>
          {Array.from({ length: lead }, (_, i) => <div key={'x' + i} />)}
          {days.map((d) => {
            const ev = CAL_EVENTS.filter((e) => e.day === d);
            return (
              <div key={d} className={'min-h-[4.5rem] rounded-lg border p-1 ' + (ev.length ? 'border-line-strong bg-surface' : 'border-line bg-surface-2/40')}>
                <p className="tnum text-[11px] font-medium text-muted">{d}</p>
                <div className="mt-0.5 space-y-0.5">
                  {ev.map((e) => (
                    <p key={e.label} className={'flex items-start gap-1 rounded px-1 py-0.5 text-[9px] leading-tight font-medium sm:text-[10px] ' + tone[e.kind]}>
                      <e.icon className="mt-px size-2.5 shrink-0" strokeWidth={2} aria-hidden /><span>{e.label}</span>
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Figure>
  );
}

type Freq = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
const PERIODS: Record<Freq, { n: number; label: string }> = {
  weekly: { n: 52, label: 'Weekly' },
  biweekly: { n: 26, label: 'Every 2 weeks' },
  semimonthly: { n: 24, label: 'Twice a month' },
  monthly: { n: 12, label: 'Monthly' },
};

const PLAN_DEFAULTS: { pay: number; freq: Freq; savePct: number; retPct: number; bills: number } = { pay: 2000, freq: 'biweekly', savePct: 10, retPct: 5, bills: 1600 };
type PlanState = typeof PLAN_DEFAULTS;
const PLAN_PRESETS: Preset<PlanState>[] = [
  { label: 'Paid twice a month', values: { pay: 2200, freq: 'semimonthly', bills: 1900 } },
  { label: 'Paid monthly', values: { pay: 4400, freq: 'monthly', bills: 2000, savePct: 15 } },
  { label: 'Paid weekly', values: { pay: 1000, freq: 'weekly', bills: 1700, savePct: 8, retPct: 4 } },
];
const PLAN_GUIDE: SimGuide<PlanState> = {
  how: ['Enter the pay you receive per paycheck and how often you are paid.', 'Set the share that goes to savings and to retirement, and your fixed bills for a month.', 'Read what each paycheck is split into and what is left to spend.'],
  tryThis: [
    { label: 'Raise savings to 20%. How much does the spending money change per paycheck?', done: (s) => s.savePct >= 20 },
    { label: 'Switch to paid monthly. Do the yearly totals change?', done: (s) => s.freq === 'monthly' },
    { label: 'Raise bills until nothing is left to spend.', done: (s) => s.pay * (1 - (s.savePct + s.retPct) / 100) - (s.bills * 12) / PERIODS[s.freq].n <= 0 },
  ],
};

function PaydayPlan() {
  const sim = useSim(PLAN_DEFAULTS);
  const s = sim.state;
  const n = PERIODS[s.freq].n;
  const save = (s.pay * s.savePct) / 100;
  const ret = (s.pay * s.retPct) / 100;
  const bills = (s.bills * 12) / n;
  const spend = s.pay - save - ret - bills;
  const segs: Segment[] = [
    { key: 'save', label: 'Savings', value: save, color: 'var(--s1)' },
    { key: 'ret', label: 'Retirement', value: ret, color: 'var(--s2)' },
    { key: 'bills', label: 'Bills', value: bills, color: 'var(--s3)' },
    { key: 'spend', label: 'Spending money', value: Math.max(0, spend), color: 'var(--s4)', ink: 'var(--on-s4)' },
  ].filter((x) => x.value > 0);
  const barTotal = Math.max(s.pay, save + ret + bills);
  return (
    <SimCard title="Payday Plan" kind="Mini sandbox" icon={CalendarClock} sim={sim} presets={PLAN_PRESETS} guide={PLAN_GUIDE}
      subtitle="Split each paycheck before you spend any of it.">
      <SimGrid controls={
        <>
          <ControlGroup title="Your paycheck">
            <SliderField label="Pay per paycheck" value={s.pay} onChange={sim.set('pay')} min={300} max={8000} step={50} format={(v) => usd(v)} help="After taxes and insurance, before any 401(k)." />
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink-2">How often you are paid</p>
              <SegmentedControl<Freq> label="Pay frequency" size="sm" value={s.freq} onChange={sim.set('freq')} options={(Object.keys(PERIODS) as Freq[]).map((k) => ({ value: k, label: PERIODS[k].label }))} />
            </div>
          </ControlGroup>
          <ControlGroup title="Your split">
            <SliderField label="Savings (HYSA)" value={s.savePct} onChange={sim.set('savePct')} min={0} max={40} step={1} format={(v) => v + '% of pay'} />
            <SliderField label="Retirement (401(k))" value={s.retPct} onChange={sim.set('retPct')} min={0} max={25} step={1} format={(v) => v + '% of pay'} />
            <SliderField label="Fixed bills per month" value={s.bills} onChange={sim.set('bills')} min={0} max={6000} step={50} format={(v) => usd(v)} help="Rent, utilities, phone, insurance, minimum payments." />
          </ControlGroup>
        </>
      }>
        <StatGrid cols={4}>
          <StatTile label="To savings, each paycheck" value={usd(save)} />
          <StatTile label="To retirement, each paycheck" value={usd(ret)} />
          <StatTile label="Set aside for bills" value={usd(bills)} />
          <StatTile label="Spending money, each paycheck" value={usd(spend)} emphasis />
        </StatGrid>
        <StatGrid cols={2}>
          <StatTile label="Saved in a year" value={usd(save * n)} sub={n + ' paychecks'} />
          <StatTile label="Retirement in a year" value={usd(ret * n)} sub="before any employer match" />
        </StatGrid>
        {spend >= 0 && barTotal > 0 && (
          <div className="rounded-xl border border-line p-4">
            <p className="mb-3 text-sm font-semibold text-ink">One {usd(s.pay)} paycheck</p>
            <SegmentBar segments={segs} total={barTotal} format={usd} inside="value" ariaLabel="How one paycheck is split" />
            <SegmentLegend segments={segs} total={barTotal} format={usd} />
          </div>
        )}
        {spend < 0 ? (
          <Nudge tone="critical" title={'Over by ' + usd(-spend) + ' per paycheck'}>
            The split is larger than the paycheck. Lower the savings or retirement percentage, or look at which bills can be reduced (see Chapter 1).
          </Nudge>
        ) : spend < s.pay * 0.15 ? (
          <Nudge tone="warning" title={'Only ' + usd(spend) + ' left to spend'}>
            Less than 15% of the paycheck is left for everyday spending. Check that fixed bills are not too high before cutting savings.
          </Nudge>
        ) : (
          <Nudge tone="good" title={usd(spend) + ' is yours to spend'}>
            Savings, retirement and bills are already handled, so you can spend this amount without tracking each purchase.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* Quiz and rules                                                      */
/* ================================================================== */

const questions: QuizQuestion[] = [
  {
    id: 'where-to-save',
    scenario: <>You have an <strong>$15,000</strong> emergency fund in a savings account at a large traditional bank that pays 0.01%. An online bank that is FDIC insured offers a high-yield savings account paying 4.00% (an example rate).</>,
    prompt: 'What is the best move?',
    options: [
      { text: 'Leave it. A big bank is safer than an online bank.', why: <>Both are equally safe when <Term id="fdic-insurance">FDIC insured</Term>: coverage is $250,000 per depositor, per insured bank, per ownership category. Leaving it costs you about $598 a year in interest.</> },
      { text: 'Move it to the online HYSA and keep one month of bills in checking.', correct: true, why: <>At 0.01%, $15,000 earns about <strong>$1.50</strong> a year. At 4.00% it earns about <strong>$600</strong>. The money stays insured, and a month of bills in checking covers the 1 to 3 business days a transfer takes.</> },
      { text: 'Move it all to checking so you can reach it quickly.', why: <>Checking usually pays close to 0% and makes the fund likely to be spent by accident. Keep one month of bills there and the rest in savings.</> },
      { text: 'Withdraw it as cash and keep it at home.', why: <>Cash earns $0 and is not insured. A theft or fire is a total loss, while a bank deposit up to $250,000 is covered.</> },
    ],
  },
  {
    id: 'overdraft',
    scenario: <>Your checking balance is <strong>$3</strong>. You tap your debit card for a <strong>$5</strong> coffee. Overdraft coverage is on, and your bank charges a <Term id="overdraft-fee">$35 overdraft fee</Term>.</>,
    prompt: 'What should you do about it?',
    options: [
      { text: 'Nothing. It is only $35 and this will not happen often.', why: <>Two overdrafts a year is $70. Overdrafts tend to repeat, and each one turns a $5 purchase into a $40 purchase.</> },
      { text: 'Opt out of overdraft coverage for debit card and ATM transactions.', correct: true, why: <>Federal rules let a bank charge overdraft fees on ATM and one-time debit card purchases only if you opted in. After you opt out, the card is declined and you pay <strong>$0</strong> instead of $35. Set up low-balance alerts too, since checks and automatic payments are not covered by that opt-in rule.</> },
      { text: 'Add a second account at another bank.', why: <>This does not stop the fee at the first bank. The fee is controlled by the overdraft setting on the account.</> },
      { text: 'Stop using the debit card entirely.', why: <>That works, but it is unnecessary. Turning off overdraft coverage gives you a debit card that cannot create a fee.</> },
    ],
  },
  {
    id: 'automate',
    scenario: <>You are paid <strong>$2,000 every two weeks</strong> (26 paychecks a year). You want to save <strong>$200</strong> from each paycheck. So far you have planned to move money "when you remember," and you moved it in 4 of the last 12 months.</>,
    prompt: 'Which setup is most likely to work?',
    options: [
      { text: 'Move $200 by hand on the last day of the month, if you have it.', why: <>This depends on having money left and remembering. Spending usually rises to match the balance, so the transfer often does not happen.</> },
      { text: 'Schedule an automatic $200 transfer to savings on each payday.', correct: true, why: <>The <Term id="automatic-transfer">automatic transfer</Term> happens on the day the money arrives. That is $200 × 26 = <strong>$5,200 a year</strong>, and you spend what is left without checking.</> },
      { text: 'Save a smaller amount, $50 a month, so it is simpler to remember.', why: <>$50 × 12 = $600 a year, compared with $5,200. A smaller target does not fix the problem; automating the larger one does.</> },
      { text: 'Wait for a raise before starting to save.', why: <>Waiting means $0 saved in the meantime. Start with the amount you can manage today and raise it with each raise.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: PiggyBank, title: 'Keep bill money in checking and saved money in a HYSA.', body: <>Keep about one month of bills in checking. Put your emergency fund and savings goals in an FDIC- or NCUA-insured online HYSA, where <strong>4%</strong> earns about 400 times what 0.01% does.</> },
  { icon: Ban, title: 'Turn off overdraft coverage and avoid account fees.', body: <>Opt out of debit card overdraft coverage so a $5 coffee cannot cost $40. Use an account with no monthly fee and in-network ATMs.</> },
  { icon: CalendarClock, title: 'Schedule payday so you spend what is left.', body: <>On payday, send money to savings, retirement and bills automatically. Put credit cards on autopay for the full <strong>statement balance</strong>.</> },
];

/* ================================================================== */

export default function BankingChapter() {
  return (
    <ChapterLayout
      id="banking"
      questions={questions}
      rules={rules}
      sections={{
        '2-1': (
          <>
            <P>You need two kinds of account. Each does one job well.</P>
            <Compare
              left={{ title: 'Checking account', body: <>Use it for bills and daily spending. Your paycheck arrives here, your debit card is linked to it, and your bills are paid from it. It usually pays little or no interest. See <Term id="checking-account">checking account</Term>.</> }}
              right={{ title: 'Savings account', body: <>Use it to keep cash safe and growing. It holds money you do not plan to spend this month, and it pays interest. Choose an account that pays a competitive rate.</> }}
            />
            <H3>Big banks pay almost nothing</H3>
            <P>Large traditional banks often pay about <strong className="text-ink">0.01%</strong> on savings. On $10,000 that is $1 a year. Online banks have no branches to run, and many pay far more through a high-yield savings account, or HYSA. Rates change over time, so the 4.00% used here is an example.</P>
            <InterestComparisonChart />
            <Example title="The same $10,000 for one year">
              <p>At <strong>0.01%</strong> you earn about <strong>$1</strong>. At <strong>4.00%</strong> you earn about <strong>$400</strong>. You did the same thing with the money; only the account differs.</p>
              <p>An HYSA rate is a variable rate. It moves with the Federal Reserve's interest rate: when the Fed lowers rates, HYSA rates usually fall, and when it raises them, HYSA rates usually rise.</p>
            </Example>
            <H3>Is an online bank just as safe?</H3>
            <P>Yes, when the deposits are insured. Insurance protects your money if the bank fails.</P>
            <ConceptCards cols={2} items={[
              { icon: ShieldCheck, title: 'FDIC for banks', body: <><Term id="fdic-insurance">FDIC insurance</Term> covers $250,000 per depositor, per insured bank, per ownership category. Check that your bank is a member with the FDIC's BankFind tool.</> },
              { icon: ShieldCheck, title: 'NCUA for credit unions', body: <>The NCUA insures credit union deposits to the same $250,000 per member, per insured credit union, per ownership category. Check the credit union's NCUA insured status.</> },
            ]} />
            <AccountRolesDiagram />
            <Bullets items={[
              <><strong className="text-ink">Checking:</strong> rent, utilities, groceries and other spending, plus about one month of expenses.</>,
              <><strong className="text-ink">HYSA:</strong> your <Term id="emergency-fund">emergency fund</Term>, <Term id="sinking-fund">sinking funds</Term> for known future costs, and short-term goals.</>,
              <><strong className="text-ink">Transfers take time.</strong> Moving money between two banks usually takes 1 to 3 business days, so a month of bills in checking means a bill never waits on a transfer.</>,
            ]} />
            <HysaVsBank />
            <GoDeeper title="Where the interest figures come from">
              <p>Interest is added each month. The balance after <em>n</em> months is the starting balance grown by the monthly rate, plus each deposit grown for the months it has been in the account. Rates are shown as an annual percentage yield; see <Term id="apr-vs-apy">APR vs. APY</Term>.</p>
              <p>The chart assumes a constant rate. Real HYSA rates can change at any time.</p>
            </GoDeeper>
          </>
        ),
        '2-2': (
          <>
            <P>Bank fees pay for nothing. You get no extra service in return, and most of them can be avoided with a few settings and one account choice.</P>
            <H3>Turn off overdraft coverage</H3>
            <P>An <Term id="overdraft-fee">overdraft fee</Term> is charged when the bank approves a purchase that is larger than your balance. Fees of up to about $35 are common. Under the federal rule known as Regulation E, a bank can charge overdraft fees on ATM withdrawals and one-time debit card purchases only if you opted in. You can opt out at any time.</P>
            <CoffeeFeeDiagram />
            <Steps items={[
              { title: 'Find the setting.', body: 'Look in your bank\'s app settings, call the number on the back of your card, or ask at a branch. It is often called "overdraft protection," "overdraft coverage" or "standard overdraft."' },
              { title: 'Opt out for debit card and ATM transactions.', body: 'Tell the bank you do not want to be charged for these. Ask for confirmation in writing or in the app.' },
              { title: 'Know what remains.', body: 'After you opt out, a card purchase that would overdraw the account is declined. You pay $0.' },
              { title: 'Cover checks and automatic payments another way.', body: 'The opt-in rule does not cover checks or automatic bill payments. Set low-balance alerts and link your savings account for overdraft transfers if your bank offers them.' },
            ]} />
            <Mistakes items={[
              <><strong>Leaving coverage on "just in case."</strong> It lets you overspend and costs about $35 each time.</>,
              <><strong>Assuming a declined card is the bad outcome.</strong> A declined $5 coffee costs you nothing. An approved one costs $40.</>,
              <><strong>Forgetting bill payments.</strong> A rejected check or automatic payment can carry its own fees, so keep a buffer in checking and use alerts.</>,
            ]} />
            <H3>Avoid monthly maintenance fees</H3>
            <P>A <Term id="maintenance-fee">monthly maintenance fee</Term> is a charge for having the account, often $5 to $15. Many accounts waive it if you keep a minimum balance or set up direct deposit. Many banks and credit unions offer checking accounts with no monthly fee at all.</P>
            <Bullets items={[
              <>Choose an account with <strong className="text-ink">no monthly fee</strong>, if one is available to you.</>,
              <>If your account has a fee, find the <strong className="text-ink">waiver rule</strong> and meet it, for example with direct deposit.</>,
              <>Review your fee schedule once a year. Banks change fees.</>,
            ]} />
            <H3>Avoid out-of-network ATM fees</H3>
            <P>An <Term id="atm-fee">out-of-network ATM fee</Term> is often charged twice: once by the ATM's owner and once by your own bank. Two uses a month at $3 each side cost $144 a year.</P>
            <Bullets items={[
              <>Use ATMs in your bank's network. Your bank's app shows where they are.</>,
              <>Ask for <strong className="text-ink">cash back</strong> at a grocery store when you pay with your debit card. It is usually free.</>,
              <>Pick a bank that refunds ATM fees, or take out larger amounts less often.</>,
            ]} />
            <FeeCostChart />
            <FeeStatementFigure />
            <BankFeeCalculator />
            <GoDeeper title="What these fees add up to over time">
              <p>$358 a year is about $30 a month. If you saved that $30 a month in an account earning 4% instead, it would grow to about {usd(futureValue(358 / 12, 4, 120))} in 10 years. The calculator above shows the same figure for your numbers.</p>
            </GoDeeper>
          </>
        ),
        '2-3': (
          <>
            <P>Saving works best when it does not depend on remembering. Set up the moves once, on payday, and they happen on their own.</P>
            <H3>The payday routine</H3>
            <Bullets items={[
              <>Your paycheck arrives by direct deposit.</>,
              <>Money moves automatically to <strong className="text-ink">savings</strong>, <strong className="text-ink">retirement</strong> and <strong className="text-ink">bills</strong>.</>,
              <>You spend what is left. It is already free of obligations, so you can spend it without guilt.</>,
            ]} />
            <PaydayFlowDiagram />
            <P>This is <Term id="pay-yourself-first">paying yourself first</Term>, carried out by your bank and employer rather than by your memory.</P>
            <H3>Set it up in four steps</H3>
            <Steps items={[
              { title: 'Move savings on payday.', body: <>Ask your employer to split your direct deposit between checking and savings, or schedule an <Term id="automatic-transfer">automatic transfer</Term> from checking to your HYSA for the same day your pay arrives.</> },
              { title: 'Set your retirement percentage at work.', body: <>Choose a percentage in your employer's retirement plan, such as a <Term id="k401">401(k)</Term>. It comes out of each paycheck before the money reaches your bank. If your employer offers a match, contribute at least enough to receive all of it (see <Term id="employer-match">employer match</Term>).</> },
              { title: 'Put fixed bills on autopay.', body: <>Rent, utilities, phone and insurance are <Term id="fixed-expense">fixed expenses</Term>. Pick due dates shortly after payday where you can. For credit cards, set autopay to the full <Term id="statement-balance">statement balance</Term> so you never pay interest or a late fee.</> },
              { title: 'Spend what is left.', body: 'Use the remaining money in checking for everything else. You do not need to track each purchase, because savings, retirement and bills are already paid.' },
            ]} />
            <PaydayCalendar />
            <Example title="A $2,000 biweekly paycheck">
              <p>Transfer 10% ($200) to savings and contribute 5% ($100) to a 401(k). Bills of $1,600 a month are $19,200 a year, or about $738 per paycheck. That leaves <strong>$962</strong> to spend.</p>
              <p>Across 26 paychecks, savings reach <strong>$5,200</strong> and retirement contributions <strong>$2,600</strong>, with no monthly decisions.</p>
            </Example>
            <Mistakes items={[
              <><strong>Autopaying only the minimum on a credit card.</strong> It leaves a balance that charges interest. Use the full statement balance.</>,
              <><strong>Scheduling bills before payday with a low balance.</strong> A bill that arrives before your pay can overdraw the account. Move due dates after payday, or keep a month of bills in checking.</>,
              <><strong>Never checking the setup.</strong> Review it every few months and after every raise or bill change.</>,
            ]} />
            <PaydayPlan />
            <GoDeeper title="If your pay varies from week to week">
              <p>Set the automatic transfer to a smaller amount you can always afford, and move extra by hand in a better week. Keep a full month of expenses in checking so bills are paid whatever the paycheck.</p>
            </GoDeeper>
          </>
        ),
      }}
    />
  );
}
