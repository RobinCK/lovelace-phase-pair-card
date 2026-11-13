import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  hexToRgb,
  phaseAppearance,
  readableTextOn,
  rgbToHex,
} from '../src/logic/color';

describe('phaseAppearance', () => {
  it('keeps colors that stand out on the card', () => {
    expect(phaseAppearance('#d32f2f', true).line).toBe('#d32f2f');
    expect(phaseAppearance('#000000', false).line).toBe('#000000');
    expect(phaseAppearance('#f7f7f7', true).line).toBe('#f7f7f7');
  });

  it('blends colors that disappear on the card with the text color', () => {
    expect(phaseAppearance('#000000', true).line).toBe(
      'color-mix(in srgb, #000000 50%, var(--primary-text-color))',
    );
    expect(phaseAppearance('#ffffff', false).line).toBe(
      'color-mix(in srgb, #ffffff 50%, var(--primary-text-color))',
    );
  });

  it('gives black and white phases different lines in both themes', () => {
    expect(phaseAppearance('#000000', true).line).not.toBe(phaseAppearance('#f7f7f7', true).line);
    expect(phaseAppearance('#000000', false).line).not.toBe(phaseAppearance('#f7f7f7', false).line);
  });

  it('outlines badges that blend into the card', () => {
    expect(phaseAppearance('#ffffff', false).outlined).toBe(true);
    expect(phaseAppearance('#000000', true).outlined).toBe(true);
    expect(phaseAppearance('#d32f2f', true).outlined).toBe(false);
  });
});

describe('color helpers', () => {
  it('converts between hex and rgb', () => {
    expect(hexToRgb('#d32f2f')).toEqual([211, 47, 47]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(rgbToHex([211, 47, 47])).toBe('#d32f2f');
  });

  it('picks readable badge text', () => {
    expect(readableTextOn('#000000')).toBe('#ffffff');
    expect(readableTextOn('#f7f7f7')).toBe('#000000');
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });
});
