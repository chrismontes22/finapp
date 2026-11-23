import { useEffect, useId, useState, type ReactNode } from 'react';
import { clamp } from '../lib/format';

interface SliderFieldProps {
  label: ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  help?: ReactNode;
  suffix?: ReactNode;
  disabled?: boolean;
}

/** A labeled range slider with an editable value box. */
export function SliderField({ label, value, onChange, min, max, step = 1, format, help, suffix, disabled }: SliderFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const fill = max > min ? ((clamp(value, min, max) - min) / (max - min)) * 100 : 0;

  const commit = () => {
    if (draft === null) return;
    const n = parseFloat(draft.replace(/[^0-9.\-]/g, ''));
    if (Number.isFinite(n)) {
      const snapped = Math.round(n / step) * step;
      onChange(clamp(Number(snapped.toFixed(6)), min, max));
    }
    setDraft(null);
  };

  useEffect(() => { setDraft(null); }, [value]);

  return (
    <div className={disabled ? 'opacity-45' : undefined}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-ink-2">{label}</label>
        <div className="flex items-center gap-1">
          <input
            aria-label={typeof label === 'string' ? label + ' (type a value)' : 'Type a value'}
            className="tnum w-[5.75rem] rounded-lg border border-transparent bg-transparent px-2 py-0.5 text-right text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface focus:border-accent focus:bg-surface focus:outline-none"
            value={draft ?? format(value)}
            inputMode="decimal"
            disabled={disabled}
            onFocus={(e) => { setDraft(String(value)); requestAnimationFrame(() => e.target.select()); }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { commit(); (e.target as HTMLInputElement).blur(); }
              if (e.key === 'Escape') { setDraft(null); (e.target as HTMLInputElement).blur(); }
            }}
          />
          {suffix}
        </div>
      </div>
      <input
        id={id}
        type="range"
        className="range mt-0.5"
        min={min}
        max={max}
        step={step}
        value={clamp(value, min, max)}
        disabled={disabled}
        aria-valuetext={format(value)}
        style={{ ['--fill' as string]: fill + '%' }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {help && <p className="mt-0.5 text-xs leading-snug text-muted">{help}</p>}
    </div>
  );
}
