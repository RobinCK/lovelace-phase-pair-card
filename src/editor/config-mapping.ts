import {
  DEFAULT_HOURS,
  DEFAULT_IMBALANCE,
  DEFAULT_LABELS,
  DEFAULT_SIDE,
  DEFAULT_VOLTAGE,
  createPhase,
} from '../config/defaults';
import type { Quantity } from '../ha/readings';
import type {
  ImbalanceConfig,
  PhaseConfig,
  PhasePairCardConfig,
  Range,
  SideEntitiesConfig,
  SideKey,
  ViewMode,
  VoltageConfig,
} from '../types/config';

export interface SettingsFields {
  readonly title?: string;
  readonly before_label?: string;
  readonly after_label?: string;
  readonly show_power?: boolean;
  readonly show_delta?: boolean;
  readonly show_imbalance?: boolean;
  readonly show_before?: boolean;
  readonly highlight_night?: boolean;
  readonly hours_to_show?: number;
  readonly nominal?: number;
  readonly normal_min?: number;
  readonly normal_max?: number;
  readonly critical_min?: number;
  readonly critical_max?: number;
  readonly scale_min?: number;
  readonly scale_max?: number;
  readonly side?: SideKey;
  readonly imbalance_warning?: number;
  readonly imbalance_critical?: number;
}

type OptionKey = Exclude<keyof PhasePairCardConfig, 'type' | 'phases'>;

const sameValue = (first: unknown, second: unknown): boolean =>
  JSON.stringify(first) === JSON.stringify(second);

const blankToUndefined = (value: string | undefined): string | undefined =>
  value === undefined || value.trim() === '' ? undefined : value;

const assignOption = <K extends OptionKey>(
  target: PhasePairCardConfig,
  key: K,
  value: PhasePairCardConfig[K],
  fallback: PhasePairCardConfig[K],
): void => {
  const omit = value === undefined || (target[key] === undefined && sameValue(value, fallback));

  if (omit) {
    delete target[key];

    return;
  }

  target[key] = value;
};

const assignNested = <T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K],
  fallback: T[K],
): void => {
  if (target[key] === undefined && sameValue(value, fallback)) return;

  target[key] = value;
};

const pair = (min: number | undefined, max: number | undefined, fallback: Range): Range => [
  min ?? fallback[0],
  max ?? fallback[1],
];

export const phasesOf = (config: PhasePairCardConfig): PhaseConfig[] =>
  Array.isArray(config.phases) ? config.phases : [];

export const viewOf = (config: PhasePairCardConfig): ViewMode => config.view ?? 'all';

export const toSettingsFields = (config: PhasePairCardConfig): SettingsFields => {
  const voltage = config.voltage ?? {};
  const normal = voltage.normal ?? DEFAULT_VOLTAGE.normal;
  const critical = voltage.critical ?? DEFAULT_VOLTAGE.critical;
  const scale = voltage.scale ?? DEFAULT_VOLTAGE.scale;

  return {
    title: config.title ?? '',
    before_label: config.before_label ?? DEFAULT_LABELS.before,
    after_label: config.after_label ?? DEFAULT_LABELS.after,
    show_power: config.show_power ?? true,
    show_delta: config.show_delta ?? true,
    show_imbalance: config.show_imbalance ?? true,
    show_before: config.show_before ?? true,
    highlight_night: config.highlight_night ?? true,
    hours_to_show: config.hours_to_show ?? DEFAULT_HOURS,
    nominal: voltage.nominal ?? DEFAULT_VOLTAGE.nominal,
    normal_min: normal[0],
    normal_max: normal[1],
    critical_min: critical[0],
    critical_max: critical[1],
    scale_min: scale[0],
    scale_max: scale[1],
    side: config.side ?? DEFAULT_SIDE,
    imbalance_warning: config.imbalance?.warning ?? DEFAULT_IMBALANCE.warning,
    imbalance_critical: config.imbalance?.critical ?? DEFAULT_IMBALANCE.critical,
  };
};

const toVoltageConfig = (
  current: VoltageConfig | undefined,
  fields: SettingsFields,
): VoltageConfig => {
  const voltage: VoltageConfig = { ...current };

  assignNested(
    voltage,
    'nominal',
    fields.nominal ?? DEFAULT_VOLTAGE.nominal,
    DEFAULT_VOLTAGE.nominal,
  );
  assignNested(
    voltage,
    'normal',
    pair(fields.normal_min, fields.normal_max, DEFAULT_VOLTAGE.normal),
    DEFAULT_VOLTAGE.normal,
  );
  assignNested(
    voltage,
    'critical',
    pair(fields.critical_min, fields.critical_max, DEFAULT_VOLTAGE.critical),
    DEFAULT_VOLTAGE.critical,
  );
  assignNested(
    voltage,
    'scale',
    pair(fields.scale_min, fields.scale_max, DEFAULT_VOLTAGE.scale),
    DEFAULT_VOLTAGE.scale,
  );

  return voltage;
};

const toImbalanceConfig = (
  current: ImbalanceConfig | undefined,
  fields: SettingsFields,
): ImbalanceConfig => {
  const imbalance: ImbalanceConfig = { ...current };

  assignNested(
    imbalance,
    'warning',
    fields.imbalance_warning ?? DEFAULT_IMBALANCE.warning,
    DEFAULT_IMBALANCE.warning,
  );
  assignNested(
    imbalance,
    'critical',
    fields.imbalance_critical ?? DEFAULT_IMBALANCE.critical,
    DEFAULT_IMBALANCE.critical,
  );

  return imbalance;
};

export const applySettingsFields = (
  config: PhasePairCardConfig,
  fields: SettingsFields,
): PhasePairCardConfig => {
  const next: PhasePairCardConfig = { ...config };
  const voltage = toVoltageConfig(config.voltage, fields);
  const imbalance = toImbalanceConfig(config.imbalance, fields);

  assignOption(next, 'title', blankToUndefined(fields.title), undefined);
  assignOption(next, 'before_label', blankToUndefined(fields.before_label), DEFAULT_LABELS.before);
  assignOption(next, 'after_label', blankToUndefined(fields.after_label), DEFAULT_LABELS.after);
  assignOption(next, 'show_power', fields.show_power, true);
  assignOption(next, 'show_delta', fields.show_delta, true);
  assignOption(next, 'show_imbalance', fields.show_imbalance, true);
  assignOption(next, 'show_before', fields.show_before, true);
  assignOption(next, 'highlight_night', fields.highlight_night, true);
  assignOption(next, 'hours_to_show', fields.hours_to_show, DEFAULT_HOURS);
  assignOption(next, 'voltage', Object.keys(voltage).length > 0 ? voltage : undefined, undefined);
  assignOption(next, 'side', fields.side, DEFAULT_SIDE);
  assignOption(
    next,
    'imbalance',
    Object.keys(imbalance).length > 0 ? imbalance : undefined,
    undefined,
  );

  return next;
};

export const withView = (config: PhasePairCardConfig, view: ViewMode): PhasePairCardConfig => {
  const next: PhasePairCardConfig = { ...config, view };

  if (view === 'all') delete next.view;

  return next;
};

export const updatePhase = (
  config: PhasePairCardConfig,
  index: number,
  patch: Partial<PhaseConfig>,
): PhasePairCardConfig => ({
  ...config,
  phases: phasesOf(config).map((phase, position) =>
    position === index ? { ...phase, ...patch } : phase,
  ),
});

export const cleanSide = (side: SideEntitiesConfig): SideEntitiesConfig =>
  Object.fromEntries(Object.entries(side).filter(([, entityId]) => Boolean(entityId)));

export const updateSensor = (
  config: PhasePairCardConfig,
  index: number,
  side: SideKey,
  quantity: Quantity,
  entityId: string | undefined,
): PhasePairCardConfig => {
  const entities = cleanSide({ ...phasesOf(config)[index]?.[side], [quantity]: entityId });

  return updatePhase(config, index, side === 'before' ? { before: entities } : { after: entities });
};

export const addPhase = (config: PhasePairCardConfig): PhasePairCardConfig => {
  const phases = phasesOf(config);

  return { ...config, phases: [...phases, createPhase(phases.length)] };
};

export const removePhase = (config: PhasePairCardConfig, index: number): PhasePairCardConfig => ({
  ...config,
  phases: phasesOf(config).filter((_, position) => position !== index),
});

export const sensorCount = (phase: PhaseConfig): number =>
  [phase.before?.voltage, phase.before?.power, phase.after?.voltage, phase.after?.power].filter(
    Boolean,
  ).length;
