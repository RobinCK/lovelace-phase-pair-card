export interface Sample {
  readonly time: number;
  readonly value: number | null;
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

interface Segment {
  readonly from: number;
  readonly to: number;
  readonly value: number | null;
}

interface ValueSegment extends Segment {
  readonly value: number;
}

const toSegments = (samples: readonly Sample[], start: number, end: number): Segment[] => {
  const sorted = [...samples].sort((a, b) => a.time - b.time);

  return sorted.flatMap((sample, index) => {
    const nextTime = index + 1 < sorted.length ? sorted[index + 1].time : end;
    const from = Math.max(sample.time, start);
    const to = Math.min(nextTime, end);

    return to > from ? [{ from, to, value: sample.value }] : [];
  });
};

const hasValue = (segment: Segment): segment is ValueSegment => segment.value !== null;

export const resample = (
  samples: readonly Sample[],
  start: number,
  end: number,
  buckets: number,
): (number | null)[] => {
  if (buckets < 1 || end <= start) return [];

  const width = (end - start) / buckets;
  const sums = new Array<number>(buckets).fill(0);
  const weights = new Array<number>(buckets).fill(0);

  for (const segment of toSegments(samples, start, end).filter(hasValue)) {
    const first = Math.floor((segment.from - start) / width);
    const last = Math.min(buckets - 1, Math.floor((segment.to - start) / width));

    for (let bucket = first; bucket <= last; bucket += 1) {
      const overlap =
        Math.min(segment.to, start + (bucket + 1) * width) -
        Math.max(segment.from, start + bucket * width);

      if (overlap <= 0) continue;

      sums[bucket] += segment.value * overlap;
      weights[bucket] += overlap;
    }
  }

  return sums.map((sum, bucket) => (weights[bucket] > 0 ? sum / weights[bucket] : null));
};

export const summarize = (
  samples: readonly Sample[],
  start: number,
  end: number,
): Summary | undefined => {
  const segments = toSegments(samples, start, end).filter(hasValue);

  if (segments.length === 0) return undefined;

  const min = segments.reduce((best, segment) => (segment.value < best.value ? segment : best));
  const max = segments.reduce((best, segment) => (segment.value > best.value ? segment : best));
  const duration = segments.reduce((total, segment) => total + (segment.to - segment.from), 0);
  const weighted = segments.reduce(
    (total, segment) => total + segment.value * (segment.to - segment.from),
    0,
  );

  return {
    min: { value: min.value, time: min.from },
    max: { value: max.value, time: max.from },
    average: weighted / duration,
  };
};
