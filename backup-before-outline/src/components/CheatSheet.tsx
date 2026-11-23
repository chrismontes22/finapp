import type { ReactNode } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { MODULES, nextModule, type ModuleId } from '../data/modules';
import { useProgress } from '../state/progress';
import { moduleHref, homeHref } from '../state/router';
import { LinkButton, cx } from './ui';

export interface Rule { icon: import('lucide-react').LucideIcon; title: string; body: ReactNode; }

export function CheatSheet({ moduleId, rules }: { moduleId: ModuleId; rules: Rule[] }) {
  const { isComplete, setComplete, completed } = useProgress();
  const done = isComplete(moduleId);
  const next = nextModule(moduleId);
  const totalDone = MODULES.filter((m) => completed[m.id]).length;

  return (
    <div className="reveal-group space-y-5">
      <ol className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line shadow-soft md:grid-cols-3">
        {rules.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="flex flex-col bg-surface p-6">
            <div className="flex items-center justify-between">
              <span className="font-serif text-[40px] leading-none text-ink/20">{String(i + 1).padStart(2, '0')}</span>
              <Icon className="size-5 text-muted" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="mt-6 text-[17px] font-medium leading-snug tracking-[-0.01em] text-ink">{title}</p>
            <div className="mt-2 text-sm leading-relaxed text-ink-2">{body}</div>
          </li>
        ))}
      </ol>

      <div className={cx('flex flex-col items-start gap-5 rounded-3xl border p-6 shadow-soft transition-colors sm:flex-row sm:items-center', done ? 'border-[color:var(--good)]/40 bg-good-soft' : 'border-line bg-surface')}>
        <div className="flex-1">
          <p className={cx('font-serif text-[26px] leading-tight', done ? 'celebrate text-good-text' : 'text-ink')}>
            {done ? 'Lesson complete.' : 'Ready to lock this in?'}
          </p>
          <p className="mt-1 text-sm text-ink-2">
            {done ? totalDone + ' of ' + MODULES.length + ' modules done. Your progress is saved in this browser.' : 'Mark it complete to track your progress. You can come back to the sandbox any time.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setComplete(moduleId, !done)}
            aria-pressed={done}
            className={cx('inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-medium transition-all duration-150 active:scale-[0.98]',
              done ? 'border border-line-strong bg-surface text-ink hover:bg-surface-2' : 'bg-primary text-primary-ink shadow-soft hover:bg-primary-hover')}
          >
            {done && <Check className="size-4 text-good-text" strokeWidth={2.5} aria-hidden />}
            {done ? 'Completed' : 'Mark complete'}
          </button>
          {next ? (
            <LinkButton href={moduleHref(next.id)} variant={done ? 'primary' : 'secondary'} iconRight={ArrowRight}>Next: {next.short}</LinkButton>
          ) : (
            <LinkButton href={homeHref} variant={done ? 'primary' : 'secondary'} iconRight={ArrowRight}>Back to course map</LinkButton>
          )}
        </div>
      </div>
    </div>
  );
}
