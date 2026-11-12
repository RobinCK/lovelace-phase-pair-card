import { describe, expect, it } from 'vitest';
import { DEFAULT_VOLTAGE } from '../src/config/defaults';
import { ConfigError, normalizeConfig } from '../src/config/validate';

const phase = {
  name: 'L1',
  color: '#d32f2f',
  before: { voltage: 'sensor.zig_meter_raw_l1_voltage', power: 'sensor.zig_meter_raw_l1_power' },
  after: { voltage: 'sensor.zig_meter_house_l1_voltage' },
};

const base = { type: 'custom:phase-pair-card', phases: [phase] };

const errorOf = (config: unknown): string => {
  try {
    normalizeConfig(config);
  } catch (error) {
    if (error instanceof ConfigError) return error.message;

    throw error;
  }

  throw new Error('Expected a configuration error');
};

describe('normalizeConfig', () => {
  it('applies defaults', () => {
    const settings = normalizeConfig(base);

    expect(settings.view).toBe('all');
    expect(settings.labels).toEqual({ before: 'Before', after: 'After' });
    expect(settings.voltage).toEqual(DEFAULT_VOLTAGE);
    expect(settings.showPower).toBe(true);
    expect(settings.showDelta).toBe(true);
    expect(settings.showImbalance).toBe(true);
    expect(settings.hoursToShow).toBe(24);
    expect(settings.phases[0]).toEqual({
      name: 'L1',
      color: '#d32f2f',
      before: {
        voltage: 'sensor.zig_meter_raw_l1_voltage',
        power: 'sensor.zig_meter_raw_l1_power',
      },
      after: { voltage: 'sensor.zig_meter_house_l1_voltage', power: undefined },
    });
  });

  it('fills in missing phase names and colors', () => {
    const settings = normalizeConfig({ ...base, phases: [{}, {}] });

    expect(settings.phases.map((item) => [item.name, item.color])).toEqual([
      ['L1', '#d32f2f'],
      ['L2', '#000000'],
    ]);
  });

  it('keeps custom thresholds and labels', () => {
    const settings = normalizeConfig({
      ...base,
      before_label: 'Raw',
      after_label: 'House',
      voltage: { nominal: 220, normal: [200, 240], critical: [190, 250], scale: [150, 270] },
    });

    expect(settings.labels).toEqual({ before: 'Raw', after: 'House' });
    expect(settings.voltage).toEqual({
      nominal: 220,
      normal: [200, 240],
      critical: [190, 250],
      scale: [150, 270],
    });
  });

  it('rejects a missing phase list', () => {
    expect(errorOf({ type: 'custom:phase-pair-card' })).toBe(
      'Add at least one phase under "phases".',
    );
    expect(errorOf({ ...base, phases: [] })).toBe('Add at least one phase under "phases".');
  });

  it('explains invalid entity ids', () => {
    expect(errorOf({ ...base, phases: [{ ...phase, after: { voltage: 'house voltage' } }] })).toBe(
      'Phase "L1": "after.voltage" must be an entity id such as "sensor.l1_voltage" (got "house voltage").',
    );
  });

  it('explains invalid colors', () => {
    expect(errorOf({ ...base, phases: [{ ...phase, color: 'red' }] })).toBe(
      'Phase "L1": "color" must be a hex color such as "#d32f2f" (got "red").',
    );
  });

  it('explains reversed and malformed ranges', () => {
    expect(errorOf({ ...base, voltage: { normal: [253, 207] } })).toBe(
      '"voltage.normal" must list the lower value first (got [253, 207]).',
    );
    expect(errorOf({ ...base, voltage: { scale: 160 } })).toBe(
      '"voltage.scale" must be two numbers written as [min, max] (got 160).',
    );
  });

  it('requires the normal range to sit inside the critical range', () => {
    expect(errorOf({ ...base, voltage: { normal: [190, 253] } })).toBe(
      '"voltage.normal" must lie within "voltage.critical": voltage.normal is [190, 253], voltage.critical is [195, 264].',
    );
  });

  it('validates view, booleans and history length', () => {
    expect(errorOf({ ...base, view: 'grid' })).toBe(
      '"view" must be "all" or "single" (got "grid").',
    );
    expect(errorOf({ ...base, show_power: 'yes' })).toBe(
      '"show_power" must be true or false (got "yes").',
    );
    expect(errorOf({ ...base, hours_to_show: 0 })).toBe(
      '"hours_to_show" must be a whole number from 1 to 168 (got 0).',
    );
  });

  it('rejects a configuration that is not an object', () => {
    expect(errorOf('phases')).toBe('The card configuration must be an object (got "phases").');
  });
});
