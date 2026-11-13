import type { TemplateResult } from 'lit';
import type { FormatLocale } from '../../logic/format';
import type { CardSettings } from '../../types/config';
import type { HistorySnapshot } from '../history-snapshot';
import type { PhaseModel } from '../model';

export interface ViewContext {
  readonly settings: CardSettings;
  readonly phases: readonly PhaseModel[];
  readonly locale: FormatLocale;
  readonly history: HistorySnapshot | undefined;
  readonly openMoreInfo: (entityId: string) => void;
}

export type CardSurface = 'framed' | 'bare';

export interface CardView {
  readonly usesHistory: boolean;
  readonly surface: CardSurface;
  readonly render: (context: ViewContext) => TemplateResult;
  readonly cardSize: (settings: CardSettings) => number;
}
