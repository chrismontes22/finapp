import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ModuleId } from '../data/modules';

/** Each module is its own chunk, so the course map loads fast and charts load on demand. */
export const MODULE_COMPONENTS: Record<ModuleId, LazyExoticComponent<ComponentType>> = {
  'cash-flow': lazy(() => import('./m1-cash-flow')),
  banking: lazy(() => import('./m2-banking')),
  'credit-debt': lazy(() => import('./m3-credit-debt')),
  compounding: lazy(() => import('./m4-compounding')),
  investing: lazy(() => import('./m5-investing')),
  taxes: lazy(() => import('./m6-taxes')),
  risk: lazy(() => import('./m7-risk')),
  'big-decisions': lazy(() => import('./m8-big-decisions')),
};
