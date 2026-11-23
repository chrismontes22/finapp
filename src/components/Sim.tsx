import { useCallback, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { RotateCcw, FlaskConical, CircleCheck, TriangleAlert, OctagonAlert, Info, Lightbulb, Check, type LucideIcon } from 'lucide-react';
import { cx } from './ui';

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export interface SimApi<T> {
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  set: <K extends keyof T>(key: K) => (value: T[K]) => void;
  reset: () => void;
  apply: (values: Partial<T>) => void;
  isActive: (values: Partial<T>) => boolean;
  isDefault: boolean;
}

/** State for a simulator, with "reset to default" and preset support. */
export function useSim<T extends object>(defaults: T): SimApi<T> {
  const [state, setState] = useState<T>(defaults);
  const set = useCallback(<K extends keyof T>(key: K) => (value: T[K]) => setState((s) => ({ ...s, [key]: value })), []);
  const reset = useCallback(() => setState(defaults), [defaults]);
  const apply = useCallback((values: Partial<T>) => setState({ ...defaults, ...values }), [defaults]);
  const isActive = useCallback((values: Partial<T>) => same(state, { ...defaults, ...values }), [state, defaults]);
  const isDefault = useMemo(() => same(state, defaults), [state, defaults]);
  return { state, setState, set, reset, apply, isActive, isDefault };
}

export interface Preset<T> {
  label: string;
  hint?: string;
  values: Partial<T>;
}

export interface TryThis<T> { label: ReactNode; done: (state: T) => boolean; }

/** A short, concrete guide shown at the top of a simulator. */
export interface SimGuide<T> {
  /** Exactly three short steps, e.g. ["Set your take-home pay", "Split it with the sliders", "Aim for $0 left over"]. */
  how?: ReactNode[];
  /** Two or three small experiments; each ticks itself off when the state satisfies `done`. */
  tryThis?: TryThis<T>[];
}

const DEFAULT_HOW: ReactNode[] = ['Pick a scenario, or keep the default numbers.', 'Drag a slider, or type an exact number.', 'Watch the chart and the tips update.'];

function GuidePanel<T>({ guide, state }: { guide: SimGuide<T>; state: T }) {
  const tries = guide.tryThis ?? [];
  const [achieved, setAchieved] = useState<boolean[]>(() => tries.map(() => false));
  useEffect(() => {
    setAchieved((prev) => {
      let changed = false;
      const next = tries.map((t, i) => {
        const v = prev[i] || safeDone(t, state);
        if (v !== prev[i]) changed = true;
        return v;
      });
      return changed ? next : prev;
    });
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const how = guide.how ?? DEFAULT_HOW;
  const count = achieved.filter(Boolean).length;
  return (
    <div className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-[1fr_1.15fr]">
      <div className="bg-surface-2/50 p-4">
        <p className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">How to use it</p>
        <ol className="mt-2.5 space-y-2">
          {how.map((h, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-snug text-ink-2">
              <span className="tnum grid size-5 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-[10px] font-semibold text-ink">{i + 1}</span>
              <span className="pt-0.5">{h}</span>
            </li>
          ))}
        </ol>
      </div>
      {tries.length > 0 && (
        <div className="bg-surface-2/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">Try this</p>
            <p className="tnum text-[11px] text-muted" aria-live="polite">{count}/{tries.length} tried</p>
          </div>
          <ul className="mt-2.5 space-y-2">
            {tries.map((t, i) => (
              <li key={i} className={cx('flex gap-2.5 text-[13px] leading-snug transition-colors duration-300', achieved[i] ? 'text-ink' : 'text-ink-2')}>
                <span className={cx('grid size-5 shrink-0 place-items-center rounded-full border transition-all duration-300', achieved[i] ? 'celebrate border-transparent bg-accent text-accent-ink' : 'border-line-strong bg-surface')}>
                  {achieved[i] && <Check className="size-3" strokeWidth={3} aria-label="Done" />}
                </span>
                <span className={cx('pt-0.5', achieved[i] && 'line-through decoration-ink/25')}>{t.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function safeDone<T>(t: TryThis<T>, s: T): boolean {
  try { return Boolean(t.done(s)); } catch { return false; }
}

export function SimCard<T>({ title, subtitle, icon: Icon = FlaskConical, sim, presets, children, kind = 'Interactive sandbox', className, guide }: {
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  sim: SimApi<T>;
  presets: Preset<T>[];
  children: ReactNode;
  kind?: string;
  className?: string;
  guide?: SimGuide<T>;
}) {
  return (
    <section aria-label={title} className={cx('overflow-hidden rounded-3xl border border-line bg-surface shadow-soft', className)}>
      <header className="px-5 pt-6 pb-5 sm:px-7">
        <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
          <Icon className="size-3.5" strokeWidth={1.75} aria-hidden /> {kind}
        </p>
        <h3 className="mt-2 font-serif text-[28px] leading-tight text-ink">{title}</h3>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-2">{subtitle}</p>}
        {guide && <GuidePanel guide={guide} state={sim.state} />}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Scenarios</span>
          {presets.map((p) => {
            const active = sim.isActive(p.values);
            return (
              <button
                key={p.label}
                type="button"
                title={p.hint}
                aria-pressed={active}
                onClick={() => sim.apply(p.values)}
                className={cx(
                  'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 active:scale-[0.97]',
                  active ? 'border-primary bg-primary text-primary-ink' : 'border-line-strong bg-surface text-ink-2 hover:border-ink/40 hover:text-ink',
                )}
              >
                {p.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={sim.reset}
            disabled={sim.isDefault}
            className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:text-muted"
          >
            <RotateCcw className="size-3.5" strokeWidth={1.75} aria-hidden /> Reset to default
          </button>
        </div>
      </header>
      <div className="border-t border-line px-5 py-6 sm:px-7">{children}</div>
    </section>
  );
}

/** Controls on the left, outputs on the right (stacks on small screens). */
export function SimGrid({ controls, children, wideControls = false }: { controls: ReactNode; children: ReactNode; wideControls?: boolean }) {
  return (
    <div className={cx('grid gap-6', wideControls ? 'xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]' : 'xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]')}>
      <div className="space-y-4">{controls}</div>
      <div className="min-w-0 space-y-5">{children}</div>
    </div>
  );
}

export function ControlGroup({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-line bg-surface-2/50 p-4">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{title}</p>
      {children}
    </fieldset>
  );
}

export function StatTile({ label, value, sub, emphasis = false, icon: Icon }: { label: ReactNode; value: ReactNode; sub?: ReactNode; emphasis?: boolean; icon?: LucideIcon }) {
  return (
    <div className="relative bg-surface px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {emphasis && <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden />}
        {Icon && <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />}
        {label}
      </p>
      <p className={cx('mt-1.5 text-[22px] leading-tight font-semibold tracking-[-0.02em] sm:text-2xl', emphasis ? 'text-accent-text' : 'text-ink')}>{value}</p>
      {sub && <p className="mt-1 text-xs leading-snug text-muted">{sub}</p>}
    </div>
  );
}

/** A hairline grid of stat tiles. */
export function StatGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const c = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3 sm:[&>*:last-child:nth-child(odd)]:col-span-1', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[cols];
  return (
    <div className={cx('grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line [&>*:last-child:nth-child(odd)]:col-span-2', c)}>
      {children}
    </div>
  );
}

export type Tone = 'good' | 'warning' | 'critical' | 'info' | 'tip';
const TONES: Record<Tone, { icon: LucideIcon; label: string; bar: string; iconCls: string; bg: string }> = {
  good: { icon: CircleCheck, label: 'Looking good', bar: 'bg-[color:var(--good)]', iconCls: 'text-good-text', bg: 'bg-good-soft' },
  warning: { icon: TriangleAlert, label: 'Heads up', bar: 'bg-[color:var(--warning)]', iconCls: 'text-warning-text', bg: 'bg-warning-soft' },
  critical: { icon: OctagonAlert, label: 'Needs attention', bar: 'bg-[color:var(--critical)]', iconCls: 'text-critical-text', bg: 'bg-critical-soft' },
  info: { icon: Info, label: 'Note', bar: 'bg-[color:var(--s1)]', iconCls: 'text-info-text', bg: 'bg-info-soft' },
  tip: { icon: Lightbulb, label: 'Tip', bar: 'bg-accent', iconCls: 'text-accent-text', bg: 'bg-accent-soft' },
};

/** Gentle feedback message. Always icon + label + text, never color alone. */
export function Nudge({ tone, title, children }: { tone: Tone; title?: ReactNode; children: ReactNode }) {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <div role="status" className={cx('relative flex gap-3 overflow-hidden rounded-2xl px-4 py-3.5 pl-5 text-sm', t.bg)}>
      <span className={cx('absolute inset-y-3 left-0 w-[3px] rounded-r-full', t.bar)} aria-hidden />
      <Icon className={cx('mt-0.5 size-4 shrink-0', t.iconCls)} strokeWidth={2} aria-hidden />
      <div>
        <p className="font-semibold text-ink">{title ?? t.label}</p>
        <div className="mt-0.5 leading-relaxed text-ink-2">{children}</div>
      </div>
    </div>
  );
}
