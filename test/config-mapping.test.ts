import { describe, expect, it } from 'vitest';
import { updateSensor } from '../src/editor/config-mapping';
import type { PhasePairCardConfig } from '../src/types/config';

const config: PhasePairCardConfig = {
  type: 'custom:phase-pair-card',
  phases: [{ name: 'L1', before: { voltage: 'sensor.raw_l1_voltage' } }, { name: 'L2' }],
};

describe('updateSensor', () => {
  it('sets a sensor and keeps the other one', () => {
    const next = updateSensor(config, 0, 'before', 'power', 'sensor.raw_l1_power');

    expect(next.phases[0].before).toEqual({
      voltage: 'sensor.raw_l1_voltage',
      power: 'sensor.raw_l1_power',
    });
    expect(next.phases[1]).toBe(config.phases[1]);
  });

  it('removes a cleared sensor from the configuration', () => {
    const next = updateSensor(config, 0, 'before', 'voltage', '');

    expect(next.phases[0].before).toEqual({});
  });

  it('creates the side when it is missing', () => {
    const next = updateSensor(config, 1, 'after', 'voltage', 'sensor.house_l2_voltage');

    expect(next.phases[1]).toEqual({ name: 'L2', after: { voltage: 'sensor.house_l2_voltage' } });
  });
});
