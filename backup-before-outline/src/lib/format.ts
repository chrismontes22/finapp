export const usd = (n: number, opts: { cents?: boolean; compact?: boolean; sign?: boolean } = {}): string => {
  if (!Number.isFinite(n)) return '—';
  const { cents = false, compact = false, sign = false } = opts;
  const abs = Math.abs(n);
  let body: string;
  if (compact && abs >= 1_000_000) body = '$' + (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M';
  else if (compact && abs >= 10_000) body = '$' + Math.round(abs / 1000) + 'k';
  else if (compact && abs >= 1000) body = '$' + (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  else
    body = '$' + abs.toLocaleString('en-US', {
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    });
  const neg = n < 0 && Math.round(abs * (cents ? 100 : 1)) !== 0;
  if (neg) return '−' + body;
  if (sign && n > 0) return '+' + body;
  return body;
};

export const pct = (n: number, digits = 1): string => {
  if (!Number.isFinite(n)) return '—';
  const s = n.toFixed(digits);
  return (n < 0 ? s.replace('-', '−') : s) + '%';
};

export const num = (n: number, digits = 0): string =>
  Number.isFinite(n)
    ? n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : '—';

export const years = (months: number): string => {
  const y = Math.floor(months / 12);
  const m = Math.round(months % 12);
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
};

export const monthYear = (monthsFromNow: number, from = new Date()): string => {
  const d = new Date(from.getFullYear(), from.getMonth() + monthsFromNow, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
