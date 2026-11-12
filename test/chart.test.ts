import { describe, expect, it } from 'vitest';
import { linePath, nightSpans, valueDomain } from '../src/logic/chart';

describe('valueDomain', () => {
  it('pads around the data and the normal band', () => {
    expect(valueDomain([190.2, null, 241.4], [207, 253])).toEqual([184, 259]);
    expect(valueDomain([], [207, 253])).toEqual([201, 259]);
  });
});

describe('linePath', () => {
  it('breaks the line at gaps', () => {
    const frame = { width: 40, height: 100, top: 0, domain: [200, 300] as const };

    expect(linePath([250, 250, null, 300], frame)).toBe('M5.0 50.0 L15.0 50.0 M35.0 0.0');
  });
});

describe('nightSpans', () => {
  it('returns local night intervals clipped to the window', () => {
    const start = new Date(2026, 0, 15, 20, 0).getTime();
    const end = new Date(2026, 0, 16, 20, 0).getTime();

    expect(nightSpans([start, end])).toEqual([
      [new Date(2026, 0, 15, 23).getTime(), new Date(2026, 0, 16, 6).getTime()],
    ]);
  });

  it('clips a night that is already in progress', () => {
    const start = new Date(2026, 0, 16, 2, 0).getTime();
    const end = new Date(2026, 0, 16, 12, 0).getTime();

    expect(nightSpans([start, end])).toEqual([[start, new Date(2026, 0, 16, 6).getTime()]]);
  });
});
