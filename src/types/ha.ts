export interface HassEntityAttributes {
  readonly friendly_name?: string;
  readonly unit_of_measurement?: string;
  readonly device_class?: string;
  readonly [key: string]: unknown;
}

export interface HassEntity {
  readonly entity_id: string;
  readonly state: string;
  readonly attributes: HassEntityAttributes;
  readonly last_changed: string;
  readonly last_updated: string;
}

export type HassEntities = Readonly<Record<string, HassEntity | undefined>>;

export type NumberFormat =
  'language' | 'system' | 'comma_decimal' | 'decimal_comma' | 'space_comma' | 'none';

export type TimeFormat = 'language' | 'system' | '12' | '24';

export interface HassLocale {
  readonly language: string;
  readonly number_format?: NumberFormat;
  readonly time_format?: TimeFormat;
}

export interface HassThemes {
  readonly darkMode?: boolean;
}

export interface HomeAssistant {
  readonly states: HassEntities;
  readonly locale: HassLocale;
  readonly language: string;
  readonly themes?: HassThemes;
  callWS<T>(message: Readonly<Record<string, unknown>>): Promise<T>;
}

export interface LovelaceGridOptions {
  readonly columns?: number | 'full';
  readonly rows?: number | 'auto';
  readonly min_columns?: number;
  readonly max_columns?: number;
  readonly min_rows?: number;
  readonly max_rows?: number;
}

export interface CustomCardEntry {
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly preview?: boolean;
  readonly documentationURL?: string;
}
