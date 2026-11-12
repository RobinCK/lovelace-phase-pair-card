import { describe, expect, it } from 'vitest';
import { DEFAULT_VOLTAGE } from '../src/config/defaults';
import { clamp, isWithin, scalePosition, voltageStatus } from '../src/logic/thresholds';

describe('voltageStatus', () => {
  it.each([
    [230, 'normal'],
    [207, 'normal'],
    [253, 'normal'],
    [206.9, 'warning'],
    [253.1, 'warning'],
    [195, 'warning'],
    [264, 'warning'],
    [194.9, 'critical'],
    [264.1, 'critical'],
    [0, 'critical'],
  ] as const)('classifies %d V as %s', (value, expected) => {
    expect(voltageStatus(value, DEFAULT_VOLTAGE)).toBe(expected);
  });

  it('respects custom thresholds', () => {
    const thresholds = { normal: [220, 240], critical: [210, 250] } as const;

    expect(voltageStatus(215, thresholds)).toBe('warning');
    expect(voltageStatus(205, thresholds)).toBe('critical');
    expect(voltageStatus(225, thresholds)).toBe('normal');
  });
});

describe('scalePosition', () => {
  it('maps a value to a percentage of the scale', () => {
    expect(scalePosition(160, DEFAULT_VOLTAGE.scale)).toBe(0);
    expect(scalePosition(220, DEFAULT_VOLTAGE.scale)).toBe(50);
    expect(scalePosition(280, DEFAULT_VOLTAGE.scale)).toBe(100);
  });

  it('clamps values outside the scale', () => {
    expect(scalePosition(100, DEFAULT_VOLTAGE.scale)).toBe(0);
    expect(scalePosition(300, DEFAULT_VOLTAGE.scale)).toBe(100);
  });
});

describe('helpers', () => {
  it('clamps numbers', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('checks open range membership', () => {
    expect(isWithin(200, [190, 250])).toBe(true);
    expect(isWithin(190, [190, 250])).toBe(false);
  });
});
