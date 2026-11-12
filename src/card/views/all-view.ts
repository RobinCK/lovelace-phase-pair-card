import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { isValue } from '../../ha/readings';
import type { Reading } from '../../ha/readings';
import { DASH, formatVoltage } from '../../logic/format';
import type { FormatLocale } from '../../logic/format';
import { phaseImbalance } from '../../logic/imbalance';
import { scalePosition } from '../../logic/thresholds';
import type { CardSettings, VoltageThresholds } from '../../types/config';
import type { PhaseModel } from '../model';
import {
  differenceText,
  differenceTitle,
  entityButton,
  phaseBadge,
  powerRow,
  valueContent,
  voltageText,
  voltageTone,
} from './parts';
import type { CardView, ViewContext } from './types';

type SideKey = 'before' | 'after';

const percent = (value: number): string => `${value.toFixed(2)}%`;

const imbalanceText = (
  phases: readonly PhaseModel[],
  side: SideKey,
  locale: FormatLocale,
): string => {
  const voltages = phases
    .map((phase) => phase[side].voltage)
    .filter(isValue)
    .map((reading) => reading.value);
  const spread = phaseImbalance(voltages);

  return spread === undefined ? DASH : `${formatVoltage(spread, locale)} V`;
};

const summaryTile = (side: SideKey, label: string, imbalance: string | undefined): TemplateResult =>
  html`<div class="tile">
    <div class="tile-label">
      <span class="legend-${side}" aria-hidden="true"></span>
      <span class="ellipsis">${label}</span>
    </div>
    ${
      imbalance === undefined
        ? nothing
        : html`<div class="tile-imbalance">
            Imbalance <span class="tile-value">${imbalance}</span>
          </div>`
    }
  </div>`;

const renderSummary = (context: ViewContext): TemplateResult => {
  const { settings, phases, locale } = context;
  const imbalance = (side: SideKey): string | undefined =>
    settings.showImbalance ? imbalanceText(phases, side, locale) : undefined;

  return html`<div class="summary">
    ${summaryTile('before', settings.labels.before, imbalance('before'))}
    ${summaryTile('after', settings.labels.after, imbalance('after'))}
  </div>`;
};

const marker = (
  reading: Reading,
  side: SideKey,
  voltage: VoltageThresholds,
): TemplateResult | typeof nothing => {
  if (reading.status !== 'ok') return nothing;

  return html`<span
    class="marker marker-${side} tone-${voltageTone(reading, voltage)}"
    style=${styleMap({ left: percent(scalePosition(reading.value, voltage.scale)) })}
  ></span>`;
};

const scaleLabel = (phase: PhaseModel, settings: CardSettings, locale: FormatLocale): string => {
  const describe = (reading: Reading, label: string): string =>
    reading.status === 'ok' ? `${label} ${voltageText(reading, locale)} V` : `${label} ${DASH}`;

  return `${phase.name}: ${describe(phase.before.voltage, settings.labels.before)}, ${describe(
    phase.after.voltage,
    settings.labels.after,
  )}`;
};

const renderScale = (
  phase: PhaseModel,
  settings: CardSettings,
  locale: FormatLocale,
): TemplateResult => {
  const { voltage } = settings;
  const bandStart = scalePosition(voltage.normal[0], voltage.scale);
  const bandEnd = scalePosition(voltage.normal[1], voltage.scale);

  return html`<div class="scale" role="img" aria-label=${scaleLabel(phase, settings, locale)}>
    <span class="scale-track"></span>
    <span
      class="scale-band"
      style=${styleMap({ left: percent(bandStart), width: percent(bandEnd - bandStart) })}
    ></span>
    <span
      class="scale-nominal"
      style=${styleMap({ left: percent(scalePosition(voltage.nominal, voltage.scale)) })}
    ></span>
    ${marker(phase.before.voltage, 'before', voltage)}
    ${marker(phase.after.voltage, 'after', voltage)}
  </div>`;
};

const voltageButton = (reading: Reading, sideLabel: string, context: ViewContext): TemplateResult =>
  entityButton({
    reading,
    sideLabel,
    className: `value voltage tone-${voltageTone(reading, context.settings.voltage)}`,
    content: valueContent(voltageText(reading, context.locale), 'V', reading),
    open: context.openMoreInfo,
  });

const renderRow = (phase: PhaseModel, context: ViewContext): TemplateResult => {
  const { settings, locale } = context;
  const { labels } = settings;

  return html`<div class="row">
    ${phaseBadge(phase, 'badge-regular')}
    <div class="row-body">
      <div class="row-values">
        <div class="pair">
          ${voltageButton(phase.before.voltage, labels.before, context)}
          <span class="arrow arrow-large" aria-hidden="true">→</span>
          ${voltageButton(phase.after.voltage, labels.after, context)}
        </div>
        ${
          settings.showDelta
            ? html`<span class="pill" title=${differenceTitle(labels)}
                >${differenceText(phase.before.voltage, phase.after.voltage, 1, 'V', locale)}</span
              >`
            : nothing
        }
      </div>
      ${renderScale(phase, settings, locale)}
      ${
        settings.showPower && phase.hasPower
          ? powerRow({
              phase,
              labels,
              locale,
              iconSize: 14,
              showDelta: false,
              open: context.openMoreInfo,
            })
          : nothing
      }
    </div>
  </div>`;
};

export const allView: CardView = {
  usesHistory: false,
  render: (context) =>
    html`<div class="view view-all">
      ${context.settings.title ? html`<h2 class="title">${context.settings.title}</h2>` : nothing}
      ${renderSummary(context)}
      <div class="rows">${context.phases.map((phase) => renderRow(phase, context))}</div>
    </div>`,
  cardSize: (settings) => (settings.title ? 1 : 0) + 1 + settings.phases.length * 2,
};
