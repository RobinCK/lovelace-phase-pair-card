import { isHexColor } from '../logic/color';
import type {
  CardSettings,
  Phase,
  Range,
  Side,
  SideLabels,
  ViewMode,
  VoltageThresholds,
} from '../types/config';
import {
  DEFAULT_HOURS,
  DEFAULT_LABELS,
  DEFAULT_VOLTAGE,
  MAX_HOURS,
  phaseColor,
  phaseName,
} from './defaults';

const ENTITY_ID = /^[a-z0-9_]+\.[a-z0-9_]+$/;

const VIEWS: readonly ViewMode[] = ['all', 'single'];

type UnknownRecord = Readonly<Record<string, unknown>>;

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

const describe = (value: unknown): string => {
  if (typeof value === 'string') return `"${value}"`;
  if (Array.isArray(value)) return `[${value.map(describe).join(', ')}]`;
  if (value === null || value === undefined) return 'an empty value';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return 'an object';
};

const fail = (message: string): never => {
  throw new ConfigError(`${message}.`);
};

const reject = (message: string, actual: unknown): never =>
  fail(`${message} (got ${describe(actual)})`);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBlank = (value: unknown): value is undefined | null | '' =>
  value === undefined || value === null || value === '';

const readText = (
  value: unknown,
  field: string,
  fallback: string | undefined,
): string | undefined => {
  if (isBlank(value)) return fallback;
  if (typeof value !== 'string') return reject(`"${field}" must be text`, value);

  return value;
};

const readBoolean = (value: unknown, field: string, fallback: boolean): boolean => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'boolean') return reject(`"${field}" must be true or false`, value);

  return value;
};

const readNumber = (value: unknown, field: string, fallback: number): number => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return reject(`"${field}" must be a number`, value);
  }

  return value;
};

const readRange = (value: unknown, field: string, fallback: Range): Range => {
  if (value === undefined || value === null) return fallback;

  const isPair =
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((item) => typeof item === 'number' && Number.isFinite(item));

  if (!isPair) return reject(`"${field}" must be two numbers written as [min, max]`, value);

  const [min, max] = value as [number, number];

  if (min >= max) return reject(`"${field}" must list the lower value first`, value);

  return [min, max];
};

const readHours = (value: unknown): number => {
  const hours = readNumber(value, 'hours_to_show', DEFAULT_HOURS);

  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_HOURS) {
    return reject(`"hours_to_show" must be a whole number from 1 to ${MAX_HOURS}`, value);
  }

  return hours;
};

const readView = (value: unknown): ViewMode => {
  if (value === undefined || value === null) return 'all';

  const view = VIEWS.find((candidate) => candidate === value);

  return view ?? reject(`"view" must be ${VIEWS.map((item) => `"${item}"`).join(' or ')}`, value);
};

const readEntity = (value: unknown, phase: string, field: string): string | undefined => {
  if (isBlank(value)) return undefined;
  if (typeof value !== 'string' || !ENTITY_ID.test(value)) {
    return reject(`${phase}: "${field}" must be an entity id such as "sensor.l1_voltage"`, value);
  }

  return value;
};

const readSide = (value: unknown, phase: string, side: 'before' | 'after'): Side => {
  if (value === undefined || value === null) return { voltage: undefined, power: undefined };
  if (!isRecord(value)) {
    return reject(`${phase}: "${side}" must contain "voltage" and/or "power" entities`, value);
  }

  return {
    voltage: readEntity(value.voltage, phase, `${side}.voltage`),
    power: readEntity(value.power, phase, `${side}.power`),
  };
};

const readPhase = (value: unknown, index: number): Phase => {
  const fallbackLabel = `Phase ${index + 1}`;

  if (!isRecord(value)) {
    return reject(`${fallbackLabel} must contain "name", "before" and "after"`, value);
  }

  const name = readText(value.name, `phases[${index}].name`, phaseName(index)) ?? phaseName(index);
  const label = `Phase "${name}"`;
  const color = readText(value.color, `phases[${index}].color`, undefined);

  if (color !== undefined && !isHexColor(color)) {
    return reject(`${label}: "color" must be a hex color such as "#d32f2f"`, color);
  }

  return {
    name,
    color: color ?? phaseColor(index),
    before: readSide(value.before, label, 'before'),
    after: readSide(value.after, label, 'after'),
  };
};

const readPhases = (value: unknown): Phase[] => {
  if (value === undefined || value === null) {
    return fail('Add at least one phase under "phases"');
  }

  if (!Array.isArray(value)) return reject('"phases" must be a list of phases', value);
  if (value.length === 0) return fail('Add at least one phase under "phases"');

  return value.map((phase: unknown, index) => readPhase(phase, index));
};

const ensureInside = (inner: Range, outer: Range, innerField: string, outerField: string): void => {
  if (inner[0] >= outer[0] && inner[1] <= outer[1]) return;

  fail(
    `"${innerField}" must lie within "${outerField}": ${innerField} is [${inner.join(', ')}], ${outerField} is [${outer.join(', ')}]`,
  );
};

const readVoltage = (value: unknown): VoltageThresholds => {
  if (value === undefined || value === null) return DEFAULT_VOLTAGE;
  if (!isRecord(value)) {
    return reject('"voltage" must contain "nominal", "normal", "critical" and/or "scale"', value);
  }

  const thresholds: VoltageThresholds = {
    nominal: readNumber(value.nominal, 'voltage.nominal', DEFAULT_VOLTAGE.nominal),
    normal: readRange(value.normal, 'voltage.normal', DEFAULT_VOLTAGE.normal),
    critical: readRange(value.critical, 'voltage.critical', DEFAULT_VOLTAGE.critical),
    scale: readRange(value.scale, 'voltage.scale', DEFAULT_VOLTAGE.scale),
  };

  ensureInside(thresholds.normal, thresholds.critical, 'voltage.normal', 'voltage.critical');

  return thresholds;
};

const readLabels = (config: UnknownRecord): SideLabels => ({
  before:
    readText(config.before_label, 'before_label', DEFAULT_LABELS.before) ?? DEFAULT_LABELS.before,
  after: readText(config.after_label, 'after_label', DEFAULT_LABELS.after) ?? DEFAULT_LABELS.after,
});

export const normalizeConfig = (config: unknown): CardSettings => {
  if (!isRecord(config)) return reject('The card configuration must be an object', config);

  return {
    title: readText(config.title, 'title', undefined),
    view: readView(config.view),
    labels: readLabels(config),
    phases: readPhases(config.phases),
    voltage: readVoltage(config.voltage),
    showPower: readBoolean(config.show_power, 'show_power', true),
    showDelta: readBoolean(config.show_delta, 'show_delta', true),
    showImbalance: readBoolean(config.show_imbalance, 'show_imbalance', true),
    showBefore: readBoolean(config.show_before, 'show_before', true),
    hoursToShow: readHours(config.hours_to_show),
    highlightNight: readBoolean(config.highlight_night, 'highlight_night', true),
  };
};
