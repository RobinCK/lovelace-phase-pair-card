import type { ViewMode } from '../../types/config';
import { allView } from './all-view';
import { balanceView } from './balance-view';
import { singleView } from './single-view';
import type { CardView } from './types';

export const VIEWS: Readonly<Record<ViewMode, CardView>> = {
  all: allView,
  single: singleView,
  balance: balanceView,
};
