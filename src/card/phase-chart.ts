import { LitElement, css, html, nothing, svg } from 'lit';
import type { PropertyDeclarations, SVGTemplateResult, TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import {
  areaPath,
  bucketAt,
  bucketTime,
  bucketX,
  linePath,
  nightSpans,
  timeX,
  toY,
  valueDomain,
} from '../logic/chart';
import type { ChartFrame, TimeSpan } from '../logic/chart';
import { DASH, formatTime, formatVoltage, DEFAULT_FORMAT_LOCALE } from '../logic/format';
import type { FormatLocale } from '../logic/format';
import { isWithin, voltageStatus } from '../logic/thresholds';
import { DEFAULT_LABELS, DEFAULT_VOLTAGE } from '../config/defaults';
import type { SideLabels, VoltageThresholds } from '../types/config';

const HEIGHT = 90;

const TOP = 8;

const LABEL_HEIGHT = 14;

const TOOLTIP_EDGE = 72;

const HOUR = 3_600_000;

type Series = readonly (number | null)[];

type SideKey = 'before' | 'after';

const numbers = (series: Series): number[] =>
  series.filter((value): value is number => value !== null);

export class PhasePairChart extends LitElement {
  static override properties: PropertyDeclarations = {
    afterValues: { attribute: false },
    beforeValues: { attribute: false },
    span: { attribute: false },
    thresholds: { attribute: false },
    labels: { attribute: false },
    locale: { attribute: false },
    phaseName: { attribute: false },
    showBefore: { attribute: false },
    highlightNight: { attribute: false },
    withDate: { attribute: false },
    _width: { state: true },
    _hover: { state: true },
  };

  declare afterValues: Series;
  declare beforeValues: Series;
  declare span: TimeSpan;
  declare thresholds: VoltageThresholds;
  declare labels: SideLabels;
  declare locale: FormatLocale;
  declare phaseName: string;
  declare showBefore: boolean;
  declare highlightNight: boolean;
  declare withDate: boolean;
  declare _width: number;
  declare _hover: number | undefined;

  private _observer: ResizeObserver | undefined;

  private _pointerType = 'mouse';

  constructor() {
    super();
    this.afterValues = [];
    this.beforeValues = [];
    this.span = [0, 0];
    this.thresholds = DEFAULT_VOLTAGE;
    this.labels = DEFAULT_LABELS;
    this.locale = DEFAULT_FORMAT_LOCALE;
    this.phaseName = '';
    this.showBefore = true;
    this.highlightNight = true;
    this.withDate = false;
    this._width = 0;
    this._hover = undefined;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._observer = new ResizeObserver((entries) => {
      this._width = Math.floor(entries[0].contentRect.width);
    });
    this._observer.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    this._observer = undefined;
  }

  protected override render(): TemplateResult {
    const width = this._width;

    if (width <= 0) return html`<div class="chart"></div>`;

    const frame: ChartFrame = {
      width,
      height: HEIGHT,
      top: TOP,
      domain: valueDomain(this._visibleValues(), this.thresholds.normal),
    };
    const nights = this.highlightNight ? nightSpans(this.span) : [];

    return html`<div
      class="chart"
      role="img"
      aria-label=${this._label()}
      @pointerdown=${this._onPointer}
      @pointermove=${this._onPointer}
      @pointerleave=${this._onLeave}
      @click=${this._onClick}
    >
      <svg width=${width} height=${HEIGHT} aria-hidden="true">
        ${nights.map(
          ([from, to]) =>
            svg`<rect class="night" x=${timeX(from, this.span, width)} y="0" width=${timeX(to, this.span, width) - timeX(from, this.span, width)} height=${HEIGHT}></rect>`,
        )}
        ${this._renderThresholds(frame)}
        <path class="area" d=${areaPath(this.afterValues, frame)}></path>
        ${
          this.showBefore
            ? svg`<path class="line line-before" d=${linePath(this.beforeValues, frame)}></path>`
            : nothing
        }
        <path class="line line-after" d=${linePath(this.afterValues, frame)}></path>
        ${this._renderCursor(frame)}
      </svg>
      ${this.thresholds.normal.map(
        (value) =>
          html`<span
            class="threshold-label"
            style=${styleMap({ top: `${this._labelTop(frame, value)}px` })}
            >${value}</span
          >`,
      )}
      ${nights.length > 0 ? html`<span class="night-pill">Night</span>` : nothing}
      ${this._renderTooltip(frame)}
    </div>`;
  }

  private _renderThresholds(frame: ChartFrame): SVGTemplateResult {
    const [low, high] = this.thresholds.normal;
    const critical = this.thresholds.critical.filter((value) => isWithin(value, frame.domain));
    const line = (value: number, className: string): SVGTemplateResult =>
      svg`<line class=${className} x1="0" x2=${frame.width} y1=${toY(frame, value)} y2=${toY(frame, value)}></line>`;

    return svg`<rect class="band" x="0" y=${toY(frame, high)} width=${frame.width} height=${toY(frame, low) - toY(frame, high)}></rect>
      ${line(high, 'normal-line')} ${line(low, 'normal-line')}
      ${critical.map((value) => line(value, 'critical-line'))}`;
  }

  private _renderCursor(frame: ChartFrame): SVGTemplateResult | typeof nothing {
    const index = this._hover;
    const count = this._count();

    if (index === undefined || count === 0) return nothing;

    const x = bucketX(index, count, frame.width);
    const after = this.afterValues.at(index) ?? null;
    const before = this.showBefore ? (this.beforeValues.at(index) ?? null) : null;

    return svg`<line class="cursor" x1=${x} x2=${x} y1="0" y2=${HEIGHT}></line>
      ${before === null ? nothing : svg`<circle class="cursor-dot cursor-dot-before" cx=${x} cy=${toY(frame, before)} r="3"></circle>`}
      ${after === null ? nothing : svg`<circle class="cursor-dot cursor-dot-after" cx=${x} cy=${toY(frame, after)} r="3.5"></circle>`}`;
  }

  private _renderTooltip(frame: ChartFrame): TemplateResult | typeof nothing {
    const index = this._hover;
    const count = this._count();

    if (index === undefined || count === 0) return nothing;

    const x = bucketX(index, count, frame.width);
    const time = formatTime(bucketTime(index, count, this.span), this.locale, this.withDate);
    const position = this._tooltipPosition(x, frame.width);

    return html`<div class="tooltip" style=${styleMap(position)}>
      <div class="tooltip-time">${time}</div>
      ${this._tooltipRow('after', this.afterValues.at(index) ?? null)}
      ${this.showBefore ? this._tooltipRow('before', this.beforeValues.at(index) ?? null) : nothing}
    </div>`;
  }

  private _tooltipRow(side: SideKey, value: number | null): TemplateResult {
    const tone = value === null ? 'muted' : voltageStatus(value, this.thresholds);
    const text = value === null ? DASH : `${formatVoltage(value, this.locale)} V`;

    return html`<div class="tooltip-row">
      <span class="swatch swatch-${side}" aria-hidden="true"></span>
      <span class="tooltip-label">${this.labels[side]}</span>
      <span class="tooltip-value tone-${tone}">${text}</span>
    </div>`;
  }

  private _tooltipPosition(x: number, width: number): Record<string, string> {
    if (x < TOOLTIP_EDGE) return { left: '4px' };
    if (x > width - TOOLTIP_EDGE) return { right: '4px' };

    return { left: `${x}px`, transform: 'translateX(-50%)' };
  }

  private _labelTop(frame: ChartFrame, value: number): number {
    return Math.max(0, Math.min(HEIGHT - LABEL_HEIGHT, toY(frame, value) - LABEL_HEIGHT / 2));
  }

  private _visibleValues(): Series {
    return this.showBefore ? [...this.afterValues, ...this.beforeValues] : this.afterValues;
  }

  private _count(): number {
    return Math.max(this.afterValues.length, this.showBefore ? this.beforeValues.length : 0);
  }

  private _label(): string {
    const hours = Math.round((this.span[1] - this.span[0]) / HOUR);
    const range = (side: SideKey, series: Series): string => {
      const values = numbers(series);

      if (values.length === 0) return `${this.labels[side]} ${DASH}`;

      const low = formatVoltage(Math.min(...values), this.locale);
      const high = formatVoltage(Math.max(...values), this.locale);

      return `${this.labels[side]} ${low}–${high} V`;
    };

    const parts = [range('after', this.afterValues)];

    if (this.showBefore) parts.push(range('before', this.beforeValues));

    return `Phase ${this.phaseName}, last ${hours} h: ${parts.join(', ')}`;
  }

  private readonly _onPointer = (event: PointerEvent): void => {
    this._pointerType = event.pointerType;

    const count = this._count();

    if (count === 0) return;

    const bounds = this.getBoundingClientRect();

    this._hover = bucketAt(event.clientX - bounds.left, count, bounds.width);
  };

  private readonly _onLeave = (): void => {
    this._hover = undefined;
  };

  private readonly _onClick = (): void => {
    if (this._pointerType === 'touch') return;

    this.dispatchEvent(new CustomEvent('chart-select', { bubbles: true, composed: true }));
  };

  static override styles = css`
    :host {
      display: block;
      height: ${HEIGHT}px;
      --ppc-threshold-label: color-mix(
        in srgb,
        var(--success-color) 60%,
        var(--primary-text-color)
      );
    }

    .chart {
      position: relative;
      height: ${HEIGHT}px;
      cursor: pointer;
      touch-action: pan-y;
      user-select: none;
      -webkit-user-select: none;
    }

    svg {
      position: absolute;
      top: 0;
      left: 0;
      display: block;
    }

    .night {
      fill: var(--primary-text-color);
      fill-opacity: 0.05;
    }

    .band {
      fill: var(--success-color);
      fill-opacity: 0.08;
    }

    .normal-line {
      stroke: var(--success-color);
      stroke-opacity: 0.45;
      stroke-dasharray: 3 4;
    }

    .critical-line {
      stroke: var(--error-color);
      stroke-opacity: 0.55;
      stroke-dasharray: 6 4;
    }

    .area {
      fill: var(--ppc-line, var(--primary-text-color));
      fill-opacity: 0.12;
    }

    .line {
      fill: none;
      stroke: var(--ppc-line, var(--primary-text-color));
      stroke-linejoin: round;
    }

    .line-before {
      stroke-opacity: 0.45;
      stroke-width: 1.2;
    }

    .line-after {
      stroke-width: 1.8;
    }

    .cursor {
      stroke: var(--secondary-text-color);
      stroke-opacity: 0.6;
      stroke-width: 1;
    }

    .cursor-dot-after {
      fill: var(--ppc-line, var(--primary-text-color));
      stroke: var(--ppc-card);
      stroke-width: 2;
    }

    .cursor-dot-before {
      fill: var(--ppc-card);
      stroke: var(--ppc-line, var(--primary-text-color));
      stroke-width: 1.5;
    }

    .threshold-label {
      position: absolute;
      right: 6px;
      padding: 0 4px;
      border-radius: 4px;
      background: var(--ppc-card);
      font-size: 10px;
      line-height: ${LABEL_HEIGHT}px;
      font-variant-numeric: tabular-nums;
      color: var(--ppc-threshold-label);
      pointer-events: none;
    }

    .night-pill {
      position: absolute;
      left: 6px;
      bottom: 6px;
      padding: 0 6px;
      border-radius: 999px;
      background: var(--primary-background-color);
      font-size: 10px;
      line-height: 14px;
      color: var(--secondary-text-color);
      pointer-events: none;
    }

    .tooltip {
      position: absolute;
      top: 4px;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding: 4px 8px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--ppc-card);
      box-shadow: 0 2px 6px color-mix(in srgb, var(--primary-text-color) 18%, transparent);
      font-size: 11px;
      line-height: 15px;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color);
      pointer-events: none;
    }

    .tooltip-time {
      color: var(--secondary-text-color);
    }

    .tooltip-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tooltip-label {
      flex: 1 1 auto;
      color: var(--secondary-text-color);
    }

    .tooltip-value {
      font-weight: 500;
      color: var(--ppc-tone, var(--primary-text-color));
    }

    .swatch {
      flex: none;
      width: 10px;
      border-radius: 2px;
      background: var(--ppc-line, var(--primary-text-color));
    }

    .swatch-after {
      height: 3px;
    }

    .swatch-before {
      height: 2px;
      opacity: 0.45;
    }

    .tone-normal {
      --ppc-tone: var(--ppc-normal);
    }

    .tone-warning {
      --ppc-tone: var(--ppc-warning);
    }

    .tone-critical {
      --ppc-tone: var(--ppc-critical);
    }

    .tone-muted {
      --ppc-tone: var(--secondary-text-color);
    }
  `;
}
