import type { TimeSpan } from '../logic/chart';
import { samplesToSegments } from '../logic/series';
import type { Segment } from '../logic/series';
import type { HomeAssistant } from '../types/ha';
import { fetchVoltageHistory } from './history';
import { fetchVoltageStatistics } from './statistics';

const lastEnd = (segments: readonly Segment[] | undefined): number | undefined =>
  segments?.at(-1)?.to;

const loadStatistics = async (
  hass: HomeAssistant,
  entityIds: readonly string[],
  span: TimeSpan,
): Promise<Map<string, Segment[]>> => {
  try {
    return await fetchVoltageStatistics(hass, entityIds, span);
  } catch {
    return new Map();
  }
};

export const loadVoltageSegments = async (
  hass: HomeAssistant,
  entityIds: readonly string[],
  span: TimeSpan,
): Promise<Map<string, Segment[]>> => {
  const statistics = await loadStatistics(hass, entityIds, span);
  const covered = entityIds.filter((entityId) => lastEnd(statistics.get(entityId)) !== undefined);
  const uncovered = entityIds.filter((entityId) => !covered.includes(entityId));
  const tailStart = Math.min(
    span[1],
    ...covered.map((entityId) => lastEnd(statistics.get(entityId)) ?? span[1]),
  );
  const [tail, full] = await Promise.all([
    fetchVoltageHistory(hass, covered, tailStart, span[1]),
    fetchVoltageHistory(hass, uncovered, span[0], span[1]),
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
