export const phaseImbalance = (voltages: readonly number[]): number | undefined => {
  if (voltages.length < 2) return undefined;

  return Math.max(...voltages) - Math.min(...voltages);
};
