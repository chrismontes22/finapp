import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cx, LogoMark } from './ui';

const WORDS = ['Budget', 'Save', 'Borrow', 'Grow', 'Invest', 'Tax', 'Protect', 'Decide'];
const DRAW_DELAY = 450;
const DRAW_MS = 2100;

/** Inverse of the CSS easing used to draw the curve (an ease-in-out cubic), so dots appear as the line reaches them. */
const invEase = (y: number) => (y < 0.5 ? Math.cbrt(y / 4) : 1 - Math.cbrt(2 * (1 - y)) / 2);

function buildCurve() {
  const W = 1000, H = 260, x0 = 30, x1 = 970, k = 2.7;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const y = H - 20 - (H - 40) * ((Math.exp(k * t) - 1) / (Math.exp(k) - 1));
    pts.push([x0 + (x1 - x0) * t, y]);
  }
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1];
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const dots = WORDS.map((w, i) => {
    const idx = Math.round(((i + 0.6) / WORDS.length) * 80);
    const [x, y] = pts[idx];
    return { w, x, y, delay: DRAW_DELAY + DRAW_MS * invEase(lens[idx] / total) };
  });
  return { W, H, d, dots };
}

export function Intro({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const duration = reduced ? 1500 : 3400;
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);
  const curve = useMemo(buildCurve, []);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    onReveal();
    window.setTimeout(onDone, reduced ? 150 : 760);
  }, [onDone, onReveal, reduced]);

  useEffect(() => {
    const t = window.setTimeout(finish, duration);
    return () => window.clearTimeout(t);
  }, [finish, duration]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); } };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [finish]);

  const word = (text: string, start: number, cls?: string) =>
    text.split('').map((ch, i) => (
      <span key={i} className={cx('intro-letter', cls)} style={{ animationDelay: start + i * 45 + 'ms' }}>{ch}</span>
    ));

  return createPortal(
    <div
      className={cx('intro fixed inset-0 z-[100] cursor-pointer overflow-hidden select-none', leaving && 'leaving')}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Money Sandbox"
      onClick={finish}
    >
      <div className="intro-grid absolute inset-0" aria-hidden />
      <div className="intro-glow absolute inset-0" aria-hidden />

      <div className="intro-content relative flex h-full flex-col items-center justify-center px-6 pb-[18vh] text-center">
        <div className="relative" style={{ ['--logo-stroke' as string]: '#fafafa', ['--logo-dot' as string]: '#34d399' }}>
          <LogoMark animated className="size-14 text-white/[0.07] ring-1 ring-white/10 rounded-[16px]" />
        </div>
        <h1 className="mt-8 font-serif text-[56px] leading-none tracking-[-0.02em] sm:text-[92px]" aria-label="Money Sandbox">
          <span aria-hidden>{word('Money', 300)}</span>
          <span aria-hidden className="inline-block w-[0.28em]" />
          <span aria-hidden className="italic text-[#6ee7b7]">{word('Sandbox', 300 + 6 * 45)}</span>
        </h1>
        <p className="intro-fade mt-6 text-[11px] font-medium tracking-[0.32em] text-white/55 uppercase sm:text-xs" style={{ animationDelay: '1050ms' }}>
          Personal finance, in plain English
        </p>
        <p className="intro-fade mt-3 max-w-md text-sm leading-relaxed text-white/40" style={{ animationDelay: '1350ms' }}>
          Eight short lessons. Real numbers you can play with. Nothing to sign up for.
        </p>
      </div>

      <svg className="intro-content pointer-events-none absolute inset-x-0 bottom-[7vh] mx-auto h-[30vh] w-[min(1100px,94vw)]" viewBox={'0 0 ' + curve.W + ' ' + curve.H} preserveAspectRatio="xMidYMax meet" aria-hidden>
        <defs>
          <linearGradient id="intro-stroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#34d399" stopOpacity="0.15" />
            <stop offset="0.6" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ecfdf5" />
          </linearGradient>
          <linearGradient id="intro-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#34d399" stopOpacity="0.16" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={curve.d + ' L 970 ' + curve.H + ' L 30 ' + curve.H + ' Z'} fill="url(#intro-fill)" className="intro-label" style={{ animationDelay: DRAW_DELAY + DRAW_MS * 0.92 + 'ms', animationDuration: '700ms' }} />
        <path d={curve.d} fill="none" stroke="url(#intro-stroke)" strokeWidth="2" strokeLinecap="round" pathLength={1} className="intro-path" style={{ animationDelay: DRAW_DELAY + 'ms', animationDuration: DRAW_MS + 'ms' }} />
        {curve.dots.map((p) => (
          <g key={p.w}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="#070708" stroke="#6ee7b7" strokeWidth="1.5" className="intro-dot" style={{ animationDelay: p.delay + 'ms' }} />
            <text x={p.x} y={p.y - 16} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="13" letterSpacing="2" className="intro-label" style={{ animationDelay: p.delay + 60 + 'ms', fontFamily: 'var(--font-sans)' }}>
              {p.w.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" aria-hidden>
        <div className="intro-progress h-full bg-[#34d399]/70" style={{ animationDuration: duration + 'ms' }} />
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); finish(); }}
        className="intro-fade absolute right-5 bottom-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-[#34d399]"
        style={{ animationDelay: '600ms' }}
      >
        Skip intro <kbd className="rounded border border-white/15 px-1.5 py-px text-[10px] text-white/50">Esc</kbd>
      </button>
    </div>,
    document.body,
  );
}
