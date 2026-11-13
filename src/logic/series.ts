export interface Sample {
  readonly time: number;
  readonly value: number | null;
}

export interface Segment {
  readonly from: number;
  readonly to: number;
  readonly value: number | null;
  readonly min?: number;
  readonly max?: number;
}

export interface Extreme {
  readonly value: number;
  readonly time: number;
}

export interface Summary {
  readonly min: Extreme;
  readonly max: Extreme;
  readonly average: number;
}

interface ValueSegment extends Segment {
  readonly value: number;
}

const hasValue = (segment: Segment): segment is ValueSegment => segment.value !== null;

export const samplesToSegments = (
  samples: readonly Sample[],
  start: number,
  end: number,
): Segment[] => {
  const sorted = [...samples].sort((a, b) => a.time - b.time);

  return sorted.flatMap((sample, index) => {
    const nextTime = index + 1 < sorted.length ? sorted[index + 1].time : end;
    const from = Math.max(sample.time, start);
    const to = Math.min(nextTime, end);

    return to > from ? [{ from, to, value: sample.value }] : [];
  });
};

export const resample = (
  segments: readonly Segment[],
  start: number,
  end: number,
  buckets: number,
): (number | null)[] => {
  if (buckets < 1 || end <= start) return [];

  const width = (end - start) / buckets;
  const sums = new Array<number>(buckets).fill(0);
  const weights = new Array<number>(buckets).fill(0);

  for (const segment of segments.filter(hasValue)) {
    const from = Math.max(segment.from, start);
    const to = Math.min(segment.to, end);
    const first = Math.max(0, Math.floor((from - start) / width));
    const last = Math.min(buckets - 1, Math.floor((to - start) / width));

    for (let bucket = first; bucket <= last; bucket += 1) {
      const overlap =
        Math.min(to, start + (bucket + 1) * width) - Math.max(from, start + bucket * width);

      if (overlap <= 0) continue;

      sums[bucket] += segment.value * overlap;
      weights[bucket] += overlap;
    }
  }

  return sums.map((sum, bucket) => (weights[bucket] > 0 ? sum / weights[bucket] : null));
};

export const summarize = (segments: readonly Segment[]): Summary | undefined => {
  const valued = segments.filter(hasValue);

  if (valued.length === 0) return undefined;

  const lowest = (segment: ValueSegment): number => segment.min ?? segment.value;
  const highest = (segment: ValueSegment): number => segment.max ?? segment.value;
  const min = valued.reduce((best, segment) => (lowest(segment) < lowest(best) ? segment : best));
  const max = valued.reduce((best, segment) => (highest(segment) > highest(best) ? segment : best));
  const duration = valued.reduce((total, segment) => total + (segment.to - segment.from), 0);
  const weighted = valued.reduce(
    (total, segment) => total + segment.value * (segment.to - segment.from),
    0,
  );

  return {
    min: { value: lowest(min), time: min.from },
    max: { value: highest(max), time: max.from },
    average: weighted / duration,
  };
};
