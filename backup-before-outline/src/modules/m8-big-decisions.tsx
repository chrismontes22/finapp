import { useMemo } from 'react';
import { House, Car, Umbrella, ShieldCheck, Hotel, Wrench, Landmark, Receipt, Percent, Hourglass } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, LabelList } from 'recharts';
import { ModuleLayout } from '../components/ModuleLayout';
import { Term } from '../components/Glossary';
import { Analogy, Bullets, ConceptCards, Example, Formula, GoDeeper, Lead, Mistakes, MythBuster, P, H3, UnderTheHood } from '../components/Teach';
import { ControlGroup, Nudge, SimCard, SimGrid, StatGrid, StatTile, useSim, type Preset } from '../components/Sim';
import { SliderField } from '../components/Slider';
import { SegmentBar, SegmentLegend, type Segment } from '../components/SegmentBar';
import { ChartFrame, TooltipBox, gridProps, xAxisProps, yAxisProps } from '../components/Chart';
import { Disclosure, SegmentedControl } from '../components/ui';
import type { QuizQuestion } from '../components/DecisionCheck';
import type { Rule } from '../components/CheatSheet';
import { usd, pct, num } from '../lib/format';
import { RENT_BUY_ASSUMPTIONS, autoCost, deductibleCosts, simulateRentBuy, type AutoInputs } from '../lib/housing';

/* ------------------------------------------------------------------ */
/* Auto total cost of ownership                                         */
/* ------------------------------------------------------------------ */

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
      subtitle="See what a car really costs each month, not just the payment."
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
        <Nudge tone="info" title={'The payment hides ' + usd(Math.max(0, c.perMonth - c.monthlyPayment)) + '/month'}>
          <Term id="depreciation">Depreciation</Term> is often a newer car's biggest cost, and it never shows up on a bill. Judge cars by <Term id="total-cost-of-ownership">total cost of ownership</Term>: {usd(c.perMonth)}/month here, not {usd(c.monthlyPayment)}.
        </Nudge>
      </SimGrid>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */
/* Insurance deductible chooser                                         */
/* ------------------------------------------------------------------ */

const DED_DEFAULTS = { claims: 0.2, years: 5, efund: 3000 };
type DedState = typeof DED_DEFAULTS;
const DED_PRESETS: Preset<DedState>[] = [
  { label: 'Rarely file claims', values: { claims: 0.1 } },
  { label: 'Accident-prone teen driver', values: { claims: 0.6 } },
  { label: 'Thin emergency fund ($800)', values: { efund: 800 } },
];

function DeductibleChooser() {
  const sim = useSim(DED_DEFAULTS);
  const s = sim.state;
  const rows = useMemo(() => deductibleCosts(s.claims, s.years), [s.claims, s.years]);
  const affordable = rows.filter((r) => r.deductible <= s.efund);
  const best = (affordable.length ? affordable : rows).reduce((a, b) => (b.total < a.total ? b : a));
  const cheapestOverall = rows.reduce((a, b) => (b.total < a.total ? b : a));
  const data = rows.map((r) => ({ name: usd(r.deductible), total: r.total, premiums: r.premiums, oop: r.outOfPocket, ok: r.deductible <= s.efund, best: r === best }));
  return (
    <SimCard title="Insurance Deductible Chooser" kind="Mini sandbox" icon={Umbrella} sim={sim} presets={DED_PRESETS}
      subtitle="Find the car-insurance deductible that costs you least and that you can actually cover."
      guide={{
        how: ['Set how often you file claims.', 'Enter what your emergency fund holds.', 'Read the best fit under the chart.'],
        tryThis: [
          { label: 'Drop your emergency fund below $1,000. What changes?', done: (st) => st.efund < 1000 },
          { label: 'Raise claims to 0.6 a year. Which deductible wins now?', done: (st) => st.claims >= 0.59 },
        ],
      }}>
      <SimGrid controls={
        <ControlGroup title="Your situation">
          <SliderField label="Claims per year (on average)" value={s.claims} onChange={sim.set('claims')} min={0} max={1} step={0.05} format={(v) => num(v, 2)} help={s.claims > 0 ? 'About one claim every ' + num(1 / s.claims, 1) + ' years' : 'No claims expected'} />
          <SliderField label="Years to compare" value={s.years} onChange={sim.set('years')} min={1} max={10} step={1} format={(v) => v + ' yrs'} />
          <SliderField label="Emergency fund" value={s.efund} onChange={sim.set('efund')} min={0} max={10000} step={100} format={(v) => usd(v)} help="The most you could pay out of pocket tomorrow without a card." />
        </ControlGroup>
      }>
        <ChartFrame title={'Expected total cost over ' + s.years + ' years'} subtitle="Premiums + deductibles you'd pay on expected claims" height={240}
          table={{ columns: ['Deductible', 'Yearly premium', 'Premiums', 'Expected out-of-pocket', 'Total', 'Covered by emergency fund?'], rows: rows.map((r) => [usd(r.deductible), usd(r.premium), usd(r.premiums), usd(r.outOfPocket), usd(r.total), r.deductible <= s.efund ? 'Yes' : 'No']) }}>
          <BarChart data={data} margin={{ top: 24, right: 16, bottom: 4, left: 0 }} barCategoryGap="28%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...xAxisProps} tickFormatter={(v) => v + ' ded.'} />
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
            <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<TooltipBox labelFormat={(l) => String(l) + ' deductible'} valueFormat={(v) => usd(v)} />} />
            <Bar dataKey="total" name="Expected total" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((d) => <Cell key={d.name} fill={d.best ? 'var(--s1)' : 'var(--s-neutral-2)'} fillOpacity={d.ok ? 1 : 0.4} />)}
              <LabelList dataKey="total" position="top" formatter={(v: unknown) => usd(Number(v), { compact: true })} style={{ fill: 'var(--ink-2)', fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ChartFrame>
        <p className="text-xs text-muted">Blue = best choice you can afford. Faded = deductible bigger than your emergency fund.</p>
        {best !== cheapestOverall ? (
          <Nudge tone="warning" title={'The ' + usd(cheapestOverall.deductible) + ' deductible is cheapest, but you can\'t cover it yet'}>
            With {usd(s.efund)} saved, a claim could land on a credit card. Stick with {usd(best.deductible)} for now and raise it as your emergency fund grows.
          </Nudge>
        ) : (
          <Nudge tone="good" title={'Best fit: ' + usd(best.deductible) + ' deductible'}>
            Expected cost: {usd(best.total)} over {s.years} years, and your emergency fund can cover the deductible. Paying small losses yourself beats paying an insurer to handle them.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */
/* Rent vs buy breakeven explorer                                        */
/* ------------------------------------------------------------------ */

const DEFAULTS = {
  price: 400000, downPct: 20, rate: 6.5, rent: 2400, stayYears: 5,
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
            <YAxis tickFormatter={(v) => usd(v, { compact: true })} {...yAxisProps} />
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
            <p className="text-sm font-semibold text-ink">"Thrown away" money over {s.stayYears} {s.stayYears === 1 ? 'year' : 'years'}: both sides have it</p>
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
            Staying longer spreads the {usd(b.transaction)} of buying and selling costs over more years, while equity and appreciation keep building. Breakeven here is {r.breakevenYear ? 'year ' + r.breakevenYear : 'late'}, so plan to stay at least that long.
          </Nudge>
        ) : (
          <Nudge tone="warning" title={'Renting comes out ahead at ' + s.stayYears + ' years'}>
            Buying and selling alone would cost about <strong>{usd(b.transaction)}</strong>, more than {num(b.transaction / (s.rent * 12), 1)} years of rent. {r.breakevenYear ? 'Buying only pulls ahead if you stay ' + r.breakevenYear + '+ years.' : 'With these numbers, buying never catches up within 15 years.'} Renting isn't throwing money away. It's buying flexibility.
          </Nudge>
        )}
      </SimGrid>
    </SimCard>
  );
}

/* ------------------------------------------------------------------ */

export const questions: QuizQuestion[] = [
  {
    id: 'buy-2-years',
    scenario: <>You'll likely move for work in <strong>2 years</strong>. You could buy a <strong>$400,000</strong> home (20% down, 6.5% rate). Or you could rent a similar place for <strong>$2,400/month</strong> and invest the difference.</>,
    prompt: 'Which choice likely leaves you wealthier in 2 years?',
    options: [
      { text: 'Rent, and invest the down payment.', correct: true, why: <>In the sandbox, renting comes out about <strong>$31,800 ahead</strong>. <Term id="closing-costs">Closing</Term> and selling costs total about <strong>$41,700</strong>. That's more than the principal you'd pay down (~$7,400) and the appreciation (~$24,400) combined.</> },
      { text: 'Buy: rent is throwing money away, and you\'d be building equity.', why: <>In 2 years you'd pay about <strong>$41,150 in mortgage interest</strong>, plus ~$9,000 property tax and ~$8,200 maintenance. None of that builds equity. Early payments are mostly interest (that's how <Term id="amortization">amortization</Term> works).</> },
      { text: 'Buy with 5% down instead, so less cash is tied up.', why: <>A smaller down payment means a bigger loan, more interest, and <Term id="pmi">PMI</Term> (~$190/month here). Buying and selling costs stay the same, so 2 years is even further from breakeven.</> },
    ],
  },
  {
    id: 'deductible',
    scenario: <>You have a solid <strong>$10,000 emergency fund</strong>. You file a car-insurance claim about <strong>once every 5 years</strong>. A <strong>$500</strong> deductible costs $1,800/year. A <strong>$1,000</strong> deductible costs $1,520/year.</>,
    prompt: 'Which deductible makes more sense?',
    options: [
      { text: 'The $1,000 deductible (or even higher).', correct: true, why: <>Over 5 years, the $500 option costs about <strong>$9,500</strong> ($9,000 premiums + ~$500). The $1,000 option costs about <strong>$8,600</strong> ($7,600 + ~$1,000), about $900 less. Your emergency fund easily covers the bigger <Term id="deductible">deductible</Term>.</> },
      { text: 'The $500 deductible, for peace of mind.', why: <>Peace of mind costs <strong>$280/year</strong> in extra <Term id="premium">premium</Term>. It only pays off if you claim more than once every ~1.8 years. With $10,000 saved, a $1,000 bill is annoying, not a disaster.</> },
      { text: 'Whichever deductible is lowest, like $250.', why: <>A $250 deductible costs about $2,000/year here. That's <strong>$10,250</strong> over 5 years, the priciest option. Low deductibles only make sense if a surprise bill would truly break you.</> },
    ],
  },
  {
    id: 'car-tco',
    scenario: <>A dealer shows you a new SUV for "<strong>only $654/month</strong>" (72-month loan). A 3-year-old sedan would be $434/month. You'd keep either car about 6 years.</>,
    prompt: 'Which number should drive your decision?',
    options: [
      { text: 'The monthly payment: if it fits the budget, it\'s affordable.', why: <>Payments hide <Term id="depreciation">depreciation</Term>, insurance, fuel and repairs. The SUV really costs about <strong>$917/month</strong>, roughly $260 more than its payment. Longer loans also lower the payment but <em>raise</em> total interest.</> },
      { text: 'Total cost of ownership over the years you\'ll keep it.', correct: true, why: <>Over 6 years, the new SUV costs about <strong>$66,000</strong> all-in. The used sedan costs about <strong>$40,600</strong>. That ~$25,000 gap could go to your emergency fund or retirement instead.</> },
      { text: 'The sticker price only.', why: <>Price matters, but it leaves out interest (~$9,300 on the SUV loan), insurance and fuel. Two cars with the same price can have very different <Term id="total-cost-of-ownership">total costs</Term>.</> },
    ],
  },
];

const rules: Rule[] = [
  { icon: House, title: 'Buy a home when you\'ll likely stay 5–7+ years.', body: <>Buying and selling costs often total <strong>8–10%</strong> of the price, and equity takes years to make that back. Renting buys flexibility.</> },
  { icon: Car, title: 'Judge cars by total cost, not the monthly payment.', body: <>Depreciation, insurance, fuel, interest and repairs add up. A slightly used car often saves <strong>tens of thousands</strong>.</> },
  { icon: ShieldCheck, title: 'Insure catastrophes, not inconveniences.', body: <>Pick the <strong>highest deductible your emergency fund can cover</strong>. Keep strong coverage for the big, life-changing risks.</> },
];

export default function BigDecisionsModule() {
  return (
    <ModuleLayout
      id="big-decisions"
      hook={<>Your lease is up. Your parents say, "Rent is throwing money away. Buy!" The <strong>$400,000</strong> place you love needs <strong>$80,000</strong> down, but you may move in a few years. And a dealer keeps texting about an SUV for "only $654 a month." How do you decide?</>}
      concept={
        <>
          <Lead>It's easy to compare the wrong numbers, like rent vs. a mortgage payment. Instead, compare the <em>total</em> cost of each path, over the years you'll live it.</Lead>

          <MythBuster myth={'"Renting is throwing money away; buying builds wealth."'}>
            Owners "throw away" money too: <Term id="mortgage">mortgage</Term> interest, <Term id="property-tax">property tax</Term>, maintenance, insurance, and the <Term id="transaction-costs">costs of buying and selling</Term>.
            Their down payment could also have grown elsewhere. That's its <Term id="opportunity-cost">opportunity cost</Term>. Buying <em>can</em> build wealth, mostly if you stay long enough.
          </MythBuster>

          <Analogy icon={Hotel}>
            Renting is like a hotel stay. You pay the nightly rate, and someone else fixes the roof.
            Buying the hotel means you keep its rising value. But you also pay every repair, tax bill and fee to buy and sell. For a short stay, the room wins.
          </Analogy>

          <H3>The real costs of owning</H3>
          <ConceptCards cols={3} items={[
            { icon: Percent, title: 'Mortgage interest', body: <>Early payments are mostly interest. On a $320,000 loan at 6.5%, year one is about <strong>$20,700 of interest</strong> and only ~$3,600 of principal.</> },
            { icon: Landmark, title: 'Property tax & insurance', body: <>Often 1–2% of the home's value every year, even after the mortgage is paid off.</> },
            { icon: Wrench, title: 'Maintenance', body: <>Plan on about <strong>1% of the home's value per year</strong> for repairs and surprises. That's ~$4,000/year on $400,000.</> },
            { icon: Receipt, title: 'Buying & selling costs', body: <>About 2–5% in <Term id="closing-costs">closing costs</Term> to buy, and 6–8% in agent and transfer fees to sell. Roughly 10% round trip.</> },
            { icon: Hourglass, title: 'Opportunity cost', body: <>An $80,000 <Term id="down-payment">down payment</Term> invested at 6% would grow ~$4,800 in year one. Owning gives that up.</> },
            { icon: House, title: 'What you get back', body: <><Term id="home-equity">Equity</Term>: the principal you've paid plus any rise in value. It's real wealth, but you only get it when you sell (minus costs) or borrow against it.</> },
          ]} />

          <GoDeeper title="Before you buy: a quick readiness check">
            <Bullets items={[
              <>You expect to stay at least <strong>5–7 years</strong>.</>,
              <>After the down payment and closing costs, you still have an <Term id="emergency-fund">emergency fund</Term>.</>,
              <>The <strong>full</strong> monthly cost fits your budget. That means mortgage, property tax, insurance, upkeep, and <Term id="pmi">PMI</Term> if you put down less than 20%.</>,
              <>Your income feels steady for the next few years.</>,
            ]} />
            <p>If one of these is a "no," renting a while longer is a smart choice. You're not falling behind. You're keeping your options open while you build up savings.</p>
          </GoDeeper>

          <P>Quick gut check: the <Term id="price-to-rent">price-to-rent ratio</Term>. Divide the home price by one year of rent.</P>
          <P>Above about 20 often favors renting. Below about 15 often favors buying, if you'll stay a while.</P>

          <Example title="Gut-checking a $400,000 home">
            <p>A similar place rents for $2,400 a month.</p>
            <Bullets items={[
              <>One year of rent: $2,400 × 12 = <strong>$28,800</strong>.</>,
              <>Price-to-rent: $400,000 ÷ $28,800 ≈ <strong>13.9</strong>. That's below 15, so it leans toward buying.</>,
              <>But buying and selling cost money. Closing at 3% is $12,000. Selling at 7% of $400,000 is $28,000. That's about <strong>$40,000</strong> you never get back.</>,
              <>Equity and rising value need time to beat that. In the sandbox below, buying pulls ahead in <strong>year 8</strong>.</>,
            ]} />
            <p>So the ratio says "maybe buy." Your plans decide. Staying 8+ years? Buying likely wins. Moving in 3? Renting likely wins.</p>
          </Example>

          <GoDeeper title="The catch: renting wins only if you invest the difference">
            <p>The sandbox assumes the renter invests the money a buyer would have tied up in the home. If that money gets spent, renting's edge shrinks fast.</p>
            <Bullets items={[
              <><strong>Invest the would-be down payment.</strong> For the $400,000 home, that's $80,000 (20%) plus $12,000 of closing costs.</>,
              <><strong>Automate the monthly gap.</strong> Owning costs $2,839 in month one. Renting costs $2,415. Invest the $424 difference each month.</>,
              <><strong>Check it once a year,</strong> since rent and owner costs both change over time.</>,
            ]} />
            <p>Owners get a built-in nudge: paying down the mortgage is forced savings. Renters have to build that habit on purpose.</p>
          </GoDeeper>

          <H3>Cars: the iceberg under the payment</H3>
          <P>A new car often loses about 20% of its value in year one. Then it keeps sliding.</P>
          <P>Add that <Term id="depreciation">depreciation</Term> to interest, insurance, fuel and repairs. The total is the car's <Term id="total-cost-of-ownership">total cost of ownership</Term>.</P>
          <AutoTco />

          <Example title="Why a longer loan costs more">
            <p>Take the sandbox's starting car: $32,000 with 10% down. You borrow $28,800 at 6.9%.</p>
            <Bullets items={[
              <><strong>5-year loan:</strong> $568.92 a month. $568.92 × 60 = $34,135. Interest = $34,135 − $28,800 = <strong>$5,335</strong>.</>,
              <><strong>7-year loan:</strong> $433.26 a month. $433.26 × 84 = $36,394. Interest = $36,394 − $28,800 = <strong>$7,594</strong>.</>,
            ]} />
            <p>The longer loan feels about $136 a month cheaper. But it costs about <strong>$2,259 more</strong> in interest. A lower payment isn't the same as a lower price.</p>
          </Example>

          <GoDeeper title="How to shop for a car by total cost">
            <Bullets items={[
              <><strong>Set a total budget first.</strong> Then look at cars. Don't start from the monthly payment.</>,
              <><strong>Compare new with 2–3 years old.</strong> The first owner takes the steepest drop in value.</>,
              <><strong>Get insurance quotes before you buy.</strong> Rates can vary a lot from model to model.</>,
              <><strong>Line up your loan before the dealer.</strong> Then you can compare their rate to yours.</>,
              <><strong>Pick the shortest loan you can comfortably afford.</strong> Long loans can leave you owing more than the car is worth.</>,
              <><strong>Drive it longer.</strong> In the tool above, keeping the car 10 years instead of 6 drops the true cost from $724 to $636 a month.</>,
            ]} />
          </GoDeeper>

          <H3>Insurance: protect against disasters, not annoyances</H3>
          <P>Insurance covers big risks you <em>can't</em> afford, like a totaled car or a house fire. You pay for it with a <Term id="premium">premium</Term>.</P>
          <P>The <Term id="deductible">deductible</Term> is the part of a claim you pay yourself. With a solid emergency fund, a higher deductible can save you money.</P>
          <DeductibleChooser />

          <GoDeeper title="Pick a deductible in four steps">
            <Bullets items={[
              <><strong>Check your emergency fund.</strong> Only consider deductibles you could pay tomorrow.</>,
              <><strong>Get quotes at two or three deductible levels.</strong></>,
              <><strong>Find the yearly savings.</strong> In the tool, going from $500 to $1,000 saves $1,800 − $1,520 = $280 a year.</>,
              <><strong>Find your break-even.</strong> Extra risk ÷ yearly savings: $500 ÷ $280 ≈ 1.8 years. If you claim less often than that, the higher deductible usually wins.</>,
            ]} />
            <p>What's worth insuring? The big risks you could never cover yourself. Think lawsuits (liability), your health, your home or belongings, and your income if you can't work. Small, affordable losses are often cheaper to pay yourself.</p>
          </GoDeeper>

          <Mistakes items={[
            <>Comparing rent to the mortgage payment alone. Owning has many other costs.</>,
            <>Buying a home when you might move in a couple of years.</>,
            <>Shopping for a car by monthly payment. A longer loan lowers the payment but raises the total.</>,
            <>Picking a deductible bigger than your emergency fund can cover.</>,
          ]} />

          <UnderTheHood>
            <Formula note="L = loan, r = annual rate ÷ 12, n = 360 months. $320,000 at 6.5% → $2,023/month.">Monthly P&I = L × r(1 + r)ⁿ ÷ [(1 + r)ⁿ − 1]</Formula>
            <Formula note="Popularized by Ben Felix: ~1% property tax + ~1% maintenance + ~3% cost of capital (the return you give up on equity, minus appreciation). If rent is below this, renting is often cheaper.">The 5% rule: yearly unrecoverable cost of owning ≈ 5% × home value → $400,000 × 5% ÷ 12 ≈ $1,667/month</Formula>
            <Formula note="Each year: buyer = home value − selling costs − loan balance + any invested savings; renter = invested down payment & closing costs + invested monthly savings. Whoever has the cheaper month invests the difference.">Net worth gap = Buyer net worth − Renter net worth</Formula>
            <Formula note="Assumes every claim exceeds the deductible.">Expected insurance cost = Premiums + (Claims per year × Years × Deductible)</Formula>
            <p><strong className="text-ink">Simplifications:</strong> no mortgage-interest tax deduction (most people take the standard deduction), no taxes on investment gains, constant appreciation and returns. Real markets are lumpier, so treat the breakeven year as a range, not a promise.</p>
          </UnderTheHood>
        </>
      }
      sandbox={<RentVsBuy />}
      questions={questions}
      rules={rules}
    />
  );
}
