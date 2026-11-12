import { html, nothing, svg } from 'lit';
import type { SVGTemplateResult, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Reading, ReadingIssue } from '../../ha/readings';
import { DASH, formatPower, formatSigned, formatVoltage } from '../../logic/format';
import type { FormatLocale } from '../../logic/format';
import { voltageStatus } from '../../logic/thresholds';
import type { VoltageStatus } from '../../logic/thresholds';
import type { SideLabels, VoltageThresholds } from '../../types/config';
import type { PhaseModel } from '../model';

export type Tone = VoltageStatus | 'plain' | 'muted';

export const ISSUE_TEXT: Readonly<Record<ReadingIssue, string>> = {
  unset: 'not configured',
  missing: 'entity not found',
  unavailable: 'unavailable',
  unknown: 'unknown state',
  invalid: 'not a number',
};

export const STATUS_TEXT: Readonly<Record<VoltageStatus, string>> = {
  normal: 'Normal',
  warning: 'Warning',
  critical: 'Critical',
};

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const voltageTone = (reading: Reading, thresholds: VoltageThresholds): Tone =>
  reading.status === 'ok' ? voltageStatus(reading.value, thresholds) : 'muted';

export const voltageText = (reading: Reading, locale: FormatLocale): string =>
  reading.status === 'ok' ? formatVoltage(reading.value, locale) : DASH;

export const differenceText = (
  before: Reading,
  after: Reading,
  digits: number,
  unit: string,
  locale: FormatLocale,
): string => {
  if (before.status !== 'ok' || after.status !== 'ok') return DASH;

  return formatSigned(after.value - before.value, digits, unit, locale);
};

export const differenceTitle = (labels: SideLabels): string => `${labels.after} − ${labels.before}`;

export const readingTitle = (reading: Reading, sideLabel: string): string => {
  if (reading.status === 'ok') return `${sideLabel} · ${reading.entityId}`;

  const reason = ISSUE_TEXT[reading.status];

  return reading.entityId
    ? `${sideLabel} · ${reason}: ${reading.entityId}`
    : `${sideLabel} · ${reason}`;
};

export interface EntityButtonOptions {
  readonly reading: Reading;
  readonly sideLabel: string;
  readonly className: string;
  readonly content: TemplateResult | string;
  readonly open: (entityId: string) => void;
}

export const entityButton = (options: EntityButtonOptions): TemplateResult => {
  const { reading, sideLabel, className, content, open } = options;
  const target = reading.status === 'missing' ? undefined : reading.entityId;
  const state = reading.status === 'ok' ? '' : ` issue issue-${reading.status}`;

  return html`<button
    type="button"
    class="${className}${state}"
    title=${readingTitle(reading, sideLabel)}
    ?disabled=${target === undefined}
    @click=${() => {
      if (target) open(target);
    }}
  >
    ${content}
  </button>`;
};

export const phaseBadge = (phase: PhaseModel, className: string): TemplateResult =>
  html`<span
    class=${classMap({ badge: true, [className]: true, outlined: phase.appearance.outlined })}
    style=${styleMap({
      background: phase.appearance.background,
      color: phase.appearance.foreground,
    })}
    >${phase.name}</span
  >`;

export const valueContent = (text: string, unit: string, reading: Reading): TemplateResult =>
  reading.status === 'ok' ? html`${text}<span class="unit">${unit}</span>` : html`${text}`;

export const powerContent = (reading: Reading, locale: FormatLocale): TemplateResult => {
  if (reading.status !== 'ok') return html`${DASH}`;

  const power = formatPower(reading.value, locale);

  return valueContent(power.text, power.unit, reading);
};

export const boltIcon = (size: number): SVGTemplateResult =>
  svg`<svg class="icon" width=${size} height=${size} viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 13h6l-1 9 8-11h-6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path></svg>`;

export interface PowerRowOptions {
  readonly phase: PhaseModel;
  readonly labels: SideLabels;
  readonly locale: FormatLocale;
  readonly iconSize: number;
  readonly showDelta: boolean;
  readonly open: (entityId: string) => void;
}

export const powerRow = (options: PowerRowOptions): TemplateResult => {
  const { phase, labels, locale, iconSize, showDelta, open } = options;

  return html`<div class="power">
    ${boltIcon(iconSize)}
    ${entityButton({
      reading: phase.before.power,
      sideLabel: labels.before,
      className: 'value power-value power-before',
      content: powerContent(phase.before.power, locale),
      open,
    })}
    <span class="arrow" aria-hidden="true">→</span>
    ${entityButton({
      reading: phase.after.power,
      sideLabel: labels.after,
      className: 'value power-value power-after',
      content: powerContent(phase.after.power, locale),
      open,
    })}
    ${
      showDelta
        ? html`<span class="pill pill-small" title=${differenceTitle(labels)}
            >${differenceText(phase.before.power, phase.after.power, 0, 'W', locale)}</span
          >`
        : nothing
    }
  </div>`;
};
