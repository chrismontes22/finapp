import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ModuleId } from '../data/modules';

const KEY = 'money-sandbox:progress:v1';

export interface QuizAnswer { choice: number; correct: boolean; at: string; }

export interface ProgressState {
  completed: Partial<Record<ModuleId, string>>;
  quiz: Partial<Record<ModuleId, Record<string, QuizAnswer>>>;
  glossary: Record<string, string>;
  visited: Partial<Record<ModuleId, string>>;
  lastModule?: ModuleId;
}

const EMPTY: ProgressState = { completed: {}, quiz: {}, glossary: {}, visited: {} };

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      completed: parsed.completed ?? {},
      quiz: parsed.quiz ?? {},
      glossary: parsed.glossary ?? {},
      visited: parsed.visited ?? {},
      lastModule: parsed.lastModule,
    };
  } catch {
    return EMPTY;
  }
}

interface ProgressApi extends ProgressState {
  isComplete: (id: ModuleId) => boolean;
  setComplete: (id: ModuleId, done: boolean) => void;
  recordAnswer: (id: ModuleId, questionId: string, choice: number, correct: boolean) => void;
  resetQuiz: (id: ModuleId) => void;
  unlockTerm: (termId: string) => void;
  markVisited: (id: ModuleId) => void;
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

  const setComplete = useCallback((id: ModuleId, done: boolean) =>
    setState((s) => {
      const completed = { ...s.completed };
      if (done) completed[id] = now(); else delete completed[id];
      return { ...s, completed };
    }), []);

  const recordAnswer = useCallback((id: ModuleId, questionId: string, choice: number, correct: boolean) =>
    setState((s) => {
      const forModule = { ...(s.quiz[id] ?? {}) };
      if (forModule[questionId]) return s; // first answer counts toward the score
      forModule[questionId] = { choice, correct, at: now() };
      return { ...s, quiz: { ...s.quiz, [id]: forModule } };
    }), []);

  const resetQuiz = useCallback((id: ModuleId) =>
    setState((s) => {
      const quiz = { ...s.quiz };
      delete quiz[id];
      return { ...s, quiz };
    }), []);

  const unlockTerm = useCallback((termId: string) =>
    setState((s) => (s.glossary[termId] ? s : { ...s, glossary: { ...s.glossary, [termId]: now() } })), []);

  const markVisited = useCallback((id: ModuleId) =>
    setState((s) => ({ ...s, lastModule: id, visited: { ...s.visited, [id]: now() } })), []);

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
