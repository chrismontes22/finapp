import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'ghost' | 'soft';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink hover:bg-primary-hover shadow-soft',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2 shadow-soft',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  soft: 'bg-accent-soft text-accent-text hover:brightness-[0.97] dark:hover:brightness-125',
};
const SIZE = { sm: 'h-8 px-3 text-[13px] gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-[15px] gap-2' };

export function Button({ variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, className, children, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: LucideIcon; iconRight?: LucideIcon }) {
  return (
    <button type="button" className={cx('inline-flex cursor-pointer items-center justify-center rounded-full font-medium tracking-[-0.01em] transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40', VARIANT[variant], SIZE[size], className)} {...rest}>
      {Icon && <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} strokeWidth={1.75} aria-hidden />}
      {children}
      {IconRight && <IconRight className={size === 'sm' ? 'size-3.5' : 'size-4'} strokeWidth={1.75} aria-hidden />}
    </button>
  );
}

export function LinkButton({ href, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, className, children }:
  { href: string; variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: LucideIcon; iconRight?: LucideIcon; className?: string; children: ReactNode }) {
  return (
    <a href={href} className={cx('group inline-flex items-center justify-center rounded-full font-medium tracking-[-0.01em] no-underline transition-all duration-150 active:scale-[0.98]', VARIANT[variant], SIZE[size], className)}>
      {Icon && <Icon className="size-4" strokeWidth={1.75} aria-hidden />}
      {children}
      {IconRight && <IconRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden />}
    </a>
  );
}

export function Card({ className, children, as: As = 'div' }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' }) {
  return <As className={cx('rounded-3xl border border-line bg-surface shadow-soft', className)}>{children}</As>;
}

export function Chip({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'good' | 'warning'; className?: string }) {
  const t = {
    neutral: 'border-line text-ink-2',
    accent: 'border-transparent bg-accent-soft text-accent-text',
    good: 'border-transparent bg-good-soft text-good-text',
    warning: 'border-transparent bg-warning-soft text-warning-text',
  }[tone];
  return <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', t, className)}>{children}</span>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-[11px] font-medium tracking-[0.14em] text-muted uppercase', className)}>{children}</p>;
}

export function SegmentedControl<T extends string>({ value, onChange, options, label, size = 'md' }:
  { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-full border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'cursor-pointer rounded-full font-medium transition-all duration-150',
            size === 'sm' ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-[13px]',
            value === o.value ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200', checked ? 'bg-accent' : 'bg-surface-3')}
      >
        <span className={cx('inline-block size-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200', checked ? 'translate-x-[18px]' : 'translate-x-[2px]')} />
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm leading-snug">
        <span className="font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-muted">{description}</span>}
      </label>
    </div>
  );
}

export function Disclosure({ title, icon: Icon, children, defaultOpen = false, className, tone = 'neutral' }:
  { title: ReactNode; icon?: LucideIcon; children: ReactNode; defaultOpen?: boolean; className?: string; tone?: 'neutral' | 'math' }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={cx('overflow-hidden rounded-2xl border border-line', tone === 'math' ? 'bg-surface-2/50' : 'bg-surface', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-2.5 px-5 py-3.5 text-left text-sm font-medium text-ink transition-colors hover:bg-surface-2/60"
      >
        {Icon && <Icon className="size-4 text-muted" strokeWidth={1.75} aria-hidden />}
        <span className="flex-1">{title}</span>
        <ChevronDown className={cx('size-4 text-muted transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.75} aria-hidden />
      </button>
      {open && (
        <div id={id} className="fade-in border-t border-line px-5 py-5 text-sm leading-relaxed text-ink-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, className, label }: { value: number; max?: number; className?: string; label: string }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100} className={cx('h-1 overflow-hidden rounded-full bg-surface-3', className)}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out" style={{ width: p + '%' }} />
    </div>
  );
}

/** Small circular progress indicator. */
export function ProgressRing({ value, max, size = 28, className }: { value: number; max: number; size?: number; className?: string }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const p = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} className={cx('-rotate-90', className)} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="2.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: 'stroke-dashoffset 700ms ease' }} />
    </svg>
  );
}

/** The Money Sandbox mark: a rising curve in a rounded square. */
export function LogoMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path d="M7 22.5c4.5 0 6.5-1.5 9-5s4.5-7 9-7.5" fill="none" stroke="var(--logo-stroke, #fff)" strokeWidth="2.4" strokeLinecap="round" pathLength={1} className={animated ? 'intro-path' : undefined} style={animated ? { animationDuration: '900ms', animationDelay: '150ms' } : undefined} />
      <circle cx="25" cy="10" r="2.2" fill="var(--logo-dot, #34d399)" className={animated ? 'intro-dot' : undefined} style={animated ? { animationDelay: '900ms' } : undefined} />
    </svg>
  );
}
