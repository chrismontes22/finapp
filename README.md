# Money Sandbox

An interactive personal-finance course, built with React, TypeScript, Tailwind CSS, Recharts and Lucide icons. Single-page app, no backend.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## What's inside

**Module 1: Money Foundations**, 9 chapters that follow the course outline in `src/data/course.ts`. Every chapter has the same shape:

1. **Key points**: a short bullet list at the top of the chapter.
2. **Sections** (1.1, 1.2, ...): each opens with a one-sentence, actionable summary, then explains the idea with examples.
3. **Charts, diagrams and example documents**: every picture has a "How to read it" panel and a "What it shows" takeaway. Charts also have a table view.
4. **Sliders**: interactive sandboxes with presets and "try this" experiments.
5. **Practice and cheat sheet**: three Decision Check scenarios and three rules to keep.

| # | Chapter | Sections |
|---|---------|----------|
| 1 | Cash Flow: Keeping More of What You Earn | Income vs. wealth · Plugging the leaks · Simple budgeting |
| 2 | Banking & Automation | Checking vs. HYSA · Bank fees · Automate payday |
| 3 | Safety Net & Crushing Debt | Two-step emergency fund · Credit cards & scores · Avalanche vs. snowball · Traps to avoid |
| 4 | Growing Your Income | Income has no ceiling · Ways to earn more |
| 5 | Investing for Real People | Why cash isn't enough · Compounding · Index funds · Fees, risk & staying calm |
| 6 | Retirement & Tax-Smart Wealth Building | 401(k) match · Traditional vs. Roth · IRAs, HSAs & target-date funds · Where each dollar goes |
| 7 | Buying Assets, Not Liabilities | Assets vs. liabilities · Cars · Rent vs. buy |
| 8 | Protecting Your Wealth | Taxes · Insurance · Scams |
| 9 | Financial Freedom | What FI means · How much is enough · Keep it simple |

To edit chapter titles, key points or the summary sentence at the top of any section, change `src/data/course.ts`. Section content lives in `src/chapters/c<N>-*.tsx`.

- **Glossary:** about 130 terms. Hover or tap any dotted-underlined word for a one-sentence definition and an example. Open the searchable drawer from the header or press `/`.
- **Progress:** completed chapters, first-try quiz answers, collected glossary terms and the theme are saved in `localStorage` only.
- **Dark mode:** the toggle is in the header. It defaults to the OS setting.
- **Intro:** a ~4-second animated intro plays the first time you open the home page each day. Click anywhere, press Esc, or use **Skip intro** to dismiss it. Open `#/intro` to replay it.
- **Deep links:** `#/c/<chapter-id>` opens a chapter and `#/c/<chapter-id>/<section>` (for example `#/c/cash-flow/1-2`) jumps to a section.

The previous 8-lesson version is kept in `backup-before-outline/` for reference. It is not part of the build.

## Project layout

```
src/
  data/           course.ts (the outline: modules, chapters, sections, summaries, key points) + glossary
  chapters/       one file per chapter (lazy-loaded), each with its figures, sliders, quiz and cheat sheet
  components/     ChapterLayout (key points, section bar, summaries), Figure (charts/diagrams/example
                  documents with explanations), Sim (slider shell), Chart, SegmentBar, Glossary,
                  DecisionCheck, CheatSheet, AppShell
  lib/            pure finance math (no React): growth, debt, tax (2026 IRS figures), portfolio, housing
  state/          progress (localStorage), theme, hash router, My Money data
  pages/          Home (course map), MyMoney
```

## Assumptions & disclaimer

The simulations use simplified, illustrative assumptions: 2026 U.S. federal brackets and limits, flat state tax, constant returns, and no investment taxes in the rent-vs-buy model. It's an educational tool, not personalized financial, tax, or legal advice.
