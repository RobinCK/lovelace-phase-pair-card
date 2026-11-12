import type { Range } from '../types/config';
import { clamp } from './thresholds';

export interface ChartFrame {
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly domain: Range;
}

export type TimeSpan = readonly [number, number];

export const NIGHT_HOURS: Range = [23, 6];

const DOMAIN_PADDING = 6;

export const valueDomain = (values: readonly (number | null)[], normal: Range): Range => {
  const numbers = values.filter((value): value is number => value !== null);
  const low = Math.min(normal[0], ...numbers);
  const high = Math.max(normal[1], ...numbers);

  return [Math.floor(low - DOMAIN_PADDING), Math.ceil(high + DOMAIN_PADDING)];
};

export const toY = (frame: ChartFrame, value: number): number => {
  const [min, max] = frame.domain;

  return frame.top + ((max - value) / (max - min)) * (frame.height - frame.top);
};

export const bucketX = (index: number, count: number, width: number): number =>
  ((index + 0.5) / count) * width;

export const bucketAt = (x: number, count: number, width: number): number =>
  clamp(Math.floor((x / width) * count), 0, count - 1);

export const bucketTime = (index: number, count: number, span: TimeSpan): number =>
  span[0] + ((index + 0.5) / count) * (span[1] - span[0]);

export const timeX = (time: number, span: TimeSpan, width: number): number =>
  ((time - span[0]) / (span[1] - span[0])) * width;

const toRuns = (values: readonly (number | null)[]): [number, number][][] =>
  values.reduce<[number, number][][]>((runs, value, index) => {
    if (value === null) return runs;

    const current = runs.at(-1);
    const previous = current?.at(-1);

    if (current && previous?.[0] === index - 1) {
      current.push([index, value]);

      return runs;
    }

    runs.push([[index, value]]);

    return runs;
  }, []);

const point = (frame: ChartFrame, count: number, [index, value]: [number, number]): string =>
  `${bucketX(index, count, frame.width).toFixed(1)} ${toY(frame, value).toFixed(1)}`;

export const linePath = (values: readonly (number | null)[], frame: ChartFrame): string =>
  toRuns(values)
    .map((run) => `M${run.map((entry) => point(frame, values.length, entry)).join(' L')}`)
    .join(' ');

export const areaPath = (values: readonly (number | null)[], frame: ChartFrame): string =>
  toRuns(values)
    .map((run) => {
      const first = bucketX(run[0][0], values.length, frame.width).toFixed(1);
      const last = bucketX(run[run.length - 1][0], values.length, frame.width).toFixed(1);
      const line = run.map((entry) => point(frame, values.length, entry)).join(' L');

      return `M${line} L${last} ${frame.height} L${first} ${frame.height} Z`;
    })
    .join(' ');

export const nightSpans = (span: TimeSpan, hours: Range = NIGHT_HOURS): TimeSpan[] => {
  const spans: TimeSpan[] = [];
  const day = new Date(span[0]);

  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - 1);

  while (day.getTime() < span[1]) {
    const from = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours[0]).getTime();
    const to = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, hours[1]).getTime();
    const clippedFrom = Math.max(from, span[0]);
    const clippedTo = Math.min(to, span[1]);

    if (clippedTo > clippedFrom) spans.push([clippedFrom, clippedTo]);

    day.setDate(day.getDate() + 1);
  }

  return spans;
};
