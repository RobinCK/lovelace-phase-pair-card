import type { HassEntities } from '../types/ha';

export type Quantity = 'voltage' | 'power';

export type ReadingIssue = 'unset' | 'missing' | 'unavailable' | 'unknown' | 'invalid';

export interface ValueReading {
  readonly status: 'ok';
  readonly entityId: string;
  readonly value: number;
}

export interface IssueReading {
  readonly status: ReadingIssue;
  readonly entityId: string | undefined;
}

export type Reading = ValueReading | IssueReading;

const UNIT_FACTORS: Readonly<Record<Quantity, Readonly<Partial<Record<string, number>>>>> = {
  voltage: { mV: 0.001, V: 1, kV: 1000 },
  power: { mW: 0.001, W: 1, kW: 1000, MW: 1_000_000 },
};

const STATE_ISSUES: Readonly<Partial<Record<string, ReadingIssue>>> = {
  unavailable: 'unavailable',
  unknown: 'unknown',
};

export const isValue = (reading: Reading): reading is ValueReading => reading.status === 'ok';

export const unitFactor = (quantity: Quantity, unit: unknown): number => {
  if (typeof unit !== 'string') return 1;

  return UNIT_FACTORS[quantity][unit] ?? 1;
};

export const parseNumericState = (state: string): number | undefined => {
  if (state.trim() === '') return undefined;

  const value = Number(state);

  return Number.isFinite(value) ? value : undefined;
};

export const readEntity = (
  states: HassEntities,
  entityId: string | undefined,
  quantity: Quantity,
): Reading => {
  if (!entityId) return { status: 'unset', entityId: undefined };

  const entity = states[entityId];

  if (!entity) return { status: 'missing', entityId };

  const issue = STATE_ISSUES[entity.state];

  if (issue) return { status: issue, entityId };

  const value = parseNumericState(entity.state);

  if (value === undefined) return { status: 'invalid', entityId };

  return {
    status: 'ok',
    entityId,
    value: value * unitFactor(quantity, entity.attributes.unit_of_measurement),
  };
};
