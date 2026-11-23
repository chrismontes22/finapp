import { useState, type ReactElement, type ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';
import { ChartLine, Table2 } from 'lucide-react';
import { cx } from './ui';

/** Shared, recessive chart chrome. Spread these onto Recharts axes / grid. */
export const xAxisProps = {
  tick: { fill: 'var(--axis-text)', fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: 'var(--axis)' },
  tickMargin: 6,
} as const;

export const yAxisProps = {
  tick: { fill: 'var(--axis-text)', fontSize: 12 },
  tickLine: false,
  axisLine: false,
  width: 60,
} as const;

export const gridProps = { stroke: 'var(--grid)', vertical: false } as const;

export const cursorProps = { stroke: 'var(--axis)', strokeWidth: 1 } as const;

export const activeDot = { r: 5, strokeWidth: 2, stroke: 'var(--surface)' } as const;

export interface LegendItem { label: string; color: string; dashed?: boolean; kind?: 'line' | 'box'; }

export function LegendRow({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-2" aria-label="Legend">
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-1.5">
          {it.kind === 'box' ? (
            <span className="inline-block size-2.5 rounded-[3px]" style={{ background: it.color }} aria-hidden />
          ) : (
            <svg width="18" height="8" aria-hidden>
              <line x1="1" y1="4" x2="17" y2="4" stroke={it.color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={it.dashed ? '4 3' : undefined} />
            </svg>
          )}
          {it.label}
        </li>
      ))}
    </ul>
  );
}

export interface TableSpec { columns: string[]; rows: (string | number)[][]; caption?: string; }

/** Card that holds a chart with a title, legend, and an accessible table-view twin. */
export function ChartFrame({ title, subtitle, legend, table, height = 280, children, footer }: {
  title: ReactNode;
  subtitle?: ReactNode;
  legend?: LegendItem[];
  table?: TableSpec;
  height?: number;
  children: ReactElement;
  footer?: ReactNode;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <figure className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <figcaption>
          <p className="text-[15px] font-medium tracking-[-0.01em] text-ink">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </figcaption>
        {table && (
          <div className="inline-flex rounded-full border border-line bg-surface-2 p-0.5" role="group" aria-label="Chart or table view">
            {(['chart', 'table'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cx('inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors', view === v ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink')}
              >
                {v === 'chart' ? <ChartLine className="size-3.5" aria-hidden /> : <Table2 className="size-3.5" aria-hidden />}
                {v === 'chart' ? 'Chart' : 'Table'}
              </button>
            ))}
          </div>
        )}
      </div>
      {legend && view === 'chart' && <div className="mt-3"><LegendRow items={legend} /></div>}
      {view === 'chart' ? (
        <div className="mt-3" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
      ) : (
        table && <DataTable spec={table} maxHeight={height + 40} />
      )}
      {footer && <div className="mt-3 text-xs text-muted">{footer}</div>}
    </figure>
  );
}

export function DataTable({ spec, maxHeight = 320 }: { spec: TableSpec; maxHeight?: number }) {
  return (
    <div className="mt-3 overflow-auto rounded-xl border border-line" style={{ maxHeight }}>
      <table className="tnum w-full text-left text-xs">
        {spec.caption && <caption className="sr-only">{spec.caption}</caption>}
        <thead className="sticky top-0 bg-surface-2 text-muted">
          <tr>{spec.columns.map((c) => <th key={c} scope="col" className="px-3 py-2 text-[11px] font-medium tracking-wide uppercase">{c}</th>)}</tr>
        </thead>
        <tbody>
          {spec.rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((cell, j) => <td key={j} className={cx('px-3 py-1.5', j === 0 ? 'font-medium text-ink' : 'text-ink-2')}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TipItem { name?: string | number; value?: unknown; color?: string; stroke?: string; fill?: string; dataKey?: unknown; }

/** Custom tooltip. Pass as <Tooltip content={<TooltipBox ... />} />; Recharts injects active/payload/label. */
export function TooltipBox({ active, payload, label, labelFormat, valueFormat, order, extra }: {
  active?: boolean;
  payload?: ReadonlyArray<TipItem>;
  label?: unknown;
  labelFormat?: (label: unknown) => ReactNode;
  valueFormat?: (value: number, name: string) => ReactNode;
  order?: string[];
  extra?: (label: unknown) => ReactNode;
}) {
  if (!active || !payload || payload.length === 0) return null;
  let items = payload.filter((p) => typeof p.value === 'number');
  if (order) items = [...items].sort((a, b) => order.indexOf(String(a.name)) - order.indexOf(String(b.name)));
  return (
    <div className="pointer-events-none min-w-[10rem] rounded-xl border border-line bg-surface/95 px-3 py-2.5 text-xs shadow-lift backdrop-blur">
      <p className="mb-1.5 font-medium text-ink">{labelFormat ? labelFormat(label) : String(label)}</p>
      <ul className="space-y-0.5">
        {items.map((p) => {
          const c = p.color ?? p.stroke ?? p.fill;
          return (
            <li key={String(p.dataKey ?? p.name)} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 text-ink-2">
                <span className="inline-block size-2 rounded-full" style={{ background: c }} aria-hidden />
                {p.name}
              </span>
              <span className="tnum font-semibold text-ink">{valueFormat ? valueFormat(p.value as number, String(p.name)) : String(p.value)}</span>
            </li>
          );
        })}
      </ul>
      {extra && <div className="mt-1.5 border-t border-line pt-1.5 text-ink-2">{extra(label)}</div>}
    </div>
  );
}
