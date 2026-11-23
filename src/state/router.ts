import { useEffect, useState } from 'react';
import { isChapterId, type ChapterId } from '../data/course';

export const MONEY_TAB_IDS = ['overview', 'budget', 'net-worth', 'goals', 'check-ins'] as const;
export type MoneyTabId = (typeof MONEY_TAB_IDS)[number];

export type Route =
  | { page: 'home' }
  | { page: 'intro' }
  | { page: 'chapter'; id: ChapterId; section?: string }
  | { page: 'money'; tab: MoneyTabId };

function parse(hash: string): Route {
  if (hash === '#/intro') return { page: 'intro' };
  const money = hash.match(/^#\/my-money(?:\/([a-z-]+))?/);
  if (money) {
    const t = money[1] as MoneyTabId | undefined;
    return { page: 'money', tab: t && (MONEY_TAB_IDS as readonly string[]).includes(t) ? t : 'overview' };
  }
  const c = hash.match(/^#\/c\/([a-z-]+)(?:\/([a-z0-9-]+))?/);
  if (c && isChapterId(c[1])) return { page: 'chapter', id: c[1], section: c[2] };
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
      } else if (next.page === 'chapter' && next.section) {
        // ChapterLayout scrolls to the requested section itself.
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

export const chapterHref = (id: ChapterId, section?: string) => '#/c/' + id + (section ? '/' + section : '');
/** The section part of a chapter link (#/c/cash-flow/1-2 -> "1-2"), if any. */
export const sectionFromHash = (hash: string) => hash.match(/^#\/c\/[a-z-]+\/([a-z0-9-]+)/)?.[1];
export const homeHref = '#/';
export const introHref = '#/intro';
export const moneyHref = '#/my-money';
