import type { ImbalanceThresholds } from '../types/config';

export interface Vector {
  readonly x: number;
  readonly y: number;
}

export type ImbalanceStatus = 'normal' | 'warning' | 'critical';

export const PHASE_ANGLES: readonly number[] = [90, -30, 210];

const NICE_STEPS: readonly number[] = [1, 2, 2.5, 5, 10];

const RING_COUNT = 3;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export const fromPolar = (magnitude: number, degrees: number): Vector => ({
  x: magnitude * Math.cos(toRadians(degrees)),
  y: magnitude * Math.sin(toRadians(degrees)),
});

export const vectorLength = (vector: Vector): number => Math.hypot(vector.x, vector.y);

export const phaseAngle = (index: number): number => PHASE_ANGLES[index % PHASE_ANGLES.length];

export const neutralPhasor = (currents: readonly number[]): Vector =>
  currents
    .map((current, index) => fromPolar(current, phaseAngle(index)))
    .reduce((sum, vector) => ({ x: sum.x + vector.x, y: sum.y + vector.y }), { x: 0, y: 0 });

export const neutralCurrent = (currents: readonly number[]): number =>
  vectorLength(neutralPhasor(currents));

export const currentImbalance = (currents: readonly number[]): number | undefined => {
  if (currents.length === 0) return undefined;

  const average = currents.reduce((sum, current) => sum + current, 0) / currents.length;

  if (average <= 0) return undefined;

  const deviation = Math.max(...currents.map((current) => Math.abs(current - average)));

  return (deviation / average) * 100;
};

export const imbalanceStatus = (
  percent: number,
  thresholds: ImbalanceThresholds,
): ImbalanceStatus => {
  if (percent >= thresholds.critical) return 'critical';
  if (percent >= thresholds.warning) return 'warning';

  return 'normal';
};

export const ringStep = (maximum: number): number => {
  const target = (maximum > 0 ? maximum : 1) / RING_COUNT;
  const power = 10 ** Math.floor(Math.log10(target));
  const nearest = NICE_STEPS.reduce((best, step) =>
    Math.abs(Math.log(step * power) - Math.log(target)) <
    Math.abs(Math.log(best * power) - Math.log(target))
      ? step
      : best,
  );

  return Number((nearest * power).toPrecision(12));
};

export const stepDecimals = (step: number): number => {
  const [, fraction = ''] = String(step).split('.');

  return fraction.length;
};
