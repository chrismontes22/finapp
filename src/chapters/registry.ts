import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ChapterId } from '../data/course';

/** Each chapter is its own chunk, so the course map loads fast and charts load on demand. */
export const CHAPTER_COMPONENTS: Record<ChapterId, LazyExoticComponent<ComponentType>> = {
  'cash-flow': lazy(() => import('./c1-cash-flow')),
  banking: lazy(() => import('./c2-banking')),
  'safety-net': lazy(() => import('./c3-safety-net')),
  income: lazy(() => import('./c4-income')),
  investing: lazy(() => import('./c5-investing')),
  retirement: lazy(() => import('./c6-retirement')),
  assets: lazy(() => import('./c7-assets')),
  protection: lazy(() => import('./c8-protection')),
  freedom: lazy(() => import('./c9-freedom')),
};
