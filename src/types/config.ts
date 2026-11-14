export type ViewMode = 'all' | 'single' | 'balance';

export type SideKey = 'before' | 'after';

export type Range = readonly [number, number];

export interface SideEntitiesConfig {
  voltage?: string;
  power?: string;
  current?: string;
}

export interface PhaseConfig {
  name?: string;
  color?: string;
  before?: SideEntitiesConfig;
  after?: SideEntitiesConfig;
}

export interface VoltageConfig {
  nominal?: number;
  normal?: Range;
  critical?: Range;
  scale?: Range;
}

export interface ImbalanceConfig {
  warning?: number;
  critical?: number;
}

export interface PhasePairCardConfig {
  type: string;
  title?: string;
  view?: ViewMode;
  before_label?: string;
  after_label?: string;
  phases: PhaseConfig[];
  voltage?: VoltageConfig;
  show_power?: boolean;
  show_delta?: boolean;
  show_imbalance?: boolean;
  show_before?: boolean;
  hours_to_show?: number;
  highlight_night?: boolean;
  side?: SideKey;
  imbalance?: ImbalanceConfig;
}

export interface Side {
  readonly voltage: string | undefined;
  readonly power: string | undefined;
  readonly current: string | undefined;
}

export interface Phase {
  readonly name: string;
  readonly color: string;
  readonly before: Side;
  readonly after: Side;
}

export interface VoltageThresholds {
  readonly nominal: number;
  readonly normal: Range;
  readonly critical: Range;
  readonly scale: Range;
}

export interface ImbalanceThresholds {
  readonly warning: number;
  readonly critical: number;
}

export interface SideLabels {
  readonly before: string;
  readonly after: string;
}

export interface CardSettings {
  readonly title: string | undefined;
  readonly view: ViewMode;
  readonly labels: SideLabels;
  readonly phases: readonly Phase[];
  readonly voltage: VoltageThresholds;
  readonly showPower: boolean;
  readonly showDelta: boolean;
  readonly showImbalance: boolean;
  readonly showBefore: boolean;
  readonly hoursToShow: number;
  readonly highlightNight: boolean;
  readonly side: SideKey;
  readonly imbalance: ImbalanceThresholds;
}
