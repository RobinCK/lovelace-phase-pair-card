import type { Sample } from '../logic/series';
import type { HomeAssistant } from '../types/ha';
import { parseNumericState, unitFactor } from './readings';
import type { Quantity } from './readings';

export interface CompressedState {
  readonly s: string;
  readonly lu?: number;
  readonly lc?: number;
}

type HistoryResponse = Readonly<Record<string, readonly CompressedState[] | undefined>>;

export const toSamples = (states: readonly CompressedState[], factor: number): Sample[] =>
  states.flatMap((state) => {
    const seconds = state.lu ?? state.lc;

    if (seconds === undefined) return [];

    const value = parseNumericState(state.s);

    return [{ time: seconds * 1000, value: value === undefined ? null : value * factor }];
  });

export const fetchHistory = async (
  hass: HomeAssistant,
  entityIds: readonly string[],
  start: number,
  end: number,
  quantity: Quantity,
): Promise<Map<string, Sample[]>> => {
  if (entityIds.length === 0) return new Map();

  const response = await hass.callWS<HistoryResponse>({
    type: 'history/history_during_period',
    start_time: new Date(start).toISOString(),
    end_time: new Date(end).toISOString(),
    entity_ids: entityIds,
    minimal_response: true,
    no_attributes: true,
    significant_changes_only: false,
  });

  return new Map(
    entityIds.map((entityId) => {
      const factor = unitFactor(quantity, hass.states[entityId]?.attributes.unit_of_measurement);

      return [entityId, toSamples(response[entityId] ?? [], factor)];
    }),
  );
};
