import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ChapterId } from '../data/course';

const KEY = 'money-sandbox:progress:v2';
/** v1 tracked the old 8-lesson course. Only collected glossary terms carry over. */
const OLD_KEY = 'money-sandbox:progress:v1';

export interface QuizAnswer { choice: number; correct: boolean; at: string; }

export interface ProgressState {
  completed: Partial<Record<ChapterId, string>>;
  quiz: Partial<Record<ChapterId, Record<string, QuizAnswer>>>;
  glossary: Record<string, string>;
  visited: Partial<Record<ChapterId, string>>;
  lastChapter?: ChapterId;
}

const EMPTY: ProgressState = { completed: {}, quiz: {}, glossary: {}, visited: {} };

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const old = localStorage.getItem(OLD_KEY);
      const glossary = old ? (JSON.parse(old) as Partial<ProgressState>).glossary : undefined;
      return glossary ? { ...EMPTY, glossary } : EMPTY;
    }
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      completed: parsed.completed ?? {},
      quiz: parsed.quiz ?? {},
      glossary: parsed.glossary ?? {},
      visited: parsed.visited ?? {},
      lastChapter: parsed.lastChapter,
    };
  } catch {
    return EMPTY;
  }
}

interface ProgressApi extends ProgressState {
  isComplete: (id: ChapterId) => boolean;
  setComplete: (id: ChapterId, done: boolean) => void;
  recordAnswer: (id: ChapterId, questionId: string, choice: number, correct: boolean) => void;
  resetQuiz: (id: ChapterId) => void;
  unlockTerm: (termId: string) => void;
  markVisited: (id: ChapterId) => void;
  resetAll: () => void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked: progress just won't persist */ }
  }, [state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setState(load()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const now = () => new Date().toISOString();

  const setComplete = useCallback((id: ChapterId, done: boolean) =>
    setState((s) => {
      const completed = { ...s.completed };
      if (done) completed[id] = now(); else delete completed[id];
      return { ...s, completed };
    }), []);

  const recordAnswer = useCallback((id: ChapterId, questionId: string, choice: number, correct: boolean) =>
    setState((s) => {
      const forChapter = { ...(s.quiz[id] ?? {}) };
      if (forChapter[questionId]) return s; // first answer counts toward the score
      forChapter[questionId] = { choice, correct, at: now() };
      return { ...s, quiz: { ...s.quiz, [id]: forChapter } };
    }), []);

  const resetQuiz = useCallback((id: ChapterId) =>
    setState((s) => {
      const quiz = { ...s.quiz };
      delete quiz[id];
      return { ...s, quiz };
    }), []);

  const unlockTerm = useCallback((termId: string) =>
    setState((s) => (s.glossary[termId] ? s : { ...s, glossary: { ...s.glossary, [termId]: now() } })), []);

  const markVisited = useCallback((id: ChapterId) =>
    setState((s) => ({ ...s, lastChapter: id, visited: { ...s.visited, [id]: now() } })), []);

  const resetAll = useCallback(() => setState(EMPTY), []);

  const api = useMemo<ProgressApi>(() => ({
    ...state,
    isComplete: (id) => Boolean(state.completed[id]),
    setComplete, recordAnswer, resetQuiz, unlockTerm, markVisited, resetAll,
  }), [state, setComplete, recordAnswer, resetQuiz, unlockTerm, markVisited, resetAll]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress must be used inside ProgressProvider');
  return v;
}

export function quizScore(answers: Record<string, QuizAnswer> | undefined) {
  const list = Object.values(answers ?? {});
  return { answered: list.length, correct: list.filter((a) => a.correct).length };
}
