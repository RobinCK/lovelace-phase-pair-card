import { describe, expect, it } from 'vitest';
import { resample, summarize } from '../src/logic/series';

describe('resample', () => {
  it('averages held values over each bucket by time', () => {
    const samples = [
      { time: 0, value: 220 },
      { time: 30, value: 240 },
    ];

    expect(resample(samples, 0, 100, 2)).toEqual([228, 240]);
  });

  it('carries the last known value forward and starts from a state before the window', () => {
    const samples = [{ time: -50, value: 230 }];

    expect(resample(samples, 0, 40, 4)).toEqual([230, 230, 230, 230]);
  });

  it('leaves gaps where there is no data or the sensor is unavailable', () => {
    const samples = [
      { time: 20, value: 230 },
      { time: 40, value: null },
      { time: 60, value: 228 },
    ];

    expect(resample(samples, 0, 80, 4)).toEqual([null, 230, null, 228]);
  });

  it('returns nothing for an empty window', () => {
    expect(resample([{ time: 0, value: 230 }], 10, 10, 4)).toEqual([]);
  });
});

describe('summarize', () => {
  it('finds extremes with their time and the time-weighted average', () => {
    const samples = [
      { time: 0, value: 220 },
      { time: 25, value: 240 },
      { time: 50, value: null },
      { time: 75, value: 210 },
    ];
    const summary = summarize(samples, 0, 100);

    expect(summary?.min).toEqual({ value: 210, time: 75 });
    expect(summary?.max).toEqual({ value: 240, time: 25 });
    expect(summary?.average).toBeCloseTo((220 * 25 + 240 * 25 + 210 * 25) / 75, 6);
  });

  it('is undefined without numeric data', () => {
    expect(summarize([{ time: 0, value: null }], 0, 10)).toBeUndefined();
    expect(summarize([], 0, 10)).toBeUndefined();
  });
});
