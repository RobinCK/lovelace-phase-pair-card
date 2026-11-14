import type { TimeSpan } from '../logic/chart';
import { samplesToSegments } from '../logic/series';
import type { Segment } from '../logic/series';
import type { HomeAssistant } from '../types/ha';
import { fetchHistory } from './history';
import type { Quantity } from './readings';
import { fetchStatistics } from './statistics';

const lastEnd = (segments: readonly Segment[] | undefined): number | undefined =>
  segments?.at(-1)?.to;

const loadStatistics = async (
  hass: HomeAssistant,
  entityIds: readonly string[],
  span: TimeSpan,
  quantity: Quantity,
): Promise<Map<string, Segment[]>> => {
  try {
    return await fetchStatistics(hass, entityIds, span, quantity);
  } catch {
    return new Map();
  }
};

export const loadSegments = async (
  hass: HomeAssistant,
  entityIds: readonly string[],
  span: TimeSpan,
  quantity: Quantity,
): Promise<Map<string, Segment[]>> => {
  const statistics = await loadStatistics(hass, entityIds, span, quantity);
  const covered = entityIds.filter((entityId) => lastEnd(statistics.get(entityId)) !== undefined);
  const uncovered = entityIds.filter((entityId) => !covered.includes(entityId));
  const tailStart = Math.min(
    span[1],
    ...covered.map((entityId) => lastEnd(statistics.get(entityId)) ?? span[1]),
  );
  const [tail, full] = await Promise.all([
    fetchHistory(hass, covered, tailStart, span[1], quantity),
    fetchHistory(hass, uncovered, span[0], span[1], quantity),
  ]);

  return new Map(
    entityIds.map((entityId) => {
      const statisticSegments = statistics.get(entityId) ?? [];
      const coveredUntil = lastEnd(statisticSegments);

      if (coveredUntil === undefined) {
        return [entityId, samplesToSegments(full.get(entityId) ?? [], span[0], span[1])];
      }

      return [
        entityId,
        [
          ...statisticSegments,
          ...samplesToSegments(tail.get(entityId) ?? [], coveredUntil, span[1]),
        ],
      ];
    }),
  );
};
