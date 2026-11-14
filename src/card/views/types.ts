import type { TemplateResult } from 'lit';
import type { Quantity } from '../../ha/readings';
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

export interface HistoryRequest {
  readonly quantity: Quantity;
  readonly entityIds: readonly string[];
  readonly buckets: number;
}

export interface CardView {
  readonly surface: CardSurface;
  readonly history: (settings: CardSettings) => HistoryRequest | undefined;
  readonly render: (context: ViewContext) => TemplateResult;
  readonly cardSize: (settings: CardSettings) => number;
}
