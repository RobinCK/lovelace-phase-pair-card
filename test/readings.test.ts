import { describe, expect, it } from 'vitest';
import { parseNumericState, readEntity } from '../src/ha/readings';
import type { HassEntities, HassEntity } from '../src/types/ha';

const entity = (entityId: string, state: string, unit?: string): HassEntity => ({
  entity_id: entityId,
  state,
  attributes: unit ? { unit_of_measurement: unit } : {},
  last_changed: '2026-01-01T00:00:00Z',
  last_updated: '2026-01-01T00:00:00Z',
});

const states: HassEntities = {
  'sensor.voltage': entity('sensor.voltage', '229.8', 'V'),
  'sensor.power_kw': entity('sensor.power_kw', '2.84', 'kW'),
  'sensor.offline': entity('sensor.offline', 'unavailable'),
  'sensor.pending': entity('sensor.pending', 'unknown'),
  'sensor.text': entity('sensor.text', 'on'),
};

describe('readEntity', () => {
  it('reads numeric states', () => {
    expect(readEntity(states, 'sensor.voltage', 'voltage')).toEqual({
      status: 'ok',
      entityId: 'sensor.voltage',
      value: 229.8,
    });
  });

  it('converts power units to watts', () => {
    expect(readEntity(states, 'sensor.power_kw', 'power')).toMatchObject({ value: 2840 });
  });

  it('reports every kind of missing value', () => {
    expect(readEntity(states, undefined, 'voltage').status).toBe('unset');
    expect(readEntity(states, 'sensor.nope', 'voltage').status).toBe('missing');
    expect(readEntity(states, 'sensor.offline', 'voltage').status).toBe('unavailable');
    expect(readEntity(states, 'sensor.pending', 'voltage').status).toBe('unknown');
    expect(readEntity(states, 'sensor.text', 'voltage').status).toBe('invalid');
  });
});

describe('parseNumericState', () => {
  it('accepts numbers and rejects everything else', () => {
    expect(parseNumericState('231.2')).toBe(231.2);
    expect(parseNumericState('')).toBeUndefined();
    expect(parseNumericState('  ')).toBeUndefined();
    expect(parseNumericState('NaN')).toBeUndefined();
    expect(parseNumericState('12 V')).toBeUndefined();
  });
});
