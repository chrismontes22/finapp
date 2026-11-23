import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Clock, CircleCheck, ArrowLeft, ArrowRight, ListChecks } from 'lucide-react';
import { CHAPTER_BY_ID, COURSE_MODULES, nextChapter, prevChapter, pad2, type ChapterId } from '../data/course';
import { useProgress, quizScore } from '../state/progress';
import { chapterHref, sectionFromHash } from '../state/router';
import { DecisionCheck, type QuizQuestion } from './DecisionCheck';
import { CheatSheet, type Rule } from './CheatSheet';
import { Chip, cx } from './ui';

const domId = (key: string) => 'sec-' + key;

/** Bullet list that opens every chapter. */
export function KeyPoints({ items, title = 'Key points' }: { items: ReactNode[]; title?: string }) {
  return (
    <aside data-reveal aria-label={title} className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
      <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-accent-text uppercase">
        <ListChecks className="size-4" strokeWidth={1.75} aria-hidden /> {title}
      </p>
      <ul className={cx('mt-4 grid gap-x-10 gap-y-3', items.length > 4 && 'lg:grid-cols-2')}>
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-[16px] leading-relaxed text-ink">
            <span className="mt-[10px] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Number, title and the one-sentence summary that starts every subchapter. */
function SectionHeader({ num, title, summary }: { num: string; title: string; summary: string }) {
  return (
    <div data-reveal className="mb-8">
      <p className="flex items-center gap-3 text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
        <span className="tnum">Section {num}</span>
        <span aria-hidden className="reveal-line h-px w-8 bg-line-strong" />
      </p>
      <h2 className="mt-2 font-serif text-[34px] leading-tight text-ink sm:text-[40px]">{title}</h2>
      <p className="relative mt-5 max-w-3xl rounded-2xl bg-accent-soft/70 py-4 pr-5 pl-6 text-[18px] leading-snug font-medium text-ink sm:text-[19px]">
        <span aria-hidden className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-accent" />
        <span className="sr-only">Summary: </span>{summary}
      </p>
    </div>
  );
}

function PlainHeader({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <div data-reveal className="mb-6">
      <p className="flex items-center gap-3 text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
        <span>{eyebrow}</span>
        <span aria-hidden className="reveal-line h-px w-8 bg-line-strong" />
      </p>
      <h2 id={id} className="mt-2 font-serif text-[34px] leading-tight text-ink">{title}</h2>
    </div>
  );
}

export function ChapterLayout({ id, sections, questions, rules }: {
  id: ChapterId;
  /** Body of each subchapter, keyed by section id ("1-1", "1-2", ...). Title and summary come from data/course.ts. */
  sections: Record<string, ReactNode>;
  questions: QuizQuestion[];
  rules: Rule[];
}) {
  const meta = CHAPTER_BY_ID[id];
  const mod = COURSE_MODULES.find((m) => m.num === meta.module);
  const { markVisited, isComplete, quiz } = useProgress();
  const steps = [
    ...meta.sections.map((s) => ({ key: s.id, nav: s.num + ' ' + s.short })),
    { key: 'practice', nav: 'Practice' },
    { key: 'cheat', nav: 'Cheat sheet' },
  ];
  const [active, setActive] = useState(steps[0].key);
  const done = isComplete(id);
  const score = quizScore(quiz[id]);
  const prev = prevChapter(id), next = nextChapter(id);

  if (import.meta.env.DEV) {
    const missing = meta.sections.filter((s) => !(s.id in sections)).map((s) => s.num);
    if (missing.length) console.warn('Chapter', id, 'has no content for sections', missing.join(', '));
  }

  useEffect(() => { markVisited(id); }, [id, markVisited]);

  // Deep links like #/c/cash-flow/1-2 scroll to that subchapter, on load and on later hash changes.
  useEffect(() => {
    const go = (smooth: boolean) => {
      const s = sectionFromHash(window.location.hash);
      if (!s) return;
      requestAnimationFrame(() => document.getElementById(domId(s))?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' as ScrollBehavior, block: 'start' }));
    };
    go(false);
    const on = () => go(true);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, [id]);

  // Scrollspy: the active step is the last section whose top has passed ~35% of the viewport.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current = steps[0].key;
      for (const s of steps) {
        const el = document.getElementById(domId(s.key));
        if (el && el.getBoundingClientRect().top <= line) current = s.key;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atBottom ? steps[steps.length - 1].key : current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Light, one-time reveal: headers and each block inside a section fade up as they enter the viewport.
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

  // Keep the active pill visible in the horizontally scrolling section bar.
  const navList = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = navList.current;
    const pill = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!list || !pill) return;
    list.scrollTo({ left: pill.offsetLeft - list.clientWidth / 2 + pill.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  return (
    <article ref={root} className="mx-auto max-w-5xl">
      <header className="relative pt-4 pb-8 sm:pt-8">
        <span aria-hidden className="pointer-events-none absolute -top-4 right-0 hidden font-serif text-[200px] leading-none text-ink/[0.04] select-none lg:block">{pad2(meta.num)}</span>
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
          Module {pad2(meta.module)}{mod ? ' · ' + mod.title : ''} <span className="mx-1.5 text-line-strong">/</span> Chapter {pad2(meta.num)}
        </p>
        <h1 className="relative mt-4 max-w-3xl font-serif text-[40px] leading-[1.04] tracking-[-0.02em] text-ink sm:text-[54px]">{meta.title}</h1>
        <p className="relative mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">{meta.blurb}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip><Clock className="size-3" strokeWidth={2} aria-hidden /> About {meta.minutes} min</Chip>
          <Chip>{meta.sections.length} sections</Chip>
          {done && <Chip tone="good"><CircleCheck className="size-3" strokeWidth={2} aria-hidden /> Completed</Chip>}
          {score.answered > 0 && <Chip tone="accent">Decision check: {score.correct}/{questions.length}</Chip>}
        </div>
      </header>

      <KeyPoints items={meta.keyPoints} />

      <nav aria-label="Chapter sections" className="sticky top-16 z-30 -mx-4 mt-10 mb-12 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div aria-hidden className="absolute inset-0 border-b border-line bg-page/80 backdrop-blur-xl" />
        <ol ref={navList} className="relative flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {steps.map((s) => (
            <li key={s.key} className="shrink-0">
              <a
                href={chapterHref(id, s.key)}
                onClick={(e) => { e.preventDefault(); document.getElementById(domId(s.key))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                aria-current={active === s.key ? 'step' : undefined}
                className={cx('inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap',
                  active === s.key ? 'bg-primary text-primary-ink' : 'text-muted hover:bg-surface-2 hover:text-ink')}
              >
                {s.nav}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-24">
        {meta.sections.map((s) => (
          <section key={s.id} id={domId(s.id)} className="scroll-mt-36" aria-label={s.num + ' ' + s.title}>
            <SectionHeader num={s.num} title={s.title} summary={s.summary} />
            <div className="reveal-group space-y-6">{sections[s.id]}</div>
          </section>
        ))}
        <section id={domId('practice')} className="scroll-mt-36" aria-labelledby="h-practice">
          <PlainHeader eyebrow="Practice" title="Decision check" id="h-practice" />
          <DecisionCheck chapterId={id} questions={questions} />
        </section>
        <section id={domId('cheat')} className="scroll-mt-36" aria-labelledby="h-cheat">
          <PlainHeader eyebrow="Remember" title="Cheat sheet" id="h-cheat" />
          <CheatSheet chapterId={id} rules={rules} />
        </section>
      </div>

      <nav aria-label="Chapter navigation" className="mt-20 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
        {prev ? (
          <a href={chapterHref(prev.id)} className="group rounded-2xl border border-line bg-surface p-5 shadow-soft transition-colors hover:border-line-strong">
            <p className="flex items-center gap-1.5 text-xs text-muted"><ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden /> Previous chapter</p>
            <p className="mt-1 font-medium text-ink">{pad2(prev.num)} · {prev.short}</p>
          </a>
        ) : <span />}
        {next && (
          <a href={chapterHref(next.id)} className="group rounded-2xl border border-line bg-surface p-5 text-right shadow-soft transition-colors hover:border-line-strong">
            <p className="flex items-center justify-end gap-1.5 text-xs text-muted">Next chapter <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></p>
            <p className="mt-1 font-medium text-ink">{pad2(next.num)} · {next.short}</p>
          </a>
        )}
      </nav>
    </article>
  );
}
