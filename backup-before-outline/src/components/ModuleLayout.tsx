import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Clock, CircleCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { MODULE_BY_ID, nextModule, prevModule, type ModuleId } from '../data/modules';
import { useProgress, quizScore } from '../state/progress';
import { moduleHref } from '../state/router';
import { DecisionCheck, type QuizQuestion } from './DecisionCheck';
import { CheatSheet, type Rule } from './CheatSheet';
import { Chip, cx } from './ui';

const STEPS = [
  { key: 'hook', nav: 'Hook', title: 'The Hook' },
  { key: 'concept', nav: 'Concept', title: 'The Concept' },
  { key: 'sandbox', nav: 'Sandbox', title: 'Sandbox' },
  { key: 'check', nav: 'Decision check', title: 'Decision Check' },
  { key: 'cheat', nav: 'Cheat sheet', title: 'Cheat Sheet' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];
const pad = (n: number) => String(n).padStart(2, '0');

export function ModuleLayout({ id, hook, concept, sandbox, questions, rules }: {
  id: ModuleId;
  hook: ReactNode;
  concept: ReactNode;
  sandbox: ReactNode;
  questions: QuizQuestion[];
  rules: Rule[];
}) {
  const meta = MODULE_BY_ID[id];
  const { markVisited, isComplete, quiz } = useProgress();
  const [active, setActive] = useState<StepKey>('hook');
  const done = isComplete(id);
  const score = quizScore(quiz[id]);
  const prev = prevModule(id), next = nextModule(id);

  useEffect(() => { markVisited(id); }, [id, markVisited]);

  // Scrollspy: the active step is the last section whose top has passed ~35% of the viewport.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current: StepKey = STEPS[0].key;
      for (const s of STEPS) {
        const el = document.getElementById('step-' + s.key);
        if (el && el.getBoundingClientRect().top <= line) current = s.key;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atBottom ? STEPS[STEPS.length - 1].key : current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, [id]);

  // Light, one-time reveal: section headers and each block inside a section fade up as they enter the viewport.
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = [
      ...Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]')),
      ...Array.from(el.querySelectorAll<HTMLElement>('.reveal-group > *')),
    ];
    const vh = window.innerHeight;
    const pending = targets.filter((t) => t.getBoundingClientRect().top > vh * 0.92);
    pending.forEach((t) => t.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      const shown = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      shown.forEach((e, i) => {
        const t = e.target as HTMLElement;
        io.unobserve(t);
        t.style.transitionDelay = Math.min(i, 5) * 70 + 'ms';
        t.classList.add('is-visible');
        window.setTimeout(() => { t.classList.remove('reveal', 'is-visible'); t.style.transitionDelay = ''; }, 1100 + i * 70);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    pending.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [id]);

  // Keep the active pill visible in the horizontally scrolling step bar (small screens).
  const navList = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = navList.current;
    const pill = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!list || !pill) return;
    list.scrollTo({ left: pill.offsetLeft - list.clientWidth / 2 + pill.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  const content: Record<StepKey, ReactNode> = {
    hook: (
      <div data-reveal className="relative overflow-hidden rounded-3xl border border-line bg-surface px-7 py-9 shadow-soft sm:px-12 sm:py-12">
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-accent-soft blur-3xl" />
        <div className="relative max-w-3xl font-serif text-[25px] leading-[1.38] text-ink sm:text-[31px] [&_em]:italic [&_strong]:font-normal [&_strong]:text-accent-text">{hook}</div>
      </div>
    ),
    concept: <div className="reveal-group space-y-6">{concept}</div>,
    sandbox: <div className="reveal-group space-y-6">{sandbox}</div>,
    check: <DecisionCheck moduleId={id} questions={questions} />,
    cheat: <CheatSheet moduleId={id} rules={rules} />,
  };

  return (
    <article ref={root} className="mx-auto max-w-5xl">
      <header className="relative pt-4 pb-10 sm:pt-8">
        <span aria-hidden className="pointer-events-none absolute -top-4 right-0 hidden font-serif text-[200px] leading-none text-ink/[0.04] select-none lg:block">{pad(meta.num)}</span>
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
          Module {pad(meta.num)} <span className="mx-1.5 text-line-strong">/</span> {meta.tier === 1 ? 'Foundations' : 'Building wealth'}
        </p>
        <h1 className="relative mt-4 max-w-3xl font-serif text-[42px] leading-[1.04] tracking-[-0.02em] text-ink sm:text-[58px]">{meta.title}</h1>
        <p className="relative mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">{meta.blurb}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip><Clock className="size-3" strokeWidth={2} aria-hidden /> About {meta.minutes} min</Chip>
          {done && <Chip tone="good"><CircleCheck className="size-3" strokeWidth={2} aria-hidden /> Completed</Chip>}
          {score.answered > 0 && <Chip tone="accent">Decision check: {score.correct}/{questions.length}</Chip>}
        </div>
      </header>

      <nav aria-label="Module steps" className="sticky top-16 z-30 -mx-4 mb-12 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div aria-hidden className="absolute inset-0 border-b border-line bg-page/80 backdrop-blur-xl" />
        <ol ref={navList} className="relative flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {STEPS.map((s, i) => (
            <li key={s.key} className="shrink-0">
              <a
                href={'#step-' + s.key}
                onClick={(e) => { e.preventDefault(); document.getElementById('step-' + s.key)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                aria-current={active === s.key ? 'step' : undefined}
                className={cx('inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap',
                  active === s.key ? 'bg-primary text-primary-ink' : 'text-muted hover:bg-surface-2 hover:text-ink')}
              >
                <span className={cx('tnum text-[11px]', active === s.key ? 'opacity-60' : 'opacity-70')}>{pad(i + 1)}</span>
                {s.nav}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-20">
        {STEPS.map((s, i) => (
          <section key={s.key} id={'step-' + s.key} className="scroll-mt-36" aria-labelledby={'h-' + s.key}>
            <div data-reveal className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-3 text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
                  <span className="tnum">Step {pad(i + 1)}</span>
                  <span aria-hidden className="reveal-line h-px w-8 bg-line-strong" />
                  <span>{s.key === 'sandbox' ? 'Interactive sandbox' : s.key === 'hook' ? 'A real-life moment' : s.key === 'concept' ? 'Plain English first' : s.key === 'check' ? 'Practice' : 'Remember'}</span>
                </p>
                <h2 id={'h-' + s.key} className="mt-2 font-serif text-[34px] leading-tight text-ink">{s.key === 'sandbox' ? 'Try it yourself' : s.title}</h2>
              </div>
            </div>
            {content[s.key]}
          </section>
        ))}
      </div>

      <nav aria-label="Module navigation" className="mt-20 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
        {prev ? (
          <a href={moduleHref(prev.id)} className="group rounded-2xl border border-line bg-surface p-5 shadow-soft transition-colors hover:border-line-strong">
            <p className="flex items-center gap-1.5 text-xs text-muted"><ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden /> Previous</p>
            <p className="mt-1 font-medium text-ink">{pad(prev.num)} · {prev.short}</p>
          </a>
        ) : <span />}
        {next && (
          <a href={moduleHref(next.id)} className="group rounded-2xl border border-line bg-surface p-5 text-right shadow-soft transition-colors hover:border-line-strong">
            <p className="flex items-center justify-end gap-1.5 text-xs text-muted">Next <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></p>
            <p className="mt-1 font-medium text-ink">{pad(next.num)} · {next.short}</p>
          </a>
        )}
      </nav>
    </article>
  );
}
