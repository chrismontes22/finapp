import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import { Sigma, Sparkles, ChevronDown, Telescope, X, type LucideIcon } from 'lucide-react';
import { Disclosure, cx } from './ui';

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-[16px] leading-[1.75] text-ink-2', className)}>{children}</p>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="max-w-3xl text-xl leading-relaxed tracking-[-0.01em] text-ink">{children}</p>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="pt-6 font-serif text-[26px] leading-tight text-ink">{children}</h3>;
}

/** The everyday analogy that comes before any jargon. */
export function Analogy({ title = 'Think of it like this', icon: Icon = Sparkles, children }: { title?: string; icon?: LucideIcon; children: ReactNode }) {
  return (
    <aside className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-6 shadow-soft sm:px-8">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-accent-soft blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute top-1 left-5 font-serif text-[88px] leading-none text-accent/25 select-none">&ldquo;</span>
      <p className="relative flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-accent-text uppercase">
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden /> {title}
      </p>
      <div className="relative mt-3 font-serif text-[22px] leading-snug text-ink sm:text-[24px]">{children}</div>
    </aside>
  );
}

export function MythBuster({ myth, children }: { myth: ReactNode; children: ReactNode }) {
  return (
    <aside className="grid overflow-hidden rounded-3xl border border-line bg-surface shadow-soft sm:grid-cols-2">
      <div className="border-b border-line p-6 sm:border-r sm:border-b-0">
        <p className="text-[11px] font-medium tracking-[0.14em] text-critical-text uppercase">The myth</p>
        <p className="mt-3 font-serif text-[22px] leading-snug text-ink-2 line-through decoration-[color:var(--critical)]/50 decoration-1">{myth}</p>
      </div>
      <div className="bg-accent-soft/60 p-6">
        <p className="text-[11px] font-medium tracking-[0.14em] text-accent-text uppercase">The reality</p>
        <div className="mt-3 text-[15px] leading-relaxed text-ink">{children}</div>
      </div>
    </aside>
  );
}

/** Formal formulas and deeper rules, collapsed by default. */
export function UnderTheHood({ title = 'Under the Hood (Math)', children }: { title?: string; children: ReactNode }) {
  return (
    <Disclosure title={title} icon={Sigma} tone="math">
      <div className="space-y-3">{children}</div>
    </Disclosure>
  );
}

export function Formula({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="overflow-x-auto font-mono text-[13px] text-ink">{children}</div>
      {note && <p className="mt-1.5 text-xs leading-relaxed text-muted">{note}</p>}
    </div>
  );
}

export interface ConceptCardSpec { icon: LucideIcon; title: string; body: ReactNode; }

export function ConceptCards({ items, cols = 2 }: { items: ConceptCardSpec[]; cols?: 2 | 3 }) {
  return (
    <div className={cx('grid gap-px overflow-hidden rounded-3xl border border-line bg-line shadow-soft', cols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2')}>
      {items.map(({ icon: Icon, title, body }) => (
        <div key={title} className="bg-surface p-5 sm:p-6">
          <span className="grid size-9 place-items-center rounded-full border border-line text-ink"><Icon className="size-4" strokeWidth={1.6} aria-hidden /></span>
          <p className="mt-4 font-medium tracking-[-0.01em] text-ink">{title}</p>
          <div className="mt-1.5 text-sm leading-relaxed text-ink-2">{body}</div>
        </div>
      ))}
    </div>
  );
}

export function Compare({ left, right }: { left: { title: string; body: ReactNode }; right: { title: string; body: ReactNode } }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line shadow-soft sm:grid-cols-2">
      {[left, right].map((s) => (
        <div key={s.title} className="bg-surface p-5 sm:p-6">
          <p className="font-medium tracking-[-0.01em] text-ink">{s.title}</p>
          <div className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.body}</div>
        </div>
      ))}
    </div>
  );
}

export function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="relative space-y-5 pl-1">
      <span aria-hidden className="absolute top-3 bottom-3 left-[15px] w-px bg-line-strong" />
      {items.map((s, i) => (
        <li key={s.title} className="relative flex gap-4">
          <span className="relative z-10 grid size-[30px] shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-xs font-semibold text-ink">{i + 1}</span>
          <div className="pt-1">
            <p className="font-medium text-ink">{s.title}</p>
            <div className="mt-0.5 text-sm leading-relaxed text-ink-2">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Optional extra detail, collapsed by default, so the main path stays simple. */
export function GoDeeper({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={cx('rounded-2xl border transition-colors duration-200', open ? 'border-line-strong bg-surface shadow-soft' : 'border-line bg-surface/60 hover:bg-surface')}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left">
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-accent-text"><Telescope className="size-4" strokeWidth={1.6} aria-hidden /></span>
        <span className="flex-1">
          <span className="block text-[10px] font-medium tracking-[0.16em] text-muted uppercase">Go deeper</span>
          <span className="mt-0.5 block text-[15px] font-medium tracking-[-0.01em] text-ink">{title}</span>
        </span>
        <ChevronDown className={cx('size-4 text-muted transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.75} aria-hidden />
      </button>
      {open && (
        <div id={id} className="fade-in space-y-3 border-t border-line px-5 py-5 text-[15px] leading-relaxed text-ink-2 [&_strong]:text-ink">
          {children}
        </div>
      )}
    </div>
  );
}

/** A tidy bullet list for use inside GoDeeper or concept text. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/** A worked example with real numbers. */
export function Example({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-2xl border border-line bg-surface p-5 shadow-soft sm:p-6">
      <p className="text-[10px] font-medium tracking-[0.16em] text-accent-text uppercase">Worked example</p>
      <p className="mt-1.5 font-serif text-[22px] leading-snug text-ink">{title}</p>
      <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-2 [&_strong]:text-ink">{children}</div>
    </aside>
  );
}

/** Friendly list of easy-to-make mistakes. */
export function Mistakes({ items, title = 'Easy mistakes to avoid' }: { items: ReactNode[]; title?: string }) {
  return (
    <aside className="rounded-2xl border border-line bg-surface-2/50 p-5 sm:p-6">
      <p className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-2 [&_strong]:text-ink">
            <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-warning-soft text-warning-text"><X className="size-3" strokeWidth={2.5} aria-hidden /></span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
