import { describe, expect, it } from 'vitest';
import { resample, samplesToSegments, summarize } from '../src/logic/series';

describe('samplesToSegments', () => {
  it('holds each value until the next sample and clips to the window', () => {
    const samples = [
      { time: -50, value: 230 },
      { time: 30, value: null },
      { time: 60, value: 228 },
    ];

    expect(samplesToSegments(samples, 0, 100)).toEqual([
      { from: 0, to: 30, value: 230 },
      { from: 30, to: 60, value: null },
      { from: 60, to: 100, value: 228 },
    ]);
  });
});

describe('resample', () => {
  it('averages held values over each bucket by time', () => {
    const segments = samplesToSegments(
      [
        { time: 0, value: 220 },
        { time: 30, value: 240 },
      ],
      0,
      100,
    );

    expect(resample(segments, 0, 100, 2)).toEqual([228, 240]);
  });

  it('carries the last known value forward and starts from a state before the window', () => {
    const segments = samplesToSegments([{ time: -50, value: 230 }], 0, 40);

    expect(resample(segments, 0, 40, 4)).toEqual([230, 230, 230, 230]);
  });

  it('leaves gaps where there is no data or the sensor is unavailable', () => {
    const segments = samplesToSegments(
      [
        { time: 20, value: 230 },
        { time: 40, value: null },
        { time: 60, value: 228 },
      ],
      0,
      80,
    );

    expect(resample(segments, 0, 80, 4)).toEqual([null, 230, null, 228]);
  });

  it('leaves gaps between statistic periods', () => {
    const segments = [
      { from: 0, to: 25, value: 230 },
      { from: 75, to: 100, value: 220 },
    ];

    expect(resample(segments, 0, 100, 4)).toEqual([230, null, null, 220]);
  });

  it('returns nothing for an empty window', () => {
    expect(resample([{ from: 0, to: 10, value: 230 }], 10, 10, 4)).toEqual([]);
  });
});

describe('summarize', () => {
  it('finds extremes with their time and the time-weighted average', () => {
    const segments = samplesToSegments(
      [
        { time: 0, value: 220 },
        { time: 25, value: 240 },
        { time: 50, value: null },
        { time: 75, value: 210 },
      ],
      0,
      100,
    );
    const summary = summarize(segments);

    expect(summary?.min).toEqual({ value: 210, time: 75 });
    expect(summary?.max).toEqual({ value: 240, time: 25 });
    expect(summary?.average).toBeCloseTo((220 * 25 + 240 * 25 + 210 * 25) / 75, 6);
  });

  it('uses the minimum and maximum of statistic periods', () => {
    const summary = summarize([
      { from: 0, to: 300, value: 229, min: 212.4, max: 233 },
      { from: 300, to: 600, value: 231, min: 228, max: 247.9 },
    ]);

    expect(summary?.min).toEqual({ value: 212.4, time: 0 });
    expect(summary?.max).toEqual({ value: 247.9, time: 300 });
    expect(summary?.average).toBe(230);
  });

  it('is undefined without numeric data', () => {
    expect(summarize([{ from: 0, to: 10, value: null }])).toBeUndefined();
    expect(summarize([])).toBeUndefined();
  });
});
