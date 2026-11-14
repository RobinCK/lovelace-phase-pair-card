import { describe, expect, it } from 'vitest';
import { toStatisticSegments } from '../src/ha/statistics';
import { loadSegments } from '../src/ha/segment-source';
import type { HomeAssistant } from '../src/types/ha';

type Message = Readonly<Record<string, unknown>>;

const createHass = (
  respond: (message: Message) => unknown,
): HomeAssistant & { calls: Message[] } => {
  const calls: Message[] = [];

  return {
    calls,
    states: {},
    locale: { language: 'en' },
    language: 'en',
    callWS: <T>(message: Message): Promise<T> => {
      calls.push(message);

      return Promise.resolve(respond(message) as T);
    },
  };
};

const seconds = (ms: number): number => ms / 1000;

describe('toStatisticSegments', () => {
  it('turns statistic rows into clipped segments and skips empty periods', () => {
    const rows = [
      { start: 0, end: 300, mean: 229, min: 225, max: 233 },
      { start: 300, end: 600, mean: null, min: null, max: null },
      { start: 600, end: 900, mean: 231, min: 230, max: 232 },
    ];

    expect(toStatisticSegments(rows, [100, 700])).toEqual([
      { from: 100, to: 300, value: 229, min: 225, max: 233 },
      { from: 600, to: 700, value: 231, min: 230, max: 232 },
    ]);
  });
});

describe('loadSegments', () => {
  it('uses statistics and fills only the recent tail from history', async () => {
    const hass = createHass((message) => {
      if (message.type === 'recorder/statistics_during_period') {
        return { 'sensor.house': [{ start: 0, end: 600_000, mean: 230, min: 228, max: 232 }] };
      }

      return { 'sensor.house': [{ s: '231', lu: seconds(600_000) }] };
    });

    const segments = await loadSegments(hass, ['sensor.house'], [0, 900_000], 'voltage');

    expect(segments.get('sensor.house')).toEqual([
      { from: 0, to: 600_000, value: 230, min: 228, max: 232 },
      { from: 600_000, to: 900_000, value: 231 },
    ]);
    expect(hass.calls.map((call) => call.type)).toEqual([
      'recorder/statistics_during_period',
      'history/history_during_period',
    ]);
    expect(hass.calls[0]).toMatchObject({ units: { voltage: 'V' } });
    expect(hass.calls[1]).toMatchObject({
      entity_ids: ['sensor.house'],
      start_time: new Date(600_000).toISOString(),
    });
  });

  it('falls back to the full history for sensors without statistics', async () => {
    const hass = createHass((message) => {
      if (message.type === 'recorder/statistics_during_period') return {};

      return { 'sensor.raw': [{ s: '219', lu: seconds(0) }] };
    });

    const segments = await loadSegments(hass, ['sensor.raw'], [0, 900_000], 'voltage');

    expect(segments.get('sensor.raw')).toEqual([{ from: 0, to: 900_000, value: 219 }]);
    expect(hass.calls[1]).toMatchObject({ start_time: new Date(0).toISOString() });
  });

  it('requests currents in amperes', async () => {
    const hass = createHass(() => ({}));

    await loadSegments(hass, ['sensor.l1_current'], [0, 900_000], 'current');

    expect(hass.calls[0]).toMatchObject({ units: { electric_current: 'A' } });
  });

  it('falls back to history when statistics cannot be loaded', async () => {
    const hass = createHass((message) => {
      if (message.type === 'recorder/statistics_during_period') throw new Error('not supported');

      return { 'sensor.raw': [{ s: '219', lu: seconds(0) }] };
    });

    const segments = await loadSegments(hass, ['sensor.raw'], [0, 900_000], 'voltage');

    expect(segments.get('sensor.raw')).toEqual([{ from: 0, to: 900_000, value: 219 }]);
  });
});
