import { DEFAULT_HOURS, DEFAULT_LABELS, DEFAULT_VOLTAGE, createPhase } from '../config/defaults';
import type {
  PhaseConfig,
  PhasePairCardConfig,
  Range,
  SideEntitiesConfig,
  ViewMode,
  VoltageConfig,
} from '../types/config';

export type SideKey = 'before' | 'after';

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
}

type OptionKey = Exclude<keyof PhasePairCardConfig, 'type' | 'phases'>;

type VoltageKey = keyof VoltageConfig;

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

const assignVoltage = <K extends VoltageKey>(
  target: VoltageConfig,
  key: K,
  value: VoltageConfig[K],
): void => {
  if (target[key] === undefined && sameValue(value, DEFAULT_VOLTAGE[key])) return;

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
  };
};

const toVoltageConfig = (
  current: VoltageConfig | undefined,
  fields: SettingsFields,
): VoltageConfig => {
  const voltage: VoltageConfig = { ...current };

  assignVoltage(voltage, 'nominal', fields.nominal ?? DEFAULT_VOLTAGE.nominal);
  assignVoltage(
    voltage,
    'normal',
    pair(fields.normal_min, fields.normal_max, DEFAULT_VOLTAGE.normal),
  );
  assignVoltage(
    voltage,
    'critical',
    pair(fields.critical_min, fields.critical_max, DEFAULT_VOLTAGE.critical),
  );
  assignVoltage(voltage, 'scale', pair(fields.scale_min, fields.scale_max, DEFAULT_VOLTAGE.scale));

  return voltage;
};

export const applySettingsFields = (
  config: PhasePairCardConfig,
  fields: SettingsFields,
): PhasePairCardConfig => {
  const next: PhasePairCardConfig = { ...config };
  const voltage = toVoltageConfig(config.voltage, fields);

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

export const cleanSide = (side: SideEntitiesConfig): SideEntitiesConfig => ({
  ...(side.voltage ? { voltage: side.voltage } : {}),
  ...(side.power ? { power: side.power } : {}),
});

export const updateSide = (
  config: PhasePairCardConfig,
  index: number,
  side: SideKey,
  entities: SideEntitiesConfig,
): PhasePairCardConfig => {
  const cleaned = cleanSide(entities);

  return updatePhase(config, index, side === 'before' ? { before: cleaned } : { after: cleaned });
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
