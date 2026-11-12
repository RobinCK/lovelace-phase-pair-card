import { describe, expect, it } from 'vitest';
import { phaseImbalance } from '../src/logic/imbalance';

describe('phaseImbalance', () => {
  it('returns max minus min across phases', () => {
    expect(phaseImbalance([218.6, 257.3, 199.4])).toBeCloseTo(57.9, 5);
  });

  it('is zero for equal voltages', () => {
    expect(phaseImbalance([230, 230, 230])).toBe(0);
  });

  it('works with two phases', () => {
    expect(phaseImbalance([228.3, 231])).toBeCloseTo(2.7, 5);
  });

  it('is undefined when fewer than two values are known', () => {
    expect(phaseImbalance([])).toBeUndefined();
    expect(phaseImbalance([230])).toBeUndefined();
  });
});
