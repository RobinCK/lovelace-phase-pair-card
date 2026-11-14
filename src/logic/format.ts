import type { HassLocale } from '../types/ha';

export interface FormatLocale {
  readonly numberLocale: string | readonly string[] | undefined;
  readonly useGrouping: boolean;
  readonly timeLocale: string | undefined;
  readonly hour12: boolean | undefined;
}

export interface FormattedPower {
  readonly text: string;
  readonly unit: 'W' | 'kW';
}

export const DASH = '—';

export const MINUS = '−';

export const DEFAULT_FORMAT_LOCALE: FormatLocale = {
  numberLocale: 'en-US',
  useGrouping: true,
  timeLocale: 'en-GB',
  hour12: false,
};

const resolveNumberLocale = (locale: HassLocale): string | readonly string[] | undefined => {
  switch (locale.number_format) {
    case 'comma_decimal':
      return ['en-US', 'en'];
    case 'decimal_comma':
      return ['de', 'es', 'it'];
    case 'space_comma':
      return ['fr', 'sv', 'cs'];
    case 'system':
      return undefined;
    default:
      return locale.language;
  }
};

const resolveHour12 = (locale: HassLocale): boolean | undefined => {
  if (locale.time_format === '12') return true;
  if (locale.time_format === '24') return false;

  return undefined;
};

export const toFormatLocale = (locale: HassLocale | undefined): FormatLocale => {
  if (!locale) return DEFAULT_FORMAT_LOCALE;

  return {
    numberLocale: resolveNumberLocale(locale),
    useGrouping: locale.number_format !== 'none',
    timeLocale: locale.time_format === 'system' ? undefined : locale.language,
    hour12: resolveHour12(locale),
  };
};

const numberFormats = new Map<string, Intl.NumberFormat>();

const numberFormat = (digits: number, locale: FormatLocale): Intl.NumberFormat => {
  const key = JSON.stringify([locale.numberLocale, locale.useGrouping, digits]);
  const cached = numberFormats.get(key);

  if (cached) return cached;

  const created = new Intl.NumberFormat(locale.numberLocale as string | string[] | undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: locale.useGrouping,
  });

  numberFormats.set(key, created);

  return created;
};

export const formatNumber = (value: number, digits: number, locale: FormatLocale): string =>
  numberFormat(digits, locale).format(value);

export const formatSigned = (
  value: number,
  digits: number,
  unit: string,
  locale: FormatLocale,
): string => {
  const rounded = Number(value.toFixed(digits));

  if (rounded === 0) return `${formatNumber(0, digits, locale)} ${unit}`;

  const sign = rounded > 0 ? '+' : MINUS;

  return `${sign}${formatNumber(Math.abs(rounded), digits, locale)} ${unit}`;
};

export const formatVoltage = (volts: number, locale: FormatLocale): string =>
  formatNumber(volts, 1, locale);

export const formatPower = (watts: number, locale: FormatLocale): FormattedPower => {
  if (Math.abs(Math.round(watts)) >= 1000) {
    return { text: formatNumber(watts / 1000, 2, locale), unit: 'kW' };
  }

  return { text: formatNumber(Math.round(watts), 0, locale), unit: 'W' };
};

export const formatTime = (timestamp: number, locale: FormatLocale, withDate = false): string =>
  new Intl.DateTimeFormat(locale.timeLocale, {
    ...(withDate ? { day: 'numeric', month: 'short' } : {}),
    hour: 'numeric',
    minute: '2-digit',
    hour12: locale.hour12,
  }).format(timestamp);

export const formatHour = (timestamp: number, locale: FormatLocale): string =>
  new Intl.DateTimeFormat(locale.timeLocale, { hour: '2-digit', hour12: locale.hour12 }).format(
    timestamp,
  );
