import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from './ui';

export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
  /** text color when the label sits inside the segment */
  ink?: string;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Rough width of a 12px semibold label. Labels render only when they fit with padding. */
const textWidth = (t: string) => t.length * 7.2 + 16;

/**
 * Tall segmented bar for part-to-whole (<= 6 segments). Segments are separated by a 2px surface gap.
 * When the parts add up to more than `total`, the bar scales to the sum and a marker shows where
 * `total` falls.
 */
export function SegmentBar({ segments, total, height = 44, format, markerLabel, showInside = true, inside = 'pct', ariaLabel }: {
  segments: Segment[];
  total: number;
  height?: number;
  format: (v: number) => string;
  markerLabel?: string;
  showInside?: boolean;
  /** what to print inside a segment that has room: its share of total, or its formatted value */
  inside?: 'pct' | 'value';
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const sum = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  const scale = Math.max(total, sum, 1);
  const over = sum > total + 0.5;
  return (
    <div ref={ref} className="relative" role="img" aria-label={ariaLabel}>
      <div className="flex w-full gap-[2px] overflow-hidden rounded-[10px] bg-surface-2" style={{ height }}>
        {segments.filter((s) => s.value > 0).map((s) => {
          const w = (s.value / scale) * 100;
          const px = (w / 100) * width;
          const p = inside === 'value' ? format(s.value) : Math.round((s.value / Math.max(total, 1)) * 100) + '%';
          const full = `${s.label} ${p}`;
          const label = !showInside ? null : textWidth(full) <= px ? full : textWidth(p) <= px ? p : null;
          return (
            <div
              key={s.key}
              className="relative flex min-w-[3px] items-center justify-center overflow-hidden rounded-[5px] transition-[width] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ width: w + '%', background: s.color }}
              title={`${s.label}: ${format(s.value)}`}
            >
              {label && <span className="px-2 text-xs font-medium whitespace-nowrap" style={{ color: s.ink ?? '#fff' }}>{label}</span>}
            </div>
          );
        })}
      </div>
      {over && (
        <div className="pointer-events-none absolute -top-1 -bottom-1 w-0.5 bg-ink" style={{ left: `calc(${(total / scale) * 100}% - 1px)` }}>
          {markerLabel && (
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-ink">{markerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

/** Legend + values for a SegmentBar; identity never relies on color alone. */
export function SegmentLegend({ segments, total, format, extra }: { segments: Segment[]; total: number; format: (v: number) => string; extra?: ReactNode }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
      {segments.map((s) => (
        <li key={s.key} className={cx('inline-flex items-center gap-1.5', s.value <= 0 && 'opacity-50')}>
          <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
          <span className="text-ink-2">{s.label}</span>
          <span className="tnum font-medium text-ink">{format(s.value)}</span>
          {total > 0 && <span className="tnum text-xs text-muted">({Math.round((s.value / total) * 100)}%)</span>}
        </li>
      ))}
      {extra}
    </ul>
  );
}
