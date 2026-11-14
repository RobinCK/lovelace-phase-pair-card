import { describe, expect, it } from 'vitest';
import {
  currentImbalance,
  imbalanceStatus,
  neutralCurrent,
  neutralPhasor,
  ringStep,
  stepDecimals,
} from '../src/logic/phasor';

describe('neutralCurrent', () => {
  it('is the vector sum of three phases 120° apart', () => {
    expect(neutralCurrent([6.4, 4.1, 3.6])).toBeCloseTo(2.59, 2);
  });

  it('is zero for a balanced load', () => {
    expect(neutralCurrent([5, 5, 5])).toBeCloseTo(0, 10);
  });

  it('equals the current of the only loaded phase', () => {
    expect(neutralCurrent([7, 0, 0])).toBeCloseTo(7, 10);
    expect(neutralCurrent([0, 0, 3])).toBeCloseTo(3, 10);
  });

  it('matches the closed formula', () => {
    const [a, b, c] = [8.2, 1.3, 4.7];
    const expected = Math.sqrt(a * a + b * b + c * c - a * b - b * c - c * a);

    expect(neutralCurrent([a, b, c])).toBeCloseTo(expected, 10);
  });

  it('points towards the most loaded phase', () => {
    const neutral = neutralPhasor([6.4, 4.1, 3.6]);

    expect(neutral.y).toBeGreaterThan(0);
    expect(Math.abs(neutral.x)).toBeLessThan(neutral.y);
  });
});

describe('currentImbalance', () => {
  it('is the largest deviation from the average in percent', () => {
    expect(currentImbalance([6.4, 4.1, 3.6])).toBeCloseTo(36.17, 2);
  });

  it('is zero for equal currents', () => {
    expect(currentImbalance([3, 3, 3])).toBe(0);
  });

  it('is undefined without load', () => {
    expect(currentImbalance([0, 0, 0])).toBeUndefined();
    expect(currentImbalance([])).toBeUndefined();
  });
});

describe('imbalanceStatus', () => {
  const thresholds = { warning: 20, critical: 50 };

  it.each([
    [5, 'normal'],
    [19.9, 'normal'],
    [20, 'warning'],
    [36, 'warning'],
    [50, 'critical'],
  ] as const)('classifies %d %% as %s', (percent, expected) => {
    expect(imbalanceStatus(percent, thresholds)).toBe(expected);
  });
});

describe('ringStep', () => {
  it('picks a round step that gives about three rings', () => {
    expect(ringStep(6.4)).toBe(2);
    expect(ringStep(16)).toBe(5);
    expect(ringStep(0.9)).toBe(0.25);
    expect(ringStep(31)).toBe(10);
  });

  it('falls back to a 1 A scale without load', () => {
    expect(ringStep(0)).toBe(0.25);
  });

  it('counts the decimals of a step', () => {
    expect(stepDecimals(2)).toBe(0);
    expect(stepDecimals(2.5)).toBe(1);
    expect(stepDecimals(0.25)).toBe(2);
  });
});
