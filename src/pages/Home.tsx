import { ArrowRight, ArrowUpRight, BookOpen, Check, Play, Lock } from 'lucide-react';
import { CHAPTERS, COURSE_MODULES, chaptersInModule, pad2 } from '../data/course';
import { TERM_IDS } from '../data/glossary';
import { quizScore, useProgress } from '../state/progress';
import { chapterHref, introHref, moneyHref } from '../state/router';
import { useMoney } from '../state/money';
import { useGlossary } from '../components/Glossary';
import { LinkButton, ProgressRing, cx } from '../components/ui';
import { KeyPoints } from '../components/ChapterLayout';

const delay = (ms: number) => ({ animationDelay: ms + 'ms' });

/** Decorative growth curve echoing the intro: one point per chapter on a compounding line. */
function HeroArt() {
  const W = 420, H = 300, k = 2.4;
  const pts = Array.from({ length: 61 }, (_, i) => {
    const t = i / 60;
    return [24 + (W - 48) * t, H - 40 - (H - 90) * ((Math.exp(k * t) - 1) / (Math.exp(k) - 1))] as const;
  });
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const dots = CHAPTERS.map((m, i) => ({ m, p: pts[Math.round(((i + 0.5) / CHAPTERS.length) * 60)] }));
  return (
    <div className="rise-in relative hidden overflow-hidden rounded-[28px] border border-line bg-surface shadow-lift lg:block" style={delay(250)} aria-hidden>
      <div className="absolute inset-0 [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(ellipse_at_center,#000_40%,transparent_80%)]" />
      <div className="relative flex items-center justify-between px-6 pt-5">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Your path</p>
        <p className="tnum text-[11px] text-muted">{CHAPTERS.length} chapters</p>
      </div>
      <svg viewBox={'0 0 ' + W + ' ' + H} className="relative w-full">
        <defs>
          <linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={d + ' L ' + (W - 24) + ' ' + H + ' L 24 ' + H + ' Z'} fill="url(#hero-fill)" />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" pathLength={1} className="intro-path" style={{ animationDelay: '400ms', animationDuration: '1800ms' }} />
        {dots.map(({ m, p }, i) => (
          <g key={m.id}>
            <circle cx={p[0]} cy={p[1]} r="4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" className="intro-dot" style={{ animationDelay: 500 + i * 160 + 'ms' }} />
            <text x={p[0]} y={p[1] - 12} textAnchor="middle" fontSize="10" fill="var(--muted)" className="intro-label tnum" style={{ animationDelay: 560 + i * 160 + 'ms' }}>{pad2(m.num)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function Home() {
  const { completed, visited, quiz, glossary, lastChapter } = useProgress();
  const { openDrawer } = useGlossary();
  const done = CHAPTERS.filter((m) => completed[m.id]).length;
  const totals = CHAPTERS.reduce((acc, m) => { const s = quizScore(quiz[m.id]); return { a: acc.a + s.answered, c: acc.c + s.correct }; }, { a: 0, c: 0 });
  const collected = TERM_IDS.filter((t) => glossary[t]).length;
  const resume = lastChapter && !completed[lastChapter] ? CHAPTERS.find((m) => m.id === lastChapter) : CHAPTERS.find((m) => !completed[m.id]);
  const started = Object.keys(visited).length > 0;
  const money = useMoney();

  return (
    <div className="mx-auto max-w-5xl">
      <section className="grid items-center gap-10 pt-6 pb-16 lg:grid-cols-[1.15fr_1fr] lg:pt-12">
        <div>
          <p className="rise-in text-[11px] font-medium tracking-[0.18em] text-muted uppercase" style={delay(0)}>Module 1 · {COURSE_MODULES[0].title} · {CHAPTERS.length} chapters</p>
          <h1 className="rise-in mt-5 font-serif text-[54px] leading-[0.98] tracking-[-0.025em] text-ink sm:text-[76px]" style={delay(80)}>
            Build wealth, <br className="hidden sm:block" /><em className="text-accent-text">step by step.</em>
          </h1>
          <p className="rise-in mt-6 max-w-lg text-lg leading-relaxed text-ink-2" style={delay(160)}>
            Keep more of what you earn, get out of debt, invest, and protect what you build. Every chapter starts with key points, explains each chart, and lets you try the ideas with sliders.
          </p>
          <div className="rise-in mt-8 flex flex-wrap items-center gap-3" style={delay(240)}>
            {resume ? (
              <LinkButton href={chapterHref(resume.id)} size="lg" iconRight={ArrowRight}>
                {started ? 'Continue with ' + resume.short : 'Start chapter 1'}
              </LinkButton>
            ) : (
              <LinkButton href={chapterHref('cash-flow')} size="lg" iconRight={ArrowRight}>Review from the start</LinkButton>
            )}
            <button type="button" onClick={() => openDrawer()} className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-6 text-[15px] font-medium text-ink shadow-soft transition-colors hover:bg-surface-2">
              <BookOpen className="size-4" strokeWidth={1.75} aria-hidden /> Glossary
            </button>
          </div>
          <a href={introHref} className="rise-in mt-6 inline-flex items-center gap-2 text-[13px] text-muted transition-colors hover:text-ink" style={delay(320)}>
            <span className="grid size-6 place-items-center rounded-full border border-line-strong"><Play className="size-2.5 translate-x-px" fill="currentColor" aria-hidden /></span>
            Watch the 4-second intro
          </a>
        </div>
        <HeroArt />
      </section>

      <section aria-label="Your progress" className="rise-in grid gap-px overflow-hidden rounded-3xl border border-line bg-line shadow-soft sm:grid-cols-3" style={delay(360)}>
        {[
          { k: 'Chapters complete', v: done, of: CHAPTERS.length },
          { k: 'Decision checks right', v: totals.c, of: totals.a, sub: totals.a === 0 ? 'Scenarios come at the end of each chapter.' : 'Counted on your first try.' },
          { k: 'Glossary terms collected', v: collected, of: TERM_IDS.length },
        ].map((s) => (
          <div key={s.k} className="flex items-center gap-4 bg-surface px-6 py-5">
            <ProgressRing value={s.v} max={Math.max(1, s.of)} size={40} />
            <div>
              <p className="text-xs text-muted">{s.k}</p>
              <p className="tnum mt-0.5 text-xl font-semibold tracking-[-0.02em] text-ink">{s.v}<span className="text-sm font-normal text-muted"> / {s.of}</span></p>
              {s.sub && <p className="mt-0.5 text-[11px] text-muted">{s.sub}</p>}
            </div>
          </div>
        ))}
      </section>

      <a href={moneyHref} className="rise-in group mt-6 flex flex-col gap-4 overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-soft transition-colors hover:border-line-strong sm:flex-row sm:items-center sm:p-7" style={delay(420)}>
        <div className="flex-1">
          <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-muted uppercase"><Lock className="size-3" strokeWidth={2} aria-hidden /> Private · stays on this device</p>
          <p className="mt-2 font-serif text-[30px] leading-tight text-ink">My <em className="text-accent-text">Money</em>: track your real numbers</p>
          <p className="mt-1 max-w-xl text-sm text-ink-2">
            {money.summary.hasAnything
              ? 'Net worth ' + money.summary.netWorth.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) + ' · ' + money.data.goals.length + ' goal' + (money.data.goals.length === 1 ? '' : 's') + ' · ' + money.data.checkins.length + ' check-in' + (money.data.checkins.length === 1 ? '' : 's') + '. Pick up where you left off.'
              : 'Add your budget, accounts, debts and goals. Get a health check, a debt-free date and a monthly net-worth trend.'}
          </p>
        </div>
        <span className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-primary px-5 text-sm font-medium text-primary-ink sm:self-center">
          {money.summary.hasAnything ? 'Open dashboard' : 'Set it up'} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </a>

      {COURSE_MODULES.map((mod) => (
        <section key={mod.num} aria-labelledby={'module-' + mod.num} className="mt-20 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] text-muted uppercase">Module {mod.num}</p>
              <h2 id={'module-' + mod.num} className="mt-2 font-serif text-[38px] leading-tight text-ink">{mod.title}</h2>
            </div>
            <p className="max-w-sm text-sm text-ink-2">{mod.blurb} {mod.audience}</p>
          </div>
          <KeyPoints items={mod.keyPoints} title={'Module ' + mod.num + ' key points'} />
          <ul className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
            {chaptersInModule(mod.num).map((m) => {
              const s = quizScore(quiz[m.id]);
              const isDone = Boolean(completed[m.id]);
              return (
                <li key={m.id} className="border-b border-line last:border-b-0">
                  <a href={chapterHref(m.id)} className="group grid grid-cols-[auto_1fr_auto] items-start gap-5 px-5 py-6 transition-colors hover:bg-surface-2/60 sm:px-7">
                    <span className="w-12 font-serif text-[40px] leading-none text-ink/25 transition-colors group-hover:text-accent-text sm:w-14">{pad2(m.num)}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[17px] font-medium tracking-[-0.01em] text-ink">{m.title}</h3>
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-text"><Check className="size-3" strokeWidth={3} aria-hidden /> Complete</span>
                        ) : visited[m.id] ? (
                          <span className="rounded-full border border-line-strong px-2 py-0.5 text-[11px] font-medium text-ink-2">In progress</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-2">{m.blurb}</p>
                      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
                        {m.sections.map((sec) => (
                          <li key={sec.id}><span className="tnum text-muted">{sec.num}</span> {sec.title}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-muted">{m.minutes} min · {m.sections.length} sections{s.answered > 0 ? ' · Decision check ' + s.correct + '/' + m.quizCount : ''}</p>
                    </div>
                    <span className={cx('grid size-10 place-items-center rounded-full border border-line-strong text-ink-2 transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-ink')}>
                      <ArrowUpRight className="size-4" strokeWidth={1.75} aria-hidden />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section aria-labelledby="how" className="mt-20">
        <p className="text-[11px] font-medium tracking-[0.18em] text-muted uppercase">How each chapter works</p>
        <h2 id="how" className="mt-2 font-serif text-[38px] leading-tight text-ink">Five parts, in the same order</h2>
        <ol className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-line bg-line shadow-soft sm:grid-cols-5">
          {[
            { t: 'Key points', d: 'A short bullet list of what the chapter covers.' },
            { t: 'One-sentence summaries', d: 'Every section opens with its main idea in a single sentence.' },
            { t: 'Charts & diagrams', d: 'Each picture explains how to read it and what it shows.' },
            { t: 'Sliders', d: 'Try the ideas with your own numbers and watch the results change.' },
            { t: 'Practice & cheat sheet', d: 'Scenarios that explain every answer, then three rules to keep.' },
          ].map((s, i) => (
            <li key={s.t} className="bg-surface p-5">
              <span className="tnum font-serif text-[28px] leading-none text-ink/25">{pad2(i + 1)}</span>
              <p className="mt-4 text-sm font-medium text-ink">{s.t}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
