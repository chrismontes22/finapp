import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Search, X, Lock, Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import { GLOSSARY, TERM_IDS, type TermId } from '../data/glossary';
import { CHAPTER_BY_ID } from '../data/course';
import { useProgress } from '../state/progress';
import { chapterHref } from '../state/router';
import { cx } from './ui';

interface GlossaryCtx { openDrawer: (focus?: TermId) => void; }
const Ctx = createContext<GlossaryCtx | null>(null);
export const useGlossary = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGlossary must be used inside GlossaryProvider');
  return v;
};

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<TermId | undefined>();
  const openDrawer = useCallback((f?: TermId) => { setFocus(f); setOpen(true); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); openDrawer(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openDrawer]);

  const value = useMemo(() => ({ openDrawer }), [openDrawer]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {open && <GlossaryDrawer focus={focus} onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Inline term with hover / tap definition                              */
/* ------------------------------------------------------------------ */

export function Term({ id, children }: { id: TermId; children?: ReactNode }) {
  const entry = GLOSSARY[id];
  const { unlockTerm } = useProgress();
  const { openDrawer } = useGlossary();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const popId = useId();

  const show = () => { window.clearTimeout(timer.current); setOpen(true); };
  const hideSoon = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setOpen(false); setPinned(false); }, 140);
  };

  const place = useCallback(() => {
    const b = btn.current, p = pop.current;
    if (!b || !p) return;
    const rects = b.getClientRects();
    const r = rects.length ? rects[0] : b.getBoundingClientRect();
    const w = p.offsetWidth, h = p.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let top = r.bottom + 8;
    if (top + h > vh - 8 && r.top - h - 8 > 8) top = r.top - h - 8;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8);
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    unlockTerm(id);
    const onScroll = () => place();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setPinned(false); btn.current?.focus(); } };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btn.current?.contains(t) || pop.current?.contains(t)) return;
      setOpen(false); setPinned(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open, id, place, unlockTerm]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const mod = CHAPTER_BY_ID[entry.chapter];

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="term"
        aria-expanded={open}
        aria-describedby={open ? popId : undefined}
        onMouseEnter={show}
        onMouseLeave={() => { if (!pinned) hideSoon(); }}
        onFocus={show}
        onBlur={() => { if (!pinned) hideSoon(); }}
        onClick={() => {
          if (pinned) { setPinned(false); setOpen(false); }
          else { setPinned(true); show(); }
        }}
      >
        {children ?? entry.term}
      </button>
      {open && createPortal(
        <div
          ref={pop}
          id={popId}
          role="tooltip"
          onMouseEnter={show}
          onMouseLeave={() => { if (!pinned) hideSoon(); }}
          className="pop-in fixed z-[70] w-[min(20rem,calc(100vw-16px))] rounded-2xl border border-line bg-surface/95 p-4 text-left shadow-lift backdrop-blur-xl"
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
        >
          <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.16em] text-muted uppercase">
            <BookOpen className="size-3" aria-hidden /> Glossary
          </p>
          <p className="mt-1 font-serif text-[21px] leading-tight text-ink">{entry.term}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{entry.def}</p>
          <p className="mt-2.5 border-l-2 border-accent/50 pl-3 text-xs leading-relaxed text-ink-2">
            <span className="font-medium text-ink">Example: </span>{entry.example}
          </p>
          <button
            type="button"
            className="mt-2 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-accent-text hover:underline"
            onClick={() => { setOpen(false); setPinned(false); openDrawer(id); }}
          >
            Open in glossary <ArrowRight className="size-3" aria-hidden />
          </button>
          <span className="sr-only">From chapter {mod.num}</span>
        </div>,
        document.body,
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Searchable drawer                                                    */
/* ------------------------------------------------------------------ */

type Filter = 'all' | 'collected' | 'new';

function GlossaryDrawer({ focus, onClose }: { focus?: TermId; onClose: () => void }) {
  const { glossary, unlockTerm } = useProgress();
  const [q, setQ] = useState(focus ? GLOSSARY[focus].term : '');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<TermId | null>(focus ?? null);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const scrolled = useRef(false);

  useEffect(() => {
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  useEffect(() => { if (focus) unlockTerm(focus); }, [focus, unlockTerm]);

  const sorted = useMemo(() => [...TERM_IDS].sort((a, b) => GLOSSARY[a].term.localeCompare(GLOSSARY[b].term)), []);
  const needle = q.trim().toLowerCase();
  const list = sorted.filter((id) => {
    const e = GLOSSARY[id];
    if (filter === 'collected' && !glossary[id]) return false;
    if (filter === 'new' && glossary[id]) return false;
    if (!needle) return true;
    return e.term.toLowerCase().includes(needle) || e.def.toLowerCase().includes(needle) || e.example.toLowerCase().includes(needle);
  });
  const collected = TERM_IDS.filter((id) => glossary[id]).length;

  const toggle = (id: TermId) => {
    setExpanded((cur) => (cur === id ? null : id));
    unlockTerm(id);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="fade-in absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div ref={panel} className="slide-in-right absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-page shadow-lift">
        <div className="border-b border-line p-5">
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="font-serif text-[30px] leading-none text-ink">Glossary</h2>
            <button type="button" onClick={onClose} className="grid size-9 cursor-pointer place-items-center rounded-full text-ink-2 hover:bg-surface-2" aria-label="Close glossary"><X className="size-5" /></button>
          </div>
          <p className="mt-2 text-sm text-ink-2">
            You've collected <strong className="text-ink">{collected}</strong> of {TERM_IDS.length} terms. Hover or tap <span className="term" aria-hidden>underlined words</span> in chapters to collect more.
          </p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search terms, e.g. APY, Roth, deductible"
              aria-label="Search the glossary"
              className="h-11 w-full rounded-full border border-line-strong bg-surface pr-4 pl-10 text-sm text-ink shadow-soft placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-1.5" role="group" aria-label="Filter terms">
            {([['all', 'All'], ['collected', 'Collected'], ['new', 'Not yet collected']] as const).map(([v, l]) => (
              <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)}
                className={cx('cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors', filter === v ? 'border-primary bg-primary text-primary-ink' : 'border-line-strong text-ink-2 hover:text-ink')}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto px-3 py-3">
          {list.length === 0 && <li className="p-6 text-center text-sm text-muted">No terms match "{q}". Try a shorter word.</li>}
          {list.map((id) => {
            const e = GLOSSARY[id];
            const isOpen = expanded === id;
            const has = Boolean(glossary[id]);
            const mod = CHAPTER_BY_ID[e.chapter];
            return (
              <li key={id} className="rounded-xl" ref={(el) => { if (el && focus === id && !scrolled.current) { scrolled.current = true; el.scrollIntoView({ block: 'nearest' }); } }}>
                <button type="button" onClick={() => toggle(id)} aria-expanded={isOpen}
                  className={cx('flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface', isOpen && 'bg-surface shadow-soft')}>
                  {has ? <Sparkles className="size-3.5 shrink-0 text-accent-text" aria-label="Collected" /> : <Lock className="size-3.5 shrink-0 text-muted/70" aria-label="Not yet collected" />}
                  <span className="flex-1 text-sm font-medium text-ink">{e.term}</span>
                  <span className="text-[11px] text-muted">Ch. {mod.num}</span>
                  <ChevronDown className={cx('size-4 text-muted transition-transform', isOpen && 'rotate-180')} aria-hidden />
                </button>
                {isOpen && (
                  <div className="fade-in px-3 pt-1 pb-3 pl-9">
                    <p className="text-sm leading-relaxed text-ink">{e.def}</p>
                    <p className="mt-2 border-l-2 border-accent/50 pl-3 text-xs leading-relaxed text-ink-2"><span className="font-medium text-ink">Example: </span>{e.example}</p>
                    <a href={chapterHref(mod.id)} onClick={onClose} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline">
                      Learn it in Chapter {mod.num}: {mod.short} <ArrowRight className="size-3" aria-hidden />
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
