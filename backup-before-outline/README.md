# Money Sandbox

An interactive, beginner-friendly course in personal finance, built with React, TypeScript, Tailwind CSS, Recharts and Lucide icons. Single-page app, no backend.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## What's inside

Eight modules in two tiers. Each follows the same five steps: **Hook → Plain-English Concept → Interactive Sandbox → Decision Check → Cheat Sheet**.

| # | Module | Main sandbox | Extra mini-sandboxes |
|---|--------|--------------|----------------------|
| 1 | Cash Flow & Realistic Budgeting | Paycheck Allocator (50/30/20, sinking funds) | Paycheck Decoder (gross → net) |
| 2 | Banking, Emergency Funds & Inflation | Inflation vs. Savings Visualizer | Emergency Fund Sizer |
| 3 | Credit Scores & Debt Mechanics | Debt Payoff Race (Snowball vs. Avalanche) + utilization meter | Minimum-Payment Trap |
| 4 | Time Value of Money & Compounding | Cost of Waiting Simulator + Rule of 72 | Simple vs. Compound |
| 5 | Investing Building Blocks | Fee Drag Calculator | One Chef vs. Every Restaurant (diversification) |
| 6 | Tax Brackets & Account Types | Tax Buckets, Traditional vs. Roth, Employer Match | — |
| 7 | Risk, Asset Allocation & Rebalancing | Portfolio Mix & Market Drop (DCA, panic seller, rebalancing) | — |
| 8 | Major Decisions: Housing, Auto & Insurance | Rent vs. Buy Breakeven Explorer | Car Total Cost of Ownership, Deductible Chooser |

Every simulator has **Reset to default** and 2–3 one-click **preset scenarios**. Every chart has a **table view**.

- **Glossary:** about 90 terms. Hover or tap any dotted-underlined word for a one-sentence definition and an example. Open the searchable drawer from the header or press `/`.
- **Progress:** completed modules, first-try quiz answers, collected glossary terms and the theme are saved in `localStorage` only.
- **Dark mode:** the toggle is in the header. It defaults to the OS setting.
- **Intro:** a ~4-second animated intro plays the first time you open the home page each day. Click anywhere, press Esc, or use **Skip intro** to dismiss it. To replay it any time (handy for testing), open `#/intro` or use the **Replay intro** link in the sidebar or footer, or **Watch the 4-second intro** on the home page. It never plays on lesson pages, and it respects reduced-motion settings.
- **Type:** Geist (UI) and Instrument Serif (headings), bundled through Fontsource, so no network calls are needed.

## Project layout

```
src/
  lib/            pure finance math (no React): growth, debt, tax (2026 IRS figures), portfolio, housing
  data/           module metadata + glossary
  state/          progress (localStorage), theme, hash router
  components/     ModuleLayout (5-step shell), Sim (simulator shell/presets), Chart, SegmentBar,
                  Glossary (inline terms + drawer), DecisionCheck, CheatSheet, AppShell
  modules/        one file per module (lazy-loaded)
  pages/Home.tsx  course map + progress dashboard
```

## Assumptions & disclaimer

The simulations use simplified, illustrative assumptions: 2026 U.S. federal brackets and limits, flat state tax, constant returns, and no investment taxes in the rent-vs-buy model. It's an educational tool, not personalized financial, tax, or legal advice.
