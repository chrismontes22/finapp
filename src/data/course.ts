import type { LucideIcon } from 'lucide-react';
import { Wallet, Landmark, LifeBuoy, TrendingUp, Sprout, PiggyBank, House, ShieldCheck, Sunrise } from 'lucide-react';

/**
 * The course outline. Everything a reader sees in the course map, the sidebar, the chapter
 * headers ("Key points") and the one-sentence summary at the top of every subchapter lives here,
 * so the outline can be edited in one place.
 */

export type ChapterId =
  | 'cash-flow'
  | 'banking'
  | 'safety-net'
  | 'income'
  | 'investing'
  | 'retirement'
  | 'assets'
  | 'protection'
  | 'freedom';

export interface SectionMeta {
  /** URL- and DOM-safe id, e.g. "1-2". */
  id: string;
  /** Display number, e.g. "1.2". */
  num: string;
  title: string;
  /** Shorter label for the sticky section bar and the sidebar. */
  short: string;
  /** One concise, actionable sentence shown at the top of the subchapter. */
  summary: string;
}

export interface ChapterMeta {
  id: ChapterId;
  num: number;
  /** Which course module the chapter belongs to. */
  module: number;
  title: string;
  short: string;
  blurb: string;
  /** Bullet points shown at the start of the chapter. */
  keyPoints: string[];
  icon: LucideIcon;
  minutes: number;
  /** Number of Decision Check scenarios (kept here so the course map needn't load chapter code). */
  quizCount: number;
  sections: SectionMeta[];
}

export interface CourseModule {
  num: number;
  title: string;
  audience: string;
  blurb: string;
  /** Bullet points shown at the start of the module on the course map. */
  keyPoints: string[];
}

const sec = (num: string, title: string, summary: string, short = title): SectionMeta => ({ id: num.replace('.', '-'), num, title, short, summary });

export const COURSE_MODULES: CourseModule[] = [
  {
    num: 1,
    title: 'Money Foundations',
    audience: 'For everyday earners. No difficult math.',
    blurb: 'Keep more of what you earn, clear debt, invest for the long term and protect what you build.',
    keyPoints: [
      'Track your net worth, not your income, to see whether you are moving forward.',
      'Save first and automate it on payday.',
      'Build a starter emergency fund, then pay off high-interest debt.',
      'Grow your income, because spending cuts have a limit and earnings do not.',
      'Invest for the long term in low-cost, broad index funds.',
      'Get your full 401(k) match, then use IRAs and HSAs.',
      'Buy things that add to your net worth, and judge every purchase by its total price, not the monthly payment.',
      'Insure against large losses and learn the warning signs of a scam.',
      'Aim to invest about 25 times your yearly expenses.',
    ],
  },
];

export const CHAPTERS: ChapterMeta[] = [
  {
    id: 'cash-flow', num: 1, module: 1, icon: Wallet, minutes: 15, quizCount: 3,
    title: 'Cash Flow: Keeping More of What You Earn',
    short: 'Cash Flow',
    blurb: 'Why income is not wealth, how to find and cut the charges you don\'t notice, and a simple budget that runs itself.',
    keyPoints: [
      'Wealth is what you keep and grow, not what you earn.',
      'Net worth is everything you own minus everything you owe. Check it to see if you are moving forward.',
      'A 10-minute review of last month\'s statement usually turns up 2 or 3 charges you can cancel.',
      'Pay yourself first: move money to savings the day you get paid, then spend what is left.',
      'Aim for about half on needs and at least 15–20% toward debt payoff, saving and investing.',
      'Sinking funds turn predictable costs, like car repairs and holidays, into small monthly amounts.',
    ],
    sections: [
      sec('1.1', 'Income vs. Wealth', 'Measure your progress by your net worth (what you own minus what you owe), not by the size of your paycheck.'),
      sec('1.2', 'Plugging the Leaks', 'Spend 10 minutes on last month\'s bank statement and cancel 2 or 3 charges you won\'t miss.'),
      sec('1.3', 'Simple Budgeting Without Spreadsheets', 'Move your savings out the day you get paid, then spend what is left without tracking every dollar.', 'Simple budgeting'),
    ],
  },
  {
    id: 'banking', num: 2, module: 1, icon: Landmark, minutes: 10, quizCount: 3,
    title: 'Banking & Automation: Putting Money on Autopilot',
    short: 'Banking & Automation',
    blurb: 'Which account to use for what, how to stop paying bank fees, and how to make payday move your money for you.',
    keyPoints: [
      'Use checking for bills and daily spending, and savings for money you are keeping.',
      'Online high-yield savings accounts (HYSAs) pay far more interest than big traditional banks and are just as safe when FDIC or NCUA insured.',
      'Turn off debit card overdraft coverage so a small purchase can\'t trigger a $35 fee.',
      'Avoid monthly maintenance fees and out-of-network ATM fees.',
      'Set up automatic transfers on payday so saving happens without effort.',
    ],
    sections: [
      sec('2.1', 'Checking vs. High-Yield Savings', 'Keep bill money in checking and move your savings to an FDIC- or NCUA-insured high-yield savings account.', 'Checking vs. HYSA'),
      sec('2.2', 'Never Pay Stupid Bank Fees', 'Turn off debit card overdraft coverage today and use accounts with no monthly or ATM fees.', 'Bank fees'),
      sec('2.3', 'Automate Payday', 'Schedule automatic transfers for payday so savings, retirement and bills are handled before you spend.'),
    ],
  },
  {
    id: 'safety-net', num: 3, module: 1, icon: LifeBuoy, minutes: 20, quizCount: 3,
    title: 'Safety Net & Crushing Debt',
    short: 'Safety Net & Debt',
    blurb: 'A two-step emergency fund, how credit cards and credit scores work, two ways to pay off debt, and the loans to never take.',
    keyPoints: [
      'Save a $500–$1,000 starter emergency fund as fast as you can.',
      'Once high-interest debt is gone, build 3–6 months of basic expenses in a high-yield savings account.',
      'Pay your full credit card statement balance every month and you pay $0 in interest.',
      'Paying on time and keeping balances low make up about 65% of your credit score.',
      'Pay off debt with the avalanche (highest rate first) or snowball (smallest balance first) method.',
      'Treat any debt above 7–8% interest as an emergency.',
      'Avoid payday loans, title loans, rent-to-own and stacked Buy Now, Pay Later plans.',
    ],
    sections: [
      sec('3.1', 'The Two-Step Emergency Fund', 'Save $500–$1,000 fast, then build 3–6 months of basic expenses once high-interest debt is gone.', 'Emergency fund'),
      sec('3.2', 'How Credit Cards & Debt Trap You', 'Pay the full statement balance on time every month and keep your balances low compared to your limits.', 'Credit cards & scores'),
      sec('3.3', 'Two Simple Ways to Wipe Out Debt', 'List your debts, choose avalanche or snowball, and send every extra dollar to one debt at a time.', 'Avalanche vs. snowball'),
      sec('3.4', 'Traps to Avoid', 'Don\'t use payday loans, title loans or rent-to-own, and never run more than one Buy Now, Pay Later plan at once.'),
    ],
  },
  {
    id: 'income', num: 4, module: 1, icon: TrendingUp, minutes: 10, quizCount: 3,
    title: 'Growing Your Income: Your Biggest Wealth Tool',
    short: 'Growing Your Income',
    blurb: 'Why earning more beats cutting more, and practical ways to raise your pay without letting your spending rise with it.',
    keyPoints: [
      'There is a limit to how much you can cut, but no limit to how much you can earn.',
      'Negotiating, and changing jobs every few years, often beats 2–3% yearly raises.',
      'Learn skills or trades that employers pay more for.',
      'Choose side income that builds skills or ownership, not just more hours at low pay.',
      'When you get a raise, save or invest at least half of it before upgrading your lifestyle.',
    ],
    sections: [
      sec('4.1', 'You Can Only Cut So Much, But Income Has No Ceiling', 'Once your spending is under control, put your effort into earning more.', 'Income has no ceiling'),
      sec('4.2', 'Practical Ways to Earn More', 'Check your market pay every 1–2 years, ask for raises with evidence, and save at least half of every raise.', 'Ways to earn more'),
    ],
  },
  {
    id: 'investing', num: 5, module: 1, icon: Sprout, minutes: 20, quizCount: 3,
    title: 'Investing for Real People: How Wealth Actually Grows',
    short: 'Investing',
    blurb: 'Why cash alone falls behind, how compounding works, why index funds beat stock picking, and how to stay calm when markets drop.',
    keyPoints: [
      'Inflation makes cash buy less every year. Savings protect you today; investing grows your money for later.',
      'Compounding means your money earns money, and that money earns more. Time matters more than the amount.',
      'An index fund buys a small piece of hundreds of companies at once, so one failure won\'t sink you.',
      'Choose funds with fees of 0.03%–0.10%, not 1% or more.',
      'Market drops are normal. Keep buying and never panic-sell.',
      'Keep at least 95% in broad index funds and cap crypto or single stocks at 5%.',
    ],
    sections: [
      sec('5.1', 'Why Saving Cash Alone Isn\'t Enough', 'Keep your emergency fund in savings and invest money you won\'t need for at least 5 years.', 'Why cash isn\'t enough'),
      sec('5.2', 'Compounding Without the Math', 'Start investing as early as you can, even if the amount is small.', 'Compounding'),
      sec('5.3', 'Index Funds: The Common Man\'s Secret Weapon', 'Build your investments around a low-cost S&P 500 or total stock market index fund.', 'Index funds'),
      sec('5.4', 'Fees, Risk, and Staying Calm', 'Pick funds that charge 0.10% or less, keep buying when the market drops, and keep speculation under 5%.', 'Fees & risk'),
    ],
  },
  {
    id: 'retirement', num: 6, module: 1, icon: PiggyBank, minutes: 20, quizCount: 3,
    title: 'Retirement & Tax-Smart Wealth Building',
    short: 'Retirement & Taxes',
    blurb: 'The 401(k) match, Traditional vs. Roth, the accounts anyone can open, and the order to fill them in.',
    keyPoints: [
      'Contribute enough to your 401(k) to get the full employer match. It is a 100% return on that money.',
      'Traditional accounts skip taxes now; Roth accounts make all growth tax-free later.',
      'Anyone with earned income can open an IRA in about 15 minutes, even without a 401(k) at work.',
      'An HSA is tax-free going in, while growing and when spent on medical bills.',
      'A target-date fund adjusts your investment mix for you as retirement gets closer.',
      'Money in an IRA or 401(k) must be invested, not left sitting in cash.',
    ],
    sections: [
      sec('6.1', 'Grab Free Money First (401k Match)', 'Contribute at least enough to your 401(k) to get 100% of your employer\'s match.', '401(k) match'),
      sec('6.2', 'Traditional vs. Roth', 'Choose Roth if you expect a higher tax rate later and Traditional if you expect a lower one.'),
      sec('6.3', 'Accounts Anyone Can Use', 'Open an IRA at a low-cost brokerage, invest it in a target-date or index fund, and use an HSA if your health plan allows it.', 'IRAs, HSAs & target-date funds'),
      sec('6.4', 'The Simple Order of Where Every Extra Dollar Goes', 'Work through these seven steps in order, and move to the next only when the current one is done.', 'Where each dollar goes'),
    ],
  },
  {
    id: 'assets', num: 7, module: 1, icon: House, minutes: 15, quizCount: 3,
    title: 'Buying Assets, Not Liabilities (Houses, Cars, Stuff)',
    short: 'Assets vs. Liabilities',
    blurb: 'How to tell what builds wealth from what costs you money every month, how to buy a car, and when buying a home beats renting.',
    keyPoints: [
      'Assets put money in your pocket or grow in value. Liabilities take money out every month.',
      'A new car loses a large share of its value in the first few years.',
      'Negotiate the total out-the-door price, never the monthly payment.',
      'Buy a reliable used car, pay it off fast and keep driving it after the payments stop.',
      'Renting is not throwing money away. Your rent is the most you pay; a mortgage is the least.',
      'Buy a home only if you will stay 5+ years, have a separate emergency fund and can afford the full monthly cost.',
    ],
    sections: [
      sec('7.1', 'Assets vs. Liabilities', 'Before a big purchase, ask whether it will put money in your pocket or take money out every month.'),
      sec('7.2', 'Cars: The Quiet Wealth Killer', 'Negotiate the out-the-door price, buy a reliable used car and keep it for years after it is paid off.', 'Cars'),
      sec('7.3', 'Renting vs. Buying a Home', 'Buy only if you will stay 5+ years, keep your emergency fund separate from your down payment, and can afford the full monthly cost.', 'Rent vs. buy'),
    ],
  },
  {
    id: 'protection', num: 8, module: 1, icon: ShieldCheck, minutes: 15, quizCount: 3,
    title: 'Protecting Your Wealth',
    short: 'Protecting Your Wealth',
    blurb: 'How tax brackets really work, which insurance you need and which you can skip, and how to spot a scam.',
    keyPoints: [
      'A raise never lowers your take-home pay. Only the dollars inside a higher bracket pay the higher rate.',
      'If you do freelance or gig work, set aside 25–30% of every payment for taxes.',
      'Carry health, auto liability and renters or homeowners insurance.',
      'Buy low-cost term life insurance only if someone depends on your income. Skip whole life and gadget warranties.',
      'Promises of guaranteed high returns, pressure to act now, and requests for gift cards or wire transfers are signs of a scam.',
    ],
    sections: [
      sec('8.1', 'Taxes Without the Panic', 'Take every raise you are offered, and if you do gig work, move 25–30% of each payment to a separate tax account.', 'Taxes'),
      sec('8.2', 'Essential Insurance Only', 'Insure against losses that could wipe you out, and skip coverage for things you could replace yourself.', 'Insurance'),
      sec('8.3', 'Avoiding Scams & Bad Financial Advice', 'Walk away from anyone who promises guaranteed high returns, rushes you, or asks for gift cards or a wire transfer.', 'Scams'),
    ],
  },
  {
    id: 'freedom', num: 9, module: 1, icon: Sunrise, minutes: 10, quizCount: 3,
    title: 'Financial Freedom & Living Off Your Wealth',
    short: 'Financial Freedom',
    blurb: 'What financial independence means, how to estimate the amount you need, and a simple routine to keep for life.',
    keyPoints: [
      'Financial independence means having enough invested that work becomes optional.',
      'A rough target is 25 times your yearly living expenses.',
      'Every $100 a month you cut from permanent expenses lowers that target by $30,000.',
      'Check your accounts for 15 minutes once a month and ignore daily market news.',
      'Automate saving and investing, stay out of high-interest debt, and give it time.',
    ],
    sections: [
      sec('9.1', 'What Financial Independence Actually Means', 'Define your goal as having enough invested that work becomes optional.', 'What FI means'),
      sec('9.2', 'How Much Is Enough? (Simple Rule of Thumb)', 'Multiply your yearly living expenses by 25 to estimate the amount you need invested.', 'How much is enough?'),
      sec('9.3', 'Keep It Simple for Life', 'Check your accounts for 15 minutes once a month, keep everything automated and ignore daily market news.', 'Keep it simple'),
    ],
  },
];

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c])) as Record<ChapterId, ChapterMeta>;
export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);
export const isChapterId = (s: string): s is ChapterId => (CHAPTER_IDS as string[]).includes(s);

export const chaptersInModule = (num: number) => CHAPTERS.filter((c) => c.module === num);

export const nextChapter = (id: ChapterId): ChapterMeta | undefined => {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  return CHAPTERS[i + 1];
};
export const prevChapter = (id: ChapterId): ChapterMeta | undefined => {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  return i > 0 ? CHAPTERS[i - 1] : undefined;
};

export const pad2 = (n: number) => String(n).padStart(2, '0');
