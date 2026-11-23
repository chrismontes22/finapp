/** The welcome intro plays on the home page at most once per calendar day. */
const KEY = 'money-sandbox:intro-last-shown';

const today = () => {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
};

export function introDueToday(): boolean {
  try { return localStorage.getItem(KEY) !== today(); } catch { return false; }
}

export function markIntroSeen(): void {
  try { localStorage.setItem(KEY, today()); } catch { /* storage blocked: the intro just won't be throttled */ }
}
