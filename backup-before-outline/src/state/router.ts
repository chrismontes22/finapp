import { useEffect, useState } from 'react';
import { MODULES, type ModuleId } from '../data/modules';

export const MONEY_TAB_IDS = ['overview', 'budget', 'net-worth', 'goals', 'check-ins'] as const;
export type MoneyTabId = (typeof MONEY_TAB_IDS)[number];

export type Route =
  | { page: 'home' }
  | { page: 'intro' }
  | { page: 'module'; id: ModuleId }
  | { page: 'money'; tab: MoneyTabId };

function parse(hash: string): Route {
  if (hash === '#/intro') return { page: 'intro' };
  const money = hash.match(/^#\/my-money(?:\/([a-z-]+))?/);
  if (money) {
    const t = money[1] as MoneyTabId | undefined;
    return { page: 'money', tab: t && (MONEY_TAB_IDS as readonly string[]).includes(t) ? t : 'overview' };
  }
  const m = hash.match(/^#\/m\/([a-z-]+)/);
  if (m && MODULES.some((x) => x.id === m[1])) return { page: 'module', id: m[1] as ModuleId };
  return { page: 'home' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    let prev = parse(window.location.hash);
    const on = () => {
      const next = parse(window.location.hash);
      if (next.page === 'money' && prev.page === 'money') {
        // Switching My Money tabs: keep the tab bar in view instead of jumping to the very top.
        const nav = document.getElementById('money-tabs');
        if (nav) window.scrollTo({ top: Math.min(window.scrollY, nav.getBoundingClientRect().top + window.scrollY - 64), behavior: 'instant' as ScrollBehavior });
      } else if (next.page !== 'intro') {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
      prev = next;
      setRoute(next);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const moduleHref = (id: ModuleId) => '#/m/' + id;
export const homeHref = '#/';
export const introHref = '#/intro';
export const moneyHref = '#/my-money';
