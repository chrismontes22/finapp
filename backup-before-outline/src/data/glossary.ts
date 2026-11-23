import type { ModuleId } from './modules';

export interface GlossaryEntry {
  term: string;
  def: string;
  example: string;
  module: ModuleId;
}

/** Every term gets one plain-English sentence and one real-world example. */
export const GLOSSARY = {
  /* ---------- Module 1: Cash flow ---------- */
  'gross-pay': { term: 'Gross pay', module: 'cash-flow', def: 'Your total pay before anything is taken out, like the salary on your offer letter.', example: 'A $60,000 salary is $5,000 a month gross, but less than that reaches your bank.' },
  'net-pay': { term: 'Net (take-home) pay', module: 'cash-flow', def: 'The pay that actually reaches your bank after taxes, insurance and retirement savings come out.', example: 'That $5,000 gross month might become about $3,675 of take-home pay.' },
  budget: { term: 'Budget', module: 'cash-flow', def: 'A plan for where each dollar goes, made before you spend it.', example: 'Deciding "$400 for groceries, $150 for fun" on the 1st is budgeting.' },
  'fixed-expense': { term: 'Fixed expense', module: 'cash-flow', def: 'A cost that stays about the same each month and is hard to change quickly.', example: 'Rent, a car payment and a phone plan are fixed expenses.' },
  'variable-expense': { term: 'Variable expense', module: 'cash-flow', def: 'A cost that changes from month to month, based on your choices.', example: 'Groceries, gas and eating out are variable, so they are the easiest to cut.' },
  'needs-wants': { term: 'Needs vs. wants', module: 'cash-flow', def: 'Needs keep your life running (housing, food, minimum debt payments), and wants make it fun.', example: 'Basic groceries are a need, a meal kit is a want, and both are allowed.' },
  'rule-50-30-20': { term: '50/30/20 rule', module: 'cash-flow', def: 'A starting guide: about 50% of take-home pay to needs, 30% to wants, 20% to savings and extra debt.', example: 'On $4,000 take-home: $2,000 needs, $1,200 wants, $800 savings, adjusted to fit your life.' },
  'sinking-fund': { term: 'Sinking fund', module: 'cash-flow', def: 'Money you save a little at a time for a known cost that doesn\'t come every month.', example: 'Saving $75/month for car repairs means a $600 brake job won\'t go on a credit card.' },
  'pre-tax-deduction': { term: 'Pre-tax deduction', module: 'cash-flow', def: 'Money taken from your paycheck before income tax is figured, which lowers your tax bill.', example: 'A 5% 401(k) contribution on $60,000 takes $3,000 off your taxable income.' },
  fica: { term: 'FICA', module: 'cash-flow', def: 'Payroll taxes for Social Security (6.2%) and Medicare (1.45%), taken from almost every paycheck.', example: 'On $5,000 of monthly pay, about $383 goes to FICA.' },
  'cash-flow': { term: 'Cash flow', module: 'cash-flow', def: 'The money coming in minus the money going out over a set time.', example: 'Earn $4,000 and spend $3,700 this month, and your cash flow is +$300.' },

  /* ---------- Module 2: Banking ---------- */
  'checking-account': { term: 'Checking account', module: 'banking', def: 'A bank account for everyday spending, bills and paychecks, which usually pays little or no interest.', example: 'Your rent and grocery money live in checking.' },
  hysa: { term: 'High-yield savings account (HYSA)', module: 'banking', def: 'A savings account, often at an online bank, that pays much more interest than a typical big bank.', example: '$10,000 at 4.5% APY earns about $450 a year, versus $1 at 0.01%.' },
  'fdic-insurance': { term: 'FDIC / NCUA insurance', module: 'banking', def: 'Government-backed protection for bank (FDIC) and credit union (NCUA) deposits: $250,000 per person, per bank, per ownership type (such as individual or joint).', example: 'If your insured bank fails, your $15,000 emergency fund is still safe.' },
  apy: { term: 'APY (Annual Percentage Yield)', module: 'banking', def: 'The interest you actually earn in a year, counting compounding, so it\'s the number to compare.', example: 'A 4.5% APY on $1,000 grows to $1,045 after one year.' },
  'emergency-fund': { term: 'Emergency fund', module: 'banking', def: 'Cash saved only for true surprises, like a job loss, usually 3 to 6 months of core costs.', example: 'If your core needs are $2,500/month, a 3-month fund is $7,500.' },
  inflation: { term: 'Inflation', module: 'banking', def: 'Prices rising over time, so each dollar buys a little less every year.', example: 'At 3% inflation, $100 of groceries costs about $134 in 10 years.' },
  'purchasing-power': { term: 'Purchasing power', module: 'banking', def: 'How much your money can actually buy, not just how many dollars you have.', example: 'After 10 years of 3% inflation, $10,000 buys only what about $7,440 buys today.' },
  'nominal-vs-real': { term: 'Nominal vs. real', module: 'banking', def: 'Nominal is the dollar amount, and real adjusts it for inflation to show true buying power.', example: 'A 4% raise during 3% inflation is only about a 1% real raise.' },
  liquidity: { term: 'Liquidity', module: 'banking', def: 'How quickly you can turn something into cash without losing value.', example: 'A savings account is very liquid, but selling a house takes months and costs thousands.' },

  /* ---------- Module 3: Credit & debt ---------- */
  'credit-score': { term: 'Credit score', module: 'credit-debt', def: 'A number, usually 300–850, that tells lenders, landlords and insurers how likely you are to repay.', example: 'A 760 score might get a 6.2% car loan, while a 620 score gets offered 12%.' },
  'payment-history': { term: 'Payment history', module: 'credit-debt', def: 'Your record of paying bills on time, the biggest part of your credit score (about 35%).', example: 'One payment 30+ days late can drop a good score by dozens of points.' },
  'credit-utilization': { term: 'Credit utilization', module: 'credit-debt', def: 'The share of your credit card limits you\'re using, where lower is better for your score.', example: 'A $900 balance on a $3,000 limit is 30% utilization.' },
  'credit-age': { term: 'Length of credit history', module: 'credit-debt', def: 'How long your credit accounts have been open, on average and for your oldest one.', example: 'Keeping your first no-fee card open helps your average account age grow.' },
  'credit-mix': { term: 'Credit mix', module: 'credit-debt', def: 'The variety of credit you handle, like cards and loans, a small part of your score.', example: 'A credit card plus a car loan is a broader mix than cards alone.' },
  'hard-inquiry': { term: 'Hard inquiry', module: 'credit-debt', def: 'A credit check when you apply for new credit, which can dip your score a little for a while.', example: 'Applying for three store cards in a month adds three hard inquiries.' },
  apr: { term: 'APR (Annual Percentage Rate)', module: 'credit-debt', def: 'The yearly interest rate on borrowed money, not counting compounding.', example: 'A 24% APR card charges about 2% interest each month on your balance.' },
  'apr-vs-apy': { term: 'APR vs. APY', module: 'credit-debt', def: 'APR is the simple yearly rate lenders quote, while APY adds compounding to show the true yearly effect.', example: 'A 24% APR compounded monthly is really about a 26.8% APY.' },
  principal: { term: 'Principal', module: 'credit-debt', def: 'The amount you borrowed or still owe, not counting interest.', example: 'On a $10,000 loan, the $10,000 is the principal, and interest is the cost on top.' },
  'minimum-payment': { term: 'Minimum payment', module: 'credit-debt', def: 'The smallest monthly payment a lender accepts without a late fee, often barely more than the interest.', example: 'On a $3,000 card at 24%, the minimum might be $90, and paying only that takes over 15 years.' },
  'debt-snowball': { term: 'Debt Snowball', module: 'credit-debt', def: 'Paying off debts from smallest balance to largest, for quick wins that keep you going.', example: 'Clear a $400 medical bill first, then roll its payment into the next debt.' },
  'debt-avalanche': { term: 'Debt Avalanche', module: 'credit-debt', def: 'Paying off debts from highest interest rate to lowest, which saves the most money.', example: 'Paying off a 24% card before a 5% student loan keeps total interest lowest.' },
  'revolving-credit': { term: 'Revolving credit', module: 'credit-debt', def: 'Credit you can borrow, repay and borrow again up to a limit, like a credit card.', example: 'Pay your card down to $0, and the full limit is yours to use again.' },
  'statement-balance': { term: 'Statement balance', module: 'credit-debt', def: 'What you owe when your card\'s billing cycle ends, and paying it all by the due date means no interest.', example: 'Spend $640 in October, pay the $640 statement in November, and you pay $0 interest.' },

  /* ---------- Module 4: Compounding ---------- */
  'simple-interest': { term: 'Simple interest', module: 'compounding', def: 'Interest earned only on your original money, never on past interest.', example: '$1,000 at 5% simple interest earns exactly $50 every year.' },
  'compound-interest': { term: 'Compound interest', module: 'compounding', def: 'Interest earned on your money and on its past interest, so growth speeds up over time.', example: '$1,000 at 5% compounded yearly earns $50, then $52.50, then $55.13, and so on.' },
  'compounding-frequency': { term: 'Compounding frequency', module: 'compounding', def: 'How often interest is added to your balance, such as yearly, monthly or daily.', example: '5% compounded daily ends up slightly ahead of 5% compounded yearly (5.13% vs. 5.00% a year).' },
  'rule-of-72': { term: 'Rule of 72', module: 'compounding', def: 'A shortcut: divide 72 by your yearly return to estimate how many years it takes to double your money.', example: 'At 8%, money doubles in about 72 ÷ 8 = 9 years.' },
  'time-value-of-money': { term: 'Time value of money', module: 'compounding', def: 'A dollar today is worth more than a dollar later, because today\'s dollar can grow.', example: '$1,000 now at 7% becomes about $1,967 in 10 years, so it beats getting $1,500 then.' },
  'time-in-market': { term: 'Time in the market', module: 'compounding', def: 'Staying invested for many years, which has usually mattered more than picking the perfect time to buy.', example: 'Missing just the 10 best market days in 20 years can cut your returns roughly in half.' },
  'market-timing': { term: 'Market timing', module: 'compounding', def: 'Trying to jump in and out of investments based on guesses about short-term price moves.', example: 'Selling before an expected crash often means missing the rebound.' },
  'future-value': { term: 'Future value', module: 'compounding', def: 'What money, or a series of deposits, will be worth later after growing at some rate.', example: '$300/month for 30 years at 7% grows to about $350,000.' },

  /* ---------- Module 5: Investing ---------- */
  stock: { term: 'Stock', module: 'investing', def: 'A small slice of ownership in a company, so you share in its growth and its losses.', example: 'Owning 1 share of a company with 1 billion shares means you own one-billionth of it.' },
  bond: { term: 'Bond', module: 'investing', def: 'A loan you make to a government or company, which pays you interest and then returns your money.', example: 'A $1,000 Treasury bond at 4% pays you $40 a year, then returns your $1,000.' },
  diversification: { term: 'Diversification', module: 'investing', def: 'Spreading money across many investments so one bad pick can\'t sink you.', example: 'An index fund holding 500 companies barely notices if one goes bankrupt.' },
  'mutual-fund': { term: 'Mutual fund', module: 'investing', def: 'A pooled fund that buys many stocks or bonds for its investors and trades once a day.', example: 'A target-date 2060 fund is a mutual fund holding thousands of stocks and bonds.' },
  etf: { term: 'ETF (Exchange-Traded Fund)', module: 'investing', def: 'A basket of investments, like a mutual fund, that trades all day on the stock exchange like a stock.', example: 'One share of a total-market ETF gives you a sliver of thousands of companies.' },
  'index-fund': { term: 'Index fund', module: 'investing', def: 'A fund that simply copies a market index instead of trying to pick winners, usually at very low cost.', example: 'An S&P 500 index fund owns all of the roughly 500 companies in the S&P 500.' },
  'active-fund': { term: 'Active fund', module: 'investing', def: 'A fund whose managers pick investments to try to beat the market, usually for higher fees.', example: 'Most active U.S. stock funds have trailed their index over 15-year periods after fees.' },
  'passive-investing': { term: 'Passive investing', module: 'investing', def: 'Buying the whole market through index funds and holding it for the long term.', example: 'Automatically putting $500/month into a total-market index fund is passive investing.' },
  'expense-ratio': { term: 'Expense ratio', module: 'investing', def: 'The yearly fee a fund charges, as a percent of your money, taken from your balance automatically.', example: 'A 0.03% fee costs $3 a year per $10,000, while a 1% fee costs $100.' },
  'fee-drag': { term: 'Fee drag', module: 'investing', def: 'How fees shrink your growth every year, compounding against you over time.', example: 'A 1% fee on $500/month for 30 years can cost about $100,000.' },
  'sp-500': { term: 'S&P 500', module: 'investing', def: 'A stock index of about 500 large U.S. companies, often used to mean "the market."', example: 'When the news says "stocks rose 1% today," it usually means the S&P 500.' },
  dividend: { term: 'Dividend', module: 'investing', def: 'A share of company profits paid to stockholders, usually every quarter.', example: 'A 2% dividend pays $20 a year for every $1,000 invested.' },
  brokerage: { term: 'Brokerage account', module: 'investing', def: 'An account at an investment firm for buying and selling stocks, bonds and funds.', example: 'It\'s like a bank account, but for investments.' },
  volatility: { term: 'Volatility', module: 'investing', def: 'How much and how fast an investment\'s price swings up and down.', example: 'A single tech stock might swing 40% in a year, while a bond fund might move 5%.' },

  /* ---------- Module 6: Taxes ---------- */
  'tax-bracket': { term: 'Tax bracket', module: 'taxes', def: 'A range of income taxed at one rate, with each slice of your income taxed at its own rate.', example: 'In 2026, a single filer\'s taxable income between $12,400 and $50,400 is taxed at 12%.' },
  'marginal-rate': { term: 'Marginal tax rate', module: 'taxes', def: 'The tax rate on your next dollar of income, which is your highest bracket.', example: 'If your top slice of income is in the 22% bracket, your marginal rate is 22%.' },
  'effective-rate': { term: 'Effective tax rate', module: 'taxes', def: 'Your total tax divided by your total income: the average rate you really pay.', example: 'A $95,000 earner in the 22% bracket might pay about 12.7% overall.' },
  'standard-deduction': { term: 'Standard deduction', module: 'taxes', def: 'A flat amount of income the IRS doesn\'t tax, no receipts needed.', example: 'In 2026, a single filer\'s first $16,100 of income is free of federal income tax.' },
  'taxable-income': { term: 'Taxable income', module: 'taxes', def: 'Your income after deductions, like the standard deduction, and the amount tax brackets apply to.', example: '$60,000 salary − $16,100 standard deduction = $43,900 taxable income.' },
  'k401': { term: '401(k)', module: 'taxes', def: 'A retirement account through your job that you fund from your paycheck, often with an employer match.', example: 'In 2026, you can put up to $24,500 of your own pay into a 401(k).' },
  'employer-match': { term: 'Employer match', module: 'taxes', def: 'Money your employer adds to your 401(k) when you contribute, like an instant raise.', example: 'With a "50% match up to 6%," putting in 6% of a $60,000 salary gets you an extra $1,800 a year.' },
  'traditional-account': { term: 'Traditional (pre-tax) account', module: 'taxes', def: 'A retirement account that cuts your taxes now, but withdrawals in retirement are taxed as income.', example: 'Putting $5,000 in a Traditional 401(k) in the 22% bracket saves about $1,100 in tax this year.' },
  roth: { term: 'Roth account', module: 'taxes', def: 'A retirement account funded with already-taxed money, so growth and qualified withdrawals are tax-free.', example: '$7,500 in a Roth IRA that grows to $75,000 can come out tax-free after 59½ (if rules are met).' },
  ira: { term: 'IRA (Individual Retirement Account)', module: 'taxes', def: 'A retirement account you open yourself, not through work, as a Traditional or Roth.', example: 'In 2026, you can put up to $7,500 in an IRA (more if you\'re 50+).' },
  'taxable-account': { term: 'Taxable brokerage account', module: 'taxes', def: 'A regular investment account with no special tax breaks, but no limits or withdrawal rules either.', example: 'Money for a goal 8 years away might live in a taxable account.' },
  hsa: { term: 'HSA (Health Savings Account)', module: 'taxes', def: 'A health account for people with a high-deductible plan: money goes in, grows and comes out tax-free for medical costs.', example: 'In 2026, one person can put up to $4,400 into an HSA.' },
  vesting: { term: 'Vesting', module: 'taxes', def: 'The schedule for when your employer\'s match becomes yours to keep if you leave the job.', example: 'With 3-year cliff vesting, leaving after 2 years means losing the match.' },
  'capital-gains': { term: 'Capital gains', module: 'taxes', def: 'Profit from selling an investment for more than you paid, taxed less if you held it over a year.', example: 'Buy a fund for $5,000, sell it for $8,000, and that\'s a $3,000 capital gain.' },

  /* ---------- Module 7: Risk ---------- */
  drawdown: { term: 'Drawdown', module: 'risk', def: 'The drop from an investment\'s high point to its low point before it recovers.', example: 'Falling from $10,000 to $7,000 is a 30% drawdown.' },
  'permanent-loss': { term: 'Permanent loss', module: 'risk', def: 'Money that\'s truly gone, usually from selling after a drop or owning something that hits zero.', example: 'Selling a diversified fund at the bottom turns a temporary dip into a permanent loss.' },
  'risk-tolerance': { term: 'Risk tolerance', module: 'risk', def: 'How much price swinging you can handle without panicking.', example: 'If a 25% drop would make you sell, your tolerance is lower than you might think.' },
  'risk-capacity': { term: 'Risk capacity', module: 'risk', def: 'How much risk your situation can afford, mostly based on when you need the money.', example: 'Retirement money for 30 years from now can take risk, but a down payment due next year can\'t.' },
  'time-horizon': { term: 'Time horizon', module: 'risk', def: 'How long until you need to spend the money you\'re investing.', example: 'A 25-year-old saving for retirement has a 40-year time horizon.' },
  'asset-allocation': { term: 'Asset allocation', module: 'risk', def: 'How you split your money among stocks, bonds and cash, the biggest driver of your risk.', example: 'A 70/30 portfolio holds 70% stocks and 30% bonds.' },
  rebalancing: { term: 'Rebalancing', module: 'risk', def: 'Selling some of what grew and buying what lagged to get back to your target mix.', example: 'If stocks drift from 70% to 78%, sell some stocks and buy bonds to get back to 70/30.' },
  dca: { term: 'Dollar-cost averaging (DCA)', module: 'risk', def: 'Investing a set amount on a regular schedule, so you buy more shares when prices are low.', example: '$500/month buys 5 shares at $100 but 6.25 shares at $80.' },
  'bear-market': { term: 'Bear market', module: 'risk', def: 'A drop of 20% or more from a recent market high.', example: 'The 2020 COVID bear market fell 34% and was back to its old high about 6 months after it began.' },
  correction: { term: 'Market correction', module: 'risk', def: 'A drop of 10% to 20% from a recent high, which historically happens every year or two.', example: 'A correction can feel scary, but it\'s a normal part of owning stocks.' },

  /* ---------- Module 8: Big decisions ---------- */
  mortgage: { term: 'Mortgage', module: 'big-decisions', def: 'A loan to buy a home, repaid monthly over many years, with the house backing the loan.', example: 'A $320,000, 30-year mortgage at 6.5% costs about $2,023/month in principal and interest.' },
  'down-payment': { term: 'Down payment', module: 'big-decisions', def: 'The cash you pay upfront for a home, with the mortgage covering the rest.', example: '20% down on a $400,000 home is $80,000.' },
  'closing-costs': { term: 'Closing costs', module: 'big-decisions', def: 'One-time fees to finish buying a home, often 2–5% of the price.', example: 'Closing on a $400,000 home might cost $12,000 on top of the down payment.' },
  'home-equity': { term: 'Home equity', module: 'big-decisions', def: 'The part of your home you truly own: its value minus what you still owe.', example: 'A $450,000 home with $300,000 left on the mortgage has $150,000 of equity.' },
  'property-tax': { term: 'Property tax', module: 'big-decisions', def: 'A yearly local tax based on a home\'s value, paid for as long as you own it.', example: 'At 1.1%, a $400,000 home costs about $4,400 a year in property tax.' },
  pmi: { term: 'PMI (Private Mortgage Insurance)', module: 'big-decisions', def: 'Extra insurance you pay with under 20% down, which protects the lender and can be removed later.', example: 'With 5% down on a $400,000 home, PMI might add about $190/month.' },
  'opportunity-cost': { term: 'Opportunity cost', module: 'big-decisions', def: 'What you give up by choosing one option: the benefit of the next-best choice.', example: 'An $80,000 down payment could have grown as investments, and that lost growth is a real cost.' },
  amortization: { term: 'Amortization', module: 'big-decisions', def: 'A loan\'s payment schedule, where early payments are mostly interest and later ones mostly principal.', example: 'In year one of a 30-year mortgage, roughly 80% of your payments can go to interest.' },
  'transaction-costs': { term: 'Transaction costs', module: 'big-decisions', def: 'Money lost just to buy or sell something, like agent commissions and closing fees.', example: 'Buying and selling a $400,000 home can cost $40,000+ in fees.' },
  depreciation: { term: 'Depreciation', module: 'big-decisions', def: 'The value something loses as it ages, often a car\'s biggest hidden cost.', example: 'A $42,000 new car may be worth about $15,000 after six years.' },
  'total-cost-of-ownership': { term: 'Total cost of ownership', module: 'big-decisions', def: 'Everything something really costs while you own it, not just the price or monthly payment.', example: 'A car\'s total cost includes depreciation, interest, insurance, fuel and repairs.' },
  premium: { term: 'Insurance premium', module: 'big-decisions', def: 'The regular price you pay to keep an insurance policy active.', example: 'Paying $130/month for car insurance is a $1,560 yearly premium.' },
  deductible: { term: 'Deductible', module: 'big-decisions', def: 'What you pay yourself on a claim before insurance starts paying.', example: 'With a $1,000 deductible, a $4,000 repair costs you $1,000 and insurance pays $3,000.' },
  'price-to-rent': { term: 'Price-to-rent ratio', module: 'big-decisions', def: 'A home\'s price divided by a year of rent for a similar place, where higher usually favors renting.', example: 'A $400,000 home that rents for $2,000/month has a ratio of about 16.7.' },
} satisfies Record<string, GlossaryEntry>;

export type TermId = keyof typeof GLOSSARY;
export const TERM_IDS = Object.keys(GLOSSARY) as TermId[];
export const getTerm = (id: TermId): GlossaryEntry => GLOSSARY[id];
