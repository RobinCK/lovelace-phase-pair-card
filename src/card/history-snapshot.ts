import { resample, summarize } from '../logic/series';
import type { Sample, Summary } from '../logic/series';
import type { TimeSpan } from '../logic/chart';

export const CHART_BUCKETS = 288;

export interface SeriesSnapshot {
  readonly values: readonly (number | null)[];
  readonly summary: Summary | undefined;
}

export interface HistorySnapshot {
  readonly span: TimeSpan;
  readonly series: ReadonlyMap<string, SeriesSnapshot>;
}

export const createSnapshot = (
  samples: ReadonlyMap<string, readonly Sample[]>,
  span: TimeSpan,
): HistorySnapshot => ({
  span,
  series: new Map(
    [...samples].map(([entityId, list]) => [
      entityId,
      {
        values: resample(list, span[0], span[1], CHART_BUCKETS),
        summary: summarize(list, span[0], span[1]),
      },
    ]),
  ),
});
