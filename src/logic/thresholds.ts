import type { Range, VoltageThresholds } from '../types/config';

export type VoltageStatus = 'normal' | 'warning' | 'critical';

export const voltageStatus = (
  value: number,
  thresholds: Pick<VoltageThresholds, 'normal' | 'critical'>,
): VoltageStatus => {
  if (value < thresholds.critical[0] || value > thresholds.critical[1]) return 'critical';
  if (value < thresholds.normal[0] || value > thresholds.normal[1]) return 'warning';

  return 'normal';
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const scalePosition = (value: number, scale: Range): number =>
  clamp(((value - scale[0]) / (scale[1] - scale[0])) * 100, 0, 100);

export const isWithin = (value: number, range: Range): boolean =>
  value > range[0] && value < range[1];
