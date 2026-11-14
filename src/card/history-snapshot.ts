import { resample, summarize } from '../logic/series';
import type { Segment, Summary } from '../logic/series';
import type { TimeSpan } from '../logic/chart';

export interface SeriesSnapshot {
  readonly values: readonly (number | null)[];
  readonly summary: Summary | undefined;
}

export interface HistorySnapshot {
  readonly span: TimeSpan;
  readonly series: ReadonlyMap<string, SeriesSnapshot>;
}

export const createSnapshot = (
  segments: ReadonlyMap<string, readonly Segment[]>,
  span: TimeSpan,
  buckets: number,
): HistorySnapshot => ({
  span,
  series: new Map(
    [...segments].map(([entityId, list]) => [
      entityId,
      {
        values: resample(list, span[0], span[1], buckets),
        summary: summarize(list),
      },
    ]),
  ),
});
