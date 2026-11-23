import { useId, useState, type ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cx } from './ui';

const fmt = (n: number, decimals: number) => (Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: decimals }) : '');

/** Number box that shows "1,450" at rest and accepts free typing while focused. */
export function NumberInput({ value, onChange, prefix = '$', suffix, label, decimals = 0, max = 1e9, className, placeholder }: {
  value: number | undefined;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals?: number;
  max?: number;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === undefined ? '' : fmt(value, decimals));
  return (
    <label className={cx('flex h-10 items-center gap-1 rounded-xl border border-line bg-surface px-3 text-sm shadow-[inset_0_1px_0_rgba(0,0,0,0.02)] transition-colors focus-within:border-accent hover:border-line-strong', className)}>
      <span className="sr-only">{label}</span>
      {prefix && <span className="text-muted">{prefix}</span>}
      <input
        className="tnum w-full min-w-0 bg-transparent text-right font-medium text-ink outline-none placeholder:text-muted/60"
        inputMode="decimal"
        value={shown}
        placeholder={placeholder ?? '0'}
        onFocus={(e) => { setDraft(value === undefined || value === 0 ? '' : String(value)); requestAnimationFrame(() => e.target.select()); }}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
          onChange(Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0);
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      />
      {suffix && <span className="text-muted">{suffix}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, label, placeholder, className }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string; className?: string }) {
  return (
    <label className={cx('flex h-10 items-center rounded-xl border border-line bg-surface px-3 text-sm transition-colors focus-within:border-accent hover:border-line-strong', className)}>
      <span className="sr-only">{label}</span>
      <input className="w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-muted/60" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function SelectInput<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: Record<T, string>; label: string; className?: string }) {
  return (
    <label className={cx('relative flex h-10 items-center rounded-xl border border-line bg-surface text-sm transition-colors focus-within:border-accent hover:border-line-strong', className)}>
      <span className="sr-only">{label}</span>
      <select className="h-full w-full cursor-pointer appearance-none bg-transparent pr-8 pl-3 text-ink outline-none" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {(Object.keys(options) as T[]).map((k) => <option key={k} value={k}>{options[k]}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-3 size-3.5 text-muted" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </label>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className} id={id}>
      <p className="mb-1 text-[11px] font-medium text-muted">{label}</p>
      {children}
    </div>
  );
}

export function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl text-muted transition-colors hover:bg-critical-soft hover:text-critical-text">
      <Trash2 className="size-4" strokeWidth={1.75} />
    </button>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line-strong px-4 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-text">
      <Plus className="size-4" strokeWidth={2} aria-hidden /> {children}
    </button>
  );
}

export function Panel({ title, subtitle, action, children, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-6', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-[24px] leading-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
