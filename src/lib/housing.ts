/** Rent vs. buy, auto total cost of ownership, and insurance deductible math. */

export interface RentBuyInputs {
  price: number;
  downPct: number;
  rate: number; // mortgage APR %
  rent: number; // monthly
  stayYears: number;
  appreciation: number; // % / yr
  rentGrowth: number; // % / yr
  investReturn: number; // % / yr on money not tied up in the house
  propertyTaxPct: number; // % of home value / yr
  maintenancePct: number; // % of home value / yr
  insurancePct: number; // % of home value / yr
  closingPct: number; // % of price, paid when buying
  sellingPct: number; // % of sale price, paid when selling
}

export const RENT_BUY_ASSUMPTIONS = {
  appreciation: 3,
  rentGrowth: 3,
  investReturn: 6,
  propertyTaxPct: 1.1,
  maintenancePct: 1,
  insurancePct: 0.35,
  closingPct: 3,
  sellingPct: 7,
  pmiPct: 0.6,
  rentersInsurance: 15,
};

export const mortgagePayment = (loan: number, ratePct: number, yrs = 30) => {
  const r = ratePct / 100 / 12, n = yrs * 12;
  if (loan <= 0) return 0;
  if (r === 0) return loan / n;
  return (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};

export interface RentBuyYear {
  year: number;
  buyNW: number; // net worth if the buyer sells at the end of this year
  rentNW: number;
  diff: number; // buy - rent
  homeValue: number;
  loanBalance: number;
  buyerMonthly: number; // average monthly cost of owning during this year
  rentMonthly: number;
}

export interface CostBreakdown {
  interest: number;
  propertyTax: number;
  maintenance: number;
  insurance: number; // homeowners insurance + PMI
  transaction: number; // closing + selling costs
  opportunity: number; // growth the down payment + closing costs would have earned invested
  rent: number; // renter's total rent + renters insurance
  appreciation: number; // home value gain (offsets buyer costs)
  principal: number; // loan principal repaid (forced savings, recoverable)
}

export interface RentBuyResult {
  years: RentBuyYear[];
  monthlyPI: number;
  firstMonthOwnerCost: number;
  breakevenYear: number | null;
  breakdown: CostBreakdown; // at stayYears
  loan: number;
  upfront: number;
}

export function simulateRentBuy(inp: RentBuyInputs, horizon = 15): RentBuyResult {
  const A = RENT_BUY_ASSUMPTIONS;
  const down = (inp.price * inp.downPct) / 100;
  const closing = (inp.price * inp.closingPct) / 100;
  const loan = inp.price - down;
  const pmt = mortgagePayment(loan, inp.rate);
  const r = inp.rate / 100 / 12;
  const inv = Math.pow(1 + inp.investReturn / 100, 1 / 12) - 1;
  const needsPmi = inp.downPct < 20;

  let bal = loan;
  let renterPort = down + closing;
  let buyerPort = 0;
  const years: RentBuyYear[] = [];
  const acc = { interest: 0, propertyTax: 0, maintenance: 0, insurance: 0, rent: 0, principal: 0 };
  let snapshot: CostBreakdown | null = null;
  let firstMonthOwnerCost = 0;
  let yearOwner = 0, yearRent = 0;

  for (let m = 1; m <= horizon * 12; m++) {
    const value = inp.price * Math.pow(1 + inp.appreciation / 100, (m - 1) / 12);
    const interest = bal * r;
    const principal = Math.min(bal, pmt - interest);
    const payment = bal > 0 ? interest + principal : 0;
    bal = Math.max(0, bal - principal);
    const tax = (value * inp.propertyTaxPct) / 100 / 12;
    const maint = (value * inp.maintenancePct) / 100 / 12;
    const ins = (value * inp.insurancePct) / 100 / 12;
    const pmi = needsPmi && bal > 0.78 * inp.price ? (loan * A.pmiPct) / 100 / 12 : 0;
    const ownerCost = payment + tax + maint + ins + pmi;
    const rentCost = inp.rent * Math.pow(1 + inp.rentGrowth / 100, Math.floor((m - 1) / 12)) + A.rentersInsurance;
    if (m === 1) firstMonthOwnerCost = ownerCost;

    acc.interest += interest; acc.principal += principal; acc.propertyTax += tax;
    acc.maintenance += maint; acc.insurance += ins + pmi; acc.rent += rentCost;
    yearOwner += ownerCost; yearRent += rentCost;

    // Whoever has the cheaper month invests the difference, so both spend the same total.
    renterPort *= 1 + inv;
    buyerPort *= 1 + inv;
    const gap = ownerCost - rentCost;
    if (gap > 0) renterPort += gap; else buyerPort += -gap;

    if (m % 12 === 0) {
      const y = m / 12;
      const endValue = inp.price * Math.pow(1 + inp.appreciation / 100, y);
      const selling = (endValue * inp.sellingPct) / 100;
      const buyNW = endValue - selling - bal + buyerPort;
      years.push({ year: y, buyNW, rentNW: renterPort, diff: buyNW - renterPort, homeValue: endValue, loanBalance: bal, buyerMonthly: yearOwner / 12, rentMonthly: yearRent / 12 });
      yearOwner = 0; yearRent = 0;
      if (y === inp.stayYears) {
        snapshot = {
          interest: acc.interest,
          propertyTax: acc.propertyTax,
          maintenance: acc.maintenance,
          insurance: acc.insurance,
          transaction: closing + selling,
          opportunity: (down + closing) * (Math.pow(1 + inp.investReturn / 100, y) - 1),
          rent: acc.rent,
          appreciation: endValue - inp.price,
          principal: acc.principal,
        };
      }
    }
  }
  let breakevenYear: number | null = null;
  for (let i = 0; i < years.length; i++) {
    if (years.slice(i).every((y) => y.diff >= 0)) { breakevenYear = years[i].year; break; }
  }
  return { years, monthlyPI: pmt, firstMonthOwnerCost, breakevenYear, breakdown: snapshot!, loan, upfront: down + closing };
}

/* ---------------- Auto total cost of ownership ---------------- */

export interface AutoInputs {
  price: number;
  condition: 'new' | 'used';
  downPct: number;
  apr: number;
  loanYears: number;
  keepYears: number;
  milesPerYear: number;
  mpg: number;
  gasPrice: number;
  insuranceMonthly: number;
}

export function autoCost(a: AutoInputs) {
  // Depreciation curve: new cars lose ~20% in year one then ~15%/yr; used cars ~10%/yr.
  let value = a.price;
  for (let y = 1; y <= a.keepYears; y++) value *= a.condition === 'new' ? (y === 1 ? 0.8 : 0.85) : 0.9;
  const depreciation = a.price - value;
  const taxesFees = a.price * 0.08;
  const loan = a.price * (1 - a.downPct / 100);
  const r = a.apr / 100 / 12, n = a.loanYears * 12;
  const pmt = loan <= 0 ? 0 : r === 0 ? loan / n : (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const interest = Math.max(0, pmt * n - loan);
  const fuel = (a.milesPerYear / a.mpg) * a.gasPrice * a.keepYears;
  const insurance = a.insuranceMonthly * 12 * a.keepYears;
  let maintenance = 0;
  for (let y = 1; y <= a.keepYears; y++) maintenance += a.condition === 'new' ? 400 + 150 * (y - 1) : 1000 + 150 * (y - 1);
  const total = depreciation + taxesFees + interest + fuel + insurance + maintenance;
  return {
    depreciation, taxesFees, interest, fuel, insurance, maintenance, total,
    resale: value,
    monthlyPayment: pmt,
    perMonth: total / (a.keepYears * 12),
    perMile: total / (a.milesPerYear * a.keepYears),
  };
}

/* ---------------- Insurance deductible chooser ---------------- */

export interface DeductibleOption { deductible: number; premium: number; }

export const DEDUCTIBLE_OPTIONS: DeductibleOption[] = [
  { deductible: 250, premium: 2_000 },
  { deductible: 500, premium: 1_800 },
  { deductible: 1_000, premium: 1_520 },
  { deductible: 2_000, premium: 1_250 },
];

/** Expected cost over n years = premiums + (claims per year x years x deductible). Assumes each claim exceeds the deductible. */
export function deductibleCosts(claimsPerYear: number, yrs: number, premiumScale = 1) {
  return DEDUCTIBLE_OPTIONS.map((o) => {
    const premiums = o.premium * premiumScale * yrs;
    const outOfPocket = claimsPerYear * yrs * o.deductible;
    return { ...o, premium: o.premium * premiumScale, premiums, outOfPocket, total: premiums + outOfPocket };
  });
}
