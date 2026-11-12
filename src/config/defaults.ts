import { CARD_TYPE } from '../const';
import type {
  PhaseConfig,
  PhasePairCardConfig,
  SideLabels,
  VoltageThresholds,
} from '../types/config';

export const DEFAULT_VOLTAGE: VoltageThresholds = {
  nominal: 230,
  normal: [207, 253],
  critical: [195, 264],
  scale: [160, 280],
};

export const DEFAULT_LABELS: SideLabels = {
  before: 'Before',
  after: 'After',
};

export const DEFAULT_HOURS = 24;

export const MAX_HOURS = 168;

export const PHASE_COLORS: readonly string[] = ['#d32f2f', '#000000', '#ffffff'];

export const phaseColor = (index: number): string => PHASE_COLORS[index % PHASE_COLORS.length];

export const phaseName = (index: number): string => `L${index + 1}`;

export const createPhase = (index: number): PhaseConfig => ({
  name: phaseName(index),
  color: phaseColor(index),
});

export const createStubConfig = (): PhasePairCardConfig => ({
  type: `custom:${CARD_TYPE}`,
  title: 'House phases',
  phases: [0, 1, 2].map(createPhase),
});
