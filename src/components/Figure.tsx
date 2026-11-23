import { useState, type ReactElement, type ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';
import { ArrowDown, ArrowRight, ChartLine, FileText, Table2, Workflow, type LucideIcon } from 'lucide-react';
import { DataTable, LegendRow, type LegendItem, type TableSpec } from './Chart';
import { usd } from '../lib/format';
import { cx } from './ui';

/* ------------------------------------------------------------------ */
/* Figure: a picture of a chart, diagram or document, always explained  */
/* ------------------------------------------------------------------ */

export type FigureKind = 'chart' | 'diagram' | 'example';

const KIND: Record<FigureKind, { label: string; icon: LucideIcon }> = {
  chart: { label: 'Chart', icon: ChartLine },
  diagram: { label: 'Diagram', icon: Workflow },
  example: { label: 'Example document', icon: FileText },
};

/**
 * A captioned picture with a built-in explanation underneath.
 * - kind="chart": children is ONE Recharts chart element (it is wrapped in a ResponsiveContainer of `height`).
 *   Pass `table` to add a Chart / Table toggle.
 * - kind="diagram" | "example": children is any markup (FlowDiagram, StatementMockup, inline SVG, ...).
 * Every figure explains itself: `howToRead` (2–4 short bullets about axes, colors, marks) and `takeaway`
 * (the one thing the reader should notice).
 */
export function Figure({ kind = 'chart', title, subtitle, legend, table, height = 280, children, howToRead, takeaway, note }: {
  kind?: FigureKind;
  title: ReactNode;
  subtitle?: ReactNode;
  legend?: LegendItem[];
  table?: TableSpec;
  height?: number;
  children: ReactNode;
  howToRead?: ReactNode[];
  takeaway: ReactNode;
  /** Assumptions or sources, in small print under the picture. */
  note?: ReactNode;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const k = KIND[kind];
  const isChart = kind === 'chart';
  return (
    <figure className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
      <div className="px-5 pt-5 pb-5 sm:px-7 sm:pt-6 sm:pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <figcaption className="min-w-0 max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
              <k.icon className="size-3.5" strokeWidth={1.75} aria-hidden /> {k.label}
            </p>
            <p className="mt-1.5 font-serif text-[24px] leading-tight text-ink">{title}</p>
            {subtitle && <p className="mt-1 text-sm leading-relaxed text-ink-2">{subtitle}</p>}
          </figcaption>
          {isChart && table && (
            <div className="inline-flex rounded-full border border-line bg-surface-2 p-0.5" role="group" aria-label="Chart or table view">
              {(['chart', 'table'] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
                  className={cx('inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors', view === v ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink')}>
                  {v === 'chart' ? <ChartLine className="size-3.5" aria-hidden /> : <Table2 className="size-3.5" aria-hidden />}
                  {v === 'chart' ? 'Chart' : 'Table'}
                </button>
              ))}
            </div>
          )}
        </div>
        {legend && (!isChart || view === 'chart') && <div className="mt-4"><LegendRow items={legend} /></div>}
        <div className="mt-4">
          {isChart
            ? view === 'chart'
              ? <div style={{ height }}><ResponsiveContainer width="100%" height="100%">{children as ReactElement}</ResponsiveContainer></div>
              : table && <DataTable spec={table} maxHeight={height + 40} />
            : children}
        </div>
        {note && <p className="mt-3 text-xs leading-relaxed text-muted">{note}</p>}
      </div>
      <div className={cx('grid gap-px border-t border-line bg-line', howToRead && howToRead.length > 0 && 'md:grid-cols-2')}>
        {howToRead && howToRead.length > 0 && (
          <div className="bg-surface-2/60 px-5 py-4 sm:px-7 sm:py-5">
            <p className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">How to read it</p>
            <ul className="mt-2.5 space-y-1.5">
              {howToRead.map((h, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-2 [&_strong]:text-ink">
                  <span className="mt-[9px] size-1 shrink-0 rounded-full bg-muted" aria-hidden />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="bg-surface-2/60 px-5 py-4 sm:px-7 sm:py-5">
          <p className="text-[10px] font-medium tracking-[0.16em] text-accent-text uppercase">What it shows</p>
          <div className="mt-2.5 text-[15px] leading-relaxed text-ink [&_strong]:font-semibold">{takeaway}</div>
        </div>
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Chart helpers for static figures                                     */
/* ------------------------------------------------------------------ */

type LabelProps = { x?: number | string; y?: number | string; index?: number; width?: number | string; height?: number | string; value?: unknown };

/**
 * Direct label at the last point of a line: <Line label={endLabel(data.length - 1, 'Jordan $277K')} />.
 * Leave about 90px of right margin on the chart so the text fits.
 */
export const endLabel = (lastIndex: number, text: string, dy = 4) => (p: LabelProps) =>
  p.index === lastIndex
    ? <text x={Number(p.x) + 8} y={Number(p.y)} dy={dy} fontSize={12} fontWeight={600} fill="var(--ink)">{text}</text>
    : <g />;

/** Value label above a column (vertical bar). Use as <Bar label={columnLabel(usd)} />. */
export const columnLabel = (format: (v: number) => string) => (p: LabelProps) =>
  <text x={Number(p.x) + Number(p.width) / 2} y={Number(p.y) - 6} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)">{format(Number(p.value))}</text>;

/** Value label at the end of a horizontal bar (layout="vertical"). Use as <Bar label={barEndLabel(usd)} />. */
export const barEndLabel = (format: (v: number) => string) => (p: LabelProps) =>
  <text x={Number(p.x) + Number(p.width) + 6} y={Number(p.y) + Number(p.height) / 2} dy={4} fontSize={12} fontWeight={600} fill="var(--ink)">{format(Number(p.value))}</text>;

/** Rounded data-end, square baseline. Columns: COLUMN_RADIUS; horizontal bars: BAR_RADIUS. */
export const COLUMN_RADIUS: [number, number, number, number] = [4, 4, 0, 0];
export const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];
export const MAX_BAR = 24;

/* ------------------------------------------------------------------ */
/* FlowDiagram: boxes joined by arrows                                  */
/* ------------------------------------------------------------------ */

export interface FlowNode {
  icon?: LucideIcon;
  title: ReactNode;
  amount?: ReactNode;
  detail?: ReactNode;
  /** A series color (e.g. 'var(--s1)') shown as a small key, to tie the box to a chart. */
  color?: string;
  /** Highlight the box that matters most. */
  emphasis?: boolean;
}

function FlowBox({ n }: { n: FlowNode }) {
  const Icon = n.icon;
  return (
    <div className={cx('flex h-full flex-col rounded-2xl border p-4', n.emphasis ? 'border-accent/50 bg-accent-soft/70' : 'border-line bg-surface')}>
      <div className="flex items-center gap-2.5">
        {Icon && <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink"><Icon className="size-4" strokeWidth={1.6} aria-hidden /></span>}
        {n.color && <span className="size-2.5 shrink-0 rounded-full" style={{ background: n.color }} aria-hidden />}
        <p className="text-sm font-medium leading-snug text-ink">{n.title}</p>
      </div>
      {n.amount && <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink">{n.amount}</p>}
      {n.detail && <p className="mt-1 text-xs leading-relaxed text-ink-2">{n.detail}</p>}
    </div>
  );
}

/**
 * Steps left to right (top to bottom on phones). A step that is an array renders as a stacked
 * group, e.g. a paycheck splitting into savings, retirement and bills.
 */
export function FlowDiagram({ steps, label }: { steps: (FlowNode | FlowNode[])[]; label: string }) {
  return (
    <div role="img" aria-label={label} className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
      {steps.map((st, i) => (
        <div key={i} className="contents">
          {i > 0 && (
            <div className="flex shrink-0 items-center justify-center text-muted" aria-hidden>
              <ArrowDown className="size-5 md:hidden" strokeWidth={1.75} />
              <ArrowRight className="hidden size-5 md:block" strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {Array.isArray(st)
              ? <div className="grid gap-2">{st.map((n, j) => <FlowBox key={j} n={n} />)}</div>
              : <FlowBox n={st} />}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatementMockup: a picture of a bank, card or pay statement          */
/* ------------------------------------------------------------------ */

export type FlagTone = 'critical' | 'warning' | 'good' | 'neutral';
const FLAG: Record<FlagTone, string> = {
  critical: 'bg-critical-soft text-critical-text',
  warning: 'bg-warning-soft text-warning-text',
  good: 'bg-good-soft text-good-text',
  neutral: 'bg-surface-2 text-ink-2',
};

export interface StatementRow {
  date?: string;
  label: ReactNode;
  /** Negative for money out, positive for money in. Omit for a text-only row. */
  amount?: number;
  /** Short tag, e.g. { text: 'Unused', tone: 'warning' }. Flagged rows are highlighted. */
  flag?: { text: string; tone: FlagTone };
}

/** A simplified statement drawn as a document, with flagged lines. Amounts use text colors only. */
export function StatementMockup({ issuer, title, period, rows, summary, callout, label }: {
  issuer: string;
  title: string;
  period?: string;
  rows: StatementRow[];
  /** Footer lines, e.g. [{ label: 'Flagged charges', value: '$212.47' }]. */
  summary?: { label: ReactNode; value: ReactNode; strong?: boolean }[];
  /** Optional boxed notice printed on the statement (e.g. a credit card's minimum-payment warning). */
  callout?: ReactNode;
  label: string;
}) {
  return (
    <div role="img" aria-label={label} className="mx-auto max-w-2xl rounded-xl border border-line-strong bg-surface shadow-lift">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="text-[13px] font-semibold tracking-[-0.01em] text-ink">{issuer}</p>
          <p className="text-xs text-muted">{title}</p>
        </div>
        {period && <p className="tnum text-right text-xs text-muted">{period}</p>}
      </div>
      <table className="tnum w-full text-left text-[13px]">
        <thead>
          <tr className="text-[10px] tracking-[0.12em] text-muted uppercase">
            <th scope="col" className="w-16 px-5 pt-3 pb-1.5 font-medium">Date</th>
            <th scope="col" className="pt-3 pb-1.5 font-medium">Description</th>
            <th scope="col" className="px-5 pt-3 pb-1.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cx('border-t border-line', r.flag && r.flag.tone !== 'neutral' && (r.flag.tone === 'good' ? 'bg-good-soft/50' : r.flag.tone === 'critical' ? 'bg-critical-soft/60' : 'bg-warning-soft/70'))}>
              <td className="px-5 py-2 align-top text-muted">{r.date}</td>
              <td className="py-2 align-top text-ink">
                <span className="mr-2">{r.label}</span>
                {r.flag && <span className={cx('inline-block rounded-full px-2 py-px text-[10px] font-semibold tracking-wide uppercase', FLAG[r.flag.tone])}>{r.flag.text}</span>}
              </td>
              <td className="px-5 py-2 text-right align-top whitespace-nowrap text-ink">
                {r.amount === undefined ? '' : (r.amount < 0 ? '−' : '+') + usd(Math.abs(r.amount), { cents: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {callout && <div className="mx-5 mt-3 rounded-lg border border-line-strong px-4 py-3 text-[13px] leading-relaxed text-ink">{callout}</div>}
      {summary && (
        <dl className="mt-3 border-t border-line-strong px-5 py-3 text-[13px]">
          {summary.map((s, i) => (
            <div key={i} className="flex justify-between gap-4 py-0.5">
              <dt className={s.strong ? 'font-semibold text-ink' : 'text-ink-2'}>{s.label}</dt>
              <dd className={cx('tnum', s.strong ? 'font-semibold text-ink' : 'text-ink')}>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
