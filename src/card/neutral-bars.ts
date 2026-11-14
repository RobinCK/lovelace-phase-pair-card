import { LitElement, css, html, nothing } from 'lit';
import type { PropertyDeclarations, TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { bucketAt, bucketTime } from '../logic/chart';
import type { TimeSpan } from '../logic/chart';
import { DASH, DEFAULT_FORMAT_LOCALE, formatHour, formatNumber, formatTime } from '../logic/format';
import type { FormatLocale } from '../logic/format';

const HEIGHT = 36;

const TICKS: readonly number[] = [0, 0.25, 0.5, 0.75];

type Series = readonly (number | null)[];

interface Peak {
  readonly index: number;
  readonly value: number;
}

const peakOf = (values: Series): Peak | undefined =>
  values.reduce<Peak | undefined>((peak, value, index) => {
    if (value === null || (peak && peak.value >= value)) return peak;

    return { index, value };
  }, undefined);

export class PhasePairBars extends LitElement {
  static override properties: PropertyDeclarations = {
    values: { attribute: false },
    span: { attribute: false },
    locale: { attribute: false },
    caption: { attribute: false },
    unit: { attribute: false },
    withDate: { attribute: false },
    _hover: { state: true },
  };

  declare values: Series;
  declare span: TimeSpan;
  declare locale: FormatLocale;
  declare caption: string;
  declare unit: string;
  declare withDate: boolean;
  declare _hover: number | undefined;

  constructor() {
    super();
    this.values = [];
    this.span = [0, 0];
    this.locale = DEFAULT_FORMAT_LOCALE;
    this.caption = '';
    this.unit = '';
    this.withDate = false;
    this._hover = undefined;
  }

  protected override render(): TemplateResult {
    const peak = peakOf(this.values);

    return html`<div class="head">
        <span>${this.caption}</span>
        ${this._renderSummary(peak)}
      </div>
      <div
        class="bars"
        role="img"
        aria-label=${this._label(peak)}
        @pointerdown=${this._onPointer}
        @pointermove=${this._onPointer}
        @pointerleave=${this._onLeave}
      >
        ${this.values.map((value, index) => this._renderBar(value, index, peak))}
      </div>
      <div class="axis">
        ${TICKS.map(
          (fraction) =>
            html`<span class="tick" style=${styleMap({ left: `${fraction * 100}%` })}
              >${formatHour(this.span[0] + fraction * (this.span[1] - this.span[0]), this.locale)}</span
            >`,
        )}
        <span class="tick tick-now">now</span>
      </div>`;
  }

  private _renderSummary(peak: Peak | undefined): TemplateResult | typeof nothing {
    const index = this._hover;

    if (index !== undefined) return this._renderBucket(index);
    if (!peak) return nothing;

    return html`<span
      >max <span class="mono strong">${this._valueText(peak.value)}</span> at
      <span class="mono">${this._time(peak.index)}</span></span
    >`;
  }

  private _renderBucket(index: number): TemplateResult {
    const step = (this.span[1] - this.span[0]) / this.values.length;
    const start = this.span[0] + index * step;
    const value = this.values[index];

    return html`<span
      ><span class="mono"
        >${formatTime(start, this.locale, this.withDate)}–${formatTime(start + step, this.locale)}</span
      >
      <span class="mono strong">${value === null ? DASH : this._valueText(value)}</span></span
    >`;
  }

  private _renderBar(value: number | null, index: number, peak: Peak | undefined): TemplateResult {
    if (value === null || !peak || peak.value <= 0) {
      return html`<span class="bar"></span>`;
    }

    const ratio = Math.max(0, value) / peak.value;

    const opacity = index === this._hover ? 100 : Math.round(35 + 65 * ratio);

    return html`<span
      class="bar"
      style=${styleMap({
        height: `${Math.max(1, ratio * HEIGHT).toFixed(1)}px`,
        background: `color-mix(in srgb, var(--ppc-neutral) ${opacity}%, transparent)`,
      })}
    ></span>`;
  }

  private _valueText(value: number): string {
    return `${formatNumber(value, 1, this.locale)} ${this.unit}`;
  }

  private _time(index: number): string {
    return formatTime(bucketTime(index, this.values.length, this.span), this.locale, this.withDate);
  }

  private _label(peak: Peak | undefined): string {
    if (!peak) return this.caption;

    return `${this.caption}, max ${this._valueText(peak.value)} at ${this._time(peak.index)}`;
  }

  private readonly _onPointer = (event: PointerEvent): void => {
    const count = this.values.length;

    if (count === 0) return;

    const bounds = this.getBoundingClientRect();

    this._hover = bucketAt(event.clientX - bounds.left, count, bounds.width);
  };

  private readonly _onLeave = (): void => {
    this._hover = undefined;
  };

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11px;
      line-height: 14px;
      color: var(--secondary-text-color);
    }

    .head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      white-space: nowrap;
    }

    .mono {
      font-family: var(--ha-font-family-code, var(--code-font-family, monospace));
    }

    .strong {
      color: var(--primary-text-color);
    }

    .bars {
      position: relative;
      display: flex;
      align-items: flex-end;
      gap: 1px;
      height: ${HEIGHT}px;
      border-bottom: 1px solid color-mix(in srgb, var(--primary-text-color) 22%, transparent);
      cursor: crosshair;
      touch-action: pan-y;
    }

    .bar {
      flex: 1 1 0;
      min-width: 0;
      border-radius: 1px 1px 0 0;
    }

    .axis {
      position: relative;
      height: 12px;
      font-family: var(--ha-font-family-code, var(--code-font-family, monospace));
      font-size: 10px;
      line-height: 12px;
      white-space: nowrap;
    }

    .tick {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
    }

    .tick:first-child {
      transform: none;
    }

    .tick-now {
      right: 0;
      transform: none;
    }
  `;
}
