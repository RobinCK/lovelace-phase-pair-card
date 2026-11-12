import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FORMAT_LOCALE,
  MINUS,
  formatNumber,
  formatPower,
  formatSigned,
  formatTime,
  formatVoltage,
  toFormatLocale,
} from '../src/logic/format';

const locale = DEFAULT_FORMAT_LOCALE;

describe('formatVoltage', () => {
  it('uses one decimal', () => {
    expect(formatVoltage(229.84, locale)).toBe('229.8');
    expect(formatVoltage(230, locale)).toBe('230.0');
  });

  it('follows the decimal comma format', () => {
    const decimalComma = toFormatLocale({ language: 'en', number_format: 'decimal_comma' });

    expect(formatVoltage(218.6, decimalComma)).toBe('218,6');
  });
});

describe('formatSigned', () => {
  it('prefixes positive values with a plus', () => {
    expect(formatSigned(11.24, 1, 'V', locale)).toBe('+11.2 V');
  });

  it('prefixes negative values with a minus sign', () => {
    expect(formatSigned(-26.1, 1, 'V', locale)).toBe(`${MINUS}26.1 V`);
  });

  it('prints zero without a sign, including values that round to zero', () => {
    expect(formatSigned(0, 1, 'V', locale)).toBe('0.0 V');
    expect(formatSigned(-0.04, 1, 'V', locale)).toBe('0.0 V');
    expect(formatSigned(0.4, 0, 'W', locale)).toBe('0 W');
  });

  it('formats whole watts', () => {
    expect(formatSigned(-130, 0, 'W', locale)).toBe(`${MINUS}130 W`);
    expect(formatSigned(1500, 0, 'W', locale)).toBe('+1,500 W');
  });
});

describe('formatPower', () => {
  it('keeps watts below one kilowatt', () => {
    expect(formatPower(640, locale)).toEqual({ text: '640', unit: 'W' });
    expect(formatPower(999.4, locale)).toEqual({ text: '999', unit: 'W' });
  });

  it('switches to kilowatts from 1000 W', () => {
    expect(formatPower(999.6, locale)).toEqual({ text: '1.00', unit: 'kW' });
    expect(formatPower(2840, locale)).toEqual({ text: '2.84', unit: 'kW' });
  });

  it('handles exported (negative) power', () => {
    expect(formatPower(-1250, locale)).toEqual({ text: '-1.25', unit: 'kW' });
  });
});

describe('toFormatLocale', () => {
  it('maps Home Assistant number formats', () => {
    expect(toFormatLocale({ language: 'uk', number_format: 'language' }).numberLocale).toBe('uk');
    expect(
      toFormatLocale({ language: 'uk', number_format: 'system' }).numberLocale,
    ).toBeUndefined();
    expect(toFormatLocale({ language: 'uk', number_format: 'none' }).useGrouping).toBe(false);
  });

  it('maps Home Assistant time formats', () => {
    expect(toFormatLocale({ language: 'en', time_format: '12' }).hour12).toBe(true);
    expect(toFormatLocale({ language: 'en', time_format: '24' }).hour12).toBe(false);
    expect(toFormatLocale({ language: 'en', time_format: 'language' }).hour12).toBeUndefined();
  });

  it('falls back to defaults without a locale', () => {
    expect(toFormatLocale(undefined)).toBe(DEFAULT_FORMAT_LOCALE);
  });
});

describe('formatNumber and formatTime', () => {
  it('disables grouping for the "none" format', () => {
    const none = toFormatLocale({ language: 'en', number_format: 'none' });

    expect(formatNumber(12345, 0, none)).toBe('12345');
  });

  it('formats a 24-hour clock time', () => {
    const time = new Date(2026, 0, 15, 19, 45).getTime();

    expect(formatTime(time, locale)).toBe('19:45');
  });
});
