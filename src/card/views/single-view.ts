import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import type { Reading } from '../../ha/readings';
import type { TimeSpan } from '../../logic/chart';
import { DASH, formatTime, formatVoltage } from '../../logic/format';
import { voltageStatus } from '../../logic/thresholds';
import type { CardSettings, VoltageThresholds } from '../../types/config';
import type { SeriesSnapshot } from '../history-snapshot';
import type { PhaseModel } from '../model';
import {
  ISSUE_TEXT,
  STATUS_TEXT,
  capitalize,
  differenceText,
  differenceTitle,
  entityButton,
  phaseBadge,
  powerRow,
  valueContent,
  voltageText,
  voltageTone,
} from './parts';
import type { Tone } from './parts';
import type { CardView, ViewContext } from './types';

const HOUR = 3_600_000;

const EMPTY: readonly (number | null)[] = [];

interface StatCell {
  readonly name: string;
  readonly caption: string | undefined;
  readonly after: number | undefined;
  readonly before: number | undefined;
  readonly tone: Tone;
}

const statusText = (reading: Reading, voltage: VoltageThresholds): string =>
  reading.status === 'ok'
    ? STATUS_TEXT[voltageStatus(reading.value, voltage)]
    : capitalize(ISSUE_TEXT[reading.status]);

const extremeTone = (value: number | undefined, voltage: VoltageThresholds): Tone => {
  if (value === undefined) return 'plain';

  const status = voltageStatus(value, voltage);

  return status === 'normal' ? 'plain' : status;
};

const seriesOf = (reading: Reading, context: ViewContext): SeriesSnapshot | undefined =>
  reading.entityId ? context.history?.series.get(reading.entityId) : undefined;

const currentSpan = (settings: CardSettings): TimeSpan => {
  const end = Date.now();

  return [end - settings.hoursToShow * HOUR, end];
};

const renderHead = (phase: PhaseModel, context: ViewContext): TemplateResult => {
  const { settings, locale, openMoreInfo } = context;
  const { labels, voltage } = settings;
  const before = phase.before.voltage;
  const after = phase.after.voltage;

  return html`<div class="panel-head">
    <div class="head-main">
      ${phaseBadge(phase, 'badge-small')}
      ${entityButton({
        reading: after,
        sideLabel: labels.after,
        className: 'value voltage-large',
        content: valueContent(voltageText(after, locale), 'V', after),
        open: openMoreInfo,
      })}
      <span class="status-pill">
        <span class="dot tone-${voltageTone(after, voltage)}" aria-hidden="true"></span>
        ${statusText(after, voltage)}
      </span>
    </div>
    ${
      settings.showBefore
        ? html`<div class="head-side">
            ${entityButton({
              reading: before,
              sideLabel: labels.before,
              className: 'value before-value',
              content: html`<span
                  class="dot tone-${voltageTone(before, voltage)}"
                  aria-hidden="true"
                ></span
                >${labels.before}
                ${voltageText(before, locale)}${before.status === 'ok' ? ' V' : ''}`,
              open: openMoreInfo,
            })}
            ${
              settings.showDelta
                ? html`<span class="pill pill-small" title=${differenceTitle(labels)}
                    >${differenceText(before, after, 1, 'V', locale)}</span
                  >`
                : nothing
            }
          </div>`
        : nothing
    }
  </div>`;
};

const renderMeta = (phase: PhaseModel, context: ViewContext): TemplateResult => {
  const { settings, locale, openMoreInfo } = context;
  const { labels } = settings;

  return html`<div class="panel-meta">
    ${
      settings.showPower && phase.hasPower
        ? powerRow({
            phase,
            labels,
            locale,
            iconSize: 13,
            showDelta: settings.showDelta,
            open: openMoreInfo,
          })
        : nothing
    }
    <div class="legend">
      ${
        settings.showBefore
          ? html`<span class="legend-item"
              ><span class="legend-line legend-line-before" aria-hidden="true"></span
              >${labels.before}</span
            >`
          : nothing
      }
      <span class="legend-item"
        ><span class="legend-line legend-line-after" aria-hidden="true"></span>${labels.after}</span
      >
    </div>
  </div>`;
};

const renderStat = (cell: StatCell, context: ViewContext): TemplateResult => {
  const { locale, settings } = context;
  const after = cell.after === undefined ? DASH : `${formatVoltage(cell.after, locale)} V`;
  const before = cell.before === undefined ? DASH : formatVoltage(cell.before, locale);

  return html`<div class="stat">
    <span class="stat-label"
      ><span class="stat-name">${cell.name}</span>${cell.caption ? ` · ${cell.caption}` : ''}</span
    >
    <span class="stat-value"
      ><span class="tone-${cell.tone}">${after}</span>${
        settings.showBefore ? html`<span class="stat-before">/ ${before}</span>` : nothing
      }</span
    >
  </div>`;
};

const renderStats = (
  afterSeries: SeriesSnapshot | undefined,
  beforeSeries: SeriesSnapshot | undefined,
  context: ViewContext,
): TemplateResult => {
  const { settings, locale } = context;
  const after = afterSeries?.summary;
  const before = beforeSeries?.summary;
  const withDate = settings.hoursToShow > 24;
  const time = (value: number | undefined): string | undefined =>
    value === undefined ? undefined : formatTime(value, locale, withDate);
  const cells: StatCell[] = [
    {
      name: 'Min',
      caption: time(after?.min.time),
      after: after?.min.value,
      before: before?.min.value,
      tone: extremeTone(after?.min.value, settings.voltage),
    },
    {
      name: 'Avg',
      caption: `${settings.hoursToShow}h`,
      after: after?.average,
      before: before?.average,
      tone: 'plain',
    },
    {
      name: 'Max',
      caption: time(after?.max.time),
      after: after?.max.value,
      before: before?.max.value,
      tone: extremeTone(after?.max.value, settings.voltage),
    },
  ];

  return html`<div class="stats">${cells.map((cell) => renderStat(cell, context))}</div>`;
};

const renderPanel = (phase: PhaseModel, context: ViewContext): TemplateResult => {
  const { settings, locale, history, openMoreInfo } = context;
  const after = phase.after.voltage;
  const afterSeries = seriesOf(after, context);
  const beforeSeries = settings.showBefore ? seriesOf(phase.before.voltage, context) : undefined;

  return html`<section
    class="panel"
    aria-label="Phase ${phase.name}"
    style=${styleMap({ '--ppc-line': phase.appearance.line })}
  >
    <div class="panel-body">
      ${renderHead(phase, context)} ${renderMeta(phase, context)}
      ${renderStats(afterSeries, beforeSeries, context)}
    </div>
    <phase-pair-chart
      .afterValues=${afterSeries?.values ?? EMPTY}
      .beforeValues=${beforeSeries?.values ?? EMPTY}
      .span=${history?.span ?? currentSpan(settings)}
      .thresholds=${settings.voltage}
      .labels=${settings.labels}
      .locale=${locale}
      .phaseName=${phase.name}
      .showBefore=${settings.showBefore}
      .highlightNight=${settings.highlightNight}
      .withDate=${settings.hoursToShow > 24}
      @chart-select=${() => {
        if (after.entityId) openMoreInfo(after.entityId);
      }}
    ></phase-pair-chart>
  </section>`;
};

export const singleView: CardView = {
  usesHistory: true,
  surface: 'bare',
  render: (context) =>
    html`<div class="view view-single">
      ${context.settings.title ? html`<h2 class="title">${context.settings.title}</h2>` : nothing}
      <div class="panels">${context.phases.map((phase) => renderPanel(phase, context))}</div>
    </div>`,
  cardSize: (settings) => (settings.title ? 1 : 0) + settings.phases.length * 5,
};
