import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, Menu, Moon, Sun, X, Check, RotateCcw, Play, Wallet } from 'lucide-react';
import { MODULES, type ModuleId } from '../data/modules';
import { TERM_IDS } from '../data/glossary';
import { useProgress } from '../state/progress';
import { useTheme } from '../state/theme';
import { homeHref, introHref, moduleHref, moneyHref, type Route } from '../state/router';
import { useGlossary } from './Glossary';
import { LogoMark, ProgressRing, cx } from './ui';

const pad = (n: number) => String(n).padStart(2, '0');

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [route]);

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lift">Skip to content</a>
      <Header onMenu={() => setMenuOpen(true)} route={route} />
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto lg:block">
          <Sidebar route={route} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <main id="main" className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
          <Footer />
        </div>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-[55] lg:hidden" role="dialog" aria-modal="true" aria-label="Course menu">
          <div className="fade-in absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="slide-in-left absolute inset-y-0 left-0 w-[85%] max-w-xs overflow-y-auto border-r border-line bg-page shadow-lift">
            <div className="flex h-16 items-center justify-between px-4">
              <span className="font-serif text-[22px] text-ink">Course map</span>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="grid size-9 cursor-pointer place-items-center rounded-full text-ink-2 hover:bg-surface-2"><X className="size-5" strokeWidth={1.75} /></button>
            </div>
            <Sidebar route={route} />
          </div>
        </div>
      )}
    </div>
  );
}

function Wordmark() {
  return (
    <a href={homeHref} className="flex items-center gap-2.5 rounded-full pr-2 text-ink" aria-label="Money Sandbox home">
      <span style={{ ['--logo-stroke' as string]: 'var(--primary-ink)', ['--logo-dot' as string]: 'var(--accent)' }}>
        <LogoMark className="size-8 text-primary" />
      </span>
      <span className="font-serif text-[21px] leading-none tracking-[-0.01em] sm:text-[23px]">Money <em className="text-accent-text">Sandbox</em></span>
    </a>
  );
}

function Header({ onMenu, route }: { onMenu: () => void; route: Route }) {
  const { theme, toggle } = useTheme();
  const { openDrawer } = useGlossary();
  const { glossary, completed } = useProgress();
  const collected = TERM_IDS.filter((t) => glossary[t]).length;
  const done = MODULES.filter((m) => completed[m.id]).length;

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-line bg-page/75 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-2 px-3 sm:px-5">
        <button type="button" onClick={onMenu} aria-label="Open course menu" className="grid size-9 cursor-pointer place-items-center rounded-full text-ink-2 hover:bg-surface-2 lg:hidden"><Menu className="size-5" strokeWidth={1.75} /></button>
        <Wordmark />
        <div className="ml-6 hidden items-center gap-2.5 md:flex" title="Modules completed">
          <ProgressRing value={done} max={MODULES.length} size={22} />
          <span className="tnum text-xs text-muted"><span className="font-medium text-ink">{done}</span> of {MODULES.length} complete</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <a href={moneyHref} aria-current={route.page === 'money' ? 'page' : undefined}
            className={cx('inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors', route.page === 'money' ? 'bg-primary text-primary-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink')}>
            <Wallet className="size-4" strokeWidth={1.75} aria-hidden />
            <span className="hidden sm:inline">My Money</span>
          </a>
          <button type="button" onClick={() => openDrawer()} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink" title="Open glossary (press /)">
            <BookOpen className="size-4" strokeWidth={1.75} aria-hidden />
            <span className="hidden sm:inline">Glossary</span>
            <span className="tnum hidden text-xs text-muted sm:inline">{collected}/{TERM_IDS.length}</span>
            <kbd className="hidden rounded-md border border-line-strong px-1.5 text-[10px] text-muted md:inline">/</kbd>
          </button>
          <button type="button" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="grid size-9 cursor-pointer place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
            {theme === 'dark' ? <Sun className="size-[18px]" strokeWidth={1.75} /> : <Moon className="size-[18px]" strokeWidth={1.75} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ route }: { route: Route }) {
  const { completed, visited, resetAll } = useProgress();
  const [confirm, setConfirm] = useState(false);
  const status = (id: ModuleId) => (completed[id] ? 'done' : visited[id] ? 'started' : 'new');
  const current = route.page === 'module' ? route.id : null;
  const onHome = route.page === 'home' || route.page === 'intro';

  return (
    <nav aria-label="Course modules" className="flex min-h-full flex-col px-4 py-6">
      <a href={homeHref} aria-current={onHome ? 'page' : undefined}
        className={cx('rounded-xl px-3 py-2 text-[13px] font-medium transition-colors', onHome ? 'bg-surface text-ink shadow-soft' : 'text-ink-2 hover:text-ink')}>
        Course map
      </a>
      <a href={moneyHref} aria-current={route.page === 'money' ? 'page' : undefined}
        className={cx('mt-0.5 flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-colors', route.page === 'money' ? 'bg-surface text-ink shadow-soft' : 'text-ink-2 hover:text-ink')}>
        My Money <Wallet className="size-3.5 text-muted" strokeWidth={1.75} aria-hidden />
      </a>
      {([1, 2] as const).map((tier) => (
        <div key={tier} className="mt-7">
          <p className="px-3 text-[10px] font-medium tracking-[0.18em] text-muted uppercase">{tier === 1 ? 'Foundations' : 'Building wealth'}</p>
          <ul className="mt-2 space-y-0.5">
            {MODULES.filter((m) => m.tier === tier).map((m) => {
              const st = status(m.id);
              const isCur = current === m.id;
              return (
                <li key={m.id}>
                  <a href={moduleHref(m.id)} aria-current={isCur ? 'page' : undefined}
                    className={cx('group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors', isCur ? 'bg-surface text-ink shadow-soft' : 'text-ink-2 hover:text-ink')}>
                    <span className={cx('tnum w-5 text-[11px]', isCur ? 'text-accent-text' : 'text-muted')}>{pad(m.num)}</span>
                    <span className={cx('flex-1 leading-snug', isCur && 'font-medium')}>{m.short}</span>
                    {st === 'done' ? (
                      <span className="grid size-4 place-items-center rounded-full bg-accent text-accent-ink" aria-label="Completed"><Check className="size-2.5" strokeWidth={3.5} /></span>
                    ) : st === 'started' ? (
                      <span className="size-1.5 rounded-full bg-accent" aria-label="In progress" />
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="mt-auto space-y-1 pt-10">
        <a href={introHref} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink">
          <Play className="size-3.5" strokeWidth={1.75} aria-hidden /> Replay intro
        </a>
        {confirm ? (
          <div className="rounded-xl border border-line bg-surface p-3 text-xs text-ink-2 shadow-soft">
            <p>Erase completed modules, quiz scores and collected terms in this browser?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { resetAll(); setConfirm(false); }} className="cursor-pointer rounded-full bg-critical px-3 py-1 font-medium text-white">Yes, reset</button>
              <button type="button" onClick={() => setConfirm(false)} className="cursor-pointer rounded-full px-3 py-1 font-medium hover:bg-surface-2">Keep it</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink">
            <RotateCcw className="size-3.5" strokeWidth={1.75} aria-hidden /> Reset my progress
          </button>
        )}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-line px-4 py-8 text-xs leading-relaxed text-muted sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="font-serif text-base text-ink-2">Money <em>Sandbox</em></span>
        <a href={introHref} className="inline-flex items-center gap-1.5 hover:text-ink"><Play className="size-3" strokeWidth={2} aria-hidden /> Replay intro</a>
        <span>Progress is saved only in this browser.</span>
      </div>
      <p className="mt-3 max-w-3xl">
        <span className="font-medium text-ink-2">Educational simulation only.</span> Money Sandbox teaches general ideas using simplified assumptions
        (for example, 2026 U.S. federal tax brackets and illustrative returns). It is not personalized financial, tax, investment, or legal advice,
        and past market behavior doesn't guarantee future results. For decisions about your own situation, consider a qualified professional.
      </p>
    </footer>
  );
}
