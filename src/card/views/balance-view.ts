import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import type { Reading } from '../../ha/readings';
import type { TimeSpan } from '../../logic/chart';
import { DASH, formatNumber } from '../../logic/format';
import type { FormatLocale } from '../../logic/format';
import {
  currentImbalance,
  imbalanceStatus,
  neutralCurrent,
  neutralPhasor,
} from '../../logic/phasor';
import type { CardSettings, SideKey } from '../../types/config';
import { definedIds } from '../model';
import type { PhaseModel } from '../model';
import { entityButton } from './parts';
import type { Tone } from './parts';
import { phasorDiagram } from './phasor-diagram';
import type { CardView, ViewContext } from './types';

const HOUR = 3_600_000;

const NEUTRAL_BUCKETS = 48;

const DEFAULT_TITLE = 'Phase balance';

const IMBALANCE_HINT = 'Largest deviation of a phase current from the average of the three phases';

const NEUTRAL_HINT = 'Vector sum of the three phase currents, 120° apart';

const knownValue = (reading: Reading): number | undefined =>
  reading.status === 'ok' ? Math.max(0, reading.value) : undefined;

const allKnown = (values: readonly (number | undefined)[]): values is readonly number[] =>
  values.every((value) => value !== undefined);

const currentsOf = (phases: readonly PhaseModel[], side: SideKey): Reading[] =>
  phases.map((phase) => phase[side].current);

const currentText = (value: number | undefined, locale: FormatLocale): string =>
  value === undefined ? DASH : formatNumber(value, 1, locale);

const kilowattText = (reading: Reading, locale: FormatLocale): string =>
  reading.status === 'ok' ? formatNumber(reading.value / 1000, 2, locale) : DASH;

const currentSpan = (settings: CardSettings): TimeSpan => {
  const end = Date.now();

  return [end - settings.hoursToShow * HOUR, end];
};

const neutralSeries = (context: ViewContext, readings: readonly Reading[]): (number | null)[] => {
  const series = readings.map((reading) =>
    reading.entityId ? context.history?.series.get(reading.entityId)?.values : undefined,
  );
  const count = Math.max(0, ...series.map((values) => values?.length ?? 0));

  return Array.from({ length: count }, (_, index) => {
    const currents = series.map((values) => values?.[index] ?? undefined);

    return allKnown(currents) ? neutralCurrent(currents) : null;
  });
};

const renderHead = (context: ViewContext, imbalance: number | undefined): TemplateResult => {
  const { settings, locale } = context;
  const tone: Tone =
    imbalance === undefined ? 'muted' : imbalanceStatus(imbalance, settings.imbalance);

  return html`<div class="balance-head">
    <div class="balance-title">${settings.title ?? DEFAULT_TITLE}</div>
    <span class="imbalance-badge tone-${tone}" title=${IMBALANCE_HINT}>
      <span class="dot" aria-hidden="true"></span>
      Imbalance ${imbalance === undefined ? DASH : `${formatNumber(imbalance, 0, locale)} %`}
    </span>
  </div>`;
};

const renderLoad = (
  phase: PhaseModel,
  current: number | undefined,
  maximum: number,
  showPower: boolean,
  context: ViewContext,
): TemplateResult => {
  const { settings, locale, openMoreInfo } = context;
  const side = phase[settings.side];
  const sideLabel = `${phase.name} · ${settings.labels[settings.side]}`;
  const width = current === undefined || maximum <= 0 ? 0 : (current / maximum) * 100;

  return html`<div class="load-row">
    <span class="load-name">${phase.name}</span>
    <div class="load-track">
      <div
        class=${current !== undefined && current === maximum ? 'load-fill load-fill-max' : 'load-fill'}
        style=${styleMap({ width: `${width.toFixed(1)}%` })}
      ></div>
    </div>
    <span class="load-values">
      ${entityButton({
        reading: side.current,
        sideLabel,
        className: 'value load-value',
        content: currentText(current, locale),
        open: openMoreInfo,
      })}${
        showPower
          ? html` ·
            ${entityButton({
              reading: side.power,
              sideLabel,
              className: 'value load-value',
              content: kilowattText(side.power, locale),
              open: openMoreInfo,
            })}`
          : nothing
      }
    </span>
  </div>`;
};

const renderDetails = (
  context: ViewContext,
  currents: readonly (number | undefined)[],
  neutral: number | undefined,
): TemplateResult => {
  const { settings, phases, locale } = context;
  const maximum = Math.max(0, ...currents.map((value) => value ?? 0));
  const showPower =
    settings.showPower && phases.some((phase) => phase[settings.side].power.entityId);

  return html`<div class="balance-details">
    <div class="neutral" title=${NEUTRAL_HINT}>
      <span class="caption">Neutral current</span>
      <span class="neutral-reading"
        ><span class="neutral-value">${currentText(neutral, locale)}</span>${
          neutral === undefined ? nothing : html`<span class="neutral-unit"> A</span>`
        }</span
      >
      <span class="caption">vector sum of three phases</span>
    </div>
    <div class="loads">
      <div class="loads-head">${showPower ? 'A · kW' : 'A'}</div>
      ${phases.map((phase, index) =>
        renderLoad(phase, currents[index], maximum, showPower, context),
      )}
    </div>
  </div>`;
};

const diagramLabel = (
  phases: readonly PhaseModel[],
  currents: readonly (number | undefined)[],
  neutral: number | undefined,
  locale: FormatLocale,
): string => {
  const parts = phases.map(
    (phase, index) => `${phase.name} ${currentText(currents[index], locale)} A`,
  );

  return `Current phasors: ${parts.join(', ')}, neutral ${currentText(neutral, locale)} A`;
};

const render = (context: ViewContext): TemplateResult => {
  const { settings, phases, locale, history } = context;
  const readings = currentsOf(phases, settings.side);
  const currents = readings.map(knownValue);
  const complete = allKnown(currents);
  const neutral = complete ? neutralCurrent(currents) : undefined;
  const imbalance = complete ? currentImbalance(currents) : undefined;

  return html`<div class="view view-balance">
    ${renderHead(context, imbalance)}
    <div class="balance-body">
      <div class="phasor">
        ${phasorDiagram(
          phases.map((phase, index) => ({ name: phase.name, current: currents[index] })),
          complete ? neutralPhasor(currents) : undefined,
          locale,
          diagramLabel(phases, currents, neutral, locale),
        )}
      </div>
      ${renderDetails(context, currents, neutral)}
    </div>
    <phase-pair-bars
      .values=${neutralSeries(context, readings)}
      .span=${history?.span ?? currentSpan(settings)}
      .locale=${locale}
      .caption=${`Neutral · ${settings.hoursToShow} h`}
      .unit=${'A'}
      .withDate=${settings.hoursToShow > 24}
    ></phase-pair-bars>
  </div>`;
};

export const balanceView: CardView = {
  surface: 'framed',
  history: (settings) => ({
    quantity: 'current',
    entityIds: definedIds(settings.phases.map((phase) => phase[settings.side].current)),
    buckets: NEUTRAL_BUCKETS,
  }),
  render,
  cardSize: () => 7,
};
