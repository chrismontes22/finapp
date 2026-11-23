import { useState, type ReactNode } from 'react';
import { Check, X, RotateCcw, Eye } from 'lucide-react';
import { CHAPTER_BY_ID, type ChapterId } from '../data/course';
import { quizScore, useProgress } from '../state/progress';
import { cx } from './ui';

export interface QuizOption { text: ReactNode; correct?: boolean; why: ReactNode; }
export interface QuizQuestion { id: string; scenario: ReactNode; prompt: ReactNode; options: QuizOption[]; }

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function DecisionCheck({ chapterId, questions }: { chapterId: ChapterId; questions: QuizQuestion[] }) {
  const { quiz, resetQuiz } = useProgress();
  const [round, setRound] = useState(0);
  const answers = quiz[chapterId];
  const score = quizScore(answers);
  const allDone = questions.every((q) => answers?.[q.id]);
  if (import.meta.env.DEV && CHAPTER_BY_ID[chapterId].quizCount !== questions.length) console.warn('quizCount mismatch for', chapterId);

  return (
    <div className="reveal-group space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-[15px] leading-relaxed text-ink-2">
          Pick what <em>you</em> would do. Every answer explains why, with real numbers. Your first pick counts toward your score.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-label={score.correct + ' of ' + questions.length + ' correct on the first try'}>
            {questions.map((q) => {
              const a = answers?.[q.id];
              return <span key={q.id} className={cx('size-2 rounded-full', !a ? 'bg-surface-3' : a.correct ? 'bg-accent' : 'bg-[color:var(--warning)]')} />;
            })}
          </div>
          <span className="tnum text-sm font-medium text-ink">{score.correct}/{questions.length}</span>
          {score.answered > 0 && (
            <button type="button" onClick={() => { resetQuiz(chapterId); setRound((r) => r + 1); }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink">
              <RotateCcw className="size-3.5" strokeWidth={1.75} aria-hidden /> Retake
            </button>
          )}
        </div>
      </div>
      {questions.map((q, i) => <Question key={q.id + ':' + round} chapterId={chapterId} q={q} index={i} total={questions.length} />)}
      {allDone && (
        <p className="celebrate rounded-2xl border border-line bg-surface px-5 py-4 text-[15px] text-ink shadow-soft">
          {score.correct === questions.length
            ? 'All correct on the first try.'
            : 'You got ' + score.correct + ' of ' + questions.length + ' on the first try, and now you know why each answer works or doesn\'t. That is exactly how this is meant to go.'}
        </p>
      )}
    </div>
  );
}

function Question({ chapterId, q, index, total }: { chapterId: ChapterId; q: QuizQuestion; index: number; total: number }) {
  const { quiz, recordAnswer } = useProgress();
  const stored = quiz[chapterId]?.[q.id];
  const [opened, setOpened] = useState<number[]>(stored ? [stored.choice] : []);
  const [showAll, setShowAll] = useState(false);
  const first = stored?.choice ?? opened[0];
  const firstCorrect = first !== undefined && q.options[first]?.correct;
  const foundCorrect = opened.some((o) => q.options[o]?.correct);

  const pick = (i: number) => {
    if (!stored) recordAnswer(chapterId, q.id, i, Boolean(q.options[i].correct));
    setOpened((o) => (o.includes(i) ? o : [...o, i]));
  };

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-7">
      <p className="tnum text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Scenario {index + 1} of {total}</p>
      <div className="mt-3 text-[15px] leading-relaxed text-ink-2">{q.scenario}</div>
      <p className="mt-4 font-serif text-[22px] leading-snug text-ink">{q.prompt}</p>
      <ul className="mt-4 space-y-2">
        {q.options.map((opt, i) => {
          const isOpen = opened.includes(i) || showAll;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(i)}
                aria-expanded={isOpen}
                className={cx(
                  'group flex w-full cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] transition-all duration-150',
                  isOpen && opt.correct && 'border-[color:var(--good)]/60 bg-good-soft',
                  isOpen && !opt.correct && 'border-[color:var(--warning)]/60 bg-warning-soft',
                  !isOpen && 'border-line hover:border-line-strong hover:bg-surface-2/60',
                )}
              >
                <span className={cx('grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold transition-colors',
                  isOpen ? (opt.correct ? 'border-transparent bg-[color:var(--good)] text-white' : 'border-transparent bg-[color:var(--warning)] text-[#1a1200]') : 'border-line-strong text-muted group-hover:text-ink')}>
                  {isOpen ? (opt.correct ? <Check className="size-3.5" strokeWidth={3} aria-label="Best choice" /> : <X className="size-3.5" strokeWidth={3} aria-label="Not ideal" />) : LETTERS[i]}
                </span>
                <span className="flex-1 pt-0.5 text-ink">{opt.text}</span>
                {isOpen && <span className={cx('shrink-0 pt-1 text-[11px] font-medium tracking-wide uppercase', opt.correct ? 'text-good-text' : 'text-warning-text')}>{opt.correct ? 'Best choice' : 'Not ideal'}</span>}
              </button>
              {isOpen && (
                <div className="fade-in ml-[2.75rem] border-l border-line-strong py-2.5 pr-2 pl-4 text-sm leading-relaxed text-ink-2">
                  {opt.why}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {first !== undefined && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className={cx('font-medium', firstCorrect ? 'text-good-text' : 'text-ink-2')}>
            {firstCorrect ? 'Nice reasoning. That\'s the strongest move.' : foundCorrect ? 'You found it. Reading why the other answers fall short helps you remember the reasoning.' : 'Not quite, and that\'s fine. Read the why, then try another option.'}
          </span>
          {!showAll && (
            <button type="button" onClick={() => setShowAll(true)} className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
              <Eye className="size-3.5" strokeWidth={1.75} aria-hidden /> Show all explanations
            </button>
          )}
        </div>
      )}
    </article>
  );
}
