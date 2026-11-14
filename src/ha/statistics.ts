import type { TimeSpan } from '../logic/chart';
import type { Segment } from '../logic/series';
import type { HomeAssistant } from '../types/ha';
import type { Quantity } from './readings';

export interface StatisticRow {
  readonly start: number;
  readonly end: number;
  readonly mean?: number | null;
  readonly min?: number | null;
  readonly max?: number | null;
}

type StatisticsResponse = Readonly<Record<string, readonly StatisticRow[] | undefined>>;

const STATISTIC_UNITS: Readonly<Record<Quantity, Readonly<Record<string, string>>>> = {
  voltage: { voltage: 'V' },
  power: { power: 'W' },
  current: { electric_current: 'A' },
};

export const toStatisticSegments = (rows: readonly StatisticRow[], span: TimeSpan): Segment[] =>
  rows.flatMap((row) => {
    const from = Math.max(row.start, span[0]);
    const to = Math.min(row.end, span[1]);

    if (to <= from || row.mean === undefined || row.mean === null) return [];

    return [{ from, to, value: row.mean, min: row.min ?? undefined, max: row.max ?? undefined }];
  });

export const fetchStatistics = async (
  hass: HomeAssistant,
  entityIds: readonly string[],
  span: TimeSpan,
  quantity: Quantity,
): Promise<Map<string, Segment[]>> => {
  if (entityIds.length === 0) return new Map();

  const response = await hass.callWS<StatisticsResponse>({
    type: 'recorder/statistics_during_period',
    start_time: new Date(span[0]).toISOString(),
    end_time: new Date(span[1]).toISOString(),
    statistic_ids: entityIds,
    period: '5minute',
    types: ['mean', 'min', 'max'],
    units: STATISTIC_UNITS[quantity],
  });

  return new Map(
    entityIds.map((entityId) => [entityId, toStatisticSegments(response[entityId] ?? [], span)]),
  );
};
