export type Rgb = readonly [number, number, number];

export interface PhaseAppearance {
  readonly background: string;
  readonly foreground: string;
  readonly outlined: boolean;
  readonly line: string;
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const SURFACE = { light: '#ffffff', dark: '#1c1c1c' } as const;

const OUTLINE_BELOW = 1.6;

const LINE_BELOW = 3;

export const isHexColor = (value: string): boolean => HEX_COLOR.test(value);

const expandHex = (hex: string): string => {
  const digits = hex.slice(1);

  if (digits.length === 6) return digits;

  return [...digits].map((digit) => digit + digit).join('');
};

export const hexToRgb = (hex: string): Rgb => {
  const digits = expandHex(hex);
  const channel = (offset: number): number => parseInt(digits.slice(offset, offset + 2), 16);

  return [channel(0), channel(2), channel(4)];
};

export const rgbToHex = (rgb: Rgb): string =>
  `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

const linearChannel = (channel: number): number => {
  const value = channel / 255;

  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = (hex: string): number => {
  const [red, green, blue] = hexToRgb(hex).map(linearChannel);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const contrastRatio = (first: string, second: string): number => {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

export const readableTextOn = (background: string): string =>
  contrastRatio(background, '#ffffff') >= contrastRatio(background, '#000000')
    ? '#ffffff'
    : '#000000';

export const phaseAppearance = (color: string, darkMode: boolean): PhaseAppearance => {
  const contrast = contrastRatio(color, darkMode ? SURFACE.dark : SURFACE.light);

  return {
    background: color,
    foreground: readableTextOn(color),
    outlined: contrast < OUTLINE_BELOW,
    line:
      contrast < LINE_BELOW ? `color-mix(in srgb, ${color} 50%, var(--primary-text-color))` : color,
  };
};
