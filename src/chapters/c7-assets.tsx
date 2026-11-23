import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownToLine, ArrowUpFromLine, Calculator, Car, Clock, CreditCard, GraduationCap, Handshake, House, PiggyBank, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { ChapterLayout } from '../components/ChapterLayout';
import { Term } from '../components/Glossary';
import { Bullets, Example, GoDeeper, H3, Mistakes, MythBuster, P, Steps } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset, type SimGuide } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { Disclosure, SegmentedControl } from '../components/ui';
import { ChartFrame, activeDot, cursorProps, gridProps, TooltipBox, xAxisProps, yAxisProps } from '../components/Chart';
import { BAR_RADIUS, COLUMN_RADIUS, MAX_BAR, barEndLabel, endLabel, Figure } from '../components/Figure';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { monthlyRate } from '../lib/growth';
import { num, pct, usd } from '../lib/format';
import { RENT_BUY_ASSUMPTIONS, autoCost, mortgagePayment, simulateRentBuy, type AutoInputs } from '../lib/housing';

/** Balance after months of end-of-month deposits growing at annualPct a year. */
const futureValue = (monthly: number, annualPct: number, months: number) => {
  const r = monthlyRate(annualPct);
  return r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
};

/** Car value after y years: new cars lose 20% in year one and 15% a year after; used cars about 10% a year. */
const carValue = (price: number, y: number, kind: 'new' | 'used') => {
  let v = price;
  for (let i = 1; i <= y; i++) v *= kind === 'new' ? (i === 1 ? 0.8 : 0.85) : 0.9;
  return v;
};

/** Loan amount that a fixed monthly payment repays over the given months. */
const loanFor = (payment: number, apr: number, months: number) => {
  const r = apr / 100 / 12;
  return r === 0 ? payment * months : (payment * (1 - Math.pow(1 + r, -months))) / r;
};

/* ================================================================== */
/* 7.1 Assets vs. liabilities                                          */
/* ================================================================== */

function AssetLiabilityDiagram() {
  const col = (
    title: string, sub: string, dir: 'in' | 'out', color: string,
    items: { icon: typeof Car; label: string; detail: string }[],
  ) => (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink"><span className="size-2.5 rounded-full" style={{ background: color }} aria-hidden />{title}</p>
      <p className="mt-0.5 text-[13px] text-ink-2">{sub}</p>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-[13px] font-medium text-ink">
        {dir === 'in' ? <ArrowDownToLine className="size-4" aria-hidden /> : <ArrowUpFromLine className="size-4" aria-hidden />}
        {dir === 'in' ? 'Money or value flows toward you' : 'Money flows away from you every month'}
      </div>
      <ul className="mt-3 space-y-2.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-start gap-2.5 text-[13px]">
            <it.icon className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
            <span><span className="font-medium text-ink">{it.label}</span><span className="block text-ink-2">{it.detail}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <Figure
      kind="diagram"
      title="Two directions money can move"
      subtitle="The same question applied to different purchases."
      howToRead={[
        'The left column lists things that pay you or tend to grow in value.',
        'The right column lists things that charge you every month or lose value.',
        'The arrow in each column shows the direction of the money.',
      ]}
      takeaway={<>Sort a purchase by what it does to your <strong>monthly cash flow</strong> and to its own value. A $450 monthly car payment sits in the right column. $450 invested every month sits in the left.</>}
    >
      <div role="img" aria-label="Assets on the left, liabilities on the right" className="grid gap-4 md:grid-cols-2">
        {col('Assets', 'Put money in your pocket or grow in value', 'in', 'var(--s1)', [
          { icon: PiggyBank, label: 'Index funds', detail: 'Own small shares of many companies. Their value has tended to rise over long periods and they can pay dividends.' },
          { icon: GraduationCap, label: 'A skill or certification', detail: 'A $1,500 course that raises your pay by $4,000 a year returns more than it cost.' },
          { icon: House, label: 'Rental property', detail: 'Rent comes in each month and the property can rise in value, after repairs, taxes and insurance.' },
        ])}
        {col('Liabilities', 'Take money out of your pocket every month', 'out', 'var(--s2)', [
          { icon: Car, label: 'Car loan', detail: 'A fixed payment each month, on a car that loses value each year.' },
          { icon: CreditCard, label: 'Credit card balance', detail: 'Interest is added every month, commonly around 20% a year.' },
          { icon: Wallet, label: 'Financed furniture or a boat', detail: 'Monthly payments plus insurance, storage or upkeep, on items that sell for less than you paid.' },
        ])}
      </div>
    </Figure>
  );
}

const CAR_PAYMENT = 500;
const CAR_LOAN = Math.round(loanFor(CAR_PAYMENT, 7, 72));
const CAR_VS_INVEST = Array.from({ length: 11 }, (_, y) => {
  const at6 = futureValue(CAR_PAYMENT, 7, 72);
  const invested = y <= 6 ? futureValue(CAR_PAYMENT, 7, y * 12) : at6 * Math.pow(1 + monthlyRate(7), (y - 6) * 12);
  return { year: y, invested: Math.round(invested), car: Math.round(carValue(CAR_LOAN, y, 'new')) };
});

function CarVsInvestChart() {
  const last = CAR_VS_INVEST[CAR_VS_INVEST.length - 1];
  const six = CAR_VS_INVEST[6];
  const li = CAR_VS_INVEST.length - 1;
  return (
    <Figure
      title={'The same ' + usd(CAR_PAYMENT) + ' a month, spent two ways'}
      subtitle={'One person makes car payments for 6 years. The other invests ' + usd(CAR_PAYMENT) + ' a month for 6 years, then adds nothing.'}
      legend={[{ label: 'Invested ' + usd(CAR_PAYMENT) + '/month for 6 years', color: 'var(--s1)' }, { label: 'Value of a ' + usd(CAR_LOAN) + ' new car', color: 'var(--s2)' }]}
      height={300}
      table={{ columns: ['Year', 'Investment balance', 'Car value'], rows: CAR_VS_INVEST.filter((d) => d.year % 2 === 0).map((d) => [d.year, usd(d.invested), usd(d.car)]) }}
      howToRead={[
        'The bottom axis counts years. The side axis shows what each choice is worth.',
        'The investment line rises while deposits continue (years 0 to 6) and keeps rising after they stop.',
        'The car line falls every year, including the years after the loan is paid off.',
      ]}
      takeaway={<>At year 6 the investment is worth about <strong>{usd(six.invested)}</strong> and the car about <strong>{usd(six.car)}</strong>. By year 10 the gap is {usd(last.invested - last.car)}.</>}
      note={'Illustrative. Assumes a ' + usd(CAR_LOAN) + ' car financed at 7% for 72 months, value falling 20% in year one and 15% a year after, and 7% average yearly growth on the investment. Ignores the need for transportation, fuel and insurance.'}
    >
      <LineChart data={CAR_VS_INVEST} margin={{ top: 16, right: 96, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="year" type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tickFormatter={(v) => (v === 0 ? 'Now' : 'Yr ' + v)} {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Year ' + l} valueFormat={(v) => usd(v)} />} />
        <ReferenceLine x={6} stroke="var(--ink-2)" strokeDasharray="4 3" label={{ value: 'Payments end', position: 'insideTopLeft', fill: 'var(--ink-2)', fontSize: 11 }} />
        <Line dataKey="invested" name="Investment balance" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Invested ' + usd(last.invested, { compact: true }))} />
        <Line dataKey="car" name="Car value" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Car ' + usd(last.car, { compact: true }))} />
      </LineChart>
    </Figure>
  );
}

const PAY_DEFAULTS = { monthly: 500, years: 6, ret: 7 };
type PayState = typeof PAY_DEFAULTS;
const PAY_PRESETS: Preset<PayState>[] = [
  { label: '$300 for 5 years', values: { monthly: 300, years: 5, ret: 7 } },
  { label: '$500 for 6 years', values: { monthly: 500, years: 6, ret: 7 } },
  { label: '$800 for 7 years', values: { monthly: 800, years: 7, ret: 7 } },
];
const PAY_GUIDE: SimGuide<PayState> = {
  how: ['Set the monthly payment and how many years you pay it.', 'Set the yearly growth you assume for the investment.', 'Compare what the car is worth with what the investment is worth.'],
  tryThis: [
    { label: 'Raise the payment to $800. How much larger does the gap get?', done: (s) => s.monthly >= 800 },
    { label: 'Set growth to 0%. Is the investment still worth more than the car?', done: (s) => s.ret === 0 },
  ],
};

function PaymentDirection() {
  const sim = useSim(PAY_DEFAULTS);
  const s = sim.state;
  const months = s.years * 12;
  const price = loanFor(s.monthly, 7, months);
  const car = carValue(price, s.years, 'new');
  const invested = futureValue(s.monthly, s.ret, months);
  const paid = s.monthly * months;
  const segs: Segment[] = [
    { key: 'inv', label: 'Investment balance', value: invested, color: 'var(--s1)' },
    { key: 'car', label: 'Car value', value: car, color: 'var(--s2)' },
  ];
  return (
    <SimCard title="Payment Direction" kind="Mini sandbox" icon={TrendingUp} sim={sim} presets={PAY_PRESETS} guide={PAY_GUIDE}
      subtitle="Compare a car payment with the same amount invested each month.">
      <SimGrid controls={
        <ControlGroup title="Your numbers">
          <SliderField label="Monthly amount" value={s.monthly} onChange={sim.set('monthly')} min={100} max={1500} step={25} format={(v) => usd(v)} />
          <SliderField label="Years of payments" value={s.years} onChange={sim.set('years')} min={2} max={8} step={1} format={(v) => v + ' yrs'} help="The car loan is assumed to be 7% for this many years." />
          <SliderField label="Investment growth" value={s.ret} onChange={sim.set('ret')} min={0} max={10} step={0.5} format={(v) => pct(v, 1) + '/yr'} />
        </ControlGroup>
      }>
        <StatGrid cols={4}>
          <StatTile label="Total paid or invested" value={usd(paid)} sub={usd(s.monthly) + ' × ' + months + ' months'} />
          <StatTile label="Car you could finance" value={usd(price)} sub="new, 7% loan" />
          <StatTile label="Car worth at the end" value={usd(car)} sub={'after ' + s.years + ' years'} />
          <StatTile label="Investment worth" value={usd(invested)} sub={usd(invested - car) + ' more than the car'} emphasis />
        </StatGrid>
        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold text-ink">What each choice is worth after {s.years} years</p>
          <SegmentBar segments={segs} total={Math.max(invested + car, 1)} format={usd} inside="value" ariaLabel="Investment balance and car value" />
          <SegmentLegend segments={segs} total={invested + car} format={usd} />
        </div>
        {invested > car ? (
          <Nudge tone="info" title="One choice ends with more">
            Both paid {usd(paid)} in total. The car is worth {usd(car)}. The investment is worth {usd(invested)}. A car is still a reasonable purchase when you need transportation. The point is to choose the cheaper car and keep it longer.
          </Nudge>
        ) : (
          <Nudge tone="warning" title="Growth is too low to beat the car here">
            At this growth rate the investment is worth less than the car. Investments in broad index funds have historically grown more than 0% over long periods, but it is not guaranteed.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ================================================================== */
/* 7.2 Cars                                                            */
/* ================================================================== */

const DEP_DATA = Array.from({ length: 9 }, (_, y) => ({ year: y, newCar: Math.round(carValue(40000, y, 'new')), usedCar: Math.round(carValue(24000, y, 'used')) }));

function DepreciationChart() {
  const li = DEP_DATA.length - 1;
  const y5 = DEP_DATA[5];
  const y1 = DEP_DATA[1];
  return (
    <Figure
      title="How much a new car and a used car are worth each year"
      subtitle="A $40,000 new car compared with a 3-year-old car bought for $24,000."
      legend={[{ label: 'New car, $40,000', color: 'var(--s1)' }, { label: '3-year-old car, $24,000', color: 'var(--s2)' }]}
      height={300}
      table={{ columns: ['Year of ownership', 'New car', 'Used car'], rows: DEP_DATA.map((d) => [d.year, usd(d.newCar), usd(d.usedCar)]) }}
      howToRead={[
        'The bottom axis counts years since you bought the car. The side axis shows what it would sell for.',
        'Each line starts at the purchase price.',
        'A steeper line means a faster loss of value.',
      ]}
      takeaway={<>The new car loses <strong>{usd(40000 - y1.newCar)}</strong> in the first year and <strong>{usd(40000 - y5.newCar)}</strong> in five years. The used car loses {usd(24000 - y5.usedCar)} over the same five years.</>}
      note="Illustrative. Commonly cited estimates put a new car's loss at about 20% in the first year and roughly 60% within five years. This chart uses 20% in year one and 15% a year after for the new car, and 10% a year for the used car. Real values vary by model and mileage."
    >
      <LineChart data={DEP_DATA} margin={{ top: 16, right: 96, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="year" type="number" domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} tickFormatter={(v) => (v === 0 ? 'Buy' : 'Yr ' + v)} {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
        <Tooltip cursor={cursorProps} content={<TooltipBox labelFormat={(l) => 'Year ' + l} valueFormat={(v) => usd(v)} />} />
        <Line dataKey="newCar" name="New car" stroke="var(--s1)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'New ' + usd(DEP_DATA[li].newCar, { compact: true }), -6)} />
        <Line dataKey="usedCar" name="Used car" stroke="var(--s2)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} label={endLabel(li, 'Used ' + usd(DEP_DATA[li].usedCar, { compact: true }), 16)} />
      </LineChart>
    </Figure>
  );
}

const OFFER = { price: 30000, doc: 500, addons: 2500, taxes: 2000 };
const OFFER_TOTAL = OFFER.price + OFFER.doc + OFFER.addons + OFFER.taxes;
const OFFER_PAYMENT = mortgagePayment(OFFER_TOTAL, 7, 7);
const OFFER_PAID = OFFER_PAYMENT * 84;

function DealerOfferFigure() {
  const row = (label: string, value: string, strong = false) => (
    <tr className={strong ? 'border-t border-line-strong font-semibold text-ink' : 'border-t border-line text-ink-2'}>
      <td className="px-5 py-2">{label}</td><td className="tnum px-5 py-2 text-right">{value}</td>
    </tr>
  );
  return (
    <Figure
      kind="example"
      title="A dealer offer sheet, read from the bottom up"
      subtitle="The monthly payment is printed in large type. The costs that set the payment are in smaller type."
      howToRead={[
        'The large number at the top is the monthly payment the dealer wants you to focus on.',
        'The list underneath builds the out-the-door price: everything you pay to drive the car away.',
        'The last lines show how much you pay in total over 84 months.',
      ]}
      takeaway={<>A <strong>{usd(OFFER_PAYMENT)}</strong> payment looks small. Over 84 months it totals <strong>{usd(OFFER_PAID)}</strong> for a car with a {usd(OFFER.price)} sticker price.</>}
      note="Example document. Assumes no down payment, a 7% loan and the amounts shown."
    >
      <div role="img" aria-label="Example dealer offer sheet with a monthly payment and an out-the-door price breakdown" className="mx-auto max-w-xl rounded-xl border border-line-strong bg-surface shadow-lift">
        <div className="border-b border-line px-5 py-4">
          <p className="text-[13px] font-semibold text-ink">Example Auto Group</p>
          <p className="text-xs text-muted">Offer sheet: Sedan, new</p>
        </div>
        <div className="border-b border-line bg-surface-2 px-5 py-5 text-center">
          <p className="text-xs font-medium tracking-[0.12em] text-muted uppercase">Your payment</p>
          <p className="tnum mt-1 text-4xl font-semibold tracking-[-0.02em] text-ink">{usd(OFFER_PAYMENT)}<span className="text-base font-normal text-ink-2"> a month</span></p>
          <p className="mt-1 text-sm text-ink-2">for 84 months at 7% APR</p>
        </div>
        <table className="tnum w-full text-left text-[13px]">
          <tbody>
            {row('Vehicle price', usd(OFFER.price))}
            {row('Documentation fee', usd(OFFER.doc))}
            {row('Add-ons: paint coating, etched windows, service plan', usd(OFFER.addons))}
            {row('Sales tax, title and registration', usd(OFFER.taxes))}
            {row('Out-the-door price (amount financed)', usd(OFFER_TOTAL), true)}
            {row('Interest over 84 months', usd(OFFER_PAID - OFFER_TOTAL))}
            {row('Total you pay', usd(OFFER_PAID), true)}
          </tbody>
        </table>
      </div>
    </Figure>
  );
}

const TERMS = [48, 60, 72, 84].map((m) => {
  const pmt = mortgagePayment(35000, 7, m / 12);
  return { months: m, pmt, interest: Math.round(pmt * m - 35000), label: m + ' months · ' + usd(pmt) + '/mo' };
});

function LoanTermChart() {
  const a = TERMS[0], d = TERMS[3];
  return (
    <Figure
      title="A longer loan lowers the payment and raises the cost"
      subtitle="The same $35,000 loan at 7%, repaid over four different lengths."
      height={260}
      table={{ columns: ['Loan length', 'Monthly payment', 'Total interest', 'Total paid'], rows: TERMS.map((t) => [t.months + ' months', usd(t.pmt), usd(t.interest), usd(t.pmt * t.months)]) }}
      howToRead={[
        'Each bar is one loan length. The label on the left gives the length and the monthly payment.',
        'Bar length is the total interest you pay over the whole loan.',
        'Compare the bars from top to bottom: the payment falls and the bar grows.',
      ]}
      takeaway={<>Going from 48 to 84 months lowers the payment by {usd(a.pmt - d.pmt)} a month but adds <strong>{usd(d.interest - a.interest)}</strong> in interest.</>}
      note="Assumes a $35,000 loan at 7% APR with equal monthly payments. Illustrative."
    >
      <BarChart data={TERMS} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 8 }}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={(v) => usd(v, { compact: true })} {...xAxisProps} />
        <YAxis type="category" dataKey="label" width={170} tick={{ fill: 'var(--ink-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v) + ' interest'} />} />
        <Bar dataKey="interest" name="Total interest" fill="var(--s1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR} isAnimationActive={false} label={barEndLabel((v) => usd(v))} />
      </BarChart>
    </Figure>
  );
}

const AUTO_DEFAULTS: AutoInputs = { price: 32000, condition: 'new', downPct: 10, apr: 6.9, loanYears: 5, keepYears: 6, milesPerYear: 12000, mpg: 30, gasPrice: 3.4, insuranceMonthly: 150 };
const AUTO_PRESETS: Preset<AutoInputs>[] = [
  { label: 'New SUV, 72-month loan', values: { price: 42000, condition: 'new', downPct: 10, apr: 7.5, loanYears: 6, mpg: 26, insuranceMonthly: 170 } },
  { label: '3-year-old sedan', values: { price: 22000, condition: 'used', downPct: 20, apr: 8.5, loanYears: 4, mpg: 32, insuranceMonthly: 130 } },
  { label: 'Paid-cash older car', values: { price: 9000, condition: 'used', downPct: 100, apr: 0, loanYears: 3, mpg: 28, insuranceMonthly: 95 } },
];

function AutoTco() {
  const sim = useSim(AUTO_DEFAULTS);
  const s = sim.state;
  const c = useMemo(() => autoCost(s), [s]);
  const segs: Segment[] = [
    { key: 'dep', label: 'Depreciation', value: c.depreciation, color: 'var(--s1)' },
    { key: 'int', label: 'Loan interest', value: c.interest, color: 'var(--s2)' },
    { key: 'fuel', label: 'Fuel', value: c.fuel, color: 'var(--s3)' },
    { key: 'ins', label: 'Insurance', value: c.insurance, color: 'var(--s4)', ink: 'var(--on-s4)' },
    { key: 'maint', label: 'Maintenance', value: c.maintenance, color: 'var(--s5)' },
    { key: 'tax', label: 'Sales tax & fees', value: c.taxesFees, color: 'var(--s6)' },
  ];
  return (
    <SimCard title="Car: True Cost of Ownership" kind="Mini sandbox" icon={Car} sim={sim} presets={AUTO_PRESETS}
      subtitle="See what a car costs each month in total, not just the payment."
      guide={{
        how: ['Pick a preset, or set the price.', 'Adjust the loan and the years you keep it.', 'Compare the true cost to the payment.'],
        tryThis: [
          { label: 'Stretch the loan to 7 years. Check the total interest.', done: (st) => st.loanYears >= 7 },
          { label: 'Keep the car 10+ years. Watch the true monthly cost.', done: (st) => st.keepYears >= 10 },
        ],
      }}>
      <SimGrid controls={
        <ControlGroup title="The car">
          <SegmentedControl label="New or used" size="sm" value={s.condition} onChange={sim.set('condition')} options={[{ value: 'new', label: 'New' }, { value: 'used', label: 'Used' }]} />
          <SliderField label="Price" value={s.price} onChange={sim.set('price')} min={5000} max={80000} step={500} format={(v) => usd(v)} />
          <SliderField label="Down payment" value={s.downPct} onChange={sim.set('downPct')} min={0} max={100} step={5} format={(v) => v + '%'} />
          <SliderField label="Loan APR" value={s.apr} onChange={sim.set('apr')} min={0} max={20} step={0.1} format={(v) => pct(v, 1)} disabled={s.downPct >= 100} />
          <SliderField label="Loan length" value={s.loanYears} onChange={sim.set('loanYears')} min={2} max={7} step={1} format={(v) => v * 12 + ' mo'} disabled={s.downPct >= 100} />
          <SliderField label="Years you'll keep it" value={s.keepYears} onChange={sim.set('keepYears')} min={2} max={12} step={1} format={(v) => v + ' yrs'} />
          <SliderField label="Insurance per month" value={s.insuranceMonthly} onChange={sim.set('insuranceMonthly')} min={40} max={400} step={5} format={(v) => usd(v)} />
          <SliderField label="Fuel economy" value={s.mpg} onChange={sim.set('mpg')} min={12} max={60} step={1} format={(v) => v + ' mpg'} />
        </ControlGroup>
      }>
        <StatGrid cols={4}>
          <StatTile label="Monthly payment" value={usd(c.monthlyPayment)} sub={s.downPct >= 100 ? 'paid in cash' : s.loanYears * 12 + '-month loan'} />
          <StatTile label="True cost per month" value={usd(c.perMonth)} sub={'over ' + s.keepYears + ' years'} emphasis />
          <StatTile label="Total cost of ownership" value={usd(c.total)} sub={usd(c.perMile, { cents: true }) + ' per mile'} />
          <StatTile label="Worth when you sell" value={usd(c.resale)} sub={'from ' + usd(s.price)} />
        </StatGrid>
        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Where {usd(c.total)} goes over {s.keepYears} years</p>
          <SegmentBar segments={segs} total={c.total} format={usd} ariaLabel="Car cost breakdown" />
          <SegmentLegend segments={segs} total={c.total} format={usd} />
        </div>
        <Nudge tone="info" title={'The payment is ' + usd(Math.max(0, c.perMonth - c.monthlyPayment)) + ' a month below the true cost'}>
          <Term id="depreciation">Depreciation</Term> is often a newer car's largest cost, and it never appears on a bill. Judge cars by <Term id="total-cost-of-ownership">total cost of ownership</Term>: {usd(c.perMonth)}/month here, not {usd(c.monthlyPayment)}.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}


/* ================================================================== */
/* 7.3 Renting vs. buying                                              */
/* ================================================================== */

const HOME = 400000;
const HOME_LOAN = HOME * 0.8;
const HOME_PI = mortgagePayment(HOME_LOAN, 6.5);
const HOME_TAX = (HOME * 0.011) / 12;
const HOME_INS = (HOME * RENT_BUY_ASSUMPTIONS.insurancePct) / 100 / 12;
const HOME_MAINT = (HOME * 0.01) / 12;
const OWN_TOTAL = HOME_PI + HOME_TAX + HOME_INS + HOME_MAINT;
const RENT_TOTAL = 2020;
const FIRST_PRINCIPAL = HOME_PI - (HOME_LOAN * 0.065) / 12;
const MONTHLY_COMPARE = [
  { name: 'Rent: ' + usd(RENT_TOTAL) + '/mo', rent: 2000, rins: 20 },
  { name: 'Own: ' + usd(OWN_TOTAL) + '/mo', pi: Math.round(HOME_PI), tax: Math.round(HOME_TAX), ins: Math.round(HOME_INS), maint: Math.round(HOME_MAINT) },
];

function RentVsOwnMonthlyChart() {
  const parts: { key: string; name: string; color: string }[] = [
    { key: 'rent', name: 'Rent', color: 'var(--s1)' },
    { key: 'rins', name: 'Renters insurance', color: 'var(--s2)' },
    { key: 'pi', name: 'Mortgage principal and interest', color: 'var(--s3)' },
    { key: 'tax', name: 'Property tax', color: 'var(--s4)' },
    { key: 'ins', name: 'Homeowners insurance', color: 'var(--s5)' },
    { key: 'maint', name: 'Maintenance and repairs', color: 'var(--s6)' },
  ];
  return (
    <Figure
      title="One month of housing cost: renting and owning"
      subtitle="A $2,000 rental compared with owning a similar $400,000 home with 20% down."
      legend={parts.map((p) => ({ label: p.name, color: p.color }))}
      height={320}
      table={{
        columns: ['Cost per month', 'Renting', 'Owning'],
        rows: [
          ['Rent', usd(2000), '-'], ['Renters insurance', usd(20), '-'], ['Mortgage principal and interest', '-', usd(HOME_PI)],
          ['Property tax (1.1% a year)', '-', usd(HOME_TAX)], ['Homeowners insurance', '-', usd(HOME_INS)], ['Maintenance (1% a year)', '-', usd(HOME_MAINT)],
          ['Total', usd(RENT_TOTAL), usd(OWN_TOTAL)],
        ],
      }}
      howToRead={[
        'Each column is one month of housing cost. The label under it gives the total.',
        'Each color is one cost. The renting column has two costs; the owning column has four.',
        'The mortgage payment alone is only the bottom part of the owning column.',
      ]}
      takeaway={<>The mortgage payment is <strong>{usd(HOME_PI)}</strong>, close to the rent. Property tax, insurance and maintenance bring the monthly cost of owning to about <strong>{usd(OWN_TOTAL)}</strong>.</>}
      note={'Illustrative. $400,000 home, $320,000 loan at 6.5% for 30 years, property tax 1.1% of value a year, homeowners insurance 0.35% a year, maintenance 1% a year. About ' + usd(FIRST_PRINCIPAL) + ' of the first mortgage payment repays principal. Your rent, taxes and insurance will differ.'}
    >
      <BarChart data={MONTHLY_COMPARE} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" {...xAxisProps} />
        <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
        <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox valueFormat={(v) => usd(v)} />} />
        {parts.map((p, i) => (
          <Bar key={p.key} dataKey={p.key} name={p.name} stackId="m" fill={p.color} maxBarSize={120} radius={i === 1 || i === 5 ? COLUMN_RADIUS : undefined} isAnimationActive={false} />
        ))}
      </BarChart>
    </Figure>
  );
}

function BuyChecklistFigure() {
  const income = OWN_TOTAL / 0.28 * 12;
  const cards = [
    {
      icon: Clock, title: 'Plan to stay 5 years or more',
      big: usd(HOME * 0.08, { compact: true }) + ' to ' + usd(HOME * 0.1, { compact: true }),
      body: 'Buying and selling costs often total 8% to 10% of the price. On a ' + usd(HOME) + ' home that is the amount you must recover through the years you stay.',
    },
    {
      icon: ShieldCheck, title: 'Keep your emergency fund separate',
      big: usd(HOME * 0.02, { compact: true }) + ' to ' + usd(HOME * 0.05, { compact: true }),
      body: 'Closing costs often run 2% to 5% of the price, and they come on top of the down payment. Your emergency fund must still be there after both are paid.',
    },
    {
      icon: Calculator, title: 'Afford the whole monthly cost',
      big: '28%',
      body: 'A common lender guideline keeps housing costs near 28% of gross income. For ' + usd(OWN_TOTAL) + ' a month, that means about ' + usd(income, { compact: true }) + ' a year in gross income.',
    },
  ];
  return (
    <Figure
      kind="diagram"
      title="Three checks before you buy"
      subtitle="Each check is shown with the number to compare, using the $400,000 example home."
      howToRead={[
        'Each card is one condition. All three should be true before you buy.',
        'The large figure on each card is the amount or percentage to check.',
        'The text underneath explains where the figure comes from.',
      ]}
      takeaway={<>If you may move within 5 years, the {usd(HOME * 0.08, { compact: true })} to {usd(HOME * 0.1, { compact: true })} in transaction costs usually outweighs what you gain. Renting is the lower-cost choice.</>}
      note="Cost percentages are commonly cited ranges. Closing costs, selling costs and lender limits vary by location and lender."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-line bg-surface p-4">
            <span className="grid size-9 place-items-center rounded-full border border-line bg-surface text-ink"><c.icon className="size-4" strokeWidth={1.75} aria-hidden /></span>
            <p className="mt-3 text-sm font-semibold text-ink">{c.title}</p>
            <p className="tnum mt-1 text-2xl font-semibold tracking-[-0.02em] text-ink">{c.big}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{c.body}</p>
          </div>
        ))}
      </div>
    </Figure>
  );
}

const DEFAULTS = {
  price: 400000, downPct: 20, rate: 6.5, rent: 2000, stayYears: 5,
  appreciation: RENT_BUY_ASSUMPTIONS.appreciation, rentGrowth: RENT_BUY_ASSUMPTIONS.rentGrowth, investReturn: RENT_BUY_ASSUMPTIONS.investReturn,
  propertyTaxPct: RENT_BUY_ASSUMPTIONS.propertyTaxPct, maintenancePct: RENT_BUY_ASSUMPTIONS.maintenancePct,
};
type State = typeof DEFAULTS;
const PRESETS: Preset<State>[] = [
  { label: 'Stay 3 Years (Rent Wins)', values: { stayYears: 3 } },
  { label: 'Stay 10 Years (Buy Wins)', values: { stayYears: 10 } },
  { label: '5% Down + PMI', hint: 'Smaller down payment, bigger loan, PMI added', values: { downPct: 5, stayYears: 7 } },
];

function RentVsBuy() {
  const sim = useSim(DEFAULTS);
  const s = sim.state;
  const r = useMemo(() => simulateRentBuy({ ...s, insurancePct: RENT_BUY_ASSUMPTIONS.insurancePct, closingPct: RENT_BUY_ASSUMPTIONS.closingPct, sellingPct: RENT_BUY_ASSUMPTIONS.sellingPct }), [s]);
  const at = r.years[s.stayYears - 1];
  const b = r.breakdown;
  const data = r.years.map((y) => ({ year: y.year, diff: y.diff, buy: y.buyNW, rent: y.rentNW }));
  const ratio = s.price / (s.rent * 12);
  const ownSegs: Segment[] = [
    { key: 'int', label: 'Mortgage interest', value: b.interest, color: 'var(--s1)' },
    { key: 'tax', label: 'Property tax', value: b.propertyTax, color: 'var(--s2)' },
    { key: 'maint', label: 'Maintenance', value: b.maintenance, color: 'var(--s3)' },
    { key: 'ins', label: s.downPct < 20 ? 'Insurance + PMI' : 'Insurance', value: b.insurance, color: 'var(--s4)', ink: 'var(--on-s4)' },
    { key: 'tx', label: 'Buying + selling costs', value: b.transaction, color: 'var(--s5)' },
    { key: 'opp', label: 'Lost growth on down payment', value: b.opportunity, color: 'var(--s6)' },
  ];
  const ownTotal = ownSegs.reduce((a, x) => a + x.value, 0);
  const rentSegs: Segment[] = [{ key: 'rent', label: 'Rent + renters insurance', value: b.rent, color: 'var(--s7)' }];
  const scale = Math.max(ownTotal, b.rent);
  const buyWins = at.diff >= 0;

  return (
    <SimCard title="Rent vs. Buy Breakeven Explorer" sim={sim} presets={PRESETS}
      subtitle="See whether renting or buying leaves you richer, based on how long you stay."
      guide={{
        how: ['Set the home price and a similar rent.', 'Choose how many years you plan to stay.', 'See who comes out ahead, and when.'],
        tryThis: [
          { label: 'Set your stay to 10 years or more. Who wins now?', done: (st) => st.stayYears >= 10 },
          { label: 'Raise rent to $3,000. Watch the breakeven year move.', done: (st) => st.rent >= 3000 },
          { label: 'Raise the mortgage rate to 8%. Does buying still pull ahead?', done: (st) => st.rate >= 8 },
        ],
      }}>
      <SimGrid controls={
        <>
          <ControlGroup title="The home">
            <SliderField label="Home price" value={s.price} onChange={sim.set('price')} min={150000} max={1200000} step={5000} format={(v) => usd(v)} />
            <SliderField label={<Term id="down-payment">Down payment</Term>} value={s.downPct} onChange={sim.set('downPct')} min={3} max={50} step={1} format={(v) => v + '%'} help={usd((s.price * s.downPct) / 100) + (s.downPct < 20 ? ', PMI applies below 20%' : '')} />
            <SliderField label={<><Term id="mortgage">Mortgage</Term> rate</>} value={s.rate} onChange={sim.set('rate')} min={2} max={10} step={0.125} format={(v) => pct(v, 3).replace(/0+%$/, '%').replace(/\.%$/, '%')} />
          </ControlGroup>
          <ControlGroup title="Renting instead">
            <SliderField label="Rent for a similar place" value={s.rent} onChange={sim.set('rent')} min={600} max={8000} step={50} format={(v) => usd(v) + '/mo'} />
            <SliderField label="Years you plan to stay" value={s.stayYears} onChange={sim.set('stayYears')} min={1} max={15} step={1} format={(v) => v + (v === 1 ? ' yr' : ' yrs')} />
          </ControlGroup>
          <Disclosure title="Advanced assumptions">
            <div className="space-y-3">
              <SliderField label="Home appreciation" value={s.appreciation} onChange={sim.set('appreciation')} min={0} max={8} step={0.25} format={(v) => pct(v, 2) + '/yr'} />
              <SliderField label="Rent increases" value={s.rentGrowth} onChange={sim.set('rentGrowth')} min={0} max={8} step={0.25} format={(v) => pct(v, 2) + '/yr'} />
              <SliderField label="Renter's investment return" value={s.investReturn} onChange={sim.set('investReturn')} min={0} max={10} step={0.25} format={(v) => pct(v, 2) + '/yr'} />
              <SliderField label={<Term id="property-tax">Property tax</Term>} value={s.propertyTaxPct} onChange={sim.set('propertyTaxPct')} min={0.2} max={3} step={0.05} format={(v) => pct(v, 2) + '/yr'} />
              <SliderField label="Maintenance" value={s.maintenancePct} onChange={sim.set('maintenancePct')} min={0.5} max={3} step={0.1} format={(v) => pct(v, 1) + '/yr'} />
              <p className="text-xs text-muted">Fixed: closing costs {RENT_BUY_ASSUMPTIONS.closingPct}%, selling costs {RENT_BUY_ASSUMPTIONS.sellingPct}%, home insurance {RENT_BUY_ASSUMPTIONS.insurancePct}%/yr, PMI {RENT_BUY_ASSUMPTIONS.pmiPct}%/yr below 20% down, 30-year fixed loan.</p>
            </div>
          </Disclosure>
        </>
      }>
        <StatGrid cols={4}>
          <StatTile label="Owning, month one" value={usd(r.firstMonthOwnerCost) + '/mo'} sub={'incl. ' + usd(r.monthlyPI) + ' principal & interest'} />
          <StatTile label="Renting, month one" value={usd(s.rent + RENT_BUY_ASSUMPTIONS.rentersInsurance) + '/mo'} sub={'price-to-rent ratio ' + num(ratio, 1)} />
          <StatTile label={'After ' + s.stayYears + ' yrs, ' + (buyWins ? 'buying' : 'renting') + ' is ahead by'} value={usd(Math.abs(at.diff))} sub={'buyer ' + usd(at.buyNW, { compact: true }) + ' vs. renter ' + usd(at.rentNW, { compact: true })} emphasis />
          <StatTile label="Breakeven" value={r.breakevenYear ? 'Year ' + r.breakevenYear : 'Not within 15 yrs'} sub="when buying pulls ahead for good" />
        </StatGrid>

        <ChartFrame title="Net worth difference: buying minus renting" subtitle="Above zero = buying ahead · below zero = renting ahead (if the buyer sells that year)" height={290}
          legend={[{ label: 'Buying ahead', color: 'var(--s1)', kind: 'box' }, { label: 'Renting ahead', color: 'var(--s8)', kind: 'box' }]}
          table={{ columns: ['Year', 'Buyer net worth', 'Renter net worth', 'Difference'], rows: r.years.map((y) => [y.year, usd(y.buyNW), usd(y.rentNW), usd(y.diff, { sign: true })]) }}>
          <BarChart data={data} margin={{ top: 22, right: 16, bottom: 4, left: 4 }} barCategoryGap="18%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="year" tickFormatter={(v) => 'Yr ' + v} {...xAxisProps} interval={0} fontSize={11} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]} {...yAxisProps} />
            <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox labelFormat={(l) => 'Sell after year ' + l} valueFormat={(v) => usd(v, { sign: true })}
              extra={(l) => { const y = r.years[Number(l) - 1]; return y ? <>Buyer {usd(y.buyNW)} · Renter {usd(y.rentNW)}</> : null; }} />} />
            <ReferenceLine y={0} stroke="var(--axis)" strokeWidth={1.5} />
            <ReferenceLine x={s.stayYears} stroke="var(--ink-2)" strokeDasharray="4 3" label={{ value: 'Your plan', position: 'top', fill: 'var(--ink-2)', fontSize: 11 }} />
            <Bar dataKey="diff" name="Buy − rent" isAnimationActive={false}>
              {data.map((d) => <Cell key={d.year} fill={d.diff >= 0 ? 'var(--s1)' : 'var(--s8)'} fillOpacity={d.year === s.stayYears ? 1 : 0.75} radius={(d.diff >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]) as unknown as number} />)}
            </Bar>
          </BarChart>
        </ChartFrame>

        <div className="space-y-4 rounded-xl border border-line p-4">
          <div>
            <p className="text-sm font-semibold text-ink">Money you do not get back over {s.stayYears} {s.stayYears === 1 ? 'year' : 'years'}: both sides have it</p>
            <p className="text-xs text-muted">Money you never get back. The owner also gains principal paid ({usd(b.principal)}) and home appreciation ({usd(b.appreciation)}), already counted in net worth above.</p>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-2">Owning: {usd(ownTotal)}</p>
            <SegmentBar segments={ownSegs} total={scale} height={32} format={(v) => usd(v, { compact: true })} inside="value" ariaLabel="Unrecoverable costs of owning" />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-2">Renting: {usd(b.rent)}</p>
            <SegmentBar segments={rentSegs} total={scale} height={32} format={(v) => usd(v, { compact: true })} inside="value" ariaLabel="Unrecoverable costs of renting" />
          </div>
          <SegmentLegend segments={[...ownSegs, ...rentSegs]} total={0} format={usd} />
        </div>

        {buyWins ? (
          <Nudge tone="good" title={'Buying comes out ahead at ' + s.stayYears + ' years'}>
            Staying longer divides the {usd(b.transaction)} of buying and selling costs over more years, while equity and appreciation keep building. Breakeven here is {r.breakevenYear ? 'year ' + r.breakevenYear : 'late'}, so plan to stay at least that long.
          </Nudge>
        ) : (
          <Nudge tone="warning" title={'Renting comes out ahead at ' + s.stayYears + ' years'}>
            Buying and selling alone would cost about <strong>{usd(b.transaction)}</strong>, more than {num(b.transaction / (s.rent * 12), 1)} years of rent. {r.breakevenYear ? 'Buying only pulls ahead if you stay ' + r.breakevenYear + '+ years.' : 'With these numbers, buying never catches up within 15 years.'} Renting is not wasted money. It pays for housing and keeps you free to move.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}


/* ================================================================== */
/* Decision check and cheat sheet                                      */
/* ================================================================== */

const T60 = mortgagePayment(35000, 7, 5);
const T84 = mortgagePayment(35000, 7, 7);
const KEEP_INVEST = futureValue(450, 7, 60);

const questions: QuizQuestion[] = [
  {
    id: 'assets-dealer',
    scenario: <>You are at a dealership. The salesperson asks, "What monthly payment are you comfortable with?" You say $550. They return with a car at $550 a month for 84 months.</>,
    prompt: 'What is the best next step?',
    options: [
      { text: 'Accept. The payment fits your budget.', why: <>A payment can be hit by lengthening the loan. At 7%, $550 for 84 months repays about {usd(loanFor(550, 7, 84))} of loan, then costs {usd(550 * 84)} in total. You still do not know the price.</> },
      { text: 'Ask for the out-the-door price in writing and compare it with other offers.', correct: true, why: <>The out-the-door price includes the price, fees, add-ons and taxes. With that number you can compare dealers and loan lengths. On $35,000 at 7%, 60 months costs {usd(T60 * 60 - 35000)} in interest and 84 months costs {usd(T84 * 84 - 35000)}.</> },
      { text: 'Ask for a longer loan so the payment drops further.', why: <>A longer loan lowers the payment and raises the interest. 84 months on $35,000 adds {usd(T84 * 84 - T60 * 60)} more interest than 60 months.</> },
      { text: 'Add a paint coating and service plan, since they only add a few dollars a month.', why: <>Add-ons are financed along with the car. A $2,500 add-on at 7% over 84 months costs about {usd(mortgagePayment(2500, 7, 7) * 84)} in total.</> },
    ],
  },
  {
    id: 'assets-payoff',
    scenario: <>Your car loan ends this month. The car runs well and has 5 more years of life. A dealer offers a new car for $450 a month.</>,
    prompt: 'Which choice leaves you better off?',
    options: [
      { text: 'Trade in for the new car. It is under warranty.', why: <>You would restart a payment of $450 a month and the new car would lose about 20% of its value in year one.</> },
      { text: 'Keep the car and invest the $450 a month you no longer pay.', correct: true, why: <>$450 a month invested at 7% for 5 years grows to about {usd(KEEP_INVEST)}, from {usd(450 * 60)} contributed. Keep an amount for repairs in a savings account.</> },
      { text: 'Keep the car and spend the extra $450 a month on other things.', why: <>The car costs less, but the $450 a month adds nothing to your net worth. Over 5 years that is {usd(450 * 60)} that could have been saved.</> },
      { text: 'Trade in only if the dealer offers more than the car is worth.', why: <>A trade-in offer does not change the cost of the new car. The new payment of $450 a month still continues for years.</> },
    ],
  },
  {
    id: 'assets-rent-buy',
    scenario: <>You have $85,000 saved. That is a 20% down payment on a $400,000 home, and it is also your entire emergency fund. Your job may move you to another city in about 3 years.</>,
    prompt: 'What does the guidance in this chapter suggest?',
    options: [
      { text: 'Buy now. Rent is money you never get back.', why: <>Buying and selling costs often total 8% to 10% of the price, which is $32,000 to $40,000 here. Over 3 years that cost is hard to recover.</> },
      { text: 'Keep renting, and keep the savings as an emergency fund and for a later down payment.', correct: true, why: <>You plan to stay under 5 years and the down payment would use your whole emergency fund. Renting costs about {usd(RENT_TOTAL)} a month and keeps the $85,000 available.</> },
      { text: 'Buy with a 5% down payment and use the rest as the emergency fund.', why: <>A 5% down payment ($20,000) leaves a $380,000 loan and adds mortgage insurance. It does not change the 8% to 10% cost of selling after 3 years.</> },
      { text: 'Buy, and plan to rent the home out when you move.', why: <>Owning a rental adds repair costs, vacancy and tax work. The home would cost about {usd(OWN_TOTAL)} a month before any rent comes in.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: Wallet, title: 'Ask where the money goes', body: 'Before buying, ask whether it puts money in each month or takes money out, and whether its value rises or falls. Favor purchases that keep their value.' },
  { icon: Handshake, title: 'Negotiate the out-the-door price', body: 'Ignore monthly-payment talk. Get pre-approved at a credit union, negotiate the total price in writing and choose the shortest loan you can afford.' },
  { icon: House, title: 'Buy a home only if all three are true', body: 'You plan to stay 5+ years, your emergency fund is separate from the down payment and closing costs, and the full monthly cost is comfortable.' },
];

/* ================================================================== */
/* Chapter                                                             */
/* ================================================================== */

export default function AssetsChapter() {
  return (
    <ChapterLayout
      id="assets"
      questions={questions}
      rules={rules}
      sections={{
        '7-1': (
          <>
            <P>Every purchase moves money in one of two directions. Knowing which one before you buy keeps you from taking on payments that reduce your <Term id="net-worth">net worth</Term> without noticing.</P>
            <Bullets items={[
              <><strong className="text-ink">An <Term id="asset">asset</Term></strong> puts money in your pocket or grows in value. Examples: index funds, a skill or certification, real estate.</>,
              <><strong className="text-ink">A <Term id="liability">liability</Term></strong> takes money out of your pocket every month. Examples: car loans, credit card balances, financed toys.</>,
            ]} />
            <AssetLiabilityDiagram />
            <H3>Two questions to ask before you buy</H3>
            <Steps items={[
              { title: 'Does it add money each month, or take money each month?', body: 'List the payment, insurance, fuel, upkeep and interest. If every line is an outflow, it is a liability.' },
              { title: 'Will it be worth more or less in five years?', body: 'Index funds and skills have tended to gain value. Most cars, boats and furniture lose value.' },
              { title: 'If it is both, add the numbers.', body: 'A home can be an asset when it gains value, but it also has monthly costs. Section 7.3 shows how to compare.' },
            ]} />
            <CarVsInvestChart />
            <Example title="What a $500 payment does over 6 years">
              <Bullets items={[
                <>Car payments: $500 × 72 months = <strong>$36,000</strong> paid. The car is worth about {usd(CAR_VS_INVEST[6].car)}.</>,
                <>Investing $500 a month at 7% for 6 years: about <strong>{usd(CAR_VS_INVEST[6].invested)}</strong>.</>,
                <>The next 4 years: the car loses more value, and the investment keeps growing with no further deposits, reaching about {usd(CAR_VS_INVEST[10].invested)}.</>,
              ]} />
            </Example>
            <PaymentDirection />
            <Mistakes items={[
              <>Calling something an asset because it has a high price. Value matters, not cost.</>,
              <>Counting only the loan payment and forgetting insurance, fuel and upkeep.</>,
              <>Taking on a new payment as soon as an old one ends instead of investing the same amount.</>,
            ]} />
          </>
        ),
        '7-2': (
          <>
            <P>A car is a tool for getting to work, and most people need one. The goal is to spend as little as possible on it so more of your income goes to assets.</P>
            <H3>New cars lose value fast</H3>
            <P>The <Term id="depreciation">depreciation</Term> on a new car starts the moment you drive it off the lot. Commonly cited estimates say a new car loses about 20% of its value in the first year and roughly 60% within five years. You pay full price and own a car worth much less.</P>
            <DepreciationChart />
            <H3>Dealers sell the monthly payment</H3>
            <P>Dealers often ask what monthly payment you want. They can reach nearly any payment by stretching the <Term id="loan-term">loan term</Term> to 72 or 84 months, which raises the interest you pay. Always negotiate the total <Term id="out-the-door-price">out-the-door price</Term>: the price, fees, add-ons and taxes together.</P>
            <DealerOfferFigure />
            <LoanTermChart />
            <MythBuster myth="A lower monthly payment means a cheaper car.">
              The payment is the price spread over time, plus interest. On a $35,000 loan at 7%, 84 months costs {usd(TERMS[3].pmt)} a month and 48 months costs {usd(TERMS[0].pmt)}. The longer loan has the lower payment and the higher total cost.
            </MythBuster>
            <H3>Buy reliable, pay it off fast, drive it longer</H3>
            <Steps items={[
              { title: 'Get pre-approved at a credit union.', body: 'Their loan rates are often lower than dealer financing. A pre-approval also sets a limit on what you can spend.' },
              { title: 'Negotiate the out-the-door price by email.', body: 'Ask several dealers for a written out-the-door price on the same car. Compare the totals.' },
              { title: 'Ignore monthly-payment talk.', body: 'If the salesperson asks about payments, answer that you are comparing out-the-door prices only.' },
              { title: 'Pay it off fast.', body: 'Choose the shortest loan you can afford, ideally 48 months or less, and add to the payment when you can.' },
              { title: 'Keep the car for years after the last payment.', body: 'The years without a payment are where the savings are. Invest the old payment each month.' },
            ]} />
            <Example title="The payment you stop making">
              <p>A $450 monthly payment ends after 5 years. If you keep the car and invest $450 a month at 7% for the next 5 years, you have about <strong>{usd(KEEP_INVEST)}</strong>, from {usd(450 * 60)} contributed.</p>
            </Example>
            <AutoTco />
            <GoDeeper title="What to check on a used car">
              <Bullets items={[
                <><strong>Vehicle history report.</strong> It shows accidents, title problems and reported mileage.</>,
                <><strong>Independent inspection.</strong> A mechanic you choose can check it for roughly $100 to $200.</>,
                <><strong>Reliability record.</strong> Look up the model's owner-reported repair history before you visit.</>,
                <><strong>Insurance quote.</strong> Get one before buying, since it varies by model.</>,
              ]} />
            </GoDeeper>
            <Mistakes items={[
              <>Telling the dealer your target monthly payment before the price is agreed.</>,
              <>Rolling the balance from an old loan into a new one.</>,
              <>Accepting add-ons such as paint coating or a service plan that were not requested.</>,
              <>Replacing the car when the loan ends instead of keeping it.</>,
            ]} />
          </>
        ),
        '7-3': (
          <>
            <MythBuster myth='"Renting is throwing money away."'>
              Rent pays for a place to live and for flexibility: you can move when your job or life changes. Owners also pay money they never get back: mortgage interest, property tax, insurance and repairs.
            </MythBuster>
            <P>The two options differ in how the cost behaves:</P>
            <Bullets items={[
              <><strong className="text-ink">Rent is the most you will pay.</strong> The amount on your lease is the whole monthly housing cost, and the landlord pays for repairs.</>,
              <><strong className="text-ink">A <Term id="mortgage">mortgage</Term> is the least you will pay.</strong> The payment is only the base amount. <Term id="property-tax">Property tax</Term>, insurance and repairs are added to it.</>,
            ]} />
            <RentVsOwnMonthlyChart />
            <H3>When buying makes sense</H3>
            <P>Buy a home when all three of these are true:</P>
            <Bullets items={[
              <>You plan to <strong className="text-ink">stay 5 years or more</strong>. That gives the home time to cover the <Term id="transaction-costs">buying and selling costs</Term>.</>,
              <>You have a <strong className="text-ink">solid <Term id="emergency-fund">emergency fund</Term> separate from your <Term id="down-payment">down payment</Term></strong> and <Term id="closing-costs">closing costs</Term>.</>,
              <>You can <strong className="text-ink">comfortably afford the total monthly payment</strong>: mortgage, property tax, insurance and maintenance.</>,
            ]} />
            <BuyChecklistFigure />
            <RentVsBuy />
            <GoDeeper title="Why the breakeven year matters">
              <p>Each buyer starts behind by the closing and selling costs. Principal repaid and price gains slowly make up that gap. The breakeven year in the explorer is the point where buying stays ahead. If you may move sooner than that year, renting is the lower-cost choice.</p>
            </GoDeeper>
            <Mistakes items={[
              <>Budgeting only for the mortgage payment and forgetting tax, insurance and repairs.</>,
              <>Using your entire emergency fund for the down payment.</>,
              <>Buying a home you may leave within 3 to 4 years.</>,
              <>Comparing the mortgage payment with rent instead of the full monthly cost with rent.</>,
            ]} />
          </>
        ),
      }}
    />
  );
}
