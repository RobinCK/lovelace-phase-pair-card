import type { SideLabels } from '../types/config';

export interface SelectorField {
  readonly name: string;
  readonly selector: Readonly<Record<string, unknown>>;
}

export interface GridField {
  readonly type: 'grid';
  readonly name: '';
  readonly schema: readonly FormField[];
}

export interface ExpandableField {
  readonly type: 'expandable';
  readonly name: '';
  readonly flatten: true;
  readonly title: string;
  readonly icon: string;
  readonly schema: readonly FormField[];
}

export type FormField = SelectorField | GridField | ExpandableField;

export type FieldLabeller = (field: FormField) => string;

const text = (name: string): SelectorField => ({ name, selector: { text: {} } });

const toggle = (name: string): SelectorField => ({ name, selector: { boolean: {} } });

const volts = (name: string): SelectorField => ({
  name,
  selector: { number: { mode: 'box', step: 1, unit_of_measurement: 'V' } },
});

const sensor = (name: string, deviceClass: string): SelectorField => ({
  name,
  selector: { entity: { filter: { domain: 'sensor', device_class: deviceClass } } },
});

const grid = (...schema: FormField[]): GridField => ({ type: 'grid', name: '', schema });

export const GENERAL_SCHEMA: readonly FormField[] = [
  text('title'),
  grid(text('before_label'), text('after_label')),
];

export const ALL_OPTIONS_SCHEMA: readonly FormField[] = [
  toggle('show_power'),
  toggle('show_delta'),
  toggle('show_imbalance'),
  {
    type: 'expandable',
    name: '',
    flatten: true,
    title: 'Voltage thresholds',
    icon: 'mdi:sine-wave',
    schema: [
      grid(volts('nominal')),
      grid(volts('normal_min'), volts('normal_max')),
      grid(volts('critical_min'), volts('critical_max')),
      grid(volts('scale_min'), volts('scale_max')),
    ],
  },
];

export const SINGLE_THRESHOLDS_SCHEMA: readonly FormField[] = [
  grid(volts('critical_min'), volts('critical_max')),
  grid(volts('normal_min'), volts('normal_max')),
  grid(volts('nominal')),
];

export const CHART_SCHEMA: readonly FormField[] = [
  grid({
    name: 'hours_to_show',
    selector: { number: { mode: 'box', min: 1, max: 168, step: 1, unit_of_measurement: 'h' } },
  }),
  toggle('show_before'),
  toggle('show_power'),
  toggle('show_delta'),
  toggle('highlight_night'),
];

export const PHASE_SCHEMA: readonly FormField[] = [
  grid(text('name'), { name: 'color', selector: { color_rgb: {} } }),
];

export const SIDE_SCHEMA: readonly FormField[] = [
  sensor('voltage', 'voltage'),
  sensor('power', 'power'),
];

export const SIDE_GRID_SCHEMA: readonly FormField[] = [grid(...SIDE_SCHEMA)];

const FIELD_LABELS: Readonly<Partial<Record<string, string>>> = {
  title: 'Title',
  before_label: 'Before label',
  after_label: 'After label',
  show_power: 'Show power',
  show_imbalance: 'Show phase imbalance',
  highlight_night: 'Highlight night',
  hours_to_show: 'History',
  nominal: 'Nominal',
  normal_min: 'Normal from',
  normal_max: 'Normal to',
  critical_min: 'Min threshold',
  critical_max: 'Max threshold',
  scale_min: 'Scale from',
  scale_max: 'Scale to',
  name: 'Phase name',
  color: 'Color',
  voltage: 'Voltage sensor',
  power: 'Power sensor',
};

const COMPACT_LABELS: Readonly<Partial<Record<string, string>>> = {
  voltage: 'Voltage',
  power: 'Power',
};

const DYNAMIC_LABELS: Readonly<Partial<Record<string, (labels: SideLabels) => string>>> = {
  show_delta: (labels) => `Show difference (${labels.after} − ${labels.before})`,
  show_before: (labels) => `Show ${labels.before} line`,
};

export const settingsLabeller =
  (labels: SideLabels): FieldLabeller =>
  (field) =>
    DYNAMIC_LABELS[field.name]?.(labels) ?? FIELD_LABELS[field.name] ?? field.name;

export const fieldLabel: FieldLabeller = (field) => FIELD_LABELS[field.name] ?? field.name;

export const compactFieldLabel: FieldLabeller = (field) =>
  COMPACT_LABELS[field.name] ?? fieldLabel(field);
